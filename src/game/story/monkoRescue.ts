/** Level 5 Monko rescue state. Pure quest state: never part of combat entities. */
export const MONKO_LEVEL = 4;
/** All four objectives sit on existing Level 5 upper decks (deck surface Y given). */
export const MONKO_BANANA_KEY_X = 4500;
export const MONKO_BANANA_KEY_Y = 112;
export const MONKO_BANANA_X = 5150;
export const MONKO_BANANA_Y = 204;
export const MONKO_CAGE_KEY_X = 6100;
export const MONKO_CAGE_KEY_Y = 108;
export const MONKO_CAGE_X = 7720;
export const MONKO_CAGE_Y = 190;
export const MONKO_KEY_RANGE = 48;
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
  bananaKey: boolean;
  cageKey: boolean;
}

export function initialMonkoState(): MonkoRescueState {
  return { phase: "caged", timer: 0, rescued: false, bananasRecovered: false, lockedCooldown: 0, bananaKey: false, cageKey: false };
}

function near(px: number, py: number, x: number, floorY: number, range: number): boolean {
  return Math.abs(px - x) <= range && Math.abs(py - floorY) <= 40;
}

/** One-time key pickups; returns which key was just collected. */
export function tryCollectMonkoKeys(state: MonkoRescueState, px: number, py: number): "banana" | "cage" | null {
  if (!state.bananaKey && near(px, py, MONKO_BANANA_KEY_X, MONKO_BANANA_KEY_Y, MONKO_KEY_RANGE)) { state.bananaKey = true; return "banana"; }
  if (!state.cageKey && near(px, py, MONKO_CAGE_KEY_X, MONKO_CAGE_KEY_Y, MONKO_KEY_RANGE)) { state.cageKey = true; return "cage"; }
  return null;
}

export function nearMonkoBananas(state: MonkoRescueState, px: number, py: number): boolean {
  return !state.bananasRecovered && near(px, py, MONKO_BANANA_X, MONKO_BANANA_Y, MONKO_PICKUP_RANGE);
}

export function tryRecoverMonkoBananas(state: MonkoRescueState, px: number, py: number, floorY: number): boolean {
  if (state.bananasRecovered || !state.bananaKey || !near(px, py, MONKO_BANANA_X, floorY, MONKO_PICKUP_RANGE)) return false;
  state.bananasRecovered = true;
  return true;
}

export function canRescueMonko(state: MonkoRescueState, px: number, py: number, floorY: number): boolean {
  return state.phase === "caged" && !state.rescued && near(px, py, MONKO_CAGE_X, floorY, MONKO_RESCUE_RANGE);
}

export function beginMonkoRescue(state: MonkoRescueState): boolean {
  if (state.phase !== "caged" || state.rescued || !state.bananasRecovered || !state.cageKey) return false;
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
  if (!state.bananasRecovered) return state.bananaKey ? "BANANA KEY FOUND · UNLOCK MONKO'S BANANA STASH" : "FIND THE BANANA STASH KEY";
  if (!state.cageKey) return "BANANAS RECOVERED · FIND MONKO'S CAGE KEY";
  return "CAGE KEY FOUND · RESCUE MONKO";
}
