// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {WaldogeTestnetToken} from "../src/WaldogeTestnetToken.sol";

contract WaldogeTestnetTokenTest is Test {
    WaldogeTestnetToken internal token;

    address internal admin = address(0xA11CE);
    address internal minter = address(0xFA0CE7);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0B);

    event TestnetMint(address indexed minter, address indexed to, uint256 amount);

    function setUp() public {
        token = new WaldogeTestnetToken(admin, minter);
    }

    // --------------------------------------------------------------- metadata

    function test_Metadata() public view {
        assertEq(token.name(), "Waldoge Testnet");
        assertEq(token.symbol(), "tWALDOGE");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
    }

    function test_ConstructorRejectsZeroAddresses() public {
        vm.expectRevert(WaldogeTestnetToken.ZeroAddress.selector);
        new WaldogeTestnetToken(address(0), minter);

        vm.expectRevert(WaldogeTestnetToken.ZeroAddress.selector);
        new WaldogeTestnetToken(admin, address(0));
    }

    // ----------------------------------------------------------------- roles

    function test_RoleSeparation() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.MINTER_ROLE(), minter));
        // Admin is explicitly NOT a minter.
        assertFalse(token.hasRole(token.MINTER_ROLE(), admin));
        // Minter cannot manage roles.
        assertFalse(token.hasRole(token.DEFAULT_ADMIN_ROLE(), minter));
        // Deployer (this test contract) holds nothing.
        assertFalse(token.hasRole(token.DEFAULT_ADMIN_ROLE(), address(this)));
        assertFalse(token.hasRole(token.MINTER_ROLE(), address(this)));
    }

    function test_AdminCanGrantAndRevokeMinter() public {
        vm.prank(admin);
        token.grantRole(token.MINTER_ROLE(), alice);
        vm.prank(alice);
        token.mint(bob, 1e18);
        assertEq(token.balanceOf(bob), 1e18);

        vm.prank(admin);
        token.revokeRole(token.MINTER_ROLE(), alice);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, token.MINTER_ROLE()
            )
        );
        token.mint(bob, 1e18);
    }

    function test_MinterCannotGrantRoles() public {
        vm.prank(minter);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, minter, token.DEFAULT_ADMIN_ROLE()
            )
        );
        token.grantRole(token.MINTER_ROLE(), alice);
    }

    // ------------------------------------------------------------------ mint

    function test_MinterCanMint() public {
        vm.expectEmit(true, true, true, true);
        emit TestnetMint(minter, alice, 500e18);
        vm.prank(minter);
        token.mint(alice, 500e18);

        assertEq(token.balanceOf(alice), 500e18);
        assertEq(token.totalSupply(), 500e18);
    }

    function test_UnauthorizedMintReverts() public {
        address[3] memory strangers = [alice, admin, address(this)];
        for (uint256 i; i < strangers.length; ++i) {
            vm.prank(strangers[i]);
            vm.expectRevert(
                abi.encodeWithSelector(
                    IAccessControl.AccessControlUnauthorizedAccount.selector,
                    strangers[i],
                    token.MINTER_ROLE()
                )
            );
            token.mint(alice, 1e18);
        }
        assertEq(token.totalSupply(), 0);
    }

    function test_MintBoundsAndZeroAddress() public {
        vm.startPrank(minter);

        vm.expectRevert(abi.encodeWithSelector(WaldogeTestnetToken.InvalidMintAmount.selector, 0));
        token.mint(alice, 0);

        uint256 tooMuch = token.MAX_MINT_PER_CALL() + 1;
        vm.expectRevert(abi.encodeWithSelector(WaldogeTestnetToken.InvalidMintAmount.selector, tooMuch));
        token.mint(alice, tooMuch);

        vm.expectRevert(WaldogeTestnetToken.ZeroAddress.selector);
        token.mint(address(0), 1e18);

        // Exactly at the cap is allowed.
        token.mint(alice, token.MAX_MINT_PER_CALL());
        vm.stopPrank();
        assertEq(token.balanceOf(alice), token.MAX_MINT_PER_CALL());
    }

    function test_MintBatch() public {
        address[] memory to = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        to[0] = alice;
        to[1] = bob;
        amounts[0] = 1e18;
        amounts[1] = 2e18;

        vm.prank(minter);
        token.mintBatch(to, amounts);
        assertEq(token.balanceOf(alice), 1e18);
        assertEq(token.balanceOf(bob), 2e18);
        assertEq(token.totalSupply(), 3e18);
    }

    function test_MintBatchRejectsBadArrays() public {
        address[] memory to = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        to[0] = alice;
        to[1] = bob;
        amounts[0] = 1e18;

        vm.prank(minter);
        vm.expectRevert(WaldogeTestnetToken.InvalidBatch.selector);
        token.mintBatch(to, amounts);

        vm.prank(minter);
        vm.expectRevert(WaldogeTestnetToken.InvalidBatch.selector);
        token.mintBatch(new address[](0), new uint256[](0));
    }

    function test_UnauthorizedMintBatchReverts() public {
        address[] memory to = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        to[0] = alice;
        amounts[0] = 1e18;

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, token.MINTER_ROLE()
            )
        );
        token.mintBatch(to, amounts);
    }

    // ------------------------------------------------------- transfers/balances

    function test_TransferAndBalances() public {
        vm.prank(minter);
        token.mint(alice, 100e18);

        vm.prank(alice);
        assertTrue(token.transfer(bob, 40e18));
        assertEq(token.balanceOf(alice), 60e18);
        assertEq(token.balanceOf(bob), 40e18);
        assertEq(token.totalSupply(), 100e18);
    }

    function test_TransferInsufficientBalanceReverts() public {
        vm.prank(minter);
        token.mint(alice, 1e18);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 1e18, 2e18)
        );
        token.transfer(bob, 2e18);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(minter);
        token.mint(alice, 10e18);

        vm.prank(alice);
        token.approve(bob, 6e18);
        assertEq(token.allowance(alice, bob), 6e18);

        vm.prank(bob);
        token.transferFrom(alice, bob, 6e18);
        assertEq(token.balanceOf(bob), 6e18);
        assertEq(token.allowance(alice, bob), 0);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, bob, 0, 1)
        );
        token.transferFrom(alice, bob, 1);
    }

    function test_Burn() public {
        vm.prank(minter);
        token.mint(alice, 5e18);
        vm.prank(alice);
        token.burn(2e18);
        assertEq(token.balanceOf(alice), 3e18);
        assertEq(token.totalSupply(), 3e18);
    }

    // ------------------------------------------------------------------ fuzz

    function testFuzz_MintThenTransfer(uint256 amount, uint256 sendAmount) public {
        amount = bound(amount, 1, token.MAX_MINT_PER_CALL());
        sendAmount = bound(sendAmount, 0, amount);

        vm.prank(minter);
        token.mint(alice, amount);

        vm.prank(alice);
        token.transfer(bob, sendAmount);

        assertEq(token.balanceOf(alice), amount - sendAmount);
        assertEq(token.balanceOf(bob), sendAmount);
        assertEq(token.totalSupply(), amount);
    }

    function testFuzz_OnlyMinterRoleCanMint(address caller) public {
        vm.assume(caller != minter);
        vm.prank(caller);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, caller, token.MINTER_ROLE()
            )
        );
        token.mint(alice, 1e18);
    }
}
