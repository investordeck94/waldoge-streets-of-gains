/**
 * game/Constants.ts — Phase 1 barrel of gameplay constants.
 *
 * PURPOSE
 * Provide a single, stable import path (`@/game/Constants`) for every
 * gameplay constant used by StreetBrawler and future 3D systems. All
 * *values* already live under `src/game/config/` (a prior refactor pass
 * moved them there). This module is a thin re-export barrel — no new
 * numbers, no new logic — so behaviour is guaranteed identical.
 *
 * WHY THIS EXISTS
 * The user's Phase 1 spec asks for a `game/Constants.ts`. Rather than
 * duplicate the config split, we surface a single alias so downstream
 * modules (Player.ts, Enemy.ts, and later Combat / Camera / Render
 * modules) can standardise on one import path. The `@/game/config`
 * barrel remains valid and continues to work for existing call sites.
 *
 * DO NOT edit values here. Edit the source of truth under
 * `src/game/config/` — this file only re-exports.
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
