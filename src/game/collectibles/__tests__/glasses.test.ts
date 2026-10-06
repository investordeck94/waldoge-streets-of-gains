import { describe, expect, it, beforeEach } from "vitest";
import { GLASSES, glassesForLevel } from "../glasses";
import { claimGlass, getCoins, spendCoins } from "../coinWallet";

describe("magnifying glass collectibles", () => {
  beforeEach(() => localStorage.clear());

  it("every level has a deterministic, unique, mixed set", () => {
    const ids = GLASSES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let l = 0; l < 7; l++) {
      const set = glassesForLevel(l);
      expect(set.length).toBeGreaterThanOrEqual(6);
      expect(set.some((g) => g.kind === "ground")).toBe(true);
      expect(set.some((g) => g.kind === "air")).toBe(true);
      expect(set[0].id).toBe(`L${l + 1}_GLASS_01`);
    }
  });

  it("claims are idempotent: +10 once, spend never goes negative", () => {
    const before = getCoins();
    expect(claimGlass("TEST_GLASS_X")).toBe(true);
    expect(claimGlass("TEST_GLASS_X")).toBe(false);
    expect(getCoins()).toBe(before + 10);
    expect(spendCoins(getCoins() + 1)).toBe(false);
    expect(spendCoins(10)).toBe(true);
    expect(getCoins()).toBe(before);
  });
});
