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

import { LEGENDARY, touchesLegendary } from "../legendary";
import { claimCollectible, isGlassCollected } from "../coinWallet";
import { glassesForLevel as gfl } from "../glasses";
describe("legendary candy canes", () => {
  it("exactly two, unique, not beside glasses, double jump needed for 02", () => {
    expect(LEGENDARY.map((c) => c.id)).toEqual(["LEGENDARY_CANDY_01", "LEGENDARY_CANDY_02"]);
    for (const c of LEGENDARY) for (const g of gfl(c.level)) expect(Math.abs(g.x - c.x)).toBeGreaterThan(150);
    const c2 = LEGENDARY[1];
    expect(touchesLegendary(c2, c2.x, 262 - 120)).toBe(false); // single jump peak
    expect(touchesLegendary(c2, c2.x, 262 - 200)).toBe(true); // double jump
  });
  it("+50 once, separate from glass count", () => {
    const before = getCoins();
    expect(claimCollectible("LEGENDARY_CANDY_01", 50)).toBe(true);
    expect(claimCollectible("LEGENDARY_CANDY_01", 50)).toBe(false);
    expect(getCoins()).toBe(before + 50);
    expect(isGlassCollected("LEGENDARY_CANDY_01")).toBe(true);
  });
});
