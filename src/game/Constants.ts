/**
 * @deprecated Import from `@/game/config` instead. This module is a thin
 * re-export shim kept for backwards compatibility during the Phase 5
 * refactor. It will be removed once `StreetBrawler.tsx` migrates its
 * import site (Phase 6+). See `docs/DEPRECATIONS.md`.
 *
 * All values live under `src/game/config/` — the single source of truth
 * for gameplay tunables. Do not add new constants here; add them to the
 * appropriate module in `src/game/config/` and, if needed, surface them
 * via `src/game/config/index.ts`.
 */

export {
  // player / world / physics
  CANVAS_W,
  CANVAS_H,
  GROUND_Y,
  GRAVITY,
  PLAYER_SPEED,
  JUMP_FORCE,
  LEVEL_WIDTH,
  MAX_ENERGY,
  // combat
  COMBO_WINDOW,
  COMBO_HIT_WINDOW,
  SPECIAL_ATTACKS,
  // weapons
  WEAPON_STATS,
  SHURIKEN_AMMO,
  WEAPON_DROP_CHANCE,
  // powerups
  DROP_CHANCE,
  POWERUP_COLORS,
  POWERUP_ICONS,
  // environment
  RAIN_COUNT,
  PUDDLE_POSITIONS,
  // levels
  LEVELS,
  WAVES_PER_LEVEL,
  TOTAL_LEVELS,
  // difficulty
  DIFFICULTY_ENEMY_MULT,
  DIFFICULTY_BOSS_CD,
  DIFFICULTY_BOSS_DMG,
  BOSS_WAVE_MINIONS,
} from "@/game/config";

export type {
  WeaponType,
  LevelConfig,
  SceneTheme,
  Difficulty,
} from "@/game/config";
