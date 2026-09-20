import { describe, expect, it } from "vitest";
import { CAT_GUARD_ASSETS, CAT_GUARD_GROUPS, CAT_GUARD_OUTFITS, catGuardFrameFor, catGuardPoseFor } from "../catGuardSprites";

const view = (variant: "catBlack" | "catOrange") => ({
  x: 0, y: 320, height: 70, facing: 1, state: "idle", stateTimer: 0,
  hp: 50, maxHp: 50, variant,
});

describe("Cat Guard production sprite registration", () => {
  it("registers the supplied Black and Orange/White sheets", () => {
    expect(CAT_GUARD_ASSETS.catBlack).toContain("cat-guard-black-production.png");
    expect(CAT_GUARD_ASSETS.catOrange).toContain("cat-guard-orange-production.png");
    expect(CAT_GUARD_OUTFITS.catBlack).toBe("BLACK TRACKSUIT + RED/GOLD DETAILS");
    expect(CAT_GUARD_OUTFITS.catOrange).toBe("WHITE TRACKSUIT + GOLD STRIPES");
  });

  it("preserves every production state and authored frame count", () => {
    expect(CAT_GUARD_GROUPS.catBlack.cartwheel.count).toBe(8);
    expect(CAT_GUARD_GROUPS.catOrange.cartwheel.count).toBe(8);
    expect(CAT_GUARD_GROUPS.catBlack.climb.count).toBe(6);
    expect(CAT_GUARD_GROUPS.catOrange.defeat.count).toBe(6);
    expect(Object.keys(CAT_GUARD_GROUPS.catOrange)).toEqual(Object.keys(CAT_GUARD_GROUPS.catBlack));
  });

  it("maps hit, defeat, ladder, locomotion and attack states", () => {
    expect(catGuardPoseFor({ ...view("catOrange"), state: "hit" })).toBe("hit");
    expect(catGuardPoseFor({ ...view("catBlack"), state: "dead" })).toBe("defeat");
    expect(catGuardPoseFor({ ...view("catBlack"), climbing: true })).toBe("climb");
    expect(catGuardPoseFor({ ...view("catBlack"), state: "walk", catRunning: true })).toBe("run");
    expect(catGuardPoseFor({ ...view("catOrange"), catMove: "roundhouse" })).toBe("roundhouse");
  });

  it("advances the real eight-frame Cartwheel in source order", () => {
    const frames = Array.from({ length: 8 }, (_, index) => catGuardFrameFor({
      ...view("catBlack"), state: "kick", stateTimer: 48 - index * 6, catMove: "cartwheel" as const,
    }).index);
    expect(frames).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("uses explicit in-bounds rectangles with a stable feet anchor", () => {
    for (const variant of ["catBlack", "catOrange"] as const) {
      for (const pose of Object.values(CAT_GUARD_GROUPS[variant])) {
        expect(pose.frames).toHaveLength(pose.count);
        for (const frame of pose.frames) {
          expect(frame.w).toBeGreaterThan(0);
          expect(frame.h).toBeGreaterThan(0);
          expect(frame.x + frame.w).toBeLessThanOrEqual(1536);
          expect(frame.y + frame.h).toBeLessThanOrEqual(1024);
          expect(frame.anchorY).toBe(frame.h);
          expect(frame.scale).toBeGreaterThan(0);
        }
      }
    }
  });
});