// Bark Zero — Post-launch content kit
// After a successful Anoncoin launch, generate the full marketing kit in one shot:
// X announcement, X thread, Telegram announcement, Discord announcement,
// website landing page copy, meme ideas, and 20 launch replies.

import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are Bark Zero — dry, British, crypto-native voice powered by WALDOGE.
The token has JUST launched on Anoncoin (Solana). You are drafting the full
post-launch content kit. Confident, culturally literate, meme-aware. No
financial advice, no guaranteed outcomes, no fabricated stats, no hashtag
spam, no emoji spam (one tasteful emoji at most per piece).

# HARD LIMITS (enforce yourself)
- X announcement: single tweet, under 275 chars.
- X thread: 5 posts, each under 275 chars, each self-contained, arc builds.
- Telegram announcement: 2–4 short paragraphs, plain text, no markdown headers.
- Discord announcement: 2–4 short paragraphs, plain text. Optional @everyone at top only if it fits the tone.
- Website landing page: hero headline, sub-headline, 3 feature bullets, CTA.
- Meme ideas: 6 concrete meme concepts (format + caption idea).
- Launch replies: exactly 20 short in-character replies (each under 220 chars) to hype-style comments — varied tone (dry, cheeky, warm, sharp), no repeats.

# OUTPUT
Return STRICT JSON only. No markdown, no code fences, no prose around it.
Shape:
{
  "xAnnouncement": string,
  "xThread": string[],
  "telegramAnnouncement": string,
  "discordAnnouncement": string,
  "landingPage": {
    "headline": string,
    "subheadline": string,
    "features": string[],
    "cta": string
  },
  "memeIdeas": [{ "format": string, "caption": string }],
  "replies": string[]
}
`.trim();

function extractJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try { return JSON.parse(cleaned); } catch { /* fallthrough */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("Model returned invalid JSON");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { tokenName, ticker, narrative, description, lore, mintAddress, signature } = body ?? {};

    if (typeof tokenName !== "string" || typeof ticker !== "string") {
      return new Response(JSON.stringify({ error: "tokenName and ticker are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = [
      `Token just launched on Anoncoin (Solana).`,
      `Name: ${tokenName}`,
      `Ticker: $${ticker}`,
      narrative ? `Narrative: ${narrative}` : "",
      description ? `Description: ${description}` : "",
      lore ? `Lore: ${lore}` : "",
      mintAddress ? `Mint: ${mintAddress}` : "",
      signature ? `Tx: https://solscan.io/tx/${signature}` : "",
      "",
      "Draft the full post-launch content kit as strict JSON per the schema. Return JSON now.",
    ].filter(Boolean).join("\n");

    const contextBlock = await loadBarkZeroContext();
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("post-launch-kit gateway error:", upstream.status, errText);
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      return new Response(
        JSON.stringify({ error: errText || `Gateway ${upstream.status}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let kit: unknown;
    try {
      kit = extractJson(String(raw));
    } catch (e) {
      return new Response(
        JSON.stringify({ error: (e as Error).message, raw }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ kit }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bark-zero-post-launch-kit error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
