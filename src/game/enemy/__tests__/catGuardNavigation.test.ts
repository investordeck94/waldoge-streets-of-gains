import { describe, expect, it } from "vitest";
import { laddersFor } from "@/game/config/world";
import {
  CAT_LADDER_SPACING, catSurfaceIdAt, nextCatGuardLadder,
  resolveCatGuardSpacing, validCatGuardMount, type CatGuardClimbState,
} from "../catGuardNavigation";

const guard = (x: number, y: number, variant: "catBlack" | "catOrange" = "catBlack"): CatGuardClimbState => ({
  x, y, vx: 0, vy: 0, width: 30, height: 70, facing: 1,
  hp: 80, maxHp: 80, state: "idle", stateTimer: 0, attackCooldown: 0, variant,
});

describe("Level 7 Cat Guard ladder navigation", () => {
  it("routes chained decks one real ladder at a time", () => {
    expect(nextCatGuardLadder("main", "cage-level", 6200)?.id).toBe("key-guard-ladder");
    expect(nextCatGuardLadder("key-deck", "cage-level", 6400)?.id).toBe("key-to-upper-2");
    expect(nextCatGuardLadder("key-deck-2", "cage-level", 6600)?.id).toBe("upper-2-to-3");
  });

  it("mounts only from the matching surface, endpoint and interaction range", () => {
    const ladder = laddersFor(6).find((item) => item.id === "key-guard-ladder");
    expect(ladder).toBeDefined();
    if (!ladder) return;
    expect(validCatGuardMount(guard(ladder.x, 320), ladder, "main", new Set())).toBe(true);
    expect(validCatGuardMount(guard(ladder.x + 30, 320), ladder, "main", new Set())).toBe(false);
    expect(validCatGuardMount(guard(ladder.x, 204), ladder, "key-deck-2", new Set())).toBe(false);
    expect(validCatGuardMount(guard(ladder.x, 320), ladder, "main", new Set([ladder.id ?? ""]))).toBe(false);
  });

  it("recognizes only real collision surfaces", () => {
    expect(catSurfaceIdAt(6360, 262)).toBe("key-deck");
    expect(catSurfaceIdAt(6900, 88)).toBe("cage-level");
    expect(catSurfaceIdAt(6360, 173)).toBeNull();
  });

  it("separates merged guards deterministically without moving a climber", () => {
    const left = guard(6200, 262);
    const right = guard(6204, 262, "catOrange");
    const climbing = { ...guard(6202, 300), climbing: true };
    resolveCatGuardSpacing([right, climbing, left]);
    expect(right.x - left.x).toBeGreaterThanOrEqual(CAT_LADDER_SPACING);
    expect(climbing.x).toBe(6202);
  });

  it("never repositions guards during active combat states", () => {
    const attacker = { ...guard(6204, 262, "catOrange"), state: "kick", catMove: "frontKick" as const };
    const idle = guard(6200, 262);
    resolveCatGuardSpacing([idle, attacker]);
    expect(attacker.x).toBe(6204);
  });
});