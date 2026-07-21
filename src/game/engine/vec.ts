/**
 * Pure vector helpers. No side effects, no allocations beyond the returned
 * object. Both 2D and 3D variants are provided because the eventual 3D
 * renderer will consume the same gameplay data and needs Vec3 math without
 * pulling a full linear-algebra library.
 *
 * These helpers are intentionally non-mutating: they return new objects.
 * The current 2D game loop uses inline scalar math in the hot path and
 * SHOULD continue to do so — these are for new systems (AI planning,
 * tests, 3D scene) where clarity matters more than allocation cost.
 */

import type { Vec2, Vec3 } from "../core/types";

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });
export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

// ---------------------------------------------------------------------------
// 2D
// ---------------------------------------------------------------------------

export const add2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale2 = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const length2 = (a: Vec2): number => Math.hypot(a.x, a.y);
export const distance2 = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize2 = (a: Vec2): Vec2 => {
  const len = Math.hypot(a.x, a.y);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
};
export const lerp2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

// ---------------------------------------------------------------------------
// 3D
// ---------------------------------------------------------------------------

export const add3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale3 = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const dot3 = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const length3 = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const distance3 = (a: Vec3, b: Vec3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const normalize3 = (a: Vec3): Vec3 => {
  const len = Math.hypot(a.x, a.y, a.z);
  return len === 0 ? { x: 0, y: 0, z: 0 } : { x: a.x / len, y: a.y / len, z: a.z / len };
};
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

// ---------------------------------------------------------------------------
// Scalars
// ---------------------------------------------------------------------------

/** Clamp x to [min, max]. */
export const clamp = (x: number, min: number, max: number): number =>
  x < min ? min : x > max ? max : x;

/** Linear interpolate scalars. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Sign, but returns 0 for 0 (unlike `Math.sign` in edge cases). */
export const sign = (x: number): -1 | 0 | 1 => (x > 0 ? 1 : x < 0 ? -1 : 0);
