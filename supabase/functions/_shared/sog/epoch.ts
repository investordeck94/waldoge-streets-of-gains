/**
 * Contract-aligned epoch accounting (audit finding M-3).
 *
 * The deployed StreetsOfGainsRewards contract accounts per-wallet and pool
 * caps against `epochGenesis + n * epochLength`, NOT against UTC calendar
 * days. The backend previously used a UTC day key, so its accounting could
 * drift out of phase with the contract and sign an attestation that reverts.
 *
 * Pure math here; the on-chain reads live in signer.ts.
 */

export interface EpochConfig {
  /** Unix seconds of the contract's epoch genesis (deploy block timestamp). */
  genesisSeconds: number;
  /** Epoch length in seconds (1 day on the deployed contract). */
  lengthSeconds: number;
}

/** Index of the epoch containing `nowSeconds`. Never negative. */
export function epochIndex(config: EpochConfig, nowSeconds: number): number {
  if (config.lengthSeconds <= 0) return 0;
  const delta = nowSeconds - config.genesisSeconds;
  if (delta <= 0) return 0;
  return Math.floor(delta / config.lengthSeconds);
}

/** Inclusive start / exclusive end (unix seconds) of an epoch index. */
export function epochBounds(config: EpochConfig, index: number): { start: number; end: number } {
  const start = config.genesisSeconds + index * config.lengthSeconds;
  return { start, end: start + config.lengthSeconds };
}

/**
 * Stable storage key for an epoch. Prefixed so rows written under the old
 * UTC-day scheme ("2026-09-05") can never be confused with contract epochs.
 */
export function epochKey(config: EpochConfig, nowSeconds: number): string {
  return `e${epochIndex(config, nowSeconds)}`;
}

/** True when the two timestamps fall in the same contract epoch. */
export function sameEpoch(config: EpochConfig, aSeconds: number, bSeconds: number): boolean {
  return epochIndex(config, aSeconds) === epochIndex(config, bSeconds);
}
