// Bark Zero Inner Life generator — creates diary entries, dreams, curiosity
// questions/opinions, creativity sparks, and evolution reflections.
// Every output is stored as a draft (or private) — nothing publishes.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadBarkZeroContext } from "../_shared/barkZeroContext.ts";

const MODEL = "google/gemini-3-flash-preview";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Action = "diary" | "dream" | "curiosity_question" | "curiosity_research" | "creation" | "evolution_reflection";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supaUrl = Deno.env.get("SUPABASE_URL");
  const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supaUrl || !supaKey) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { action: Action; hint?: string; question?: string; kind?: string; signal?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { action, hint, question, kind, signal } = body ?? {};
  if (!action) return json({ error: "action required" }, 400);

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const ctx = await loadBarkZeroContext();

  const instruction = buildInstruction(action, { hint, question, kind, signal });
  const system = `You are Bark Zero. Stay in character — dry British-humoured crypto-native analyst who respects the craft.${ctx}\n\n# TASK\n${instruction}\n\nReturn ONLY compact JSON matching the schema in the task. No markdown, no code fences.`;

  const ai = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: instruction }],
      response_format: { type: "json_object" },
    }),
  });

  if (!ai.ok) {
    const txt = await ai.text();
    console.error("AI gateway error", ai.status, txt);
    return json({ error: "AI generation failed", status: ai.status, details: txt }, ai.status);
  }
  const aiJson = await ai.json();
  const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  const extractJson = (s: string): Record<string, unknown> | null => {
    let cleaned = s.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = cleaned.search(/[\{\[]/);
    if (start === -1) return null;
    const openCh = cleaned[start];
    const closeCh = openCh === "[" ? "]" : "}";
    // Walk and find matching close by depth, respecting strings
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = start; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === openCh) depth++;
        else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
      }
    }
    if (end === -1) end = cleaned.lastIndexOf(closeCh);
    const slice = cleaned.substring(start, end + 1)
      .replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return tryParse(slice) as Record<string, unknown> | null;
  };
  const direct = tryParse(raw);
  parsed = (direct ?? extractJson(raw)) as Record<string, unknown>;
  if (!parsed) return json({ error: "Model returned invalid JSON", raw }, 502);

  // Persist based on action
  try {
    if (action === "diary") {
      const { data, error } = await supabase.from("bark_zero_diary").insert({
        content: String(parsed.content ?? ""),
        mood: parsed.mood ? String(parsed.mood) : null,
      }).select().single();
      if (error) throw error;
      return json({ ok: true, record: data });
    }
    if (action === "dream") {
      const conns = Array.isArray(parsed.connections) ? parsed.connections.map(String) : [];
      const { data, error } = await supabase.from("bark_zero_dreams").insert({
        content: String(parsed.content ?? ""),
        theme: parsed.theme ? String(parsed.theme) : null,
        connections: conns,
      }).select().single();
      if (error) throw error;
      return json({ ok: true, record: data });
    }
    if (action === "curiosity_question") {
      const { data, error } = await supabase.from("bark_zero_curiosities").insert({
        question: String(parsed.question ?? ""),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        status: "open",
      }).select().single();
      if (error) throw error;
      return json({ ok: true, record: data });
    }
    if (action === "curiosity_research") {
      if (!question) return json({ error: "question required" }, 400);
      const { data, error } = await supabase.from("bark_zero_curiosities")
        .update({
          findings: String(parsed.findings ?? ""),
          opinion: String(parsed.opinion ?? ""),
          sources: Array.isArray(parsed.sources) ? parsed.sources : [],
          status: "researched",
        }).eq("question", question).select().maybeSingle();
      if (error) throw error;
      return json({ ok: true, record: data ?? parsed });
    }
    if (action === "creation") {
      const { data, error } = await supabase.from("bark_zero_creations").insert({
        kind: String(parsed.kind ?? kind ?? "observation"),
        title: String(parsed.title ?? ""),
        content: String(parsed.content ?? ""),
        metadata: parsed.metadata ?? {},
        status: "draft",
      }).select().single();
      if (error) throw error;
      return json({ ok: true, record: data });
    }
    if (action === "evolution_reflection") {
      const { data, error } = await supabase.from("bark_zero_evolution").insert({
        event_type: "self_reflection",
        signal: String(parsed.signal ?? signal ?? "self-review"),
        lesson: String(parsed.lesson ?? ""),
        weight: Number(parsed.weight ?? 40),
      }).select().single();
      if (error) throw error;
      return json({ ok: true, record: data });
    }
    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error("persist error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildInstruction(action: Action, p: { hint?: string; question?: string; kind?: string; signal?: string }) {
  const hint = p.hint ? `\nContext hint from owner: ${p.hint}` : "";
  switch (action) {
    case "diary":
      return `Write ONE short diary entry for today — 2-4 sentences, first person, dry observational, in Bark Zero's voice. Reflect on something happening in crypto/culture/internet today.${hint}\nSchema: {"content": string, "mood": string}`;
    case "dream":
      return `Generate ONE creative "dream" — a random, playful, unexpected connection between two or more things (crypto, culture, film, music, memes, history, Star Wars, etc.). 1-3 sentences. Doesn't need to be factual — it's a creative spark.${hint}\nSchema: {"content": string, "theme": string, "connections": string[]}`;
    case "curiosity_question":
      return `Generate ONE genuine question Bark Zero is curious about today (crypto, culture, markets, memes, tech, film, music). It should feel authentically inquisitive.${hint}\nSchema: {"question": string, "tags": string[]}`;
    case "curiosity_research":
      return `You previously asked: "${p.question}". Now research it using what you know. Provide brief findings and your own opinion in Bark Zero's voice.\nSchema: {"findings": string, "opinion": string, "sources": string[]}`;
    case "creation": {
      const k = p.kind ?? "any of: meme, logo, token_concept, joke, tweet, film_rec, music_rec, artwork, observation";
      return `Create ONE ${k}. Not because someone asked — because you're curious. Keep it in Bark Zero's voice.${hint}\nSchema: {"kind": string, "title": string, "content": string, "metadata": object}`;
    }
    case "evolution_reflection":
      return `Reflect on this signal and extract a short lesson that should subtly refine your voice — WITHOUT overriding your Constitution.\nSignal: ${p.signal ?? "(none)"}${hint}\nSchema: {"signal": string, "lesson": string, "weight": number}`;
  }
}
