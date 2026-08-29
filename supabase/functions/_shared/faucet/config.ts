/**
 * tWALDOGE testnet faucet — server-side configuration.
 *
 * tWALDOGE ("Waldoge Testnet") is a WORTHLESS TESTNET TOKEN. It exists only on
 * the DogeOS Chikyu testnet (chain id 6281971). It has no price, no backing,
 * no redemption value and is not an investment.
 *
 * SECURITY / SCOPE:
 *  - This module is completely independent of the Streets of Gains reward
 *    system. It never reads SOG_* reward secrets and never signs attestations.
 *  - Every value here is server-controlled. Nothing is taken from the browser.
 *  - Fails closed: with missing or invalid configuration, no mint may happen.
 *  - Dependency-free so it can be unit-tested with vitest and imported by Deno.
 */

/** DogeOS Chikyu testnet. The faucet refuses to operate on any other chain. */
export const FAUCET_CHAIN_ID = 6281971;
export const FAUCET_RPC_URL = "https://rpc.testnet.dogeos.com";

const WAD = 10n ** 18n;

/** Hard ceiling per claim. Env may only lower this, never raise it. */
export const MAX_FAUCET_AMOUNT_WEI = 100n * WAD; // 100 tWALDOGE
export const DEFAULT_FAUCET_AMOUNT_WEI = MAX_FAUCET_AMOUNT_WEI;

/** One claim per wallet per 24 hours. Env may only lengthen the cooldown. */
export const MIN_CLAIM_COOLDOWN_SECONDS = 24 * 60 * 60;

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isFaucetAddress(value: unknown): value is string {
  return typeof value === "string" && ADDRESS_RE.test(value.trim());
}

/** Lowercase a syntactically valid, non-zero address; otherwise null. */
export function normalizeRecipient(value: unknown): string | null {
  if (!isFaucetAddress(value)) return null;
  const lower = value.trim().toLowerCase();
  return lower === ZERO_ADDRESS ? null : lower;
}

export interface FaucetConfig {
  tokenAddress: string;
  minterAddress: string;
  chainId: number;
  amountWei: bigint;
  cooldownSeconds: number;
}

export type FaucetConfigResult =
  | { ok: true; config: FaucetConfig }
  | { ok: false; error: string };

function parseAmount(raw: string | undefined): bigint {
  if (!raw) return DEFAULT_FAUCET_AMOUNT_WEI;
  let value: bigint;
  try {
    value = BigInt(raw.trim());
  } catch {
    return DEFAULT_FAUCET_AMOUNT_WEI;
  }
  if (value <= 0n) return DEFAULT_FAUCET_AMOUNT_WEI;
  // Env may only tighten the per-claim ceiling.
  return value > MAX_FAUCET_AMOUNT_WEI ? MAX_FAUCET_AMOUNT_WEI : value;
}

function parseCooldown(raw: string | undefined): number {
  if (!raw) return MIN_CLAIM_COOLDOWN_SECONDS;
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return MIN_CLAIM_COOLDOWN_SECONDS;
  }
  return Math.max(value, MIN_CLAIM_COOLDOWN_SECONDS);
}

/**
 * Resolve faucet configuration from env. Fails closed on anything missing,
 * malformed, zero-addressed or off-chain-id.
 *
 * Public (non-secret) variables:
 *   TWALDOGE_TOKEN_ADDRESS   deployed WaldogeTestnetToken address
 *   TWALDOGE_MINTER_ADDRESS  public address of the faucet minter EOA
 *   TWALDOGE_CHAIN_ID        must be 6281971 when present
 * Optional tightening:
 *   TWALDOGE_FAUCET_AMOUNT_WEI, TWALDOGE_FAUCET_COOLDOWN_SECONDS
 */
export function resolveFaucetConfig(
  env: Record<string, string | undefined>,
): FaucetConfigResult {
  const tokenAddress = normalizeRecipient(env.TWALDOGE_TOKEN_ADDRESS);
  if (!tokenAddress) {
    return {
      ok: false,
      error:
        "tWALDOGE faucet is not configured on this environment (WaldogeTestnetToken is not deployed yet).",
    };
  }

  const minterAddress = normalizeRecipient(env.TWALDOGE_MINTER_ADDRESS);
  if (!minterAddress) {
    return { ok: false, error: "faucet minter is not configured" };
  }

  if (minterAddress === tokenAddress) {
    return { ok: false, error: "faucet configuration error" };
  }

  // The faucet authority must be distinct from the SOG owner/signer.
  for (const foreign of [env.SOG_EXPECTED_SIGNER_ADDRESS, env.SOG_OWNER_ADDRESS]) {
    if (isFaucetAddress(foreign) && foreign.trim().toLowerCase() === minterAddress) {
      return { ok: false, error: "faucet configuration error" };
    }
  }

  const rawChainId = env.TWALDOGE_CHAIN_ID?.trim();
  const chainId = rawChainId ? Number(rawChainId) : FAUCET_CHAIN_ID;
  if (!Number.isInteger(chainId) || chainId !== FAUCET_CHAIN_ID) {
    return {
      ok: false,
      error: `faucet is restricted to DogeOS Chikyu testnet (chain id ${FAUCET_CHAIN_ID})`,
    };
  }

  return {
    ok: true,
    config: {
      tokenAddress,
      minterAddress,
      chainId,
      amountWei: parseAmount(env.TWALDOGE_FAUCET_AMOUNT_WEI),
      cooldownSeconds: parseCooldown(env.TWALDOGE_FAUCET_COOLDOWN_SECONDS),
    },
  };
}
