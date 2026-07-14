// Bark Zero — Launch Proposal generator
// Two-phase pipeline:
//   1) Landscape scan  → scores narratives across AI / Meme / X / DogeOS / Anoncoin
//   2) Launch proposal → grounded in the top-scored opportunity
// Owner approval is still required before anything launches.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";
import { extractJson, extractJsonWithRetry } from "../_shared/extractJson.ts";


async function loadMarketIntelBlock(): Promise<string> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !srk) return "";
    const supabase = createClient(url, srk, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("bark_zero_market_intel")
      .select("category, title, summary, composite, rank, bark_take, scanned_at")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("rank", { ascending: true })
      .limit(60);
    const rows = (data ?? []) as Array<{
      category: string; title: string; summary: string;
      composite: number; rank: number | null; bark_take: string | null; scanned_at: string;
    }>;
    if (!rows.length) return "";
    const byCat = new Map<string, typeof rows>();
    for (const r of rows) {
      const arr = byCat.get(r.category) ?? [];
      arr.push(r); byCat.set(r.category, arr);
    }
    const blocks = [...byCat.entries()].map(([cat, list]) => {
      const lines = list.slice(0, 8).map((r) =>
        `  ${r.rank ?? "?"}. [${r.composite}] ${r.title} — ${r.summary}${r.bark_take ? ` // Bark: ${r.bark_take}` : ""}`
      ).join("\n");
      return `### ${cat.toUpperCase()}\n${lines}`;
    }).join("\n\n");
    const scannedAt = rows[0]?.scanned_at ?? "";
    return `\n\n# BARK ZERO MARKET INTEL (live ranking — use this)\n` +
      `Last scanned: ${scannedAt}. Prefer these ranked items over inventing new ones. ` +
      `You may add fresh items only if they clearly beat the ranked list on composite score.\n\n${blocks}`;
  } catch (err) {
    console.error("loadMarketIntelBlock error:", err);
    return "";
  }
}


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

# TASTE (non-negotiable)
You are OPINIONATED. You reject weak, generic, derivative or already-saturated ideas outright.
You do NOT propose "AI x meme on Solana" filler, recycled dog/cat coins with no angle,
"community-driven utility" nothingburgers, or anything that sounds like a hackathon submission.
If the owner's brief is lazy ("make a memecoin", "surprise me"), you still refuse to be generic —
you find the sharpest cultural edge you can defend.

If, after scanning, NOTHING clears the bar (composite < 62 on the winner, or the only options are
derivative), you REJECT and return the rejection shape below instead of picking a weak winner.

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

Either the normal shape:
{
  "narratives": [
    {
      "id": string,
      "category": "ai" | "meme" | "x" | "dogeos" | "anoncoin",
      "title": string,
      "summary": string,
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
  "chosenId": string,
  "rationale": string
}

OR the rejection shape (use ONLY if nothing clears the bar):
{
  "rejected": true,
  "reason": string,          // 2-4 sentences, opinionated, name what's weak
  "narratives": [ ... ]      // still return the scored landscape so the owner sees your work
}

Only JSON. No prose before or after.
`.trim();

const PROPOSAL_SYSTEM = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.

# LAUNCH AUTHORITY
You are NEVER allowed to launch a token automatically.
You NEVER spend funds, sign wallet transactions or create on-chain transactions.
Every proposal MUST be reviewed and explicitly approved by the owner before anything happens.

# TASTE (non-negotiable)
You are OPINIONATED. Every proposal you draft must begin with "Bark's Analysis" —
a sharp, first-person take that argues WHY this specific narrative is worth launching
RIGHT NOW, what the cultural edge is, who it's for, and what the failure modes are.
Never generic. Never "utility-focused community-driven memecoin" filler. Reference the
scores, the moment, the meme, the enemy. If it isn't defensible, don't dress it up.

# YOUR JOB
You have already scored the current landscape and picked the strongest opportunity.
Design a Launch Proposal grounded in that chosen narrative. Reflect its scores honestly
in memeScore / communityScore / narrativeScore / launchConfidence.

Be sharp, culturally aware, dryly funny, non-generic. British-tinged humour.
No financial advice. No guaranteed outcomes. No fabricated stats.

# OUTPUT FORMAT
Return STRICT JSON, no markdown, no code fences, matching exactly this shape:

{
  "barksAnalysis": string,   // REQUIRED. 4-8 sentences. First-person. Opinionated. Starts with "Bark's Analysis:". Argues why THIS narrative, why NOW, cultural edge, target audience, failure modes.
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


async function callModelRaw(messages: Array<{ role: string; content: string }>, key: string, extraSystem = ""): Promise<string> {
  const finalMessages = extraSystem
    ? messages.map((m, i) => (i === 0 && m.role === "system" ? { ...m, content: m.content + extraSystem } : m))
    : messages;
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: finalMessages,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const status = res.status === 429 || res.status === 402 ? res.status : 500;
    throw Object.assign(new Error(errText || `Gateway ${res.status}`), { status });
  }
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? "");
}

async function callModel<T = any>(messages: Array<{ role: string; content: string }>, key: string): Promise<T> {
  return await extractJsonWithRetry<T>((strictReminder) =>
    callModelRaw(messages, key, strictReminder),
  );
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

    const [contextBlock, marketIntelBlock] = await Promise.all([
      loadBarkZeroContext(),
      loadMarketIntelBlock(),
    ]);


    // ————— Phase 1: landscape scan —————
    const landscape = await callModel(
      [
        { role: "system", content: LANDSCAPE_SYSTEM + contextBlock + marketIntelBlock },
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

    // Bark rejected the whole landscape — surface it, do not draft a proposal.
    if (landscape?.rejected === true) {
      return new Response(
        JSON.stringify({
          rejected: true,
          reason: String(landscape?.reason ?? "Nothing in the current landscape clears the bar."),
          landscape: { narratives, chosenId: null, rationale: "" },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
        { role: "system", content: PROPOSAL_SYSTEM + contextBlock + marketIntelBlock },
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
