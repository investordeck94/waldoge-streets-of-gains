/**
 * ONE AUTHORITATIVE DIFFICULTY FRAMEWORK.
 * ---------------------------------------------------------------------------
 * The game has exactly three player difficulties:
 *
 *   "easy"        NEW TO CRYPTO
 *   "normal"      HALF A DEGEN      ← the intended standard balance
 *   "blackMonday" FULL TRENCH MODE
 *
 * FINAL CHALLENGE = LEVEL BASELINE (LEVELS[] table + BOSS_PROFILES)
 *                 + PLAYER DIFFICULTY (this file)
 *
 * Nothing in here is level-specific *balance design*: levels express their own
 * baseline through `levels.ts` (wave counts / hp / speed / boss stats) and
 * `bossTactics.ts` (per-boss behaviour curve). This module only describes how
 * the three player tiers bend that baseline, plus one EASY relief taper so the
 * later, much wider districts stay forgiving on NEW TO CRYPTO.
 *
 * DESIGN RULES
 *  • MEDIUM ("normal") is the untouched reference: every multiplier is 1.0 on
 *    the axes that were already tuned, so existing balance is preserved.
 *  • Difficulty comes from BEHAVIOUR first (aggression, reaction windows,
 *    ranged pressure, encounter composition) — not HP inflation. Enemy HP is
 *    never multiplied upward by difficulty on any tier.
 *  • Difficulty never touches geometry, collision, ladders, decks, camera,
 *    player movement, story objectives or level content.
 */

import type { Difficulty } from "./types";

// ---------------------------------------------------------------------------
// Legacy scalar tables (kept: other modules and saves refer to these names).
// They are the raw tier inputs of `difficultyModifiers()`.
// ---------------------------------------------------------------------------

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
// Tier behaviour table — the part that makes EASY < MEDIUM < HARD feel
// different without turning anyone into a damage sponge.
// ---------------------------------------------------------------------------

interface TierBehaviour {
  /** Multiplier on grunt melee damage. */
  enemyDamage: number;
  /** Multiplier on grunt attack cooldown (>1 = longer openings = easier). */
  enemyCooldown: number;
  /** Multiplier on grunt chase speed. */
  enemySpeed: number;
  /** Multiplier on ranged (Raiding Team) burst cooldown. */
  rangedCooldown: number;
  /** Multiplier on projectile damage dealt to the player. */
  projectileDamage: number;
}

const TIER_BEHAVIOUR: Record<Difficulty, TierBehaviour> = {
  // Lower aggression, longer recovery windows, softer hits, less ranged spam.
  easy: { enemyDamage: 0.7, enemyCooldown: 1.4, enemySpeed: 0.9, rangedCooldown: 1.5, projectileDamage: 0.7 },
  // Reference balance — do not change.
  normal: { enemyDamage: 1.0, enemyCooldown: 1.0, enemySpeed: 1.0, rangedCooldown: 1.0, projectileDamage: 1.0 },
  // Tighter windows, more pressure. Bounded so nothing becomes unavoidable.
  blackMonday: { enemyDamage: 1.25, enemyCooldown: 0.75, enemySpeed: 1.08, rangedCooldown: 0.72, projectileDamage: 1.25 },
};

// ---------------------------------------------------------------------------
// EASY relief taper (per level index, 0-based).
// ---------------------------------------------------------------------------
// Late districts are several times wider with far denser authored encounters,
// so a flat tier multiplier makes NEW TO CRYPTO harshest exactly where new
// players are weakest. The taper only ever applies on "easy"; MEDIUM and HARD
// read 1.0 everywhere, which is why their existing balance is untouched.
//
// The taper reduces *crowd pressure*, never content: every wave, boss, key,
// cage, rescue and special move still happens.
const EASY_TAPER: number[] = [1.0, 0.95, 0.88, 0.8, 0.7, 0.55, 0.52];

function easyTaper(levelIndex: number): number {
  const i = Math.max(0, Math.min(Math.floor(levelIndex || 0), EASY_TAPER.length - 1));
  return EASY_TAPER[i];
}

// ---------------------------------------------------------------------------
// The single derived modifier record every system reads.
// ---------------------------------------------------------------------------

export interface DifficultyModifiers {
  /** Multiplier on authored wave minion count. */
  enemyCount: number;
  /** Multiplier on authored minion HP (never above 1 — no sponges). */
  enemyHp: number;
  /** Multiplier on grunt melee damage. */
  enemyDamage: number;
  /** Multiplier on grunt attack cooldown (>1 = more forgiving). */
  enemyCooldown: number;
  /** Multiplier on grunt chase speed. */
  enemySpeed: number;
  /** Multiplier on ranged burst cooldown (>1 = less ranged pressure). */
  rangedCooldown: number;
  /** Multiplier on projectile damage to the player. */
  projectileDamage: number;
  /** Multiplier on boss HP. */
  bossHp: number;
  /** Multiplier on boss decision cooldown (lower = more aggressive). */
  bossCd: number;
  /** Multiplier on boss outgoing damage. */
  bossDmg: number;
  /** Absolute count of minions escorting the boss. */
  bossMinions: number;
}

/**
 * THE authoritative resolver. Every enemy, boss, projectile and encounter in
 * every level derives its difficulty from this one function.
 */
const MOD_CACHE = new Map<string, DifficultyModifiers>();

export function difficultyModifiers(diff: Difficulty, levelIndex = 0): DifficultyModifiers {
  const key = `${diff}:${Math.max(0, Math.min(Math.floor(levelIndex || 0), EASY_TAPER.length - 1))}`;
  const cached = MOD_CACHE.get(key);
  if (cached) return cached;
  const tier = TIER_BEHAVIOUR[diff] ?? TIER_BEHAVIOUR.normal;
  const t = diff === "easy" ? easyTaper(levelIndex) : 1;
  const soften = 1 - t; // 0 on medium/hard, grows with level on easy

  const mods: DifficultyModifiers = {
    enemyCount: (DIFFICULTY_ENEMY_MULT[diff] ?? 1) * t,
    enemyHp: 1 - soften * 0.5,
    enemyDamage: tier.enemyDamage * (1 - soften * 0.35),
    enemyCooldown: tier.enemyCooldown * (1 + soften * 0.35),
    enemySpeed: tier.enemySpeed,
    rangedCooldown: tier.rangedCooldown * (1 + soften * 0.5),
    projectileDamage: tier.projectileDamage * (1 - soften * 0.35),
    bossHp: 1 - soften * 0.75,
    bossCd: (DIFFICULTY_BOSS_CD[diff] ?? 1) * (1 + soften * 0.5),
    bossDmg: (DIFFICULTY_BOSS_DMG[diff] ?? 1) * (1 - soften * 0.6),
    bossMinions: Math.max(0, Math.round((BOSS_WAVE_MINIONS[diff] ?? 0) * t)),
  };
  Object.freeze(mods);
  MOD_CACHE.set(key, mods);
  return mods;
}

// ---------------------------------------------------------------------------
// Back-compat shim.
// ---------------------------------------------------------------------------
// The previous implementation exposed a hand-written per-level "easy relief"
// table (level 6 only). It is now derived from the shared taper so no level
// carries its own private difficulty rules.

export interface EasyRelief {
  count: number;
  hp: number;
  bossHp: number;
  bossDmg: number;
  bossMinions: number;
}

/** @deprecated Use `difficultyModifiers(diff, levelIndex)`. */
export function easyRelief(levelIndex: number, diff: Difficulty): EasyRelief {
  if (diff !== "easy") return { count: 1, hp: 1, bossHp: 1, bossDmg: 1, bossMinions: 1 };
  const t = easyTaper(levelIndex);
  const soften = 1 - t;
  return {
    count: t,
    hp: 1 - soften * 0.5,
    bossHp: 1 - soften * 0.75,
    bossDmg: 1 - soften * 0.6,
    bossMinions: t,
  };
}
