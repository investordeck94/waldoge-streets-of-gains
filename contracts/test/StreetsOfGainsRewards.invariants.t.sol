// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {AttestationHelper} from "./helpers/AttestationHelper.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/**
 * @notice Stateful handler that drives StreetsOfGainsRewards with valid,
 *         backend-signed attestations, claims, epoch warps, cap changes and
 *         admin recoveries, recording ghost accounting along the way.
 */
contract RewardsHandler is AttestationHelper {
    StreetsOfGainsRewards public rw;
    MockERC20 public token;

    uint256 internal immutable signerPk;
    address public immutable ownerAddr;

    address[5] public players;

    // ---- ghost state ----
    uint256 public ghostAccrued; // sum of every accrued reward
    uint256 public ghostClaimed; // sum of every claimed reward
    uint256 public ghostRecovered; // sum of every recoverUnentitled
    uint256 public ghostFunded; // sum of every token mint into the contract
    mapping(address => uint256) public ghostSubmissions; // successful submits per player
    mapping(address => uint256) public ghostPendingSeen; // last observed pending per player
    bytes32[] public ghostRunKeys;
    uint256[] public ghostEpochs;
    mapping(uint256 => bool) internal epochSeen;
    bool public sawInsolventRecovery;
    uint256 public callsSubmit;
    uint256 public callsClaim;

    constructor(StreetsOfGainsRewards rw_, MockERC20 token_, uint256 signerPk_, address owner_) {
        rw = rw_;
        token = token_;
        signerPk = signerPk_;
        ownerAddr = owner_;
        players = [address(0xA1), address(0xA2), address(0xA3), address(0xA4), address(0xA5)];
    }

    function _player(uint256 seed) internal view returns (address) {
        return players[seed % players.length];
    }

    function _noteEpoch(uint256 e) internal {
        if (!epochSeen[e]) {
            epochSeen[e] = true;
            ghostEpochs.push(e);
        }
    }

    function epochCount() external view returns (uint256) {
        return ghostEpochs.length;
    }

    function runKeyCount() external view returns (uint256) {
        return ghostRunKeys.length;
    }

    function playerCount() external pure returns (uint256) {
        return 5;
    }

    // ------------------------------------------------------------------
    // actions
    // ------------------------------------------------------------------

    function submit(uint256 playerSeed, uint256 rewardSeed, uint256 runSeed, uint256 score) external {
        address p = _player(playerSeed);
        uint256 reward = rewardSeed % (rw.maxRewardPerRun() + 1);
        bytes32 runId = keccak256(abi.encode(runSeed, p, block.timestamp));

        StreetsOfGainsRewards.RunAttestation memory a = StreetsOfGainsRewards.RunAttestation({
            player: p,
            score: score,
            wave: uint32(score % 1000),
            level: 1,
            runId: runId,
            nonce: rw.nonces(p),
            deadline: block.timestamp + 1 hours,
            rewardAmount: reward
        });
        bytes memory sig = _signAt(a, address(rw), signerPk);

        uint256 nonceBefore = rw.nonces(p);
        vm.prank(p);
        try rw.submitRun(a, sig) {
            callsSubmit++;
            ghostAccrued += reward;
            ghostSubmissions[p] += 1;
            ghostRunKeys.push(rw.runKeyOf(p, runId));
            _noteEpoch(rw.currentEpoch());
            require(rw.nonces(p) == nonceBefore + 1, "nonce did not increase by exactly 1");
        } catch {
            require(rw.nonces(p) == nonceBefore, "nonce moved on a failed submission");
        }
    }

    function claim(uint256 playerSeed) external {
        address p = _player(playerSeed);
        uint256 pendingBefore = rw.pendingRewards(p);
        vm.prank(p);
        try rw.claimReward() returns (uint256 amount) {
            callsClaim++;
            ghostClaimed += amount;
            require(amount == pendingBefore, "claim amount != pending");
            require(rw.pendingRewards(p) == 0, "pending not cleared");
        } catch {
            require(rw.pendingRewards(p) == pendingBefore, "pending changed on failed claim");
        }
    }

    function warp(uint256 secs) external {
        vm.warp(block.timestamp + (secs % (3 days)) + 1);
        _noteEpoch(rw.currentEpoch());
    }

    function setLimits(uint256 runSeed, uint256 walletSeed, uint256 poolSeed) external {
        uint256 perRun = (runSeed % 100e18) + 1;
        uint256 perWallet = perRun + (walletSeed % 500e18);
        uint256 pool = perWallet + (poolSeed % 5000e18);
        if (pool > rw.HARD_MAX_REWARD_POOL_EPOCH()) return;
        if (perWallet > rw.HARD_MAX_REWARD_PER_WALLET_EPOCH()) return;
        if (perRun > rw.HARD_MAX_REWARD_PER_RUN()) return;
        vm.prank(ownerAddr);
        rw.setRewardLimits(perRun, perWallet, pool);
    }

    function fund(uint256 amount) external {
        uint256 amt = amount % 10_000e18;
        if (amt == 0) return;
        token.mint(address(rw), amt);
        ghostFunded += amt;
    }

    function recover(uint256 amount) external {
        uint256 free = rw.unentitledBalance();
        if (free == 0) return;
        uint256 amt = (amount % free) + 1;
        bool solventBefore = token.balanceOf(address(rw)) >= rw.totalEntitled();
        vm.prank(ownerAddr);
        try rw.recoverUnentitled(ownerAddr, amt) {
            ghostRecovered += amt;
            if (solventBefore) {
                require(
                    token.balanceOf(address(rw)) >= rw.totalEntitled(),
                    "recovery broke solvency"
                );
            } else {
                sawInsolventRecovery = true;
            }
        } catch {}
    }

    function pauseToggle(uint256 seed) external {
        if (seed % 2 == 0) {
            if (rw.paused()) return;
            vm.prank(ownerAddr);
            rw.pause();
        } else {
            if (!rw.paused()) return;
            vm.prank(ownerAddr);
            rw.unpause();
        }
    }
}

/**
 * @notice Phase 2C invariant suite. Fuzz depth is configured in foundry.toml
 *         ([invariant] runs/depth) well above the previous 256 default.
 */
contract StreetsOfGainsRewardsInvariantTest is StdInvariant, Test {
    StreetsOfGainsRewards internal rw;
    MockERC20 internal token;
    RewardsHandler internal handler;

    uint256 internal signerPk = 0xA11CE;
    address internal owner = address(0xF0);

    function setUp() public {
        token = new MockERC20();
        vm.warp(1_700_000_000);
        rw = new StreetsOfGainsRewards(owner, address(token), vm.addr(signerPk), 1 days, 100e18, 300e18, 1000e18);
        token.mint(address(rw), 100_000e18);

        handler = new RewardsHandler(rw, token, signerPk, owner);
        targetContract(address(handler));

        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = RewardsHandler.submit.selector;
        selectors[1] = RewardsHandler.claim.selector;
        selectors[2] = RewardsHandler.warp.selector;
        selectors[3] = RewardsHandler.setLimits.selector;
        selectors[4] = RewardsHandler.fund.selector;
        selectors[5] = RewardsHandler.recover.selector;
        selectors[6] = RewardsHandler.pauseToggle.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    /// totalEntitled == Σ pendingRewards
    function invariant_TotalEntitledEqualsSumOfPending() public view {
        uint256 sum;
        for (uint256 i; i < 5; i++) {
            sum += rw.pendingRewards(handler.players(i));
        }
        assertEq(rw.totalEntitled(), sum, "totalEntitled != sum(pendingRewards)");
    }

    /// epochPoolUsed[e] == Σ epochPaid[p][e] for every epoch touched
    function invariant_EpochPoolEqualsSumOfWalletEpochPaid() public view {
        uint256 n = handler.epochCount();
        for (uint256 i; i < n; i++) {
            uint256 e = handler.ghostEpochs(i);
            uint256 sum;
            for (uint256 p; p < 5; p++) {
                sum += rw.epochPaid(handler.players(p), e);
            }
            assertEq(rw.epochPoolUsed(e), sum, "epochPoolUsed != sum(epochPaid)");
        }
    }

    /// per-wallet-epoch and pool caps are never exceeded (against current limits' ceiling)
    function invariant_EpochCapsRespected() public view {
        uint256 n = handler.epochCount();
        for (uint256 i; i < n; i++) {
            uint256 e = handler.ghostEpochs(i);
            assertLe(rw.epochPoolUsed(e), rw.HARD_MAX_REWARD_POOL_EPOCH(), "pool over hard ceiling");
            for (uint256 p; p < 5; p++) {
                assertLe(
                    rw.epochPaid(handler.players(p), e),
                    rw.HARD_MAX_REWARD_PER_WALLET_EPOCH(),
                    "wallet epoch over hard ceiling"
                );
                assertLe(rw.epochPaid(handler.players(p), e), rw.epochPoolUsed(e), "wallet total exceeds pool");
            }
        }
    }

    /// accrued == claimed + still outstanding (no entitlement created or destroyed)
    function invariant_AccruedEqualsClaimedPlusOutstanding() public view {
        assertEq(
            handler.ghostAccrued(),
            handler.ghostClaimed() + rw.totalEntitled(),
            "accrued != claimed + outstanding"
        );
    }

    /// claimed + outstanding never exceeds funded minus recovered
    function invariant_ClaimsAndEntitlementsWithinFunding() public view {
        uint256 funded = 100_000e18 + handler.ghostFunded();
        assertLe(
            handler.ghostClaimed() + rw.totalEntitled(),
            funded - handler.ghostRecovered() + rw.totalEntitled(),
            "payouts exceed funding"
        );
        assertLe(handler.ghostClaimed() + handler.ghostRecovered(), funded, "outflow exceeds inflow");
        assertEq(
            token.balanceOf(address(rw)),
            funded - handler.ghostClaimed() - handler.ghostRecovered(),
            "token balance does not reconcile"
        );
    }

    /// nonce increased exactly once per successful submission
    function invariant_NoncesMatchSubmissionCount() public view {
        for (uint256 i; i < 5; i++) {
            address p = handler.players(i);
            assertEq(rw.nonces(p), handler.ghostSubmissions(p), "nonce drift vs successful submissions");
        }
    }

    /// processed run keys never revert from true to false
    function invariant_ProcessedRunKeysStayProcessed() public view {
        uint256 n = handler.runKeyCount();
        for (uint256 i; i < n; i++) {
            assertTrue(rw.runProcessed(handler.ghostRunKeys(i)), "run key un-processed");
        }
    }

    /// a paused contract never blocks a claim: pending funds always remain owed
    function invariant_PauseNeverDestroysEntitlements() public view {
        uint256 sum;
        for (uint256 i; i < 5; i++) {
            sum += rw.pendingRewards(handler.players(i));
        }
        assertEq(sum, rw.totalEntitled(), "entitlements lost while paused");
    }

    /// contract is solvent for what it owes whenever it has ever been funded enough
    function invariant_UnentitledNeverOverstated() public view {
        uint256 bal = token.balanceOf(address(rw));
        uint256 free = rw.unentitledBalance();
        assertLe(free, bal, "unentitled exceeds balance");
        if (bal >= rw.totalEntitled()) {
            assertEq(free, bal - rw.totalEntitled(), "unentitled miscalculated");
        } else {
            assertEq(free, 0, "unentitled must be 0 when insolvent");
        }
    }
}
