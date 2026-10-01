import { describe, expect, it } from "vitest";
import { GROUND_Y } from "@/game/config/player";
import { ENCOUNTER_ZONES, getLevelWidth, groundYAt, laddersFor, landingDeckForLadder, landingDecksFor, pitsFor } from "@/game/config/world";
import { LEVELS } from "@/game/config/levels";
import { applyCitadelRoster, CITADEL_KEY_GUARD_WAVE, CITADEL_LEVEL } from "@/game/enemy/citadelForces";
import { collectCitadelKey, initialCitadelQuest, rescueAnon, unlockCitadelKey } from "@/game/logic/citadelQuest";
import { CITADEL_ELEVATION_BANDS, CITADEL_INNER_RANGES, CITADEL_SECTION_BOUNDS, validateCitadelBlueprint } from "@/game/config/citadelBlueprint";

const KEY = { x: 6360, y: 262 } as const;
const CAGE = { x: 6900, y: 88 } as const;

describe("Level 7 final blueprint geometry", () => {
  const decks = landingDecksFor(CITADEL_LEVEL);
  const ladders = laddersFor(CITADEL_LEVEL);

  it("is five exact 1800-unit sections with a continuous flat floor", () => {
    expect(getLevelWidth(CITADEL_LEVEL)).toBe(9000);
    expect(pitsFor(CITADEL_LEVEL)).toHaveLength(0);
    for (let x = 0; x <= 9000; x += 25) expect(groundYAt(CITADEL_LEVEL, x, GROUND_Y)).toBe(GROUND_Y);
  });

  it("passes the deterministic blueprint validator and preserves all elevation bands", () => {
    expect(CITADEL_SECTION_BOUNDS).toEqual([0, 1800, 3600, 5400, 7200, 9000]);
    expect(CITADEL_ELEVATION_BANDS.map((band) => band.blueprintY)).toEqual([0, 150, 300, 450, 600]);
    expect(CITADEL_ELEVATION_BANDS.map((band) => band.y)).toEqual([GROUND_Y, 262, 204, 146, 88]);
    expect(validateCitadelBlueprint()).toMatchObject({ valid: true, width: 9000, sections: 5, deckCount: 20, ladderCount: 23, issues: [] });
  });

  it("has one encounter in every section and a final throne boss", () => {
    const zone = ENCOUNTER_ZONES[CITADEL_LEVEL];
    expect(zone.waves.map((f) => Math.floor(f * 5))).toEqual([0, 1, 2, 3, 4]);
    expect(LEVELS[CITADEL_LEVEL].waves).toHaveLength(5);
    expect(zone.boss * 9000).toBeGreaterThan(8400);
    expect(LEVELS[CITADEL_LEVEL].boss.name).toBe("TICKER TAKER");
  });

  it("gives every visible deck explicit identity, collision and ladder links", () => {
    expect(decks.length).toBeGreaterThanOrEqual(20);
    for (const deck of decks) {
      expect(deck.id).toBeTruthy();
      expect(deck.collisionEnabled).toBe(true);
      expect(deck.x1).toBeGreaterThan(deck.x0);
      expect(deck.y).toBeLessThan(GROUND_Y);
      expect(deck.connectedLadderIds?.length).toBeGreaterThan(0);
    }
  });

  it("connects every ladder endpoint to real surfaces", () => {
    expect(ladders).toHaveLength(23);
    for (const ladder of ladders) {
      expect(ladder.id).toBeTruthy();
      expect(ladder.top).toBeLessThan(ladder.bottom);
      const top = decks.find((d) => d.id === ladder.topSurfaceId && ladder.x >= d.x0 && ladder.x <= d.x1 && d.y === ladder.top);
      const bottom = ladder.bottomSurfaceId === "main"
        ? ladder.bottom === GROUND_Y
        : decks.some((d) => d.id === ladder.bottomSurfaceId && ladder.x >= d.x0 && ladder.x <= d.x1 && d.y === ladder.bottom);
      expect(top).toBeDefined();
      expect(landingDeckForLadder(CITADEL_LEVEL, ladder)?.id).toBe(ladder.topSurfaceId);
      expect(bottom).toBe(true);
      expect(groundYAt(CITADEL_LEVEL, ladder.x, ladder.top)).toBe(ladder.top);
    }
  });

  it("places the key after three climbs and the cage above two prison decks", () => {
    expect(decks.find((d) => d.id === "key-deck" && d.y === KEY.y && KEY.x >= d.x0 && KEY.x <= d.x1)).toBeDefined();
    expect(CITADEL_INNER_RANGES.map((range) => [range.x0, range.x1])).toEqual([
      [5400, 5600], [5600, 5850], [5850, 6100], [6100, 6500],
      [6500, 6750], [6750, 7000], [7000, 7200],
    ]);
    expect(["key-floor-to-d1", "key-guard-ladder"].every((id) => ladders.some((l) => l.id === id))).toBe(true);
    const prison = ["prison-deck-1", "prison-deck-2", "cage-level"].map((id) => decks.find((d) => d.id === id));
    expect(prison.every(Boolean)).toBe(true);
    expect(prison[2]?.y).toBeLessThan(prison[1]?.y ?? 0);
    expect(prison[1]?.y).toBeLessThan(prison[0]?.y ?? 0);
    expect(CAGE.y).toBe(prison[2]?.y);
  });
});

describe("Level 7 objective flow", () => {
  it("stages Candle Minions across the key route", () => {
    const enemies = Array.from({ length: 7 }, (_, i) => ({ x: 5900 + i * 50, y: GROUND_Y }));
    applyCitadelRoster(enemies, CITADEL_LEVEL, CITADEL_KEY_GUARD_WAVE);
    expect(enemies.some((e) => e.y === GROUND_Y)).toBe(true);
    expect(new Set(enemies.map((e) => e.y)).size).toBeGreaterThanOrEqual(3);
  });

  it("forbids early key pickup and rescue, then completes once in range", () => {
    const state = initialCitadelQuest();
    expect(collectCitadelKey(state, KEY, KEY)).toBe(false);
    expect(rescueAnon(state, CAGE, CAGE)).toBe(false);
    unlockCitadelKey(state, CITADEL_KEY_GUARD_WAVE + 1, CITADEL_KEY_GUARD_WAVE);
    expect(collectCitadelKey(state, KEY, KEY)).toBe(true);
    expect(collectCitadelKey(state, KEY, KEY)).toBe(false);
    expect(rescueAnon(state, CAGE, CAGE)).toBe(true);
    expect(rescueAnon(state, CAGE, CAGE)).toBe(false);
  });
});

describe("Levels 1–6 geometry regression", () => {
  it("keeps established neighbouring world widths and bosses", () => {
    expect([getLevelWidth(3), getLevelWidth(4), getLevelWidth(5)]).toEqual([9000, 9000, 9000]);
    expect(LEVELS.slice(0, 6).map((l) => l.boss.name)).toEqual(["JEET", "RUGGER", "BAD ACTOR", "FUDDER", "EXIT LIQUIDITY", "MR MARKETER"]);
  });
});
describe("Opening breathing space", () => {
  it("stages no Level 7 wave-1 fighter inside the opening clearance", async () => {
    const { OPENING_CLEAR_X } = await import("@/game/enemy/citadelForces");
    const enemies = Array.from({ length: 24 }, (_, i) => ({ x: 600 + i * 320, y: 320 }));
    applyCitadelRoster(enemies, CITADEL_LEVEL, 0);
    for (const e of enemies) expect(e.x).toBeGreaterThanOrEqual(OPENING_CLEAR_X);
  });
});
