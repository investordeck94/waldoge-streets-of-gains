import { requireOwner } from "../_shared/ownerAuth.ts";
// Generates a single launch asset (logo | banner | telegram) via Lovable AI Gateway.
// Returns { b64_json, mimeType, filename } — non-streaming for simplicity.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Kind = "logo" | "banner" | "telegram";

const SIZE: Record<Kind, string> = {
  logo: "1024x1024",
  banner: "1536x1024",   // ~3:2, close to X banner aspect
  telegram: "1024x1024", // TG profile is square
};

function buildPrompt(kind: Kind, params: {
  tokenName: string;
  ticker: string;
  logoConcept?: string;
  artworkPrompt?: string;
  narrative?: string;
}): string {
  const { tokenName, ticker, logoConcept = "", artworkPrompt = "", narrative = "" } = params;
  const base = `Token: ${tokenName} ($${ticker}). Narrative: ${narrative}. Visual concept: ${logoConcept || artworkPrompt}. Style: bold, memeable, high-contrast, crypto-native, clean vector-friendly composition, no gibberish text.`;
  if (kind === "logo") {
    return `${base}\n\nCreate a MEMECOIN LOGO — perfectly centered mascot/symbol on a clean solid background, no border, ready to be cropped to a circle. Iconic, instantly recognizable at small sizes. Absolutely no text or letters in the image.`;
  }
  if (kind === "banner") {
    return `${base}\n\nCreate an X (Twitter) HEADER BANNER — wide cinematic composition, bold hero visual on the left third, empty negative space on the right for profile picture overlay, dramatic lighting, no cropped faces at edges. Do not add any readable text, slogans, or watermarks.`;
  }
  return `${base}\n\nCreate a TELEGRAM PROFILE IMAGE — square, extreme close-up hero portrait of the token mascot, high contrast, saturated colors, subject fills 80% of frame so it survives being cropped to a small circle. No text, no borders, no watermarks.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { ...corsHeaders, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-owner-secret" } });
  const _auth = requireOwner(req); if (_auth) return _auth;
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    kind?: Kind;
    tokenName?: string;
    ticker?: string;
    logoConcept?: string;
    artworkPrompt?: string;
    narrative?: string;
  };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const kind = body.kind;
  if (!kind || !["logo", "banner", "telegram"].includes(kind)) {
    return new Response(JSON.stringify({ error: "kind must be logo|banner|telegram" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body.tokenName || !body.ticker) {
    return new Response(JSON.stringify({ error: "tokenName and ticker required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const prompt = buildPrompt(kind, {
    tokenName: body.tokenName,
    ticker: body.ticker,
    logoConcept: body.logoConcept,
    artworkPrompt: body.artworkPrompt,
    narrative: body.narrative,
  });

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt,
      size: SIZE[kind],
      quality: "low",
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Image gateway failed [${res.status}]: ${text}`);
    return new Response(JSON.stringify({ error: "Image generation failed", status: res.status, details: text }), {
      status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    return new Response(JSON.stringify({ error: "No image returned", raw: data }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    kind,
    b64_json: b64,
    mimeType: "image/png",
    filename: `${body.ticker.toLowerCase()}-${kind}.png`,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
