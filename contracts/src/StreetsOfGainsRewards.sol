// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title StreetsOfGainsRewards
 * @notice Records server-attested "Streets of Gains" run results and accounts
 *         milestone rewards in an ERC-20 token (testnet WDOGE on DogeOS Chikyu).
 *
 * TRUST MODEL
 * -----------
 * Gameplay is 100% client side and the browser is NOT trusted. The contract does
 * not (and cannot) judge whether a score is legitimate. Instead an off-chain
 * backend validates the run and signs an EIP-712 attestation. The contract only
 * verifies:
 *   - the attestation was signed by the currently authorized signer,
 *   - it was issued for msg.sender,
 *   - it has not expired,
 *   - it has not been replayed (per-player nonce + one-shot runId),
 *   - the reward it authorizes fits inside on-chain safety caps.
 *
 * A compromised signer can mint entitlements only up to:
 *   maxRewardPerRun per run, maxRewardPerWalletPerEpoch per wallet per epoch and
 *   maxRewardPoolPerEpoch across all wallets per epoch. It cannot drain the
 *   contract in a single transaction.
 *
 * REWARD FLOW
 * -----------
 * submitRun() only *accrues* an entitlement (no token movement).
 * claimReward() performs the transfer. This separates score recording,
 * eligibility, accounting and transfer, and keeps the signature path free of
 * external calls.
 *
 * REPLAY PROTECTION (see docs/PHASE_2B_CONTRACT.md)
 * ------------------------------------------------
 *  - EIP-712 domain binds name, version, chainId (6281971) and this contract
 *    address => no cross-chain and no cross-contract replay.
 *  - attestation.player is signed and `msg.sender == player` is enforced
 *    => wallet A's attestation is unusable by wallet B.
 *  - Strictly increasing per-player nonce => an old attestation can never be
 *    resubmitted, even if the runId mapping were somehow cleared.
 *  - One-shot run key `keccak256(player, runId)` => the same authorized run
 *    cannot be processed twice even if the backend re-signs it with a fresh
 *    nonce. The key is bound to the player so one wallet can never burn (grief)
 *    another wallet's runId, while two players may legitimately share a raw
 *    runId value.
 *  Both mechanisms are kept: the nonce gives cheap monotonic ordering, the run
 *  key gives idempotency for backend retries. Neither alone covers both cases.
 *
 * NONCE LIVENESS (operational requirement)
 * ----------------------------------------
 * Nonces are strict-equality. The backend MUST read `nonces(player)` from this
 * contract immediately before signing and must never keep its own counter. An
 * unsubmitted attestation simply expires: it consumed nothing on-chain, so the
 * next attestation signed at the current on-chain nonce succeeds. A wallet can
 * therefore never be bricked by a lost or expired attestation.
 *
 * PAUSE SEMANTICS
 * ---------------
 * pause() stops NEW submissions only. Already-accrued entitlements remain
 * claimable while paused: the admin must never be able to freeze funds that are
 * already owed to players.
 *
 * NON-UPGRADEABLE. There is no proxy and no upgrade path by design.
 */
contract StreetsOfGainsRewards is Ownable2Step, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct RunAttestation {
        address player; // wallet allowed to submit (must equal msg.sender)
        uint256 score; // final run score
        uint32 wave; // highest wave reached
        uint16 level; // level reached
        bytes32 runId; // unique backend run identifier (one-shot)
        uint256 nonce; // must equal nonces[player]
        uint256 deadline; // unix seconds, inclusive
        uint256 rewardAmount; // reward authorized for this run (may be 0)
    }

    bytes32 public constant RUN_ATTESTATION_TYPEHASH = keccak256(
        "RunAttestation(address player,uint256 score,uint32 wave,uint16 level,bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)"
    );

    // ---------------------------------------------------------------------
    // Immutable configuration
    // ---------------------------------------------------------------------

    /// @notice Reward token (testnet WDOGE). Immutable by design.
    IERC20 public immutable rewardToken;

    /// @notice Epoch length in seconds (V1: 1 day). Immutable by design.
    uint256 public immutable epochLength;

    /// @notice Timestamp of epoch 0. Immutable by design.
    uint256 public immutable epochGenesis;

    /// @dev Hard ceilings that admin-configurable caps can never exceed.
    uint256 public constant HARD_MAX_REWARD_PER_RUN = 1_000e18;
    uint256 public constant HARD_MAX_REWARD_PER_WALLET_EPOCH = 10_000e18;
    uint256 public constant HARD_MAX_REWARD_POOL_EPOCH = 1_000_000e18;

    // ---------------------------------------------------------------------
    // Mutable state
    // ---------------------------------------------------------------------

    /// @notice Backend attestation signer (rotatable by owner).
    address public signer;

    uint256 public maxRewardPerRun;
    uint256 public maxRewardPerWalletPerEpoch;
    uint256 public maxRewardPoolPerEpoch;

    mapping(address => uint256) public bestScore;
    mapping(address => uint32) public bestWave;
    mapping(address => uint256) public nonces;
    /// @notice One-shot processed-run flags, keyed by keccak256(player, runId).
    /// @dev Bound to the player so a raw runId can never be griefed across wallets.
    mapping(bytes32 => bool) public runProcessed;

    /// @notice Reward accrued to a wallet within an epoch.
    mapping(address => mapping(uint256 => uint256)) public epochPaid;
    /// @notice Reward accrued across all wallets within an epoch.
    mapping(uint256 => uint256) public epochPoolUsed;

    /// @notice Unclaimed entitlement per player.
    mapping(address => uint256) public pendingRewards;
    /// @notice Sum of all unclaimed entitlements (protects recovery accounting).
    uint256 public totalEntitled;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event RunSubmitted(
        address indexed player,
        bytes32 indexed runId,
        uint256 score,
        uint32 wave,
        uint16 level,
        uint256 rewardAmount,
        uint256 epoch
    );
    event PersonalBest(address indexed player, uint256 score, uint32 wave);
    event RewardAccrued(address indexed player, uint256 amount, uint256 pending);
    event RewardClaimed(address indexed player, uint256 amount);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);
    event RewardLimitsUpdated(uint256 maxPerRun, uint256 maxPerWalletEpoch, uint256 maxPoolEpoch);
    event UnentitledRecovered(address indexed to, uint256 amount);
    event ForeignTokenRecovered(address indexed token, address indexed to, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error InvalidEpochLength();
    error InvalidLimits();
    error NotPlayer();
    error AttestationExpired();
    error BadNonce();
    error RunAlreadyProcessed();
    error InvalidSignature();
    error RewardExceedsRunCap();
    error RewardExceedsWalletEpochCap();
    error RewardExceedsEpochPool();
    error NothingToClaim();
    error InsufficientRewardBalance();
    error NothingRecoverable();
    error CannotRecoverRewardToken();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(
        address initialOwner,
        address rewardToken_,
        address signer_,
        uint256 epochLength_,
        uint256 maxRewardPerRun_,
        uint256 maxRewardPerWalletPerEpoch_,
        uint256 maxRewardPoolPerEpoch_
    ) Ownable(initialOwner) EIP712("StreetsOfGainsRewards", "1") {
        if (rewardToken_ == address(0) || signer_ == address(0)) revert ZeroAddress();
        if (epochLength_ < 1 hours || epochLength_ > 30 days) revert InvalidEpochLength();

        rewardToken = IERC20(rewardToken_);
        signer = signer_;
        epochLength = epochLength_;
        epochGenesis = block.timestamp;

        _setRewardLimits(maxRewardPerRun_, maxRewardPerWalletPerEpoch_, maxRewardPoolPerEpoch_);
        emit SignerUpdated(address(0), signer_);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function currentEpoch() public view returns (uint256) {
        return (block.timestamp - epochGenesis) / epochLength;
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function hashAttestation(RunAttestation calldata a) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    RUN_ATTESTATION_TYPEHASH,
                    a.player,
                    a.score,
                    a.wave,
                    a.level,
                    a.runId,
                    a.nonce,
                    a.deadline,
                    a.rewardAmount
                )
            )
        );
    }

    /// @notice Reward tokens held by the contract that are not already owed to players.
    function unentitledBalance() public view returns (uint256) {
        uint256 bal = rewardToken.balanceOf(address(this));
        return bal > totalEntitled ? bal - totalEntitled : 0;
    }

    // ---------------------------------------------------------------------
    // PLAYER POWERS
    // ---------------------------------------------------------------------

    /**
     * @notice Submit a backend-signed run result. Accrues (does not transfer) reward.
     * @dev Callable only by the attested player. No external calls are made here.
     */
    function submitRun(RunAttestation calldata a, bytes calldata signature) external whenNotPaused {
        if (msg.sender != a.player) revert NotPlayer();
        if (a.player == address(0)) revert ZeroAddress();
        if (block.timestamp > a.deadline) revert AttestationExpired();
        if (a.nonce != nonces[a.player]) revert BadNonce();

        bytes32 runKey = keccak256(abi.encode(a.player, a.runId));
        if (runProcessed[runKey]) revert RunAlreadyProcessed();

        address recovered = ECDSA.recover(hashAttestation(a), signature);
        if (recovered != signer) revert InvalidSignature();

        // Effects
        nonces[a.player] = a.nonce + 1;
        runProcessed[runKey] = true;

        uint256 epoch = currentEpoch();

        if (a.rewardAmount != 0) {
            if (a.rewardAmount > maxRewardPerRun) revert RewardExceedsRunCap();

            uint256 walletEpoch = epochPaid[a.player][epoch] + a.rewardAmount;
            if (walletEpoch > maxRewardPerWalletPerEpoch) revert RewardExceedsWalletEpochCap();

            uint256 poolEpoch = epochPoolUsed[epoch] + a.rewardAmount;
            if (poolEpoch > maxRewardPoolPerEpoch) revert RewardExceedsEpochPool();

            epochPaid[a.player][epoch] = walletEpoch;
            epochPoolUsed[epoch] = poolEpoch;

            uint256 pending = pendingRewards[a.player] + a.rewardAmount;
            pendingRewards[a.player] = pending;
            totalEntitled += a.rewardAmount;

            emit RewardAccrued(a.player, a.rewardAmount, pending);
        }

        bool newBest;
        if (a.score > bestScore[a.player]) {
            bestScore[a.player] = a.score;
            newBest = true;
        }
        if (a.wave > bestWave[a.player]) {
            bestWave[a.player] = a.wave;
            newBest = true;
        }
        if (newBest) emit PersonalBest(a.player, bestScore[a.player], bestWave[a.player]);

        emit RunSubmitted(a.player, a.runId, a.score, a.wave, a.level, a.rewardAmount, epoch);
    }

    /// @notice Claim the caller's full accrued entitlement.
    function claimReward() external nonReentrant whenNotPaused returns (uint256 amount) {
        amount = pendingRewards[msg.sender];
        if (amount == 0) revert NothingToClaim();
        if (rewardToken.balanceOf(address(this)) < amount) revert InsufficientRewardBalance();

        pendingRewards[msg.sender] = 0;
        totalEntitled -= amount;

        rewardToken.safeTransfer(msg.sender, amount);
        emit RewardClaimed(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // ADMIN POWERS (owner, two-step transferable)
    //  - rotate the attestation signer
    //  - pause / unpause submissions and claims
    //  - tighten/loosen reward caps inside hard-coded ceilings
    //  - withdraw only tokens NOT already owed to players
    //  - rescue unrelated ERC-20s sent by mistake
    // The owner can NOT: mint entitlements, take players' accrued rewards,
    // change the reward token, change the epoch length, or upgrade the contract.
    // ---------------------------------------------------------------------

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerUpdated(signer, newSigner);
        signer = newSigner;
    }

    function setRewardLimits(uint256 maxPerRun, uint256 maxPerWalletEpoch, uint256 maxPoolEpoch)
        external
        onlyOwner
    {
        _setRewardLimits(maxPerRun, maxPerWalletEpoch, maxPoolEpoch);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function recoverUnentitled(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0 || amount > unentitledBalance()) revert NothingRecoverable();
        rewardToken.safeTransfer(to, amount);
        emit UnentitledRecovered(to, amount);
    }

    function recoverForeignToken(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(rewardToken)) revert CannotRecoverRewardToken();
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit ForeignTokenRecovered(token, to, amount);
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _setRewardLimits(uint256 maxPerRun, uint256 maxPerWalletEpoch, uint256 maxPoolEpoch) internal {
        if (
            maxPerRun == 0 || maxPerWalletEpoch == 0 || maxPoolEpoch == 0 || maxPerRun > maxPerWalletEpoch
                || maxPerWalletEpoch > maxPoolEpoch || maxPerRun > HARD_MAX_REWARD_PER_RUN
                || maxPerWalletEpoch > HARD_MAX_REWARD_PER_WALLET_EPOCH || maxPoolEpoch > HARD_MAX_REWARD_POOL_EPOCH
        ) revert InvalidLimits();

        maxRewardPerRun = maxPerRun;
        maxRewardPerWalletPerEpoch = maxPerWalletEpoch;
        maxRewardPoolPerEpoch = maxPoolEpoch;
        emit RewardLimitsUpdated(maxPerRun, maxPerWalletEpoch, maxPoolEpoch);
    }
}
