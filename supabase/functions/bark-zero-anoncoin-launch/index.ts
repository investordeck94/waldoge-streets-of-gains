// Bark Zero → Anoncoin launch proxy + Solana broadcaster.
// Never exposes ANONCOIN_API_KEY to the frontend. Accepts a multipart/form-data
// request from the client, forwards it to Anoncoin with the server-side
// x-api-key header, then broadcasts the signed transaction returned by
// Anoncoin to Solana mainnet before the blockhash expires.

import { Connection, VersionedTransaction, Transaction } from "npm:@solana/web3.js@1.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANONCOIN_ENDPOINT = "https://api.anoncoin.it/services/v2/create-coin-tx";
const SOLANA_RPC =
  Deno.env.get("SOLANA_RPC_URL") ?? "https://api.mainnet-beta.solana.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pickString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function tryDecodeTx(raw: Uint8Array) {
  // Prefer versioned transaction (v0 / new format), fall back to legacy.
  try {
    return { tx: VersionedTransaction.deserialize(raw), versioned: true as const };
  } catch (_) {
    const tx = Transaction.from(raw);
    return { tx, versioned: false as const };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("ANONCOIN_API_KEY");
  if (!apiKey) {
    return json(
      { error: "ANONCOIN_API_KEY is not configured on the server." },
      500,
    );
  }

  // Parse inbound multipart body from the client.
  let inbound: FormData;
  try {
    inbound = await req.formData();
  } catch {
    return json({ error: "Expected multipart/form-data request." }, 400);
  }

  const tickerName = (inbound.get("tickerName") as string | null)?.trim();
  const tickerSymbol = (inbound.get("tickerSymbol") as string | null)?.trim();
  const description = (inbound.get("description") as string | null)?.trim();
  const twitterLink = (inbound.get("twitterLink") as string | null)?.trim() || "";
  const telegramLink = (inbound.get("telegramLink") as string | null)?.trim() || "";
  const validateOnly =
    ((inbound.get("validateOnly") as string | null) ?? "").toLowerCase() === "true";
  const tickerImage = inbound.get("tickerImage");

  const errors: Record<string, string> = {};
  if (!tickerName) errors.tickerName = "Required";
  if (!tickerSymbol) errors.tickerSymbol = "Required";
  else if (tickerSymbol.length > 10) errors.tickerSymbol = "Max 10 chars";
  if (!description) errors.description = "Required";
  if (!(tickerImage instanceof File) || tickerImage.size === 0) {
    errors.tickerImage = "Image file required";
  } else if (tickerImage.size > 4 * 1024 * 1024) {
    errors.tickerImage = "Image must be ≤ 4MB";
  }
  if (Object.keys(errors).length) {
    return json({ error: "Validation failed", fieldErrors: errors }, 400);
  }

  // Re-assemble the outbound multipart request to Anoncoin.
  const outbound = new FormData();
  outbound.append("tickerName", tickerName!);
  outbound.append("tickerSymbol", tickerSymbol!);
  outbound.append("description", description!);
  outbound.append("tickerImage", tickerImage as File, (tickerImage as File).name);
  if (twitterLink) outbound.append("twitterLink", twitterLink);
  if (telegramLink) outbound.append("telegramLink", telegramLink);
  if (validateOnly) outbound.append("validateOnly", "true");

  let anonRes: Response;
  try {
    anonRes = await fetch(ANONCOIN_ENDPOINT, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: outbound,
    });
  } catch (e) {
    return json(
      { error: "Failed to reach Anoncoin API", detail: (e as Error).message },
      502,
    );
  }

  const rawText = await anonRes.text();
  let payload: any;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = { raw: rawText };
  }

  if (!anonRes.ok) {
    const msg =
      pickString(payload, ["error", "message", "detail"]) ||
      `Anoncoin API returned ${anonRes.status}`;
    const isDup = /duplicate|already|exists|taken/i.test(msg);
    return json(
      {
        error: msg,
        code: isDup ? "duplicate_ticker" : `anoncoin_${anonRes.status}`,
        anoncoin: payload,
      },
      anonRes.status === 409 || isDup ? 409 : 400,
    );
  }

  const mintAddress = pickString(payload, [
    "mintAddress",
    "mint",
    "mint_address",
    "tokenMint",
  ]);
  const requestId = pickString(payload, [
    "requestId",
    "request_id",
    "id",
    "txId",
  ]);
  const signedTxB64 = pickString(payload, [
    "transaction",
    "signedTransaction",
    "tx",
    "signedTx",
    "serializedTransaction",
  ]);

  // In validate-only mode Anoncoin will not return a signed transaction —
  // just echo the validation result back to the frontend.
  if (validateOnly) {
    return json({
      ok: true,
      validateOnly: true,
      mintAddress: mintAddress ?? null,
      requestId: requestId ?? null,
      signature: null,
      confirmed: false,
      broadcastError: null,
      anoncoin: payload,
    });
  }

  if (!signedTxB64) {
    return json(
      {
        error: "Anoncoin response did not include a signed transaction.",
        anoncoin: payload,
      },
      502,
    );
  }

  // Broadcast the signed transaction to Solana before its blockhash expires.
  let signature: string | null = null;
  let confirmed = false;
  let broadcastError: string | null = null;
  try {
    const raw = base64ToBytes(signedTxB64);
    const conn = new Connection(SOLANA_RPC, "confirmed");
    signature = await conn.sendRawTransaction(raw, {
      skipPreflight: false,
      maxRetries: 5,
    });
    // Non-fatal: confirmation can take a moment. Give it a short window.
    try {
      const latest = await conn.getLatestBlockhash("confirmed");
      const result = await conn.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        "confirmed",
      );
      confirmed = !result.value.err;
      if (result.value.err) {
        broadcastError = `Solana error: ${JSON.stringify(result.value.err)}`;
      }
    } catch (e) {
      broadcastError = `Submitted but not yet confirmed: ${(e as Error).message}`;
    }
  } catch (e) {
    broadcastError = (e as Error).message || "Broadcast failed";
  }

  return json({
    ok: true,
    mintAddress: mintAddress ?? null,
    requestId: requestId ?? null,
    signature,
    confirmed,
    broadcastError,
    anoncoin: payload,
  });
});
