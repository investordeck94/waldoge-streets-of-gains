/**
 * Enemy module — Waldoge: Street of Gains
 * ---------------------------------------------------------------------------
 * PURPOSE
 * Central home for enemy + boss *data model* and spawn factories. Mirrors
 * the pattern established by Player.ts: we lift the safe, side-effect-free
 * pieces here so a future 3D scene can consume the same shapes, without
 * moving anything that would change per-frame behaviour.
 *
 * WHAT IS EXTRACTED
 *   • Enemy / Boss share the Entity structural type (defined in Player.ts).
 *     Re-exported here as `Enemy` for readability at call sites.
 *   • `spawnEnemies(levelIndex, waveIndex, playerX, diff)` — pure factory
 *     that returns a fresh grunt wave. Identical output to the previous
 *     inline function in StreetBrawler.tsx (same Math.random cadence, same
 *     spacing, same HP curve, same DIFFICULTY_ENEMY_MULT scaling).
 *   • `spawnBoss(playerX, levelIndex)` — pure factory that returns a fresh
 *     boss. Identical to the previous inline function including the
 *     LEVEL_WIDTH clamp that keeps the boss reachable.
 *   • Small type-narrowing / read-only helpers (isBoss, isAlive, faceTowards
 *     variant, distanceToPlayer) that mirror the exact arithmetic already
 *     inlined in the game loop. They are provided for future use; nothing
 *     is auto-wired.
 *
 * WHAT IS INTENTIONALLY LEFT INSIDE StreetBrawler.tsx
 * The enemy AI update loop in StreetBrawler.tsx (grunt state machine + boss
 * multi-phase state machine) runs inside the same rAF closure that also
 * updates the player, camera, projectiles, hit-pause, screen shake, hit
 * effects, weapon pickups, powerups, and platforms. Every AI branch reads
 * from and writes to shared refs on `g`:
 *   • g.player          — target position, HP, facing
 *   • g.camX / g.vxHistory / g.camAnchor — camera math is read to gate
 *                          off-screen AI behaviour and boss intros
 *   • g.projectiles     — bosses spawn projectiles directly into this array
 *   • g.effects         — hit numbers / status text are pushed inline
 *   • g.hitPause / g.camShake — knockback + damage feedback are set in-line
 *                          alongside the state transition that caused them
 *   • g.combo, g.weaponType, g.shurikenAmmo — combat resolution against
 *                          enemies depends on the player's current combo
 *                          and weapon state
 *   • g.bossIntro       — phase transitions gate camera locks / music cues
 *
 * The user's explicit rules forbid changing AI, attacks, movement,
 * knockback, collision, spawn behaviour, or boss behaviour. Moving the
 * update loop into this module would either:
 *   (a) require passing 10+ refs across a module boundary, changing timing
 *       by even one frame,
 *   (b) split hit-pause / knockback / stateTimer decrement across two
 *       systems that currently run in lock-step,
 *   (c) reorder AI updates relative to camera / projectile / effect
 *       spawns, subtly changing hit registration.
 *
 * Everything below is byte-identical in behaviour to the original inline
 * definitions in StreetBrawler.tsx.
 * ---------------------------------------------------------------------------
 */

import type { PlayerEntity, PlayerAttackState } from "@/game/player/Player";
import { GROUND_Y, LEVEL_WIDTH } from "@/game/config";
import { LEVELS } from "@/game/config/levels";
import {
  DIFFICULTY_ENEMY_MULT,
  type Difficulty,
} from "@/game/config/difficulty";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
// Enemies, bosses, and the player share the same structural Entity shape.
// We re-export that shape under enemy-flavoured aliases so this module
// reads clearly at call sites without introducing a parallel type system.

export type EnemyAttackState = PlayerAttackState;
export type Enemy = PlayerEntity;

// ---------------------------------------------------------------------------
// Grunt spawn — identical to the original inline function.
// ---------------------------------------------------------------------------
// Preserves:
//   • Wave-count scaling via DIFFICULTY_ENEMY_MULT
//   • Spawn spacing: playerX + 400 + i * 130 + rand * 200
//   • HP taken directly from LEVELS[lvl].waves[wave].hp
//   • Initial aiTimer randomisation to desync AI decisions across the wave
//   • Random.next() call cadence — DO NOT reorder Math.random() calls; the
//     game's spawn placement is deterministic-under-seed if seeded later.

export function spawnEnemies(
  levelIndex: number,
  waveIndex: number,
  playerX: number,
  diff: Difficulty = "normal",
): Enemy[] {
  const lvl = LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
  const w = lvl?.waves[waveIndex];
  if (!w) return [];
  const count = Math.max(1, Math.round(w.count * DIFFICULTY_ENEMY_MULT[diff]));
  return Array.from({ length: count }, (_, i) => ({
    x: playerX + 400 + i * 130 + Math.random() * 200,
    y: GROUND_Y,
    vy: 0,
    vx: 0,
    width: 30,
    height: 70,
    facing: -1 as const,
    hp: w.hp,
    maxHp: w.hp,
    state: "idle" as EnemyAttackState,
    stateTimer: 0,
    attackCooldown: 0,
    aiTimer: Math.random() * 60,
  }));
}

// ---------------------------------------------------------------------------
// Boss spawn — identical to the original inline function.
// ---------------------------------------------------------------------------
// Preserves:
//   • LEVEL_WIDTH clamp so the boss never spawns past the right edge (which
//     would leave them stuck off-world, unable to reach the player).
//   • Larger hitbox (50x90) and stronger starting cooldown (60) than grunts.
//   • bossPhase starts at 1, aiTimer at 90 — used by phase-transition AI.
//   • bossName pulled straight from the level config so rendering picks the
//     right custom head sprite.

export function spawnBoss(playerX: number, levelIndex: number): Enemy {
  const cfg = LEVELS[Math.min(levelIndex, LEVELS.length - 1)].boss;
  const spawnX = Math.min(
    LEVEL_WIDTH - 80,
    Math.max(playerX + 350, playerX + 500),
  );
  return {
    x: spawnX,
    y: GROUND_Y,
    vy: 0,
    vx: 0,
    width: 50,
    height: 90,
    facing: -1,
    hp: cfg.hp,
    maxHp: cfg.hp,
    state: "idle",
    stateTimer: 0,
    attackCooldown: 60,
    isBoss: true,
    bossPhase: 1,
    aiTimer: 90,
    bossName: cfg.name,
  };
}

// ---------------------------------------------------------------------------
// Read-only helpers. Named wrappers around the arithmetic already inlined
// in the game loop. Nothing here mutates game state; nothing is auto-wired.
// Provided so future refactor passes can migrate call sites one at a time
// while verifying byte parity.
// ---------------------------------------------------------------------------

export function isBoss(e: Enemy): boolean {
  return e.isBoss === true;
}

export function isEnemyAlive(e: Enemy): boolean {
  return e.hp > 0 && e.state !== "dead";
}

/** Horizontal distance from enemy to a target x, signed (target - enemy). */
export function signedDeltaX(e: Enemy, targetX: number): number {
  return targetX - e.x;
}

export function distanceToPlayer(e: Enemy, player: PlayerEntity): number {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  return Math.hypot(dx, dy);
}

/** Face the enemy toward a target x. Identical to the inline pattern. */
export function faceTowardsX(e: Enemy, targetX: number): void {
  e.facing = targetX >= e.x ? 1 : -1;
}

/**
 * Boss phase from HP fraction — mirrors the phase-gating math currently
 * inlined in the boss AI branch. Left as a pure helper for reference; not
 * called anywhere yet so the live boss state machine remains untouched.
 */
export function bossPhaseFromHp(e: Enemy): 1 | 2 | 3 {
  const frac = e.hp / e.maxHp;
  if (frac <= 1 / 3) return 3;
  if (frac <= 2 / 3) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// FUTURE WORK (not this pass)
// ---------------------------------------------------------------------------
// updateEnemies(enemies, world, dt) — a single frame-step function that
// runs the grunt + boss state machines against a world snapshot (player,
// projectiles buffer, effects buffer, camera). It will replace the
// hundreds of lines of inline AI in StreetBrawler.tsx, but only *after*
// the projectile, effect, camera and combat systems have been factored
// out. Attempting it now would violate the "do not change AI / attacks /
// movement / knockback / collision / spawn / boss behaviour" rule.
