/**
 * Legendary candy canes — exactly one per level across Levels 1–7 (7 total).
 * Fixed, hand-picked placements on existing geometry (no new platforms).
 * Every cane is hidden inside a guaranteed breakable street container
 * (trashcan or crate) on the main street and pays +50 coins once, ever.
 */
import { GROUND_Y } from "@/game/config/player";

export interface LegendarySpot {
  id: string;
  level: number;
  x: number;
  y: number;
  containerType: "crate" | "trashcan";
}

export const LEGENDARY_COIN_VALUE = 50;
const STREET_PICKUP_Y = GROUND_Y - 38;

export const LEGENDARY: readonly LegendarySpot[] = [
  // Level 1 (width 5600)
  { id: "LEGENDARY_CANDY_03", level: 0, x: 1800, y: STREET_PICKUP_Y, containerType: "trashcan" },
  // Level 2 (width 10800)
  { id: "LEGENDARY_CANDY_05", level: 1, x: 3200, y: STREET_PICKUP_Y, containerType: "crate" },
  // Level 3 (width 15600)
  { id: "LEGENDARY_CANDY_07", level: 2, x: 5200, y: STREET_PICKUP_Y, containerType: "trashcan" },
  // Level 4 (width 9000)
  { id: "LEGENDARY_CANDY_09", level: 3, x: 2600, y: STREET_PICKUP_Y, containerType: "crate" },
  // Level 5 (width 9000)
  { id: "LEGENDARY_CANDY_11", level: 4, x: 2400, y: STREET_PICKUP_Y, containerType: "trashcan" },
  // Level 6 (width 9000) — 01 keeps its original id/spot for saved games
  { id: "LEGENDARY_CANDY_01", level: 5, x: 2680, y: STREET_PICKUP_Y, containerType: "trashcan" },
  // Level 7 (width 9000) — 02 keeps its original id/spot for saved games
  { id: "LEGENDARY_CANDY_02", level: 6, x: 2920, y: STREET_PICKUP_Y, containerType: "crate" },
];

export function legendaryForLevel(level: number): LegendarySpot[] {
  return LEGENDARY.filter((c) => c.level === level);
}

/** Same torso overlap rule as the glasses (feet at py). */
export function touchesLegendary(c: LegendarySpot, px: number, py: number): boolean {
  return Math.abs(px - c.x) <= 34 && c.y >= py - 80 && c.y <= py + 6;
}
