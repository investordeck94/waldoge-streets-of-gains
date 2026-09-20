import { describe, expect, it } from "vitest";
import { difficultyModifiers } from "@/game/config/difficulty";
import {
  appendCatGuardRoster, authoredCatGuardRoster, CARTWHEEL_PHASES, CAT_GUARD_MOVES,
  cartwheelPhase, isCatGuard, resolveCatGuardStrike, stepCatGuard, type CatGuardState,
} from "../catGuards";

const grunt = (): CatGuardState => ({
  x: 100, y: 320, vx: 0, vy: 0, width: 30, height: 70, facing: 1,
  hp: 80, maxHp: 80, state: "idle", stateTimer: 0, attackCooldown: 0,
});

describe("Level 7 Cat Guards", () => {
  it("appends both variants without replacing Candle Minions", () => {
    const candles = [grunt(), grunt()];
    const original = [...candles];
    appendCatGuardRoster(candles, 6, 3);
    expect(candles.slice(0, 2)).toEqual(original);
    expect(candles.filter(isCatGuard).map((e) => e.variant)).toEqual([
      "catBlack", "catOrange", "catBlack", "catOrange",
    ]);
  });

  it("never spawns outside Level 7", () => {
    for (let level = 0; level < 6; level++) {
      const enemies = [grunt()];
      appendCatGuardRoster(enemies, level, 3);
      expect(enemies).toHaveLength(1);
      expect(enemies.some(isCatGuard)).toBe(false);
    }
  });

  it("authors progressive key, prison and final-approach positions below the boss arena", () => {
    expect(authoredCatGuardRoster(0)).toHaveLength(1);
    expect(authoredCatGuardRoster(3).some((guard) => guard.x >= 6260 && guard.x <= 7100)).toBe(true);
    expect(Math.max(...authoredCatGuardRoster(4).map((guard) => guard.x))).toBeLessThan(8400);
  });

  it("maps all eight Cartwheel phases in order", () => {
    const seen = Array.from({ length: 8 }, (_, i) => cartwheelPhase(48 - i * 6));
    expect(seen).toEqual(CARTWHEEL_PHASES);
  });

  it("activates Cartwheel damage only at sweep/impact and latches one hit", () => {
    const guard = { ...grunt(), variant: "catBlack" as const, state: "kick" as const, catMove: "cartwheel" as const };
    const target = { x: 145, y: 320, width: 30, height: 70, state: "idle" as const };
    guard.stateTimer = 30;
    expect(resolveCatGuardStrike(guard, target).hit).toBe(false);
    guard.stateTimer = 20;
    expect(resolveCatGuardStrike(guard, target).hit).toBe(true);
    guard.catAttackLanded = true;
    expect(resolveCatGuardStrike(guard, target).hit).toBe(false);
  });

  it("supports every standard move and both requested combos", () => {
    expect(Object.keys(CAT_GUARD_MOVES)).toEqual(["lightPunch", "heavyPunch", "frontKick", "roundhouse", "cartwheel"]);
    const guard = { ...grunt(), variant: "catBlack" as const };
    stepCatGuard(guard, { x: 130, y: 320, hp: 100, state: "idle" }, 2.5, difficultyModifiers("normal", 6), () => 0.1);
    expect([guard.catMove, ...(guard.catCombo ?? [])]).toEqual(["lightPunch", "lightPunch", "frontKick"]);
    guard.state = "idle"; guard.stateTimer = 0; guard.catMove = undefined; guard.catCombo = undefined; guard.attackCooldown = 0; guard.catDecision = 0;
    stepCatGuard(guard, { x: 130, y: 320, hp: 100, state: "idle" }, 2.5, difficultyModifiers("normal", 6), () => 0.3);
    expect([guard.catMove, ...(guard.catCombo ?? [])]).toEqual(["lightPunch", "cartwheel"]);
  });

  it("uses global difficulty for slower Easy and tighter Hard recovery", () => {
    const easy = { ...grunt(), variant: "catBlack" as const };
    const hard = { ...grunt(), variant: "catBlack" as const };
    stepCatGuard(easy, { x: 130, y: 320, hp: 100, state: "idle" }, 2.5, difficultyModifiers("easy", 6), () => 0.9);
    stepCatGuard(hard, { x: 130, y: 320, hp: 100, state: "idle" }, 2.5, difficultyModifiers("blackMonday", 6), () => 0.9);
    expect(easy.attackCooldown).toBeGreaterThan(hard.attackCooldown);
  });
});