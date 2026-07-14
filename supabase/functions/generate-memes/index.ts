import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyTierAndUsage } from "../_shared/tierVerification.ts";

// Input validation constants
const MAX_THEME_LENGTH = 500;
const MAX_WALLET_LENGTH = 50;
const MIN_WALLET_LENGTH = 32; // Require real Solana wallet address; match chat/raids
const VALID_MODES = ["caption", "prompt", "image"];

interface MemeRequest {
  theme: string;
  mode: string;
  walletAddress?: string;
  imageData?: string;
}

function validateMemeRequest(body: unknown): { valid: true; data: MemeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const request = body as Record<string, unknown>;

  // Require a real wallet address (32-50 chars). No anonymous bypass.
  if (typeof request.walletAddress !== "string") {
    return { valid: false, error: "Wallet address is required" };
  }
  const walletAddress = request.walletAddress;
  if (walletAddress.length < MIN_WALLET_LENGTH || walletAddress.length > MAX_WALLET_LENGTH) {
    return { valid: false, error: "Valid wallet address is required" };
  }

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

  // Validate imageData if provided
  const imageData = typeof request.imageData === "string" ? request.imageData : undefined;

  return {
    valid: true,
    data: { theme, mode: request.mode, walletAddress, imageData },
  };
}

// Sanitize content - remove control characters
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
  invalid_request: "Invalid request. Please provide theme, mode, and wallet address.",
  tier_blocked: "Hold WALDOGE tokens to unlock meme generation! 🐕✨",
  usage_limit: "Daily meme generation limit reached! Come back tomorrow, space explorer! 🌌",
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

const IMAGE_SYSTEM_PROMPT = `You are WALDOGE, a cosmic doge meme artist. Generate a fun, shareable meme image.

CHARACTER: WALDOGE is a yellow shiba inu doge with:
- Red beanie hat
- Striped shirt
- Glowing butterfly/cosmic wings
- Adventurer's backpack
- Cosmic explorer vibes

STYLE: Fun, meme-worthy, internet culture, space/cosmic themes, vibrant colors, cartoon/digital art style.

Generate an image based on the user's prompt. Make it shareable and engaging!`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.invalid_request }), {
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

    const { theme, mode, walletAddress, imageData } = validation.data;

    // Server-side tier verification - always enforced (no anonymous bypass)
    const tierInfo = await verifyTierAndUsage(walletAddress, "memeGenerator");
    if (!tierInfo.allowed) {
      const errorMsg = tierInfo.limit === 0
        ? ERROR_MESSAGES.tier_blocked
        : ERROR_MESSAGES.usage_limit;
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedTheme = sanitizeContent(theme);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle image generation mode
    if (mode === "image") {
      // Build the messages array for image generation
      const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: `Generate a meme image: ${sanitizedTheme}` }
      ];

      // Add attached image as context if provided
      if (imageData) {
        userContent.push({
          type: "image_url",
          image_url: { url: imageData }
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "system", content: IMAGE_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          modalities: ["image", "text"],
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
      
      // Extract image from response - handle multiple response formats
      const message = data.choices?.[0]?.message;
      let imageUrl: string | null = null;
      
      // Format 1: images array (newer format)
      if (message?.images && Array.isArray(message.images)) {
        for (const img of message.images) {
          if (img.type === "image_url" && img.image_url?.url) {
            imageUrl = img.image_url.url;
            break;
          }
        }
      }
      
      // Format 2: content as array with image_url or inline_data
      if (!imageUrl && Array.isArray(message?.content)) {
        for (const part of message.content) {
          if (part.type === "image_url" && part.image_url?.url) {
            imageUrl = part.image_url.url;
            break;
          }
          if (part.inline_data?.data && part.inline_data?.mime_type) {
            imageUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        console.error("[Internal] No image in response. Full response:", JSON.stringify(data).slice(0, 1000));
        return new Response(JSON.stringify({ error: "Failed to generate image. Please try again." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle caption/prompt modes
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
