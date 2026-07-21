/**
 * Pure physics helpers. Frame-based (fixed dt of 1 frame @ 60fps to match
 * the current game loop). No canvas, no DOM.
 *
 * These functions are non-mutating: they return updated fields, leaving
 * the caller to decide when/how to apply them. This makes them safe to
 * unit-test and to reuse from a future 3D physics layer that swaps in a
 * capsule collider without changing the integration equations.
 */

import { GRAVITY, GROUND_Y } from "@/game/config";

export interface PhysicsBody {
  x: number; y: number;
  vx: number; vy: number;
  height: number;
}

/** Apply gravity for one frame and return the new vy. */
export function applyGravity(vy: number, gravity: number = GRAVITY): number {
  return vy + gravity;
}

/** Integrate position by velocity for one frame. */
export function integrate(body: PhysicsBody): { x: number; y: number } {
  return { x: body.x + body.vx, y: body.y + body.vy };
}

/** Clamp a body to the ground plane. Returns the new y and vy (0 on land). */
export function clampToGround(
  y: number,
  vy: number,
  groundY: number = GROUND_Y,
): { y: number; vy: number; grounded: boolean } {
  if (y >= groundY) return { y: groundY, vy: 0, grounded: true };
  return { y, vy, grounded: false };
}

/** True if the body is standing on (or below) the ground. */
export function isGrounded(y: number, groundY: number = GROUND_Y): boolean {
  return y >= groundY;
}
