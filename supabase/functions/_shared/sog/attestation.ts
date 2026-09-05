/**
 * EIP-712 attestation construction for StreetsOfGainsRewards.
 *
 * The struct below MUST exactly match the Solidity type:
 *   RunAttestation(address player,uint256 score,uint32 wave,uint16 level,
 *                  bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)
 * Field ordering is load-bearing — do not reorder, add or remove fields.
 *
 * Dependency-free (WebCrypto only) so it runs under Deno and vitest alike.
 */
import {
  ATTESTATION_TTL_SECONDS,
  DOGEOS_CHAIN_ID,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
} from "./config.ts";

export const RUN_ATTESTATION_PRIMARY_TYPE = "RunAttestation" as const;

export const RUN_ATTESTATION_TYPES = {
  RunAttestation: [
    { name: "player", type: "address" },
    { name: "score", type: "uint256" },
    { name: "wave", type: "uint32" },
    { name: "level", type: "uint16" },
    { name: "runId", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "rewardAmount", type: "uint256" },
  ],
} as const;

export interface RunAttestation {
  player: string;
  score: bigint;
  wave: number;
  level: number;
  runId: string;
  nonce: bigint;
  deadline: bigint;
  rewardAmount: bigint;
}

export function eip712Domain(verifyingContract: string) {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId: DOGEOS_CHAIN_ID,
    verifyingContract,
  } as const;
}

function toHex(bytes: Uint8Array): string {
  let out = "0x";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Cryptographically strong 32-byte run identifier. Never timestamp-derived. */
export function generateRunId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/**
 * Collision-resistant identity of one *logical* completed run.
 *
 * SECURITY (H-2 remediation): this key is derived ONLY from data intrinsic to
 * the finished run — the authenticated wallet plus the run fingerprint,
 * including the client-reported run start timestamp, which is a property of
 * the run itself and never the server's submission clock. The same completed
 * run therefore yields the same key hours or days later, so the
 * (wallet, client_run_key) unique index rejects every replay. The wallet is
 * mixed in first, so wallet A's key can never collide with wallet B's.
 *
 * Do NOT reintroduce Date.now(), minute buckets or any submission-time value.
 */
export interface RunFingerprint {
  score: number;
  wave: number;
  level: number;
  durationMs: number;
  difficulty: number;
  /** Run start time reported by the client; intrinsic to the run. */
  startedAt: number;
}

export async function deriveLogicalRunKey(
  wallet: string,
  run: RunFingerprint,
): Promise<string> {
  const material = [
    "sog-run-v2",
    wallet.toLowerCase(),
    run.startedAt,
    run.durationMs,
    run.score,
    run.wave,
    run.level,
    run.difficulty,
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return toHex(new Uint8Array(digest));
}

/** Server-generated deadline. Never accepted from the browser. */
export function computeDeadline(nowSeconds: number = Math.floor(Date.now() / 1000)): bigint {
  return BigInt(nowSeconds + ATTESTATION_TTL_SECONDS);
}

/** Assemble the attestation from server-controlled values only. */
export function buildAttestation(params: {
  player: string;
  score: number;
  wave: number;
  level: number;
  runId: string;
  nonce: bigint;
  deadline: bigint;
  rewardAmount: bigint;
}): RunAttestation {
  return {
    player: params.player,
    score: BigInt(params.score),
    wave: params.wave,
    level: params.level,
    runId: params.runId,
    nonce: params.nonce,
    deadline: params.deadline,
    rewardAmount: params.rewardAmount,
  };
}

/** JSON-safe form for API responses (bigints as decimal strings). */
export function serializeAttestation(a: RunAttestation) {
  return {
    player: a.player,
    score: a.score.toString(),
    wave: a.wave,
    level: a.level,
    runId: a.runId,
    nonce: a.nonce.toString(),
    deadline: a.deadline.toString(),
    rewardAmount: a.rewardAmount.toString(),
  };
}
