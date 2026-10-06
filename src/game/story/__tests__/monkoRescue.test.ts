import { describe, expect, it } from "vitest";
import {
  MONKO_BANANA_X, MONKO_CAGE_X, MONKO_BANANA_Y, MONKO_CAGE_Y, MONKO_BANANA_KEY_X, MONKO_BANANA_KEY_Y, MONKO_CAGE_KEY_X, MONKO_CAGE_KEY_Y, tryCollectMonkoKeys, MONKO_OPEN_FRAMES, beginMonkoRescue,
  canRescueMonko, initialMonkoState, stepMonko, tryRecoverMonkoBananas,
} from "../monkoRescue";

describe("Level 5 Monko rescue", () => {
  it("uses one finite banana stash before a deliberate rescue", () => {
    const state = initialMonkoState();
    expect(canRescueMonko(state, MONKO_CAGE_X, MONKO_CAGE_Y, MONKO_CAGE_Y)).toBe(true);
    expect(canRescueMonko(state, MONKO_CAGE_X, 320, MONKO_CAGE_Y)).toBe(false);
    expect(tryRecoverMonkoBananas(state, MONKO_BANANA_X, MONKO_BANANA_Y, MONKO_BANANA_Y)).toBe(false);
    expect(tryCollectMonkoKeys(state, MONKO_BANANA_KEY_X, MONKO_BANANA_KEY_Y)).toBe("banana");
    expect(tryRecoverMonkoBananas(state, MONKO_BANANA_X, MONKO_BANANA_Y, MONKO_BANANA_Y)).toBe(true);
    expect(tryRecoverMonkoBananas(state, MONKO_BANANA_X, MONKO_BANANA_Y, MONKO_BANANA_Y)).toBe(false);
    expect(beginMonkoRescue(state)).toBe(false);
    expect(tryCollectMonkoKeys(state, MONKO_CAGE_KEY_X, MONKO_CAGE_KEY_Y)).toBe("cage");
    expect(tryCollectMonkoKeys(state, MONKO_CAGE_KEY_X, MONKO_CAGE_KEY_Y)).toBe(null);
    expect(beginMonkoRescue(state)).toBe(true);
  });

  it("marks MONKO_RESCUED once and never reopens the flow", () => {
    const state = initialMonkoState();
    state.bananaKey = true; state.cageKey = true;
    tryRecoverMonkoBananas(state, MONKO_BANANA_X, MONKO_BANANA_Y, MONKO_BANANA_Y);
    beginMonkoRescue(state);
    let completions = 0;
    for (let i = 0; i < MONKO_OPEN_FRAMES * 3; i++) if (stepMonko(state)) completions += 1;
    expect(completions).toBe(1);
    expect(state.rescued).toBe(true);
    expect(beginMonkoRescue(state)).toBe(false);
  });

  it("is NPC-only state with no combat fields", () => {
    expect(Object.keys(initialMonkoState()).sort()).toEqual(["bananaKey", "bananasRecovered", "cageKey", "lockedCooldown", "phase", "rescued", "timer"]);
    expect(MONKO_BANANA_X).toBeLessThan(MONKO_CAGE_X);
  });
});
