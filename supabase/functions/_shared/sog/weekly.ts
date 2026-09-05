/**
 * Weekly Hard Mode competition helpers.
 *
 * The competition period is Monday 00:00:00 UTC through Sunday 23:59:59 UTC.
 * Boundaries are computed server-side only — the browser never supplies them.
 *
 * Dependency-free on purpose (Deno + vitest).
 */

/** Difficulty index that qualifies for the weekly prize (blackMonday / Hard). */
export const HARD_MODE_DIFFICULTY = 2;

/** Weekly prize, in wei (10 WDOGE). Informational for the UI; the payout is
 *  still produced by the existing attestation flow, never by the client. */
export const WEEKLY_PRIZE_WEI = 10n * 10n ** 18n;
export const WEEKLY_PRIZE_WDOGE = 10;

export interface WeekWindow {
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week, UTC. */
  weekStart: string;
  /** ISO timestamp of Monday 00:00:00.000Z. */
  startsAt: string;
  /** ISO timestamp of Sunday 23:59:59.999Z. */
  endsAt: string;
}

/** Resolve the UTC competition window containing `date`. */
export function weekWindow(date: Date = new Date()): WeekWindow {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // getUTCDay(): 0 = Sunday. Shift so Monday = 0.
  const offset = (d.getUTCDay() + 6) % 7;
  const start = new Date(d.getTime() - offset * 86_400_000);
  const end = new Date(start.getTime() + 7 * 86_400_000 - 1);
  return {
    weekStart: start.toISOString().slice(0, 10),
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

/** True when the given window has fully elapsed. */
export function weekHasEnded(window: WeekWindow, now: Date = new Date()): boolean {
  return now.getTime() > new Date(window.endsAt).getTime();
}

export interface RankableRun {
  wallet: string;
  score: number;
  verified_at: string;
}

/**
 * Canonical ranking: highest score first; on a tie the earliest verified
 * qualifying run wins. Pure function — the single source of truth for both the
 * leaderboard display and the weekly winner.
 */
export function rankRuns<T extends RankableRun>(runs: readonly T[]): T[] {
  return [...runs].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.verified_at).getTime() - new Date(b.verified_at).getTime();
  });
}
