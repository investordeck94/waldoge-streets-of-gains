/**
 * Level 4 Baddie rescue. This is a one-way, non-combat NPC state machine:
 * key waiting → key collected → cage opening → rescued.
 */
export const BADDIE_LEVEL = 3;
export const BADDIE_KEY_X = 1900;
export const BADDIE_CAGE_X = 7250;
export const BADDIE_KEY_PICKUP_RANGE = 48;
export const BADDIE_RESCUE_RANGE = 95;
export const BADDIE_OPEN_FRAMES = 70;
export const BADDIE_RESCUE_BONUS = 2500;

export type BaddiePhase = "caged" | "opening" | "freed";

export interface BaddieState {
  phase: BaddiePhase;
  timer: number;
  rescued: boolean;
  keyCollected: boolean;
  lockedCooldown: number;
}

export const initialBaddieState = (): BaddieState => ({
  phase: "caged",
  timer: 0,
  rescued: false,
  keyCollected: false,
  lockedCooldown: 0,
});

export function tryCollectBaddieKey(state: BaddieState, px: number, py: number, floorY: number): boolean {
  if (state.keyCollected || state.rescued) return false;
  if (Math.abs(px - BADDIE_KEY_X) > BADDIE_KEY_PICKUP_RANGE || py < floorY - 60) return false;
  state.keyCollected = true;
  return true;
}

export function canRescueBaddie(state: BaddieState, px: number, py: number, floorY: number): boolean {
  return state.phase === "caged" && Math.abs(px - BADDIE_CAGE_X) <= BADDIE_RESCUE_RANGE && py >= floorY - 40;
}

export function beginBaddieRescue(state: BaddieState): boolean {
  if (state.phase !== "caged" || !state.keyCollected) return false;
  state.phase = "opening";
  state.timer = 0;
  return true;
}

/** Returns true once, on the frame the rescue completes. */
export function stepBaddie(state: BaddieState): boolean {
  state.timer++;
  if (state.lockedCooldown > 0) state.lockedCooldown--;
  if (state.phase !== "opening" || state.timer < BADDIE_OPEN_FRAMES) return false;
  state.phase = "freed";
  state.timer = 0;
  state.rescued = true;
  return true;
}

export function baddieObjectiveText(state: BaddieState): string {
  if (state.rescued) return "OBJECTIVE: BADDIE RESCUED — FIND FUDDER";
  if (state.keyCollected) return "OBJECTIVE: KEY COLLECTED — RESCUE BADDIE";
  return "OBJECTIVE: FIND THE CAGE KEY — RESCUE BADDIE";
}