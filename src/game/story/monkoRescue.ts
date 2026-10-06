/** Level 5 Monko rescue state. Pure quest state: never part of combat entities. */
export const MONKO_LEVEL = 4;
export const MONKO_BANANA_X = 6620;
export const MONKO_CAGE_X = 7520;
export const MONKO_PICKUP_RANGE = 62;
export const MONKO_RESCUE_RANGE = 105;
export const MONKO_OPEN_FRAMES = 70;
export const MONKO_RESCUE_BONUS = 2500;

export type MonkoPhase = "caged" | "opening" | "freed";

export interface MonkoRescueState {
  phase: MonkoPhase;
  timer: number;
  rescued: boolean;
  bananasRecovered: boolean;
  lockedCooldown: number;
}

export function initialMonkoState(): MonkoRescueState {
  return { phase: "caged", timer: 0, rescued: false, bananasRecovered: false, lockedCooldown: 0 };
}

function near(px: number, py: number, x: number, floorY: number, range: number): boolean {
  return Math.abs(px - x) <= range && Math.abs(py - floorY) <= 150;
}

export function tryRecoverMonkoBananas(state: MonkoRescueState, px: number, py: number, floorY: number): boolean {
  if (state.bananasRecovered || !near(px, py, MONKO_BANANA_X, floorY, MONKO_PICKUP_RANGE)) return false;
  state.bananasRecovered = true;
  return true;
}

export function canRescueMonko(state: MonkoRescueState, px: number, py: number, floorY: number): boolean {
  return state.phase === "caged" && !state.rescued && near(px, py, MONKO_CAGE_X, floorY, MONKO_RESCUE_RANGE);
}

export function beginMonkoRescue(state: MonkoRescueState): boolean {
  if (state.phase !== "caged" || state.rescued || !state.bananasRecovered) return false;
  state.phase = "opening";
  state.timer = 0;
  return true;
}

/** Returns true on the single frame MONKO_RESCUED becomes final. */
export function stepMonko(state: MonkoRescueState): boolean {
  if (state.lockedCooldown > 0) state.lockedCooldown -= 1;
  if (state.phase !== "opening") return false;
  state.timer += 1;
  if (state.timer < MONKO_OPEN_FRAMES) return false;
  state.phase = "freed";
  state.rescued = true;
  return true;
}

export function monkoObjectiveText(state: MonkoRescueState): string {
  if (state.rescued) return "MONKO RESCUED · DEFEAT EXIT LIQUIDITY";
  if (!state.bananasRecovered) return "FIND MONKO'S STOLEN BANANAS";
  return "BANANAS RECOVERED · FIND AND RESCUE MONKO";
}
