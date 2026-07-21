/**
 * Phase 4 — powerup kinematics parity tests.
 *
 * Mirrors the projectile.test.ts template. Locks in behaviour byte-for-byte
 * against a reference implementation of the original inline block.
 */

import { describe, it, expect } from "vitest";
import { stepPowerUp } from "../powerup";
import { POWERUP_GRAVITY } from "@/game/config/powerups";

interface Ref { x: number; y: number; vy: number; timer: number; type: string }

/** Reference implementation — the exact inline math that used to live in
 *  StreetBrawler.tsx, minus the platform/ground/pickup logic (which stays
 *  in the caller). */
function refStep(pu: Ref): number {
  const prevY = pu.y;
  pu.vy += 0.3;
  pu.y += pu.vy;
  pu.timer--;
  return prevY;
}

const make = (over: Partial<Ref> = {}): Ref => ({
  x: 100, y: 200, vy: 0, timer: 600, type: "health", ...over,
});

describe("POWERUP_GRAVITY", () => {
  it("is exactly 0.3", () => {
    expect(POWERUP_GRAVITY).toBe(0.3);
  });
});

describe("stepPowerUp — single tick", () => {
  it("increases vy by exactly POWERUP_GRAVITY", () => {
    const pu = make({ vy: 1 });
    stepPowerUp(pu);
    expect(pu.vy).toBe(1 + POWERUP_GRAVITY);
  });

  it("increases y by post-integration vy (order-sensitive)", () => {
    const pu = make({ y: 200, vy: 1 });
    stepPowerUp(pu);
    expect(pu.y).toBe(200 + (1 + POWERUP_GRAVITY));
  });

  it("returns prevY equal to y before mutation", () => {
    const pu = make({ y: 250, vy: 2 });
    const prev = stepPowerUp(pu);
    expect(prev).toBe(250);
  });

  it("decrements timer by exactly 1", () => {
    const pu = make({ timer: 600 });
    stepPowerUp(pu);
    expect(pu.timer).toBe(599);
  });

  it("does not clamp timer at zero (caller owns the > 0 filter)", () => {
    const pu = make({ timer: 0 });
    stepPowerUp(pu);
    expect(pu.timer).toBe(-1);
  });
});

describe("stepPowerUp — frame parity", () => {
  it("matches reference impl over 60 ticks (positive vy)", () => {
    const a = make({ vy: 0 });
    const b = make({ vy: 0 });
    for (let i = 0; i < 60; i++) { stepPowerUp(a); refStep(b); }
    expect(a.vy).toBe(b.vy);
    expect(a.y).toBe(b.y);
    expect(a.timer).toBe(b.timer);
  });

  it("matches reference impl across apex (initial vy = -3, boss drop)", () => {
    const a = make({ vy: -3, y: 100 });
    const b = make({ vy: -3, y: 100 });
    for (let i = 0; i < 30; i++) { stepPowerUp(a); refStep(b); }
    expect(a.vy).toBe(b.vy);
    expect(a.y).toBe(b.y);
  });

  it("returned prevY matches reference across many ticks", () => {
    const a = make({ vy: -2 });
    const b = make({ vy: -2 });
    for (let i = 0; i < 20; i++) {
      const pa = stepPowerUp(a);
      const pb = refStep(b);
      expect(pa).toBe(pb);
    }
  });
});

describe("stepPowerUp — identity & untouched fields", () => {
  it("does not clone (same reference in/out via mutation)", () => {
    const pu = make();
    const ref = pu;
    stepPowerUp(pu);
    expect(pu).toBe(ref);
  });

  it("does not mutate x or type", () => {
    const pu = make({ x: 123, type: "energy" });
    stepPowerUp(pu);
    expect(pu.x).toBe(123);
    expect(pu.type).toBe("energy");
  });
});
