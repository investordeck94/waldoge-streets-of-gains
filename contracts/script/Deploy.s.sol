// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {StreetsOfGainsRewards} from "../src/StreetsOfGainsRewards.sol";

/**
 * @notice Deployment script for DogeOS Chikyu Testnet (chainId 6281971).
 *         NOT executed in this phase. Kept here for a later, explicit deploy step.
 *
 *   forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.dogeos.com --broadcast
 */
contract Deploy is Script {
    // Verified DogeOS Chikyu testnet WDOGE
    address constant WDOGE = 0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE;

    function run() external {
        address owner = vm.envAddress("SOG_OWNER");
        address signer = vm.envAddress("SOG_SIGNER");

        vm.startBroadcast();
        StreetsOfGainsRewards rewards = new StreetsOfGainsRewards(
            owner,
            WDOGE,
            signer,
            1 days, // epoch length
            100e18, // max reward per run
            300e18, // max reward per wallet per epoch
            50_000e18 // max reward pool per epoch
        );
        vm.stopBroadcast();

        console2.log("StreetsOfGainsRewards:", address(rewards));
    }
}
