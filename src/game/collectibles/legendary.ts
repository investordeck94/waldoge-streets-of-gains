/**
 * Legendary candy canes — exactly two in the whole Levels 1–7 campaign.
 * Fixed, hand-picked placements on existing geometry (no new platforms).
 *
 * 01 — Level 6: hidden inside a guaranteed breakable trashcan on the main street.
 * 02 — Level 7: hidden inside a guaranteed breakable crate on the main street.
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
  { id: "LEGENDARY_CANDY_01", level: 5, x: 2680, y: STREET_PICKUP_Y, containerType: "trashcan" },
  { id: "LEGENDARY_CANDY_02", level: 6, x: 2920, y: STREET_PICKUP_Y, containerType: "crate" },
];

export function legendaryForLevel(level: number): LegendarySpot[] {
  return LEGENDARY.filter((c) => c.level === level);
}

/** Same torso overlap rule as the glasses (feet at py). */
export function touchesLegendary(c: LegendarySpot, px: number, py: number): boolean {
  return Math.abs(px - c.x) <= 34 && c.y >= py - 80 && c.y <= py + 6;
}
