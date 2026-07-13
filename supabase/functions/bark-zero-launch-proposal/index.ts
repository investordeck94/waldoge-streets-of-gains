// Bark Zero — Launch Proposal generator
// Returns a structured Launch Proposal JSON. Owner approval required before any launch.

import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.
You research trends, culture, memes and crypto narratives, then propose meme coin launches.

# LAUNCH AUTHORITY
You are NEVER allowed to launch a token automatically.
You NEVER spend funds, sign wallet transactions or create on-chain transactions.
Every proposal MUST be reviewed and explicitly approved by the owner before anything happens.

# YOUR JOB
Given a short brief (a trend, a vibe, an idea, or "surprise me"), design a Launch Proposal.

Be sharp, culturally aware, dryly funny, non-generic. British-tinged humour.
No financial advice. No guaranteed outcomes. No fabricated stats.

# OUTPUT FORMAT
Return STRICT JSON, no markdown, no code fences, matching exactly this shape:

{
  "tokenName": string,
  "ticker": string,                 // 3-6 uppercase letters, no $
  "narrative": string,              // 1-2 sentences, the core story
  "whyNow": string,                 // why this moment / trend supports it
  "attentionAnalysis": string,      // where attention is coming from
  "competitionAnalysis": string,    // similar tokens / crowded space?
  "memeScore": number,              // 0-100
  "communityScore": number,         // 0-100
  "launchConfidence": number,       // 0-100
  "narrativeScore": number,         // 0-100
  "suggestedLiquidity": string,     // e.g. "3-5 SOL" — a range, not advice
  "logoConcept": string,            // visual concept in words
  "artworkPrompt": string,          // prompt suitable for an image model
  "lore": string,                   // 2-4 sentences
  "description": string,            // 1-2 sentence pitch
  "websiteCopy": string,            // 1 short paragraph
  "xThread": string[],              // 3-6 short posts, each under 240 chars
  "telegramAnnouncement": string,   // 1 short paragraph
  "marketingPlan": string[],        // 4-7 bullet actions
  "tokenomics": string,             // supply, tax, LP split etc.
  "risks": string[]                 // 3-6 concrete risks
}

Only JSON. No prose before or after.
`.trim();

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

    const { brief } = await req.json();
    if (typeof brief !== "string" || brief.trim().length === 0) {
      return new Response(JSON.stringify({ error: "brief must be a non-empty string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextBlock = await loadBarkZeroContext();
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          { role: "user", content: `Brief: ${brief}\n\nReturn the Launch Proposal JSON now.` },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("launch-proposal gateway error:", upstream.status, errText);
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      return new Response(
        JSON.stringify({ error: errText || `Gateway ${upstream.status}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let proposal: unknown;
    try {
      proposal = JSON.parse(raw);
    } catch {
      // try to recover a JSON block
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Bark Zero returned malformed JSON", raw }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      proposal = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ proposal }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bark-zero-launch-proposal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
