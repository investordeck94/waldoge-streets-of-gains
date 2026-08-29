// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AttestationHelper} from "./helpers/AttestationHelper.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWDOGE is IERC20 {
    function deposit() external payable;
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

/**
 * @notice Phase 2E pre-deployment rehearsal against the REAL DogeOS Chikyu testnet state.
 *
 *   forge test --match-path test/StreetsOfGainsRewards.dogeosFork.t.sol -vv
 *
 * This forks https://rpc.testnet.dogeos.com and runs the full deploy -> fund ->
 * submitRun -> claimReward flow plus the Phase 2E negative matrix against the real
 * WDOGE token at 0xF6BD...78aE. Nothing is broadcast: no transaction is sent, no key
 * is used, no value moves on the live chain. It exists to prove that the real token's
 * behaviour (18 decimals, no fee-on-transfer, no rebasing, no transfer restrictions)
 * is compatible with the contract BEFORE anything is deployed for real.
 *
 * Skips cleanly when the RPC is unreachable so CI without network egress still passes.
 */
contract StreetsOfGainsRewardsDogeOSForkTest is AttestationHelper {
    address constant WDOGE = 0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE;
    uint256 constant CHAIN_ID = 6281971;
    string constant RPC = "https://rpc.testnet.dogeos.com";

    uint256 constant EPOCH_LENGTH = 1 days;
    uint256 constant MAX_PER_RUN = 10e18;
    uint256 constant MAX_PER_WALLET_EPOCH = 50e18;
    uint256 constant MAX_POOL_EPOCH = 1_000e18;

    StreetsOfGainsRewards internal rewards;
    IWDOGE internal wdoge;

    address internal owner = address(0xA11CE);
    uint256 internal signerPk = 0xB0B;
    address internal signer;
    address internal playerA = address(0xDA7A);
    address internal playerB = address(0xBEEF);

    bool internal forked;

    function setUp() public {
        try vm.createSelectFork(RPC) {
            forked = true;
        } catch {
            forked = false;
            return;
        }

        require(block.chainid == CHAIN_ID, "forked the wrong chain");
        require(WDOGE.code.length > 0, "WDOGE has no bytecode on this chain");

        signer = vm.addr(signerPk);
        wdoge = IWDOGE(WDOGE);

        rewards = new StreetsOfGainsRewards(
            owner, WDOGE, signer, EPOCH_LENGTH, MAX_PER_RUN, MAX_PER_WALLET_EPOCH, MAX_POOL_EPOCH
        );
    }

    modifier onlyForked() {
        if (!forked) {
            emit log("SKIPPED: DogeOS Chikyu RPC unreachable from this environment");
            return;
        }
        _;
    }

    /// @dev Mint real WDOGE by wrapping native testnet DOGE inside the fork.
    function _fund(address to, uint256 amount) internal {
        vm.deal(address(this), address(this).balance + amount);
        wdoge.deposit{value: amount}();
        wdoge.transfer(to, amount);
    }

    // -----------------------------------------------------------------
    // Token due diligence against the live token
    // -----------------------------------------------------------------

    function test_Fork_WDOGEBehavesAsDocumented() public onlyForked {
        assertEq(wdoge.decimals(), 18, "WDOGE decimals != 18");
        assertEq(keccak256(bytes(wdoge.symbol())), keccak256(bytes("WDOGE")), "unexpected symbol");

        // No fee-on-transfer, no rebasing: the recipient receives exactly the sent amount.
        _fund(playerA, 100e18);
        assertEq(wdoge.balanceOf(playerA), 100e18, "fee-on-transfer detected");

        vm.prank(playerA);
        wdoge.transfer(playerB, 40e18);
        assertEq(wdoge.balanceOf(playerA), 60e18);
        assertEq(wdoge.balanceOf(playerB), 40e18);

        // Balances do not drift with time (no rebasing).
        vm.warp(block.timestamp + 7 days);
        assertEq(wdoge.balanceOf(playerB), 40e18, "balance drifted over time");
    }

    // -----------------------------------------------------------------
    // Deployment configuration rehearsal
    // -----------------------------------------------------------------

    function test_Fork_DeployedConfigurationMatchesIntent() public onlyForked {
        assertEq(address(rewards.rewardToken()), WDOGE);
        assertEq(rewards.owner(), owner);
        assertEq(rewards.signer(), signer);
        assertTrue(rewards.owner() != rewards.signer(), "owner == signer");
        assertEq(rewards.epochLength(), EPOCH_LENGTH);
        assertEq(rewards.maxRewardPerRun(), MAX_PER_RUN);
        assertEq(rewards.maxRewardPerWalletPerEpoch(), MAX_PER_WALLET_EPOCH);
        assertEq(rewards.maxRewardPoolPerEpoch(), MAX_POOL_EPOCH);
        assertFalse(rewards.paused(), "must start unpaused");
        assertEq(rewards.totalEntitled(), 0, "must start with no entitlements");
        assertEq(
            rewards.domainSeparator(),
            _domainSeparatorFor(address(rewards), CHAIN_ID),
            "EIP-712 domain mismatch"
        );
    }

    // -----------------------------------------------------------------
    // Happy path: submit -> accrue -> claim -> wallet receives WDOGE
    // -----------------------------------------------------------------

    function test_Fork_EndToEndSubmitAndClaim() public onlyForked {
        _fund(address(rewards), 500e18);

        uint256 reward = 34e17; // 3.4 WDOGE
        bytes32 runId = keccak256("fork-run-1");
        StreetsOfGainsRewards.RunAttestation memory a = _attFor(rewards, playerA, 88_000, 14, reward, runId);
        bytes memory sig = _signAt(a, address(rewards), signerPk);

        vm.prank(playerA);
        rewards.submitRun(a, sig);

        assertEq(rewards.pendingRewards(playerA), reward, "entitlement not accrued");
        assertEq(rewards.totalEntitled(), reward);
        assertEq(rewards.nonces(playerA), 1, "nonce not advanced");
        assertTrue(rewards.isRunProcessed(playerA, runId));
        assertEq(wdoge.balanceOf(playerA), 0, "submit must not transfer");

        vm.prank(playerA);
        uint256 claimed = rewards.claimReward();

        assertEq(claimed, reward);
        assertEq(wdoge.balanceOf(playerA), reward, "wallet did not receive WDOGE");
        assertEq(rewards.pendingRewards(playerA), 0);
        assertEq(rewards.totalEntitled(), 0);
    }

    // -----------------------------------------------------------------
    // Negative matrix against the live-token fork
    // -----------------------------------------------------------------

    function test_Fork_NegativeMatrix() public onlyForked {
        _fund(address(rewards), 500e18);

        uint256 reward = 2e18;
        bytes32 runId = keccak256("fork-run-neg");
        StreetsOfGainsRewards.RunAttestation memory a = _attFor(rewards, playerA, 50_000, 10, reward, runId);
        bytes memory sig = _signAt(a, address(rewards), signerPk);

        // 4. modified player / 8. wrong wallet submits
        vm.prank(playerB);
        vm.expectRevert(StreetsOfGainsRewards.NotPlayer.selector);
        rewards.submitRun(a, sig);

        // 2. modified reward amount
        StreetsOfGainsRewards.RunAttestation memory tampered = _copy(a);
        tampered.rewardAmount = reward + 1;
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rewards.submitRun(tampered, sig);

        // 3. modified score
        tampered = _copy(a);
        tampered.score = 5_000_000;
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rewards.submitRun(tampered, sig);

        // 5. modified nonce
        tampered = _copy(a);
        tampered.nonce = a.nonce + 1;
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rewards.submitRun(tampered, sig);

        // 6. modified runId
        tampered = _copy(a);
        tampered.runId = keccak256("other");
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rewards.submitRun(tampered, sig);

        // happy submit, then 1. replay of the exact attestation
        vm.prank(playerA);
        rewards.submitRun(a, sig);
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rewards.submitRun(a, sig);

        // 1b. replay with a refreshed nonce still blocked by the player-bound run key
        StreetsOfGainsRewards.RunAttestation memory replay = _copy(a);
        replay.nonce = rewards.nonces(playerA);
        bytes memory replaySig = _signAt(replay, address(rewards), signerPk);
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.RunAlreadyProcessed.selector);
        rewards.submitRun(replay, replaySig);

        // 15. another player cannot grief this runId: same runId works for playerB
        StreetsOfGainsRewards.RunAttestation memory bAtt = _attFor(rewards, playerB, 40_000, 8, 1e18, runId);
        bytes memory bSig = _signAt(bAtt, address(rewards), signerPk);
        vm.prank(playerB);
        rewards.submitRun(bAtt, bSig);
        assertEq(rewards.pendingRewards(playerB), 1e18, "runId griefing detected");

        // 7. expired attestation
        StreetsOfGainsRewards.RunAttestation memory stale =
            _attFor(rewards, playerA, 30_000, 6, 1e18, keccak256("stale"));
        bytes memory staleSig = _signAt(stale, address(rewards), signerPk);
        vm.warp(stale.deadline + 1);
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.AttestationExpired.selector);
        rewards.submitRun(stale, staleSig);

        // 10. claim twice / 11. claim with zero entitlement
        vm.prank(playerA);
        rewards.claimReward();
        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.NothingToClaim.selector);
        rewards.claimReward();
    }

    /// 12. insufficient funding must revert the claim, leaving the entitlement intact.
    function test_Fork_InsufficientFundingBlocksClaimButKeepsEntitlement() public onlyForked {
        _fund(address(rewards), 1e18);

        StreetsOfGainsRewards.RunAttestation memory a =
            _attFor(rewards, playerA, 90_000, 20, 5e18, keccak256("underfunded"));
        bytes memory sig = _signAt(a, address(rewards), signerPk);

        vm.prank(playerA);
        rewards.submitRun(a, sig);

        vm.prank(playerA);
        vm.expectRevert(StreetsOfGainsRewards.InsufficientRewardBalance.selector);
        rewards.claimReward();

        assertEq(rewards.pendingRewards(playerA), 5e18, "entitlement lost on failed claim");
        assertEq(wdoge.balanceOf(playerA), 0, "tokens moved on a failed claim");

        // Topping up lets the same entitlement be claimed later.
        _fund(address(rewards), 10e18);
        vm.prank(playerA);
        rewards.claimReward();
        assertEq(wdoge.balanceOf(playerA), 5e18);
    }

    /// 13/14. pause stops submissions, never claims, and entitlements survive it.
    function test_Fork_PauseBlocksSubmitButNotClaim() public onlyForked {
        _fund(address(rewards), 100e18);

        StreetsOfGainsRewards.RunAttestation memory a =
            _attFor(rewards, playerA, 70_000, 12, 3e18, keccak256("pause-run"));
        bytes memory sig = _signAt(a, address(rewards), signerPk);
        vm.prank(playerA);
        rewards.submitRun(a, sig);

        vm.prank(owner);
        rewards.pause();

        StreetsOfGainsRewards.RunAttestation memory blocked =
            _attFor(rewards, playerB, 20_000, 5, 1e18, keccak256("pause-blocked"));
        bytes memory blockedSig = _signAt(blocked, address(rewards), signerPk);
        vm.prank(playerB);
        vm.expectRevert();
        rewards.submitRun(blocked, blockedSig);

        // Entitlement survives the pause and remains claimable while paused.
        assertEq(rewards.pendingRewards(playerA), 3e18);
        vm.prank(playerA);
        rewards.claimReward();
        assertEq(wdoge.balanceOf(playerA), 3e18, "claims frozen by pause");
    }

    /// Owner recovery must never be able to touch entitled funds.
    function test_Fork_RecoveryCannotTakeEntitledFunds() public onlyForked {
        _fund(address(rewards), 10e18);

        StreetsOfGainsRewards.RunAttestation memory a =
            _attFor(rewards, playerA, 60_000, 11, 4e18, keccak256("recover-run"));
        bytes memory sig = _signAt(a, address(rewards), signerPk);
        vm.prank(playerA);
        rewards.submitRun(a, sig);

        assertEq(rewards.unentitledBalance(), 6e18);
        vm.prank(owner);
        vm.expectRevert();
        rewards.recoverUnentitled(owner, 6e18 + 1);

        vm.prank(owner);
        rewards.recoverUnentitled(owner, 6e18);

        vm.prank(playerA);
        rewards.claimReward();
        assertEq(wdoge.balanceOf(playerA), 4e18, "entitlement not honoured after recovery");
    }

    /// @dev Structs in memory assign by reference; this returns an independent copy.
    function _copy(StreetsOfGainsRewards.RunAttestation memory a)
        internal
        pure
        returns (StreetsOfGainsRewards.RunAttestation memory)
    {
        return StreetsOfGainsRewards.RunAttestation({
            player: a.player,
            score: a.score,
            wave: a.wave,
            level: a.level,
            runId: a.runId,
            nonce: a.nonce,
            deadline: a.deadline,
            rewardAmount: a.rewardAmount
        });
    }

    receive() external payable {}
}
