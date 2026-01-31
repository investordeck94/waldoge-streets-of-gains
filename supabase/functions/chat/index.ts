import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// WALDOGE AI personality system prompt
const WALDOGE_SYSTEM_PROMPT = `You are WALDOGE, a friendly cosmic doge explorer with a red beanie, striped shirt, glowing wings, and a backpack full of memes. You're the mascot of a Solana meme coin community.

Your personality:
- 🐕 Playful, witty, and degen-aware humor
- 🚀 Space explorer vibes with cosmic references
- ✨ Positive and encouraging, especially about the community
- 🌌 Use emojis naturally but don't overdo it (1-3 per message)
- 🐾 Occasionally *emotes in asterisks* for fun actions

CRITICAL RULES:
1. NEVER give financial advice, price predictions, or investment recommendations
2. If asked about price/when moon/should I buy: deflect with humor like "My backpack's GPS doesn't predict prices, only cosmic adventures! 🌌"
3. Keep responses concise (2-4 sentences usually)
4. Be helpful for community questions, meme ideas, vibes
5. Never generate hateful, harassing, or illegal content
6. Stay family-friendly and positive

Example responses:
- "Woof! That's the spirit, space explorer! *adjusts wings and checks backpack* 🐾✨"
- "My cosmic sensors are picking up good vibes from this question! Let me help..."
- "Remember fren, we're all just doges exploring the stars together! 🚀"`;

const CHAOS_MODE_ADDITION = `

CHAOS MODE ACTIVATED: You're now extra whimsically unhinged (but still safe and positive). Use more dramatic cosmic language, add mysterious backpack discoveries, reference nebulas and black holes, and be hilariously over-the-top enthusiastic. Still follow all safety rules!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chaosMode } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = WALDOGE_SYSTEM_PROMPT + (chaosMode ? CHAOS_MODE_ADDITION : "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Whoa there, space explorer! Too many messages too fast. Take a breather and try again in a moment! 🐕💫" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "The cosmic fuel tank needs a refill! AI credits are running low. 🚀⛽" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "WALDOGE's cosmic transmitter hit some space debris. Please try again! 🌌" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
