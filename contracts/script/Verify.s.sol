// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";

interface IERC20Meta {
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function balanceOf(address) external view returns (uint256);
}

/**
 * @notice Phase 2E read-only post-deployment verification. Broadcasts nothing and
 *         needs no private key.
 *
 *   SOG_REWARDS_ADDRESS=0x... SOG_OWNER=0x... SOG_SIGNER=0x... \
 *     forge script script/Verify.s.sol --rpc-url https://rpc.testnet.dogeos.com
 *
 * Run this BEFORE funding the contract. Every check below must pass; any mismatch
 * is a stop condition, not something to work around.
 */
contract Verify is Script {
    address constant WDOGE = 0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE;
    uint256 constant DOGEOS_CHIKYU_CHAIN_ID = 6281971;

    uint256 constant EPOCH_LENGTH = 1 days;
    uint256 constant MAX_REWARD_PER_RUN = 10e18;
    uint256 constant MAX_REWARD_PER_WALLET_EPOCH = 50e18;
    uint256 constant MAX_REWARD_POOL_EPOCH = 1_000e18;

    function run() external view {
        require(block.chainid == DOGEOS_CHIKYU_CHAIN_ID, "wrong chain");

        address addr = vm.envAddress("SOG_REWARDS_ADDRESS");
        address expectedOwner = vm.envAddress("SOG_OWNER");
        address expectedSigner = vm.envAddress("SOG_SIGNER");

        require(addr.code.length > 0, "no bytecode at rewards address");
        StreetsOfGainsRewards r = StreetsOfGainsRewards(addr);

        // ---- reward token ----
        require(address(r.rewardToken()) == WDOGE, "rewardToken mismatch");
        require(WDOGE.code.length > 0, "WDOGE has no bytecode");
        require(IERC20Meta(WDOGE).decimals() == 18, "WDOGE decimals != 18");

        // ---- authority ----
        require(r.owner() == expectedOwner, "owner mismatch");
        require(r.signer() == expectedSigner, "signer mismatch");
        require(r.owner() != address(0) && r.signer() != address(0), "zero authority");
        require(r.owner() != r.signer(), "owner == signer");

        // ---- limits ----
        require(r.epochLength() == EPOCH_LENGTH, "epochLength mismatch");
        require(r.maxRewardPerRun() == MAX_REWARD_PER_RUN, "maxRewardPerRun mismatch");
        require(r.maxRewardPerWalletPerEpoch() == MAX_REWARD_PER_WALLET_EPOCH, "wallet cap mismatch");
        require(r.maxRewardPoolPerEpoch() == MAX_REWARD_POOL_EPOCH, "pool cap mismatch");

        // ---- pre-funding state ----
        require(!r.paused(), "contract is paused");
        require(r.totalEntitled() == 0, "totalEntitled != 0");

        console2.log("=== StreetsOfGainsRewards verification PASSED ===");
        console2.log("chainId                  :", block.chainid);
        console2.log("address                  :", addr);
        console2.log("rewardToken (WDOGE)      :", address(r.rewardToken()));
        console2.log("WDOGE symbol             :", IERC20Meta(WDOGE).symbol());
        console2.log("owner                    :", r.owner());
        console2.log("signer                   :", r.signer());
        console2.log("epochLength (s)          :", r.epochLength());
        console2.log("epochGenesis             :", r.epochGenesis());
        console2.log("currentEpoch             :", r.currentEpoch());
        console2.log("maxRewardPerRun          :", r.maxRewardPerRun());
        console2.log("maxRewardPerWalletEpoch  :", r.maxRewardPerWalletPerEpoch());
        console2.log("maxRewardPoolPerEpoch    :", r.maxRewardPoolPerEpoch());
        console2.log("paused                   :", r.paused());
        console2.log("totalEntitled            :", r.totalEntitled());
        console2.log("WDOGE balance            :", IERC20Meta(WDOGE).balanceOf(addr));
        console2.log("unentitledBalance        :", r.unentitledBalance());
        console2.log("domainSeparator          :");
        console2.logBytes32(r.domainSeparator());
    }
}
