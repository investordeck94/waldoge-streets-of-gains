// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";

/**
 * @notice Deployment script for DogeOS Chikyu Testnet (chainId 6281971).
 *         NOT executed in this phase. Kept here for a later, explicit deploy step.
 *
 *   forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.dogeos.com --broadcast
 *
 * REQUIRED ENV:
 *   SOG_OWNER   administrative authority. SHOULD be a multisig. Must differ from signer.
 *   SOG_SIGNER  backend attestation EOA. Hot key. Must differ from owner.
 *
 * The parameters below are CONSERVATIVE TESTNET OPERATIONAL LIMITS, deliberately far
 * below the contract's hard ceilings (1_000 / 10_000 / 1_000_000 WDOGE). They are sized
 * for roughly one day of a small testnet cohort (~20 active wallets), NOT for a large
 * float. The configured epoch pool is the blast radius of a signer compromise, so only
 * ~1-2 epochs of WDOGE should ever be funded into the contract at a time.
 */
contract Deploy is Script {
    // Verified DogeOS Chikyu testnet WDOGE
    address constant WDOGE = 0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE;

    uint256 constant DOGEOS_CHIKYU_CHAIN_ID = 6281971;

    // ---- conservative testnet operational limits ----
    uint256 constant EPOCH_LENGTH = 1 days;
    uint256 constant MAX_REWARD_PER_RUN = 10e18; // 10 WDOGE best-case single run
    uint256 constant MAX_REWARD_PER_WALLET_EPOCH = 50e18; // 50 WDOGE / wallet / day
    uint256 constant MAX_REWARD_POOL_EPOCH = 1_000e18; // 1,000 WDOGE / day, whole game

    error WrongChain(uint256 actual, uint256 expected);
    error RewardTokenHasNoCode(address token);
    error OwnerNotSet();
    error SignerNotSet();
    error OwnerMustDifferFromSigner(address account);

    function run() external returns (StreetsOfGainsRewards rewards) {
        // ---- pre-flight: chain ----
        if (block.chainid != DOGEOS_CHIKYU_CHAIN_ID) {
            revert WrongChain(block.chainid, DOGEOS_CHIKYU_CHAIN_ID);
        }

        // ---- pre-flight: reward token must be a live contract on this chain ----
        if (WDOGE.code.length == 0) revert RewardTokenHasNoCode(WDOGE);

        // ---- pre-flight: authority separation ----
        address owner = vm.envAddress("SOG_OWNER");
        address signer = vm.envAddress("SOG_SIGNER");
        if (owner == address(0)) revert OwnerNotSet();
        if (signer == address(0)) revert SignerNotSet();
        if (owner == signer) revert OwnerMustDifferFromSigner(owner);

        vm.startBroadcast();
        rewards = new StreetsOfGainsRewards(
            owner,
            WDOGE,
            signer,
            EPOCH_LENGTH,
            MAX_REWARD_PER_RUN,
            MAX_REWARD_PER_WALLET_EPOCH,
            MAX_REWARD_POOL_EPOCH
        );
        vm.stopBroadcast();

        _assertDeployedConfig(rewards, owner, signer);
        _logConfig(rewards, owner, signer);
    }

    /// @dev Read the deployed configuration back from the chain and assert it.
    function _assertDeployedConfig(StreetsOfGainsRewards r, address owner, address signer) internal view {
        require(address(r).code.length > 0, "no code at deployed address");
        require(address(r.rewardToken()) == WDOGE, "rewardToken mismatch");
        require(r.signer() == signer, "signer mismatch");
        require(r.owner() == owner, "owner mismatch");
        require(r.owner() != r.signer(), "owner == signer");
        require(r.epochLength() == EPOCH_LENGTH, "epochLength mismatch");
        require(r.maxRewardPerRun() == MAX_REWARD_PER_RUN, "maxRewardPerRun mismatch");
        require(
            r.maxRewardPerWalletPerEpoch() == MAX_REWARD_PER_WALLET_EPOCH, "maxRewardPerWalletPerEpoch mismatch"
        );
        require(r.maxRewardPoolPerEpoch() == MAX_REWARD_POOL_EPOCH, "maxRewardPoolPerEpoch mismatch");
        require(!r.paused(), "unexpectedly paused");
        require(r.totalEntitled() == 0, "unexpected entitlements");
        // Operational limits must stay well inside the immutable hard ceilings.
        require(r.maxRewardPerRun() <= r.HARD_MAX_REWARD_PER_RUN(), "run cap over ceiling");
        require(r.maxRewardPerWalletPerEpoch() <= r.HARD_MAX_REWARD_PER_WALLET_EPOCH(), "wallet cap over ceiling");
        require(r.maxRewardPoolPerEpoch() <= r.HARD_MAX_REWARD_POOL_EPOCH(), "pool cap over ceiling");
    }

    function _logConfig(StreetsOfGainsRewards r, address owner, address signer) internal view {
        console2.log("=== StreetsOfGainsRewards deployed ===");
        console2.log("chainId                  :", block.chainid);
        console2.log("address                  :", address(r));
        console2.log("rewardToken (WDOGE)      :", address(r.rewardToken()));
        console2.log("owner                    :", owner);
        console2.log("signer                   :", signer);
        console2.log("epochLength (s)          :", r.epochLength());
        console2.log("epochGenesis             :", r.epochGenesis());
        console2.log("maxRewardPerRun          :", r.maxRewardPerRun());
        console2.log("maxRewardPerWalletEpoch  :", r.maxRewardPerWalletPerEpoch());
        console2.log("maxRewardPoolPerEpoch    :", r.maxRewardPoolPerEpoch());
        console2.log("domainSeparator          :");
        console2.logBytes32(r.domainSeparator());
        console2.log("--- funding policy ---");
        console2.log("Fund at most 1-2 epoch pools. Signer compromise can drain the epoch allowance.");
    }
}
