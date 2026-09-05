/**
 * Shared enemy / boss movement safety layer — Waldoge: Street of Gains
 * ---------------------------------------------------------------------------
 * Used by EVERY enemy and EVERY boss on ALL 7 levels. It does not change AI
 * decisions, attack patterns, speeds, damage or balance. It only guarantees
 * that a fighter can never end up permanently unable to move:
 *
 *   1. sanitizeEnemyMotion()  — kills NaN/Infinity in position + velocity and
 *      releases action states whose exit frame was missed (a state whose timer
 *      has run past its floor can otherwise latch forever, because the boss AI
 *      skips all movement while it believes it is mid-attack).
 *   2. clampEnemyToWorld()    — keeps fighters inside the playable level, the
 *      same way the player is clamped. Charge attacks + knockback could
 *      previously push a boss outside the world where it kept drifting.
 *   3. updateStuckWatchdog()  — if a fighter *wants* to chase but its world
 *      position has not meaningfully changed for a while, its state machine is
 *      force-released (idle, timers cleared, small nudge toward the target) so
 *      it always recovers from collisions, geometry, or a missed transition.
 */

import type { PlayerEntity } from "@/game/player/Player";

/** Enemies stay this far inside the level bounds. */
export const ENEMY_WORLD_MARGIN = 40;
/** Movement below this many px/frame counts as "not actually moving". */
export const STUCK_EPSILON = 0.35;
/** Frames of wanting-to-move-but-not-moving before we force a recovery. */
export const STUCK_FRAMES_LIMIT = 75;
/** How far past its natural end a state may linger before being released. */
export const STATE_TIMER_FLOOR = -1;

/** Fields the watchdog stores on the entity. Optional + additive. */
export interface EnemyMotionFields {
  stuckFrames?: number;
  lastWatchdogX?: number;
}

export type MovingEnemy = PlayerEntity & EnemyMotionFields;

const ACTION_STATES = new Set([
  "punch",
  "kick",
  "hit",
  "boss_charge",
  "boss_slam",
  "boss_throw",
  "uppercut",
  "spinkick",
  "groundpound",
  "dashpunch",
]);

/**
 * Repair impossible numeric state and release action states that overran
 * their exit frame. Safe to call every frame for every enemy.
 */
export function sanitizeEnemyMotion(e: MovingEnemy, groundY: number): void {
  if (!Number.isFinite(e.x)) e.x = 0;
  if (!Number.isFinite(e.y)) e.y = groundY;
  if (!Number.isFinite(e.vx ?? 0)) e.vx = 0;
  if (!Number.isFinite(e.vy ?? 0)) e.vy = 0;
  if (!Number.isFinite(e.stateTimer)) e.stateTimer = 0;
  if (!Number.isFinite(e.attackCooldown)) e.attackCooldown = 0;

  if (e.state === "dead") return;

  // A committed action whose timer is already spent must not keep the
  // fighter locked out of its movement branch.
  if (ACTION_STATES.has(e.state) && e.stateTimer <= STATE_TIMER_FLOOR) {
    e.state = "idle";
    e.stateTimer = 0;
  }
}

/** Keep a fighter inside the playable level, mirroring the player clamp. */
export function clampEnemyToWorld(e: MovingEnemy, levelWidth: number): void {
  const min = ENEMY_WORLD_MARGIN;
  const max = Math.max(min, levelWidth - ENEMY_WORLD_MARGIN);
  if (e.x < min) {
    e.x = min;
    if ((e.vx ?? 0) < 0) e.vx = 0;
  } else if (e.x > max) {
    e.x = max;
    if ((e.vx ?? 0) > 0) e.vx = 0;
  }
}

/**
 * Detect and recover a fighter that wants to reach the player but is not
 * making progress. Returns true when a recovery was applied this frame.
 *
 * `wantsToMove` should be false while the fighter is deliberately holding
 * position (dead, mid-attack by design, already in range) so normal pauses
 * are never mistaken for being stuck.
 */
export function updateStuckWatchdog(
  e: MovingEnemy,
  targetX: number,
  wantsToMove: boolean,
): boolean {
  if (e.state === "dead" || !wantsToMove) {
    e.stuckFrames = 0;
    e.lastWatchdogX = e.x;
    return false;
  }

  const prev = e.lastWatchdogX;
  e.lastWatchdogX = e.x;
  if (prev === undefined) {
    e.stuckFrames = 0;
    return false;
  }

  if (Math.abs(e.x - prev) < STUCK_EPSILON) {
    e.stuckFrames = (e.stuckFrames ?? 0) + 1;
  } else {
    e.stuckFrames = 0;
    return false;
  }

  if ((e.stuckFrames ?? 0) < STUCK_FRAMES_LIMIT) return false;

  // Force-release: clear whatever is holding the state machine, re-face the
  // target and nudge just enough to break contact with whatever blocks it.
  const dir: 1 | -1 = targetX >= e.x ? 1 : -1;
  e.stuckFrames = 0;
  e.state = "idle";
  e.stateTimer = 0;
  e.attackCooldown = 0;
  e.vx = 0;
  e.facing = dir;
  e.x += dir * 4;
  e.lastWatchdogX = e.x;
  return true;
}
