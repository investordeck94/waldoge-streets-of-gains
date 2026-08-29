import { describe, expect, it } from "vitest";
import { baseRewardWei, calculateReward } from "../reward.ts";
import { DEFAULT_MAX_REWARD_PER_RUN_WEI, resolveRewardLimits } from "../config.ts";

const WAD = 10n ** 18n;

const ctx = (over: Partial<Parameters<typeof calculateReward>[1]> = {}) => ({
  maxRewardPerRunWei: DEFAULT_MAX_REWARD_PER_RUN_WEI,
  walletEpochUsedWei: 0n,
  maxRewardPerWalletEpochWei: 50n * WAD,
  poolEpochUsedWei: 0n,
  maxRewardPoolEpochWei: 1000n * WAD,
  ...over,
});

describe("reward calculation", () => {
  it("pays nothing below the first milestone", () => {
    expect(baseRewardWei({ score: 100_000, wave: 2, level: 1 })).toBe(0n);
    expect(calculateReward({ score: 100_000, wave: 2, level: 1 }, ctx()).rewardWei).toBe(0n);
  });

  it("is deterministic for identical input", () => {
    const a = calculateReward({ score: 40_000, wave: 12, level: 3 }, ctx());
    const b = calculateReward({ score: 40_000, wave: 12, level: 3 }, ctx());
    expect(a).toEqual(b);
  });

  it("uses the highest reached milestone plus a capped score bonus", () => {
    expect(baseRewardWei({ score: 0, wave: 10, level: 1 })).toBe(2n * WAD);
    expect(baseRewardWei({ score: 40_000, wave: 10, level: 1 })).toBe(2n * WAD + 2n * WAD / 10n);
    // bonus caps at 2 WDOGE
    expect(baseRewardWei({ score: 5_000_000, wave: 5, level: 1 })).toBe(1n * WAD + 2n * WAD);
  });

  it("never exceeds the per-run cap of 10 WDOGE", () => {
    for (const wave of [30, 60, 200]) {
      for (const score of [0, 500_000, 5_000_000]) {
        const r = calculateReward({ score, wave, level: 9 }, ctx());
        expect(r.rewardWei).toBeLessThanOrEqual(10n * WAD);
      }
    }
  });

  it("clamps to the wallet epoch headroom", () => {
    const r = calculateReward(
      { score: 0, wave: 30, level: 1 },
      ctx({ walletEpochUsedWei: 48n * WAD }),
    );
    expect(r.rewardWei).toBe(2n * WAD);
    expect(r.cappedBy).toBe("wallet-epoch");
  });

  it("clamps to the epoch pool headroom", () => {
    const r = calculateReward(
      { score: 0, wave: 30, level: 1 },
      ctx({ poolEpochUsedWei: 999n * WAD }),
    );
    expect(r.rewardWei).toBe(1n * WAD);
    expect(r.cappedBy).toBe("pool-epoch");
  });

  it("returns zero when the epoch is exhausted", () => {
    const r = calculateReward(
      { score: 0, wave: 30, level: 1 },
      ctx({ poolEpochUsedWei: 1000n * WAD }),
    );
    expect(r.rewardWei).toBe(0n);
  });
});

describe("reward limits from env", () => {
  it("defaults to the deploy-time caps", () => {
    const l = resolveRewardLimits({});
    expect(l.maxRewardPerRunWei).toBe(10n * WAD);
    expect(l.maxRewardPerWalletEpochWei).toBe(50n * WAD);
    expect(l.maxRewardPoolEpochWei).toBe(1000n * WAD);
  });

  it("allows tightening but never raising a cap", () => {
    expect(resolveRewardLimits({ SOG_MAX_REWARD_PER_RUN_WEI: "1000000000000000000" })
      .maxRewardPerRunWei).toBe(WAD);
    expect(resolveRewardLimits({ SOG_MAX_REWARD_PER_RUN_WEI: "999000000000000000000" })
      .maxRewardPerRunWei).toBe(10n * WAD);
  });

  it("ignores garbage env values", () => {
    expect(resolveRewardLimits({ SOG_MAX_REWARD_PER_RUN_WEI: "nope" }).maxRewardPerRunWei)
      .toBe(10n * WAD);
    expect(resolveRewardLimits({ SOG_MAX_REWARD_PER_RUN_WEI: "-5" }).maxRewardPerRunWei)
      .toBe(10n * WAD);
  });
});
