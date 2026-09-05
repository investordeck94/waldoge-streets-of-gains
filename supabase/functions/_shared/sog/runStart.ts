/**
 * Server-authoritative run lifecycle (audit finding H-1 / H-2).
 *
 * WHAT THIS DOES:
 *   A run must be OPENED by the backend (`sog-run-start`) before it can be
 *   recorded as verified. The backend chooses the run id, records the wallet
 *   (taken from the authenticated session, never the body), the difficulty and
 *   the server start time. When the completed run arrives it is checked
 *   against that record and the start row is consumed exactly once.
 *
 * WHAT THIS DOES NOT DO:
 *   It does not prove the game was actually played. The browser is untrusted
 *   and the engine emits no verifiable transcript. What it removes is the
 *   ability to mint arbitrary runs out of nothing: every recorded run now costs
 *   a real, wallet-bound, single-use, server-timed session with a duration the
 *   attacker must actually wait out.
 *
 * Dependency-free on purpose (Deno + vitest).
 */
import { LIMITS } from "./validation.ts";

/** A started run must be completed within this window. */
export const RUN_START_TTL_SECONDS = 6 * 60 * 60; // 6h — matches maxDurationMs

/** Tolerated difference between client `startedAt` and the server start. */
export const START_TIME_TOLERANCE_MS = 2 * 60 * 1000;

/**
 * Tolerated difference between the client-reported duration and the real
 * server-measured elapsed time (covers pauses, clock skew, network latency).
 */
export const DURATION_TOLERANCE_MS = 3 * 60 * 1000;

/** Shortest wall-clock time in which a full victory run can be reached. */
export const MIN_VICTORY_DURATION_MS = 60_000;

/** Levels that must be completed for a run to count as a finished victory. */
export const REQUIRED_VICTORY_LEVEL = 6;

/** Run ids are 32 random bytes, hex encoded, produced by the backend only. */
export const RUN_ID_RE = /^0x[0-9a-f]{64}$/;

export interface RunStartRecord {
  run_id: string;
  wallet: string;
  difficulty: number;
  /** ISO timestamp — server clock at run start. */
  started_at: string;
  /** ISO timestamp — after this the start record is dead. */
  expires_at: string;
  consumed_at: string | null;
}

export interface CompletedRun {
  score: number;
  wave: number;
  level: number;
  durationMs: number;
  difficulty: number;
  startedAt: number;
}

export type RunStartCheck =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 403 | 409 | 422 };

export function isRunId(value: unknown): value is string {
  return typeof value === "string" && RUN_ID_RE.test(value.trim());
}

/**
 * Validate a completed run against its server-issued start record.
 *
 * Every check here is server-side. The wallet argument MUST come from the
 * authenticated session, never from the request body.
 */
export function validateRunAgainstStart(
  start: RunStartRecord | null,
  run: CompletedRun,
  wallet: string,
  now: number = Date.now(),
): RunStartCheck {
  if (!start) return { ok: false, error: "run was not started on the server", status: 422 };

  // Wallet binding — a run id belonging to wallet A is useless to wallet B.
  if (start.wallet.toLowerCase() !== wallet.toLowerCase()) {
    return { ok: false, error: "run does not belong to this wallet", status: 403 };
  }

  // Single use.
  if (start.consumed_at) return { ok: false, error: "duplicate run", status: 409 };

  const startedMs = new Date(start.started_at).getTime();
  const expiresMs = new Date(start.expires_at).getTime();
  if (!Number.isFinite(startedMs) || !Number.isFinite(expiresMs)) {
    return { ok: false, error: "invalid run", status: 400 };
  }
  if (now > expiresMs) return { ok: false, error: "run start expired", status: 422 };

  // Difficulty is fixed at run start and cannot be raised afterwards.
  if (run.difficulty !== start.difficulty) {
    return { ok: false, error: "difficulty does not match the started run", status: 422 };
  }

  // The client-reported start must agree with the server's record.
  if (Math.abs(run.startedAt - startedMs) > START_TIME_TOLERANCE_MS) {
    return { ok: false, error: "invalid game result", status: 422 };
  }

  // Duration must fit inside the real elapsed server time, and a full victory
  // cannot happen instantly.
  const elapsed = now - startedMs;
  if (run.durationMs > elapsed + DURATION_TOLERANCE_MS) {
    return { ok: false, error: "invalid game result", status: 422 };
  }
  if (run.durationMs < MIN_VICTORY_DURATION_MS || elapsed < MIN_VICTORY_DURATION_MS) {
    return { ok: false, error: "invalid game result", status: 422 };
  }

  // Completion requirements: a finished run must have cleared every level.
  if (run.level < REQUIRED_VICTORY_LEVEL || run.level > LIMITS.maxLevel) {
    return { ok: false, error: "invalid game result", status: 422 };
  }
  if (run.wave < 0 || run.wave > LIMITS.maxWave) {
    return { ok: false, error: "invalid game result", status: 422 };
  }

  return { ok: true };
}
