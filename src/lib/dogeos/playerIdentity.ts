/**
 * DogeOS player identity for Streets of Gains — Phase 1B.
 *
 * Pure, dependency-free helpers that map a connected DogeOS EVM address to a
 * local player identity. Completely separate from:
 *   - GameState / GameState.wallet (the in-game economy: score/coins/bank)
 *   - the game-state persistence envelope + migrations
 *   - Solana wallet storage, usage tracking, and balance storage
 *
 * Nothing here performs RPC or network calls, and nothing here is referenced
 * by the game loop, rendering, camera, physics, collision, or input code.
 */

export const DOGEOS_PLAYER_STORAGE_KEY = "waldoge.streetsOfGains.dogeosPlayer.v1";

export const DOGEOS_PLAYER_IDENTITY_VERSION = 1 as const;

export interface DogeOSPlayerIdentity {
  /** Schema version for this dedicated identity record. */
  version: typeof DOGEOS_PLAYER_IDENTITY_VERSION;
  /** Normalized (lowercase) EVM address — the stable player identifier. */
  playerId: string;
  /** Address exactly as reported by the wallet (display only). */
  displayAddress: string;
  /** Epoch ms when this identity was first stored. */
  firstSeenAt: number;
  /** Epoch ms when this identity was last made active. */
  lastSeenAt: number;
}

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** True when the string looks like a well-formed EVM address. */
export function isEvmAddress(address: unknown): address is string {
  return typeof address === "string" && EVM_ADDRESS_RE.test(address.trim());
}

/** Lowercased address, or null when the input is not a valid EVM address. */
export function normalizeAddress(address: unknown): string | null {
  if (!isEvmAddress(address)) return null;
  return address.trim().toLowerCase();
}

/**
 * Derive an identity record from a connected address.
 * `previous` is used to preserve `firstSeenAt` when the same player returns.
 */
export function deriveIdentity(
  address: unknown,
  previous?: DogeOSPlayerIdentity | null,
  now: number = Date.now(),
): DogeOSPlayerIdentity | null {
  const playerId = normalizeAddress(address);
  if (!playerId) return null;
  const keepFirstSeen =
    previous && previous.playerId === playerId ? previous.firstSeenAt : now;
  return {
    version: DOGEOS_PLAYER_IDENTITY_VERSION,
    playerId,
    displayAddress: (address as string).trim(),
    firstSeenAt: keepFirstSeen,
    lastSeenAt: now,
  };
}

function isIdentityRecord(value: unknown): value is DogeOSPlayerIdentity {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DogeOSPlayerIdentity>;
  return (
    v.version === DOGEOS_PLAYER_IDENTITY_VERSION &&
    typeof v.playerId === "string" &&
    EVM_ADDRESS_RE.test(v.playerId) &&
    typeof v.displayAddress === "string" &&
    typeof v.firstSeenAt === "number" &&
    typeof v.lastSeenAt === "number"
  );
}

/** Read the stored identity, or null when absent/invalid/unavailable. */
export function readStoredIdentity(): DogeOSPlayerIdentity | null {
  try {
    const raw = localStorage.getItem(DOGEOS_PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isIdentityRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist the identity. Returns the identity for convenience. */
export function storeIdentity(identity: DogeOSPlayerIdentity): DogeOSPlayerIdentity {
  try {
    localStorage.setItem(DOGEOS_PLAYER_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    /* storage unavailable — identity stays in-memory only */
  }
  return identity;
}

/** Remove the stored identity (called on disconnect). */
export function clearStoredIdentity(): void {
  try {
    localStorage.removeItem(DOGEOS_PLAYER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
