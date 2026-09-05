/**
 * Tests for the audit remediation modules:
 *  H-1 run lifecycle, M-1 weekly settlement, M-3 epoch alignment,
 *  M-4 SIWE origin binding.
 */
import { describe, expect, it } from "vitest";
import {
  MIN_VICTORY_DURATION_MS,
  REQUIRED_VICTORY_LEVEL,
  validateRunAgainstStart,
  type RunStartRecord,
} from "../runStart.ts";
import { resolveWeeklyWinner } from "../settlement.ts";
import { epochBounds, epochIndex, epochKey, sameEpoch } from "../epoch.ts";
import { resolveChallengeDomain, resolveOriginPolicy } from "../origins.ts";
import { weekWindow, WEEKLY_PRIZE_WEI } from "../weekly.ts";

const WALLET = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const NOW = 1_800_000_000_000;

function start(overrides: Partial<RunStartRecord> = {}): RunStartRecord {
  const startedMs = NOW - 10 * 60_000;
  return {
    run_id: "0x" + "ab".repeat(32),
    wallet: WALLET,
    difficulty: 2,
    started_at: new Date(startedMs).toISOString(),
    expires_at: new Date(startedMs + 6 * 3_600_000).toISOString(),
    consumed_at: null,
    ...overrides,
  };
}

function run(overrides: Record<string, number> = {}) {
  return {
    score: 40_000,
    wave: 12,
    level: REQUIRED_VICTORY_LEVEL,
    durationMs: 9 * 60_000,
    difficulty: 2,
    startedAt: NOW - 10 * 60_000,
    ...overrides,
  };
}

describe("H-1 server-authoritative run lifecycle", () => {
  it("accepts a run that matches its server-issued start", () => {
    expect(validateRunAgainstStart(start(), run(), WALLET, NOW)).toEqual({ ok: true });
  });

  it("rejects a run with no start record (fabricated run)", () => {
    const r = validateRunAgainstStart(null, run(), WALLET, NOW);
    expect(r.ok).toBe(false);
  });

  it("rejects a run id belonging to another wallet", () => {
    const r = validateRunAgainstStart(start({ wallet: OTHER }), run(), WALLET, NOW);
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects a start record that was already consumed", () => {
    const r = validateRunAgainstStart(
      start({ consumed_at: new Date(NOW).toISOString() }),
      run(),
      WALLET,
      NOW,
    );
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  it("rejects an expired start record", () => {
    const r = validateRunAgainstStart(start(), run(), WALLET, NOW + 7 * 3_600_000);
    expect(r.ok).toBe(false);
  });

  it("rejects a difficulty upgrade after the run started", () => {
    const r = validateRunAgainstStart(start({ difficulty: 0 }), run(), WALLET, NOW);
    expect(r.ok).toBe(false);
  });

  it("rejects a duration longer than the real elapsed server time", () => {
    const r = validateRunAgainstStart(start(), run({ durationMs: 5 * 3_600_000 }), WALLET, NOW);
    expect(r.ok).toBe(false);
  });

  it("rejects an impossibly fast victory", () => {
    const startedMs = NOW - 5_000;
    const s = start({
      started_at: new Date(startedMs).toISOString(),
      expires_at: new Date(startedMs + 3_600_000).toISOString(),
    });
    const r = validateRunAgainstStart(
      s,
      run({ startedAt: startedMs, durationMs: MIN_VICTORY_DURATION_MS - 1 }),
      WALLET,
      NOW,
    );
    expect(r.ok).toBe(false);
  });

  it("rejects an unfinished run submitted as a victory", () => {
    const r = validateRunAgainstStart(start(), run({ level: 2 }), WALLET, NOW);
    expect(r.ok).toBe(false);
  });
});

describe("M-1 weekly settlement", () => {
  const closed = weekWindow(new Date("2026-01-05T00:00:00.000Z"));
  const after = new Date("2026-01-15T00:00:00.000Z");

  it("refuses to settle a week that has not ended", () => {
    const r = resolveWeeklyWinner(
      closed,
      [{ wallet: WALLET, score: 10, verified_at: "2026-01-06T00:00:00.000Z" }],
      new Date("2026-01-07T00:00:00.000Z"),
    );
    expect(r).toMatchObject({ ok: false, status: 422 });
  });

  it("refuses to settle a week with no verified runs", () => {
    expect(resolveWeeklyWinner(closed, [], after)).toMatchObject({ ok: false, status: 422 });
  });

  it("selects the highest score and the fixed 10 WDOGE prize", () => {
    const r = resolveWeeklyWinner(
      closed,
      [
        { wallet: OTHER, score: 900, verified_at: "2026-01-06T00:00:00.000Z" },
        { wallet: WALLET, score: 1_500, verified_at: "2026-01-08T00:00:00.000Z" },
      ],
      after,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.winner.wallet).toBe(WALLET);
      expect(r.winner.prizeWei).toBe(WEEKLY_PRIZE_WEI);
    }
  });

  it("breaks ties on the earliest verified run", () => {
    const r = resolveWeeklyWinner(
      closed,
      [
        { wallet: WALLET, score: 1_000, verified_at: "2026-01-09T00:00:00.000Z" },
        { wallet: OTHER, score: 1_000, verified_at: "2026-01-06T00:00:00.000Z" },
      ],
      after,
    );
    expect(r.ok && r.winner.wallet).toBe(OTHER);
  });
});

describe("M-3 contract-aligned epochs", () => {
  const config = { genesisSeconds: 1_700_000_000, lengthSeconds: 86_400 };

  it("indexes from the contract genesis, not the UTC day", () => {
    expect(epochIndex(config, config.genesisSeconds)).toBe(0);
    expect(epochIndex(config, config.genesisSeconds + 86_399)).toBe(0);
    expect(epochIndex(config, config.genesisSeconds + 86_400)).toBe(1);
  });

  it("never returns a negative index before genesis", () => {
    expect(epochIndex(config, config.genesisSeconds - 10_000)).toBe(0);
  });

  it("produces contiguous bounds and a distinguishable key", () => {
    const a = epochBounds(config, 3);
    expect(a.end - a.start).toBe(86_400);
    expect(epochBounds(config, 4).start).toBe(a.end);
    expect(epochKey(config, config.genesisSeconds + 2 * 86_400)).toBe("e2");
  });

  it("detects timestamps straddling an epoch boundary", () => {
    const boundary = config.genesisSeconds + 86_400;
    expect(sameEpoch(config, boundary - 1, boundary)).toBe(false);
    expect(sameEpoch(config, boundary, boundary + 5)).toBe(true);
  });
});

describe("M-4 SIWE origin binding", () => {
  const policy = resolveOriginPolicy({});

  it("accepts the production origin", () => {
    const r = resolveChallengeDomain("https://waldogeai.lovable.app", policy);
    expect(r).toEqual({ ok: true, domain: "waldogeai.lovable.app" });
  });

  it("rejects an attacker-controlled origin", () => {
    expect(resolveChallengeDomain("https://evil.example", policy).ok).toBe(false);
  });

  it("rejects localhost unless explicitly enabled", () => {
    expect(resolveChallengeDomain("http://localhost:8080", policy).ok).toBe(false);
    const dev = resolveOriginPolicy({ SOG_ALLOW_LOCALHOST_ORIGIN: "1" });
    expect(resolveChallengeDomain("http://localhost:8080", dev).ok).toBe(true);
  });

  it("falls back to the canonical host when there is no Origin header", () => {
    expect(resolveChallengeDomain(null, policy)).toEqual({
      ok: true,
      domain: "waldogeai.lovable.app",
    });
  });
});
