/**
 * Grunt (non-boss) melee strike resolution — pure, no rendering, no mutation.
 *
 * ROOT CAUSE THIS ADDRESSES
 * The inline grunt attack check in StreetBrawler.tsx used the same
 * centre-point test that `src/game/core/strike.ts` was written to replace:
 *
 *   edx = player.x - enemy.x
 *   hit = edx * enemy.facing > 0 && Math.abs(edx) < range
 *
 * At close range — precisely when a punch visually lands — the two bodies
 * partially overlap, so `edx` can be ~0 or slightly the wrong sign and the
 * connecting punch registers nothing.
 *
 * It also sampled a SINGLE frame (`stateTimer === 8`). Any frame the enemy
 * spends outside its own attack branch (hit-pause, being staggered, a
 * sanitize pass releasing the state) skips that exact value entirely and the
 * whole attack silently produces no hit test at all.
 *
 * This module keeps the authored ranges, damage and telegraph timings; it
 * only makes the active window a short band (still anticipation → active →
 * recovery) and defers the geometry to the shared AABB solver.
 */

import { strikeConnects } from "@/game/core/strike";
import type { PlayerEntity } from "@/game/player/Player";

export interface GruntStrikeSpec {
  /** First frame (stateTimer value, counting down) the strike is active. */
  activeFrom: number;
  /** Last frame (inclusive) the strike is active. */
  activeTo: number;
  /** Horizontal reach in world units — unchanged from the original values. */
  range: number;
  /** Damage — unchanged from the original values. */
  damage: number;
  /** Total state duration in frames — unchanged. */
  duration: number;
}

/**
 * Punch: 12f total — 3f anticipation, 3f active (9→7), 7f recovery.
 * Kick:  15f total — 4f anticipation, 3f active (11→9), 9f recovery.
 * The original single active frame (8 / 10) sits inside each band.
 */
export const GRUNT_STRIKES: Record<"punch" | "kick", GruntStrikeSpec> = {
  punch: { activeFrom: 9, activeTo: 7, range: 40, damage: 5, duration: 12 },
  kick: { activeFrom: 11, activeTo: 9, range: 50, damage: 6, duration: 15 },
};

export function gruntStrikeSpec(state: string): GruntStrikeSpec | null {
  if (state === "punch") return GRUNT_STRIKES.punch;
  if (state === "kick") return GRUNT_STRIKES.kick;
  return null;
}

/** Is the strike in its ACTIVE portion this frame? */
export function isStrikeActive(spec: GruntStrikeSpec, stateTimer: number): boolean {
  return stateTimer <= spec.activeFrom && stateTimer >= spec.activeTo;
}

/**
 * Full per-frame resolution for one grunt attacking the player.
 *
 * `alreadyLanded` is the per-attack latch that guarantees one punch deals
 * damage at most once even though the active window spans several frames.
 */
export function resolveGruntStrike(
  e: Pick<PlayerEntity, "x" | "y" | "width" | "height" | "facing" | "state" | "stateTimer">,
  p: Pick<PlayerEntity, "x" | "y" | "width" | "height" | "state">,
  alreadyLanded: boolean,
): { hit: boolean; damage: number } {
  const spec = gruntStrikeSpec(e.state);
  if (!spec) return { hit: false, damage: 0 };
  if (alreadyLanded) return { hit: false, damage: 0 };
  if (!isStrikeActive(spec, e.stateTimer)) return { hit: false, damage: 0 };
  if (p.state === "dead") return { hit: false, damage: 0 };

  const connects = strikeConnects(
    { x: e.x, y: e.y, width: e.width, height: e.height, facing: e.facing },
    { x: p.x, y: p.y, width: p.width, height: p.height },
    spec.range,
    false,
    50,
  );
  return connects ? { hit: true, damage: spec.damage } : { hit: false, damage: 0 };
}
