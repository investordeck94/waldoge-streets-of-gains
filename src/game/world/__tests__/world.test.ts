import { describe, it, expect } from "vitest";
import { GROUND_Y } from "@/game/config";
import {
  getLevelWidth, DEFAULT_LEVEL_WIDTH, groundYAt, pitsFor, laddersFor,
  ladderAt, nearestLadder, clampToPitWalls, hasVerticalTraversal,
  encounterX, bossArenaX, PIT_DEPTH, LADDER_GRAB_X,
} from "@/game/config/world";
import { mount, dismount, stepClimb, climbDirectionFor, type Climber } from "../climb";
import { districtFor, hasDistrict, sectionLabelAt } from "@/game/presentation/render2d/districts";

const fighter = (x: number, y: number): Climber => ({ x, y, state: "idle" });

describe("per-level world width", () => {
  it("gives level 1 and 2 the new large worlds", () => {
    expect(getLevelWidth(0)).toBeGreaterThanOrEqual(5000);
    expect(getLevelWidth(0)).toBeLessThanOrEqual(6000);
    expect(getLevelWidth(1)).toBeGreaterThanOrEqual(6000);
    expect(getLevelWidth(1)).toBeLessThanOrEqual(7000);
  });
  it("falls back to the legacy width for untouched levels", () => {
    expect(getLevelWidth(6)).toBe(DEFAULT_LEVEL_WIDTH);
    expect(getLevelWidth(99)).toBe(DEFAULT_LEVEL_WIDTH);
    expect(getLevelWidth(NaN)).toBe(DEFAULT_LEVEL_WIDTH);
  });
});

describe("terrain", () => {
  it("level 1 is flat, level 2 has lower streets", () => {
    expect(pitsFor(0)).toHaveLength(0);
    expect(hasVerticalTraversal(0)).toBe(false);
    expect(pitsFor(1).length).toBeGreaterThan(0);
    expect(hasVerticalTraversal(1)).toBe(true);
  });
  it("groundYAt returns the street outside pits and the floor inside", () => {
    expect(groundYAt(1, 100)).toBe(GROUND_Y);
    const pit = pitsFor(1)[0];
    expect(groundYAt(1, (pit.x0 + pit.x1) / 2)).toBe(GROUND_Y + PIT_DEPTH);
    expect(groundYAt(1, pit.x0 - 5)).toBe(GROUND_Y);
    expect(groundYAt(1, pit.x1 + 5)).toBe(GROUND_Y);
  });
  it("never returns a non-finite ground", () => {
    expect(Number.isFinite(groundYAt(1, NaN))).toBe(true);
    expect(Number.isFinite(groundYAt(1, Infinity))).toBe(true);
  });
  it("pit walls block sideways travel below street level", () => {
    const pit = pitsFor(1)[0];
    const below = GROUND_Y + PIT_DEPTH;
    expect(clampToPitWalls(1, pit.x0 - 4, below, 15)).toBeGreaterThanOrEqual(pit.x0);
    expect(clampToPitWalls(1, pit.x1 + 4, below, 15)).toBeLessThanOrEqual(pit.x1);
  });
  it("leaves characters at street level untouched", () => {
    expect(clampToPitWalls(1, 100, GROUND_Y, 15)).toBe(100);
    expect(clampToPitWalls(0, 100, GROUND_Y, 15)).toBe(100);
  });
});

describe("ladders", () => {
  it("level 2 has several, of different styles", () => {
    const l = laddersFor(1);
    expect(l.length).toBeGreaterThanOrEqual(4);
    expect(new Set(l.map(x => x.style)).size).toBeGreaterThan(1);
  });
  it("each ladder connects the street to a pit floor", () => {
    for (const l of laddersFor(1)) {
      expect(l.top).toBe(GROUND_Y);
      expect(l.bottom).toBeGreaterThan(l.top);
      expect(groundYAt(1, l.x)).toBeGreaterThanOrEqual(GROUND_Y);
    }
  });
  it("ladderAt only grabs within reach", () => {
    const l = laddersFor(1)[0];
    expect(ladderAt(1, l.x)).toBe(l);
    expect(ladderAt(1, l.x + LADDER_GRAB_X - 1)).toBe(l);
    expect(ladderAt(1, l.x + 400)).toBeNull();
    expect(nearestLadder(1, l.x + 400)).not.toBeNull();
  });
});

describe("climb state machine", () => {
  const lad = laddersFor(1)[0];

  it("climbs down and dismounts at the bottom", () => {
    const c = fighter(lad.x, lad.top);
    mount(c, lad);
    let guard = 0;
    while (c.climbing && guard++ < 500) stepClimb(c, lad, 1);
    expect(guard).toBeLessThan(500);
    expect(c.y).toBe(lad.bottom);
    expect(c.climbing).toBe(false);
  });

  it("climbs back up and dismounts at the top", () => {
    const c = fighter(lad.x, lad.bottom);
    mount(c, lad);
    let guard = 0;
    while (c.climbing && guard++ < 500) stepClimb(c, lad, -1);
    expect(c.y).toBe(lad.top);
    expect(c.climbing).toBe(false);
  });

  it("never leaves the ladder bounds and stays snapped to it horizontally", () => {
    const c = fighter(lad.x + 12, lad.top);
    mount(c, lad);
    for (let i = 0; i < 60; i++) {
      stepClimb(c, lad, i % 2 === 0 ? 1 : -1);
      expect(c.y).toBeGreaterThanOrEqual(lad.top);
      expect(c.y).toBeLessThanOrEqual(lad.bottom);
      expect(c.x).toBe(lad.x);
    }
  });

  it("drops off the ladder when hit or killed", () => {
    const c = fighter(lad.x, lad.top + 30);
    mount(c, lad);
    c.state = "hit";
    expect(stepClimb(c, lad, 1)).toBe(false);
    expect(c.climbing).toBe(false);
  });

  it("repairs a non-finite position instead of propagating NaN", () => {
    const c = fighter(lad.x, NaN);
    mount(c, lad);
    c.y = NaN;
    stepClimb(c, lad, 1);
    expect(Number.isFinite(c.y)).toBe(true);
  });

  it("holding still keeps the climber attached", () => {
    const c = fighter(lad.x, lad.top + 20);
    mount(c, lad);
    expect(stepClimb(c, lad, 0)).toBe(true);
    expect(c.y).toBe(lad.top + 20);
  });

  it("climbDirectionFor routes a pursuer to the player's street level", () => {
    expect(climbDirectionFor(GROUND_Y, GROUND_Y + PIT_DEPTH)).toBe(1);
    expect(climbDirectionFor(GROUND_Y + PIT_DEPTH, GROUND_Y)).toBe(-1);
    expect(climbDirectionFor(GROUND_Y, GROUND_Y + 2)).toBe(0);
  });

  it("dismount clears all climb state", () => {
    const c = fighter(lad.x, lad.top);
    mount(c, lad);
    dismount(c);
    expect(c.climbing).toBe(false);
    expect(c.climbLadderX).toBeUndefined();
  });
});

describe("encounters", () => {
  it("stages waves and the boss across the length of the district", () => {
    const w0 = encounterX(0, 0)!;
    const w1 = encounterX(0, 1)!;
    const boss = bossArenaX(0)!;
    expect(w0).toBeLessThan(w1);
    expect(w1).toBeLessThan(boss);
    expect(boss).toBeLessThan(getLevelWidth(0));
  });
  it("returns null for levels without a designed district", () => {
    expect(encounterX(5, 0)).toBeNull();
    expect(bossArenaX(5)).toBeNull();
  });
});

describe("districts", () => {
  it("only levels 1 and 2 have the new art", () => {
    expect(hasDistrict(0)).toBe(true);
    expect(hasDistrict(1)).toBe(true);
    expect(hasDistrict(2)).toBe(false);
    expect(districtFor(4)).toBeNull();
  });

  it("fills the whole Jeet district with Jeet-branded food shops", () => {
    const d = districtFor(0)!;
    expect(d.width).toBe(getLevelWidth(0));
    const jeet = d.fronts.filter(f => f.name.includes("JEET"));
    expect(jeet.length).toBeGreaterThan(10);
    expect(d.fronts.some(f => f.kind === "burger")).toBe(true);
    expect(d.fronts.some(f => f.kind === "pizza")).toBe(true);
    expect(d.fronts.some(f => f.kind === "palace")).toBe(true);
    // No Waldoge-branded restaurants
    expect(d.fronts.some(f => /WALDOGE|WALLY/i.test(f.name))).toBe(false);
    // Shops are varied in size
    const widths = new Set(d.fronts.map(f => Math.round(f.w / 40)));
    expect(widths.size).toBeGreaterThan(3);
  });

  it("gives the Rugger district offices and a casino strip", () => {
    const d = districtFor(1)!;
    expect(d.fronts.some(f => f.kind === "office")).toBe(true);
    expect(d.fronts.some(f => f.kind === "casino")).toBe(true);
    expect(d.fronts.some(f => f.name.includes("RUGGER"))).toBe(true);
    expect(d.fronts.filter(f => f.tagline).length).toBeGreaterThan(3);
  });

  it("covers the full street with no large empty gaps", () => {
    for (const level of [0, 1]) {
      const d = districtFor(level)!;
      const sorted = [...d.fronts].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].w);
        expect(gap).toBeLessThan(260);
      }
      expect(sorted[sorted.length - 1].x + sorted[sorted.length - 1].w)
        .toBeGreaterThan(d.width - 200);
    }
  });

  it("is generated once and cached", () => {
    expect(districtFor(0)).toBe(districtFor(0));
  });

  it("reports the section the player is travelling through", () => {
    expect(sectionLabelAt(0, 10)).toBe("URBAN STREET");
    expect(sectionLabelAt(0, getLevelWidth(0) - 100)).toContain("JEET");
    expect(sectionLabelAt(1, getLevelWidth(1) - 100)).toContain("RUGGER");
    expect(sectionLabelAt(4, 100)).toBeNull();
  });

  it("every generated coordinate is finite", () => {
    for (const level of [0, 1]) {
      const d = districtFor(level)!;
      for (const f of d.fronts) {
        expect(Number.isFinite(f.x) && Number.isFinite(f.w) && Number.isFinite(f.h)).toBe(true);
      }
      for (const pr of d.props) expect(Number.isFinite(pr.x)).toBe(true);
      for (const b of d.mid) expect(Number.isFinite(b.h)).toBe(true);
    }
  });
});
