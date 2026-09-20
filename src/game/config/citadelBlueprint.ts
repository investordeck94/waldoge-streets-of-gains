/** Level-7-only deterministic blueprint contract and development validator. */
import { GROUND_Y } from "./player";
import {
  ENCOUNTER_ZONES, getLevelWidth, groundYAt, laddersFor, landingDecksFor, pitsFor,
} from "./world";

export const CITADEL_BLUEPRINT_LEVEL = 6;
export const CITADEL_WORLD_BOUNDS = { x0: 0, x1: 9000 } as const;
export const CITADEL_SECTION_BOUNDS = [0, 1800, 3600, 5400, 7200, 9000] as const;
export const CITADEL_ELEVATION_BANDS = [
  { id: "main", y: GROUND_Y },
  { id: "deck-1", y: 238 },
  { id: "deck-2", y: 190 },
  { id: "deck-3", y: 144 },
  { id: "deck-4", y: 88 },
] as const;
export const CITADEL_OBJECTIVES = {
  key: { x: 6360, y: 88, surfaceId: "key-deck" },
  cage: { x: 6900, y: 88, surfaceId: "cage-level" },
  bossArena: { x0: 7800, x1: 9000 },
} as const;
export const CITADEL_REQUIRED_LANDMARKS = [
  ["ticker-taker-network", "acquisition-board", "red-control-towers"],
  ["market-never-sleeps", "ticker-wall", "global-control"],
  ["waldoge-analysis", "replication-core", "copy-machines"],
  ["inner-citadel", "guarded-key", "anon-prison"],
  ["cryptoverse-display", "ticker-throne", "final-arena"],
] as const;

export interface CitadelValidationIssue { code: string; detail: string }
export interface CitadelValidationReport {
  valid: boolean;
  width: number;
  sections: number;
  deckCount: number;
  ladderCount: number;
  issues: CitadelValidationIssue[];
}

/** Pure invariant check used by tests and the existing development overlay. */
export function validateCitadelBlueprint(): CitadelValidationReport {
  const issues: CitadelValidationIssue[] = [];
  const width = getLevelWidth(CITADEL_BLUEPRINT_LEVEL);
  const decks = landingDecksFor(CITADEL_BLUEPRINT_LEVEL);
  const ladders = laddersFor(CITADEL_BLUEPRINT_LEVEL);
  const deckById = new Map(decks.map((deck) => [deck.id, deck]));

  if (width !== CITADEL_WORLD_BOUNDS.x1) issues.push({ code: "world-width", detail: `${width}` });
  if (pitsFor(CITADEL_BLUEPRINT_LEVEL).length) issues.push({ code: "floor-pits", detail: "Level 7 must remain flat" });
  for (let x = 0; x <= width; x += 25) {
    if (groundYAt(CITADEL_BLUEPRINT_LEVEL, x, GROUND_Y, false) !== GROUND_Y) {
      issues.push({ code: "floor-gap", detail: `x=${x}` }); break;
    }
  }
  for (const deck of decks) {
    if (!deck.id || deck.collisionEnabled !== true || deck.x0 >= deck.x1 || deck.y >= GROUND_Y) {
      issues.push({ code: "deck", detail: deck.id ?? `${deck.x0}-${deck.x1}` });
    }
  }
  for (const ladder of ladders) {
    const upper = ladder.topSurfaceId ? deckById.get(ladder.topSurfaceId) : undefined;
    const lower = ladder.bottomSurfaceId === "main" ? null
      : ladder.bottomSurfaceId ? deckById.get(ladder.bottomSurfaceId) : undefined;
    if (!ladder.id || !upper || ladder.x < upper.x0 || ladder.x > upper.x1 || ladder.top !== upper.y) {
      issues.push({ code: "ladder-top", detail: ladder.id ?? `${ladder.x}` });
    }
    if (ladder.bottomSurfaceId === "main") {
      if (ladder.bottom !== GROUND_Y) issues.push({ code: "ladder-floor", detail: ladder.id ?? `${ladder.x}` });
    } else if (!lower || ladder.x < lower.x0 || ladder.x > lower.x1 || ladder.bottom !== lower.y) {
      issues.push({ code: "ladder-bottom", detail: ladder.id ?? `${ladder.x}` });
    }
  }
  for (const objective of [CITADEL_OBJECTIVES.key, CITADEL_OBJECTIVES.cage]) {
    const surface = deckById.get(objective.surfaceId);
    if (!surface || objective.x < surface.x0 || objective.x > surface.x1 || objective.y !== surface.y) {
      issues.push({ code: "objective", detail: objective.surfaceId });
    }
  }
  const zones = ENCOUNTER_ZONES[CITADEL_BLUEPRINT_LEVEL];
  if (!zones || zones.waves.length !== 5 || zones.boss * width < CITADEL_OBJECTIVES.bossArena.x0) {
    issues.push({ code: "encounters", detail: "Five waves plus final arena required" });
  }
  return { valid: issues.length === 0, width, sections: 5, deckCount: decks.length, ladderCount: ladders.length, issues };
}