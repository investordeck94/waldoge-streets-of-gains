import { describe, expect, it } from "vitest";
import {
  AREA_W,
  BAD_ACTOR_AREAS,
  BAD_ACTOR_SECTIONS,
  SUSTER_CHARACTER_URLS,
  badActorAreaBounds,
  badActorSectionLabelAt,
  badActorWorldFor,
} from "../badActorStudios";
import { getLevelWidth, laddersFor, landingDecksFor, pitsFor } from "@/game/config/world";

describe("level 3 — Bad Actors Studios blueprint areas", () => {
  it("has the 13 blueprint areas in the approved order", () => {
    expect(BAD_ACTOR_SECTIONS).toEqual([
      "BAD ACTORS STUDIOS",
      "OUTDOOR FILM LOT",
      "REDACTED HOLLYWOOD",
      "DIRECTOR'S OFFICE",
      "BAD ACTOR DISTRICT",
      "SUS'TER ACT MOVIE SET",
      "STAGE 1",
      "STAGE 2",
      "GREEN SCREEN STAGE",
      "PROP DEPARTMENT",
      "MAKEUP / DRESSING ROOMS",
      "BACKSTAGE STORAGE",
      "ROOFTOP / BAD ACTOR ARENA",
    ]);
  });

  it("gives every area its own painted section of a long world", () => {
    expect(getLevelWidth(2)).toBe(BAD_ACTOR_AREAS.length * AREA_W);
    const art = new Set(BAD_ACTOR_AREAS.map((a) => a.art));
    expect(art.size).toBe(BAD_ACTOR_AREAS.length);
    for (const a of BAD_ACTOR_AREAS) expect(a.art).toMatch(/l3-\d\d-/);
  });

  it("places each landmark in its own part of the world", () => {
    expect(badActorSectionLabelAt(2, 10)).toBe("BAD ACTORS STUDIOS");
    expect(badActorSectionLabelAt(2, 2 * AREA_W + 50)).toBe("REDACTED HOLLYWOOD");
    expect(badActorSectionLabelAt(2, 4 * AREA_W + 50)).toBe("BAD ACTOR DISTRICT");
    expect(badActorSectionLabelAt(2, 5 * AREA_W + 50)).toBe("SUS'TER ACT MOVIE SET");
    expect(badActorSectionLabelAt(2, getLevelWidth(2) - 10)).toBe("ROOFTOP / BAD ACTOR ARENA");
    expect(badActorSectionLabelAt(1, 10)).toBeNull();
    expect(badActorAreaBounds(0)).toEqual({ x0: 0, x1: AREA_W });
  });

  it("uses the approved identity art in the right landmarks only", () => {
    const redacted = BAD_ACTOR_AREAS[2];
    expect(redacted.overlays.length).toBe(1);
    expect(redacted.overlays[0].src).toContain("susdog-original");
    const projector = BAD_ACTOR_AREAS[4];
    expect(projector.overlays.some((o) => o.src.includes("badactor-boss-head"))).toBe(true);
    const suster = BAD_ACTOR_AREAS[5];
    expect(suster.susterAds.length).toBe(3);
    expect(SUSTER_CHARACTER_URLS.nunFrog).toContain("suster-act-nun-frog");
    expect(SUSTER_CHARACTER_URLS.nunSusDog).toContain("suster-act-nun-sus-dog");
    // Protected landmarks never receive the nun movie campaign.
    expect(redacted.susterAds).toHaveLength(0);
    expect(projector.susterAds).toHaveLength(0);
    // The environment never contains the player character.
    expect(JSON.stringify(BAD_ACTOR_AREAS).toUpperCase()).not.toContain("WALDOGE");
  });

  it("places the same two-character SUS'TER ACT campaign throughout production", () => {
    const advertisedAreas = BAD_ACTOR_AREAS
      .map((area, index) => ({ index, ads: area.susterAds.length }))
      .filter((area) => area.ads > 0);
    expect(advertisedAreas.map((area) => area.index)).toEqual([0, 1, 3, 5, 6, 7, 8, 10, 11]);
    expect(advertisedAreas.reduce((sum, area) => sum + area.ads, 0)).toBe(11);
  });

  it("gives every advertisement a different design with a COMING SOON strap", () => {
    const ads = BAD_ACTOR_AREAS.flatMap((area) => area.susterAds);
    expect(ads).toHaveLength(11);
    expect(new Set(ads.map((ad) => ad.style)).size).toBe(ads.length);
    for (const ad of ads) expect(ad.tagline ?? "COMING SOON").toBe("COMING SOON");
  });

  it("keeps every overlay rectangle inside its area", () => {
    for (const area of BAD_ACTOR_AREAS) {
      for (const o of area.overlays) {
        expect(o.x).toBeGreaterThanOrEqual(0);
        expect(o.y).toBeGreaterThanOrEqual(0);
        expect(o.x + o.w).toBeLessThanOrEqual(1);
        expect(o.y + o.h).toBeLessThanOrEqual(1);
      }
      for (const ad of area.susterAds) {
        expect(ad.x).toBeGreaterThanOrEqual(0);
        expect(ad.y).toBeGreaterThanOrEqual(0);
        expect(ad.x + ad.w).toBeLessThanOrEqual(1);
        expect(ad.y + ad.h).toBeLessThanOrEqual(1);
      }
    }
  });

  it("caches the world model and only answers for level 3", () => {
    expect(badActorWorldFor(2)).toBe(badActorWorldFor(2));
    expect(badActorWorldFor(1)).toBeNull();
    const w = badActorWorldFor(2)!;
    expect(w.areas).toBe(BAD_ACTOR_AREAS.length);
    for (const b of w.skyline) expect(Number.isFinite(b.x) && Number.isFinite(b.h)).toBe(true);
  });

  it("spreads real vertical traversal across the studio areas", () => {
    const areasWithLadders = new Set(laddersFor(2).map((l) => Math.floor(l.x / AREA_W)));
    expect(areasWithLadders.size).toBeGreaterThanOrEqual(5);
    // Every ladder endpoint is a real collision surface (deck, pit or street).
    const decks = landingDecksFor(2);
    for (const l of laddersFor(2)) {
      const onDeck = decks.some((d) => l.x >= d.x0 && l.x <= d.x1 && d.y === l.top);
      const onStreet = l.top === 320;
      expect(onDeck || onStreet).toBe(true);
    }
    for (const p of pitsFor(2)) {
      expect(laddersFor(2).some((l) => l.x > p.x0 && l.x < p.x1)).toBe(true);
    }
  });
});
