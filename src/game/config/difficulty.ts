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

// ---------------------------------------------------------------------------
// Per-level EASY ("NEW TO CRYPTO") relief.
// ---------------------------------------------------------------------------
// Some authored levels are five sections wide with a staged encounter in every
// one of them, which makes the default easy curve far harsher than the shorter
// levels. These multipliers only ever apply on "easy" and only to the levels
// listed here — normal / Black Monday and every other level are untouched.

export interface EasyRelief {
  /** Multiplier on minion wave count. */
  count: number;
  /** Multiplier on minion HP. */
  hp: number;
  /** Multiplier on boss HP. */
  bossHp: number;
  /** Multiplier on boss outgoing damage (stacks with DIFFICULTY_BOSS_DMG). */
  bossDmg: number;
  /** Multiplier on the extra minions escorting the boss. */
  bossMinions: number;
}

const NO_RELIEF: EasyRelief = { count: 1, hp: 1, bossHp: 1, bossDmg: 1, bossMinions: 1 };

/** Level index → relief. Level 6 (index 5, MR MARKETER) only. */
const EASY_LEVEL_RELIEF: Record<number, EasyRelief> = {
  5: { count: 0.55, hp: 0.7, bossHp: 0.68, bossDmg: 0.7, bossMinions: 0.5 },
};

export function easyRelief(levelIndex: number, diff: Difficulty): EasyRelief {
  if (diff !== "easy") return NO_RELIEF;
  return EASY_LEVEL_RELIEF[levelIndex] ?? NO_RELIEF;
}
