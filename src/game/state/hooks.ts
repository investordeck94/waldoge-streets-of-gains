/**
 * React bindings for the GameState store.
 *
 * `useGameState(selector)` re-renders only when the selected slice
 * changes (referential equality). Use narrow selectors to keep the
 * UI cheap.
 *
 * The game loop should NOT use these hooks — it should read from
 * `getGameState()` directly to avoid React reconciliation on hot paths.
 */

import { useSyncExternalStore, useCallback } from "react";
import type { GameState } from "./types";
import {
  getGameState,
  subscribeGameState,
  updateGameState,
} from "./store";

export function useGameState<T>(selector: (s: GameState) => T): T {
  const subscribe = useCallback(
    (cb: () => void) => subscribeGameState(() => cb()),
    []
  );
  const getSnapshot = useCallback(() => selector(getGameState()), [selector]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience: whole-state hook. Prefer `useGameState(selector)`. */
export function useFullGameState(): GameState {
  return useGameState((s) => s);
}

export { updateGameState };
