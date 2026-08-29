// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StreetsOfGainsRewards} from "../../src/StreetsOfGainsRewards.sol";

/// @dev Shared EIP-712 attestation building/signing helpers for Phase 2C suites.
abstract contract AttestationHelper is Test {
    bytes32 internal constant TYPEHASH = keccak256(
        "RunAttestation(address player,uint256 score,uint32 wave,uint16 level,bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)"
    );

    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    function _domainSeparatorFor(address verifying, uint256 chainId) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("StreetsOfGainsRewards")),
                keccak256(bytes("1")),
                chainId,
                verifying
            )
        );
    }

    function _structHash(StreetsOfGainsRewards.RunAttestation memory a) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(TYPEHASH, a.player, a.score, a.wave, a.level, a.runId, a.nonce, a.deadline, a.rewardAmount)
        );
    }

    function _digest(StreetsOfGainsRewards.RunAttestation memory a, address verifying)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparatorFor(verifying, block.chainid), _structHash(a)));
    }

    function _sign(StreetsOfGainsRewards.RunAttestation memory a, address verifying, uint256 pk)
        internal
        pure
        returns (bytes memory)
    {
        // pure-safe: digest recomputed with the chainid captured by the caller via _digest
        revert("use _signAt");
    }

    function _signAt(StreetsOfGainsRewards.RunAttestation memory a, address verifying, uint256 pk)
        internal
        view
        returns (bytes memory)
    {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, _digest(a, verifying));
        return abi.encodePacked(r, s, v);
    }

    function _attFor(
        StreetsOfGainsRewards rw,
        address player,
        uint256 score,
        uint32 wave,
        uint256 reward,
        bytes32 runId
    ) internal view returns (StreetsOfGainsRewards.RunAttestation memory a) {
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
}
