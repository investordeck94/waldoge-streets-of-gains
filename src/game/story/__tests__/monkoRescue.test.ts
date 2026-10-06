import { describe, expect, it } from "vitest";
import {
  MONKO_BANANA_X, MONKO_CAGE_X, MONKO_OPEN_FRAMES, beginMonkoRescue,
  canRescueMonko, initialMonkoState, stepMonko, tryRecoverMonkoBananas,
} from "../monkoRescue";

describe("Level 5 Monko rescue", () => {
  it("uses one finite banana stash before a deliberate rescue", () => {
    const state = initialMonkoState();
    expect(canRescueMonko(state, MONKO_CAGE_X, 320, 320)).toBe(true);
    expect(beginMonkoRescue(state)).toBe(false);
    expect(tryRecoverMonkoBananas(state, MONKO_BANANA_X, 320, 320)).toBe(true);
    expect(tryRecoverMonkoBananas(state, MONKO_BANANA_X, 320, 320)).toBe(false);
    expect(beginMonkoRescue(state)).toBe(true);
  });

  it("marks MONKO_RESCUED once and never reopens the flow", () => {
    const state = initialMonkoState();
    tryRecoverMonkoBananas(state, MONKO_BANANA_X, 320, 320);
    beginMonkoRescue(state);
    let completions = 0;
    for (let i = 0; i < MONKO_OPEN_FRAMES * 3; i++) if (stepMonko(state)) completions += 1;
    expect(completions).toBe(1);
    expect(state.rescued).toBe(true);
    expect(beginMonkoRescue(state)).toBe(false);
  });

  it("is NPC-only state with no combat fields", () => {
    expect(Object.keys(initialMonkoState()).sort()).toEqual(["bananasRecovered", "lockedCooldown", "phase", "rescued", "timer"]);
    expect(MONKO_BANANA_X).toBeLessThan(MONKO_CAGE_X);
  });
});
