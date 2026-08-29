/**
 * Deterministic, auditable reward calculation.
 *
 * The BROWSER NEVER CHOOSES `rewardAmount`. This is the single source of truth
 * for how a validated run maps to a WDOGE amount (wei).
 *
 * Model: milestone-based on waves reached, with a small score bonus, hard
 * clamped to the configured per-run cap (default 10 WDOGE, matching
 * contracts/script/Deploy.s.sol MAX_REWARD_PER_RUN).
 */

const WAD = 10n ** 18n;

/** wave threshold -> base reward in wei. Evaluated highest-first. */
export const WAVE_MILESTONES: ReadonlyArray<{ wave: number; wei: bigint }> = [
  { wave: 30, wei: 8n * WAD },
  { wave: 25, wei: 6n * WAD },
  { wave: 20, wei: 45n * WAD / 10n },
  { wave: 15, wei: 3n * WAD },
  { wave: 10, wei: 2n * WAD },
  { wave: 5, wei: 1n * WAD },
  { wave: 3, wei: WAD / 2n },
];

/** Score bonus: +0.1 WDOGE per full 20,000 points, capped at 2 WDOGE. */
export const SCORE_BONUS_STEP = 20_000;
export const SCORE_BONUS_PER_STEP_WEI = WAD / 10n;
export const SCORE_BONUS_CAP_WEI = 2n * WAD;

export interface RewardInput {
  score: number;
  wave: number;
  level: number;
  difficulty?: number;
}

export interface RewardContext {
  maxRewardPerRunWei: bigint;
  /** Reward already authorized for this wallet in the current epoch. */
  walletEpochUsedWei: bigint;
  maxRewardPerWalletEpochWei: bigint;
  /** Reward already authorized across all wallets in the current epoch. */
  poolEpochUsedWei: bigint;
  maxRewardPoolEpochWei: bigint;
}

/** Base entitlement before any caps are applied. */
export function baseRewardWei(input: RewardInput): bigint {
  const milestone = WAVE_MILESTONES.find((m) => input.wave >= m.wave);
  if (!milestone) return 0n;

  const steps = BigInt(Math.floor(Math.max(0, input.score) / SCORE_BONUS_STEP));
  let bonus = steps * SCORE_BONUS_PER_STEP_WEI;
  if (bonus > SCORE_BONUS_CAP_WEI) bonus = SCORE_BONUS_CAP_WEI;

  return milestone.wei + bonus;
}

export interface RewardResult {
  /** Final authorizable amount in wei (may be 0 — a 0-reward run is still recordable). */
  rewardWei: bigint;
  /** Why the raw amount was reduced, if it was. */
  cappedBy: "none" | "run" | "wallet-epoch" | "pool-epoch";
}

/**
 * Apply per-run, per-wallet-per-epoch and per-epoch-pool ceilings so the
 * backend never signs an attestation that would predictably revert on-chain.
 */
export function calculateReward(input: RewardInput, ctx: RewardContext): RewardResult {
  let amount = baseRewardWei(input);
  let cappedBy: RewardResult["cappedBy"] = "none";

  if (amount > ctx.maxRewardPerRunWei) {
    amount = ctx.maxRewardPerRunWei;
    cappedBy = "run";
  }

  const walletHeadroom = ctx.maxRewardPerWalletEpochWei > ctx.walletEpochUsedWei
    ? ctx.maxRewardPerWalletEpochWei - ctx.walletEpochUsedWei
    : 0n;
  if (amount > walletHeadroom) {
    amount = walletHeadroom;
    cappedBy = "wallet-epoch";
  }

  const poolHeadroom = ctx.maxRewardPoolEpochWei > ctx.poolEpochUsedWei
    ? ctx.maxRewardPoolEpochWei - ctx.poolEpochUsedWei
    : 0n;
  if (amount > poolHeadroom) {
    amount = poolHeadroom;
    cappedBy = "pool-epoch";
  }

  if (amount < 0n) amount = 0n;
  return { rewardWei: amount, cappedBy };
}
