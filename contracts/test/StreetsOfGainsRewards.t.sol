// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";
import {MockERC20, ReentrantToken, FalseReturningToken} from "./mocks/MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract StreetsOfGainsRewardsTest is Test {
    StreetsOfGainsRewards internal rw;
    MockERC20 internal token;

    uint256 internal signerPk = 0xA11CE;
    address internal signerAddr;
    uint256 internal attackerPk = 0xB0B;

    address internal owner = address(0xF0);
    address internal alice = address(0xA1);
    address internal bob = address(0xB1);

    bytes32 constant TYPEHASH = keccak256(
        "RunAttestation(address player,uint256 score,uint32 wave,uint16 level,bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)"
    );

    uint256 constant MAX_RUN = 100e18;
    uint256 constant MAX_WALLET_EPOCH = 300e18;
    uint256 constant MAX_POOL_EPOCH = 1000e18;

    function setUp() public {
        signerAddr = vm.addr(signerPk);
        token = new MockERC20();
        vm.warp(1_700_000_000);
        rw = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, 1 days, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        token.mint(address(rw), 1_000_000e18);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    function _att(address player, uint256 score, uint32 wave, uint256 reward, bytes32 runId)
        internal
        view
        returns (StreetsOfGainsRewards.RunAttestation memory a)
    {
        a = StreetsOfGainsRewards.RunAttestation({
            player: player,
            score: score,
            wave: wave,
            level: 3,
            runId: runId,
            nonce: rw.nonces(player),
            deadline: block.timestamp + 1 hours,
            rewardAmount: reward
        });
    }

    function _sign(StreetsOfGainsRewards.RunAttestation memory a, uint256 pk)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = _digest(a, address(rw));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _digest(StreetsOfGainsRewards.RunAttestation memory a, address verifying)
        internal
        view
        returns (bytes32)
    {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("StreetsOfGainsRewards")),
                keccak256(bytes("1")),
                block.chainid,
                verifying
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                TYPEHASH, a.player, a.score, a.wave, a.level, a.runId, a.nonce, a.deadline, a.rewardAmount
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    function _submit(address player, StreetsOfGainsRewards.RunAttestation memory a, bytes memory sig)
        internal
    {
        vm.prank(player);
        rw.submitRun(a, sig);
    }

    // ------------------------------------------------------------------
    // happy path
    // ------------------------------------------------------------------

    function test_ValidSubmissionRecordsScoreAndAccrues() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 5000, 7, 10e18, keccak256("run-1"));
        _submit(alice, a, _sign(a, signerPk));

        assertEq(rw.bestScore(alice), 5000);
        assertEq(rw.bestWave(alice), 7);
        assertEq(rw.nonces(alice), 1);
        assertTrue(rw.isRunProcessed(alice, keccak256("run-1")));
        assertTrue(rw.runProcessed(rw.runKeyOf(alice, keccak256("run-1"))));
        assertFalse(rw.isRunProcessed(bob, keccak256("run-1")), "run key is player-bound");
        assertEq(rw.pendingRewards(alice), 10e18);
        assertEq(rw.totalEntitled(), 10e18);
        assertEq(token.balanceOf(alice), 0, "no transfer on submit");
    }

    function test_ClaimTransfersAndClearsEntitlement() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 5000, 7, 10e18, keccak256("run-1"));
        _submit(alice, a, _sign(a, signerPk));

        vm.prank(alice);
        rw.claimReward();

        assertEq(token.balanceOf(alice), 10e18);
        assertEq(rw.pendingRewards(alice), 0);
        assertEq(rw.totalEntitled(), 0);
    }

    function test_DoubleClaimReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 5e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk));
        vm.prank(alice);
        rw.claimReward();
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.NothingToClaim.selector);
        rw.claimReward();
    }

    function test_ClaimWithNoEntitlementReverts() public {
        vm.prank(bob);
        vm.expectRevert(StreetsOfGainsRewards.NothingToClaim.selector);
        rw.claimReward();
    }

    function test_BestScoreOnlyImprovesAndZeroRewardAllowed() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 5000, 7, 0, keccak256("r1"));
        _submit(alice, a, _sign(a, signerPk));

        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 100, 2, 0, keccak256("r2"));
        _submit(alice, b, _sign(b, signerPk));

        assertEq(rw.bestScore(alice), 5000);
        assertEq(rw.bestWave(alice), 7);
        assertEq(rw.pendingRewards(alice), 0);
    }

    // ------------------------------------------------------------------
    // signature / replay
    // ------------------------------------------------------------------

    function test_WrongSignerReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, _sign(a, attackerPk));
    }

    function test_TamperedScoreInvalidatesSignature() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        a.score = 999_999;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, sig);
    }

    function test_TamperedRewardInvalidatesSignature() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        a.rewardAmount = 90e18;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, sig);
    }

    function test_CrossPlayerReplayReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        vm.prank(bob);
        vm.expectRevert(StreetsOfGainsRewards.NotPlayer.selector);
        rw.submitRun(a, sig);
    }

    function test_CrossContractDomainMismatchReverts() public {
        // Sign for a different verifying contract address.
        StreetsOfGainsRewards other = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, 1 days, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes32 d = _digest(a, address(other));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, d);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, abi.encodePacked(r, s, v));
    }

    function test_CrossChainDomainMismatchReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk); // signed for current chainid
        vm.chainId(6281971);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, sig);
    }

    function test_ExactSignatureReplayReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        _submit(alice, a, sig);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector); // nonce consumed
        rw.submitRun(a, sig);
    }

    function test_ReusedRunIdWithFreshNonceReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("dup"));
        _submit(alice, a, _sign(a, signerPk));

        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 200, 2, 1e18, keccak256("dup"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RunAlreadyProcessed.selector);
        rw.submitRun(b, _sign(b, signerPk));
    }

    function test_BadNonceReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        a.nonce = 7;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rw.submitRun(a, _sign(a, signerPk));
    }

    function test_ExpiredAttestationReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        vm.warp(a.deadline + 1);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.AttestationExpired.selector);
        rw.submitRun(a, sig);
    }

    function test_MalformedSignatureReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        vm.prank(alice);
        vm.expectRevert();
        rw.submitRun(a, hex"dead");
    }

    // ------------------------------------------------------------------
    // caps / epochs
    // ------------------------------------------------------------------

    function test_RewardOverRunCapReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, MAX_RUN + 1, keccak256("r"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsRunCap.selector);
        rw.submitRun(a, _sign(a, signerPk));
    }

    function test_WalletEpochCapReverts() public {
        for (uint256 i = 0; i < 3; i++) {
            StreetsOfGainsRewards.RunAttestation memory a =
                _att(alice, 1, 1, MAX_RUN, keccak256(abi.encode("run", i)));
            _submit(alice, a, _sign(a, signerPk));
        }
        assertEq(rw.epochPaid(alice, rw.currentEpoch()), MAX_WALLET_EPOCH);

        StreetsOfGainsRewards.RunAttestation memory x = _att(alice, 1, 1, 1e18, keccak256("over"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsWalletEpochCap.selector);
        rw.submitRun(x, _sign(x, signerPk));
    }

    function test_EpochPoolExhaustionReverts() public {
        // 1000e18 pool / 300e18 per wallet => needs several wallets
        for (uint256 w = 0; w < 3; w++) {
            address p = address(uint160(0x1000 + w));
            for (uint256 i = 0; i < 3; i++) {
                StreetsOfGainsRewards.RunAttestation memory a =
                    _att(p, 1, 1, MAX_RUN, keccak256(abi.encode(w, i)));
                _submit(p, a, _sign(a, signerPk));
            }
        }
        assertEq(rw.epochPoolUsed(rw.currentEpoch()), 900e18);

        address p4 = address(uint160(0x2000));
        StreetsOfGainsRewards.RunAttestation memory b1 = _att(p4, 1, 1, MAX_RUN, keccak256("p4a"));
        _submit(p4, b1, _sign(b1, signerPk)); // 1000e18 exactly
        StreetsOfGainsRewards.RunAttestation memory b2 = _att(p4, 1, 1, 1, keccak256("p4b"));
        vm.prank(p4);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsEpochPool.selector);
        rw.submitRun(b2, _sign(b2, signerPk));
    }

    function test_EpochRolloverResetsCaps() public {
        for (uint256 i = 0; i < 3; i++) {
            StreetsOfGainsRewards.RunAttestation memory a =
                _att(alice, 1, 1, MAX_RUN, keccak256(abi.encode("e", i)));
            _submit(alice, a, _sign(a, signerPk));
        }
        uint256 e0 = rw.currentEpoch();
        vm.warp(block.timestamp + 1 days);
        assertEq(rw.currentEpoch(), e0 + 1);

        StreetsOfGainsRewards.RunAttestation memory n = _att(alice, 1, 1, MAX_RUN, keccak256("next-epoch"));
        _submit(alice, n, _sign(n, signerPk));
        assertEq(rw.epochPaid(alice, e0 + 1), MAX_RUN);
        assertEq(rw.pendingRewards(alice), 4 * MAX_RUN);
    }

    // ------------------------------------------------------------------
    // pause / admin
    // ------------------------------------------------------------------

    /// HIGH-3: pause halts submissions but never accrued claims.
    function test_PauseBlocksSubmitButNotClaim() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk)); // accrued BEFORE pause

        vm.prank(owner);
        rw.pause();

        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 1, 1, 1e18, keccak256("r2"));
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        rw.submitRun(b, _sign(b, signerPk));

        // pre-pause entitlement remains claimable WHILE paused
        vm.prank(alice);
        uint256 claimed = rw.claimReward();
        assertEq(claimed, 1e18);
        assertEq(token.balanceOf(alice), 1e18);
        assertEq(rw.pendingRewards(alice), 0);
        assertEq(rw.totalEntitled(), 0);
        assertTrue(rw.paused(), "still paused after claim");
    }

    /// HIGH-3: unpausing restores normal submission behaviour; claim works after too.
    function test_UnpauseRestoresSubmissionsAndClaimStillWorks() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk));

        vm.prank(owner);
        rw.pause();
        vm.prank(owner);
        rw.unpause();
        assertFalse(rw.paused());

        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 1, 1, 2e18, keccak256("r2"));
        _submit(alice, b, _sign(b, signerPk));

        vm.prank(alice);
        rw.claimReward();
        assertEq(token.balanceOf(alice), 3e18);
    }

    /// HIGH-3: an admin that pauses and loses the key cannot freeze owed funds forever.
    function test_ClaimWhilePausedForever() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 5e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk));

        vm.prank(owner);
        rw.pause();
        vm.warp(block.timestamp + 3650 days);

        vm.prank(alice);
        rw.claimReward();
        assertEq(token.balanceOf(alice), 5e18);
    }

    // ------------------------------------------------------------------
    // MEDIUM-1: player-bound run replay protection
    // ------------------------------------------------------------------

    function test_SamePlayerSameRunIdReverts() public {
        bytes32 runId = keccak256("shared");
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, runId);
        _submit(alice, a, _sign(a, signerPk));

        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 200, 2, 1e18, runId);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RunAlreadyProcessed.selector);
        rw.submitRun(b, _sign(b, signerPk));
    }

    function test_DifferentPlayerSameRunIdSucceeds() public {
        bytes32 runId = keccak256("shared");
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, runId);
        _submit(alice, a, _sign(a, signerPk));

        StreetsOfGainsRewards.RunAttestation memory b = _att(bob, 300, 4, 2e18, runId);
        _submit(bob, b, _sign(b, signerPk));

        assertTrue(rw.isRunProcessed(alice, runId));
        assertTrue(rw.isRunProcessed(bob, runId));
        assertEq(rw.pendingRewards(bob), 2e18);
    }

    /// A third party cannot burn someone else's runId in advance.
    function test_RunIdCannotBeGriefedByAnotherPlayer() public {
        bytes32 runId = keccak256("alice-future-run");

        // bob front-runs with the same raw runId
        StreetsOfGainsRewards.RunAttestation memory griefer = _att(bob, 1, 1, 0, runId);
        _submit(bob, griefer, _sign(griefer, signerPk));

        // alice is unaffected
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, runId);
        _submit(alice, a, _sign(a, signerPk));
        assertEq(rw.pendingRewards(alice), 1e18);
    }

    function test_SameRunIdDifferentNonceStillBlocked() public {
        bytes32 runId = keccak256("dup");
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, runId);
        _submit(alice, a, _sign(a, signerPk));
        assertEq(rw.nonces(alice), 1);

        // fresh (current) nonce, same runId => still rejected
        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 1, 1, 1e18, runId);
        assertEq(b.nonce, 1);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RunAlreadyProcessed.selector);
        rw.submitRun(b, _sign(b, signerPk));
    }

    function test_SameNonceDifferentRunIdBlockedAfterConsumption() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r1"));
        _submit(alice, a, _sign(a, signerPk));

        // reuse nonce 0 with a brand new runId => nonce already consumed
        StreetsOfGainsRewards.RunAttestation memory b = _att(alice, 1, 1, 1e18, keccak256("r2"));
        b.nonce = 0;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rw.submitRun(b, _sign(b, signerPk));

        // with the current nonce it succeeds
        StreetsOfGainsRewards.RunAttestation memory c = _att(alice, 1, 1, 1e18, keccak256("r2"));
        _submit(alice, c, _sign(c, signerPk));
        assertEq(rw.pendingRewards(alice), 2e18);
    }

    // ------------------------------------------------------------------
    // MEDIUM-2: nonce liveness
    // ------------------------------------------------------------------

    /// An attestation that is signed but never submitted cannot brick the wallet.
    function test_UnsubmittedAttestationDoesNotBrickWallet() public {
        // backend signs nonce 0 ... and the player never submits it
        StreetsOfGainsRewards.RunAttestation memory lost = _att(alice, 999, 9, 1e18, keccak256("lost"));
        bytes memory lostSig = _sign(lost, signerPk);
        lostSig; // deliberately unused: the run is dropped

        // nothing was consumed on chain
        assertEq(rw.nonces(alice), 0);

        // the attestation later expires
        vm.warp(lost.deadline + 1);
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.AttestationExpired.selector);
        rw.submitRun(lost, lostSig);

        // operator resyncs to the on-chain nonce and re-signs => succeeds
        uint256 onChainNonce = rw.nonces(alice);
        assertEq(onChainNonce, 0, "on-chain nonce unchanged");
        StreetsOfGainsRewards.RunAttestation memory fresh = _att(alice, 1234, 5, 2e18, keccak256("fresh"));
        assertEq(fresh.nonce, onChainNonce);
        _submit(alice, fresh, _sign(fresh, signerPk));
        assertEq(rw.nonces(alice), 1);
        assertEq(rw.pendingRewards(alice), 2e18);
    }

    /// A drifted backend counter self-heals by reading nonces(player) again.
    function test_OperatorCanResyncAfterNonceDrift() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r1"));
        _submit(alice, a, _sign(a, signerPk));

        // backend wrongly believes the nonce is still 0
        StreetsOfGainsRewards.RunAttestation memory drifted = _att(alice, 2, 2, 1e18, keccak256("r2"));
        drifted.nonce = 0;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rw.submitRun(drifted, _sign(drifted, signerPk));

        // backend also over-shoots
        StreetsOfGainsRewards.RunAttestation memory ahead = _att(alice, 2, 2, 1e18, keccak256("r3"));
        ahead.nonce = 5;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rw.submitRun(ahead, _sign(ahead, signerPk));

        // resync to on-chain value => works
        StreetsOfGainsRewards.RunAttestation memory ok = _att(alice, 2, 2, 1e18, keccak256("r4"));
        assertEq(ok.nonce, rw.nonces(alice));
        _submit(alice, ok, _sign(ok, signerPk));
        assertEq(rw.nonces(alice), 2);
    }

    function test_UnauthorizedAdminOpsRevert() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rw.pause();
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rw.setSigner(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rw.setRewardLimits(1e18, 2e18, 3e18);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rw.recoverUnentitled(alice, 1);
        vm.stopPrank();
    }

    function test_SignerRotation() public {
        uint256 newPk = 0xC0FFEE;
        vm.prank(owner);
        rw.setSigner(vm.addr(newPk));
        assertEq(rw.signer(), vm.addr(newPk));

        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, _sign(a, signerPk)); // old signer rejected

        _submit(alice, a, _sign(a, newPk));
        assertEq(rw.pendingRewards(alice), 1e18);
    }

    function test_SetSignerZeroReverts() public {
        vm.prank(owner);
        vm.expectRevert(StreetsOfGainsRewards.ZeroAddress.selector);
        rw.setSigner(address(0));
    }

    function test_TwoStepOwnershipTransfer() public {
        vm.prank(owner);
        rw.transferOwnership(alice);
        assertEq(rw.owner(), owner, "still old owner until accepted");
        assertEq(rw.pendingOwner(), alice);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        rw.acceptOwnership();

        vm.prank(alice);
        rw.acceptOwnership();
        assertEq(rw.owner(), alice);
    }

    function test_InvalidRewardParametersRevert() public {
        vm.startPrank(owner);
        vm.expectRevert(StreetsOfGainsRewards.InvalidLimits.selector);
        rw.setRewardLimits(0, 1e18, 2e18);
        vm.expectRevert(StreetsOfGainsRewards.InvalidLimits.selector);
        rw.setRewardLimits(5e18, 1e18, 2e18); // per-run > wallet epoch
        vm.expectRevert(StreetsOfGainsRewards.InvalidLimits.selector);
        rw.setRewardLimits(1e18, 5e18, 2e18); // wallet epoch > pool
        uint256 hardRun = rw.HARD_MAX_REWARD_PER_RUN();
        vm.expectRevert(StreetsOfGainsRewards.InvalidLimits.selector);
        rw.setRewardLimits(hardRun + 1, 10_000e18, 1_000_000e18);
        rw.setRewardLimits(1e18, 2e18, 3e18);
        vm.stopPrank();
        assertEq(rw.maxRewardPerRun(), 1e18);
    }

    function test_ConstructorValidation() public {
        vm.expectRevert(StreetsOfGainsRewards.ZeroAddress.selector);
        new StreetsOfGainsRewards(owner, address(0), signerAddr, 1 days, 1e18, 2e18, 3e18);
        vm.expectRevert(StreetsOfGainsRewards.ZeroAddress.selector);
        new StreetsOfGainsRewards(owner, address(token), address(0), 1 days, 1e18, 2e18, 3e18);
        vm.expectRevert(StreetsOfGainsRewards.InvalidEpochLength.selector);
        new StreetsOfGainsRewards(owner, address(token), signerAddr, 1 minutes, 1e18, 2e18, 3e18);
    }

    // ------------------------------------------------------------------
    // recovery / token behaviour
    // ------------------------------------------------------------------

    function test_RecoverCannotTouchEntitledFunds() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 10e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk));

        uint256 free = rw.unentitledBalance();
        assertEq(free, 1_000_000e18 - 10e18);

        vm.expectRevert(StreetsOfGainsRewards.NothingRecoverable.selector);
        vm.prank(owner);
        rw.recoverUnentitled(owner, free + 1);

        vm.prank(owner);
        rw.recoverUnentitled(owner, free);
        assertEq(token.balanceOf(address(rw)), 10e18);

        vm.prank(alice);
        rw.claimReward();
        assertEq(token.balanceOf(alice), 10e18);
    }

    function test_RecoverForeignTokenRejectsRewardToken() public {
        vm.prank(owner);
        vm.expectRevert(StreetsOfGainsRewards.CannotRecoverRewardToken.selector);
        rw.recoverForeignToken(address(token), owner, 1);

        MockERC20 other = new MockERC20();
        other.mint(address(rw), 5e18);
        vm.prank(owner);
        rw.recoverForeignToken(address(other), owner, 5e18);
        assertEq(other.balanceOf(owner), 5e18);
    }

    function test_ClaimRevertsWhenContractUnderfunded() public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 10e18, keccak256("r"));
        _submit(alice, a, _sign(a, signerPk));
        uint256 freeBal = rw.unentitledBalance();
        vm.prank(owner);
        rw.recoverUnentitled(owner, freeBal);
        // drain the rest by simulating balance loss
        vm.prank(address(rw));
        token.transfer(owner, 10e18);

        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InsufficientRewardBalance.selector);
        rw.claimReward();
    }

    function test_ReentrantTokenCannotDoubleClaim() public {
        ReentrantToken rt = new ReentrantToken();
        StreetsOfGainsRewards r2 = new StreetsOfGainsRewards(
            owner, address(rt), signerAddr, 1 days, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        rt.setTarget(address(r2));
        rt.mint(address(r2), 1000e18);

        StreetsOfGainsRewards.RunAttestation memory a = StreetsOfGainsRewards.RunAttestation({
            player: alice,
            score: 10,
            wave: 1,
            level: 1,
            runId: keccak256("rt"),
            nonce: 0,
            deadline: block.timestamp + 1 hours,
            rewardAmount: 7e18
        });
        bytes32 d = _digestFor(a, address(r2));
        (uint8 v, bytes32 rr, bytes32 ss) = vm.sign(signerPk, d);
        vm.prank(alice);
        r2.submitRun(a, abi.encodePacked(rr, ss, v));

        vm.prank(alice);
        r2.claimReward(); // inner reentrant call must fail, outer succeeds once
        assertEq(rt.balanceOf(alice), 7e18);
        assertEq(r2.pendingRewards(alice), 0);
    }

    function test_FalseReturningTokenBlocksClaim() public {
        FalseReturningToken ft = new FalseReturningToken();
        StreetsOfGainsRewards r2 = new StreetsOfGainsRewards(
            owner, address(ft), signerAddr, 1 days, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        ft.mint(address(r2), 1000e18);

        StreetsOfGainsRewards.RunAttestation memory a = StreetsOfGainsRewards.RunAttestation({
            player: alice,
            score: 10,
            wave: 1,
            level: 1,
            runId: keccak256("ft"),
            nonce: 0,
            deadline: block.timestamp + 1 hours,
            rewardAmount: 7e18
        });
        bytes32 d = _digestFor(a, address(r2));
        (uint8 v, bytes32 rr, bytes32 ss) = vm.sign(signerPk, d);
        vm.prank(alice);
        r2.submitRun(a, abi.encodePacked(rr, ss, v));

        vm.prank(alice);
        vm.expectRevert(); // SafeERC20FailedOperation
        r2.claimReward();
    }

    function _digestFor(StreetsOfGainsRewards.RunAttestation memory a, address verifying)
        internal
        view
        returns (bytes32)
    {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("StreetsOfGainsRewards")),
                keccak256(bytes("1")),
                block.chainid,
                verifying
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                TYPEHASH, a.player, a.score, a.wave, a.level, a.runId, a.nonce, a.deadline, a.rewardAmount
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    // ------------------------------------------------------------------
    // fuzz
    // ------------------------------------------------------------------

    function testFuzz_ScoreAndReward(uint256 score, uint96 reward, bytes32 runId) public {
        reward = uint96(bound(uint256(reward), 0, MAX_RUN));
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, score, 3, reward, runId);
        _submit(alice, a, _sign(a, signerPk));
        assertEq(rw.bestScore(alice), score);
        assertEq(rw.pendingRewards(alice), reward);
    }

    function testFuzz_NonceMustMatch(uint256 nonce) public {
        vm.assume(nonce != 0);
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        a.nonce = nonce;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.BadNonce.selector);
        rw.submitRun(a, _sign(a, signerPk));
    }

    function testFuzz_Deadline(uint256 deadline) public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 1, 1, 1e18, keccak256("r"));
        a.deadline = deadline;
        bytes memory sig = _sign(a, signerPk);
        vm.prank(alice);
        if (deadline < block.timestamp) {
            vm.expectRevert(StreetsOfGainsRewards.AttestationExpired.selector);
            rw.submitRun(a, sig);
        } else {
            rw.submitRun(a, sig);
            assertEq(rw.pendingRewards(alice), 1e18);
        }
    }

    function testFuzz_TamperingAnyFieldFails(uint256 newScore, uint96 newReward) public {
        StreetsOfGainsRewards.RunAttestation memory a = _att(alice, 100, 1, 1e18, keccak256("r"));
        bytes memory sig = _sign(a, signerPk);
        vm.assume(newScore != a.score && uint256(newReward) != a.rewardAmount && newReward <= MAX_RUN);
        a.score = newScore;
        a.rewardAmount = newReward;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, sig);
    }
}
