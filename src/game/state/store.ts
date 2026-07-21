/**
 * Vanilla pub/sub store for GameState.
 *
 * Kept deliberately dependency-free (no zustand, no redux) so it can
 * be consumed from:
 *   - React UI (via `useGameState` in `hooks.ts`)
 *   - The imperative game loop (via `getGameState` / `updateGameState`)
 *   - Future workers, edge functions or 3D scenes
 *
 * Perf notes:
 *   - Reads are synchronous and allocation-free (`getGameState()`).
 *   - Writes use a shallow-merged patch. Nested updates should be
 *     built by the caller and passed as a full sub-object to avoid
 *     accidental partial merges deep in the tree.
 *   - Subscribers are notified synchronously after each commit. Keep
 *     subscriber work light; heavy consumers should throttle themselves.
 */

import type { GameState } from "./types";
import { initialGameState } from "./defaults";

type Listener = (state: GameState, prev: GameState) => void;
type Updater = Partial<GameState> | ((s: GameState) => Partial<GameState>);

let state: GameState = initialGameState();
const listeners = new Set<Listener>();

export function getGameState(): GameState {
  return state;
}

/** Shallow-merge patch into state and notify subscribers. */
export function updateGameState(patch: Updater): GameState {
  const prev = state;
  const delta = typeof patch === "function" ? patch(prev) : patch;
  state = { ...prev, ...delta };
  for (const l of listeners) l(state, prev);
  return state;
}

/** Replace state wholesale. Used by the persistence layer on load. */
export function replaceGameState(next: GameState): GameState {
  const prev = state;
  state = next;
  for (const l of listeners) l(state, prev);
  return state;
}

/** Reset to a fresh default state. Preserves nothing. */
export function resetGameState(): GameState {
  return replaceGameState(initialGameState());
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribeGameState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
