/**
 * Per-level WORLD configuration — Waldoge: Streets of Gains
 * ---------------------------------------------------------------------------
 * The original prototype used one hardcoded `LEVEL_WIDTH = 3200` for every
 * level (a stickman-era arena). Levels now describe their own world size,
 * ground terrain (pits / lower streets) and ladder network here.
 *
 * PURE DATA + PURE FUNCTIONS. No canvas, no DOM, no React — so the physics,
 * the renderer and the tests all read the same source of truth.
 *
 * Coordinate rules (unchanged from the rest of the engine):
 *   • y grows DOWNWARD. `GROUND_Y` (320) is the main combat floor.
 *   • A pit floor therefore has a LARGER y than GROUND_Y.
 *   • Every value is authored in world units, feet-anchored.
 */

import { GROUND_Y, LEVEL_WIDTH } from "./player";

/** Fallback width for every level that has no explicit entry (levels 3-7). */
export const DEFAULT_LEVEL_WIDTH = LEVEL_WIDTH;

/**
 * Per-level playable width.
 *   0 — JEET'S FAST FOOD DISTRICT   (long urban restaurant strip)
 *   1 — RUGGER'S FINANCIAL EMPIRE   (offices → casino strip, with lower streets)
 * Levels 2-6 keep the legacy width until they get the same treatment.
 */
export const LEVEL_WORLD_WIDTHS: readonly number[] = [
  5600, // L1 Jeet's Fast Food District
  6600, // L2 Rugger's Financial / Casino Empire
  DEFAULT_LEVEL_WIDTH,
  DEFAULT_LEVEL_WIDTH,
  DEFAULT_LEVEL_WIDTH,
  DEFAULT_LEVEL_WIDTH,
  DEFAULT_LEVEL_WIDTH,
];

/** Playable width for a level index. Always finite and > 0. */
export function getLevelWidth(level: number): number {
  const w = LEVEL_WORLD_WIDTHS[level];
  return Number.isFinite(w) && (w as number) > 0 ? (w as number) : DEFAULT_LEVEL_WIDTH;
}

// ---------------------------------------------------------------------------
// Terrain — lower streets ("pits")
// ---------------------------------------------------------------------------

/** A stretch of street that drops below the main combat floor. */
export interface GroundPit {
  /** Left world x of the lower floor. */
  x0: number;
  /** Right world x of the lower floor. */
  x1: number;
  /** Floor y of the lower street (larger than GROUND_Y). */
  y: number;
  /** Cosmetic label used by the renderer. */
  kind: "service" | "underpass" | "vault";
}

/** How deep the Level 2 lower streets sit below the main floor. */
export const PIT_DEPTH = 84;

const L2_PIT_Y = GROUND_Y + PIT_DEPTH;

export const LEVEL_PITS: Record<number, GroundPit[]> = {
  // Level 1 stays completely flat — it is the traversal/introduction level.
  0: [],
  // Level 2 introduces the first real vertical traversal.
  1: [
    { x0: 1850, x1: 2750, y: L2_PIT_Y, kind: "service" },
    { x0: 4250, x1: 5150, y: L2_PIT_Y, kind: "underpass" },
  ],
};

/** Pits for a level (never undefined). */
export function pitsFor(level: number): GroundPit[] {
  return LEVEL_PITS[level] ?? [];
}

/** Ground (foot) y at a world x for a level. */
export function groundYAt(level: number, x: number): number {
  if (!Number.isFinite(x)) return GROUND_Y;
  for (const p of pitsFor(level)) {
    if (x > p.x0 && x < p.x1) return p.y;
  }
  return GROUND_Y;
}

/** The pit containing x, or null when x is over the main street. */
export function pitAt(level: number, x: number): GroundPit | null {
  for (const p of pitsFor(level)) {
    if (x > p.x0 && x < p.x1) return p;
  }
  return null;
}

/**
 * Keep a fighter that is standing BELOW street level inside the pit it is in,
 * so nobody can walk sideways into (or through) a pit wall. Characters above
 * street level are unaffected — they simply fall in from above.
 *
 * Returns the clamped x.
 */
export function clampToPitWalls(
  level: number,
  x: number,
  y: number,
  halfWidth: number,
): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return x;
  if (y <= GROUND_Y + 2) return x; // at or above the main street — free
  const pit = pitAt(level, x) ?? nearestPitByProximity(level, x);
  if (!pit) return x;
  const min = pit.x0 + halfWidth;
  const max = pit.x1 - halfWidth;
  if (max <= min) return (pit.x0 + pit.x1) / 2;
  return Math.min(Math.max(x, min), max);
}

function nearestPitByProximity(level: number, x: number): GroundPit | null {
  let best: GroundPit | null = null;
  let bestD = Infinity;
  for (const p of pitsFor(level)) {
    const d = x < p.x0 ? p.x0 - x : x > p.x1 ? x - p.x1 : 0;
    if (d < bestD) { bestD = d; best = p; }
  }
  return bestD <= 60 ? best : null;
}

// ---------------------------------------------------------------------------
// Ladders
// ---------------------------------------------------------------------------

export type LadderStyle =
  | "fireEscape"
  | "maintenance"
  | "underground"
  | "casinoService"
  | "construction";

export interface Ladder {
  /** Centre x of the ladder in world units. */
  x: number;
  /** Upper end (usually GROUND_Y — the main street). */
  top: number;
  /** Lower end (the pit floor). */
  bottom: number;
  style: LadderStyle;
}

/** Horizontal distance within which a fighter may mount a ladder. */
export const LADDER_GRAB_X = 20;
/** Climb speed, world units per frame. */
export const CLIMB_SPEED = 2.4;

export const LEVEL_LADDERS: Record<number, Ladder[]> = {
  0: [],
  1: [
    { x: 1890, top: GROUND_Y, bottom: L2_PIT_Y, style: "maintenance" },
    { x: 2710, top: GROUND_Y, bottom: L2_PIT_Y, style: "fireEscape" },
    { x: 4290, top: GROUND_Y, bottom: L2_PIT_Y, style: "underground" },
    { x: 4700, top: GROUND_Y, bottom: L2_PIT_Y, style: "construction" },
    { x: 5110, top: GROUND_Y, bottom: L2_PIT_Y, style: "casinoService" },
  ],
};

export function laddersFor(level: number): Ladder[] {
  return LEVEL_LADDERS[level] ?? [];
}

/** The ladder a fighter at x can currently grab, or null. */
export function ladderAt(level: number, x: number): Ladder | null {
  let best: Ladder | null = null;
  let bestD = LADDER_GRAB_X;
  for (const l of laddersFor(level)) {
    const d = Math.abs(l.x - x);
    if (d <= bestD) { bestD = d; best = l; }
  }
  return best;
}

/** Closest ladder to x regardless of distance (used by enemy navigation). */
export function nearestLadder(level: number, x: number): Ladder | null {
  let best: Ladder | null = null;
  let bestD = Infinity;
  for (const l of laddersFor(level)) {
    const d = Math.abs(l.x - x);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best;
}

/** True when the level has any vertical traversal at all. */
export function hasVerticalTraversal(level: number): boolean {
  return pitsFor(level).length > 0;
}

// ---------------------------------------------------------------------------
// Encounters — where waves and the boss live in the world
// ---------------------------------------------------------------------------

/**
 * Fractions of the level width where each wave's minions are staged, and where
 * the boss waits. Only the redesigned levels use these; other levels keep the
 * legacy "spawn just ahead of the player" behaviour.
 */
export const ENCOUNTER_ZONES: Record<number, { waves: number[]; boss: number }> = {
  0: { waves: [0.28, 0.58], boss: 0.9 },
  1: { waves: [0.26, 0.62], boss: 0.92 },
};

export function encounterX(level: number, wave: number): number | null {
  const z = ENCOUNTER_ZONES[level];
  if (!z) return null;
  const f = z.waves[wave];
  return f === undefined ? null : Math.round(getLevelWidth(level) * f);
}

export function bossArenaX(level: number): number | null {
  const z = ENCOUNTER_ZONES[level];
  return z ? Math.round(getLevelWidth(level) * z.boss) : null;
}

/** Distance at which a staged boss wakes up and starts fighting. */
export const BOSS_WAKE_DISTANCE = 620;
