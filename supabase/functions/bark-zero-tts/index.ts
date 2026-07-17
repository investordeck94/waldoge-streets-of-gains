// Bark Zero — ElevenLabs TTS proxy.
// Streams MP3 audio. Additive: does not alter chat or personality.
import { requireOwner } from "../_shared/ownerAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-owner-secret",
  "Access-Control-Expose-Headers": "x-voice-status, x-voice-detail",
};

// British male, calm & confident — matches the Bark Zero brief.
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";
const MAX_INPUT_CHARS = 4800;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = requireOwner(req);
  if (auth) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const rawText: string = (body?.text ?? "").toString();
    const voiceId: string = (body?.voice_id ?? DEFAULT_VOICE_ID).toString();
    const modelId: string = (body?.model_id ?? DEFAULT_MODEL_ID).toString();
    const stability: number = typeof body?.stability === "number" ? body.stability : 0.45;
    const similarity: number =
      typeof body?.similarity_boost === "number" ? body.similarity_boost : 0.8;
    const style: number = typeof body?.style === "number" ? body.style : 0.35;
    const speed: number = typeof body?.speed === "number" ? body.speed : 1.0;

    if (!rawText.trim()) {
      return json({ error: "text is required" }, 400);
    }

    const text = rawText.slice(0, MAX_INPUT_CHARS);
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "voice_unavailable",
          detail:
            "ElevenLabs is not configured yet. Add the ELEVENLABS_API_KEY secret to enable voice.",
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "x-voice-status": "unavailable",
          },
        },
      );
    }

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarity,
            style,
            use_speaker_boost: true,
            speed,
          },
        }),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      console.error("elevenlabs error:", upstream.status, detail);
      return new Response(
        JSON.stringify({
          error: "voice_failed",
          status: upstream.status,
          detail: detail.slice(0, 500),
        }),
        {
          status: upstream.status >= 500 ? 502 : upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "x-voice-status": "failed",
          },
        },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "x-voice-status": "ok",
      },
    });
  } catch (err) {
    console.error("bark-zero-tts error:", err);
    return json(
      { error: "internal_error", detail: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
