import { describe, it, expect } from "vitest";
import {
  BOSS_MOVESETS,
  getMoveSet,
  getMoveById,
  selectBossMove,
  rollChain,
  type BossMove,
} from "@/game/enemy/bossMoves";
import { LEVELS } from "@/game/config/levels";

const bossNames = LEVELS.map((l) => l.boss.name);

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

describe("boss move sets — all 7 levels", () => {
  it("every level boss has a registered move set", () => {
    for (const name of bossNames) {
      expect(BOSS_MOVESETS[name], name).toBeDefined();
    }
  });

  it.each(bossNames)("%s has 4-8 distinct moves", (name) => {
    const set = getMoveSet(name);
    expect(set.length).toBeGreaterThanOrEqual(4);
    expect(set.length).toBeLessThanOrEqual(8);
    expect(new Set(set.map((m) => m.id)).size).toBe(set.length);
  });

  it.each(bossNames)("%s move sets are unique to that boss", (name) => {
    const ids = new Set(getMoveSet(name).map((m) => m.id));
    for (const other of bossNames) {
      if (other === name) continue;
      const overlap = getMoveSet(other).filter((m) => ids.has(m.id));
      expect(overlap, `${name} vs ${other}`).toHaveLength(0);
    }
  });

  it.each(bossNames)("%s: every move has a guaranteed exit and valid hit frames", (name) => {
    for (const m of getMoveSet(name)) {
      expect(m.duration, m.id).toBeGreaterThan(0);
      for (const f of m.hitFrames) {
        expect(f, `${m.id} hitFrame`).toBeGreaterThan(0);
        expect(f).toBeLessThan(m.duration);
      }
      for (const v of m.projectiles ?? []) {
        expect(v.frame, `${m.id} volley`).toBeGreaterThan(0);
        expect(v.frame).toBeLessThan(m.duration);
      }
      expect(m.cooldown).toBeGreaterThan(0);
      expect(m.maxDist).toBeGreaterThan(m.minDist);
      // A move must do something: damage, projectiles or movement.
      const doesSomething =
        m.hitFrames.length > 0 || (m.projectiles?.length ?? 0) > 0 || !!m.advance;
      expect(doesSomething, m.id).toBe(true);
    }
  });

  it.each(bossNames)("%s has close, ranged and phase-gated options", (name) => {
    const set = getMoveSet(name);
    expect(set.some((m) => m.minDist === 0 && m.hitFrames.length > 0)).toBe(true);
    expect(set.some((m) => (m.projectiles?.length ?? 0) > 0)).toBe(true);
    expect(set.some((m) => m.minPhase > 1)).toBe(true);
  });

  it.each(bossNames)("%s picks something usable at every distance band", (name) => {
    for (const dist of [0, 40, 90, 140, 220, 400, 700]) {
      for (const phase of [1, 2, 3]) {
        const m = selectBossMove(name, { dist, vertGap: 0, phase, rng: seeded(dist + phase) });
        if (m) {
          expect(m.minDist).toBeLessThanOrEqual(dist);
          expect(m.maxDist).toBeGreaterThanOrEqual(dist);
          expect(phase).toBeGreaterThanOrEqual(m.minPhase);
        }
      }
    }
  });

  it.each(bossNames)("%s can reach a player standing high above it", (name) => {
    const m = selectBossMove(name, { dist: 200, vertGap: 200, phase: 1, rng: seeded(7) });
    expect(m, name).not.toBeNull();
    const reaches = (m as BossMove).projectiles?.length || (m as BossMove).vertRange >= 200;
    expect(Boolean(reaches)).toBe(true);
  });

  it.each(bossNames)("%s never spams the same move three times in a row", (name) => {
    const rng = seeded(99);
    let last: string | undefined;
    let repeat = 0;
    let maxRepeat = 0;
    for (let i = 0; i < 400; i++) {
      const dist = [30, 80, 160, 300][i % 4];
      const m = selectBossMove(name, {
        dist, vertGap: 0, phase: (i % 3) + 1, lastMoveId: last, repeatCount: repeat, rng,
      });
      if (!m) continue;
      repeat = m.id === last ? repeat + 1 : 1;
      last = m.id;
      maxRepeat = Math.max(maxRepeat, repeat);
    }
    expect(maxRepeat).toBeLessThanOrEqual(2);
  });

  it.each(bossNames)("%s uses a varied mix over a long fight", (name) => {
    const rng = seeded(1234);
    const used = new Set<string>();
    let last: string | undefined;
    let repeat = 0;
    for (let i = 0; i < 600; i++) {
      const dist = [20, 70, 130, 210, 450][i % 5];
      const m = selectBossMove(name, {
        dist, vertGap: 0, phase: 3, lastMoveId: last, repeatCount: repeat, rng,
      });
      if (!m) continue;
      repeat = m.id === last ? repeat + 1 : 1;
      last = m.id;
      used.add(m.id);
    }
    expect(used.size).toBeGreaterThanOrEqual(4);
  });

  it("later phases unlock more options than phase 1", () => {
    for (const name of bossNames) {
      const p1 = getMoveSet(name).filter((m) => m.minPhase <= 1).length;
      const p3 = getMoveSet(name).filter((m) => m.minPhase <= 3).length;
      expect(p3, name).toBeGreaterThan(p1);
    }
  });

  it("getMoveById round-trips and rejects unknown ids", () => {
    for (const name of bossNames) {
      const first = getMoveSet(name)[0];
      expect(getMoveById(name, first.id)?.id).toBe(first.id);
      expect(getMoveById(name, "nope")).toBeNull();
      expect(getMoveById(name, undefined)).toBeNull();
    }
  });

  it("an unknown boss name still gets a working move set", () => {
    expect(getMoveSet("SOMEBODY").length).toBeGreaterThan(0);
    expect(selectBossMove("SOMEBODY", { dist: 50, vertGap: 0, phase: 1, rng: seeded(3) })).not.toBeNull();
  });
});

describe("martial-arts combat layer — all 7 levels", () => {
  const FORMS = new Set([
    "jab", "straight", "combo", "roundhouse", "flying_kick", "sweep",
    "spin", "slam", "lunge", "throw", "dodge", "counter",
  ]);

  it.each(bossNames)("%s: every move declares a valid karate form", (name) => {
    for (const m of getMoveSet(name)) {
      expect(FORMS.has(m.martial), `${m.id} -> ${m.martial}`).toBe(true);
    }
  });

  it.each(bossNames)("%s uses at least four distinct martial forms", (name) => {
    const forms = new Set(getMoveSet(name).map((m) => m.martial));
    expect(forms.size, name).toBeGreaterThanOrEqual(4);
  });

  it.each(bossNames)("%s: telegraphs, hops and chains are well formed", (name) => {
    for (const m of getMoveSet(name)) {
      if (m.telegraph !== undefined) {
        expect(m.telegraph, m.id).toBeGreaterThan(0);
        expect(m.telegraph).toBeLessThan(1);
      }
      if (m.hop !== undefined) expect(m.hop, m.id).toBeGreaterThan(0);
      for (const id of m.chainTo ?? []) {
        expect(getMoveById(name, id), `${m.id} chains to ${id}`).not.toBeNull();
      }
      if (m.chainChance !== undefined) {
        expect(m.chainChance).toBeGreaterThan(0);
        expect(m.chainChance).toBeLessThanOrEqual(1);
      }
    }
  });

  it.each(bossNames)("%s: heavy moves always telegraph before landing", (name) => {
    for (const m of getMoveSet(name)) {
      // "Heavy" = a committed, slow move; fast jabs stay unannounced by design.
      if (m.damage >= 6 && m.duration >= 24 && m.hitFrames.length > 0) {
        expect(m.telegraph, `${m.id} heavy move needs a telegraph`).toBeDefined();
      }
    }
  });

  it("rollChain only returns declared follow-ups and can decline", () => {
    const jab = getMoveById("TICKER TAKER", "tt_jab")!;
    const always = rollChain("TICKER TAKER", jab, () => 0);
    expect(jab.chainTo).toContain(always!.id);
    expect(rollChain("TICKER TAKER", jab, () => 0.99)).toBeNull();
    const noChain = getMoveById("TICKER TAKER", "tt_scythe_reap")!;
    expect(rollChain("TICKER TAKER", noChain, () => 0)).toBeNull();
  });
});
