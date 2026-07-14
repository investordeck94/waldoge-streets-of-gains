// Bark Zero — Launch Proposal generator
// Two-phase pipeline:
//   1) Landscape scan  → scores narratives across AI / Meme / X / DogeOS / Anoncoin
//   2) Launch proposal → grounded in the top-scored opportunity
// Owner approval is still required before anything launches.

import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const LANDSCAPE_SYSTEM = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.
Before ever suggesting a token, you scan the current crypto/culture landscape and score it.

# LAUNCH AUTHORITY
You NEVER launch, spend, sign or transact. This is research only.

# YOUR JOB (this call)
Given the owner's brief, survey the CURRENT landscape and identify 5-8 concrete narrative
opportunities. Cover ALL of these categories (at least one narrative per category when relevant):
  - "ai"        — AI narratives (agents, autonomous, inference, GPU, robotics)
  - "meme"      — meme narratives (animal memes, characters, cultural moments)
  - "x"         — trends emerging on X / crypto Twitter right now
  - "dogeos"    — DogeOS ecosystem angles
  - "anoncoin"  — Anoncoin ecosystem angles

Score each narrative 1-100 on:
  attention, originality, competition (LOWER = better, i.e. less crowded scores higher),
  viralPotential, communityStrength.

Compute a composite = round(0.25*attention + 0.20*originality + 0.20*(101 - competition)
                             + 0.20*viralPotential + 0.15*communityStrength).

Pick the STRONGEST opportunity and explain WHY in 2-4 sentences — reference the scores.
Be sharp, culturally aware, dryly funny, non-generic. British-tinged humour. No fabricated stats.

# OUTPUT FORMAT — STRICT JSON, no markdown, no code fences
{
  "narratives": [
    {
      "id": string,                 // short slug
      "category": "ai" | "meme" | "x" | "dogeos" | "anoncoin",
      "title": string,              // 3-6 words
      "summary": string,            // 1-2 sentences of what the narrative IS right now
      "scores": {
        "attention": number,
        "originality": number,
        "competition": number,
        "viralPotential": number,
        "communityStrength": number
      },
      "composite": number
    }
  ],
  "chosenId": string,               // must match a narrative.id
  "rationale": string               // WHY this one — reference the scores
}
Only JSON. No prose before or after.
`.trim();

const PROPOSAL_SYSTEM = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.

# LAUNCH AUTHORITY
You are NEVER allowed to launch a token automatically.
You NEVER spend funds, sign wallet transactions or create on-chain transactions.
Every proposal MUST be reviewed and explicitly approved by the owner before anything happens.

# YOUR JOB
You have already scored the current landscape and picked the strongest opportunity.
Design a Launch Proposal grounded in that chosen narrative. Reflect its scores honestly
in memeScore / communityScore / narrativeScore / launchConfidence.

Be sharp, culturally aware, dryly funny, non-generic. British-tinged humour.
No financial advice. No guaranteed outcomes. No fabricated stats.

# OUTPUT FORMAT
Return STRICT JSON, no markdown, no code fences, matching exactly this shape:

{
  "tokenName": string,
  "ticker": string,
  "narrative": string,
  "whyNow": string,
  "attentionAnalysis": string,
  "competitionAnalysis": string,
  "memeScore": number,
  "communityScore": number,
  "launchConfidence": number,
  "narrativeScore": number,
  "suggestedLiquidity": string,
  "logoConcept": string,
  "artworkPrompt": string,
  "lore": string,
  "description": string,
  "websiteCopy": string,
  "xThread": string[],
  "telegramAnnouncement": string,
  "marketingPlan": string[],
  "tokenomics": string,
  "risks": string[]
}
Only JSON. No prose before or after.
`.trim();

async function callModel(messages: Array<{ role: string; content: string }>, key: string) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const status = res.status === 429 || res.status === 402 ? res.status : 500;
    throw Object.assign(new Error(errText || `Gateway ${res.status}`), { status });
  }
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) throw Object.assign(new Error("Model returned malformed JSON"), { status: 502, raw });
    return JSON.parse(match[0]);
  }
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

    const { brief } = await req.json();
    if (typeof brief !== "string" || brief.trim().length === 0) {
      return new Response(JSON.stringify({ error: "brief must be a non-empty string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextBlock = await loadBarkZeroContext();

    // ————— Phase 1: landscape scan —————
    const landscape = await callModel(
      [
        { role: "system", content: LANDSCAPE_SYSTEM + contextBlock },
        {
          role: "user",
          content:
            `Owner brief: ${brief}\n\nScan the current crypto/culture landscape now. ` +
            `Cover AI, meme, X trends, DogeOS, and Anoncoin. Return the landscape JSON.`,
        },
      ],
      key,
    );

    const narratives = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
    const chosen =
      narratives.find((n: any) => n?.id === landscape?.chosenId) ??
      narratives.slice().sort((a: any, b: any) => (b?.composite ?? 0) - (a?.composite ?? 0))[0];

    if (!chosen) {
      return new Response(
        JSON.stringify({ error: "Landscape scan returned no narratives", landscape }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ————— Phase 2: proposal grounded in the chosen narrative —————
    const proposal = await callModel(
      [
        { role: "system", content: PROPOSAL_SYSTEM + contextBlock },
        {
          role: "user",
          content:
            `Owner brief: ${brief}\n\n` +
            `Landscape scan (already done, do not repeat it):\n${JSON.stringify(landscape, null, 2)}\n\n` +
            `Chosen opportunity:\n${JSON.stringify(chosen, null, 2)}\n\n` +
            `Rationale for the choice: ${landscape?.rationale ?? "(none)"}\n\n` +
            `Design the Launch Proposal for THIS opportunity. Return the Launch Proposal JSON now.`,
        },
      ],
      key,
    );

    return new Response(
      JSON.stringify({
        landscape: {
          narratives,
          chosenId: chosen.id,
          rationale: landscape?.rationale ?? "",
        },
        chosen,
        proposal,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("bark-zero-launch-proposal error:", err);
    const status = typeof err?.status === "number" ? err.status : 500;
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
