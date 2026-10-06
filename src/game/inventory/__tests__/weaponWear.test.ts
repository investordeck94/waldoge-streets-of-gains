import { describe, it, expect } from "vitest";
import { addItem, equipItem, getInventory, recordWeaponHit, weaponHitsLeft, WEAPON_HITS } from "../inventory";

describe("weapon wear", () => {
  it("breaks after 15 hits, keeps wear when unequipped, removes from inventory", () => {
    addItem("gauntlets");
    equipItem("gauntlets");
    for (let i = 0; i < 10; i++) expect(recordWeaponHit().broke).toBeNull();
    equipItem("gauntlets"); // unequip
    expect(recordWeaponHit().broke).toBeNull();
    expect(weaponHitsLeft("gauntlets")).toBe(5);
    equipItem("gauntlets");
    for (let i = 0; i < 4; i++) recordWeaponHit();
    expect(recordWeaponHit().broke).toBe("gauntlets");
    expect(getInventory().items.gauntlets).toBeUndefined();
    expect(getInventory().equipped).toBeNull();
    expect(WEAPON_HITS).toBe(15);
  });
});
