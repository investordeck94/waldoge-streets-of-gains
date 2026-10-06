/**
 * Magnifying-glass collectibles (Levels 1–7). Pure data derived once,
 * deterministically, from existing level geometry — never random, never
 * respawned. Positions are world x + world y of the glass centre.
 */
import { GROUND_Y } from "@/game/config/player";
import { getLevelWidth, landingDecksFor, pitsFor } from "@/game/config/world";

export type GlassPlacement = "ground" | "deck" | "air";
export interface GlassSpot { id: string; level: number; x: number; y: number; kind: GlassPlacement }

/** Glass hovers this far above the surface it rests on. */
const REST = 34;
/** Above a single jump's reach (~120px rise) but inside the double jump's (~210px). */
const AIR = 200;
const LEVEL_COUNT = 7;

function overPit(level: number, x: number): boolean {
  return pitsFor(level).some((p) => x > p.x0 - 60 && x < p.x1 + 60);
}

function clearGround(level: number, x: number, width: number): number {
  let nx = Math.max(500, Math.min(width - 500, Math.round(x)));
  for (let i = 0; i < 40 && overPit(level, nx); i++) nx += 80;
  return nx;
}

/** Keep regular glasses clear of the two legendary canes. */
const LEGEND_KEEP_OUT: Record<number, number[]> = { 5: [4400], 6: [3860] };
/** Low air = timed single jump; high air = needs the double jump. */
const AIR_LOW = 130;

function buildLevel(level: number): GlassSpot[] {
  const width = getLevelWidth(level);
  const spots: Omit<GlassSpot, "id">[] = [];
  const decks = landingDecksFor(level).filter((d) => d.x1 - d.x0 >= 90).slice().sort((a, b) => a.x0 - b.x0);
  const keepOut = LEGEND_KEEP_OUT[level] ?? [];
  const blocked = (x: number) => overPit(level, x) || keepOut.some((k) => Math.abs(k - x) < 160);
  // Airborne trail along the street, alternating double-jump and timed-jump heights.
  const airCount = Math.max(24, Math.floor((width - 1000) / 260));
  const step = (width - 1000) / airCount;
  for (let i = 0; i < airCount; i++) {
    const x = Math.round(500 + step * (i + 0.5));
    if (blocked(x)) continue;
    const overDeck = decks.find((d) => x >= d.x0 && x <= d.x1);
    const high = i % 3 !== 1;
    // Under a walkway: hover above the walkway instead (reached from its top).
    const y = overDeck ? overDeck.y - (high ? AIR : AIR_LOW) : GROUND_Y - (high ? AIR : AIR_LOW);
    if (y < 18) { spots.push({ level, x, y: overDeck!.y - REST - 30, kind: "air" }); continue; }
    spots.push({ level, x, y, kind: "air" });
  }
  // Ground glasses between the air trail.
  for (const f of [0.08, 0.2, 0.33, 0.46, 0.59, 0.72, 0.85, 0.95]) {
    const x = clearGround(level, width * f + step / 2, width);
    if (!blocked(x)) spots.push({ level, x, y: GROUND_Y - REST, kind: "ground" });
  }
  // One resting on each walkway (far end), capped.
  for (const d of decks.slice(0, 6)) {
    const x = Math.round(d.x1 - Math.min(40, (d.x1 - d.x0) / 3));
    if (!blocked(x)) spots.push({ level, x, y: d.y - REST, kind: "deck" });
  }
  return spots
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((s, i, arr) => i === 0 || Math.abs(s.x - arr[i - 1].x) > 30 || Math.abs(s.y - arr[i - 1].y) > 40)
    .map((s, i) => ({ ...s, id: `L${level + 1}_GLASS_${String(i + 1).padStart(2, "0")}` }));
}

export const GLASSES: readonly GlassSpot[] = Array.from({ length: LEVEL_COUNT }, (_, l) => buildLevel(l)).flat();

export function glassesForLevel(level: number): GlassSpot[] {
  return GLASSES.filter((g) => g.level === level);
}

/** Overlap between the glass and Waldoge's torso (feet at py). */
export function touchesGlass(g: GlassSpot, px: number, py: number): boolean {
  return Math.abs(px - g.x) <= 34 && g.y >= py - 80 && g.y <= py + 6;
}
