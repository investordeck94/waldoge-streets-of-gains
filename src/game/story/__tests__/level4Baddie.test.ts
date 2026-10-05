import { describe, expect, it } from "vitest";
import {
  BADDIE_CAGE_X, BADDIE_KEY_X, BADDIE_OPEN_FRAMES, beginBaddieRescue,
  canRescueBaddie, initialBaddieState, stepBaddie, tryCollectBaddieKey,
} from "../level4Baddie";

describe("Level 4 Baddie rescue", () => {
  it("requires the unique key and a deliberate cage interaction", () => {
    const state = initialBaddieState();
    expect(beginBaddieRescue(state)).toBe(false);
    expect(canRescueBaddie(state, BADDIE_CAGE_X, 320, 320)).toBe(true);
    expect(tryCollectBaddieKey(state, BADDIE_KEY_X, 320, 320)).toBe(true);
    expect(tryCollectBaddieKey(state, BADDIE_KEY_X, 320, 320)).toBe(false);
    expect(beginBaddieRescue(state)).toBe(true);
  });

  it("completes once and can never award another completion", () => {
    const state = initialBaddieState();
    tryCollectBaddieKey(state, BADDIE_KEY_X, 320, 320);
    beginBaddieRescue(state);
    let completions = 0;
    for (let i = 0; i < BADDIE_OPEN_FRAMES * 3; i++) if (stepBaddie(state)) completions++;
    expect(completions).toBe(1);
    expect(state.rescued).toBe(true);
    expect(canRescueBaddie(state, BADDIE_CAGE_X, 320, 320)).toBe(false);
    expect(beginBaddieRescue(state)).toBe(false);
  });

  it("resets to one locked cage and no collected key", () => {
    const state = initialBaddieState();
    expect(state).toEqual({ phase: "caged", timer: 0, rescued: false, keyCollected: false, lockedCooldown: 0 });
    expect(BADDIE_KEY_X).toBeLessThan(BADDIE_CAGE_X);
  });

  it("contains no combat data", () => {
    expect(Object.keys(initialBaddieState()).sort()).toEqual(["keyCollected", "lockedCooldown", "phase", "rescued", "timer"]);
  });
});