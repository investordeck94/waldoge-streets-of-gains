/**
 * Atomic rate limiting (audit finding M-2). DENO RUNTIME ONLY.
 *
 * The previous count-then-insert pattern was a TOCTOU race: concurrent
 * requests all read the same count and all inserted. Limiting now happens in
 * one database call inside `public.sog_consume_rate_limit`, which takes a
 * transaction-scoped advisory lock on (bucket, subject) before counting and
 * inserting. Concurrent callers serialize; the limit holds.
 *
 * Fails CLOSED: if the database call errors, the request is rejected.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const RATE_BUCKETS = {
  reward: "reward-run",
  weekly: "weekly-run",
  challenge: "auth-challenge",
  runStart: "run-start",
} as const;

export async function consumeRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  subject: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("sog_consume_rate_limit", {
    p_bucket: bucket,
    p_subject: subject,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return false; // fail closed
  return data === true;
}

/** Best-effort housekeeping of expired challenges/sessions/run starts. */
export async function purgeExpired(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.rpc("sog_purge_expired");
  } catch {
    /* housekeeping only */
  }
}
