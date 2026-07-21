/**
 * Projectile kinematics — pure, deterministic, allocation-free.
 *
 * Extracted from the projectile `.filter` block in StreetBrawler.tsx so the
 * same motion rules can be shared by a future 3D renderer.
 *
 * Contract:
 *   • Mutates the passed projectile in place. Preserves object identity.
 *   • No allocations. No RNG. No globals. No time source.
 *   • Applies exactly what the inline block applied, in the same order:
 *       1. x += vx
 *       2. y += vy
 *       3. if (!isPlayerProjectile) vy += PROJECTILE_GRAVITY_ENEMY
 *       4. timer--
 *   • Does NOT despawn, collide, damage, spawn effects, or touch audio.
 *     Those responsibilities remain with the caller (Presentation loop).
 */

/** Per-frame gravity applied to enemy/boss projectiles. Player shurikens
 *  travel in a straight line and never receive gravity. */
export const PROJECTILE_GRAVITY_ENEMY = 0.15;

/** Minimum shape required by `stepProjectile`. Real projectiles carry
 *  additional fields (damage, isPlayerProjectile flag) — those are ignored
 *  here except for the gravity gate. */
export interface ProjectileKinematics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  isPlayerProjectile?: boolean;
}

/** Advance a projectile by one frame, in place. Returns the same reference
 *  so call sites can chain if convenient; identity is preserved. */
export function stepProjectile<T extends ProjectileKinematics>(p: T): T {
  p.x += p.vx;
  p.y += p.vy;
  if (!p.isPlayerProjectile) p.vy += PROJECTILE_GRAVITY_ENEMY;
  p.timer--;
  return p;
}
