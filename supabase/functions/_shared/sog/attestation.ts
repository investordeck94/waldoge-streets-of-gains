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
 * Collision-resistant key for one *logical* run, derived server-side from the
 * run fingerprint. Used only for backend duplicate detection — the on-chain
 * replay key remains keccak256(player, runId).
 */
export async function deriveLogicalRunKey(
  wallet: string,
  run: { score: number; wave: number; level: number; durationMs: number },
  startedAtBucket: number,
): Promise<string> {
  const material = [
    wallet.toLowerCase(),
    run.score,
    run.wave,
    run.level,
    run.durationMs,
    startedAtBucket,
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
