// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WaldogeTestnetToken
 * @notice "Waldoge Testnet" (tWALDOGE) — an 18-decimal ERC-20 intended EXCLUSIVELY for the
 *         DogeOS Chikyu testnet (chain id 6281971).
 *
 * ⚠️ NO MONETARY VALUE ⚠️
 * -----------------------
 * This token is a test artifact. It has NO monetary value, NO price, NO backing,
 * NO redemption rights and NO claim on anything whatsoever. It is not an
 * investment, not a security, and must never be bridged to, listed on, or
 * deployed to a production/mainnet environment. Balances may be reset, the
 * contract may be redeployed at any time, and supply is unbounded by design
 * beyond the roles below.
 *
 * ACCESS CONTROL
 * --------------
 * Mint authority is deliberately separated from admin authority:
 *   - DEFAULT_ADMIN_ROLE — grants/revokes roles. Held by the deployer-supplied
 *     `admin` address. Cannot mint.
 *   - MINTER_ROLE — the ONLY role able to call {mint}/{mintBatch}. Intended for a
 *     future testnet faucet contract or faucet backend address.
 * The deployer is not implicitly privileged; both addresses are constructor
 * arguments. No initial supply is minted.
 *
 * This contract is intentionally independent of StreetsOfGainsRewards.sol and
 * does not modify or interact with it.
 */
contract WaldogeTestnetToken is ERC20, AccessControl {
    /// @notice Role allowed to mint new tWALDOGE. Intended for the testnet faucet.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Upper bound on a single {mint} call, limiting blast radius of a compromised faucet.
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000e18;

    /// @dev Thrown when a zero address is supplied where an account is required.
    error ZeroAddress();
    /// @dev Thrown when a mint amount is zero or exceeds {MAX_MINT_PER_CALL}.
    error InvalidMintAmount(uint256 amount);
    /// @dev Thrown when {mintBatch} receives mismatched or empty arrays.
    error InvalidBatch();

    /// @notice Emitted on every successful mint, for faucet auditing.
    event TestnetMint(address indexed minter, address indexed to, uint256 amount);

    /**
     * @param admin   Address receiving DEFAULT_ADMIN_ROLE (role management only, cannot mint).
     * @param minter  Address receiving MINTER_ROLE (the future faucet).
     */
    constructor(address admin, address minter) ERC20("Waldoge Testnet", "tWALDOGE") {
        if (admin == address(0) || minter == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
    }

    /// @notice 18 decimals, matching the project convention.
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @notice Mint testnet tokens. Restricted to {MINTER_ROLE}.
     * @param to     Recipient. Must not be the zero address.
     * @param amount Amount in wei-units, 0 < amount <= {MAX_MINT_PER_CALL}.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintChecked(to, amount);
    }

    /**
     * @notice Mint to several recipients in one call. Restricted to {MINTER_ROLE}.
     * @dev Each individual amount is bounded by {MAX_MINT_PER_CALL}.
     */
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlyRole(MINTER_ROLE)
    {
        uint256 len = recipients.length;
        if (len == 0 || len != amounts.length) revert InvalidBatch();
        for (uint256 i; i < len; ++i) {
            _mintChecked(recipients[i], amounts[i]);
        }
    }

    /// @notice Burn caller's own tokens. Useful for resetting faucet test wallets.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function _mintChecked(address to, uint256 amount) private {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0 || amount > MAX_MINT_PER_CALL) revert InvalidMintAmount(amount);
        _mint(to, amount);
        emit TestnetMint(msg.sender, to, amount);
    }
}
