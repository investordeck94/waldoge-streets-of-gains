/**
 * Weapon pickups: bat / sword / shuriken.
 *
 * Duration is in frames. rangeBonus adds to base attack reach.
 * dmgMult scales outgoing damage while the weapon is active.
 */

export type WeaponType = "bat" | "sword" | "shuriken";

export interface WeaponStats {
  duration: number;
  rangeBonus: number;
  dmgMult: number;
  color: string;
  icon: string;
  name: string;
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  bat:      { duration: 600, rangeBonus: 25, dmgMult: 1.8, color: "#ff8c00", icon: "🏏", name: "BAT" },
  sword:    { duration: 480, rangeBonus: 35, dmgMult: 2.2, color: "#00ccff", icon: "⚔️", name: "SWORD" },
  shuriken: { duration: 360, rangeBonus: 10, dmgMult: 1.3, color: "#cc44ff", icon: "✦", name: "SHURIKEN" },
};

/** Shuriken throws granted per pickup. */
export const SHURIKEN_AMMO = 5;

/** Probability an enemy drops a weapon on death. */
export const WEAPON_DROP_CHANCE = 0.25;
