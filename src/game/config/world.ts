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
 * Level 4 is Fudder's five-section industrial propaganda territory.
 * Level 5 is Exit Liquidity's five-section Graveyard of Gains.
 * Levels 6-7 keep the legacy width until they get the same treatment.
 */
export const LEVEL_WORLD_WIDTHS: readonly number[] = [
  5600, // L1 Jeet's Fast Food District
  10800, // L2 Rugger's Financial / Casino Empire
  15600, // L3 Bad Actors Studios — 13 authored areas x 1200 units each
  9000, // L4 Fudder Territory — five 1800-unit blueprint sections
  9000, // L5 Graveyard of Gains — five 1800-unit blueprint sections
  9000, // L6 Mr. Marketer's Territory — five 1800-unit blueprint sections
  9000, // L7 The Taker's Citadel — five 1800-unit blueprint sections
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
  // Level 4's blueprint explicitly requires one continuous flat main floor.
  3: [],
  // Level 5's blueprint also requires one continuous flat main floor.
  4: [],
  // Level 6's blueprint requires one continuous flat main floor throughout.
  5: [],
  // Level 7's blueprint requires one uninterrupted flat main combat lane.
  6: [],
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
export function groundYAt(
  level: number,
  x: number,
  fromY?: number,
  includeElevatedDecks = true,
): number {
  if (!Number.isFinite(x)) return GROUND_Y;
  if (includeElevatedDecks) {
    for (const deck of landingDecksFor(level)) {
      if (x >= deck.x0 && x <= deck.x1) {
        if (fromY === undefined || !Number.isFinite(fromY) || fromY <= deck.y + LANDING_CLEARANCE) {
          return deck.y;
        }
      }
    }
  }
  const pit = pitAt(level, x);
  if (!pit) return baseGroundYAt(level, x);
  return pit.y;
}

/** The elevated authored deck beneath x, if one exists. */
export function landingDeckAt(level: number, x: number): LandingDeck | null {
  if (!Number.isFinite(x)) return null;
  for (const deck of landingDecksFor(level)) {
    if (x >= deck.x0 && x <= deck.x1) return deck;
  }
  return null;
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
  /** Stable authored identity (present on blueprint-driven levels). */
  id?: string;
  /** Centre x of the ladder in world units. */
  x: number;
  /** Upper end (usually GROUND_Y — the main street). */
  top: number;
  /** Lower end (the pit floor). */
  bottom: number;
  style: LadderStyle;
  /** Stable IDs of the two surfaces this ladder joins. */
  bottomSurfaceId?: string;
  topSurfaceId?: string;
  /** Zero-based blueprint section. */
  section?: number;
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
  3: [
    { x: 700, top: 190, bottom: GROUND_Y, style: "construction" },
    { x: 1510, top: 190, bottom: GROUND_Y, style: "maintenance" },
    { x: 2240, top: 178, bottom: GROUND_Y, style: "fireEscape" },
    { x: 3180, top: 178, bottom: GROUND_Y, style: "construction" },
    { x: 3970, top: 184, bottom: GROUND_Y, style: "maintenance" },
    { x: 5050, top: 184, bottom: GROUND_Y, style: "construction" },
    { x: 6040, top: 176, bottom: GROUND_Y, style: "construction" },
    { x: 6900, top: 176, bottom: GROUND_Y, style: "maintenance" },
    { x: 7550, top: 184, bottom: GROUND_Y, style: "construction" },
    { x: 8650, top: 184, bottom: GROUND_Y, style: "maintenance" },
  ],
  4: [
    { x: 660, top: 194, bottom: GROUND_Y, style: "construction" },
    { x: 1530, top: 194, bottom: GROUND_Y, style: "maintenance" },
    { x: 2240, top: 190, bottom: GROUND_Y, style: "fireEscape" },
    { x: 3320, top: 190, bottom: GROUND_Y, style: "maintenance" },
    { x: 3980, top: 204, bottom: GROUND_Y, style: "construction" },
    { x: 4410, top: 112, bottom: 204, style: "maintenance" },
    { x: 4920, top: 204, bottom: GROUND_Y, style: "construction" },
    { x: 5260, top: 112, bottom: 204, style: "maintenance" },
    { x: 5660, top: 194, bottom: GROUND_Y, style: "underground" },
    { x: 6240, top: 108, bottom: 194, style: "maintenance" },
    { x: 7020, top: 194, bottom: GROUND_Y, style: "underground" },
    { x: 7580, top: 190, bottom: GROUND_Y, style: "construction" },
    { x: 8720, top: 190, bottom: GROUND_Y, style: "maintenance" },
  ],
  // LEVEL 6 — MR. MARKETER'S TERRITORY. Flat main floor at GROUND_Y with ten
  // authored decks; every ladder joins the main floor to a real deck (or the
  // funnel factory's lower deck to its upper key platform).
  5: [
    // 6.1 ADVERTISING STREET
    { x: 560, top: 196, bottom: GROUND_Y, style: "fireEscape" },
    { x: 1040, top: 196, bottom: GROUND_Y, style: "construction" },
    { x: 1340, top: 186, bottom: GROUND_Y, style: "maintenance" },
    { x: 1660, top: 186, bottom: GROUND_Y, style: "fireEscape" },
    // 6.2 COLD CALL DISTRICT
    { x: 2090, top: 192, bottom: GROUND_Y, style: "maintenance" },
    { x: 2580, top: 192, bottom: GROUND_Y, style: "construction" },
    { x: 2940, top: 180, bottom: GROUND_Y, style: "fireEscape" },
    { x: 3380, top: 180, bottom: GROUND_Y, style: "maintenance" },
    // 6.3 THE FUNNEL FACTORY — key guard arena
    { x: 4220, top: 190, bottom: GROUND_Y, style: "construction" },
    { x: 4500, top: 108, bottom: 190, style: "maintenance" },
    { x: 4780, top: 190, bottom: GROUND_Y, style: "fireEscape" },
    // 6.4 MANIPULATION DISTRICT
    { x: 5740, top: 188, bottom: GROUND_Y, style: "maintenance" },
    { x: 6220, top: 188, bottom: GROUND_Y, style: "construction" },
    { x: 6640, top: 182, bottom: GROUND_Y, style: "fireEscape" },
    { x: 7000, top: 182, bottom: GROUND_Y, style: "maintenance" },
    // 6.5 MR. MARKETER HQ
    { x: 7540, top: 190, bottom: GROUND_Y, style: "construction" },
    { x: 8540, top: 190, bottom: GROUND_Y, style: "maintenance" },
  ],
  // LEVEL 7 — THE TAKER'S CITADEL. Every ladder joins two explicit playable
  // surfaces. Multi-stage towers use adjacent deck-to-deck links only.
  6: [
    { id: "taken-west", x: 420, top: 190, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "taken-west", section: 0 },
    { id: "taken-mid", x: 920, top: 190, bottom: GROUND_Y, style: "maintenance", bottomSurfaceId: "main", topSurfaceId: "taken-mid", section: 0 },
    { id: "taken-east", x: 1520, top: 184, bottom: GROUND_Y, style: "fireEscape", bottomSurfaceId: "main", topSurfaceId: "taken-east", section: 0 },
    { id: "ticker-west", x: 2050, top: 196, bottom: GROUND_Y, style: "maintenance", bottomSurfaceId: "main", topSurfaceId: "ticker-west", section: 1 },
    { id: "ticker-mid-low", x: 2580, top: 214, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "ticker-mid-low", section: 1 },
    { id: "ticker-mid-high", x: 2870, top: 118, bottom: 214, style: "maintenance", bottomSurfaceId: "ticker-mid-low", topSurfaceId: "ticker-mid-high", section: 1 },
    { id: "ticker-east", x: 3400, top: 184, bottom: GROUND_Y, style: "fireEscape", bottomSurfaceId: "main", topSurfaceId: "ticker-east", section: 1 },
    { id: "copy-west", x: 3820, top: 190, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "copy-west", section: 2 },
    { id: "copy-scan-low", x: 4380, top: 218, bottom: GROUND_Y, style: "maintenance", bottomSurfaceId: "main", topSurfaceId: "copy-scan-low", section: 2 },
    { id: "copy-scan-high", x: 4660, top: 122, bottom: 218, style: "construction", bottomSurfaceId: "copy-scan-low", topSurfaceId: "copy-scan-high", section: 2 },
    { id: "copy-east", x: 5180, top: 184, bottom: GROUND_Y, style: "fireEscape", bottomSurfaceId: "main", topSurfaceId: "copy-east", section: 2 },
    { id: "citadel-entry", x: 5560, top: 224, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "citadel-entry", section: 3 },
    { id: "key-floor-to-d1", x: 5880, top: 238, bottom: GROUND_Y, style: "maintenance", bottomSurfaceId: "main", topSurfaceId: "key-deck-1", section: 3 },
    { id: "key-d1-to-d2", x: 6120, top: 156, bottom: 238, style: "construction", bottomSurfaceId: "key-deck-1", topSurfaceId: "key-deck-2", section: 3 },
    { id: "key-d2-to-key", x: 6360, top: 78, bottom: 156, style: "maintenance", bottomSurfaceId: "key-deck-2", topSurfaceId: "key-deck", section: 3 },
    { id: "key-east-descent", x: 6540, top: 156, bottom: GROUND_Y, style: "fireEscape", bottomSurfaceId: "main", topSurfaceId: "key-deck-2", section: 3 },
    { id: "prison-left-1", x: 6740, top: 232, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "prison-deck-1", section: 3 },
    { id: "prison-right-1", x: 7060, top: 232, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "prison-deck-1", section: 3 },
    { id: "prison-left-2", x: 6780, top: 144, bottom: 232, style: "maintenance", bottomSurfaceId: "prison-deck-1", topSurfaceId: "prison-deck-2", section: 3 },
    { id: "prison-right-2", x: 7020, top: 144, bottom: 232, style: "maintenance", bottomSurfaceId: "prison-deck-1", topSurfaceId: "prison-deck-2", section: 3 },
    { id: "prison-left-cage", x: 6820, top: 56, bottom: 144, style: "fireEscape", bottomSurfaceId: "prison-deck-2", topSurfaceId: "cage-level", section: 3 },
    { id: "prison-right-cage", x: 6980, top: 56, bottom: 144, style: "fireEscape", bottomSurfaceId: "prison-deck-2", topSurfaceId: "cage-level", section: 3 },
    { id: "throne-approach", x: 7480, top: 190, bottom: GROUND_Y, style: "construction", bottomSurfaceId: "main", topSurfaceId: "throne-west", section: 4 },
    { id: "throne-exit", x: 8860, top: 190, bottom: GROUND_Y, style: "maintenance", bottomSurfaceId: "main", topSurfaceId: "throne-east", section: 4 },
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
  /** Stable authored identity (present on blueprint-driven levels). */
  id?: string;
  x0: number;
  x1: number;
  /** Walkable surface y (the ladder's top). */
  y: number;
  /** Ladder centre this deck belongs to. */
  ladderX: number;
  section?: number;
  collisionEnabled?: boolean;
  connectedLadderIds?: readonly string[];
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
    // Projector service floor: the two maintenance ladders inside the lower
    // studio area end at y = 351, so each needs a solid walkable landing —
    // without it a climber reaching the top resolves straight back to the pit
    // floor and can never leave the ladder.
    { x0: 4960, x1: 5080, y: 351, ladderX: 5020 },
    { x0: 5720, x1: 5840, y: 351, ladderX: 5780 },
    { x0: 7300, x1: 8300, y: 178, ladderX: 7340 },
    { x0: 8500, x1: 9500, y: 182, ladderX: 8540 },
    { x0: 10900, x1: 11900, y: 188, ladderX: 10940 },
    { x0: 13300, x1: 14300, y: 170, ladderX: 13340 },
  ],
  3: [
    { x0: 660, x1: 1120, y: 190, ladderX: 700 },
    { x0: 1320, x1: 1700, y: 190, ladderX: 1510 },
    { x0: 2200, x1: 2700, y: 178, ladderX: 2240 },
    { x0: 2920, x1: 3220, y: 178, ladderX: 3180 },
    { x0: 3930, x1: 4520, y: 184, ladderX: 3970 },
    { x0: 4700, x1: 5090, y: 184, ladderX: 5050 },
    { x0: 6000, x1: 6450, y: 176, ladderX: 6040 },
    { x0: 6660, x1: 6940, y: 176, ladderX: 6900 },
    { x0: 7480, x1: 7900, y: 184, ladderX: 7550 },
    { x0: 8380, x1: 8720, y: 184, ladderX: 8650 },
  ],
  4: [
    { x0: 620, x1: 1120, y: 194, ladderX: 660 },
    { x0: 1320, x1: 1710, y: 194, ladderX: 1530 },
    { x0: 2200, x1: 2740, y: 190, ladderX: 2240 },
    { x0: 3000, x1: 3420, y: 190, ladderX: 3320 },
    // Upper decks precede overlapping lower decks so feet already near the
    // upper surface resolve there; fighters on the lower deck pass beneath.
    { x0: 4080, x1: 4620, y: 112, ladderX: 4410 },
    { x0: 3940, x1: 4540, y: 204, ladderX: 3980 },
    { x0: 4940, x1: 5360, y: 112, ladderX: 5260 },
    { x0: 4780, x1: 5320, y: 204, ladderX: 4920 },
    { x0: 5980, x1: 6500, y: 108, ladderX: 6240 },
    { x0: 5620, x1: 6280, y: 194, ladderX: 5660 },
    { x0: 6720, x1: 7060, y: 194, ladderX: 7020 },
    { x0: 7540, x1: 7900, y: 190, ladderX: 7580 },
    { x0: 8500, x1: 8780, y: 190, ladderX: 8720 },
  ],
  // LEVEL 6 — ten authored decks. Each deck spans the two ladders that serve
  // it, so a climber always arrives on a real walkable surface.
  5: [
    { x0: 520, x1: 1080, y: 196, ladderX: 560 },
    { x0: 1300, x1: 1700, y: 186, ladderX: 1340 },
    { x0: 2050, x1: 2620, y: 192, ladderX: 2090 },
    { x0: 2900, x1: 3420, y: 180, ladderX: 2940 },
    // Upper key platform precedes the lower deck it overlaps so feet near the
    // top surface resolve there; fighters on the lower deck pass beneath.
    { x0: 4380, x1: 4700, y: 108, ladderX: 4500 },
    { x0: 4180, x1: 4820, y: 190, ladderX: 4220 },
    { x0: 5700, x1: 6260, y: 188, ladderX: 5740 },
    { x0: 6600, x1: 7040, y: 182, ladderX: 6640 },
    { x0: 7500, x1: 7860, y: 190, ladderX: 7540 },
    { x0: 8500, x1: 8860, y: 190, ladderX: 8540 },
  ],
  6: [
    { id: "cage-level", x0: 6790, x1: 7010, y: 56, ladderX: 6820, section: 3, collisionEnabled: true, connectedLadderIds: ["prison-left-cage", "prison-right-cage"] },
    { id: "key-deck", x0: 6260, x1: 6460, y: 78, ladderX: 6360, section: 3, collisionEnabled: true, connectedLadderIds: ["key-d2-to-key"] },
    { id: "ticker-mid-high", x0: 2760, x1: 3020, y: 118, ladderX: 2870, section: 1, collisionEnabled: true, connectedLadderIds: ["ticker-mid-high"] },
    { id: "copy-scan-high", x0: 4560, x1: 4800, y: 122, ladderX: 4660, section: 2, collisionEnabled: true, connectedLadderIds: ["copy-scan-high"] },
    { id: "prison-deck-2", x0: 6700, x1: 7100, y: 144, ladderX: 6780, section: 3, collisionEnabled: true, connectedLadderIds: ["prison-left-2", "prison-right-2", "prison-left-cage", "prison-right-cage"] },
    { id: "key-deck-2", x0: 6040, x1: 6580, y: 156, ladderX: 6120, section: 3, collisionEnabled: true, connectedLadderIds: ["key-d1-to-d2", "key-d2-to-key", "key-east-descent"] },
    { id: "taken-east", x0: 1420, x1: 1700, y: 184, ladderX: 1520, section: 0, collisionEnabled: true, connectedLadderIds: ["taken-east"] },
    { id: "ticker-east", x0: 3260, x1: 3540, y: 184, ladderX: 3400, section: 1, collisionEnabled: true, connectedLadderIds: ["ticker-east"] },
    { id: "copy-east", x0: 5040, x1: 5320, y: 184, ladderX: 5180, section: 2, collisionEnabled: true, connectedLadderIds: ["copy-east"] },
    { id: "taken-west", x0: 300, x1: 620, y: 190, ladderX: 420, section: 0, collisionEnabled: true, connectedLadderIds: ["taken-west"] },
    { id: "taken-mid", x0: 800, x1: 1120, y: 190, ladderX: 920, section: 0, collisionEnabled: true, connectedLadderIds: ["taken-mid"] },
    { id: "copy-west", x0: 3700, x1: 4020, y: 190, ladderX: 3820, section: 2, collisionEnabled: true, connectedLadderIds: ["copy-west"] },
    { id: "throne-west", x0: 7380, x1: 7660, y: 190, ladderX: 7480, section: 4, collisionEnabled: true, connectedLadderIds: ["throne-approach"] },
    { id: "throne-east", x0: 8740, x1: 8940, y: 190, ladderX: 8860, section: 4, collisionEnabled: true, connectedLadderIds: ["throne-exit"] },
    { id: "ticker-west", x0: 1940, x1: 2200, y: 196, ladderX: 2050, section: 1, collisionEnabled: true, connectedLadderIds: ["ticker-west"] },
    { id: "ticker-mid-low", x0: 2460, x1: 3060, y: 214, ladderX: 2580, section: 1, collisionEnabled: true, connectedLadderIds: ["ticker-mid-low", "ticker-mid-high"] },
    { id: "copy-scan-low", x0: 4260, x1: 4860, y: 218, ladderX: 4380, section: 2, collisionEnabled: true, connectedLadderIds: ["copy-scan-low", "copy-scan-high"] },
    { id: "citadel-entry", x0: 5480, x1: 5700, y: 224, ladderX: 5560, section: 3, collisionEnabled: true, connectedLadderIds: ["citadel-entry"] },
    { id: "prison-deck-1", x0: 6660, x1: 7140, y: 232, ladderX: 6740, section: 3, collisionEnabled: true, connectedLadderIds: ["prison-left-1", "prison-right-1", "prison-left-2", "prison-right-2"] },
    { id: "key-deck-1", x0: 5800, x1: 6220, y: 238, ladderX: 5880, section: 3, collisionEnabled: true, connectedLadderIds: ["key-floor-to-d1", "key-d1-to-d2"] },
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
  // Level 4: one encounter staged in the centre of each authored section
  // (Entrance, Media, Industrial, Factory) with FUDDER waiting in the arena.
  3: { waves: [0.1, 0.3, 0.5, 0.72], boss: 0.93 },
  // Level 5: one authored fight in each blueprint section, then the boss.
  4: { waves: [0.1, 0.3, 0.5, 0.7, 0.85], boss: 0.94 },
  // Level 6: one authored encounter per blueprint section. Wave index 2 (the
  // funnel factory, x ≈ 4500) is the KEY GUARD encounter.
  5: { waves: [0.09, 0.28, 0.5, 0.71, 0.86], boss: 0.94 },
  // Level 7: one fight in every section; wave 3 guards the elevated key and
  // wave 4 protects the prison tower. Ticker Taker waits at the throne.
  6: { waves: [0.1, 0.3, 0.5, 0.7, 0.79], boss: 0.94 },

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
