/**
 * EIP-712 attestation tests.
 *
 * These verify that the backend's domain + type definitions produce a
 * signature that recovers to the configured signer, and that tampering with
 * ANY field invalidates it. `viem` is used here as a local, test-only signer —
 * no deployment and no real key are involved (the key below is a well-known
 * Anvil test key with zero value on any network).
 */
import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress, hashTypedData } from "viem";
import {
  buildAttestation,
  computeDeadline,
  deriveLogicalRunKey,
  eip712Domain,
  generateRunId,
  RUN_ATTESTATION_TYPES,
  serializeAttestation,
} from "../attestation.ts";
import { ATTESTATION_TTL_SECONDS, DOGEOS_CHAIN_ID } from "../config.ts";

// Publicly known Anvil account #0 — test-only, holds nothing anywhere.
const TEST_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const account = privateKeyToAccount(TEST_KEY);
const VERIFYING_CONTRACT = "0x1111111111111111111111111111111111111111";

const attestation = buildAttestation({
  player: "0x2222222222222222222222222222222222222222",
  score: 123_456,
  wave: 12,
  level: 3,
  runId: "0x" + "ab".repeat(32),
  nonce: 7n,
  deadline: 1_900_000_000n,
  rewardAmount: 2_200_000_000_000_000_000n,
});

const typedData = {
  domain: eip712Domain(VERIFYING_CONTRACT),
  types: RUN_ATTESTATION_TYPES,
  primaryType: "RunAttestation",
  message: attestation,
} as const;

describe("EIP-712 domain + struct", () => {
  it("matches the Solidity domain exactly", () => {
    const d = eip712Domain(VERIFYING_CONTRACT);
    expect(d.name).toBe("StreetsOfGainsRewards");
    expect(d.version).toBe("1");
    expect(d.chainId).toBe(6281971);
    expect(DOGEOS_CHAIN_ID).toBe(6281971);
    expect(d.verifyingContract).toBe(VERIFYING_CONTRACT);
  });

  it("declares the exact Solidity field order and types", () => {
    expect(RUN_ATTESTATION_TYPES.RunAttestation.map((f) => `${f.type} ${f.name}`)).toEqual([
      "address player",
      "uint256 score",
      "uint32 wave",
      "uint16 level",
      "bytes32 runId",
      "uint256 nonce",
      "uint256 deadline",
      "uint256 rewardAmount",
    ]);
  });

  it("encodes the same typehash string as the contract", () => {
    // Re-deriving the struct signature from the type list must equal the
    // string hard-coded in RUN_ATTESTATION_TYPEHASH in the Solidity source.
    const sig = `RunAttestation(${
      RUN_ATTESTATION_TYPES.RunAttestation.map((f) => `${f.type} ${f.name}`).join(",")
    })`;
    expect(sig).toBe(
      "RunAttestation(address player,uint256 score,uint32 wave,uint16 level,bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)",
    );
  });
});

describe("signature recovery", () => {
  it("recovers to the signing account", async () => {
    const signature = await account.signTypedData(typedData as never);
    const recovered = await recoverTypedDataAddress({ ...(typedData as never), signature });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("is invalidated by tampering with ANY field", async () => {
    const signature = await account.signTypedData(typedData as never);
    const mutations: Array<Record<string, unknown>> = [
      { player: "0x3333333333333333333333333333333333333333" },
      { score: 123_457n },
      { wave: 13 },
      { level: 4 },
      { runId: "0x" + "cd".repeat(32) },
      { nonce: 8n },
      { deadline: 1_900_000_001n },
      { rewardAmount: 10_000_000_000_000_000_000n },
    ];
    for (const mutation of mutations) {
      const recovered = await recoverTypedDataAddress({
        ...(typedData as never),
        message: { ...attestation, ...mutation },
        signature,
      });
      expect(recovered.toLowerCase()).not.toBe(account.address.toLowerCase());
    }
  });

  it("is bound to the chain id and verifying contract", async () => {
    const signature = await account.signTypedData(typedData as never);
    const otherChain = await recoverTypedDataAddress({
      ...(typedData as never),
      domain: { ...eip712Domain(VERIFYING_CONTRACT), chainId: 1 },
      signature,
    });
    const otherContract = await recoverTypedDataAddress({
      ...(typedData as never),
      domain: eip712Domain("0x9999999999999999999999999999999999999999"),
      signature,
    });
    expect(otherChain.toLowerCase()).not.toBe(account.address.toLowerCase());
    expect(otherContract.toLowerCase()).not.toBe(account.address.toLowerCase());
  });

  it("never exposes key material in the serialized payload", () => {
    const payload = JSON.stringify(serializeAttestation(attestation));
    expect(payload).not.toContain(TEST_KEY);
    expect(payload).not.toContain(TEST_KEY.slice(2));
    expect(payload).not.toMatch(/private/i);
    expect(hashTypedData(typedData as never)).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("run identifiers and deadline", () => {
  it("generates unique 32-byte run ids", () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateRunId()));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("derives a stable logical run key from the run itself", async () => {
    const run = { score: 1000, wave: 5, level: 1, durationMs: 60_000, difficulty: 2, startedAt: 1_756_000_000_000 };
    const a = await deriveLogicalRunKey("0xAbC0000000000000000000000000000000000001", run);
    const b = await deriveLogicalRunKey("0xabc0000000000000000000000000000000000001", run);
    const c = await deriveLogicalRunKey("0xabc0000000000000000000000000000000000001", {
      ...run,
      startedAt: run.startedAt + 1,
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("produces a short, server-generated deadline", () => {
    const now = 1_800_000_000;
    expect(computeDeadline(now)).toBe(BigInt(now + ATTESTATION_TTL_SECONDS));
    expect(ATTESTATION_TTL_SECONDS).toBeLessThanOrEqual(900);
  });
});
