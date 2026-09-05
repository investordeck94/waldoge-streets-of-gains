/**
 * Weekly Hard Mode competition client.
 *
 * This is a thin read/record layer on top of the EXISTING DogeOS reward
 * infrastructure:
 *  - wallet ownership is proven by the existing `authenticateWallet` session
 *    flow in rewardsApi.ts (unchanged),
 *  - recording a completed run does NOT authorize or transfer any WDOGE,
 *  - the 10 WDOGE weekly prize is settled later through the existing
 *    attestation flow for the verified winner only.
 */
import { supabase } from "@/integrations/supabase/client";
import { normalizeAddress } from "@/lib/dogeos/playerIdentity";
import { authenticateWallet, type RunResult } from "@/lib/dogeos/rewardsApi";

/** Difficulty index used by StreetBrawler for FULL TRENCH MODE (Hard). */
export const HARD_MODE_DIFFICULTY = 2;
export const WEEKLY_PRIZE_WDOGE = 10;

export interface WeekWindow {
  weekStart: string;
  startsAt: string;
  endsAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  /** Masked for everyone except the requesting wallet. */
  wallet: string;
  isYou?: boolean;
  score: number;
  wave: number;
  level: number;
  verifiedAt: string;
}

export interface WeeklyLeaderboard {
  week: WeekWindow;
  ended: boolean;
  prizeWdoge: number;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  topScore: number | null;
  player: { wallet: string; bestScore: number; rank: number; isLeading: boolean } | null;
  winner: { wallet: string; score: number; verifiedAt: string } | null;
}

export interface ServerRunStart {
  runId: string;
  difficulty: number;
  startedAtMs: number;
  expiresAt: string;
}

export interface RecordedRun {
  qualified: boolean;
  week: WeekWindow;
  score: number;
  rank: number | null;
  topScore: number | null;
}

async function call<T>(
  name: string,
  body: Record<string, unknown>,
  sessionToken?: string,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: sessionToken ? { "x-sog-session": sessionToken } : undefined,
  });
  if (error) {
    const detail = (data as { error?: string } | null)?.error ?? error.message ?? "request failed";
    throw new Error(detail);
  }
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) throw new Error(payload?.error ?? "request failed");
  return payload as T;
}

/**
 * Open a server-authoritative run before play begins (audit H-1).
 *
 * The backend issues the run id, records the wallet and difficulty and stamps
 * the start time with its own clock. Without this, a completed run can no
 * longer be recorded at all.
 */
export async function startServerRun(
  address: string,
  difficulty: number,
): Promise<ServerRunStart> {
  const wallet = normalizeAddress(address);
  if (!wallet) throw new Error("invalid wallet address");
  const token = await authenticateWallet(wallet);
  return await call<ServerRunStart>("sog-run-start", { difficulty }, token);
}

/** Record a completed Hard Mode run as a qualifying weekly result. */
export async function recordQualifyingRun(
  address: string,
  run: RunResult,
): Promise<RecordedRun> {
  const wallet = normalizeAddress(address);
  if (!wallet) throw new Error("invalid wallet address");
  if (run.difficulty !== HARD_MODE_DIFFICULTY) {
    throw new Error("only hard mode runs qualify");
  }
  if (!run.runId) throw new Error("run was not started on the server");
  const token = await authenticateWallet(wallet);
  return await call<RecordedRun>(
    "sog-record-run",
    {
      wallet,
      runId: run.runId,
      score: run.score,
      wave: run.wave,
      level: run.level,
      durationMs: run.durationMs,
      difficulty: run.difficulty,
      startedAt: run.startedAt,
    },
    token,
  );
}

/** Read the current (or a given) weekly competition standings. */
export async function fetchWeeklyLeaderboard(
  address?: string | null,
  weekStart?: string,
): Promise<WeeklyLeaderboard> {
  const wallet = address ? normalizeAddress(address) : null;
  return await call<WeeklyLeaderboard>("sog-weekly-leaderboard", {
    ...(wallet ? { wallet } : {}),
    ...(weekStart ? { weekStart } : {}),
  });
}
