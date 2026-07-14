// Bark Zero — Market Intelligence Scanner
// Continuously scans AI narratives, DogeOS ecosystem, Anoncoin launches,
// successful memes, and X trends. Scores each item, ranks them, and upserts
// into public.bark_zero_market_intel. The Launch Lab reads this ranking.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const CATEGORIES = ["ai", "dogeos", "anoncoin", "meme", "x"] as const;
type Category = typeof CATEGORIES[number];

const SYSTEM = `
You are Bark Zero — an internet-native, crypto-native market intelligence engine.
You are OPINIONATED and never generic. You reject fluff.

# YOUR JOB (this call)
Scan the CURRENT state of ONE category and return the top 5-8 concrete items
Bark should be tracking. Score each 1-100 on:
  attention, originality, competition (LOWER = better = less crowded),
  viralPotential, communityStrength.
Composite = round(0.25*attention + 0.20*originality + 0.20*(101 - competition)
                  + 0.20*viralPotential + 0.15*communityStrength).

Add "barkTake" — 1-2 sentences, sharp, opinionated, dryly funny. No fabricated stats.
No financial advice. Reject weak items instead of padding the list.

# OUTPUT — STRICT JSON, no markdown, no code fences
{
  "items": [
    {
      "slug": string,        // short kebab-case id, stable across scans if same thing
      "title": string,       // 3-6 words
      "summary": string,     // 1-2 sentences of what this IS right now
      "source": string,      // where you'd look to confirm (e.g. "X", "DogeOS docs", "Anoncoin feed")
      "scores": {
        "attention": number, "originality": number, "competition": number,
        "viralPotential": number, "communityStrength": number
      },
      "composite": number,
      "barkTake": string
    }
  ]
}
Only JSON. No prose before or after.
`.trim();

const CATEGORY_BRIEF: Record<Category, string> = {
  ai: "AI narratives: agents, autonomous, inference, GPU, robotics, on-chain AI.",
  dogeos: "DogeOS ecosystem: apps, tooling, launches, culture, notable devs.",
  anoncoin: "Anoncoin ecosystem: recent launches, notable tokens, protocol updates, community moves.",
  meme: "Successful memes: what is winning attention on crypto Twitter / broader internet culture right now.",
  x: "X trends: what specific crypto/AI/culture conversations are spiking on X right now.",
};

async function callModel(userContent: string, key: string) {
  const context = await loadBarkZeroContext();
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM + context },
        { role: "user", content: userContent },
      ],
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
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (!m) throw Object.assign(new Error("Model returned malformed JSON"), { status: 502 });
    return JSON.parse(m[0]);
  }
}

function slugify(input: string): string {
  return String(input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!key || !url || !srk) {
      return new Response(JSON.stringify({ error: "Missing server env" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requested: Category[] = Array.isArray(body?.categories) && body.categories.length
      ? body.categories.filter((c: string): c is Category => (CATEGORIES as readonly string[]).includes(c))
      : [...CATEGORIES];

    const supabase = createClient(url, srk, { auth: { persistSession: false } });
    const scannedAt = new Date().toISOString();
    const summary: Record<string, { count: number; error?: string }> = {};

    for (const category of requested) {
      try {
        const parsed = await callModel(
          `Category: ${category}\nBrief: ${CATEGORY_BRIEF[category]}\nReturn the ranked items JSON.`,
          key,
        );
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        if (!items.length) { summary[category] = { count: 0 }; continue; }

        const rows = items
          .map((it: any, idx: number) => {
            const slug = slugify(it?.slug ?? it?.title ?? `item-${idx}`);
            const composite = Number.isFinite(Number(it?.composite))
              ? Math.max(0, Math.min(100, Math.round(Number(it.composite))))
              : 0;
            return {
              category,
              slug,
              title: String(it?.title ?? slug).slice(0, 200),
              summary: String(it?.summary ?? "").slice(0, 1200),
              source: it?.source ? String(it.source).slice(0, 200) : null,
              scores: it?.scores ?? {},
              composite,
              bark_take: it?.barkTake ? String(it.barkTake).slice(0, 800) : null,
              is_active: true,
              scanned_at: scannedAt,
            };
          })
          .sort((a: any, b: any) => b.composite - a.composite)
          .map((r: any, i: number) => ({ ...r, rank: i + 1 }));

        // Deactivate previous items in this category, then upsert fresh set.
        await supabase.from("bark_zero_market_intel")
          .update({ is_active: false })
          .eq("category", category);

        const { error: upErr } = await supabase
          .from("bark_zero_market_intel")
          .upsert(rows, { onConflict: "category,slug" });
        if (upErr) throw upErr;

        summary[category] = { count: rows.length };
      } catch (e) {
        console.error(`scan ${category} failed:`, e);
        summary[category] = { count: 0, error: (e as Error).message ?? String(e) };
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scannedAt, summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("bark-zero-market-scan error:", err);
    const status = typeof err?.status === "number" ? err.status : 500;
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
