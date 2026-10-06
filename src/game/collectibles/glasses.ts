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

function buildLevel(level: number): GlassSpot[] {
  const width = getLevelWidth(level);
  const spots: Omit<GlassSpot, "id">[] = [];
  for (const f of [0.14, 0.47, 0.8]) spots.push({ level, x: clearGround(level, width * f, width), y: GROUND_Y - REST, kind: "ground" });
  for (const f of [0.31, 0.64]) spots.push({ level, x: clearGround(level, width * f, width), y: GROUND_Y - AIR, kind: "air" });
  const decks = landingDecksFor(level)
    .filter((d) => d.x1 - d.x0 >= 90)
    .slice()
    .sort((a, b) => a.x0 - b.x0);
  if (decks.length) {
    const picks = decks.length <= 3 ? decks : [0, Math.floor(decks.length / 2), decks.length - 1].map((i) => decks[i]);
    for (const d of picks) {
      // Prefer the deck's far end — slightly off the walking line.
      const x = Math.round(d.x1 - Math.min(60, (d.x1 - d.x0) / 2));
      spots.push({ level, x, y: d.y - REST, kind: "deck" });
    }
  } else {
    // Level without decks: a third double-jump reward instead.
    spots.push({ level, x: clearGround(level, width * 0.9, width), y: GROUND_Y - AIR, kind: "air" });
  }
  return spots
    .sort((a, b) => a.x - b.x)
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
