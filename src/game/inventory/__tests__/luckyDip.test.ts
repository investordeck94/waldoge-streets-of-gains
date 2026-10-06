import { describe, it, expect, beforeEach } from "vitest";
import { getCoins, spendCoins, claimCollectible } from "@/game/collectibles/coinWallet";
import { getInventory, useItem } from "../inventory";
import { purchaseLuckyDip, LUCKY_DIP_STANDS, claimBlazeHandover, resetBlazeRun, equipmentDamage } from "../luckyDip";

describe("Lucky Dip", () => {
  beforeEach(() => { spendCoins(getCoins()); });
  it("stands only in levels 3–7", () => {
    expect(Object.keys(LUCKY_DIP_STANDS).map(Number).sort()).toEqual([2, 3, 4, 5, 6]);
  });
  it("refuses below 300 and charges exactly 300 for one reward", () => {
    claimCollectible("T_299", 299);
    expect(purchaseLuckyDip()).toBeNull();
    expect(getCoins()).toBe(299);
    claimCollectible("T_1", 1);
    const before = Object.values(getInventory().items).reduce((a, b) => a + (b ?? 0), 0);
    expect(purchaseLuckyDip(() => 0.99)).toBe("health");
    expect(getCoins()).toBe(0);
    const after = Object.values(getInventory().items).reduce((a, b) => a + (b ?? 0), 0);
    expect(after).toBe(before + 1);
  });
  it("420 handover pays once per level per run", () => {
    resetBlazeRun();
    expect(claimBlazeHandover(3)).toBe(true);
    expect(claimBlazeHandover(3)).toBe(false);
    expect(claimBlazeHandover(0)).toBe(false);
  });
  it("equipment one-shots standard enemies but never one-shots bosses", () => {
    expect(equipmentDamage(12, { hp: 80, maxHp: 80 }, false, "sidearm")).toBe(80);
    const boss = { hp: 1000, maxHp: 1000, isBoss: true };
    const d = equipmentDamage(12, boss, false, "gauntlets");
    expect(d).toBeGreaterThan(12);
    expect(d).toBeLessThan(1000);
    expect(equipmentDamage(12, boss, false, null)).toBe(12);
  });
  it("using a consumable with none owned does nothing", () => {
    while (useItem("dobermann")) { /* drain */ }
    expect(useItem("dobermann")).toBe(false);
  });
});
