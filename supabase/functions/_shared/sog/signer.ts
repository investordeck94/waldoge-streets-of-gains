/**
 * Server-only EIP-712 signing + on-chain reads. DENO RUNTIME ONLY.
 *
 * SECURITY:
 *  - SOG_SIGNER_PRIVATE_KEY exists only in edge-function secrets. It is never
 *    logged, returned, echoed in errors, or shipped to the browser.
 *  - The derived signer address is compared with SOG_EXPECTED_SIGNER_ADDRESS
 *    when that is configured; a mismatch FAILS CLOSED (never signs anyway).
 *  - Nonces are ALWAYS read fresh from the chain immediately before signing.
 *    The backend keeps no local nonce counter and never trusts a client nonce.
 */
import { createPublicClient, http, verifyMessage } from "npm:viem@2.21.55";
import { privateKeyToAccount } from "npm:viem@2.21.55/accounts";
import {
  DOGEOS_CHAIN_ID,
  DOGEOS_RPC_URL,
  normalizeAddress,
} from "./config.ts";
import {
  eip712Domain,
  RUN_ATTESTATION_PRIMARY_TYPE,
  RUN_ATTESTATION_TYPES,
  type RunAttestation,
} from "./attestation.ts";
import type { EpochConfig } from "./epoch.ts";

const PRIVATE_KEY_RE = /^0x[0-9a-fA-F]{64}$/;

export interface SignerHandle {
  address: string;
  sign: (attestation: RunAttestation, verifyingContract: string) => Promise<string>;
}

export interface SignerResult {
  ok: boolean;
  signer?: SignerHandle;
  error?: string;
}

/** Load the signer from env. Returns a client-safe error string on failure. */
export function loadSigner(env: Record<string, string | undefined>): SignerResult {
  const raw = env.SOG_SIGNER_PRIVATE_KEY?.trim();
  if (!raw) return { ok: false, error: "signer configuration error" };
  if (!PRIVATE_KEY_RE.test(raw)) return { ok: false, error: "signer configuration error" };

  let account;
  try {
    account = privateKeyToAccount(raw as `0x${string}`);
  } catch {
    // Deliberately no detail: never surface anything derived from the key.
    return { ok: false, error: "signer configuration error" };
  }

  const derived = normalizeAddress(account.address);
  const expected = env.SOG_EXPECTED_SIGNER_ADDRESS
    ? normalizeAddress(env.SOG_EXPECTED_SIGNER_ADDRESS)
    : null;
  if (expected && derived !== expected) {
    // Fail closed — never silently sign with an unexpected key.
    return { ok: false, error: "signer configuration error" };
  }

  return {
    ok: true,
    signer: {
      address: derived!,
      sign: (attestation, verifyingContract) =>
        account.signTypedData({
          domain: eip712Domain(verifyingContract) as never,
          types: RUN_ATTESTATION_TYPES as never,
          primaryType: RUN_ATTESTATION_PRIMARY_TYPE,
          message: attestation as never,
        }),
    },
  };
}

const publicClient = createPublicClient({
  transport: http(DOGEOS_RPC_URL),
});

const NONCES_ABI = [
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Read `StreetsOfGainsRewards.nonces(player)` from DogeOS Chikyu.
 *
 * THE BACKEND MUST NOT MAINTAIN ITS OWN NONCE COUNTER. The contract enforces
 * strict equality (a.nonce == nonces[player]); the only correct source is a
 * fresh chain read taken right before each signature.
 */
export async function readOnChainNonce(
  contractAddress: string,
  player: string,
): Promise<bigint> {
  return (await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: NONCES_ABI,
    functionName: "nonces",
    args: [player as `0x${string}`],
  })) as bigint;
}

export const CHAIN_ID = DOGEOS_CHAIN_ID;

/** Verify a `personal_sign` wallet-ownership signature. */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string,
): Promise<boolean> {
  try {
    return await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

const EPOCH_ABI = [
  {
    type: "function",
    name: "epochGenesis",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "epochLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

let epochCache: { address: string; config: EpochConfig } | null = null;

/**
 * Read the contract's immutable epoch configuration (audit M-3).
 * Immutable on-chain, so it is safe to cache per contract address.
 */
export async function readEpochConfig(contractAddress: string): Promise<EpochConfig> {
  const key = contractAddress.toLowerCase();
  if (epochCache && epochCache.address === key) return epochCache.config;

  const [genesis, length] = (await Promise.all([
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: EPOCH_ABI,
      functionName: "epochGenesis",
    }),
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: EPOCH_ABI,
      functionName: "epochLength",
    }),
  ])) as [bigint, bigint];

  const config: EpochConfig = {
    genesisSeconds: Number(genesis),
    lengthSeconds: Number(length),
  };
  epochCache = { address: key, config };
  return config;
}
