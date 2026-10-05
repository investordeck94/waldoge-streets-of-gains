/**
 * FILF — Level 1 captured NPC. Pure state machine, no combat data at all:
 * no hp, no damage, no hitbox, never part of `g.enemies`.
 *
 *   caged → (deliberate interact near cage) → opening → freed (rescued, once)
 */

export const FILF_LEVEL = 0;
/** World x of the cage centre — between Level 1's second wave and Jeet's arena. */
export const FILF_CAGE_X = 4150;
export const FILF_RESCUE_RANGE = 90;
export const FILF_OPEN_FRAMES = 70;

export type FilfPhase = "caged" | "opening" | "freed";

export interface FilfState {
  phase: FilfPhase;
  timer: number;
  rescued: boolean;
}

export const initialFilfState = (): FilfState => ({ phase: "caged", timer: 0, rescued: false });

/** True when Waldoge stands at the cage on the floor and may interact. */
export function canRescueFilf(s: FilfState, px: number, py: number, floorY: number): boolean {
  return s.phase === "caged" && Math.abs(px - FILF_CAGE_X) <= FILF_RESCUE_RANGE && py >= floorY - 40;
}

/** Starts the release. Only ever succeeds once per run. */
export function beginFilfRescue(s: FilfState): boolean {
  if (s.phase !== "caged") return false;
  s.phase = "opening";
  s.timer = 0;
  return true;
}

/** Advances one frame. Returns true exactly once: the frame FILF is freed. */
export function stepFilf(s: FilfState): boolean {
  s.timer++;
  if (s.phase === "opening" && s.timer >= FILF_OPEN_FRAMES) {
    s.phase = "freed";
    s.timer = 0;
    s.rescued = true;
    return true;
  }
  return false;
}
