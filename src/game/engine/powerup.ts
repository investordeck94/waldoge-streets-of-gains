/**
 * Power-up kinematics — pure, deterministic, allocation-free.
 *
 * Extracted from the power-up `.filter` block in StreetBrawler.tsx so the
 * same motion rules can be shared by a future 3D renderer.
 *
 * Contract:
 *   • Mutates the passed pickup in place. Preserves object identity.
 *   • No allocations. No RNG. No globals. No time source.
 *   • Applies exactly what the inline block applied, in the same order:
 *       1. capture prevY   (returned to caller for platform-landing check)
 *       2. vy += POWERUP_GRAVITY
 *       3. y  += vy
 *       4. timer--
 *   • Does NOT clamp to ground, snap to platforms, detect pickup,
 *     apply effects, or touch audio. Those responsibilities remain with
 *     the caller (Presentation loop).
 *
 * The gravity value lives in `@/game/config/powerups` — it is a gameplay
 * tuning value, not an engine constant, and is centralized alongside the
 * rest of the powerup config.
 */

import { POWERUP_GRAVITY } from "@/game/config/powerups";

/** Minimum shape required by `stepPowerUp`. Real pickups carry additional
 *  fields (x, type) that this helper does not read or mutate. */
export interface PowerUpKinematics {
  y: number;
  vy: number;
  timer: number;
}

/** Advance a power-up by one frame, in place. Returns the pre-integration
 *  `y` so the caller can perform its platform-landing check without a
 *  second read. Zero allocations. */
export function stepPowerUp<T extends PowerUpKinematics>(pu: T): number {
  const prevY = pu.y;
  pu.vy += POWERUP_GRAVITY;
  pu.y += pu.vy;
  pu.timer--;
  return prevY;
}
