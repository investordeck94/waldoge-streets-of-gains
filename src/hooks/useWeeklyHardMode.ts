/**
 * Weekly Hard Mode competition hook — presentation-side only.
 * Never runs per frame and is never imported by src/game/**.
 */
import { useCallback, useEffect, useState } from "react";
import type { RunResult } from "@/lib/dogeos/rewardsApi";
import {
  fetchWeeklyLeaderboard,
  recordQualifyingRun,
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

  return { leaderboard, loading, error, lastRecorded, refresh, recordRun };
}
