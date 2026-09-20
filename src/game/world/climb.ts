/**
 * Ladder climbing — pure state machine shared by the PLAYER and every ENEMY.
 * ---------------------------------------------------------------------------
 * Deliberately tiny and side-effect-free so it can be unit tested and so the
 * combat system stays untouched: a climbing fighter simply has
 * `climbing === true`, which the game loop uses to skip gravity for that frame.
 *
 * Rules:
 *   • A fighter may only mount a ladder while grounded (on the street or on the
 *     pit floor) and while not mid-attack / hit / dead.
 *   • While climbing, y moves at CLIMB_SPEED and is always clamped between the
 *     ladder's top and bottom — so a climber can never leave the world.
 *   • Reaching either end dismounts automatically and re-grounds the fighter.
 */

import {
  CLIMB_SPEED,
  groundYAt,
  ladderAt,
  type Ladder,
} from "@/game/config/world";

export interface Climber {
  x: number;
  y: number;
  vy?: number;
  vx?: number;
  state: string;
  /** Set while the fighter is attached to a ladder. */
  climbing?: boolean;
  /** World x of the ladder currently held (for rendering + re-grounding). */
  climbLadderX?: number;
  /** Stable identity prevents reacquiring an unrelated ladder mid-climb. */
  climbLadderId?: string;
}

const BLOCKED_STATES = new Set(["dead", "hit"]);

/** Can this fighter start climbing right now? */
export function canMount(c: Climber, level: number, grounded: boolean): Ladder | null {
  if (BLOCKED_STATES.has(c.state)) return null;
  if (!grounded && !c.climbing) return null;
  return ladderAt(level, c.x);
}

/** Attach the fighter to a ladder. */
export function mount(c: Climber, ladder: Ladder): void {
  c.climbing = true;
  c.climbLadderX = ladder.x;
  c.climbLadderId = ladder.id;
  c.x = ladder.x;
  c.vy = 0;
  c.vx = 0;
  c.state = "idle";
}

/** Detach, leaving the fighter grounded wherever they let go. */
export function dismount(c: Climber): void {
  c.climbing = false;
  c.climbLadderX = undefined;
  c.climbLadderId = undefined;
  c.vy = 0;
}

/**
 * Advance one climb frame.
 *
 * @param dir -1 = up (towards ladder.top), +1 = down, 0 = hold position.
 * @returns true while still attached, false once the fighter dismounted.
 */
export function stepClimb(c: Climber, ladder: Ladder, dir: -1 | 0 | 1): boolean {
  if (!Number.isFinite(c.y)) c.y = ladder.top;
  c.x = ladder.x;
  c.vx = 0;
  c.vy = 0;
  if (BLOCKED_STATES.has(c.state)) { dismount(c); return false; }

  if (dir !== 0) c.y += dir * CLIMB_SPEED;

  if (c.y <= ladder.top) {
    c.y = ladder.top;
    if (dir < 0) { dismount(c); return false; }
  }
  if (c.y >= ladder.bottom) {
    c.y = ladder.bottom;
    if (dir > 0) { dismount(c); return false; }
  }
  return true;
}

/**
 * Resolve a completed climb against the same collision surface used by normal
 * ground physics. The entity y-coordinate is its feet anchor, so no visual
 * offset belongs here.
 */
export function ladderExitSurfaceY(
  level: number,
  ladder: Ladder,
  dir: -1 | 1,
): number {
  const endpoint = dir < 0 ? ladder.top : ladder.bottom;
  return groundYAt(level, ladder.x, endpoint);
}

/**
 * Enemy navigation helper: which way does a fighter at `fromY` need to travel
 * on a ladder to reach `targetY`? Returns 0 when already on the right level.
 */
export function climbDirectionFor(fromY: number, targetY: number): -1 | 0 | 1 {
  const d = targetY - fromY;
  if (Math.abs(d) < 6) return 0;
  return d > 0 ? 1 : -1;
}
