// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockERC20 {
    string public name = "Mock WDOGE";
    string public symbol = "WDOGE";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) public virtual returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

/// @dev Token whose transfer re-enters claimReward().
contract ReentrantToken is MockERC20 {
    address public target;
    bool internal entered;

    function setTarget(address t) external {
        target = t;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (!entered && target != address(0)) {
            entered = true;
            (bool ok, bytes memory data) = target.call(abi.encodeWithSignature("claimReward()"));
            entered = false;
            require(!ok, "reentrancy succeeded");
            // bubble nothing; continue with the legit transfer
            data;
        }
        return super.transfer(to, amount);
    }
}

/// @dev Token that returns false instead of reverting; SafeERC20 must catch it.
contract FalseReturningToken is MockERC20 {
    function transfer(address, uint256) public pure override returns (bool) {
        return false;
    }
}
