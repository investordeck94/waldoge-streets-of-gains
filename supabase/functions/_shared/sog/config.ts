/**
 * Streets of Gains reward backend — server-side configuration.
 *
 * SECURITY: every value here is server-controlled. Chain id, RPC URL, contract
 * address, signer and reward caps are NEVER accepted from the browser.
 *
 * This module is intentionally dependency-free so it can be unit-tested with
 * vitest as well as imported by Deno edge functions.
 */

/** DogeOS Chikyu testnet — must match src/lib/chains/dogeos.ts (Phase 2A). */
export const DOGEOS_CHAIN_ID = 6281971;
export const DOGEOS_CHAIN_ID_HEX = "0x5FDAF3";
export const DOGEOS_RPC_URL = "https://rpc.testnet.dogeos.com";

/** EIP-712 domain of StreetsOfGainsRewards. Must match the Solidity contract. */
export const EIP712_DOMAIN_NAME = "StreetsOfGainsRewards";
export const EIP712_DOMAIN_VERSION = "1";

/**
 * Attestation lifetime. Deliberately short: the player is expected to submit
 * the transaction immediately after finishing a run. The contract permits
 * long deadlines; the backend must not mint long-lived authorizations.
 */
export const ATTESTATION_TTL_SECONDS = 900; // 15 minutes

/** Wallet-ownership challenge lifetime. */
export const CHALLENGE_TTL_SECONDS = 300; // 5 minutes

/** Wallet session lifetime. */
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

const WAD = 10n ** 18n;

/**
 * Operational caps. These mirror contracts/script/Deploy.s.sol so the backend
 * does not predictably mint attestations that would revert on-chain. They can
 * be tightened (never loosened past these values) via env.
 */
export const DEFAULT_MAX_REWARD_PER_RUN_WEI = 10n * WAD; // 10 WDOGE
export const DEFAULT_MAX_REWARD_PER_WALLET_EPOCH_WEI = 50n * WAD; // 50 WDOGE / day
export const DEFAULT_MAX_REWARD_POOL_EPOCH_WEI = 1000n * WAD; // 1,000 WDOGE / day

/** Max reward authorizations a single wallet may request per hour. */
export const RATE_LIMIT_RUNS_PER_HOUR = 12;

export interface RewardLimits {
  maxRewardPerRunWei: bigint;
  maxRewardPerWalletEpochWei: bigint;
  maxRewardPoolEpochWei: bigint;
}

function parseWei(raw: string | undefined, fallback: bigint, ceiling: bigint): bigint {
  if (!raw) return fallback;
  let value: bigint;
  try {
    value = BigInt(raw.trim());
  } catch {
    return fallback;
  }
  if (value < 0n) return fallback;
  // Env may only tighten a cap, never raise it above the deploy-time value.
  return value > ceiling ? ceiling : value;
}

/** Resolve reward caps from env, clamped to the deploy-time defaults. */
export function resolveRewardLimits(env: Record<string, string | undefined>): RewardLimits {
  return {
    maxRewardPerRunWei: parseWei(
      env.SOG_MAX_REWARD_PER_RUN_WEI,
      DEFAULT_MAX_REWARD_PER_RUN_WEI,
      DEFAULT_MAX_REWARD_PER_RUN_WEI,
    ),
    maxRewardPerWalletEpochWei: parseWei(
      env.SOG_MAX_REWARD_PER_WALLET_EPOCH_WEI,
      DEFAULT_MAX_REWARD_PER_WALLET_EPOCH_WEI,
      DEFAULT_MAX_REWARD_PER_WALLET_EPOCH_WEI,
    ),
    maxRewardPoolEpochWei: parseWei(
      env.SOG_MAX_REWARD_POOL_EPOCH_WEI,
      DEFAULT_MAX_REWARD_POOL_EPOCH_WEI,
      DEFAULT_MAX_REWARD_POOL_EPOCH_WEI,
    ),
  };
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isAddress(value: unknown): value is string {
  return typeof value === "string" && ADDRESS_RE.test(value.trim());
}

export function normalizeAddress(value: unknown): string | null {
  return isAddress(value) ? value.trim().toLowerCase() : null;
}

export interface ContractConfigResult {
  ok: boolean;
  contractAddress?: string;
  expectedSigner?: string | null;
  error?: string;
}

/**
 * Resolve the deployed contract address + optional expected signer address.
 * Fails closed: with no configured contract, no attestation may be produced.
 */
export function resolveContractConfig(
  env: Record<string, string | undefined>,
): ContractConfigResult {
  const contractAddress = normalizeAddress(env.SOG_REWARDS_CONTRACT_ADDRESS);
  if (!contractAddress) {
    return {
      ok: false,
      error:
        "Rewards contract is not configured on this environment (StreetsOfGainsRewards is not deployed yet).",
    };
  }
  const expectedSignerRaw = env.SOG_EXPECTED_SIGNER_ADDRESS;
  if (expectedSignerRaw && !isAddress(expectedSignerRaw)) {
    return { ok: false, error: "Signer configuration error." };
  }
  return {
    ok: true,
    contractAddress,
    expectedSigner: expectedSignerRaw ? normalizeAddress(expectedSignerRaw) : null,
  };
}

/** Max server-authorized run starts per wallet per hour (audit H-1). */
export const RATE_LIMIT_RUN_STARTS_PER_HOUR = 20;

/** Max SIWE challenges a single wallet may request per hour (audit M-5). */
export const RATE_LIMIT_CHALLENGES_PER_HOUR = 20;

/** Max SIWE challenges a single client IP may request per hour (audit M-5). */
export const RATE_LIMIT_CHALLENGES_PER_IP_HOUR = 60;

/** Hard ceiling on leaderboard rows returned to any caller. */
export const LEADERBOARD_MAX_ENTRIES = 25;
