import { describe, expect, it } from "vitest";
import { CAT_GUARD_ASSETS, CAT_GUARD_GROUPS, CAT_GUARD_OUTFITS, CAT_GUARD_SHEET_SIZE, catGuardFrameFor, catGuardPoseFor, validateCatGuardFrames } from "../catGuardSprites";

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

  it("preserves every production state and independently authored variant", () => {
    expect(CAT_GUARD_GROUPS.catBlack.cartwheel.count).toBe(8);
    expect(CAT_GUARD_GROUPS.catOrange.cartwheel.count).toBe(7);
    expect(CAT_GUARD_GROUPS.catBlack.climb.count).toBe(6);
    expect(CAT_GUARD_GROUPS.catOrange.defeat.count).toBe(4);
    expect(Object.keys(CAT_GUARD_GROUPS.catOrange)).toEqual(Object.keys(CAT_GUARD_GROUPS.catBlack));
  });

  it("maps hit, defeat, ladder, locomotion and attack states", () => {
    expect(catGuardPoseFor({ ...view("catOrange"), state: "hit" })).toBe("hit");
    expect(catGuardPoseFor({ ...view("catBlack"), state: "dead" })).toBe("defeat");
    expect(catGuardPoseFor({ ...view("catBlack"), climbing: true })).toBe("climb");
    expect(catGuardPoseFor({ ...view("catBlack"), state: "walk", catRunning: true })).toBe("run");
    expect(catGuardPoseFor({ ...view("catOrange"), catMove: "roundhouse" })).toBe("roundhouse");
  });

  it("advances the real eight-frame Black Cartwheel in source order", () => {
    const frames = Array.from({ length: 8 }, (_, index) => catGuardFrameFor({
      ...view("catBlack"), state: "kick", stateTimer: 48 - index * 6, catMove: "cartwheel" as const,
    }).index);
    expect(frames).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("uses explicit in-bounds rectangles with a stable feet anchor", () => {
    expect(validateCatGuardFrames()).toEqual([]);
    for (const variant of ["catBlack", "catOrange"] as const) {
      const size = CAT_GUARD_SHEET_SIZE[variant];
      for (const pose of Object.values(CAT_GUARD_GROUPS[variant])) {
        expect(pose.frames).toHaveLength(pose.count);
        for (const frame of pose.frames) {
          expect(frame.w).toBeGreaterThan(0);
          expect(frame.h).toBeGreaterThan(0);
          expect(frame.x + frame.w).toBeLessThanOrEqual(size.width);
          expect(frame.y + frame.h).toBeLessThanOrEqual(size.height);
          expect(frame.anchorY).toBe(frame.h);
          expect(frame.scale).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps each variant on its independent clean runtime atlas", () => {
    expect(CAT_GUARD_SHEET_SIZE.catBlack).not.toEqual(CAT_GUARD_SHEET_SIZE.catOrange);
    expect(CAT_GUARD_GROUPS.catBlack.idle.frames[0]).not.toEqual(CAT_GUARD_GROUPS.catOrange.idle.frames[0]);
  });

  it("uses character-only locomotion cells for climbing instead of baked ladder cells", () => {
    expect(CAT_GUARD_GROUPS.catBlack.climb.frames).toEqual(CAT_GUARD_GROUPS.catBlack.walk.frames);
    expect(CAT_GUARD_GROUPS.catOrange.climb.frames).toEqual(CAT_GUARD_GROUPS.catOrange.walk.frames);
  });
});
import { CAT_ATLAS_SCALE, CAT_RUNTIME_SHEET_SIZE } from "../catGuardSprites";
describe("Cat Guard runtime memory budget", () => {
  it("keeps every scaled source rect inside the pre-scaled runtime sheet", () => {
    for (const variant of ["catBlack", "catOrange"] as const) {
      const size = CAT_RUNTIME_SHEET_SIZE[variant];
      for (const pose of Object.values(CAT_GUARD_GROUPS[variant])) for (const f of pose.frames) {
        expect((f.x + f.w) * CAT_ATLAS_SCALE).toBeLessThanOrEqual(size.width + 0.5);
        expect((f.y + f.h) * CAT_ATLAS_SCALE).toBeLessThanOrEqual(size.height + 0.5);
      }
    }
  });
});
