import { describe, it, expect } from "vitest";
import {
  GRUNT_STRIKES,
  isStrikeActive,
  resolveGruntStrike,
} from "../meleeStrike";

type E = Parameters<typeof resolveGruntStrike>[0];
type P = Parameters<typeof resolveGruntStrike>[1];

const enemy = (over: Partial<E> = {}): E => ({
  x: 200,
  y: 320,
  width: 30,
  height: 70,
  facing: 1,
  state: "punch",
  stateTimer: 8,
  ...over,
}) as E;

const player = (over: Partial<P> = {}): P => ({
  x: 230,
  y: 320,
  width: 30,
  height: 70,
  state: "idle",
  ...over,
}) as P;

describe("grunt melee strike", () => {
  it("hits clearly inside range", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 225 }), false).hit).toBe(true);
  });

  it("hits while bodies partially overlap (the reported bug)", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 205 }), false).hit).toBe(true);
    expect(resolveGruntStrike(enemy(), player({ x: 199 }), false).hit).toBe(true);
  });

  it("misses clearly outside range", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 320 }), false).hit).toBe(false);
  });

  it("misses when facing away from the player", () => {
    expect(
      resolveGruntStrike(enemy({ facing: -1 }), player({ x: 235 }), false).hit,
    ).toBe(false);
  });

  it("is reliable across the whole active window as the player moves", () => {
    for (let t = GRUNT_STRIKES.punch.activeFrom; t >= GRUNT_STRIKES.punch.activeTo; t--) {
      expect(resolveGruntStrike(enemy({ stateTimer: t }), player({ x: 220 }), false).hit).toBe(true);
    }
  });

  it("stays inactive during anticipation and recovery", () => {
    expect(resolveGruntStrike(enemy({ stateTimer: 12 }), player(), false).hit).toBe(false);
    expect(resolveGruntStrike(enemy({ stateTimer: 3 }), player(), false).hit).toBe(false);
  });

  it("never damages twice from one swing", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 220 }), true).hit).toBe(false);
  });

  it("does not hit a dead player", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 220, state: "dead" }), false).hit).toBe(false);
  });

  it("misses across a large vertical gap (player mid-jump)", () => {
    expect(resolveGruntStrike(enemy(), player({ x: 220, y: 200 }), false).hit).toBe(false);
  });

  it("keeps authored ranges and damage unchanged", () => {
    expect(GRUNT_STRIKES.punch).toMatchObject({ range: 40, damage: 5, duration: 12 });
    expect(GRUNT_STRIKES.kick).toMatchObject({ range: 50, damage: 6, duration: 15 });
  });

  it("resolves each attacker independently", () => {
    const a = enemy({ x: 200 });
    const b = enemy({ x: 260, facing: -1, state: "kick", stateTimer: 10 });
    expect(resolveGruntStrike(a, player({ x: 225 }), false).hit).toBe(true);
    expect(resolveGruntStrike(b, player({ x: 225 }), false).hit).toBe(true);
    expect(isStrikeActive(GRUNT_STRIKES.kick, b.stateTimer)).toBe(true);
  });
});
