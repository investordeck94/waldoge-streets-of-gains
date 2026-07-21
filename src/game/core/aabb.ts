/**
 * Pure AABB collision helpers.
 *
 * Extracted so the same overlap math powers:
 *   • the current 2D melee/projectile checks in StreetBrawler.tsx
 *   • a future 3D collider (capsule-vs-AABB reduces to XZ-plane AABB when
 *     y intervals overlap)
 *   • headless tests
 *
 * NO SIDE EFFECTS. NO CANVAS. NO REACT. Every function is deterministic
 * on its inputs and safe to call from any thread / worker.
 */

import type { AABB, Vec2 } from "./types";

/** Return true if two AABBs overlap (touching edges do NOT count). */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Return true if point `p` lies inside AABB `b`. */
export function pointInAabb(p: Vec2, b: AABB): boolean {
  return p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
}

/** Horizontal centre-to-centre distance (absolute). */
export function horizontalDistance(a: AABB, b: AABB): number {
  return Math.abs((a.x + a.width / 2) - (b.x + b.width / 2));
}

/** True when `a` is horizontally within `range` of `b`, regardless of y. */
export function withinHorizontalRange(a: AABB, b: AABB, range: number): boolean {
  return horizontalDistance(a, b) <= range;
}

/** Signed horizontal delta from `a` to `b` (positive = b is to the right). */
export function horizontalDelta(a: AABB, b: AABB): number {
  return (b.x + b.width / 2) - (a.x + a.width / 2);
}
