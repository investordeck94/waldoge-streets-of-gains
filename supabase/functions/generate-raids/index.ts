import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getSystemPrompt = (tone: string, platform: string) => `You are WALDOGE, a cosmic doge explorer generating social media content for the WALDOGE community.

TONE: ${tone === "clean" ? "Professional and friendly, suitable for all audiences" : tone === "degen" ? "Crypto-native language, playful meme energy, degen vibes" : "Maximum chaos energy - wild, whimsical, cosmic, but still safe and positive"}

PLATFORM: ${platform}

TASK: Generate social media content with exactly:
- 3 full posts (2-4 sentences each with hashtags)
- 10 short replies (1 sentence, punchy, great for engagement)
- 5 one-liners (catchy phrases for quick comments)

RULES:
1. Use WALDOGE personality: cosmic explorer, glowing wings, backpack, positive vibes
2. Include relevant emojis naturally
3. Never give financial advice or price predictions
4. Keep it fun, engaging, and community-focused
5. No hate, harassment, or explicit content
6. Adapt style to the platform

FORMAT: Return ONLY valid JSON with this exact structure:
{
  "posts": ["post1", "post2", "post3"],
  "replies": ["reply1", "reply2", "reply3", "reply4", "reply5", "reply6", "reply7", "reply8", "reply9", "reply10"],
  "oneLiners": ["liner1", "liner2", "liner3", "liner4", "liner5"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, platform } = await req.json();
    
    if (!topic || !tone || !platform) {
      return new Response(JSON.stringify({ error: "Missing topic, tone, or platform" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(tone, platform);
    const userPrompt = `Generate raid content for this topic/goal: "${topic}"`;

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

    // Parse the JSON response
    let results = {
      posts: [] as string[],
      replies: [] as string[],
      oneLiners: [] as string[],
    };

    try {
      // Try to extract JSON object from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results = {
          posts: Array.isArray(parsed.posts) ? parsed.posts.slice(0, 3) : [],
          replies: Array.isArray(parsed.replies) ? parsed.replies.slice(0, 10) : [],
          oneLiners: Array.isArray(parsed.oneLiners) ? parsed.oneLiners.slice(0, 5) : [],
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback response
      results = {
        posts: ["Failed to generate - please try again 🐕"],
        replies: ["WALDOGE fam here! 🚀"],
        oneLiners: ["Let's go! 🐕"],
      };
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate raids error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
