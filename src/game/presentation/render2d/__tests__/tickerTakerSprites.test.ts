import { describe, it, expect } from "vitest";
import {
  ATLAS_SCALE,
  TICKER_TAKER_ATLAS_URL,
  TICKER_TAKER_FRAMES,
  atlasSourceScale,
} from "../tickerTakerSprites";

/**
 * Level 7 regression: Ticker Taker's authored sheet is ~4 MP (~16 MB decoded),
 * far larger than any other character. That memory pressure made mobile
 * browsers purge decoded images / canvas backing stores mid-fight, blinking
 * out Waldoge, Ticker Taker and the minions together. The CDN sheet is now
 * pre-scaled; destination rects stay untouched so combat remains unchanged.
 */
describe("ticker taker atlas memory budget", () => {
  it("uses a scale below full resolution but above what the canvas can show", () => {
    // Canvas dpr is capped at 2 and he draws ~136 CSS px tall from a 540 px
    // frame, so ~0.55 of source is the most that can reach a pixel.
    expect(ATLAS_SCALE).toBeLessThan(1);
    expect(ATLAS_SCALE).toBeGreaterThanOrEqual(0.55);
  });

  it("cuts resident image memory by more than half", () => {
    expect(ATLAS_SCALE * ATLAS_SCALE).toBeLessThan(0.5);
  });

  it("uses the pre-scaled source from its first rendered frame", () => {
    expect(atlasSourceScale()).toBe(ATLAS_SCALE);
  });

  it("loads the dedicated pre-scaled CDN PNG", () => {
    expect(TICKER_TAKER_ATLAS_URL).toContain("ticker-taker-atlas-60.png");
  });

  it("keeps all twelve authored animation poses", () => {
    expect(Object.keys(TICKER_TAKER_FRAMES)).toEqual([
      "idle", "walk", "punch", "kick", "drain", "gun", "scythe", "mega",
      "flyers", "hurt", "defeat", "dash",
    ]);
  });

  it.each(["idle", "walk", "punch", "kick", "drain", "gun", "scythe", "mega"])(
    "preserves destination geometry for the %s special-move pose",
    (pose) => {
      const frame = TICKER_TAKER_FRAMES[pose];
      expect(frame).toBeDefined();
      expect(frame?.w).toBeGreaterThan(0);
      expect(frame?.h).toBeGreaterThan(0);
      expect(frame?.ax).toBeGreaterThan(0);
      expect(frame?.ay).toBe(frame?.h);
    },
  );

  it("keeps every scaled source rectangle inside the 1229x1391 PNG", () => {
    for (const frame of Object.values(TICKER_TAKER_FRAMES)) {
      expect((frame.x + frame.w) * ATLAS_SCALE).toBeLessThanOrEqual(1229);
      expect((frame.y + frame.h) * ATLAS_SCALE).toBeLessThanOrEqual(1391);
    }
  });

  it("leaves destination dimensions independent of source scale", () => {
    const frame = TICKER_TAKER_FRAMES.scythe;
    expect([frame.w, frame.h, frame.ax, frame.ay]).toEqual([600, 591, 296.5, 591]);
  });

});
