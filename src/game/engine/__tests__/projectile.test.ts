import { describe, expect, it } from "vitest";
import {
  PROJECTILE_GRAVITY_ENEMY,
  stepProjectile,
  type ProjectileKinematics,
} from "../projectile";

/** Reference implementation: the exact inline math that was in
 *  StreetBrawler.tsx before extraction. Used as a byte-parity oracle. */
function inlineStep(p: ProjectileKinematics): void {
  p.x += p.vx;
  p.y += p.vy;
  if (!p.isPlayerProjectile) p.vy += 0.15;
  p.timer--;
}

const clone = (p: ProjectileKinematics): ProjectileKinematics => ({ ...p });

describe("stepProjectile", () => {
  it("exports the same gravity constant as the original inline value", () => {
    expect(PROJECTILE_GRAVITY_ENEMY).toBe(0.15);
  });

  it("mutates in place and preserves object identity (no allocation)", () => {
    const p: ProjectileKinematics = {
      x: 0, y: 0, vx: 5, vy: 0, timer: 60, isPlayerProjectile: true,
    };
    const returned = stepProjectile(p);
    expect(returned).toBe(p);
  });

  it.each([1, 2, 5, 30, 60])(
    "player shuriken: %i-frame parity with inline math (no gravity)",
    (frames) => {
      const a: ProjectileKinematics = {
        x: 100, y: 200, vx: 8, vy: 0, timer: 90, isPlayerProjectile: true,
      };
      const b = clone(a);
      for (let i = 0; i < frames; i++) {
        stepProjectile(a);
        inlineStep(b);
      }
      expect(a).toEqual(b);
      expect(a.vy).toBe(0); // sanity: player projectiles never receive gravity
    },
  );

  it.each([1, 2, 5, 30, 60])(
    "boss projectile: %i-frame parity with inline math (gravity applied)",
    (frames) => {
      const a: ProjectileKinematics = {
        x: 500, y: 150, vx: -4, vy: -3, timer: 120, isPlayerProjectile: false,
      };
      const b = clone(a);
      for (let i = 0; i < frames; i++) {
        stepProjectile(a);
        inlineStep(b);
      }
      expect(a).toEqual(b);
    },
  );

  it("handles the isPlayerProjectile flag being undefined the same as false", () => {
    const a: ProjectileKinematics = { x: 0, y: 0, vx: 1, vy: 0, timer: 10 };
    stepProjectile(a);
    expect(a.vy).toBe(PROJECTILE_GRAVITY_ENEMY);
  });

  it("decrements timer by exactly one per call", () => {
    const p: ProjectileKinematics = { x: 0, y: 0, vx: 0, vy: 0, timer: 10 };
    stepProjectile(p);
    expect(p.timer).toBe(9);
    stepProjectile(p);
    expect(p.timer).toBe(8);
  });
});
