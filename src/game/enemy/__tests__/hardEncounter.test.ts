import { describe, expect, it } from "vitest";
import {
  LEVEL_7_HARD_ACTIVE_CAP,
  LEVEL_7_HARD_ENGAGED_MAX,
  LEVEL_7_HARD_HOLD_BASE,
  LEVEL_7_HARD_REFILL_FRAMES,
  assignLevel7HardEngagement,
  beginLevel7HardWave,
  isLevel7HardWaveComplete,
  shouldUseLevel7HardEncounter,
  stepLevel7HardWave,
} from "../hardEncounter";

interface Fighter { id: number; hp: number; state: string }

function roster(total: number): Fighter[] {
  return Array.from({ length: total }, (_, id) => ({ id, hp: 100, state: "idle" }));
}

describe("Level 7 Hard finite encounter queue", () => {
  it("is gated away from Normal Level 7 and every other level", () => {
    expect(shouldUseLevel7HardEncounter(6, "blackMonday")).toBe(true);
    expect(shouldUseLevel7HardEncounter(6, "normal")).toBe(false);
    expect(shouldUseLevel7HardEncounter(5, "blackMonday")).toBe(false);
  });

  it("partitions one finite roster without duplicates", () => {
    const fighters = roster(24);
    const wave = beginLevel7HardWave(fighters, 0);
    expect(wave.active).toHaveLength(LEVEL_7_HARD_ACTIVE_CAP);
    expect(wave.encounter.queue).toHaveLength(17);
    expect(wave.encounter.authoredTotal).toBe(24);
    expect(new Set([...wave.active, ...wave.encounter.queue]).size).toBe(24);
  });

  it("deduplicates repeated object identities during the single initialization", () => {
    const fighter = roster(1)[0];
    const wave = beginLevel7HardWave([fighter, fighter], 0);
    expect(wave.encounter.authoredTotal).toBe(1);
    expect(wave.active).toEqual([fighter]);
  });

  it("does not exceed the living cap or spawn while full", () => {
    const wave = beginLevel7HardWave(roster(12), 0);
    expect(stepLevel7HardWave(wave.active, wave.encounter)).toBe(0);
    expect(wave.active.filter((f) => f.state !== "dead")).toHaveLength(LEVEL_7_HARD_ACTIVE_CAP);
    expect(wave.encounter.queue).toHaveLength(5);
  });

  it("dead fighters release capacity and refill only a controlled batch", () => {
    const wave = beginLevel7HardWave(roster(12), 0);
    wave.active[0].hp = 0;
    wave.active[0].state = "dead";
    wave.active[1].hp = 0;
    wave.active[1].state = "dead";
    wave.active[2].hp = 0;
    wave.active[2].state = "dead";
    expect(stepLevel7HardWave(wave.active, wave.encounter)).toBe(2);
    expect(wave.active.filter((f) => f.hp > 0 && f.state !== "dead")).toHaveLength(6);
    expect(wave.encounter.queue).toHaveLength(3);
    expect(stepLevel7HardWave(wave.active, wave.encounter)).toBe(0);
    for (let i = 1; i < LEVEL_7_HARD_REFILL_FRAMES - 1; i++) stepLevel7HardWave(wave.active, wave.encounter);
    expect(wave.encounter.queue).toHaveLength(3);
    expect(stepLevel7HardWave(wave.active, wave.encounter)).toBe(1);
    expect(wave.active.filter((f) => f.hp > 0 && f.state !== "dead")).toHaveLength(7);
  });

  it("completes only when living active and queued remaining are both zero", () => {
    const wave = beginLevel7HardWave(roster(9), 0);
    wave.active.forEach((f) => { f.hp = 0; f.state = "dead"; });
    expect(isLevel7HardWaveComplete(wave.active, wave.encounter)).toBe(false);
    stepLevel7HardWave(wave.active, wave.encounter);
    expect(wave.encounter.queue).toHaveLength(0);
    expect(isLevel7HardWaveComplete(wave.active, wave.encounter)).toBe(false);
    wave.active.slice(-2).forEach((f) => { f.hp = 0; f.state = "dead"; });
    expect(isLevel7HardWaveComplete(wave.active, wave.encounter)).toBe(true);
  });

  it("initializes all five authored waves independently and reaches the boss boundary", () => {
    for (let waveIndex = 0; waveIndex < 5; waveIndex++) {
      const wave = beginLevel7HardWave(roster(10 + waveIndex), waveIndex);
      while (wave.encounter.queue.length > 0) {
        wave.active.filter((f) => f.hp > 0).forEach((f) => { f.hp = 0; f.state = "dead"; });
        wave.encounter.refillTimer = 0;
        stepLevel7HardWave(wave.active, wave.encounter);
      }
      wave.active.filter((f) => f.hp > 0).forEach((f) => { f.hp = 0; f.state = "dead"; });
      expect(isLevel7HardWaveComplete(wave.active, wave.encounter)).toBe(true);
      expect(wave.encounter.wave).toBe(waveIndex);
    }
  });
});
describe("Level 7 Hard engagement slots", () => {
  const f = (x: number, extra: Record<string, unknown> = {}) => ({ x, y: 320, hp: 10, state: "walk", ...extra });

  it("lets at most two fighters engage and staggers the rest per side", () => {
    const fighters = [f(460), f(520), f(560), f(600), f(640), f(300), f(260)];
    const holds = assignLevel7HardEngagement(fighters, { x: 500, y: 320 });
    expect(fighters.length - holds.size).toBe(LEVEL_7_HARD_ENGAGED_MAX);
    const distances = [...holds.values()].sort((a, b) => a - b);
    expect(new Set(distances).size).toBeGreaterThanOrEqual(2);
    expect(Math.min(...distances)).toBe(LEVEL_7_HARD_HOLD_BASE);
  });

  it("never assigns excluded, dead, climbing, boss or other-deck fighters", () => {
    const cat = f(700, { cat: true });
    const fighters = [f(490), f(510), cat, f(560, { hp: 0, state: "dead" }),
      f(580, { climbing: true }), f(600, { isBoss: true }), f(620, { y: 200 })];
    const holds = assignLevel7HardEngagement(fighters, { x: 500, y: 320 }, (x) => "cat" in x);
    expect(holds.size).toBe(0);
  });
});
