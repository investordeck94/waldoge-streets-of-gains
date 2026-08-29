// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AttestationHelper} from "./helpers/AttestationHelper.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {RevertingToken, FeeOnTransferToken, BlacklistToken} from "./mocks/MoreTokens.sol";

/**
 * @notice Phase 2C boundary / edge-case suite.
 *         Every cap, epoch and signature boundary is asserted exactly on the limit,
 *         one unit under and one unit over.
 */
contract StreetsOfGainsRewardsBoundaryTest is AttestationHelper {
    StreetsOfGainsRewards internal rw;
    MockERC20 internal token;

    uint256 internal signerPk = 0xA11CE;
    address internal signerAddr;

    address internal owner = address(0xF0);
    address internal alice = address(0xA1);
    address internal bob = address(0xB1);

    uint256 constant MAX_RUN = 100e18;
    uint256 constant MAX_WALLET_EPOCH = 300e18;
    uint256 constant MAX_POOL_EPOCH = 1000e18;
    uint256 constant EPOCH = 1 days;

    function setUp() public {
        signerAddr = vm.addr(signerPk);
        token = new MockERC20();
        vm.warp(1_700_000_000);
        rw = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, EPOCH, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        token.mint(address(rw), 1_000_000e18);
    }

    function _a(address p, uint256 score, uint32 wave, uint256 reward, bytes32 runId)
        internal
        view
        returns (StreetsOfGainsRewards.RunAttestation memory)
    {
        return _attFor(rw, p, score, wave, reward, runId);
    }

    function _go(address p, StreetsOfGainsRewards.RunAttestation memory a) internal {
        vm.prank(p);
        rw.submitRun(a, _signAt(a, address(rw), signerPk));
    }

    // ------------------------------------------------------------------
    // reward cap boundaries
    // ------------------------------------------------------------------

    function test_RewardExactlyMaxPerRunSucceeds() public {
        _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256("exact-run")));
        assertEq(rw.pendingRewards(alice), MAX_RUN);
    }

    function test_RewardOneWeiOverMaxPerRunReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, MAX_RUN + 1, keccak256("over-run"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsRunCap.selector);
        rw.submitRun(a, _signAt(a, address(rw), signerPk));
    }

    function test_WalletEpochExactlyAtCapSucceeds() public {
        for (uint256 i; i < 3; i++) {
            _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256(abi.encode("w", i))));
        }
        assertEq(rw.epochPaid(alice, rw.currentEpoch()), MAX_WALLET_EPOCH);
    }

    function test_WalletEpochOneWeiOverCapReverts() public {
        for (uint256 i; i < 2; i++) {
            _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256(abi.encode("w", i))));
        }
        // 200e18 accrued; +100e18 is exact, +100e18+1 is over
        StreetsOfGainsRewards.RunAttestation memory over = _a(alice, 1, 1, MAX_RUN, keccak256("last"));
        _go(alice, over);
        StreetsOfGainsRewards.RunAttestation memory plus1 = _a(alice, 1, 1, 1, keccak256("plus1"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsWalletEpochCap.selector);
        rw.submitRun(plus1, _signAt(plus1, address(rw), signerPk));
    }

    function test_PoolExactlyAtCapThenOneWeiOverReverts() public {
        // 1000e18 pool, 300e18 per wallet => 3 wallets * 300 + 1 wallet * 100
        for (uint256 w; w < 3; w++) {
            address p = address(uint160(0x5000 + w));
            for (uint256 i; i < 3; i++) {
                _go(p, _a(p, 1, 1, MAX_RUN, keccak256(abi.encode(w, i))));
            }
        }
        address last = address(uint160(0x6000));
        _go(last, _a(last, 1, 1, MAX_RUN, keccak256("last-pool")));
        assertEq(rw.epochPoolUsed(rw.currentEpoch()), MAX_POOL_EPOCH, "pool exactly at cap");

        StreetsOfGainsRewards.RunAttestation memory over = _a(last, 1, 1, 1, keccak256("pool-over"));
        vm.prank(last);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsEpochPool.selector);
        rw.submitRun(over, _signAt(over, address(rw), signerPk));
    }

    // ------------------------------------------------------------------
    // deadline boundaries
    // ------------------------------------------------------------------

    function test_DeadlineEqualToNowIsValid() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, 1e18, keccak256("dl"));
        a.deadline = block.timestamp;
        _go(alice, a);
        assertEq(rw.pendingRewards(alice), 1e18);
    }

    function test_DeadlineOneSecondInThePastReverts() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, 1e18, keccak256("dl"));
        a.deadline = block.timestamp - 1;
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.AttestationExpired.selector);
        rw.submitRun(a, _signAt(a, address(rw), signerPk));
    }

    // ------------------------------------------------------------------
    // epoch boundaries
    // ------------------------------------------------------------------

    function test_EpochBoundaryExactAndPlusMinusOneSecond() public {
        uint256 genesis = rw.epochGenesis();
        assertEq(rw.currentEpoch(), 0);

        vm.warp(genesis + EPOCH - 1);
        assertEq(rw.currentEpoch(), 0, "1s before boundary still epoch 0");

        vm.warp(genesis + EPOCH);
        assertEq(rw.currentEpoch(), 1, "exact boundary rolls over");

        vm.warp(genesis + EPOCH + 1);
        assertEq(rw.currentEpoch(), 1, "1s after boundary still epoch 1");
    }

    function test_CapsResetExactlyOnEpochBoundary() public {
        for (uint256 i; i < 3; i++) {
            _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256(abi.encode("e", i))));
        }
        vm.warp(rw.epochGenesis() + EPOCH - 1);
        StreetsOfGainsRewards.RunAttestation memory blocked = _a(alice, 1, 1, 1, keccak256("blocked"));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RewardExceedsWalletEpochCap.selector);
        rw.submitRun(blocked, _signAt(blocked, address(rw), signerPk));

        vm.warp(rw.epochGenesis() + EPOCH);
        _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256("new-epoch")));
        assertEq(rw.epochPaid(alice, 1), MAX_RUN);
        assertEq(rw.pendingRewards(alice), 4 * MAX_RUN);
    }

    // ------------------------------------------------------------------
    // value edge cases
    // ------------------------------------------------------------------

    function test_MaxUintScoreAccepted() public {
        _go(alice, _a(alice, type(uint256).max, type(uint32).max, 1e18, keccak256("max")));
        assertEq(rw.bestScore(alice), type(uint256).max);
        assertEq(rw.bestWave(alice), type(uint32).max);
    }

    function test_ZeroRunIdIsAValidRunKey() public {
        _go(alice, _a(alice, 10, 1, 1e18, bytes32(0)));
        assertTrue(rw.isRunProcessed(alice, bytes32(0)));

        StreetsOfGainsRewards.RunAttestation memory dup = _a(alice, 11, 1, 1e18, bytes32(0));
        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.RunAlreadyProcessed.selector);
        rw.submitRun(dup, _signAt(dup, address(rw), signerPk));

        // still usable by another player
        _go(bob, _a(bob, 12, 1, 1e18, bytes32(0)));
        assertTrue(rw.isRunProcessed(bob, bytes32(0)));
    }

    // ------------------------------------------------------------------
    // signature edge cases
    // ------------------------------------------------------------------

    function test_SignerRotationInvalidatesOutstandingSignatures() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, 1e18, keccak256("pre-rotation"));
        bytes memory sig = _signAt(a, address(rw), signerPk);

        vm.prank(owner);
        rw.setSigner(vm.addr(0xC0FFEE));

        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InvalidSignature.selector);
        rw.submitRun(a, sig);
    }

    function test_HighSSignatureRejected() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, 1e18, keccak256("malleable"));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, _digest(a, address(rw)));
        // flip to the malleable high-s counterpart
        uint256 n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
        bytes32 highS = bytes32(n - uint256(s));
        uint8 flippedV = v == 27 ? 28 : 27;

        vm.prank(alice);
        vm.expectRevert(); // ECDSAInvalidSignatureS
        rw.submitRun(a, abi.encodePacked(r, highS, flippedV));
    }

    function test_InvalidVValuesRejected() public {
        StreetsOfGainsRewards.RunAttestation memory a = _a(alice, 1, 1, 1e18, keccak256("v"));
        (, bytes32 r, bytes32 s) = vm.sign(signerPk, _digest(a, address(rw)));

        vm.prank(alice);
        vm.expectRevert(); // ECDSAInvalidSignature (v = 0)
        rw.submitRun(a, abi.encodePacked(r, s, uint8(0)));

        vm.prank(alice);
        vm.expectRevert(); // ECDSAInvalidSignature (v = 1)
        rw.submitRun(a, abi.encodePacked(r, s, uint8(1)));
    }

    function test_DomainSeparatorMatchesIndependentCalculationOnChikyu() public {
        vm.chainId(6281971);
        StreetsOfGainsRewards fresh = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, EPOCH, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        bytes32 expected = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("StreetsOfGainsRewards")),
                keccak256(bytes("1")),
                uint256(6281971),
                address(fresh)
            )
        );
        assertEq(fresh.domainSeparator(), expected, "EIP-712 domain separator mismatch for chain 6281971");
    }

    // ------------------------------------------------------------------
    // accounting edge cases
    // ------------------------------------------------------------------

    function test_CapReductionDoesNotReduceExistingPendingRewards() public {
        _go(alice, _a(alice, 1, 1, MAX_RUN, keccak256("before-cut")));
        assertEq(rw.pendingRewards(alice), MAX_RUN);

        vm.prank(owner);
        rw.setRewardLimits(1e18, 2e18, 3e18);

        assertEq(rw.pendingRewards(alice), MAX_RUN, "existing entitlement untouched");
        assertEq(rw.totalEntitled(), MAX_RUN);

        vm.prank(alice);
        rw.claimReward();
        assertEq(token.balanceOf(alice), MAX_RUN);
    }

    function test_MultipleEntitlementsAccumulate() public {
        uint256 total;
        for (uint256 i; i < 3; i++) {
            _go(alice, _a(alice, 1, 1, 7e18, keccak256(abi.encode("acc", i))));
            total += 7e18;
            assertEq(rw.pendingRewards(alice), total);
        }
        assertEq(rw.totalEntitled(), total);
        vm.prank(alice);
        assertEq(rw.claimReward(), total);
    }

    function test_PartialFundingBlocksOversizedClaimButNotSmallerOnes() public {
        StreetsOfGainsRewards poor = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, EPOCH, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        token.mint(address(poor), 5e18); // under-funded

        StreetsOfGainsRewards.RunAttestation memory a =
            _attFor(poor, alice, 1, 1, 10e18, keccak256("underfunded"));
        vm.prank(alice);
        poor.submitRun(a, _signAt(a, address(poor), signerPk));

        vm.prank(alice);
        vm.expectRevert(StreetsOfGainsRewards.InsufficientRewardBalance.selector);
        poor.claimReward();

        // top up => the same entitlement now claims fine (nothing was lost)
        token.mint(address(poor), 5e18);
        vm.prank(alice);
        assertEq(poor.claimReward(), 10e18);
    }

    function test_RecoverUnentitledBeforeAndAfterClaims() public {
        _go(alice, _a(alice, 1, 1, 10e18, keccak256("r")));

        uint256 freeBefore = rw.unentitledBalance();
        assertEq(freeBefore, 1_000_000e18 - 10e18);

        vm.prank(owner);
        rw.recoverUnentitled(owner, freeBefore / 2);
        assertGe(token.balanceOf(address(rw)), rw.totalEntitled(), "still solvent after recovery");

        vm.prank(alice);
        rw.claimReward();

        uint256 freeAfter = rw.unentitledBalance();
        assertEq(freeAfter, token.balanceOf(address(rw)), "all remaining is unentitled");
        vm.prank(owner);
        rw.recoverUnentitled(owner, freeAfter);
        assertEq(token.balanceOf(address(rw)), 0);
    }

    function test_RecoverUnentitledWhileInsolventReverts() public {
        StreetsOfGainsRewards poor = new StreetsOfGainsRewards(
            owner, address(token), signerAddr, EPOCH, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH
        );
        token.mint(address(poor), 1e18);
        StreetsOfGainsRewards.RunAttestation memory a = _attFor(poor, alice, 1, 1, 10e18, keccak256("i"));
        vm.prank(alice);
        poor.submitRun(a, _signAt(a, address(poor), signerPk));

        assertEq(poor.unentitledBalance(), 0, "insolvent => nothing recoverable");
        vm.prank(owner);
        vm.expectRevert(StreetsOfGainsRewards.NothingRecoverable.selector);
        poor.recoverUnentitled(owner, 1);
    }

    // ------------------------------------------------------------------
    // hostile token behaviour (SafeERC20 must surface failures)
    // ------------------------------------------------------------------

    function _deployWith(address tk) internal returns (StreetsOfGainsRewards r) {
        r = new StreetsOfGainsRewards(owner, tk, signerAddr, EPOCH, MAX_RUN, MAX_WALLET_EPOCH, MAX_POOL_EPOCH);
    }

    function test_RevertingTokenBlocksClaimAndPreservesEntitlement() public {
        RevertingToken rt = new RevertingToken();
        StreetsOfGainsRewards r = _deployWith(address(rt));
        rt.mint(address(r), 100e18);

        StreetsOfGainsRewards.RunAttestation memory a = _attFor(r, alice, 1, 1, 7e18, keccak256("rev"));
        vm.prank(alice);
        r.submitRun(a, _signAt(a, address(r), signerPk));

        vm.prank(alice);
        vm.expectRevert(RevertingToken.TransferDisabled.selector);
        r.claimReward();

        assertEq(r.pendingRewards(alice), 7e18, "entitlement preserved on failed transfer");
        assertEq(r.totalEntitled(), 7e18);
    }

    function test_BlacklistedPlayerCannotClaimButKeepsEntitlement() public {
        BlacklistToken bt = new BlacklistToken();
        StreetsOfGainsRewards r = _deployWith(address(bt));
        bt.mint(address(r), 100e18);
        bt.setBlacklisted(alice, true);

        StreetsOfGainsRewards.RunAttestation memory a = _attFor(r, alice, 1, 1, 7e18, keccak256("bl"));
        vm.prank(alice);
        r.submitRun(a, _signAt(a, address(r), signerPk));

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BlacklistToken.Blacklisted.selector, alice));
        r.claimReward();
        assertEq(r.pendingRewards(alice), 7e18);

        bt.setBlacklisted(alice, false);
        vm.prank(alice);
        assertEq(r.claimReward(), 7e18);
        assertEq(bt.balanceOf(alice), 7e18);
    }

    /// @dev Documented limitation: with a fee-on-transfer token the player receives less
    ///      than the accrued amount. WDOGE is a plain ERC-20; this is asserted, not fixed.
    function test_FeeOnTransferTokenUnderDeliversByDesign() public {
        FeeOnTransferToken ft = new FeeOnTransferToken();
        StreetsOfGainsRewards r = _deployWith(address(ft));
        ft.mint(address(r), 100e18);

        StreetsOfGainsRewards.RunAttestation memory a = _attFor(r, alice, 1, 1, 10e18, keccak256("fee"));
        vm.prank(alice);
        r.submitRun(a, _signAt(a, address(r), signerPk));

        vm.prank(alice);
        r.claimReward();

        assertEq(ft.balanceOf(alice), 9.5e18, "5% fee taken by the token, not the contract");
        assertEq(r.pendingRewards(alice), 0);
        assertEq(r.totalEntitled(), 0);
    }
}
