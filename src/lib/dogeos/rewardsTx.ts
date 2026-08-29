/**
 * Minimal, dependency-free ABI encoder for
 *   StreetsOfGainsRewards.submitRun(RunAttestation,bytes)
 *
 * Written by hand so the game bundle gains no web3 dependency (Phase 1A rule).
 * The selector is asserted against viem in a unit test.
 *
 * The attestation and signature are produced by the backend and passed through
 * untouched — the frontend never constructs reward data itself.
 */

/** keccak("submitRun((address,uint256,uint32,uint16,bytes32,uint256,uint256,uint256),bytes)")[0..4] */
export const SUBMIT_RUN_SELECTOR = "0x71f59c37";

export interface SerializedAttestation {
  player: string;
  score: string;
  wave: number;
  level: number;
  runId: string;
  nonce: string;
  deadline: string;
  rewardAmount: string;
}

function word(value: bigint): string {
  if (value < 0n) throw new Error("negative value");
  return value.toString(16).padStart(64, "0");
}

function addressWord(address: string): string {
  const clean = address.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{40}$/.test(clean)) throw new Error("invalid address");
  return clean.padStart(64, "0");
}

function bytes32Word(value: string): string {
  const clean = value.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error("invalid bytes32");
  return clean;
}

/** Right-padded dynamic `bytes` encoding (length word + padded payload). */
function bytesTail(value: string): string {
  const clean = value.trim().toLowerCase().replace(/^0x/, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/.test(clean)) throw new Error("invalid bytes");
  const length = clean.length / 2;
  const padded = clean.padEnd(Math.ceil(clean.length / 64) * 64, "0");
  return word(BigInt(length)) + padded;
}

/** Full calldata for submitRun(attestation, signature). */
export function encodeSubmitRun(a: SerializedAttestation, signature: string): string {
  const head = [
    addressWord(a.player),
    word(BigInt(a.score)),
    word(BigInt(a.wave)),
    word(BigInt(a.level)),
    bytes32Word(a.runId),
    word(BigInt(a.nonce)),
    word(BigInt(a.deadline)),
    word(BigInt(a.rewardAmount)),
    // The tuple is fully static (8 words), so the `bytes` offset is 9 * 32.
    word(288n),
  ].join("");

  return SUBMIT_RUN_SELECTOR + head + bytesTail(signature);
}
