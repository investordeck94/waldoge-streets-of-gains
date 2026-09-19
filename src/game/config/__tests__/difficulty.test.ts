import { describe, expect, it } from "vitest";
import {
  BOSS_WAVE_MINIONS,
  DIFFICULTY_BOSS_CD,
  DIFFICULTY_BOSS_DMG,
  DIFFICULTY_ENEMY_MULT,
  difficultyModifiers,
} from "../difficulty";
import { LEVELS, TOTAL_LEVELS } from "../levels";
import type { Difficulty } from "../types";
import { spawnEnemies, spawnBoss, scaleBossForDifficulty } from "@/game/enemy/Enemy";
import { retryButtonLabel, retryLevelFor } from "@/game/logic/gameFlow";

const TIERS: Difficulty[] = ["easy", "normal", "blackMonday"];
const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i);

/**
 * A coarse "pressure" score standing in for felt challenge: crowd size,
 * incoming damage rate, chase speed and ranged frequency — deliberately NOT
 * just HP.
 */
function pressure(diff: Difficulty, level: number): number {
  const m = difficultyModifiers(diff, level);
  const waves = LEVELS[level].waves;
  const crowd = waves.reduce((s, w) => s + w.count, 0) / waves.length * m.enemyCount;
  const speed = waves.reduce((s, w) => s + w.speed, 0) / waves.length * m.enemySpeed;
  const dps = m.enemyDamage / m.enemyCooldown;
  const bossThreat = LEVELS[level].boss.dmgMult * m.bossDmg / m.bossCd;
  const ranged = 1 / m.rangedCooldown;
  return crowd * 1.4 + speed * 2 + dps * 6 + bossThreat * 4 + ranged;
}

describe("one authoritative difficulty framework", () => {
  it("exposes exactly three tiers on every level", () => {
    for (const level of levels) {
      for (const d of TIERS) {
        const m = difficultyModifiers(d, level);
        expect(m.enemyCount).toBeGreaterThan(0);
        expect(m.bossHp).toBeGreaterThan(0);
        expect(m.enemyCooldown).toBeGreaterThan(0);
      }
    }
  });

  it("leaves MEDIUM (HALF A DEGEN) as the untouched reference balance", () => {
    for (const level of levels) {
      const m = difficultyModifiers("normal", level);
      expect(m.enemyCount).toBe(DIFFICULTY_ENEMY_MULT.normal);
      expect(m.enemyHp).toBe(1);
      expect(m.enemyDamage).toBe(1);
      expect(m.enemyCooldown).toBe(1);
      expect(m.enemySpeed).toBe(1);
      expect(m.projectileDamage).toBe(1);
      expect(m.bossHp).toBe(1);
      expect(m.bossCd).toBe(DIFFICULTY_BOSS_CD.normal);
      expect(m.bossDmg).toBe(DIFFICULTY_BOSS_DMG.normal);
      expect(m.bossMinions).toBe(BOSS_WAVE_MINIONS.normal);
    }
  });

  it("leaves HARD (FULL TRENCH MODE) unscaled by any level-specific rule", () => {
    for (const level of levels) {
      const m = difficultyModifiers("blackMonday", level);
      expect(m.enemyCount).toBe(DIFFICULTY_ENEMY_MULT.blackMonday);
      expect(m.bossHp).toBe(1);
      expect(m.bossMinions).toBe(BOSS_WAVE_MINIONS.blackMonday);
    }
  });

  it("orders EASY < MEDIUM < HARD inside every level", () => {
    for (const level of levels) {
      expect(pressure("easy", level)).toBeLessThan(pressure("normal", level));
      expect(pressure("normal", level)).toBeLessThan(pressure("blackMonday", level));
    }
  });

  it("keeps level 1 → level 7 progressing on every tier", () => {
    for (const d of TIERS) {
      const first = levelBaseline(0, d);
      const last = levelBaseline(TOTAL_LEVELS - 1, d);
      expect(last).toBeGreaterThan(first);
    }
  });

  it("never inflates enemy or boss HP above the authored baseline", () => {
    for (const level of levels) {
      for (const d of TIERS) {
        const m = difficultyModifiers(d, level);
        expect(m.enemyHp).toBeLessThanOrEqual(1);
        expect(m.bossHp).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps HARD fair — bounded damage, speed and reaction windows", () => {
    for (const level of levels) {
      const m = difficultyModifiers("blackMonday", level);
      expect(m.enemyDamage).toBeLessThanOrEqual(1.5);
      expect(m.enemySpeed).toBeLessThanOrEqual(1.2);
      expect(m.enemyCooldown).toBeGreaterThanOrEqual(0.6);
      expect(m.projectileDamage).toBeLessThanOrEqual(1.5);
    }
  });

  it("returns a stable, shared record (no per-level difficulty state)", () => {
    expect(difficultyModifiers("easy", 5)).toBe(difficultyModifiers("easy", 5));
    expect(difficultyModifiers("easy", 5)).not.toBe(difficultyModifiers("normal", 5));
  });
});

/** Absolute authored challenge for a level at a given tier. */
function levelBaseline(level: number, d: Difficulty): number {
  const m = difficultyModifiers(d, level);
  const waves = LEVELS[level].waves;
  const hp = waves.reduce((s, w) => s + w.hp, 0) / waves.length * m.enemyHp;
  const speed = waves.reduce((s, w) => s + w.speed, 0) / waves.length * m.enemySpeed;
  const boss = LEVELS[level].boss.hp * m.bossHp;
  return hp * 2 + speed * 20 + boss * 0.1;
}

describe("difficulty reaches the actual spawners", () => {
  it("spawns fewer, weaker-hitting waves on EASY than on HARD", () => {
    for (const level of levels) {
      const easy = spawnEnemies(level, 0, 100, "easy");
      const hard = spawnEnemies(level, 0, 100, "blackMonday");
      expect(easy.length).toBeLessThan(hard.length);
      expect(easy[0].hp).toBeLessThanOrEqual(hard[0].hp);
    }
  });

  it("gives every boss the same identity with a tier-scaled health pool", () => {
    for (const level of levels) {
      const name = LEVELS[level].boss.name;
      const easy = scaleBossForDifficulty(spawnBoss(100, level), "easy", level);
      const normal = scaleBossForDifficulty(spawnBoss(100, level), "normal", level);
      const hard = scaleBossForDifficulty(spawnBoss(100, level), "blackMonday", level);
      expect([easy.bossName, normal.bossName, hard.bossName]).toEqual([name, name, name]);
      expect(easy.hp).toBeLessThanOrEqual(normal.hp);
      expect(normal.hp).toBe(LEVELS[level].boss.hp);
      expect(hard.hp).toBe(LEVELS[level].boss.hp);
      expect(easy.hp).toBe(easy.maxHp);
    }
  });

  it("keeps level 7 TICKER TAKER present and intact on every tier", () => {
    for (const d of TIERS) {
      const boss = scaleBossForDifficulty(spawnBoss(100, 6), d, 6);
      expect(boss.bossName).toBe("TICKER TAKER");
      expect(boss.hp).toBeGreaterThan(0);
      expect(boss.isBoss).toBe(true);
    }
  });

  it("never removes content on EASY — all 7 levels, waves and bosses remain", () => {
    expect(TOTAL_LEVELS).toBe(7);
    for (const level of levels) {
      for (let w = 0; w < LEVELS[level].waves.length; w++) {
        expect(spawnEnemies(level, w, 100, "easy").length).toBeGreaterThan(0);
      }
      expect(difficultyModifiers("easy", level).bossMinions).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("difficulty persistence", () => {
  it("retry keeps the selected difficulty and only HARD restarts the run", () => {
    expect(retryLevelFor("easy", 4)).toBe(4);
    expect(retryLevelFor("normal", 4)).toBe(4);
    expect(retryLevelFor("blackMonday", 4)).toBe(0);
    expect(retryButtonLabel("easy", 4)).toBe("RETRY LEVEL 5");
  });

  it("resolves identically for the same tier regardless of how a run started", () => {
    // Free Play (any start level) and Continue (saved level) both resolve
    // through the same tier + level pair.
    expect(difficultyModifiers("easy", 3)).toBe(difficultyModifiers("easy", 3));
    expect(difficultyModifiers("normal", 0)).toEqual(difficultyModifiers("normal", 6));
  });
});
