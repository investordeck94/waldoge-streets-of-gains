/**
 * Save/load layer for GameState.
 *
 * Storage strategy
 * ----------------
 * - Primary slot:   `STORAGE_KEY`
 * - Backup slot:    `STORAGE_KEY_BACKUP` (rotated on every successful save)
 * - Settings slot:  `SETTINGS_KEY` (mirrored copy so preferences survive
 *                    even if the main save is nuked).
 *
 * Envelope format (v2+):
 *   { version, checksum, savedAt, state }
 * The checksum is a lightweight FNV-1a hash of the serialized `state`.
 * On load we recompute and compare; a mismatch is treated as corruption
 * and we fall back to the backup, then to defaults.
 *
 * Versioning
 * ----------
 * `GAME_STATE_VERSION` lives in `defaults.ts`. When you make a breaking
 * change to the state shape:
 *   1. Bump `GAME_STATE_VERSION`.
 *   2. Add a migration entry in `MIGRATIONS` keyed by the *source* version.
 *   3. Migrations run sequentially (0 → 1 → 2 …) so you only ever describe
 *      the delta from the previous version.
 * Unknown / newer versions than we know about are refused (we keep the
 * existing state rather than overwriting with a downgrade).
 */

import type { GameState, Settings } from "./types";
import { GAME_STATE_VERSION, initialGameState } from "./defaults";
import { getGameState, replaceGameState, subscribeGameState, updateGameState } from "./store";

const STORAGE_KEY = "waldoge.streetBrawler.gameState.v1";
const STORAGE_KEY_BACKUP = "waldoge.streetBrawler.gameState.v1.bak";
const SETTINGS_KEY = "waldoge.streetBrawler.settings.v1";

interface SaveEnvelope {
  version: number;
  checksum: string;
  savedAt: string;
  state: GameState;
}

// ---------------------------------------------------------------------------
// Checksum (FNV-1a 32-bit, hex). Fast and dependency-free — enough to spot
// truncation and accidental edits. Not a security primitive.
// ---------------------------------------------------------------------------
function checksum(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Migrations. Add entries here when the schema changes. Each function takes
// the previous-version *state* object and returns the next-version state.
// Do NOT mutate the input; return a new object.
// ---------------------------------------------------------------------------
type Migration = (raw: any) => any;
const MIGRATIONS: Record<number, Migration> = {
  // Example for a future v1 → v2 bump:
  // 1: (s) => ({ ...s, newField: defaultForNewField }),
};

function migrate(rawState: any, fromVersion: number): GameState {
  let current = rawState;
  let version = fromVersion;
  while (version < GAME_STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break; // no path — fall through to defaults merge
    current = step(current);
    version += 1;
  }
  // Merge over defaults so any newly-added top-level fields get sane values
  // even if a migration didn't cover them (backwards-compat safety net).
  const defaults = initialGameState();
  return {
    ...defaults,
    ...current,
    player: { ...defaults.player, ...current?.player },
    progression: { ...defaults.progression, ...current?.progression },
    wallet: { ...defaults.wallet, ...current?.wallet },
    experience: { ...defaults.experience, ...current?.experience },
    inventory: { ...defaults.inventory, ...current?.inventory },
    equipped: { ...defaults.equipped, ...current?.equipped },
    quests: { ...defaults.quests, ...current?.quests },
    unlocks: { ...defaults.unlocks, ...current?.unlocks },
    settings: { ...defaults.settings, ...current?.settings },
    bestScores: { ...defaults.bestScores, ...current?.bestScores },
    save: { ...defaults.save, ...current?.save, version: GAME_STATE_VERSION },
  };
}

// ---------------------------------------------------------------------------
// Envelope helpers
// ---------------------------------------------------------------------------
function pack(state: GameState): string {
  const stateJson = JSON.stringify(state);
  const envelope: SaveEnvelope = {
    version: GAME_STATE_VERSION,
    checksum: checksum(stateJson),
    savedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(envelope);
}

type UnpackResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: "empty" | "parse" | "checksum" | "version" };

function unpack(raw: string | null): UnpackResult {
  if (!raw) return { ok: false, reason: "empty" };
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "parse" };
  }
  // Legacy (pre-envelope) saves: assume raw is the state object itself.
  if (parsed && !("state" in parsed) && "save" in parsed) {
    const legacyVersion = parsed?.save?.version ?? 0;
    return { ok: true, state: migrate(parsed, legacyVersion) };
  }
  if (!parsed || typeof parsed !== "object" || !parsed.state) {
    return { ok: false, reason: "parse" };
  }
  const env = parsed as SaveEnvelope;
  if (typeof env.version !== "number" || env.version > GAME_STATE_VERSION) {
    return { ok: false, reason: "version" };
  }
  const recomputed = checksum(JSON.stringify(env.state));
  if (env.checksum && env.checksum !== recomputed) {
    return { ok: false, reason: "checksum" };
  }
  try {
    return { ok: true, state: migrate(env.state, env.version) };
  } catch {
    return { ok: false, reason: "parse" };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Persist the current (or provided) state. Rotates the primary slot into
 *  the backup slot on success. Returns true on success. */
export function saveGameState(state: GameState = getGameState()): boolean {
  try {
    const stamped: GameState = {
      ...state,
      save: { ...state.save, updatedAt: new Date().toISOString() },
    };
    const payload = pack(stamped);
    // Rotate: current primary → backup, then write new primary.
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(STORAGE_KEY_BACKUP, prev);
    } catch {
      /* backup rotation is best-effort */
    }
    localStorage.setItem(STORAGE_KEY, payload);
    // Mirror settings to their own slot so preferences survive a wipe.
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(stamped.settings));
    } catch {
      /* settings mirror is best-effort */
    }
    return true;
  } catch {
    return false;
  }
}

/** Load the latest save (primary → backup → settings-only → null).
 *  On success, replaces the in-memory store and returns the state.
 *  Corruption is handled silently; the caller can inspect `getLoadDiagnostics()`
 *  after the call for details. */
export interface LoadDiagnostics {
  source: "primary" | "backup" | "settings-only" | "none";
  primaryStatus: string;
  backupStatus?: string;
}

const reasonOf = (r: UnpackResult | undefined): string =>
  !r ? "empty" : r.ok ? "ok" : r.reason;

let lastLoadDiagnostics: LoadDiagnostics = { source: "none", primaryStatus: "empty" };
export function getLoadDiagnostics(): LoadDiagnostics {
  return lastLoadDiagnostics;
}

export function loadGameState(): GameState | null {
  let primaryResult: UnpackResult;
  let backupResult: UnpackResult | undefined;
  try {
    primaryResult = unpack(localStorage.getItem(STORAGE_KEY));
  } catch {
    primaryResult = { ok: false, reason: "parse" };
  }
  if (primaryResult.ok) {
    lastLoadDiagnostics = { source: "primary", primaryStatus: "ok" };
    replaceGameState(primaryResult.state);
    return primaryResult.state;
  }
  // Try backup slot.
  try {
    backupResult = unpack(localStorage.getItem(STORAGE_KEY_BACKUP));
  } catch {
    backupResult = { ok: false, reason: "parse" };
  }
  if (backupResult?.ok) {
    lastLoadDiagnostics = {
      source: "backup",
      primaryStatus: reasonOf(primaryResult),
      backupStatus: "ok",
    };
    replaceGameState(backupResult.state);
    // Heal the primary slot from the backup.
    saveGameState(backupResult.state);
    return backupResult.state;
  }
  // Fall back to settings-only recovery.
  const settings = loadSettingsOnly();
  if (settings) {
    const fresh = initialGameState();
    fresh.settings = { ...fresh.settings, ...settings };
    replaceGameState(fresh);
    lastLoadDiagnostics = {
      source: "settings-only",
      primaryStatus: reasonOf(primaryResult),
      backupStatus: backupResult?.reason,
    };
    return fresh;
  }
  lastLoadDiagnostics = {
    source: "none",
    primaryStatus: reasonOf(primaryResult),
    backupStatus: backupResult?.reason,
  };
  return null;
}

/** Read only the mirrored settings blob. Used as a last-resort recovery. */
export function loadSettingsOnly(): Settings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Settings;
  } catch {
    return null;
  }
}

export function clearSavedGameState(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(STORAGE_KEY_BACKUP); } catch { /* ignore */ }
  // Intentionally keep SETTINGS_KEY so preferences survive a full wipe.
}

// ---------------------------------------------------------------------------
// Autosave
// ---------------------------------------------------------------------------
/**
 * Subscribe to store changes and persist debounced. Also flushes on
 * `visibilitychange: hidden` and `beforeunload` to avoid losing the last
 * few updates when the tab closes.
 *
 * Returns a disposer that removes listeners and cancels pending writes.
 */
export function startAutosave(options: { debounceMs?: number } = {}): () => void {
  const debounceMs = options.debounceMs ?? 1500;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    saveGameState();
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  const unsubStore = subscribeGameState(schedule);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  const onUnload = () => flush();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("beforeunload", onUnload);

  return () => {
    unsubStore();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("beforeunload", onUnload);
    if (timer) clearTimeout(timer);
  };
}

// ---------------------------------------------------------------------------
// Best-score helpers (side-effect free apart from store update).
// ---------------------------------------------------------------------------
export function recordBestScore(params: {
  score: number;
  wave: number;
  levelIndex: number;
  runSeconds?: number;
}): void {
  const s = getGameState();
  const key = `level:${params.levelIndex}`;
  const prevBest = s.bestScores.byLevel[key] ?? 0;
  updateGameState({
    bestScores: {
      overall: Math.max(s.bestScores.overall, params.score),
      highestWave: Math.max(s.bestScores.highestWave, params.wave),
      longestRunSeconds: Math.max(s.bestScores.longestRunSeconds, params.runSeconds ?? 0),
      byLevel: { ...s.bestScores.byLevel, [key]: Math.max(prevBest, params.score) },
    },
  });
}
