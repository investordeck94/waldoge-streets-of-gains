/**
 * Run-submission validation.
 *
 * ANTI-CHEAT BOUNDARY — READ THIS BEFORE EXTENDING:
 * These checks do NOT prove that a player legitimately played the game. The
 * browser is untrusted and the current game engine emits no verifiable,
 * deterministic run transcript. What this module does is reject submissions
 * that are malformed or outside the plausible range configured below, so the
 * backend only authorizes rewards for runs that pass those rules.
 *
 * The contract verifies authorization integrity (that the backend signed this
 * exact attestation), NOT gameplay authenticity.
 *
 * Dependency-free on purpose: unit-tested with vitest, imported by Deno.
 */

export interface RunSubmission {
  score: number;
  wave: number;
  level: number;
  durationMs: number;
  difficulty?: number;
  startedAt?: number;
  endedAt?: number;
}

export interface ValidationOk {
  ok: true;
  run: Required<Pick<RunSubmission, "score" | "wave" | "level" | "durationMs">> & {
    difficulty: number;
    /** Client-reported run start (epoch ms) — the run's intrinsic identity. */
    startedAt: number;
  };
}
export interface ValidationFail {
  ok: false;
  error: string;
}
export type ValidationResult = ValidationOk | ValidationFail;

/** Hard structural bounds — anything outside these is not a real run. */
export const LIMITS = {
  maxScore: 5_000_000,
  maxWave: 200,
  maxLevel: 20,
  maxDurationMs: 6 * 60 * 60 * 1000, // 6h
  /** A wave cannot plausibly be cleared faster than this. */
  minMsPerWave: 4_000,
  /** Score cannot plausibly exceed this per wave. */
  maxScorePerWave: 25_000,
  maxDifficulty: 2,
  /** Earliest plausible run start (epoch ms) — sanity bound only. */
  minStartedAt: 1_600_000_000_000,
  /** Tolerated clock skew for a run start in the future. */
  maxStartedAtSkewMs: 10 * 60 * 1000,
} as const;

function intOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;
  return value;
}

/** Validate a raw, untrusted run payload from the browser. */
export function validateRun(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, error: "invalid run" };
  const raw = input as Record<string, unknown>;

  const score = intOrNull(raw.score);
  const wave = intOrNull(raw.wave);
  const level = intOrNull(raw.level);
  const durationMs = intOrNull(raw.durationMs);
  const difficulty = intOrNull(raw.difficulty) ?? 0;
  const startedAt = intOrNull(raw.startedAt);

  if (score === null || wave === null || level === null || durationMs === null) {
    return { ok: false, error: "invalid run" };
  }
  if (score < 0 || wave < 0 || level < 0 || durationMs < 0) {
    return { ok: false, error: "invalid game result" };
  }
  if (score > LIMITS.maxScore) return { ok: false, error: "invalid game result" };
  if (wave > LIMITS.maxWave) return { ok: false, error: "invalid game result" };
  if (level > LIMITS.maxLevel) return { ok: false, error: "invalid game result" };
  if (durationMs > LIMITS.maxDurationMs) return { ok: false, error: "invalid game result" };
  if (difficulty < 0 || difficulty > LIMITS.maxDifficulty) {
    return { ok: false, error: "invalid game result" };
  }

  // The run start timestamp is required: it is what makes the duplicate key
  // intrinsic to the completed run instead of the server submission time.
  if (startedAt === null) return { ok: false, error: "invalid run" };
  if (startedAt < LIMITS.minStartedAt) return { ok: false, error: "invalid game result" };
  if (startedAt > Date.now() + LIMITS.maxStartedAtSkewMs) {
    return { ok: false, error: "invalid game result" };
  }

  // Plausibility rules (heuristics, not proof).
  if (wave > 0 && durationMs < wave * LIMITS.minMsPerWave) {
    return { ok: false, error: "invalid game result" };
  }
  if (score > Math.max(1, wave) * LIMITS.maxScorePerWave) {
    return { ok: false, error: "invalid game result" };
  }

  return { ok: true, run: { score, wave, level, durationMs, difficulty, startedAt } };
}
