/**
 * Weekly Hard Mode competition panel — presentational only.
 * Reads verified leaderboard data from the backend; shows an empty state when
 * there is none. No fabricated scores, no client-side reward logic.
 */
import { useEffect, useMemo, useState } from "react";
import { Trophy, Timer, RefreshCw } from "lucide-react";
import type { WeeklyLeaderboard } from "@/lib/dogeos/weeklyCompetition";

function shortWallet(w: string) {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function useCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!endsAt) return null;
    const ms = new Date(endsAt).getTime() - now;
    if (ms <= 0) return "Week ended";
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
  }, [endsAt, now]);
}

interface Props {
  leaderboard: WeeklyLeaderboard | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  connected?: boolean;
}

export const WeeklyHardModePanel = ({
  leaderboard,
  loading,
  error,
  onRefresh,
  connected,
}: Props) => {
  const countdown = useCountdown(leaderboard?.week.endsAt);

  return (
    <div className="glass-card p-4 space-y-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h4 className="font-heading font-bold text-sm tracking-wide">WEEKLY HARD MODE</h4>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Refresh weekly leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Prize: <span className="text-primary font-bold">10 WDOGE</span> · Highest verified Hard Mode
        (FULL TRENCH MODE) score wins. Ties go to the earliest verified run.
      </p>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Timer className="w-3.5 h-3.5" />
        <span>{countdown ? `Ends in ${countdown}` : "Loading week…"}</span>
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {!error && leaderboard && leaderboard.entries.length === 0 && (
        <p className="text-xs text-muted-foreground">No verified Hard Mode scores yet.</p>
      )}

      {leaderboard && leaderboard.entries.length > 0 && (
        <ol className="space-y-1">
          {leaderboard.entries.map((e) => (
            <li
              key={`${e.wallet}-${e.rank}`}
              className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                leaderboard.player?.wallet === e.wallet ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <span className="tabular-nums">
                #{e.rank} {shortWallet(e.wallet)}
              </span>
              <span className="font-bold tabular-nums">{e.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}

      {leaderboard?.player ? (
        <p className="text-[11px] text-muted-foreground">
          Your best this week:{" "}
          <span className="text-foreground font-bold">
            {leaderboard.player.bestScore.toLocaleString()}
          </span>{" "}
          · Rank #{leaderboard.player.rank}
          {leaderboard.player.isLeading && (
            <span className="text-primary font-bold"> · You are currently #1</span>
          )}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {connected
            ? "No qualifying Hard Mode run from your wallet this week yet."
            : "Connect your wallet and finish FULL TRENCH MODE to enter."}
        </p>
      )}

      {leaderboard?.ended && (
        <p className="text-[11px] text-primary">
          {leaderboard.winner
            ? `Week closed — winner ${shortWallet(leaderboard.winner.wallet)} with ${leaderboard.winner.score.toLocaleString()}. Prize settles through the DogeOS reward contract.`
            : "Week closed — no qualifying runs."}
        </p>
      )}

      <p className="text-[10px] text-muted-foreground/70">
        Completing Hard Mode records a verified entry only. WDOGE is not paid at completion — only
        the weekly winner is eligible for the 10 WDOGE prize.
      </p>
    </div>
  );
};
