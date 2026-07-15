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

type TraceExtra = Record<string, unknown>;

function ts() { return new Date().toISOString(); }

function stackSite(depth = 3) {
  const line = new Error().stack?.split("\n")[depth]?.trim() ?? "unknown";
  const match = line.match(/(?:file:\/\/)?([^\s()]+\.ts:\d+:\d+)/);
  return match?.[1] ?? line;
}

function safeExtra(extra?: TraceExtra) {
  if (!extra) return "";
  try { return " " + JSON.stringify(extra); }
  catch { return " {\"extra\":\"[unserializable]\"}"; }
}

function errorDetails(err: unknown, rawResponse?: unknown): TraceExtra {
  const e = err as Error & { status?: number; response?: { status?: number }; rawResponse?: string };
  return {
    name: e?.name ?? "Error",
    message: e?.message ?? String(err),
    status: e?.status ?? e?.response?.status,
    stack: e?.stack ? String(e.stack).slice(0, 4000) : undefined,
    rawResponse: typeof rawResponse === "string"
      ? rawResponse.slice(0, 1000)
      : typeof e?.rawResponse === "string"
        ? e.rawResponse.slice(0, 1000)
        : undefined,
  };
}

function tlog(reqId: string, msg: string, extra?: TraceExtra) {
  const at = stackSite(3);
  console.log(`[${ts()}] [${reqId}] ${msg}${safeExtra({ at, ...extra })}`);
}

async function traceAwait<T>(
  reqId: string,
  label: string,
  operation: () => Promise<T>,
  extra?: TraceExtra,
): Promise<T> {
  const awaitAt = stackSite(3);
  const startedAt = Date.now();
  tlog(reqId, "await started", { label, awaitAt, ...extra });
  try {
    const result = await operation();
    tlog(reqId, "await completed", { label, awaitAt, ms: Date.now() - startedAt, ...extra });
    return result;
  } catch (err) {
    tlog(reqId, "await failed", { label, awaitAt, ms: Date.now() - startedAt, ...extra, ...errorDetails(err) });
    throw err;
  }
}

async function loadMarketIntelBlock(reqId = "-"): Promise<string> {
  try {
    tlog(reqId, "market intel load started");
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !srk) {
      tlog(reqId, "market intel skipped: missing backend env");
      return "";
    }
    const supabase = createClient(url, srk, { auth: { persistSession: false } });
    const { data } = await traceAwait(reqId, "market intel query", () =>
      supabase
        .from("bark_zero_market_intel")
        .select("category, title, summary, composite, rank, bark_take, scanned_at")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("rank", { ascending: true })
        .limit(60),
    );
    const rows = (data ?? []) as Array<{
      category: string; title: string; summary: string;
      composite: number; rank: number | null; bark_take: string | null; scanned_at: string;
    }>;
    if (!rows.length) {
      tlog(reqId, "market intel load completed: zero rows");
      return "";
    }
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
    const block = `\n\n# BARK ZERO MARKET INTEL (live ranking — use this)\n` +
      `Last scanned: ${scannedAt}. Prefer these ranked items over inventing new ones. ` +
      `You may add fresh items only if they clearly beat the ranked list on composite score.\n\n${blocks}`;
    tlog(reqId, "market intel load completed", { rows: rows.length, chars: block.length });
    return block;
  } catch (err) {
    tlog(reqId, "market intel load failed", errorDetails(err));
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


const AI_TIMEOUT_MS = 30_000;

async function callModelRaw(
  messages: Array<{ role: string; content: string }>,
  key: string,
  extraSystem = "",
  reqId = "-",
  sectionName = "unknown",
  parentSignal?: AbortSignal,
): Promise<string> {
  const finalMessages = extraSystem
    ? messages.map((m, i) => (i === 0 && m.role === "system" ? { ...m, content: m.content + extraSystem } : m))
    : messages;
  const ac = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    tlog(reqId, "AI timeout fired", { section: sectionName, timeoutMs: AI_TIMEOUT_MS });
    ac.abort(new DOMException(`AI timeout after ${AI_TIMEOUT_MS}ms`, "TimeoutError"));
  }, AI_TIMEOUT_MS);
  const onParentAbort = () => {
    tlog(reqId, "request.signal.aborted fired during AI request", { section: sectionName });
    ac.abort(new DOMException("Client disconnected", "AbortError"));
  };
  if (parentSignal?.aborted) onParentAbort();
  else parentSignal?.addEventListener("abort", onParentAbort, { once: true });
  tlog(reqId, "external AI request started", { section: sectionName, timeoutMs: AI_TIMEOUT_MS });
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await traceAwait(reqId, "external AI fetch", () =>
      fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: MODEL,
          response_format: { type: "json_object" },
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: finalMessages,
        }),
        signal: ac.signal,
      }),
      { section: sectionName, timeoutMs: AI_TIMEOUT_MS },
    );
  } catch (e: any) {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
    const name = e?.name || "Error";
    const message = e?.message || String(e);
    tlog(reqId, timedOut ? "AI request timed out" : "AI fetch threw", {
      section: sectionName,
      timedOut,
      name,
      message,
      ms: Date.now() - startedAt,
      ...errorDetails(e),
    });
    throw Object.assign(new Error(`${sectionName}: ${timedOut ? "AI request timed out" : `fetch failed (${name}): ${message}`}`), {
      status: 504,
      code: timedOut ? "ai_timeout" : undefined,
      cause: e,
    });
  }
  clearTimeout(timer);
  parentSignal?.removeEventListener("abort", onParentAbort);
  tlog(reqId, "external AI request finished", { section: sectionName, status: res.status, ms: Date.now() - startedAt });
  if (!res.ok) {
    const errText = await traceAwait(reqId, "external AI error body read", () => res.text().catch(() => ""), { section: sectionName, status: res.status });
    tlog(reqId, `AI non-ok body`, { section: sectionName, status: res.status, body: errText.slice(0, 500) });
    const status = res.status === 429 || res.status === 402 ? res.status : 500;
    throw Object.assign(new Error(errText || `Gateway ${res.status}`), { status, rawResponse: errText });
  }
  let data: any;
  try {
    data = await traceAwait(reqId, "external AI response envelope JSON parse", () => res.json(), { section: sectionName, status: res.status });
  } catch (e: any) {
    tlog(reqId, `AI JSON parse (envelope) failed`, { section: sectionName, ...errorDetails(e) });
    throw Object.assign(new Error(`${sectionName}: gateway envelope not JSON: ${e?.message}`), { status: 502 });
  }
  const content = String(data.choices?.[0]?.message?.content ?? "");
  tlog(reqId, `AI response received`, { section: sectionName, contentLen: content.length });
  return content;
}

async function callModel<T = any>(
  messages: Array<{ role: string; content: string }>,
  key: string,
  sectionName: string,
  reqId = "-",
  parentSignal?: AbortSignal,
): Promise<T> {
  tlog(reqId, "AI phase started", { section: sectionName });
  try {
    const parsed = await traceAwait(reqId, "AI phase JSON extraction", () =>
      extractJsonWithRetry<T>((strictReminder) =>
        callModelRaw(messages, key, strictReminder, reqId, sectionName, parentSignal),
        { sectionName, maxAttempts: 3 },
      ),
      { section: sectionName },
    );
    tlog(reqId, "JSON parsed", { section: sectionName });
    tlog(reqId, "AI phase finished", { section: sectionName });
    return parsed;
  } catch (err) {
    tlog(reqId, "AI phase failed", { section: sectionName, ...errorDetails(err) });
    throw err;
  }
}

async function runLandscapeScan(
  brief: string,
  contextBlock: string,
  marketIntelBlock: string,
  key: string,
  sectionName: string,
  reqId = "-",
  parentSignal?: AbortSignal,
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
    reqId,
    parentSignal,
  );
}

async function runFallbackNarratives(
  brief: string,
  contextBlock: string,
  key: string,
  reqId = "-",
  parentSignal?: AbortSignal,
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
    reqId,
    parentSignal,
  );
}



Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  tlog(reqId, "request received", { method: req.method, url: req.url });
  if (req.method === "OPTIONS") {
    tlog(reqId, "OPTIONS response returned");
    return new Response(null, { headers: corsHeaders });
  }
  const _auth = requireOwner(req);
  if (_auth) {
    tlog(reqId, "auth rejected");
    return _auth;
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    tlog(reqId, "missing LOVABLE_API_KEY");
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let brief = "";
  try {
    const body = await traceAwait(reqId, "request body JSON parse", () => req.json());
    brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  } catch (e: any) {
    tlog(reqId, "body parse failed", errorDetails(e));
  }
  if (!brief) {
    tlog(reqId, "validation failed: empty brief");
    return new Response(JSON.stringify({ error: "brief must be a non-empty string" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  tlog(reqId, "request validated", { briefLen: brief.length });

  // Client disconnect surveillance
  try {
    req.signal.addEventListener("abort", () => {
      tlog(reqId, "request.signal.aborted fired", { aborted: req.signal.aborted, reason: String(req.signal.reason ?? "") });
    });
  } catch { /* ignore */ }

  const stream = new ReadableStream({
    async start(controller) {
      tlog(reqId, "SSE stream created");
      const encoder = new TextEncoder();

      let closed = false;
      let eventCount = 0;
      let pingCount = 0;
      const send = (phase: string, payload: Record<string, unknown> = {}) => {
        if (closed) { tlog(reqId, "send skipped (closed)", { phase }); return; }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, ...payload })}\n\n`));
          eventCount++;
          tlog(reqId, "SSE event written", { phase, eventCount });
        } catch (e) {
          tlog(reqId, "SSE event write failed", { phase, ...errorDetails(e) });
          closed = true;
        }
      };
      const ping = () => {
        if (closed) { tlog(reqId, "heartbeat skipped (closed)"); return; }
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
          pingCount++;
          tlog(reqId, "heartbeat sent", { pingCount });
        } catch (e) {
          tlog(reqId, "heartbeat write failed", { pingCount, ...errorDetails(e) });
          closed = true;
        }
      };
      const closeOnce = (where: string) => {
        if (closed) { tlog(reqId, "closeOnce noop", { where }); return; }
        closed = true;
        try { controller.close(); tlog(reqId, "controller.close() called", { where }); }
        catch (e: any) { tlog(reqId, "controller.close() threw", { where, message: e?.message }); }
      };

      ping(); // first bytes flushed
      tlog(reqId, "first bytes flushed");
      const heartbeat = setInterval(ping, 10_000);


      try {
        const [contextBlock, marketIntelBlock] = await traceAwait(reqId, "context + market intel load", () => Promise.all([
          traceAwait(reqId, "Bark Zero context load", () => loadBarkZeroContext()),
          loadMarketIntelBlock(reqId),
        ]));
        const hasLiveIntel = marketIntelBlock.trim().length > 0;
        tlog(reqId, "context + market intel ready", { contextChars: contextBlock.length, marketIntelChars: marketIntelBlock.length, hasLiveIntel });

        // ————— Step 1: Scan Landscape (with retry + AI fallback) —————
        send("landscape_scan", { hasLiveIntel });


        let landscape: any = null;
        let landscapeSource: "live" | "ai_estimate" = hasLiveIntel ? "live" : "ai_estimate";
        let fallbackReason: string | null = null;

        // Attempt 1
        try {
          landscape = await traceAwait(reqId, "run landscape scan attempt 1", () =>
            runLandscapeScan(brief, contextBlock, marketIntelBlock, key, "Step 1: Narrative analysis", reqId, req.signal),
          );
        } catch (e) {
          fallbackReason = `landscape scan attempt 1 threw: ${(e as Error).message}`;
          tlog(reqId, "landscape scan attempt 1 caught", { fallbackReason, ...errorDetails(e) });
        }

        let narratives: any[] = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
        tlog(reqId, "landscape scan attempt 1 evaluated", { narratives: narratives.length, rejected: landscape?.rejected === true });

        // Attempt 2 if empty (and not an explicit rejection)
        if (!landscape?.rejected && narratives.length === 0) {
          const reason = fallbackReason ?? "landscape scan attempt 1 returned zero narratives (empty response or filtering removed all candidates)";
          tlog(reqId, "zero narratives on attempt 1; retrying", { reason });
          try {
            landscape = await traceAwait(reqId, "run landscape scan attempt 2", () =>
              runLandscapeScan(brief, contextBlock, marketIntelBlock, key, "Step 1 retry: Narrative analysis", reqId, req.signal),
            );
            narratives = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
            tlog(reqId, "landscape scan attempt 2 evaluated", { narratives: narratives.length, rejected: landscape?.rejected === true });
            if (narratives.length === 0) {
              fallbackReason = "retry also returned zero narratives";
            }
          } catch (e) {
            fallbackReason = `landscape scan retry threw: ${(e as Error).message}`;
            tlog(reqId, "landscape scan attempt 2 caught", { fallbackReason, ...errorDetails(e) });
          }
        }

        // AI-estimate fallback — never let the pipeline stop for lack of narratives.
        if (!landscape?.rejected && narratives.length === 0) {
          tlog(reqId, "falling back to AI-estimated narratives", { fallbackReason: fallbackReason ?? "unknown" });
          landscapeSource = "ai_estimate";
          try {
            landscape = await traceAwait(reqId, "run fallback narratives", () =>
              runFallbackNarratives(brief, contextBlock, key, reqId, req.signal),
            );
            narratives = Array.isArray(landscape?.narratives) ? landscape.narratives : [];
            tlog(reqId, "fallback narratives evaluated", { narratives: narratives.length });
          } catch (e) {
            const msg = `AI-estimate fallback failed: ${(e as Error).message}`;
            tlog(reqId, "fallback narratives caught", { message: msg, fallbackReason, ...errorDetails(e) });
            send("error", { error: msg, fallbackReason, ...errorDetails(e) });
            closeOnce("inline");
            return;
          }
        }

        if (landscape?.rejected === true) {
          send("rejected", {
            reason: String(landscape?.reason ?? "Nothing in the current landscape clears the bar."),
            landscape: { narratives, chosenId: null, rationale: "", source: landscapeSource },
          });
          closeOnce("inline");
          return;
        }

        const chosen =
          narratives.find((n: any) => n?.id === landscape?.chosenId) ??
          narratives.slice().sort((a: any, b: any) => (b?.composite ?? 0) - (a?.composite ?? 0))[0];
        tlog(reqId, "narrative chosen evaluated", { chosenId: chosen?.id, composite: chosen?.composite, source: landscapeSource });

        if (!chosen) {
          send("error", {
            error: "Landscape pipeline could not produce any narrative even after AI-estimate fallback",
            fallbackReason,
            landscape,
          });
          closeOnce("inline");
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
        const tokenProposal = await traceAwait(reqId, "run token proposal phase", () =>
          callModel(
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
            "Step 3: Token proposal", reqId, req.signal,
          ),
        );
        send("token", { tokenProposal });


        // ————— Step 4: Generate Marketing —————
        const marketing = await traceAwait(reqId, "run marketing phase", () =>
          callModel(
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
            "Step 4: Marketing", reqId, req.signal,
          ),
        );
        send("marketing", { marketing });

        // ————— Step 5: Generate X Thread —————
        const xthread = await traceAwait(reqId, "run X thread phase", () =>
          callModel(
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
            "Step 5: X Thread", reqId, req.signal,
          ),
        );
        send("xthread", { xthread });

        // ————— Step 6: Generate Telegram —————
        const telegram = await traceAwait(reqId, "run Telegram phase", () =>
          callModel(
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
            "Step 6: Telegram", reqId, req.signal,
          ),
        );
        send("telegram", { telegram });

        // ————— Step 7: Launch Assets —————
        const launchAssets = await traceAwait(reqId, "run launch assets phase", () =>
          callModel(
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
            "Step 7: Launch assets", reqId, req.signal,
          ),
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
        tlog(reqId, "stream completed", { eventCount, pingCount });
        clearInterval(heartbeat);
        closeOnce("success");
      } catch (err: any) {
        clearInterval(heartbeat);
        const message = err instanceof Error ? err.message : String(err);
        const stack = err?.stack ? String(err.stack) : "";
        tlog(reqId, "stream error caught", {
          name: err?.name,
          message,
          status: err?.status,
          stack: stack.slice(0, 1500),
          rawResponse: typeof err?.rawResponse === "string" ? err.rawResponse.slice(0, 500) : undefined,
        });
        send("error", {
          error: message,
          stack: stack.slice(0, 2000),
          rawResponse: typeof err?.rawResponse === "string" ? err.rawResponse.slice(0, 2000) : undefined,
          name: err?.name,
          status: err?.status,
          code: err?.code,
        });
        closeOnce("error");
      }



    },
    cancel(reason) {
      tlog(reqId, "stream cancelled", { reason: String(reason ?? "") });
    },
  });

  const response = new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
  tlog(reqId, "response returned");
  return response;
});


