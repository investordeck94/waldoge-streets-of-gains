/**
 * Difficulty multipliers.
 *
 * "easy"        = NEW TO CRYPTO         (original counts, forgiving boss)
 * "normal"      = HALF A DEGEN          (extra minions, faster boss)
 * "blackMonday" = FULL TRENCH MODE      (chaos)
 *
 * Enemy HP is unchanged across difficulties — encounters just get busier and
 * the boss hits harder / more often.
 */

import type { Difficulty } from "./types";

/** Multiplier applied to per-wave minion `count`. */
export const DIFFICULTY_ENEMY_MULT: Record<Difficulty, number> = {
  easy: 1.6,
  normal: 2.6,
  blackMonday: 4.5,
};

/** Multiplier applied to boss attack cooldown (lower = more aggressive). */
export const DIFFICULTY_BOSS_CD: Record<Difficulty, number> = {
  easy: 1.0,
  normal: 0.85,
  blackMonday: 0.6,
};

/** Multiplier applied to boss outgoing damage. */
export const DIFFICULTY_BOSS_DMG: Record<Difficulty, number> = {
  easy: 1.0,
  normal: 1.15,
  blackMonday: 1.4,
};

/** Extra minions that join the boss encounter. */
export const BOSS_WAVE_MINIONS: Record<Difficulty, number> = {
  easy: 2,
  normal: 4,
  blackMonday: 7,
};
