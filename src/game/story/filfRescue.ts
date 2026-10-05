/**
 * FILF — Level 1 captured NPC. Pure state machine, no combat data at all:
 * no hp, no damage, no hitbox, never part of `g.enemies`.
 *
 *   objective: KEY_NOT_COLLECTED → KEY_COLLECTED → FILF_RESCUED (one-way)
 *   cage:      caged → (interact WITH key) → opening → freed (once)
 */

export const FILF_LEVEL = 0;
/** World x of the cage centre — between Level 1's second wave and Jeet's arena. */
export const FILF_CAGE_X = 4150;
export const FILF_RESCUE_RANGE = 90;
export const FILF_OPEN_FRAMES = 70;
/** The single cage key — on the street floor, well before the cage. */
export const FILF_KEY_X = 2350;
export const FILF_KEY_PICKUP_RANGE = 48;

export type FilfPhase = "caged" | "opening" | "freed";
export type FilfObjective = "KEY_NOT_COLLECTED" | "KEY_COLLECTED" | "FILF_RESCUED";

export interface FilfState {
  phase: FilfPhase;
  timer: number;
  rescued: boolean;
  objective: FilfObjective;
  /** Frames until the "locked" message may show again. */
  lockedCooldown: number;
}

export const initialFilfState = (): FilfState => ({
  phase: "caged", timer: 0, rescued: false, objective: "KEY_NOT_COLLECTED", lockedCooldown: 0,
});

export const filfHasKey = (s: FilfState) => s.objective !== "KEY_NOT_COLLECTED";

/** Collects the key when Waldoge touches it on the floor. True exactly once. */
export function tryCollectFilfKey(s: FilfState, px: number, py: number, floorY: number): boolean {
  if (s.objective !== "KEY_NOT_COLLECTED") return false;
  if (Math.abs(px - FILF_KEY_X) > FILF_KEY_PICKUP_RANGE || py < floorY - 60) return false;
  s.objective = "KEY_COLLECTED";
  return true;
}

/** True when Waldoge stands at the cage on the floor and may interact. */
export function canRescueFilf(s: FilfState, px: number, py: number, floorY: number): boolean {
  return s.phase === "caged" && Math.abs(px - FILF_CAGE_X) <= FILF_RESCUE_RANGE && py >= floorY - 40;
}

/** Starts the release. Needs the key; only ever succeeds once per run. */
export function beginFilfRescue(s: FilfState): boolean {
  if (s.phase !== "caged" || s.objective !== "KEY_COLLECTED") return false;
  s.phase = "opening";
  s.timer = 0;
  return true;
}

/** Advances one frame. Returns true exactly once: the frame FILF is freed. */
export function stepFilf(s: FilfState): boolean {
  s.timer++;
  if (s.lockedCooldown > 0) s.lockedCooldown--;
  if (s.phase === "opening" && s.timer >= FILF_OPEN_FRAMES) {
    s.phase = "freed";
    s.timer = 0;
    s.rescued = true;
    s.objective = "FILF_RESCUED";
    return true;
  }
  return false;
}
