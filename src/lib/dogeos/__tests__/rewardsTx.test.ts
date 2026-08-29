import { describe, expect, it } from "vitest";
import { encodeFunctionData, toFunctionSelector } from "viem";
import { encodeSubmitRun, SUBMIT_RUN_SELECTOR } from "../rewardsTx";

const ABI = [
  {
    type: "function",
    name: "submitRun",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "a",
        type: "tuple",
        components: [
          { name: "player", type: "address" },
          { name: "score", type: "uint256" },
          { name: "wave", type: "uint32" },
          { name: "level", type: "uint16" },
          { name: "runId", type: "bytes32" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "rewardAmount", type: "uint256" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const attestation = {
  player: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  score: "88000",
  wave: 14,
  level: 4,
  runId: "0x" + "7a".repeat(32),
  nonce: "0",
  deadline: "4000000000",
  rewardAmount: "3400000000000000000",
};

const signature = "0x" + "ab".repeat(65);

describe("submitRun calldata encoder", () => {
  it("uses the correct function selector", () => {
    expect(SUBMIT_RUN_SELECTOR).toBe(
      toFunctionSelector(
        "submitRun((address,uint256,uint32,uint16,bytes32,uint256,uint256,uint256),bytes)",
      ),
    );
  });

  it("produces byte-identical calldata to a reference ABI encoder", () => {
    const reference = encodeFunctionData({
      abi: ABI,
      functionName: "submitRun",
      args: [
        {
          player: attestation.player as `0x${string}`,
          score: BigInt(attestation.score),
          wave: attestation.wave,
          level: attestation.level,
          runId: attestation.runId as `0x${string}`,
          nonce: BigInt(attestation.nonce),
          deadline: BigInt(attestation.deadline),
          rewardAmount: BigInt(attestation.rewardAmount),
        },
        signature as `0x${string}`,
      ],
    });
    expect(encodeSubmitRun(attestation, signature)).toBe(reference);
  });

  it("rejects malformed inputs instead of encoding junk", () => {
    expect(() => encodeSubmitRun({ ...attestation, player: "0x123" }, signature)).toThrow();
    expect(() => encodeSubmitRun({ ...attestation, runId: "0xdead" }, signature)).toThrow();
    expect(() => encodeSubmitRun(attestation, "0xabc")).toThrow();
  });
});
