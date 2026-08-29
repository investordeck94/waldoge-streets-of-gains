/**
 * POST /sog-run-status   header: x-sog-session
 * body: { runId, status: "submitted", txHash }
 *
 * Lets the player report that they broadcast submitRun(). This records a
 * CLAIMED-BY-CLIENT transaction hash only.
 *
 * IMPORTANT: no on-chain confirmation is performed in Phase 2D. A run is never
 * marked "confirmed" or "claimed" here — that requires a receipt/event indexer,
 * which is a later phase. Do not treat "submitted" as proof of anything.
 */
import { fail, json, preflight, readJson } from "../_shared/sog/http.ts";
import { authenticateSession, serviceClient } from "../_shared/sog/session.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const supabase = serviceClient();
  const session = await authenticateSession(req, supabase);
  if (!session.ok) return fail(session.error, 401);

  const body = await readJson(req);
  const runId = typeof body?.runId === "string" ? body.runId.trim() : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : "";
  const status = body?.status;

  if (!/^0x[0-9a-f]{64}$/i.test(runId)) return fail("invalid run", 400);
  if (status !== "submitted") return fail("unsupported status", 400);
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) return fail("invalid transaction hash", 400);

  const { data, error } = await supabase
    .from("sog_runs")
    .update({ status: "submitted", tx_hash: txHash })
    .eq("wallet", session.wallet)
    .eq("run_id", runId)
    .eq("status", "authorized")
    .select("run_id")
    .maybeSingle();

  if (error) return fail("could not update run", 500);
  if (!data) return fail("invalid run", 404);

  return json({ ok: true, runId, status: "submitted" });
});
