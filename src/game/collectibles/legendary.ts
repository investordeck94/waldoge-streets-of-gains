/**
 * Legendary candy canes — exactly two in the whole Levels 1–7 campaign.
 * Fixed, hand-picked placements on existing geometry (no new platforms).
 *
 * 01 — Level 6: mid-top walkway (y=108, away from its ladder); a hop from its top.
 * 02 — Level 7: above the copy-west walkway (y=262), past its ladder. Pickup needs
 *      feet ≤125 (rise 137): single jump peaks ~120 (too low), double ~210.
 */
export interface LegendarySpot { id: string; level: number; x: number; y: number }

export const LEGENDARY_COIN_VALUE = 50;

export const LEGENDARY: readonly LegendarySpot[] = [
  { id: "LEGENDARY_CANDY_01", level: 5, x: 4640, y: 40 },
  { id: "LEGENDARY_CANDY_02", level: 6, x: 3960, y: 45 },
];

export function legendaryForLevel(level: number): LegendarySpot[] {
  return LEGENDARY.filter((c) => c.level === level);
}

/** Same torso overlap rule as the glasses (feet at py). */
export function touchesLegendary(c: LegendarySpot, px: number, py: number): boolean {
  return Math.abs(px - c.x) <= 34 && c.y >= py - 80 && c.y <= py + 6;
}
