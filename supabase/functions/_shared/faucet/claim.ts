/**
 * tWALDOGE faucet claim engine — pure orchestration, no runtime dependencies.
 *
 * All I/O (database, chain) is injected so the full policy can be unit-tested.
 * The engine never sees a private key: the injected `mint` function owns that.
 *
 * Policy:
 *  - recipient must be a syntactically valid, non-zero address
 *  - configuration must be complete and on chain id 6281971, else fail closed
 *  - one successful claim per wallet per cooldown window (default 24h)
 *  - only one in-flight (pending) claim per wallet — duplicate/concurrent
 *    requests are rejected by the store's unique pending constraint
 *  - the mint amount is always the server-configured amount; a client-supplied
 *    amount is ignored entirely and can never raise the per-claim ceiling
 */
import {
  MAX_FAUCET_AMOUNT_WEI,
  normalizeRecipient,
  resolveFaucetConfig,
  type FaucetConfig,
} from "./config.ts";

export interface ClaimRecord {
  id: string;
  createdAt: number;
}

export interface FaucetStore {
  /** Most recent SUCCESSFUL claim for this wallet, or null. */
  findLastSuccess(wallet: string): Promise<ClaimRecord | null>;
  /**
   * Insert a `pending` claim row. MUST return null when a pending row for the
   * wallet already exists (enforced by a unique index, not a read-then-write).
   */
  openPendingClaim(wallet: string, amountWei: bigint): Promise<ClaimRecord | null>;
  markSuccess(id: string, txHash: string): Promise<void>;
  markFailure(id: string, reason: string): Promise<void>;
}

export interface FaucetMinter {
  /** Send the mint transaction. Returns the tx hash. Throws on failure. */
  mint(to: string, amountWei: bigint): Promise<string>;
}

export interface ClaimDeps {
  store: FaucetStore;
  minter: FaucetMinter;
  now?: () => number;
}

export type ClaimResult =
  | {
    ok: true;
    status: 200;
    wallet: string;
    amountWei: string;
    txHash: string;
    chainId: number;
    tokenAddress: string;
  }
  | { ok: false; status: number; error: string; retryAfterSeconds?: number };

export async function processFaucetClaim(
  env: Record<string, string | undefined>,
  recipientInput: unknown,
  deps: ClaimDeps,
): Promise<ClaimResult> {
  const now = deps.now ?? (() => Date.now());

  // 1. Address validation (rejects malformed AND the zero address).
  const wallet = normalizeRecipient(recipientInput);
  if (!wallet) return { ok: false, status: 400, error: "invalid recipient address" };

  // 2. Configuration — fail closed.
  const configResult = resolveFaucetConfig(env);
  if (!configResult.ok) return { ok: false, status: 503, error: configResult.error };
  const config: FaucetConfig = configResult.config;

  // Defence in depth: the engine itself refuses to exceed the hard ceiling.
  if (config.amountWei <= 0n || config.amountWei > MAX_FAUCET_AMOUNT_WEI) {
    return { ok: false, status: 503, error: "faucet configuration error" };
  }

  // 3. Cooldown.
  const last = await deps.store.findLastSuccess(wallet);
  if (last) {
    const elapsed = Math.floor((now() - last.createdAt) / 1000);
    if (elapsed < config.cooldownSeconds) {
      return {
        ok: false,
        status: 429,
        error: "faucet cooldown active for this wallet",
        retryAfterSeconds: config.cooldownSeconds - elapsed,
      };
    }
  }

  // 4. Claim the single pending slot (duplicate/concurrent protection).
  const pending = await deps.store.openPendingClaim(wallet, config.amountWei);
  if (!pending) {
    return { ok: false, status: 409, error: "a faucet claim for this wallet is already in progress" };
  }

  // 5. Mint. Any failure is recorded so it does not consume the cooldown.
  let txHash: string;
  try {
    txHash = await deps.minter.mint(wallet, config.amountWei);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    await deps.store.markFailure(pending.id, reason);
    return { ok: false, status: 502, error: "faucet mint transaction failed" };
  }

  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    await deps.store.markFailure(pending.id, "invalid transaction hash");
    return { ok: false, status: 502, error: "faucet mint transaction failed" };
  }

  await deps.store.markSuccess(pending.id, txHash);

  return {
    ok: true,
    status: 200,
    wallet,
    amountWei: config.amountWei.toString(),
    txHash,
    chainId: config.chainId,
    tokenAddress: config.tokenAddress,
  };
}
