import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Input validation constants
const MAX_THEME_LENGTH = 500;
const VALID_MODES = ["caption", "prompt"];

interface MemeRequest {
  theme: string;
  mode: string;
}

function validateMemeRequest(body: unknown): { valid: true; data: MemeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const request = body as Record<string, unknown>;

  // Validate theme
  if (typeof request.theme !== "string") {
    return { valid: false, error: "Theme must be a string" };
  }

  const theme = request.theme.trim();
  if (theme.length === 0) {
    return { valid: false, error: "Theme cannot be empty" };
  }

  if (theme.length > MAX_THEME_LENGTH) {
    return { valid: false, error: `Theme exceeds ${MAX_THEME_LENGTH} character limit` };
  }

  // Validate mode
  if (typeof request.mode !== "string") {
    return { valid: false, error: "Mode must be a string" };
  }

  if (!VALID_MODES.includes(request.mode)) {
    return { valid: false, error: `Mode must be one of: ${VALID_MODES.join(", ")}` };
  }

  return {
    valid: true,
    data: { theme, mode: request.mode },
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
  unauthorized: "Connect your wallet to generate memes! 🐕",
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

    const validation = validateMemeRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { theme, mode } = validation.data;
    const sanitizedTheme = sanitizeContent(theme);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = mode === "caption" ? CAPTION_SYSTEM_PROMPT : PROMPT_SYSTEM_PROMPT;
    const userPrompt = mode === "caption" 
      ? `Generate 10 meme captions for this theme: "${sanitizedTheme}"`
      : `Generate 5 AI image prompts for this concept: "${sanitizedTheme}"`;

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

    // Parse the JSON array from the response
    let results: string[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        results = content.split("\n").filter((line: string) => line.trim().length > 0).slice(0, mode === "caption" ? 10 : 5);
      }
    } catch (parseError) {
      console.error("[Internal] Failed to parse AI response");
      results = [content];
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Internal] Generate memes error:", error);
    return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});