import { describe, expect, it } from "vitest";
import {
  FILF_CAGE_X, FILF_OPEN_FRAMES, beginFilfRescue, canRescueFilf, initialFilfState, stepFilf,
} from "../filfRescue";

describe("FILF rescue", () => {
  it("walking past never rescues — only a deliberate interaction", () => {
    const s = initialFilfState();
    for (let i = 0; i < 500; i++) expect(stepFilf(s)).toBe(false);
    expect(s.phase).toBe("caged");
  });

  it("requires being at the cage", () => {
    const s = initialFilfState();
    expect(canRescueFilf(s, FILF_CAGE_X - 400, 320, 320)).toBe(false);
    expect(canRescueFilf(s, FILF_CAGE_X + 20, 320, 320)).toBe(true);
  });

  it("frees exactly once and cannot repeat", () => {
    const s = initialFilfState();
    expect(beginFilfRescue(s)).toBe(true);
    expect(beginFilfRescue(s)).toBe(false);
    let freed = 0;
    for (let i = 0; i < FILF_OPEN_FRAMES * 3; i++) if (stepFilf(s)) freed++;
    expect(freed).toBe(1);
    expect(s.rescued).toBe(true);
    expect(beginFilfRescue(s)).toBe(false);
    expect(canRescueFilf(s, FILF_CAGE_X, 320, 320)).toBe(false);
  });

  it("has no combat data", () => {
    expect(Object.keys(initialFilfState()).sort()).toEqual(["phase", "rescued", "timer"]);
  });
});
