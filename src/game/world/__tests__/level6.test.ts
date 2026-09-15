/**
 * LEVEL 6 — MR. MARKETER'S TERRITORY.
 * Geometry, encounter, story-object and enemy-roster contracts.
 */
import { describe, expect, it } from "vitest";
import { GROUND_Y } from "@/game/config/player";
import {
  ENCOUNTER_ZONES,
  bossArenaX,
  encounterX,
  getLevelWidth,
  groundYAt,
  laddersFor,
  landingDecksFor,
  pitsFor,
} from "@/game/config/world";
import { LEVELS } from "@/game/config/levels";
import {
  CAGE_POSITION,
  KEY_POSITION,
  MARKETER_BLUEPRINT_MAP,
  MARKETER_SECTIONS,
  MARKETER_SECTION_WIDTH,
  MARKETER_TERRITORY_LEVEL as L6,
  MARKETER_VISUAL_DECK_IDS,
  marketerSectionLabelAt,
} from "@/game/presentation/render2d/marketerTerritory";
import {
  KEY_GUARD_WAVE,
  MARKETER_LEVEL,
  RAIDER_MAX_RANGE,
  RAIDER_MIN_RANGE,
  applyRaidingTeamRoster,
  isRaider,
  stepRaiderRanged,
  type RaiderState,
} from "@/game/enemy/raidingTeam";

const TOL = 0.001;

describe("Level 6 world geometry", () => {
  it("is a 9,000-unit world of five 1,800-unit sections", () => {
    expect(getLevelWidth(L6)).toBe(9000);
    expect(MARKETER_SECTIONS).toHaveLength(5);
    expect(MARKETER_SECTION_WIDTH * MARKETER_SECTIONS.length).toBe(9000);
  });

  it("keeps the main floor completely flat (no pits, no dips)", () => {
    expect(pitsFor(L6)).toHaveLength(0);
    for (let x = 0; x <= 9000; x += 25) {
      // Sampled below deck height so authored decks never mask the main floor.
      expect(groundYAt(L6, x, GROUND_Y)).toBeCloseTo(GROUND_Y, 5);
    }
  });

  it("labels each section from its world x", () => {
    expect(marketerSectionLabelAt(L6, 900)).toBe("ADVERTISING STREET");
    expect(marketerSectionLabelAt(L6, 2700)).toBe("COLD CALL DISTRICT");
    expect(marketerSectionLabelAt(L6, 4500)).toBe("THE FUNNEL FACTORY");
    expect(marketerSectionLabelAt(L6, 6300)).toBe("MANIPULATION DISTRICT");
    expect(marketerSectionLabelAt(L6, 8100)).toBe("MR. MARKETER HQ");
  });
});

describe("Level 6 decks and ladders", () => {
  const decks = landingDecksFor(L6);
  const ladders = laddersFor(L6);

  it("authors ten decks and seventeen ladders", () => {
    expect(decks).toHaveLength(10);
    expect(ladders).toHaveLength(17);
    expect(MARKETER_VISUAL_DECK_IDS).toHaveLength(10);
  });

  it("gives every deck finite, ordered, in-world coordinates", () => {
    for (const d of decks) {
      expect(Number.isFinite(d.x0) && Number.isFinite(d.x1) && Number.isFinite(d.y)).toBe(true);
      expect(d.x1).toBeGreaterThan(d.x0);
      expect(d.x0).toBeGreaterThanOrEqual(0);
      expect(d.x1).toBeLessThanOrEqual(9000);
      expect(d.y).toBeLessThan(GROUND_Y);
    }
  });

  it("connects every ladder to two real playable surfaces", () => {
    for (const l of ladders) {
      expect(Number.isFinite(l.x) && Number.isFinite(l.top) && Number.isFinite(l.bottom)).toBe(true);
      expect(l.top).toBeLessThan(l.bottom);
      // Bottom endpoint: the flat main floor, or a lower deck.
      const bottomIsFloor = Math.abs(l.bottom - GROUND_Y) < TOL;
      const bottomDeck = decks.find(
        (d) => l.x >= d.x0 && l.x <= d.x1 && Math.abs(d.y - l.bottom) < TOL,
      );
      expect(bottomIsFloor || Boolean(bottomDeck)).toBe(true);
      // Top endpoint: always a real authored deck spanning the ladder's x.
      const topDeck = decks.find(
        (d) => l.x >= d.x0 && l.x <= d.x1 && Math.abs(d.y - l.top) < TOL,
      );
      expect(topDeck, `ladder at x=${l.x} must land on a deck`).toBeDefined();
    }
  });

  it("resolves a climber's exit exactly onto the deck surface", () => {
    for (const l of ladders) {
      expect(groundYAt(L6, l.x, l.top)).toBeCloseTo(l.top, 5);
    }
  });

  it("keeps every deck reachable from the main floor", () => {
    for (const d of decks) {
      const serving = ladders.filter((l) => l.x >= d.x0 && l.x <= d.x1 && Math.abs(l.top - d.y) < TOL);
      expect(serving.length, `deck ${d.x0}-${d.x1} needs a ladder`).toBeGreaterThan(0);
    }
  });
});

describe("Level 6 encounters", () => {
  it("stages one encounter in every blueprint section plus the boss", () => {
    const zone = ENCOUNTER_ZONES[L6];
    expect(zone).toBeDefined();
    expect(zone.waves).toHaveLength(5);
    expect(LEVELS[L6].waves).toHaveLength(5);
    const sections = zone.waves.map((_, i) =>
      Math.floor((encounterX(L6, i) as number) / MARKETER_SECTION_WIDTH));
    expect(sections).toEqual([0, 1, 2, 3, 4]);
    expect(bossArenaX(L6)).toBeGreaterThan(8000);
  });

  it("puts the key guard encounter in the funnel factory", () => {
    const x = encounterX(L6, KEY_GUARD_WAVE) as number;
    expect(Math.floor(x / MARKETER_SECTION_WIDTH)).toBe(2);
  });

  it("keeps MR MARKETER as the single Level 6 boss", () => {
    expect(LEVELS[L6].boss.name).toBe("MR MARKETER");
  });
});

describe("Level 6 story objects", () => {
  const ids = MARKETER_BLUEPRINT_MAP.map((l) => l.id);

  it("authors exactly one key, one cage and one Squirrel display", () => {
    expect(ids.filter((id) => id === "key_display")).toHaveLength(1);
    expect(ids.filter((id) => id === "squirrel_cage")).toHaveLength(1);
    expect(ids.filter((id) => id === "squirrel_status_screen")).toHaveLength(1);
  });

  it("places the key before the cage, at the far end of the level", () => {
    expect(KEY_POSITION.x).toBeLessThan(CAGE_POSITION.x);
    expect(Math.floor(KEY_POSITION.x / MARKETER_SECTION_WIDTH)).toBe(2);
    expect(Math.floor(CAGE_POSITION.x / MARKETER_SECTION_WIDTH)).toBe(4);
  });

  it("stands the key on the guarded upper funnel platform", () => {
    const deck = landingDecksFor(L6)
      .find((d) => KEY_POSITION.x >= d.x0 && KEY_POSITION.x <= d.x1 && Math.abs(d.y - KEY_POSITION.y) < TOL);
    expect(deck).toBeDefined();
  });

  it("keeps landmarks deterministic, ordered and inside their section", () => {
    for (const l of MARKETER_BLUEPRINT_MAP) {
      expect(l.collision).toBe(false);
      expect(l.x0).toBeGreaterThanOrEqual(l.section * MARKETER_SECTION_WIDTH - 60);
      expect(l.x1).toBeLessThanOrEqual((l.section + 1) * MARKETER_SECTION_WIDTH + 60);
      expect(l.x1).toBeGreaterThan(l.x0);
    }
    const sections = MARKETER_BLUEPRINT_MAP.map((l) => l.section);
    expect([...sections].sort((a, b) => a - b)).toEqual(sections);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Raiding Team", () => {
  const wave = (n: number, x = 1000): RaiderState[] =>
    Array.from({ length: n }, (_, i) => ({
      x: x + i * 120, y: GROUND_Y, facing: -1, hp: 70, state: "idle",
    }));

  it("is added alongside the Candle Minions, never replacing them", () => {
    const enemies = applyRaidingTeamRoster(wave(5), MARKETER_LEVEL, 0);
    const raiders = enemies.filter(isRaider);
    expect(raiders.length).toBeGreaterThan(0);
    expect(raiders.length).toBeLessThan(enemies.length);
  });

  it("makes the key guard encounter primarily Raiding Team", () => {
    const enemies = applyRaidingTeamRoster(wave(5, 4300), MARKETER_LEVEL, KEY_GUARD_WAVE);
    expect(enemies.every(isRaider)).toBe(true);
  });

  it("never tags enemies outside Level 6", () => {
    for (const level of [0, 1, 2, 3, 4, 6]) {
      expect(applyRaidingTeamRoster(wave(4), level, 0).some(isRaider)).toBe(false);
    }
  });

  it("only stages raiders on real deck surfaces", () => {
    const decks = landingDecksFor(MARKETER_LEVEL);
    const enemies = applyRaidingTeamRoster(wave(6, 700), MARKETER_LEVEL, 0);
    for (const e of enemies) {
      if (e.y === GROUND_Y) continue;
      const deck = decks.find((d) => e.x >= d.x0 && e.x <= d.x1 && Math.abs(d.y - e.y) < TOL);
      expect(deck, `raider at ${e.x}/${e.y} must stand on a deck`).toBeDefined();
    }
  });

  it("fires a telegraphed burst only inside its range band", () => {
    const e: RaiderState = { x: 0, y: GROUND_Y, facing: 1, hp: 70, state: "idle", variant: "raider", raiderCooldown: 0 };
    const target = { x: RAIDER_MIN_RANGE - 20, y: GROUND_Y, hp: 100, state: "idle" };
    expect(stepRaiderRanged(e, target)).toBeNull();
    expect(e.raiderAim ?? 0).toBe(0);

    const far = { x: RAIDER_MAX_RANGE + 80, y: GROUND_Y, hp: 100, state: "idle" };
    expect(stepRaiderRanged(e, far)).toBeNull();
    expect(e.raiderAim ?? 0).toBe(0);

    const inRange = { x: 300, y: GROUND_Y, hp: 100, state: "idle" };
    expect(stepRaiderRanged(e, inRange)).toBeNull();
    expect(e.raiderAim).toBeGreaterThan(0);
    let fired = 0;
    for (let i = 0; i < 40; i++) if (stepRaiderRanged(e, inRange) === "fire") fired++;
    expect(fired).toBe(1);
  });

  it("never fires while dead, hit, or on another floor", () => {
    const dead: RaiderState = { x: 0, y: GROUND_Y, facing: 1, hp: 0, state: "dead", variant: "raider", raiderCooldown: 0 };
    expect(stepRaiderRanged(dead, { x: 300, y: GROUND_Y, hp: 100, state: "idle" })).toBeNull();
    expect(dead.raiderAim).toBe(0);

    const upstairs: RaiderState = { x: 0, y: 190, facing: 1, hp: 70, state: "idle", variant: "raider", raiderCooldown: 0 };
    stepRaiderRanged(upstairs, { x: 300, y: GROUND_Y, hp: 100, state: "idle" });
    expect(upstairs.raiderAim ?? 0).toBe(0);
  });

  it("leaves a plain Candle Minion alone", () => {
    const minion: RaiderState = { x: 0, y: GROUND_Y, facing: 1, hp: 70, state: "idle" };
    expect(stepRaiderRanged(minion, { x: 300, y: GROUND_Y, hp: 100, state: "idle" })).toBeNull();
    expect(minion.raiderAim ?? 0).toBe(0);
  });
});

describe("neighbouring levels are unchanged", () => {
  it("keeps Level 5 and Level 7 geometry intact", () => {
    expect(getLevelWidth(4)).toBe(9000);
    expect(laddersFor(6)).toHaveLength(0);
    expect(LEVELS[4].boss.name).toBe("EXIT LIQUIDITY");
    expect(LEVELS[6].boss.name).toBe("TICKER TAKER");
  });
});
