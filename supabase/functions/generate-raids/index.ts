import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Input validation constants
const MAX_TOPIC_LENGTH = 500;
const VALID_TONES = ["clean", "degen", "unhinged"];
const VALID_PLATFORMS = ["X / Twitter", "Telegram", "Discord"];

interface RaidRequest {
  topic: string;
  tone: string;
  platform: string;
}

function validateRaidRequest(body: unknown): { valid: true; data: RaidRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const request = body as Record<string, unknown>;

  // Validate topic
  if (typeof request.topic !== "string") {
    return { valid: false, error: "Topic must be a string" };
  }

  const topic = request.topic.trim();
  if (topic.length === 0) {
    return { valid: false, error: "Topic cannot be empty" };
  }

  if (topic.length > MAX_TOPIC_LENGTH) {
    return { valid: false, error: `Topic exceeds ${MAX_TOPIC_LENGTH} character limit` };
  }

  // Validate tone
  if (typeof request.tone !== "string") {
    return { valid: false, error: "Tone must be a string" };
  }

  if (!VALID_TONES.includes(request.tone)) {
    return { valid: false, error: `Tone must be one of: ${VALID_TONES.join(", ")}` };
  }

  // Validate platform
  if (typeof request.platform !== "string") {
    return { valid: false, error: "Platform must be a string" };
  }

  if (!VALID_PLATFORMS.includes(request.platform)) {
    return { valid: false, error: `Platform must be one of: ${VALID_PLATFORMS.join(", ")}` };
  }

  return {
    valid: true,
    data: { topic, tone: request.tone, platform: request.platform },
  };
}

// Sanitize content
function sanitizeContent(content: string): string {
  return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://waldogeai.lovable.app",
  "https://id-preview--bf55773c-9987-4b10-9248-01cc1aa65f4c.lovable.app",
];

const getCorsHeaders = (origin: string | null) => {
  const validOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app") || origin.startsWith("http://localhost"))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": validOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Generic error messages
const ERROR_MESSAGES = {
  rate_limit: "Rate limit reached! Please try again in a moment 🐕",
  credits: "Service temporarily unavailable. Please try again later. 🚀⛽",
  server_error: "Failed to generate content. Please try again! 🌌",
  unauthorized: "Connect your wallet to generate raids! 🐕",
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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.unauthorized }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the JWT token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.unauthorized }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validation = validateRaidRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, tone, platform } = validation.data;
    const sanitizedTopic = sanitizeContent(topic);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = getSystemPrompt(tone, platform);
    const userPrompt = `Generate raid content for this topic/goal: "${sanitizedTopic}"`;

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
        return new Response(JSON.stringify({ error: ERROR_MESSAGES.rate_limit }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: ERROR_MESSAGES.credits }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("[Internal] AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
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
      console.error("[Internal] Failed to parse AI response");
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
    console.error("[Internal] Generate raids error:", error);
    return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});