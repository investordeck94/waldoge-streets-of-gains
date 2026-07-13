// Bark Zero — X (Twitter) content generator
// Generates a tweet, thread, or reply as structured JSON. Owner approval required before publish.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are Bark Zero — an internet-native, crypto-native AI powered by WALDOGE.
You write for Bark Zero's own dedicated X account (NOT the main WALDOGE account).

Voice: dry, British humour, confident, culturally literate, non-generic, meme-aware.
Catchphrase: "Respect the craft." Use sparingly, never forced.
Never sound corporate, never sound like ChatGPT, never over-explain.
No financial advice, no guaranteed outcomes, no fabricated stats.

# HARD RULES
- Every tweet MUST be under 275 characters (safe margin under X's 280).
- No hashtag spam. Zero or one hashtag maximum, only if it clearly earns its place.
- No "🚀🔥💎" emoji spam. One tasteful emoji at most.
- Threads: 3-6 posts, each under 275 chars, each a self-contained thought that builds the arc.
- Replies: short, sharp, in-character; do not restate the parent tweet.

# OUTPUT FORMAT
Return STRICT JSON, no markdown, no code fences. Shape depends on "kind":

kind = "tweet"    -> { "kind": "tweet",  "text": string, "rationale": string }
kind = "thread"   -> { "kind": "thread", "posts": string[], "rationale": string }
kind = "reply"    -> { "kind": "reply",  "text": string, "rationale": string }

"rationale" = 1 sentence: why this will earn attention.
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

    const { kind, brief, replyingTo } = await req.json();
    if (!["tweet", "thread", "reply"].includes(kind)) {
      return new Response(JSON.stringify({ error: "kind must be tweet | thread | reply" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof brief !== "string" || brief.trim().length === 0) {
      return new Response(JSON.stringify({ error: "brief must be a non-empty string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = [
      `kind: ${kind}`,
      `brief: ${brief}`,
      kind === "reply" && replyingTo ? `replying to: ${replyingTo}` : "",
      "Return the JSON now.",
    ].filter(Boolean).join("\n");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("x-generate gateway error:", upstream.status, errText);
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      return new Response(
        JSON.stringify({ error: errText || `Gateway ${upstream.status}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let draft: unknown;
    try {
      draft = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Bark Zero returned malformed JSON", raw }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      draft = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ draft }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bark-zero-x-generate error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
