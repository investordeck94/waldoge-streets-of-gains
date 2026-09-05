/**
 * Weekly Hard Mode competition hook — presentation-side only.
 * Never runs per frame and is never imported by src/game/**.
 */
import { useCallback, useEffect, useState } from "react";
import type { RunResult } from "@/lib/dogeos/rewardsApi";
import {
  fetchWeeklyLeaderboard,
  recordQualifyingRun,
  startServerRun,
  type ServerRunStart,
  type RecordedRun,
  type WeeklyLeaderboard,
} from "@/lib/dogeos/weeklyCompetition";

export function useWeeklyHardMode(address: string | null) {
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecorded, setLastRecorded] = useState<RecordedRun | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeaderboard(await fetchWeeklyLeaderboard(address));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Open a server-authoritative run. Best-effort: a failure never blocks play,
   * it only means this run cannot be recorded as a weekly entry.
   */
  const startRun = useCallback(
    async (difficulty: number): Promise<ServerRunStart | null> => {
      if (!address) return null;
      try {
        return await startServerRun(address, difficulty);
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    [address],
  );

  const recordRun = useCallback(
    async (run: RunResult) => {
      if (!address) return;
      try {
        setLastRecorded(await recordQualifyingRun(address, run));
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [address, refresh],
  );

  return { leaderboard, loading, error, lastRecorded, refresh, startRun, recordRun };
}
