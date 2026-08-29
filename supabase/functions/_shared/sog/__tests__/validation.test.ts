import { describe, expect, it } from "vitest";
import { validateRun } from "../validation.ts";
import { normalizeAddress, resolveContractConfig } from "../config.ts";

const good = { score: 50_000, wave: 10, level: 2, durationMs: 300_000, difficulty: 1 };

describe("run validation", () => {
  it("accepts a plausible run", () => {
    const r = validateRun(good);
    expect(r.ok).toBe(true);
  });

  it("rejects non-objects and missing fields", () => {
    for (const bad of [null, undefined, 5, "run", {}, { score: 1 }]) {
      expect(validateRun(bad).ok).toBe(false);
    }
  });

  it("rejects non-integer, negative and NaN values", () => {
    expect(validateRun({ ...good, score: 1.5 }).ok).toBe(false);
    expect(validateRun({ ...good, wave: -1 }).ok).toBe(false);
    expect(validateRun({ ...good, level: Number.NaN }).ok).toBe(false);
    expect(validateRun({ ...good, durationMs: Infinity }).ok).toBe(false);
  });

  it("rejects absurd values", () => {
    expect(validateRun({ ...good, score: 99_999_999 }).ok).toBe(false);
    expect(validateRun({ ...good, wave: 9_999 }).ok).toBe(false);
    expect(validateRun({ ...good, level: 999 }).ok).toBe(false);
  });

  it("rejects impossibly fast runs", () => {
    expect(validateRun({ ...good, wave: 30, durationMs: 5_000 }).ok).toBe(false);
  });

  it("rejects impossible score-per-wave", () => {
    expect(validateRun({ ...good, wave: 3, score: 1_000_000, durationMs: 300_000 }).ok).toBe(false);
  });

  it("ignores client-supplied reward/nonce/deadline/signer fields entirely", () => {
    const r = validateRun({
      ...good,
      rewardAmount: "999999999999999999999",
      nonce: 42,
      deadline: 99999999999,
      signer: "0x000000000000000000000000000000000000dead",
      chainId: 1,
      contractAddress: "0x000000000000000000000000000000000000beef",
      runId: "0x" + "11".repeat(32),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.run).sort()).toEqual(
        ["difficulty", "durationMs", "level", "score", "wave"],
      );
    }
  });
});

describe("server configuration", () => {
  it("fails closed when the contract address is not configured", () => {
    const r = resolveContractConfig({});
    expect(r.ok).toBe(false);
    expect(r.contractAddress).toBeUndefined();
  });

  it("normalizes a configured contract address", () => {
    const r = resolveContractConfig({
      SOG_REWARDS_CONTRACT_ADDRESS: "0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE",
    });
    expect(r.ok).toBe(true);
    expect(r.contractAddress).toBe("0xf6bdb158a5ddf77f1b83bc9074f6a472c58d78ae");
  });

  it("rejects a malformed expected signer", () => {
    expect(
      resolveContractConfig({
        SOG_REWARDS_CONTRACT_ADDRESS: "0x" + "11".repeat(20),
        SOG_EXPECTED_SIGNER_ADDRESS: "not-an-address",
      }).ok,
    ).toBe(false);
  });

  it("normalizes addresses safely", () => {
    expect(normalizeAddress("0x" + "AB".repeat(20))).toBe("0x" + "ab".repeat(20));
    expect(normalizeAddress("0x123")).toBeNull();
    expect(normalizeAddress(null)).toBeNull();
  });
});
