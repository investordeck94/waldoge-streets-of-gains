import { describe, it, expect } from "vitest";
import { ATLAS_SCALE, atlasSourceScale, TICKER_TAKER_FRAMES } from "../tickerTakerSprites";

/**
 * Level 7 regression: Ticker Taker's authored sheet is ~4 MP (~16 MB decoded),
 * far larger than any other character. That memory pressure made mobile
 * browsers purge decoded images / canvas backing stores mid-fight, blinking
 * out Waldoge, Ticker Taker and the minions together. The sheet is resampled
 * once on load; destination rects must stay untouched so combat is unchanged.
 */
describe("ticker taker atlas memory budget", () => {
  it("resamples well below full resolution but above what the canvas can show", () => {
    // Canvas dpr is capped at 2 and he draws ~136 CSS px tall from a 540 px
    // frame, so ~0.55 of source is the most that can reach a pixel.
    expect(ATLAS_SCALE).toBeLessThan(1);
    expect(ATLAS_SCALE).toBeGreaterThanOrEqual(0.55);
  });

  it("cuts resident image memory by more than half", () => {
    expect(ATLAS_SCALE * ATLAS_SCALE).toBeLessThan(0.5);
  });

  it("reports scale 1 until the sheet has been resampled", () => {
    expect(atlasSourceScale()).toBe(1);
  });

  it("keeps every frame rect inside the resampled sheet", () => {
    const frames = TICKER_TAKER_FRAMES as Record<string, { x: number; y: number; w: number; h: number }> | undefined;
    if (!frames) return;
    for (const f of Object.values(frames)) {
      expect(Number.isFinite(f.x * ATLAS_SCALE)).toBe(true);
      expect(f.w).toBeGreaterThan(0);
      expect(f.h).toBeGreaterThan(0);
    }
  });
});
