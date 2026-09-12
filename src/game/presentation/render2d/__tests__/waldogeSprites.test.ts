import { describe, expect, it } from "vitest";
import { WALDOGE_FRAMES } from "../waldogeSprites";

describe("Waldoge sprite grounding", () => {
  it("anchors every atlas pose to a measured painted row inside its source frame", () => {
    for (const frame of Object.values(WALDOGE_FRAMES)) {
      expect(frame.ay).toBeGreaterThan(0);
      expect(frame.ay).toBeLessThanOrEqual(frame.h);
      expect(frame.h - frame.ay).toBeLessThanOrEqual(7);
    }
  });

  it.each(["idle0", "walk0", "walk1", "walk2", "run0", "run1", "run2", "punch0", "kick0", "hit0"])(
    "%s uses its visible shoe sole rather than the transparent cell bottom",
    (name) => {
      const frame = WALDOGE_FRAMES[name];
      expect(frame).toBeDefined();
      expect(frame.ay).toBeLessThan(frame.h);
    },
  );

  it("keeps the airborne ground-pound pose unchanged", () => {
    expect(WALDOGE_FRAMES.groundpound0.ay).toBe(WALDOGE_FRAMES.groundpound0.h);
  });
});