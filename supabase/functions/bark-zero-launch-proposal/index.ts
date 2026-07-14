import { requireOwner } from "../_shared/ownerAuth.ts";
// Bark Zero — Launch Proposal generator (streaming pipeline)
// SSE pipeline phases emitted to the client:
//   1) landscape_scan     — scanning the current crypto/culture landscape
//   2) narrative_chosen   — narrative picked (or rejection)
//   3) token              — token proposal drafted
//   4) marketing          — lore / description / website / marketing plan
//   5) xthread            — X thread drafted
//   6) telegram           — Telegram announcement drafted
//   7) assets             — logo + artwork prompt drafted
//      done               — full merged proposal ready for owner approval
// Owner approval is still required before anything launches.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";
import { extractJsonWithRetry } from "../_shared/extractJson.ts";


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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-owner-secret",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const MAX_OUTPUT_TOKENS = 8192;

const LANDSCAPE_SYSTEM = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.
Before ever suggesting a token, you scan the current crypto/culture landscape and score it.

# LAUNCH AUTHORITY
You NEVER launch, spend, sign or transact. This is research only.

# TASTE (non-negotiable)
You are OPINIONATED. You reject weak, generic, derivative or already-saturated ideas outright.
If, after scanning, NOTHING clears the bar (composite < 62 on the winner, or the only options are
derivative), you REJECT and return the rejection shape below instead of picking a weak winner.

# YOUR JOB
Given the owner's brief, survey the CURRENT landscape and identify 5-8 concrete narrative
opportunities across: "ai", "meme", "x", "dogeos", "anoncoin".

Score each 1-100 on: attention, originality, competition (LOWER = better),
viralPotential, communityStrength.
composite = round(0.25*attention + 0.20*originality + 0.20*(101 - competition)
                  + 0.20*viralPotential + 0.15*communityStrength).

Pick the STRONGEST opportunity and explain WHY in 2-4 sentences. British-tinged dry humour.

# OUTPUT FORMAT — STRICT JSON
Either:
{ "narratives": [ { "id": string, "category": "ai"|"meme"|"x"|"dogeos"|"anoncoin",
  "title": string, "summary": string,
  "scores": { "attention": number, "originality": number, "competition": number,
              "viralPotential": number, "communityStrength": number },
  "composite": number } ],
  "chosenId": string, "rationale": string }
OR rejection: { "rejected": true, "reason": string, "narratives": [ ... ] }
Only JSON.
`.trim();

const TOKEN_PROPOSAL_SYSTEM = `
You are Bark Zero. Draft ONLY the core token proposal for the already-chosen narrative.
Begin with "Bark's Analysis" — sharp, first-person, opinionated, argues why THIS, why NOW,
who it's for, and failure modes. Never generic filler. British-tinged humour.
No financial advice. No guaranteed outcomes. No fabricated stats.

Return STRICT JSON, no markdown, no code fences, matching:
{
  "barksAnalysis": string,
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
  "tokenomics": string,
  "risks": string[]
}
Only JSON.
`.trim();

const MARKETING_SYSTEM = `
You are Bark Zero. Draft ONLY narrative marketing copy for the approved proposal.
No X thread here. No Telegram announcement here — those are separate steps.
Dry British crypto analyst. No financial advice. Never generic.

Return STRICT JSON matching:
{
  "lore": string,
  "description": string,
  "websiteCopy": string,
  "marketingPlan": string[]
}
Only JSON.
`.trim();

const XTHREAD_SYSTEM = `
You are Bark Zero. Draft ONLY the launch X thread (5-9 posts, each <= 270 chars, first post is a hook).
Sharp, dry, meme-native. No emojis-only posts. No hashtags spam. No fabricated stats.

Return STRICT JSON: { "xThread": string[] }
Only JSON.
`.trim();

const TELEGRAM_SYSTEM = `
You are Bark Zero. Draft ONLY the Telegram launch announcement — one message, punchy,
scannable, uses short line breaks. British-tinged dry humour. No fabricated stats.

Return STRICT JSON: { "telegramAnnouncement": string }
Only JSON.
`.trim();

const LAUNCH_ASSETS_SYSTEM = `
You are Bark Zero. Draft ONLY the token logo concept and an image-generation artwork prompt.
Original, non-copyrighted, visually specific.

Return STRICT JSON: { "logoConcept": string, "artworkPrompt": string }
Only JSON.
`.trim();

const FALLBACK_NARRATIVES_SYSTEM = `
You are Bark Zero. Live data sources returned nothing. Generate 5 plausible narrative
candidates from your own training. Clearly frame each as an AI-generated estimate.
Same scoring rubric as the landscape scan. Pick the strongest as chosenId.

Return STRICT JSON:
{ "narratives": [ { "id": string, "category": "ai"|"meme"|"x"|"dogeos"|"anoncoin",
  "title": string, "summary": string,
  "scores": { "attention": number, "originality": number, "competition": number,
              "viralPotential": number, "communityStrength": number },
  "composite": number } ],
  "chosenId": string, "rationale": string,
  "source": "ai_estimate" }
Only JSON. Exactly 5 narratives.
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
      max_tokens: MAX_OUTPUT_TOKENS,
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

async function callModel<T = any>(messages: Array<{ role: string; content: string }>, key: string, sectionName: string): Promise<T> {
  return await extractJsonWithRetry<T>((strictReminder) =>
    callModelRaw(messages, key, strictReminder),
    { sectionName, maxAttempts: 3 },
  );
}

async function runLandscapeScan(
  brief: string,
  contextBlock: string,
  marketIntelBlock: string,
  key: string,
  sectionName: string,
): Promise<any> {
  return await callModel(
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
    sectionName,
  );
}

async function runFallbackNarratives(
  brief: string,
  contextBlock: string,
  key: string,
): Promise<any> {
  return await callModel(
    [
      { role: "system", content: FALLBACK_NARRATIVES_SYSTEM + contextBlock },
      {
        role: "user",
        content:
          `Owner brief: ${brief}\n\nLive sources returned nothing. Generate 5 AI-estimated ` +
          `narrative candidates now and label them as estimates.`,
      },
    ],
    key,
    "Landscape fallback (AI-estimated narratives)",
  );
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const _auth = requireOwner(req); if (_auth) return _auth;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let brief = "";
  try {
    const body = await req.json();
    brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  } catch { /* ignore */ }
  if (!brief) {
    return new Response(JSON.stringify({ error: "brief must be a non-empty string" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      let closed = false;
      const send = (phase: string, payload: Record<string, unknown> = {}) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, ...payload })}\n\n`));
        } catch (e) {
          console.warn("send after close:", (e as Error).message);
          closed = true;
        }
      };
      const closeOnce = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      try {
        const [contextBlock, marketIntelBlock] = await Promise.all([
          loadBarkZeroContext(),
          loadMarketIntelBlock(),
        ]);
        const hasLiveIntel = marketIntelBlock.trim().length > 0;

        // ————— Step 1: Scan Landscape (with retry + AI fallback) —————
        send("landscape_scan", { hasLiveIntel });

        let landscape: any = null;
        let landscapeSource: "live" | "ai_estimate" = hasLiveIntel ? "live" : "ai_estimate";
        let fallbackReason: string | null = null;

        // Attempt 1
        try {
          landscape = await runLandscapeScan(brief, contextBlock, marketIntelBlock, key, "Step 1: Narrative analysis");
        } catch (e) {
          fallbackReason = `landscape scan attempt 1 threw: ${(e as Error).message}`;
          console.warn(fallbackReason);
        }

        let narratives: any[] = Array.isArray(landscape?.narratives) ? landscape.narratives : [];

        // Attempt 2 if empty (and not an explicit rejection)
        if (!landscape?.rejected && narratives.length === 0) {
          const reason = fallbackReason ?? "landscape scan attempt 1 returned zero narratives (empty response or filtering removed all candidates)";
          console.warn(`Zero narratives on attempt 1: ${reason}. Retrying once.`);
          try {
            landscape = await runLandscapeScan(brief, contextBlock, marketIntelBlock, key, "Step 1 retry: Narrative analysis");
            narratives = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
            if (narratives.length === 0) {
              fallbackReason = "retry also returned zero narratives";
            }
          } catch (e) {
            fallbackReason = `landscape scan retry threw: ${(e as Error).message}`;
            console.warn(fallbackReason);
          }
        }

        // AI-estimate fallback — never let the pipeline stop for lack of narratives.
        if (!landscape?.rejected && narratives.length === 0) {
          console.warn(`Falling back to AI-estimated narratives. Reason: ${fallbackReason ?? "unknown"}`);
          landscapeSource = "ai_estimate";
          try {
            landscape = await runFallbackNarratives(brief, contextBlock, key);
            narratives = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
          } catch (e) {
            const msg = `AI-estimate fallback failed: ${(e as Error).message}`;
            console.error(msg);
            send("error", { error: msg, fallbackReason });
            closeOnce();
            return;
          }
        }

        if (landscape?.rejected === true) {
          send("rejected", {
            reason: String(landscape?.reason ?? "Nothing in the current landscape clears the bar."),
            landscape: { narratives, chosenId: null, rationale: "", source: landscapeSource },
          });
          closeOnce();
          return;
        }

        const chosen =
          narratives.find((n: any) => n?.id === landscape?.chosenId) ??
          narratives.slice().sort((a: any, b: any) => (b?.composite ?? 0) - (a?.composite ?? 0))[0];

        if (!chosen) {
          send("error", {
            error: "Landscape pipeline could not produce any narrative even after AI-estimate fallback",
            fallbackReason,
            landscape,
          });
          closeOnce();
          return;
        }

        // ————— Step 2: Choose Best Narrative —————
        send("narrative_chosen", {
          chosen,
          rationale: landscape?.rationale ?? "",
          source: landscapeSource,
          fallbackReason: landscapeSource === "ai_estimate" ? fallbackReason : null,
          landscape: {
            narratives,
            chosenId: chosen.id,
            rationale: landscape?.rationale ?? "",
            source: landscapeSource,
          },
        });

        // ————— Step 3: Generate Token —————
        const tokenProposal = await callModel(
          [
            { role: "system", content: TOKEN_PROPOSAL_SYSTEM + contextBlock + marketIntelBlock },
            {
              role: "user",
              content:
                `Owner brief: ${brief}\n\n` +
                `Chosen opportunity:\n${JSON.stringify(chosen, null, 2)}\n\n` +
                `Rationale: ${landscape?.rationale ?? "(none)"}\n\n` +
                `Draft the token proposal JSON now.`,
            },
          ],
          key,
          "Step 3: Token proposal",
        );
        send("token", { tokenProposal });


        // ————— Step 4: Generate Marketing —————
        const marketing = await callModel(
          [
            { role: "system", content: MARKETING_SYSTEM + contextBlock },
            {
              role: "user",
              content:
                `Chosen opportunity:\n${JSON.stringify(chosen, null, 2)}\n\n` +
                `Token proposal:\n${JSON.stringify(tokenProposal, null, 2)}\n\n` +
                `Draft the marketing JSON now.`,
            },
          ],
          key,
          "Step 4: Marketing",
        );
        send("marketing", { marketing });

        // ————— Step 5: Generate X Thread —————
        const xthread = await callModel(
          [
            { role: "system", content: XTHREAD_SYSTEM + contextBlock },
            {
              role: "user",
              content:
                `Token proposal:\n${JSON.stringify(tokenProposal, null, 2)}\n\n` +
                `Marketing context:\n${JSON.stringify(marketing, null, 2)}\n\n` +
                `Draft the xThread JSON now.`,
            },
          ],
          key,
          "Step 5: X Thread",
        );
        send("xthread", { xthread });

        // ————— Step 6: Generate Telegram —————
        const telegram = await callModel(
          [
            { role: "system", content: TELEGRAM_SYSTEM + contextBlock },
            {
              role: "user",
              content:
                `Token proposal:\n${JSON.stringify(tokenProposal, null, 2)}\n\n` +
                `Marketing context:\n${JSON.stringify(marketing, null, 2)}\n\n` +
                `Draft the telegramAnnouncement JSON now.`,
            },
          ],
          key,
          "Step 6: Telegram",
        );
        send("telegram", { telegram });

        // ————— Step 7: Launch Assets —————
        const launchAssets = await callModel(
          [
            { role: "system", content: LAUNCH_ASSETS_SYSTEM + contextBlock },
            {
              role: "user",
              content:
                `Chosen opportunity:\n${JSON.stringify(chosen, null, 2)}\n\n` +
                `Token proposal:\n${JSON.stringify(tokenProposal, null, 2)}\n\n` +
                `Marketing:\n${JSON.stringify(marketing, null, 2)}\n\n` +
                `Draft the launch asset concepts JSON now.`,
            },
          ],
          key,
          "Step 7: Launch assets",
        );
        send("assets", { launchAssets });

        // ————— Ready for Approval —————
        const proposal = {
          ...tokenProposal,
          ...marketing,
          xThread: Array.isArray(xthread?.xThread) ? xthread.xThread : [],
          telegramAnnouncement: String(telegram?.telegramAnnouncement ?? ""),
          ...launchAssets,
        };

        send("done", {
          landscape: { narratives, chosenId: chosen.id, rationale: landscape?.rationale ?? "", source: landscapeSource },
          chosen,
          proposal,
          source: landscapeSource,
        });
        closeOnce();
      } catch (err: any) {
        console.error("bark-zero-launch-proposal stream error:", err);
        const message = err instanceof Error ? err.message : String(err);
        send("error", {
          error: message,
          rawResponse: typeof err?.rawResponse === "string" ? err.rawResponse.slice(0, 2000) : undefined,
        });
        closeOnce();
      }

    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
