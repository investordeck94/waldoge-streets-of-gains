/**
 * Legendary candy canes — exactly two in the whole Levels 1–7 campaign.
 * Fixed, hand-picked placements on existing geometry (no new platforms).
 *
 * 01 — Level 6: hovering just above the highest walkway (y=108); reaching
 *      that walkway is the challenge, then a hop from its top.
 * 02 — Level 7: high above a y=262 walkway with nothing overhead. A single
 *      jump peaks ~120px up (feet y≈142, too low); only the existing double
 *      jump lifts Waldoge high enough.
 */
export interface LegendarySpot { id: string; level: number; x: number; y: number }

export const LEGENDARY_COIN_VALUE = 50;

export const LEGENDARY: readonly LegendarySpot[] = [
  { id: "LEGENDARY_CANDY_01", level: 5, x: 4400, y: 22 },
  { id: "LEGENDARY_CANDY_02", level: 6, x: 3860, y: 30 },
];

export function legendaryForLevel(level: number): LegendarySpot[] {
  return LEGENDARY.filter((c) => c.level === level);
}

/** Same torso overlap rule as the glasses (feet at py). */
export function touchesLegendary(c: LegendarySpot, px: number, py: number): boolean {
  return Math.abs(px - c.x) <= 34 && c.y >= py - 80 && c.y <= py + 6;
}
