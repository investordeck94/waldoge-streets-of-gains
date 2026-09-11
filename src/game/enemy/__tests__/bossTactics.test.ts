import { describe, it, expect } from "vitest";
import {
  BOSS_PROFILES,
  getBossProfile,
  computeBossBias,
  bossCooldownFrames,
  chainCapFor,
  chainChanceFor,
  tagsFor,
  MIN_BOSS_COOLDOWN,
  MAX_BOSS_COOLDOWN,
  ABSOLUTE_CHAIN_CAP,
  type TacticalRead,
} from "@/game/enemy/bossTactics";
import { getMoveSet, getMoveById } from "@/game/enemy/bossMoves";
import { LEVELS } from "@/game/config/levels";

const ORDER = LEVELS.map((l) => l.boss.name); // JEET → TICKER TAKER

function read(over: Partial<TacticalRead> = {}): TacticalRead {
  return {
    dist: 80, vertGap: 0, phase: 1,
    airborne: false, attacking: false, recovering: false, passive: false,
    energyFrac: 0,
    ...over,
  };
}

describe("boss profiles — level 1 → 7 difficulty curve", () => {
  it("every level boss has a profile", () => {
    for (const n of ORDER) expect(BOSS_PROFILES[n], n).toBeDefined();
  });

  it("decision downtime shortens monotonically from JEET to TICKER TAKER", () => {
    const mults = ORDER.map((n) => getBossProfile(n).cdMult);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i], ORDER[i]).toBeLessThan(mults[i - 1]);
    }
  });

  it("tactical IQ rises monotonically from JEET to TICKER TAKER", () => {
    const iq = ORDER.map((n) => getBossProfile(n).tactic);
    for (let i = 1; i < iq.length; i++) {
      expect(iq[i], ORDER[i]).toBeGreaterThan(iq[i - 1]);
    }
  });

  it("phase escalation and chain strength never regress along the roster", () => {
    let step = -Infinity, chain = -Infinity;
    for (const n of ORDER) {
      const p = getBossProfile(n);
      expect(p.phaseStep, n).toBeGreaterThanOrEqual(step);
      expect(p.chainBonus, n).toBeGreaterThanOrEqual(chain);
      step = p.phaseStep; chain = p.chainBonus;
    }
  });

  it("TICKER TAKER is the peak of every difficulty column", () => {
    const tt = getBossProfile("TICKER TAKER");
    for (const n of ORDER) {
      if (n === "TICKER TAKER") continue;
      const p = getBossProfile(n);
      expect(tt.cdMult).toBeLessThan(p.cdMult);
      expect(tt.tactic).toBeGreaterThan(p.tactic);
      expect(tt.mobility).toBeGreaterThanOrEqual(p.mobility);
    }
  });

  it("unknown bosses fall back to the readable JEET profile", () => {
    expect(getBossProfile(undefined)).toEqual(BOSS_PROFILES.JEET);
    expect(getBossProfile("NOT A BOSS")).toEqual(BOSS_PROFILES.JEET);
  });
});

describe("move classification", () => {
  it("tags every move of every boss without throwing", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        const t = tagsFor(m);
        expect(typeof t.fast).toBe("boolean");
        expect(typeof t.ranged).toBe("boolean");
      }
    }
  });

  it("recognises the archetypes it biases on", () => {
    expect(tagsFor(getMoveById("JEET", "jeet_sellwall")!).ranged).toBe(true);
    expect(tagsFor(getMoveById("JEET", "jeet_sprint")!).gapCloser).toBe(true);
    expect(tagsFor(getMoveById("RUGGER", "rug_slip")!).retreat).toBe(true);
    expect(tagsFor(getMoveById("TICKER TAKER", "tt_drain_steal")!).drain).toBe(true);
    expect(tagsFor(getMoveById("MR MARKETER", "mm_raid")!).summon).toBe(true);
    expect(tagsFor(getMoveById("TICKER TAKER", "tt_jab")!).fast).toBe(true);
  });
});

describe("tactical bias", () => {
  it("returns a finite, clamped weight for every move of every boss", () => {
    const reads = [
      read(), read({ dist: 400 }), read({ airborne: true, vertGap: 120 }),
      read({ attacking: true }), read({ recovering: true }),
      read({ passive: true, dist: 300 }), read({ energyFrac: 1, phase: 3 }),
    ];
    for (const n of ORDER) {
      for (const r of reads) {
        const bias = computeBossBias(n, r);
        for (const m of getMoveSet(n)) {
          const w = bias[m.id];
          expect(Number.isFinite(w), `${n}/${m.id}`).toBe(true);
          expect(w).toBeGreaterThan(0);
          expect(w).toBeLessThanOrEqual(3.2);
        }
      }
    }
  });

  it("favours fast punishers while the player is recovering", () => {
    const base = computeBossBias("TICKER TAKER", read());
    const punish = computeBossBias("TICKER TAKER", read({ recovering: true }));
    expect(punish.tt_jab).toBeGreaterThan(base.tt_jab);
  });

  it("favours anti-air / ranged options against an airborne player", () => {
    const air = computeBossBias("TICKER TAKER", read({ airborne: true, vertGap: 110 }));
    expect(air.tt_drain_steal).toBeGreaterThan(air.tt_jab);
  });

  it("closes the gap on a passive, distant player", () => {
    const camp = computeBossBias("RUGGER", read({ dist: 320, passive: true }));
    expect(camp.rug_dash).toBeGreaterThan(1);
    expect(camp.rug_slip).toBeLessThan(1);
  });

  it("steals more eagerly when the player is charged up", () => {
    const empty = computeBossBias("TICKER TAKER", read({ energyFrac: 0 }));
    const full = computeBossBias("TICKER TAKER", read({ energyFrac: 1 }));
    expect(full.tt_drain_steal).toBeGreaterThan(empty.tt_drain_steal);
  });

  it("JEET reacts far less strongly than TICKER TAKER to the same read", () => {
    const r = read({ recovering: true, dist: 300, passive: true });
    const jeet = computeBossBias("JEET", r);
    const tt = computeBossBias("TICKER TAKER", r);
    const spread = (b: Record<string, number>) => {
      const v = Object.values(b);
      return Math.max(...v) - Math.min(...v);
    };
    expect(spread(jeet)).toBeLessThan(spread(tt));
  });
});

describe("cooldowns", () => {
  const move = getMoveById("TICKER TAKER", "tt_jab")!;

  it("always stays inside the safe band", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        for (const phase of [1, 2, 3]) {
          for (const d of [1, 0.85, 0.6]) {
            const cd = bossCooldownFrames(n, m, phase, d, false);
            expect(cd).toBeGreaterThanOrEqual(MIN_BOSS_COOLDOWN);
            expect(cd).toBeLessThanOrEqual(MAX_BOSS_COOLDOWN);
            expect(Number.isInteger(cd)).toBe(true);
          }
        }
      }
    }
  });

  it("never returns a non-finite or zero cooldown from bad input", () => {
    expect(bossCooldownFrames("JEET", move, NaN, NaN, false)).toBeGreaterThanOrEqual(MIN_BOSS_COOLDOWN);
    expect(bossCooldownFrames("JEET", move, 0, 0, false)).toBeGreaterThanOrEqual(MIN_BOSS_COOLDOWN);
    expect(bossCooldownFrames(undefined, move, 9, -5, true)).toBeGreaterThanOrEqual(MIN_BOSS_COOLDOWN);
  });

  it("shortens with each phase", () => {
    const p1 = bossCooldownFrames("TICKER TAKER", move, 1, 1, false);
    const p2 = bossCooldownFrames("TICKER TAKER", move, 2, 1, false);
    const p3 = bossCooldownFrames("TICKER TAKER", move, 3, 1, false);
    expect(p2).toBeLessThan(p1);
    expect(p3).toBeLessThan(p2);
  });

  it("applies extra pressure to a passive player", () => {
    const calm = bossCooldownFrames("MR MARKETER", move, 1, 1, false);
    const pressured = bossCooldownFrames("MR MARKETER", move, 1, 1, true);
    expect(pressured).toBeLessThan(calm);
  });

  it("keeps every boss committed — no instant re-attacks", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        expect(bossCooldownFrames(n, m, 3, 0.6, true), `${n}/${m.id}`)
          .toBeGreaterThanOrEqual(MIN_BOSS_COOLDOWN);
      }
    }
  });
});

describe("chaining is always bounded", () => {
  it("caps chain length for every boss and phase", () => {
    for (const n of ORDER) {
      for (const phase of [1, 2, 3]) {
        const cap = chainCapFor(n, phase);
        expect(cap).toBeGreaterThanOrEqual(1);
        expect(cap).toBeLessThanOrEqual(ABSOLUTE_CHAIN_CAP);
      }
    }
  });

  it("returns zero chance once the cap is reached — no infinite combos", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        for (const phase of [1, 2, 3]) {
          const cap = chainCapFor(n, phase);
          expect(chainChanceFor(n, m, phase, cap)).toBe(0);
          expect(chainChanceFor(n, m, phase, cap + 5)).toBe(0);
        }
      }
    }
  });

  it("each additional link is less likely than the previous one", () => {
    const m = getMoveById("TICKER TAKER", "tt_jab")!;
    const a = chainChanceFor("TICKER TAKER", m, 3, 0);
    const b = chainChanceFor("TICKER TAKER", m, 3, 1);
    expect(b).toBeLessThan(a);
    expect(b).toBeGreaterThan(0);
  });

  it("never exceeds a fair 0.8 probability", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        expect(chainChanceFor(n, m, 3, 0)).toBeLessThanOrEqual(0.8);
      }
    }
  });

  it("TICKER TAKER chains hardest of the roster", () => {
    const tt = chainCapFor("TICKER TAKER", 3);
    expect(tt).toBeGreaterThanOrEqual(chainCapFor("JEET", 3));
    expect(getBossProfile("TICKER TAKER").chainBonus)
      .toBeGreaterThan(getBossProfile("JEET").chainBonus);
  });
});

describe("fairness — every dangerous move keeps counterplay", () => {
  it("every damaging move has startup before its first hit frame", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        for (const f of m.hitFrames) {
          // hitFrames are stateTimer countdown values: f < duration means
          // frames elapse (startup) before the hit is tested.
          expect(f, `${n}/${m.id}`).toBeLessThan(m.duration);
          expect(f, `${n}/${m.id}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("the biggest hitters all telegraph", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        if (m.damage >= 8) {
          expect(tagsFor(m).heavy, `${n}/${m.id} must telegraph`).toBe(true);
        }
      }
    }
  });

  it("mid-weight hitters still give the player reaction time", () => {
    for (const n of ORDER) {
      for (const m of getMoveSet(n)) {
        if (m.damage >= 6 && m.hitFrames.length) {
          const startup = m.duration - Math.max(...m.hitFrames);
          expect(startup, `${n}/${m.id} startup`).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });

});
