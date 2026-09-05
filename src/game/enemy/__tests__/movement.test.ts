import { describe, it, expect } from "vitest";
import {
  sanitizeEnemyMotion,
  clampEnemyToWorld,
  updateStuckWatchdog,
  STUCK_FRAMES_LIMIT,
  ENEMY_WORLD_MARGIN,
  type MovingEnemy,
} from "@/game/enemy/movement";
import { spawnBoss } from "@/game/enemy/Enemy";
import { LEVELS } from "@/game/config/levels";
import { GROUND_Y, LEVEL_WIDTH } from "@/game/config";

const levels = LEVELS.map((_, i) => i);

function bossFor(level: number): MovingEnemy {
  return spawnBoss(500, level) as MovingEnemy;
}

describe("shared enemy movement safety layer", () => {
  it.each(levels)("level %i boss: released from an overrun action state", (lvl) => {
    const e = bossFor(lvl);
    e.state = "boss_slam";
    e.stateTimer = -30; // exit frame was missed
    sanitizeEnemyMotion(e, GROUND_Y);
    expect(e.state).toBe("idle");
    expect(e.stateTimer).toBe(0);
  });

  it.each(levels)("level %i boss: repairs non-finite motion", (lvl) => {
    const e = bossFor(lvl);
    e.x = NaN;
    e.vx = Infinity;
    e.vy = NaN;
    sanitizeEnemyMotion(e, GROUND_Y);
    expect(Number.isFinite(e.x)).toBe(true);
    expect(e.vx).toBe(0);
    expect(e.vy).toBe(0);
  });

  it.each(levels)("level %i boss: stays inside the level bounds", (lvl) => {
    const e = bossFor(lvl);
    e.x = LEVEL_WIDTH + 900;
    e.vx = 12;
    clampEnemyToWorld(e, LEVEL_WIDTH);
    expect(e.x).toBe(LEVEL_WIDTH - ENEMY_WORLD_MARGIN);
    expect(e.vx).toBe(0);

    e.x = -400;
    e.vx = -12;
    clampEnemyToWorld(e, LEVEL_WIDTH);
    expect(e.x).toBe(ENEMY_WORLD_MARGIN);
    expect(e.vx).toBe(0);
  });

  it.each(levels)("level %i boss: recovers when it stops making progress", (lvl) => {
    const e = bossFor(lvl);
    e.state = "boss_charge";
    e.stateTimer = 5;
    e.attackCooldown = 999;
    const playerX = e.x - 500;

    let recovered = false;
    for (let f = 0; f <= STUCK_FRAMES_LIMIT + 2 && !recovered; f++) {
      recovered = updateStuckWatchdog(e, playerX, true);
    }

    expect(recovered).toBe(true);
    expect(e.state).toBe("idle");
    expect(e.attackCooldown).toBe(0);
    expect(e.facing).toBe(-1); // now facing the player again
  });

  it("does not flag a fighter that is deliberately holding position", () => {
    const e = bossFor(0);
    for (let f = 0; f < STUCK_FRAMES_LIMIT * 2; f++) {
      expect(updateStuckWatchdog(e, e.x, false)).toBe(false);
    }
  });

  it("does not flag a fighter that keeps moving", () => {
    const e = bossFor(0);
    for (let f = 0; f < STUCK_FRAMES_LIMIT * 2; f++) {
      e.x -= 2;
      expect(updateStuckWatchdog(e, 0, true)).toBe(false);
    }
  });

  it.each(levels)("level %i boss: closes distance over time once recovered", (lvl) => {
    const e = bossFor(lvl);
    const cfg = LEVELS[lvl].boss;
    const playerX = 100;
    const startDist = Math.abs(playerX - e.x);
    for (let f = 0; f < 200; f++) {
      sanitizeEnemyMotion(e, GROUND_Y);
      e.facing = playerX >= e.x ? 1 : -1;
      if (Math.abs(playerX - e.x) > 60) e.x += e.facing * cfg.aiSpeed;
      clampEnemyToWorld(e, LEVEL_WIDTH);
      updateStuckWatchdog(e, playerX, Math.abs(playerX - e.x) > 60);
    }
    expect(Math.abs(playerX - e.x)).toBeLessThan(startDist);
  });
});
