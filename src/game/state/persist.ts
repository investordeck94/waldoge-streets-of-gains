/**
 * Save/load layer for GameState.
 *
 * Uses `localStorage` for now; the interface is designed so the
 * backing store can be swapped (IndexedDB, Lovable Cloud, cloud saves)
 * without touching call sites.
 *
 * Versioning: every save records `save.version`. On load, unknown or
 * older versions are migrated through `MIGRATIONS`. If migration fails
 * we fall back to the initial state rather than crashing the game.
 */

import type { GameState } from "./types";
import { GAME_STATE_VERSION, initialGameState } from "./defaults";
import { getGameState, replaceGameState } from "./store";

const STORAGE_KEY = "waldoge.streetBrawler.gameState.v1";

type Migration = (raw: any) => any;

/** Add entries as the schema evolves. Key = source version number. */
const MIGRATIONS: Record<number, Migration> = {
  // 0: (raw) => ({ ...raw, save: { ...raw.save, version: 1 } }),
};

function migrate(raw: any): GameState {
  let current = raw;
  let version = raw?.save?.version ?? 0;
  while (version < GAME_STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    current = step(current);
    version += 1;
  }
  // Merge over defaults so any newly-added fields get sane values.
  const defaults = initialGameState();
  return {
    ...defaults,
    ...current,
    save: { ...defaults.save, ...current?.save, version: GAME_STATE_VERSION },
  };
}

export function saveGameState(state: GameState = getGameState()): boolean {
  try {
    const stamped: GameState = {
      ...state,
      save: { ...state.save, updatedAt: new Date().toISOString() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    return true;
  } catch {
    return false;
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    replaceGameState(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
