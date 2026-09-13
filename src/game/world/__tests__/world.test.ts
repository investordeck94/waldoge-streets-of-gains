import { describe, it, expect } from "vitest";
import { GROUND_Y } from "@/game/config";
import {
  getLevelWidth, DEFAULT_LEVEL_WIDTH, baseGroundYAt, groundYAt, pitsFor, laddersFor,
  ladderAt, nearestLadder, clampToPitWalls, hasVerticalTraversal,
  encounterX, bossArenaX, PIT_DEPTH, LADDER_GRAB_X, maxPitDepthFor, landingDeckAt, landingDecksFor, pitAt, connectingLadder,
} from "@/game/config/world";
import { mount, dismount, stepClimb, climbDirectionFor, ladderExitSurfaceY, type Climber } from "../climb";
import { districtFor, hasDistrict, sectionLabelAt } from "@/game/presentation/render2d/districts";
import { RUGGER_LANDMARKS, RUGGER_SECTIONS, ruggerSectionLabelAt, ruggerWorldFor } from "@/game/presentation/render2d/ruggerEmpire";
import {
  FUDDER_LANDMARKS,
  FUDDER_SECTIONS,
  FUDDER_SECTION_WIDTH,
  FUDDER_POSTER_TEXT,
  FUDDER_VISUAL_DECK_IDS,
  __fudderTerritoryTest,
  fudderSectionLabelAt,
  fudderTerritoryFor,
} from "@/game/presentation/render2d/fudderTerritory";

const fighter = (x: number, y: number): Climber => ({ x, y, state: "idle" });

describe("per-level world width", () => {
  it("gives level 1 and 2 the new large worlds", () => {
    expect(getLevelWidth(0)).toBeGreaterThanOrEqual(5000);
    expect(getLevelWidth(0)).toBeLessThanOrEqual(6000);
    expect(getLevelWidth(1)).toBe(10800);
    expect(getLevelWidth(1)).toBeGreaterThan(3200 * 3);
  });
  it("gives Level 4 a five-section long world and preserves untouched levels", () => {
    expect(getLevelWidth(3)).toBe(FUDDER_SECTION_WIDTH * 5);
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
    expect(groundYAt(1, (pit.x0 + pit.x1) / 2)).toBe(pit.y);
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
  it("every Level 2 dip has at least two usable ladders and a finite camera depth", () => {
    const ladders = laddersFor(1);
    for (const pit of pitsFor(1)) {
      const connected = ladders.filter(l => l.x > pit.x0 && l.x < pit.x1 && l.bottom === pit.y);
      expect(connected.length).toBeGreaterThanOrEqual(2);
    }
    expect(maxPitDepthFor(1)).toBe(132);
    expect(Number.isFinite(maxPitDepthFor(1))).toBe(true);
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

  it("grounds every upward exit on its actual landing collision surface", () => {
    for (const ladder of laddersFor(1)) {
      const c = fighter(ladder.x, ladder.bottom);
      mount(c, ladder);
      let guard = 0;
      while (c.climbing && guard++ < 500) stepClimb(c, ladder, -1);
      c.y = ladderExitSurfaceY(1, ladder, -1);
      expect(c.climbing).toBe(false);
      expect(c.y).toBe(groundYAt(1, ladder.x, ladder.top));
      expect(c.y).toBe(ladder.top);
    }
  });

  it("grounds every downward exit on its lower collision surface", () => {
    for (const ladder of laddersFor(1)) {
      const c = fighter(ladder.x, ladder.top);
      mount(c, ladder);
      let guard = 0;
      while (c.climbing && guard++ < 500) stepClimb(c, ladder, 1);
      c.y = ladderExitSurfaceY(1, ladder, 1);
      expect(c.climbing).toBe(false);
      expect(c.y).toBe(groundYAt(1, ladder.x, ladder.bottom));
      expect(c.y).toBe(ladder.bottom);
    }
  });

  it("never leaves the ladder bounds and stays snapped to it horizontally", () => {
    const c = fighter(lad.x + 12, lad.top + 30);
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
  it("levels 1 through 4 have dedicated district art", () => {
    expect(hasDistrict(0)).toBe(true);
    expect(hasDistrict(1)).toBe(true);
    expect(hasDistrict(2)).toBe(true);
    expect(hasDistrict(3)).toBe(true);
    expect(hasDistrict(4)).toBe(false);
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

  it("gives Rugger a ten-section world with all requested landmarks", () => {
    expect(RUGGER_SECTIONS).toHaveLength(10);
    expect(RUGGER_LANDMARKS).toContain("RUGGER EXCHANGE");
    expect(RUGGER_LANDMARKS).toContain("GOLDEN BULL");
    expect(RUGGER_LANDMARKS).toContain("RUGGER'S GAMBLING DEN");
    expect(ruggerSectionLabelAt(1, 1)).toBe("FINANCIAL DISTRICT ENTRANCE");
    expect(ruggerSectionLabelAt(1, getLevelWidth(1) - 1)).toBe("RUGGER BOSS ARENA");
    expect(ruggerWorldFor(1)).toBe(ruggerWorldFor(1));
  });

  it("covers the full street with no large empty gaps", () => {
    for (const level of [0]) {
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
    expect(sectionLabelAt(0, 10)).toContain("JEET");
    expect(sectionLabelAt(0, getLevelWidth(0) - 100)).toContain("JEET");
    expect(sectionLabelAt(1, getLevelWidth(1) - 100)).toContain("RUGGER");
    expect(sectionLabelAt(3, 100)).toBe("ENTRANCE — PROPAGANDA STREET");
    expect(sectionLabelAt(4, 100)).toBeNull();
  });

  it("every generated coordinate is finite", () => {
    for (const level of [0]) {
      const d = districtFor(level)!;
      for (const f of d.fronts) {
        expect(Number.isFinite(f.x) && Number.isFinite(f.w) && Number.isFinite(f.h)).toBe(true);
      }
      for (const pr of d.props) expect(Number.isFinite(pr.x)).toBe(true);
      for (const b of d.mid) expect(Number.isFinite(b.h)).toBe(true);
    }
});

describe("level 3 — Bad Actors Studios", () => {
  it("is a large dedicated world, far bigger than the legacy arena", () => {
    expect(getLevelWidth(2)).toBe(15600);
    expect(getLevelWidth(2)).toBeGreaterThan(3200 * 3);
  });

  it("stages waves and a boss arena inside the world", () => {
    expect(encounterX(2, 0)!).toBeGreaterThan(0);
    expect(encounterX(2, 1)!).toBeGreaterThan(encounterX(2, 0)!);
    expect(bossArenaX(2)!).toBeLessThan(getLevelWidth(2));
    // The boss waits in the final rooftop area.
    expect(bossArenaX(2)!).toBeGreaterThan(getLevelWidth(2) - 1200);
  });

  it("labels the first and last areas from the blueprint", () => {
    expect(sectionLabelAt(2, 10)).toBe("BAD ACTORS STUDIOS");
    expect(sectionLabelAt(2, getLevelWidth(2) - 100)).toContain("BAD ACTOR");
  });

  it("adds connected vertical production routes without touching other levels", () => {
    expect(hasVerticalTraversal(2)).toBe(true);
    expect(pitsFor(2).length).toBe(3);
    expect(laddersFor(2).length).toBe(16);
    expect(pitsFor(0).length).toBe(0);
    for (const ladder of laddersFor(2)) {
      const surface = groundYAt(2, ladder.x, ladder.top);
      expect(surface === ladder.top || surface === ladder.bottom).toBe(true);
      expect(Number.isFinite(ladder.bottom)).toBe(true);
      expect(ladder.bottom).toBeGreaterThan(ladder.top);
    }
  });

  it("keeps the office tyres grounded and puts the entire projector area on its lower floor", () => {
    expect(baseGroundYAt(2, 3504)).toBe(GROUND_Y); // Previous area remains level
    expect(baseGroundYAt(2, 3696)).toBe(351); // Production Office tyre-contact plane
    expect(baseGroundYAt(2, 4700)).toBe(351); // Golf-cart end of the office
    expect(groundYAt(2, 4801, 351)).toBe(412); // Projector-area lower studio floor
    expect(groundYAt(2, 4896, 412)).toBe(412); // Beneath the projector headlight
    // The two maintenance ladders end on narrow service landings at 351 so a
    // climber can actually leave the ladder; the floor beside them stays low.
    expect(groundYAt(2, 5020, 351)).toBe(351);
    expect(groundYAt(2, 5780, 351)).toBe(351);
    expect(groundYAt(2, 5020, 412)).toBe(412);
    expect(groundYAt(2, 5300, 351)).toBe(412);
    expect(ladderExitSurfaceY(2, laddersFor(2).find((l) => l.x === 5020)!, -1)).toBe(351);

    expect(groundYAt(2, 5999, 412)).toBe(412); // Lower floor continues to the far wall
    expect(baseGroundYAt(2, 6060)).toBe(GROUND_Y); // SUS'TER ACT plaza remains level
    expect(groundYAt(2, 4200)).toBe(351);
    expect(groundYAt(2, 5200)).toBe(412); // Projector service-level dip
  });

  it("blends onto the office plane without accumulated drift", () => {
    const samples = [3600, 3624, 3648, 3672, 3696].map((x) => baseGroundYAt(2, x));
    for (let index = 1; index < samples.length; index++) {
      expect(Math.abs(samples[index] - samples[index - 1])).toBeLessThanOrEqual(8);
    }
    expect(baseGroundYAt(2, 4700)).toBe(351);
  });

  it("uses one upper-to-lower route through the full projector service floor", () => {
    expect(groundYAt(2, 4799, 351)).toBe(351);
    expect(groundYAt(2, 4801, 351)).toBe(412);
    expect(groundYAt(2, 5100, 351)).toBe(412);
    expect(groundYAt(2, 5400, 412)).toBe(412);
    expect(groundYAt(2, 5700, 412)).toBe(412);
    expect(groundYAt(2, 5999, 412)).toBe(412);
    expect(groundYAt(2, 6001, 412)).toBe(GROUND_Y);
    expect(groundYAt(2, 5100, 351)).toBe(groundYAt(2, 5100, 412));
    expect(Number.isFinite(groundYAt(2, NaN))).toBe(true);
  });

  it("keeps the Stage 2 gantry deck walkable at its authored height", () => {
    expect(groundYAt(2, 9000, 182)).toBe(182);
    expect(landingDecksFor(2).some((deck) => deck.x0 <= 9000 && deck.x1 >= 9000)).toBe(true);
  });

  it("separates the Stage 2 lower-floor lane from its preserved overhead gantry", () => {
    const gantry = landingDeckAt(2, 9000);
    expect(gantry).toMatchObject({ x0: 8500, x1: 9500, y: 182 });
    expect(groundYAt(2, 9000, GROUND_Y, false)).toBe(GROUND_Y);
    expect(groundYAt(2, 9000, 210, false)).toBe(GROUND_Y);
    expect(groundYAt(2, 9000, gantry?.y)).toBe(182);
  });

  it("keeps both Stage 2 ladder endpoints connected to the preserved gantry", () => {
    const ladders = laddersFor(2).filter((ladder) => ladder.x === 8540 || ladder.x === 9460);
    expect(ladders).toHaveLength(2);
    for (const ladder of ladders) {
      expect(ladder.top).toBe(182);
      expect(ladder.bottom).toBe(GROUND_Y);
      expect(landingDeckAt(2, ladder.x)?.y).toBe(ladder.top);
    }
  });



  it("does not change the shared main floor in Levels 1, 2 or 7", () => {
    expect(baseGroundYAt(0, 1000)).toBe(GROUND_Y);
    expect(baseGroundYAt(1, 1000)).toBe(GROUND_Y);
    expect(baseGroundYAt(6, 1000)).toBe(GROUND_Y);
  });
});

});

describe("ladder landing decks", () => {
  it("gives every pit-spanning ladder a solid deck at its top", () => {
    const decks = landingDecksFor(1);
    const overPit = laddersFor(1).filter((l) => pitAt(1, l.x));
    expect(decks.length).toBe(overPit.length);
    for (const l of overPit) {
      const deck = decks.find((d) => d.ladderX === l.x);
      expect(deck).toBeTruthy();
      expect(deck!.y).toBe(l.top);
      expect(deck!.x1 - deck!.x0).toBeGreaterThan(60);
    }
  });

  it("makes the ladder top walkable instead of empty space", () => {
    for (const l of laddersFor(1)) {
      expect(groundYAt(1, l.x, l.top)).toBe(l.top);
      expect(groundYAt(1, l.x, l.top - 40)).toBe(l.top);
    }
  });

  it("keeps the pit floor under the deck for fighters already below it", () => {
    const l = laddersFor(1)[0];
    const pit = pitAt(1, l.x)!;
    expect(groundYAt(1, l.x, pit.y)).toBe(pit.y);
  });

  it("leaves flat levels and open pit spans untouched", () => {
    expect(landingDecksFor(0).length).toBe(0);
    const pit = pitsFor(1)[0];
    const mid = (pit.x0 + pit.x1) / 2;
    expect(groundYAt(1, mid, GROUND_Y)).toBe(pit.y);
  });
});

describe("level 4 — Fudder Territory blueprint", () => {
  it("preserves the five approved sections in exact left-to-right order", () => {
    expect(FUDDER_SECTIONS).toEqual([
      "ENTRANCE — PROPAGANDA STREET",
      "MEDIA DISTRICT",
      "INDUSTRIAL COMPLEX",
      "PROPAGANDA FACTORY",
      "BOSS ARENA — FUDDER",
    ]);
    FUDDER_SECTIONS.forEach((label, index) => {
      expect(fudderSectionLabelAt(3, index * FUDDER_SECTION_WIDTH + 10)).toBe(label);
    });
  });

  it("keeps one flat continuous authoritative main floor with no dips", () => {
    expect(pitsFor(3)).toHaveLength(0);
    for (let x = 0; x <= getLevelWidth(3); x += 25) {
      expect(baseGroundYAt(3, x)).toBe(GROUND_Y);
      expect(groundYAt(3, x, GROUND_Y, false)).toBe(GROUND_Y);
    }
  });

  it("has no hidden ground changes outside explicit elevated decks", () => {
    const decks = landingDecksFor(3);
    for (let x = 0; x <= getLevelWidth(3); x += 20) {
      const onDeck = decks.some((deck) => x >= deck.x0 && x <= deck.x1);
      expect(groundYAt(3, x, GROUND_Y)).toBe(onDeck ? GROUND_Y : GROUND_Y);
    }
  });

  it("authors every elevated deck explicitly with finite bounds and height", () => {
    const decks = landingDecksFor(3);
    expect(decks).toHaveLength(10);
    for (const deck of decks) {
      expect(Number.isFinite(deck.x0 + deck.x1 + deck.y + deck.ladderX)).toBe(true);
      expect(deck.x0).toBeLessThan(deck.x1);
      expect(deck.y).toBeLessThan(GROUND_Y);
      expect(deck.ladderX).toBeGreaterThanOrEqual(deck.x0);
      expect(deck.ladderX).toBeLessThanOrEqual(deck.x1);
    }
  });

  it("connects every ladder bottom to the flat floor and top to a real deck", () => {
    expect(laddersFor(3)).toHaveLength(10);
    for (const ladder of laddersFor(3)) {
      expect(ladder.bottom).toBe(GROUND_Y);
      expect(landingDeckAt(3, ladder.x)?.y).toBe(ladder.top);
      expect(groundYAt(3, ladder.x, ladder.top)).toBe(ladder.top);
      expect(groundYAt(3, ladder.x, ladder.bottom)).toBe(GROUND_Y);
    }
  });

  it("grounds upward and downward exits on exact connected surfaces", () => {
    for (const ladder of laddersFor(3)) {
      expect(ladderExitSurfaceY(3, ladder, -1)).toBe(ladder.top);
      expect(ladderExitSurfaceY(3, ladder, 1)).toBe(GROUND_Y);
    }
  });

  it("climbs every ladder fully in both directions without leaving its bounds", () => {
    for (const ladder of laddersFor(3)) {
      const up = fighter(ladder.x, ladder.bottom); mount(up, ladder);
      let upGuard = 0;
      while (up.climbing && upGuard++ < 200) stepClimb(up, ladder, -1);
      expect(up.y).toBe(ladder.top);
      const down = fighter(ladder.x, ladder.top); mount(down, ladder);
      let downGuard = 0;
      while (down.climbing && downGuard++ < 200) stepClimb(down, ladder, 1);
      expect(down.y).toBe(GROUND_Y);
    }
  });

  it("stages both waves before the boss arena in progression order", () => {
    const first = encounterX(3, 0);
    const second = encounterX(3, 1);
    const boss = bossArenaX(3);
    expect(first).not.toBeNull(); expect(second).not.toBeNull(); expect(boss).not.toBeNull();
    expect(first as number).toBeLessThan(second as number);
    expect(second as number).toBeLessThan(boss as number);
    expect(boss as number).toBeGreaterThan(FUDDER_SECTION_WIDTH * 4);
    expect(boss as number).toBeLessThan(getLevelWidth(3));
  });

  it("contains every major propaganda landmark from the approved blueprint", () => {
    expect(FUDDER_LANDMARKS).toHaveLength(16);
    expect(FUDDER_LANDMARKS).toContain("FUDDER NEWS ALWAYS RIGHT");
    expect(FUDDER_LANDMARKS).toContain("PROPAGANDA CONVEYOR");
    expect(FUDDER_LANDMARKS).toContain("FUDDER STORAGE TANKS");
    expect(FUDDER_LANDMARKS).toContain("INFORMATION IS A PRODUCT");
    expect(FUDDER_LANDMARKS).toContain("FUDDER FREIGHT");
    expect(FUDDER_LANDMARKS).toContain("LOADING BAYS 01 AND 02");
    expect(FUDDER_LANDMARKS).toContain("FUDDER PRESENTATION CHAMBER");
  });

  it("binds all ten blueprint decks to visual structures", () => {
    expect(FUDDER_VISUAL_DECK_IDS).toHaveLength(10);
    expect(FUDDER_VISUAL_DECK_IDS).toHaveLength(landingDecksFor(3).length);
    expect(new Set(FUDDER_VISUAL_DECK_IDS).size).toBe(10);
  });

  it("locks poster wording and definitive Fudder atlas usage", () => {
    expect(FUDDER_POSTER_TEXT).toEqual(["WANTED BY FUDDER", "DON'T BUY"]);
    expect(__fudderTerritoryTest.atlasUrl).toContain("fudder-atlas.png");
  });

  it("caches one finite world spanning all five continuous sections", () => {
    const world = fudderTerritoryFor(3);
    expect(world).toBe(fudderTerritoryFor(3));
    expect(world?.width).toBe(FUDDER_SECTION_WIDTH * FUDDER_SECTIONS.length);
    expect(world?.skyline.length).toBeGreaterThan(40);
    for (const block of world?.skyline ?? []) {
      expect(Number.isFinite(block.x + block.w + block.h)).toBe(true);
    }
  });

  it("does not alter neighbouring level world definitions", () => {
    expect(getLevelWidth(2)).toBe(15600);
    expect(getLevelWidth(4)).toBe(DEFAULT_LEVEL_WIDTH);
    expect(pitsFor(4)).toHaveLength(0);
    expect(laddersFor(4)).toHaveLength(0);
  });
});

describe("connectingLadder", () => {
  it("only returns ladders joining the two given floors", () => {
    const pit = pitsFor(2)[0];
    const lad = connectingLadder(2, pit.x0 + 220, pit.y, 351);
    expect(lad).not.toBeNull();
    expect(lad!.x).toBeGreaterThan(pit.x0);
    expect(lad!.x).toBeLessThan(pit.x1);
  });

  it("never routes a fighter inside a pit to a ladder outside that pit", () => {
    const pit = pitsFor(2)[0];
    const lad = connectingLadder(2, pit.x0 + 10, pit.y, 320);
    if (lad) {
      expect(lad.x).toBeGreaterThan(pit.x0);
      expect(lad.x).toBeLessThan(pit.x1);
    }
  });

  it("returns null when both fighters share a floor with no joining ladder", () => {
    expect(connectingLadder(2, 100, 320, 320)).toBeNull();
  });
});
