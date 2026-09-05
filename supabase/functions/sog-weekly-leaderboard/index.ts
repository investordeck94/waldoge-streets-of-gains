/**
 * POST /sog-weekly-leaderboard
 * body: { wallet?: string, weekStart?: "YYYY-MM-DD" }
 *
 * Read-only view of the weekly Hard Mode competition. No session required —
 * it exposes only public competition data (wallet, score, verified time).
 *
 * The winner is derived from verified database rows by the canonical ranking
 * (highest score, earliest verified time on a tie) — never from the client.
 * This endpoint authorizes nothing and pays nothing.
 */
import { json, preflight, readJson } from "../_shared/sog/http.ts";
import { serviceClient } from "../_shared/sog/session.ts";
import {
  rankRuns,
  weekHasEnded,
  WEEKLY_PRIZE_WDOGE,
  weekWindow,
} from "../_shared/sog/weekly.ts";

interface Row {
  wallet: string;
  score: number;
  verified_at: string;
  wave: number;
  level: number;
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();
  const body = await readJson(req);

  const requestedWeek = typeof body?.weekStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)
    ? new Date(`${body.weekStart}T00:00:00.000Z`)
    : new Date();
  const window = weekWindow(requestedWeek);

  const wallet = typeof body?.wallet === "string" ? body.wallet.trim().toLowerCase() : null;

  const { data, error } = await supabase
    .from("sog_weekly_runs")
    .select("wallet, score, verified_at, wave, level")
    .eq("week_start", window.weekStart)
    .eq("status", "verified");

  if (error) {
    return json({ ok: false, error: "could not load leaderboard" }, 500);
  }

  const ranked = rankRuns((data ?? []) as Row[]);
  const best: Row[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (seen.has(row.wallet)) continue;
    seen.add(row.wallet);
    best.push(row);
  }

  const ended = weekHasEnded(window);
  const playerIndex = wallet ? best.findIndex((r) => r.wallet === wallet) : -1;

  return json({
    ok: true,
    week: window,
    ended,
    prizeWdoge: WEEKLY_PRIZE_WDOGE,
    entries: best.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      wallet: r.wallet,
      score: r.score,
      wave: r.wave,
      level: r.level,
      verifiedAt: r.verified_at,
    })),
    totalPlayers: best.length,
    topScore: best[0]?.score ?? null,
    player: playerIndex >= 0
      ? {
        wallet,
        bestScore: best[playerIndex].score,
        rank: playerIndex + 1,
        isLeading: playerIndex === 0,
      }
      : null,
    // Only meaningful once the window has closed; still not a payout.
    winner: ended && best[0]
      ? { wallet: best[0].wallet, score: best[0].score, verifiedAt: best[0].verified_at }
      : null,
  });
});
