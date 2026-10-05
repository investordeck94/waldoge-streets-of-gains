/**
 * DOXX — Level 2 captured NPC + stolen blueprints objective. Pure state
 * machine, no combat data: no hp, no damage, no hitbox, never in `g.enemies`.
 *
 *   objective: DOXX_CAPTURED → BLUEPRINTS_RECOVERED → DOXX_RESCUED (one-way)
 *   cage:      caged → (interact WITH blueprints) → opening → freed (once)
 */
export const DOXX_LEVEL = 1;
/** The single set of blueprints — between Level 2's two street fights. */
export const DOXX_BLUEPRINT_X = 4450;
export const DOXX_BLUEPRINT_PICKUP_RANGE = 52;
/** Doxx's cage — after the second fight, before Rugger's arena. */
export const DOXX_CAGE_X = 8300;
export const DOXX_RESCUE_RANGE = 95;
export const DOXX_OPEN_FRAMES = 70;
/** Score bonus awarded once when Doxx is rescued. */
export const DOXX_RESCUE_BONUS = 2500;
/** The single cage key — on the street floor between the blueprints and the cage. */
export const DOXX_KEY_X = 6400;
export const DOXX_KEY_PICKUP_RANGE = 48;

export type DoxxPhase = "caged" | "opening" | "freed";
export type DoxxObjective = "DOXX_CAPTURED" | "BLUEPRINTS_RECOVERED" | "DOXX_RESCUED";

export interface DoxxState {
  phase: DoxxPhase;
  timer: number;
  rescued: boolean;
  objective: DoxxObjective;
  /** The physical cage key — required together with the blueprints. */
  keyCollected: boolean;
  lockedCooldown: number;
}

export const initialDoxxState = (): DoxxState => ({
  phase: "caged", timer: 0, rescued: false, objective: "DOXX_CAPTURED", keyCollected: false, lockedCooldown: 0,
});

export const doxxHasBlueprints = (s: DoxxState) => s.objective !== "DOXX_CAPTURED";
export const doxxHasKey = (s: DoxxState) => s.keyCollected;

export function tryCollectDoxxKey(s: DoxxState, px: number, py: number, floorY: number): boolean {
  if (s.keyCollected || s.rescued) return false;
  if (Math.abs(px - DOXX_KEY_X) > DOXX_KEY_PICKUP_RANGE || py < floorY - 60) return false;
  s.keyCollected = true;
  return true;
}

export function tryCollectBlueprints(s: DoxxState, px: number, py: number, floorY: number): boolean {
  if (s.objective !== "DOXX_CAPTURED") return false;
  if (Math.abs(px - DOXX_BLUEPRINT_X) > DOXX_BLUEPRINT_PICKUP_RANGE || py < floorY - 60) return false;
  s.objective = "BLUEPRINTS_RECOVERED";
  return true;
}

export function canRescueDoxx(s: DoxxState, px: number, py: number, floorY: number): boolean {
  return s.phase === "caged" && Math.abs(px - DOXX_CAGE_X) <= DOXX_RESCUE_RANGE && py >= floorY - 40;
}

export function beginDoxxRescue(s: DoxxState): boolean {
  if (s.phase !== "caged" || s.objective !== "BLUEPRINTS_RECOVERED" || !s.keyCollected) return false;
  s.phase = "opening";
  s.timer = 0;
  return true;
}

/** Advances one frame. True exactly once: the frame Doxx is freed. */
export function stepDoxx(s: DoxxState): boolean {
  s.timer++;
  if (s.lockedCooldown > 0) s.lockedCooldown--;
  if (s.phase === "opening" && s.timer >= DOXX_OPEN_FRAMES) {
    s.phase = "freed";
    s.timer = 0;
    s.rescued = true;
    s.objective = "DOXX_RESCUED";
    return true;
  }
  return false;
}

export function doxxObjectiveText(s: DoxxState): string {
  if (s.objective === "DOXX_CAPTURED") return "OBJECTIVE: FIND DOXX'S BLUEPRINTS AND RESCUE DOXX";
  if (s.objective === "BLUEPRINTS_RECOVERED" && !s.keyCollected) return "OBJECTIVE: BLUEPRINTS RECOVERED — FIND THE CAGE KEY";
  if (s.objective === "BLUEPRINTS_RECOVERED") return "OBJECTIVE: BLUEPRINTS RECOVERED — RESCUE DOXX";
  return "OBJECTIVE: DOXX RESCUED";
}
