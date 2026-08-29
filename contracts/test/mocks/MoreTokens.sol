// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {MockERC20} from "./MockERC20.sol";

/// @dev Token whose transfer always reverts with a reason string.
contract RevertingToken is MockERC20 {
    error TransferDisabled();

    function transfer(address, uint256) public pure override returns (bool) {
        revert TransferDisabled();
    }
}

/// @dev Fee-on-transfer token: recipient receives less than `amount`.
contract FeeOnTransferToken is MockERC20 {
    uint256 public feeBps = 500; // 5%

    function setFeeBps(uint256 bps) external {
        require(bps <= 10_000, "bad bps");
        feeBps = bps;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * feeBps) / 10_000;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount - fee;
        balanceOf[address(0xFEE)] += fee;
        emit Transfer(msg.sender, to, amount - fee);
        return true;
    }
}

/// @dev Token with a blacklist; blacklisted recipients cause a revert.
contract BlacklistToken is MockERC20 {
    mapping(address => bool) public blacklisted;

    error Blacklisted(address account);

    function setBlacklisted(address account, bool value) external {
        blacklisted[account] = value;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (blacklisted[to] || blacklisted[msg.sender]) revert Blacklisted(to);
        return super.transfer(to, amount);
    }
}
