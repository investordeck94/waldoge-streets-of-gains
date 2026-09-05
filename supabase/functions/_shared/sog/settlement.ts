/**
 * Weekly Hard Mode settlement (audit finding M-1).
 *
 * The 10 WDOGE weekly prize is now backed by an explicit, idempotent,
 * week-keyed settlement record instead of an operator convention.
 *
 * HARD RULES (all enforced server-side):
 *  - the prize is the constant WEEKLY_PRIZE_WEI (exactly 10 WDOGE);
 *  - the winner is the top of the canonical server ranking of VERIFIED runs;
 *  - a week may only be settled after it has fully ended;
 *  - a week may only be settled once (unique index on week_start);
 *  - the client may never supply the winner, the amount or the status;
 *  - a transaction hash is recorded as "claimed" only — never as proof of
 *    payment. It is promoted to "paid" only by an on-chain receipt check.
 */
import { rankRuns, WEEKLY_PRIZE_WEI, weekHasEnded, type WeekWindow } from "./weekly.ts";

export const SETTLEMENT_STATUS = {
  pending: "pending_payout",
  paid: "paid",
} as const;

export interface SettleableRun {
  wallet: string;
  score: number;
  verified_at: string;
  run_id?: string;
}

export interface SettlementWinner {
  wallet: string;
  score: number;
  verifiedAt: string;
  runId: string | null;
  prizeWei: bigint;
}

export type SettlementResolution =
  | { ok: true; winner: SettlementWinner }
  | { ok: false; error: string; status: 409 | 422 };

/**
 * Resolve the winner of a closed week purely from verified database rows.
 * Ties are broken by the earliest verified run (canonical `rankRuns`).
 */
export function resolveWeeklyWinner(
  window: WeekWindow,
  rows: readonly SettleableRun[],
  now: Date = new Date(),
): SettlementResolution {
  if (!weekHasEnded(window, now)) {
    return { ok: false, error: "week has not ended yet", status: 422 };
  }
  const ranked = rankRuns(rows);
  const top = ranked[0];
  if (!top) return { ok: false, error: "no verified runs for this week", status: 422 };

  return {
    ok: true,
    winner: {
      wallet: top.wallet.toLowerCase(),
      score: top.score,
      verifiedAt: top.verified_at,
      runId: top.run_id ?? null,
      // Server constant. Never read from a request body.
      prizeWei: WEEKLY_PRIZE_WEI,
    },
  };
}
