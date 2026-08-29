/**
 * Streets of Gains reward backend client — Phase 2D.
 *
 * Isolated from the game loop, rendering, physics, camera and collision.
 * Nothing here is imported by src/game/**.
 *
 * Trust model: the browser proves wallet ownership with a personal_sign
 * signature, then holds only an opaque session token. It never sees the signer
 * key, never chooses the reward, nonce, deadline, run id or contract address.
 */
import { supabase } from "@/integrations/supabase/client";
import { normalizeAddress } from "@/lib/dogeos/playerIdentity";
import { request } from "@/lib/dogeos/provider";
import { DOGEOS_CHAIN } from "@/lib/chains/dogeos";
import { encodeSubmitRun, type SerializedAttestation } from "@/lib/dogeos/rewardsTx";

const SESSION_STORAGE_KEY = "waldoge.streetsOfGains.dogeosSession.v1";

export interface RewardAuthorization {
  attestation: SerializedAttestation;
  signature: string;
  contractAddress: string;
  chainId: number;
  expiresInSeconds: number;
}

export interface RunResult {
  score: number;
  wave: number;
  level: number;
  durationMs: number;
  difficulty?: number;
}

interface StoredSession {
  wallet: string;
  token: string;
  expiresAt: number;
}

function readSession(wallet: string): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.wallet !== wallet) return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed.token;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* session stays in-memory for this call only */
  }
}

export function clearRewardSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
  sessionToken?: string,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: sessionToken ? { "x-sog-session": sessionToken } : undefined,
  });
  if (error) {
    const detail =
      (data as { error?: string } | null)?.error ?? error.message ?? "request failed";
    throw new Error(detail);
  }
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) throw new Error(payload?.error ?? "request failed");
  return payload as T;
}

/**
 * Prove wallet ownership (challenge -> personal_sign -> session).
 * Reuses the existing Phase 1A EIP-1193 provider — no second wallet stack.
 */
export async function authenticateWallet(address: string): Promise<string> {
  const wallet = normalizeAddress(address);
  if (!wallet) throw new Error("invalid wallet address");

  const cached = readSession(wallet);
  if (cached) return cached;

  const challenge = await callFunction<{ message: string; nonce: string }>(
    "sog-auth-challenge",
    { wallet },
  );

  const signature = (await request<string>("personal_sign", [challenge.message, wallet])) as string;

  const verified = await callFunction<{ session: string; expiresAt: string }>("sog-auth-verify", {
    wallet,
    nonce: challenge.nonce,
    signature,
  });

  writeSession({
    wallet,
    token: verified.session,
    expiresAt: new Date(verified.expiresAt).getTime(),
  });
  return verified.session;
}

/** Ask the backend to validate a finished run and authorize a reward. */
export async function requestRewardAuthorization(
  address: string,
  run: RunResult,
): Promise<RewardAuthorization> {
  const wallet = normalizeAddress(address);
  if (!wallet) throw new Error("invalid wallet address");
  const token = await authenticateWallet(wallet);

  const result = await callFunction<RewardAuthorization & { ok: boolean }>(
    "sog-submit-run",
    {
      wallet,
      score: run.score,
      wave: run.wave,
      level: run.level,
      durationMs: run.durationMs,
      difficulty: run.difficulty ?? 0,
    },
    token,
  );

  if (result.chainId !== DOGEOS_CHAIN.chainId) {
    throw new Error("unexpected chain in authorization");
  }
  if (result.attestation.player.toLowerCase() !== wallet) {
    throw new Error("wallet mismatch");
  }
  return result;
}

/**
 * Ask the connected wallet to broadcast submitRun(). The player's wallet is
 * always msg.sender — the app never submits on behalf of another player.
 */
export async function submitRunTransaction(
  address: string,
  authorization: RewardAuthorization,
): Promise<string> {
  const wallet = normalizeAddress(address);
  if (!wallet) throw new Error("invalid wallet address");
  if (authorization.attestation.player.toLowerCase() !== wallet) {
    throw new Error("wallet mismatch");
  }

  const data = encodeSubmitRun(authorization.attestation, authorization.signature);
  return (await request<string>("eth_sendTransaction", [
    { from: wallet, to: authorization.contractAddress, data },
  ])) as string;
}

/** Report the broadcast tx hash. This is NOT an on-chain confirmation. */
export async function reportSubmittedTx(
  address: string,
  runId: string,
  txHash: string,
): Promise<void> {
  const wallet = normalizeAddress(address);
  if (!wallet) return;
  const token = readSession(wallet);
  if (!token) return;
  await callFunction("sog-run-status", { runId, status: "submitted", txHash }, token);
}
