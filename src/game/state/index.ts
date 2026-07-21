/**
 * GameState barrel.
 *
 * Consumers should import from `@/game/state` only — internal file
 * layout is an implementation detail and may change as the state
 * system grows (e.g. splitting into slices).
 *
 * Extension guide:
 *   1. Add fields to `types.ts` (with sensible sub-types).
 *   2. Provide defaults in `defaults.ts`.
 *   3. If the shape breaks compatibility, bump `GAME_STATE_VERSION`
 *      and add a migration in `persist.ts`.
 *   4. Expose helper mutators here if a feature warrants a public API
 *      (keep raw `updateGameState` for ad-hoc patches).
 */

export * from "./types";
export {
  getGameState,
  updateGameState,
  replaceGameState,
  resetGameState,
  subscribeGameState,
} from "./store";
export {
  saveGameState,
  loadGameState,
  clearSavedGameState,
} from "./persist";
export { GAME_STATE_VERSION, initialGameState } from "./defaults";
export { useGameState, useFullGameState } from "./hooks";
