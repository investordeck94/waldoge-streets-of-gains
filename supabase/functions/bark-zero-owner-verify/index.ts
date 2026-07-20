// Tiny owner-secret verification endpoint. Returns 200 when the presented
// `x-owner-secret` matches BARK_ZERO_OWNER_SECRET, 401 otherwise. No side
// effects — safe to call from the unlock gate to give immediate feedback
// instead of failing later inside a real generator.
import { checkOwnerSecret } from "../_shared/ownerAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-owner-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = checkOwnerSecret(req);
  if (!auth.ok) {
    const status = auth.status === 401 ? 200 : auth.status;
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
