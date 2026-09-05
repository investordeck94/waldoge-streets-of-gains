/**
 * H-2 remediation tests: duplicate/replay protection must depend on the
 * identity of the completed run, never on the server's submission time.
 */
import { describe, expect, it } from "vitest";
import { deriveLogicalRunKey } from "../attestation.ts";
import { validateRun } from "../validation.ts";

const WALLET_A = "0xaaaa000000000000000000000000000000000001";
const WALLET_B = "0xbbbb000000000000000000000000000000000002";

const run = {
  score: 50_000,
  wave: 10,
  level: 2,
  durationMs: 300_000,
  difficulty: 2,
  startedAt: 1_756_000_000_000,
};

/** Minimal stand-in for the (wallet, client_run_key) unique index. */
class RunStore {
  private keys = new Set<string>();
  insert(wallet: string, key: string): boolean {
    const composite = `${wallet}|${key}`;
    if (this.keys.has(composite)) return false; // unique violation
    this.keys.add(composite);
    return true;
  }
}

describe("intrinsic run identity", () => {
  it("rejects the same completed run submitted twice", async () => {
    const store = new RunStore();
    const key = await deriveLogicalRunKey(WALLET_A, run);
    expect(store.insert(WALLET_A, key)).toBe(true);
    expect(store.insert(WALLET_A, await deriveLogicalRunKey(WALLET_A, run))).toBe(false);
  });

  it("still rejects a replay long after any minute bucket would have expired", async () => {
    const store = new RunStore();
    const now = Date.now;
    Date.now = () => 1_756_000_400_000;
    const first = await deriveLogicalRunKey(WALLET_A, run);
    Date.now = () => 1_756_000_400_000 + 3 * 24 * 3600 * 1000; // 3 days later
    const later = await deriveLogicalRunKey(WALLET_A, run);
    Date.now = now;
    expect(later).toBe(first);
    expect(store.insert(WALLET_A, first)).toBe(true);
    expect(store.insert(WALLET_A, later)).toBe(false);
  });

  it("does not let wallet B reuse wallet A's run identity", async () => {
    const a = await deriveLogicalRunKey(WALLET_A, run);
    const b = await deriveLogicalRunKey(WALLET_B, run);
    expect(a).not.toBe(b);
    const store = new RunStore();
    expect(store.insert(WALLET_A, a)).toBe(true);
    // Even the literal key is namespaced by wallet in the unique index.
    expect(store.insert(WALLET_B, a)).toBe(true);
    expect(store.insert(WALLET_A, a)).toBe(false);
  });

  it("treats genuinely different runs as distinct", async () => {
    const base = await deriveLogicalRunKey(WALLET_A, run);
    const variants = [
      { ...run, startedAt: run.startedAt + 1 },
      { ...run, score: run.score + 1 },
      { ...run, wave: run.wave + 1 },
      { ...run, level: run.level + 1 },
      { ...run, durationMs: run.durationMs + 1 },
      { ...run, difficulty: 1 },
    ];
    const keys = new Set<string>([base]);
    for (const v of variants) keys.add(await deriveLogicalRunKey(WALLET_A, v));
    expect(keys.size).toBe(variants.length + 1);
  });

  it("lets only one concurrent duplicate submission create a record", async () => {
    const store = new RunStore();
    const results = await Promise.all(
      Array.from({ length: 8 }, async () =>
        store.insert(WALLET_A, await deriveLogicalRunKey(WALLET_A, run)),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("is stable and 32 bytes of hex", async () => {
    expect(await deriveLogicalRunKey(WALLET_A.toUpperCase(), run)).toMatch(/^0x[0-9a-f]{64}$/);
    expect(await deriveLogicalRunKey(WALLET_A.toUpperCase(), run)).toBe(
      await deriveLogicalRunKey(WALLET_A, run),
    );
  });
});

describe("validation of the run identity input", () => {
  it("requires startedAt and returns it", () => {
    const ok = validateRun(run);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.run.startedAt).toBe(run.startedAt);
    const { startedAt: _omit, ...withoutStart } = run;
    expect(validateRun(withoutStart).ok).toBe(false);
  });

  it("rejects implausible or far-future start times", () => {
    expect(validateRun({ ...run, startedAt: 1 }).ok).toBe(false);
    expect(validateRun({ ...run, startedAt: Date.now() + 3_600_000 }).ok).toBe(false);
    expect(validateRun({ ...run, startedAt: 1.5 }).ok).toBe(false);
  });
});
