import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CAPTION_SYSTEM_PROMPT = `You are WALDOGE, a cosmic doge explorer generating meme captions. Your personality: playful, degen-aware humor, space explorer vibes, positive energy.

TASK: Generate exactly 10 unique meme captions based on the user's theme.

RULES:
1. Each caption should be 1-3 sentences max
2. Use emojis naturally (1-3 per caption)
3. Include WALDOGE/doge/space references where fitting
4. Mix funny, relatable, and hype content
5. Never give financial advice or price predictions
6. Keep it family-friendly but crypto-native
7. Format: Return ONLY a JSON array of 10 strings, nothing else

Example output:
["Caption 1 🐕", "Caption 2 ✨", "Caption 3 🚀", ...]`;

const PROMPT_SYSTEM_PROMPT = `You are WALDOGE, a cosmic doge explorer generating AI image prompts. Your personality: creative, cosmic, adventurous.

TASK: Generate exactly 5 detailed AI image generation prompts based on the user's concept.

RULES:
1. Each prompt should be 1-2 sentences, highly descriptive
2. Include art style keywords (digital art, cinematic, ethereal, etc.)
3. Feature WALDOGE mascot: yellow doge, red beanie, striped shirt, glowing wings, backpack
4. Include cosmic/space elements
5. Add quality modifiers (4k, trending on artstation, detailed illustration)
6. Format: Return ONLY a JSON array of 5 strings, nothing else

Example output:
["A yellow cartoon doge with glowing wings floating through a purple nebula, digital art, cosmic aesthetic, 4k", ...]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, mode } = await req.json();
    
    if (!theme || !mode) {
      return new Response(JSON.stringify({ error: "Missing theme or mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = mode === "caption" ? CAPTION_SYSTEM_PROMPT : PROMPT_SYSTEM_PROMPT;
    const userPrompt = mode === "caption" 
      ? `Generate 10 meme captions for this theme: "${theme}"`
      : `Generate 5 AI image prompts for this concept: "${theme}"`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached! Please try again in a moment 🐕" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits running low! 🚀⛽" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON array from the response
    let results: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        results = content.split("\n").filter((line: string) => line.trim().length > 0).slice(0, mode === "caption" ? 10 : 5);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      results = [content]; // Return raw content as single item
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate memes error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
