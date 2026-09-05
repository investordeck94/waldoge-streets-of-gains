/**
 * POST /sog-settle-week   header: x-sog-admin
 * body: { weekStart?: "YYYY-MM-DD" }
 *
 * Closes a finished weekly competition and records ONE settlement row naming
 * the server-selected winner and the fixed 10 WDOGE prize (audit M-1).
 *
 * This endpoint signs nothing and moves no tokens. It only records who the
 * backend determined won. The winner then calls sog-submit-run, which will
 * only ever authorize a payout that matches a pending settlement.
 *
 * Operator-only: requires SOG_ADMIN_SECRET. If the secret is unset the
 * endpoint is disabled (fails closed).
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { serviceClient } from "../_shared/sog/session.ts";
import { weekWindow } from "../_shared/sog/weekly.ts";
import { resolveWeeklyWinner, SETTLEMENT_STATUS } from "../_shared/sog/settlement.ts";

const ADMIN_SECRET = Deno.env.get("SOG_ADMIN_SECRET") ?? "";

/** Constant-time-ish comparison to avoid trivial timing leaks. */
function secretMatches(provided: string, expected: string): boolean {
  if (!expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  if (!ADMIN_SECRET) return fail("settlement is not configured", 503);
  if (!secretMatches(req.headers.get("x-sog-admin")?.trim() ?? "", ADMIN_SECRET)) {
    return fail("unauthorized", 401);
  }

  const supabase = serviceClient();
  const body = await readJson(req);

  // Default target: the week that just ended.
  const requested = typeof body?.weekStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)
    ? new Date(`${body.weekStart}T00:00:00.000Z`)
    : new Date(Date.now() - 7 * 86_400_000);
  const window = weekWindow(requested);

  // Idempotent: an already settled week is reported, never re-settled.
  const { data: existing } = await supabase
    .from("sog_weekly_settlements")
    .select("week_start, winner_wallet, winner_score, prize_wei, status, settled_at")
    .eq("week_start", window.weekStart)
    .maybeSingle();
  if (existing) return json({ ok: true, alreadySettled: true, settlement: existing });

  const { data: rows, error } = await supabase
    .from("sog_weekly_runs")
    .select("wallet, score, verified_at, run_id")
    .eq("week_start", window.weekStart)
    .eq("status", "verified");
  if (error) return fail("could not load weekly runs", 500);

  const resolution = resolveWeeklyWinner(window, rows ?? []);
  if (!resolution.ok) return fail(resolution.error, resolution.status);
  const winner = resolution.winner;

  const { error: insertError } = await supabase.from("sog_weekly_settlements").insert({
    week_start: window.weekStart,
    winner_wallet: winner.wallet,
    winner_score: winner.score,
    winner_run_id: winner.runId,
    prize_wei: winner.prizeWei.toString(),
    status: SETTLEMENT_STATUS.pending,
  });
  // Unique index on week_start => a concurrent settle already won the race.
  if (insertError) return fail("week already settled", 409);

  return json({
    ok: true,
    week: window,
    settlement: {
      weekStart: window.weekStart,
      winnerWallet: winner.wallet,
      winnerScore: winner.score,
      prizeWei: winner.prizeWei.toString(),
      status: SETTLEMENT_STATUS.pending,
    },
  });
});
