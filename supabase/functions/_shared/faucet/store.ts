/**
 * Supabase-backed faucet claim store. DENO RUNTIME ONLY (service-role client).
 *
 * Concurrency: `openPendingClaim` relies on the partial unique index
 * `twaldoge_faucet_claims_one_pending_per_wallet` — a second concurrent request
 * loses the insert race and gets null. There is deliberately no read-then-write
 * check, which would be racy.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ClaimRecord, FaucetStore } from "./claim.ts";

export function faucetServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

export function createFaucetStore(supabase: SupabaseClient): FaucetStore {
  return {
    async findLastSuccess(wallet: string): Promise<ClaimRecord | null> {
      const { data } = await supabase
        .from("twaldoge_faucet_claims")
        .select("id, created_at")
        .eq("wallet", wallet)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      return { id: String(data.id), createdAt: new Date(data.created_at).getTime() };
    },

    async openPendingClaim(wallet: string, amountWei: bigint): Promise<ClaimRecord | null> {
      const { data, error } = await supabase
        .from("twaldoge_faucet_claims")
        .insert({ wallet, amount_wei: amountWei.toString(), status: "pending" })
        .select("id, created_at")
        .maybeSingle();
      if (error || !data) return null;
      return { id: String(data.id), createdAt: new Date(data.created_at).getTime() };
    },

    async markSuccess(id: string, txHash: string): Promise<void> {
      await supabase
        .from("twaldoge_faucet_claims")
        .update({ status: "success", tx_hash: txHash, completed_at: new Date().toISOString() })
        .eq("id", id);
    },

    async markFailure(id: string, reason: string): Promise<void> {
      await supabase
        .from("twaldoge_faucet_claims")
        .update({
          status: "failed",
          error: reason.slice(0, 500),
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
    },
  };
}
