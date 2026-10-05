import { describe, expect, it } from "vitest";
import {
  DOXX_BLUEPRINT_X, DOXX_CAGE_X, DOXX_KEY_X, DOXX_OPEN_FRAMES, beginDoxxRescue, canRescueDoxx,
  initialDoxxState, stepDoxx, tryCollectBlueprints, tryCollectDoxxKey, doxxObjectiveText,
} from "../doxxRescue";

describe("Doxx rescue + blueprints + key", () => {
  it("cage stays locked without the blueprints", () => {
    const s = initialDoxxState();
    expect(canRescueDoxx(s, DOXX_CAGE_X, 320, 320)).toBe(true);
    expect(beginDoxxRescue(s)).toBe(false);
    for (let i = 0; i < 300; i++) expect(stepDoxx(s)).toBe(false);
    expect(s.phase).toBe("caged");
  });
  it("blueprints collect once, only at their spot", () => {
    const s = initialDoxxState();
    expect(tryCollectBlueprints(s, DOXX_BLUEPRINT_X - 300, 320, 320)).toBe(false);
    expect(tryCollectBlueprints(s, DOXX_BLUEPRINT_X, 320, 320)).toBe(true);
    expect(tryCollectBlueprints(s, DOXX_BLUEPRINT_X, 320, 320)).toBe(false);
    expect(DOXX_BLUEPRINT_X).toBeLessThan(DOXX_CAGE_X - 2000);
  });
  it("key collects once, only at its spot, and the cage stays locked without it", () => {
    const s = initialDoxxState();
    tryCollectBlueprints(s, DOXX_BLUEPRINT_X, 320, 320);
    expect(beginDoxxRescue(s)).toBe(false); // blueprints but no key
    expect(tryCollectDoxxKey(s, DOXX_KEY_X - 300, 320, 320)).toBe(false);
    expect(tryCollectDoxxKey(s, DOXX_KEY_X, 320, 320)).toBe(true);
    expect(tryCollectDoxxKey(s, DOXX_KEY_X, 320, 320)).toBe(false);
    expect(DOXX_KEY_X).toBeGreaterThan(DOXX_BLUEPRINT_X);
    expect(DOXX_KEY_X).toBeLessThan(DOXX_CAGE_X);
    expect(doxxObjectiveText(s)).toContain("FIND THE CAGE KEY");
  });
  it("rescues exactly once with blueprints AND key, state never goes backwards", () => {
    const s = initialDoxxState();
    tryCollectBlueprints(s, DOXX_BLUEPRINT_X, 320, 320);
    tryCollectDoxxKey(s, DOXX_KEY_X, 320, 320);
    expect(beginDoxxRescue(s)).toBe(true);
    let freed = 0;
    for (let i = 0; i < DOXX_OPEN_FRAMES * 3; i++) if (stepDoxx(s)) freed++;
    expect(freed).toBe(1);
    expect(s.objective).toBe("DOXX_RESCUED");
    expect(beginDoxxRescue(s)).toBe(false);
    expect(tryCollectBlueprints(s, DOXX_BLUEPRINT_X, 320, 320)).toBe(false);
    expect(tryCollectDoxxKey(s, DOXX_KEY_X, 320, 320)).toBe(false);
    expect(doxxObjectiveText(s)).toContain("DOXX RESCUED");
  });
  it("has no combat data", () => {
    expect(Object.keys(initialDoxxState()).sort()).toEqual(["keyCollected", "lockedCooldown", "objective", "phase", "rescued", "timer"]);
  });
});
