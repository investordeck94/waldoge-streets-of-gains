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
 *   2 — BAD ACTOR'S FILM DISTRICT   (studio lot → backlots → premiere boulevard)
 * Levels 3-6 keep the legacy width until they get the same treatment.
 */
export const LEVEL_WORLD_WIDTHS: readonly number[] = [
  5600, // L1 Jeet's Fast Food District
  10800, // L2 Rugger's Financial / Casino Empire
  15600, // L3 Bad Actors Studios — 13 authored areas x 1200 units each
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
const L2_DEEP_PIT_Y = GROUND_Y + 112;
const L2_VAULT_PIT_Y = GROUND_Y + 132;

export const LEVEL_PITS: Record<number, GroundPit[]> = {
  // Level 1 stays completely flat — it is the traversal/introduction level.
  0: [],
  // Level 2 introduces the first real vertical traversal.
  1: [
    { x0: 1760, x1: 2620, y: L2_PIT_Y, kind: "service" },
    { x0: 4380, x1: 5480, y: L2_DEEP_PIT_Y, kind: "underpass" },
    { x0: 6900, x1: 7860, y: L2_PIT_Y, kind: "service" },
    { x0: 8500, x1: 9460, y: L2_VAULT_PIT_Y, kind: "vault" },
  ],
  // Level 3 backstage service floors. These are broad production basements,
  // not hazards: each has connected ladders and a clear lower combat lane.
  // Level 3 backstage service floors, one per blueprint area that has a lower
  // technical level: projector service pit, Stage 1 underfloor, backstage.
  2: [
    { x0: 4800, x1: 6000, y: GROUND_Y + 92, kind: "service" },
    { x0: 7380, x1: 8220, y: GROUND_Y + 92, kind: "service" },
    { x0: 13340, x1: 14260, y: GROUND_Y + 112, kind: "underpass" },
  ],
};

/** Pits for a level (never undefined). */
export function pitsFor(level: number): GroundPit[] {
  return LEVEL_PITS[level] ?? [];
}

// ---------------------------------------------------------------------------
// Authored main-floor profiles
// ---------------------------------------------------------------------------

/**
 * The production-office tyres use this painted contact plane. It ends where
 * the projector service floor begins, so the projector area is resolved by
 * its real lower-floor pit rather than an invisible upper collision plane.
 * This is collision data, not a sprite/render offset.
 */
const LEVEL_3_OFFICE_FLOOR = { x0: 3600, x1: 4800, y: 351 } as const;
const GROUND_BLEND_WIDTH = 96;

/** Main painted floor beneath x, before pits and elevated decks are applied. */
export function baseGroundYAt(level: number, x: number): number {
  if (!Number.isFinite(x)) return GROUND_Y;
  if (level !== 2) return GROUND_Y;
  const floor = LEVEL_3_OFFICE_FLOOR;
  if (x < floor.x0 || x > floor.x1) return GROUND_Y;
  const depth = floor.y - GROUND_Y;
  if (x < floor.x0 + GROUND_BLEND_WIDTH) {
    return GROUND_Y + depth * ((x - floor.x0) / GROUND_BLEND_WIDTH);
  }
  return floor.y;
}

/**
 * Ground (foot) y at a world x for a level.
 *
 * `fromY` (optional) is the fighter's CURRENT foot y. It only matters where a
 * ladder landing deck spans a pit: a fighter at or above deck height stands on
 * the deck, while a fighter already down on the pit floor walks underneath it.
 */
export function groundYAt(level: number, x: number, fromY?: number): number {
  if (!Number.isFinite(x)) return GROUND_Y;
  for (const deck of landingDecksFor(level)) {
    if (x >= deck.x0 && x <= deck.x1) {
      if (fromY === undefined || !Number.isFinite(fromY) || fromY <= deck.y + LANDING_CLEARANCE) {
        return deck.y;
      }
    }
  }
  const pit = pitAt(level, x);
  if (!pit) return baseGroundYAt(level, x);
  return pit.y;
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
    { x: 1800, top: GROUND_Y, bottom: L2_PIT_Y, style: "maintenance" },
    { x: 2580, top: GROUND_Y, bottom: L2_PIT_Y, style: "fireEscape" },
    { x: 4420, top: GROUND_Y, bottom: L2_DEEP_PIT_Y, style: "underground" },
    { x: 4960, top: GROUND_Y, bottom: L2_DEEP_PIT_Y, style: "construction" },
    { x: 5440, top: GROUND_Y, bottom: L2_DEEP_PIT_Y, style: "maintenance" },
    { x: 6940, top: GROUND_Y, bottom: L2_PIT_Y, style: "casinoService" },
    { x: 7820, top: GROUND_Y, bottom: L2_PIT_Y, style: "fireEscape" },
    { x: 8540, top: GROUND_Y, bottom: L2_VAULT_PIT_Y, style: "underground" },
    { x: 9000, top: GROUND_Y, bottom: L2_VAULT_PIT_Y, style: "casinoService" },
    { x: 9420, top: GROUND_Y, bottom: L2_VAULT_PIT_Y, style: "maintenance" },
  ],
  2: [
    // REDACTED HOLLYWOOD hillside catwalk (area 3)
    { x: 2540, top: 188, bottom: GROUND_Y, style: "fireEscape" },
    { x: 3260, top: 188, bottom: GROUND_Y, style: "construction" },
    // BAD ACTOR DISTRICT projector service floor (area 5)
    { x: 5020, top: 351, bottom: GROUND_Y + 92, style: "maintenance" },
    { x: 5780, top: 351, bottom: GROUND_Y + 92, style: "construction" },
    // Stage 1 lighting catwalk + underfloor (area 7)
    { x: 7340, top: 178, bottom: GROUND_Y, style: "construction" },
    { x: 8260, top: 178, bottom: GROUND_Y, style: "fireEscape" },
    { x: 7420, top: GROUND_Y, bottom: GROUND_Y + 92, style: "maintenance" },
    { x: 8180, top: GROUND_Y, bottom: GROUND_Y + 92, style: "construction" },
    // Stage 2 gantry (area 8)
    { x: 8540, top: 182, bottom: GROUND_Y, style: "construction" },
    { x: 9460, top: 182, bottom: GROUND_Y, style: "fireEscape" },
    // Prop department mezzanine (area 10)
    { x: 10940, top: 188, bottom: GROUND_Y, style: "fireEscape" },
    { x: 11860, top: 188, bottom: GROUND_Y, style: "maintenance" },
    // Backstage catwalk + lower storage floor (area 12)
    { x: 13340, top: 170, bottom: GROUND_Y, style: "construction" },
    { x: 14260, top: 170, bottom: GROUND_Y, style: "fireEscape" },
    { x: 13420, top: GROUND_Y, bottom: GROUND_Y + 112, style: "underground" },
    { x: 14180, top: GROUND_Y, bottom: GROUND_Y + 112, style: "maintenance" },
  ],
};

export function laddersFor(level: number): Ladder[] {
  return LEVEL_LADDERS[level] ?? [];
}

// ---------------------------------------------------------------------------
// Ladder landing decks
// ---------------------------------------------------------------------------
//
// A ladder whose x sits over a pit used to end in thin air at the top: the
// ground under that x was the pit floor, so a climber who reached the top rung
// simply fell back down. Every such ladder now gets a SOLID walkable deck at
// its top end, wide enough to stand on and step off in either direction.
//
// Derived from the ladder table (single source of truth) and cached per level.

/** A solid walkable surface bridging a pit at a ladder's top end. */
export interface LandingDeck {
  x0: number;
  x1: number;
  /** Walkable surface y (the ladder's top). */
  y: number;
  /** Ladder centre this deck belongs to. */
  ladderX: number;
}

/** Half-width of a landing deck, in world units. */
export const LANDING_HALF_W = 52;
/**
 * How far below deck height a fighter may be and still be considered "on top
 * of" the deck rather than underneath it.
 */
export const LANDING_CLEARANCE = 30;

const deckCache = new Map<number, LandingDeck[]>();

/** Long authored upper production decks; all use the same collision contract. */
const LEVEL_AUTHORED_DECKS: Record<number, LandingDeck[]> = {
  2: [
    { x0: 2500, x1: 3300, y: 188, ladderX: 2540 },
    { x0: 7300, x1: 8300, y: 178, ladderX: 7340 },
    { x0: 8500, x1: 9500, y: 182, ladderX: 8540 },
    { x0: 10900, x1: 11900, y: 188, ladderX: 10940 },
    { x0: 13300, x1: 14300, y: 170, ladderX: 13340 },
  ],
};

/** Solid landing decks for a level (never undefined; cached, no allocation). */
export function landingDecksFor(level: number): LandingDeck[] {
  const cached = deckCache.get(level);
  if (cached) return cached;
  const decks: LandingDeck[] = [...(LEVEL_AUTHORED_DECKS[level] ?? [])];
  for (const l of laddersFor(level)) {
    const pit = pitAt(level, l.x);
    if (!pit || l.top >= pit.y) continue;
    // A ladder top is only a landing when it meets the surrounding authored
    // upper floor. Projector service ladders sit wholly inside the lower studio
    // area, so inventing decks at their old intermediate y would make fighters
    // levitate above the authoritative pit floor.
    if (Math.abs(l.top - baseGroundYAt(level, l.x)) > 1) continue;
    decks.push({ x0: l.x - LANDING_HALF_W, x1: l.x + LANDING_HALF_W, y: l.top, ladderX: l.x });
  }
  deckCache.set(level, decks);
  return decks;
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

/**
 * The ladder that actually connects the floor a fighter stands on to the floor
 * the target stands on, and that the fighter can reach without crossing a pit
 * wall. Returns null when no such route exists, so callers can fall back to a
 * normal horizontal chase instead of walking into a wall forever.
 */
export function connectingLadder(
  level: number,
  x: number,
  fromGroundY: number,
  toGroundY: number,
): Ladder | null {
  const TOL = 12;
  const pit = pitAt(level, x);
  let best: Ladder | null = null;
  let bestD = Infinity;
  for (const l of laddersFor(level)) {
    const topToBottom = Math.abs(l.top - fromGroundY) <= TOL && Math.abs(l.bottom - toGroundY) <= TOL;
    const bottomToTop = Math.abs(l.bottom - fromGroundY) <= TOL && Math.abs(l.top - toGroundY) <= TOL;
    if (!topToBottom && !bottomToTop) continue;
    // A fighter standing inside a pit can only reach ladders inside that pit.
    if (pit && (l.x <= pit.x0 || l.x >= pit.x1)) continue;
    const d = Math.abs(l.x - x);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best;
}

/** True when the level has any vertical traversal at all. */
export function hasVerticalTraversal(level: number): boolean {
  return pitsFor(level).length > 0 || laddersFor(level).length > 0;
}

/** Deepest authored floor below the main street for camera bounds. */
export function maxPitDepthFor(level: number): number {
  let depth = 0;
  for (const pit of pitsFor(level)) depth = Math.max(depth, pit.y - GROUND_Y);
  return Number.isFinite(depth) ? Math.max(0, depth) : 0;
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
  1: { waves: [0.24, 0.61], boss: 0.93 },
  2: { waves: [0.16, 0.55], boss: 0.945 },
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
