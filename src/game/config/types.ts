/**
 * Shared configuration types.
 *
 * These describe the *shape* of level/difficulty data. They live here (not in
 * the component) so any future module — a level editor, a save-file loader, a
 * 3D port — can consume the same schema.
 */

export type SceneTheme =
  | "alley"
  | "city"
  | "suburbs"
  | "mall"
  | "park"
  | "office"
  | "chart";

export interface EnemyWaveConfig {
  /** Base minion count (before difficulty multiplier). */
  count: number;
  /** Minion HP for this wave. */
  hp: number;
  /** Minion movement/attack speed multiplier. */
  speed: number;
}

export interface BossConfig {
  hp: number;
  /** Peak charge-attack velocity, px/frame. */
  chargeSpeed: number;
  /** Boss AI base movement speed. */
  aiSpeed: number;
  /** Multiplier applied to base boss damage per attack. */
  dmgMult: number;
  /** Display name shown in the boss banner + HUD. */
  name: string;
}

/**
 * Each level plays out as N minion waves followed by a boss.
 */
export interface LevelConfig {
  name: string;
  theme: SceneTheme;
  waves: EnemyWaveConfig[];
  boss: BossConfig;
}

/** Difficulty tier selected on the menu screen. */
export type Difficulty = "easy" | "normal" | "blackMonday";
