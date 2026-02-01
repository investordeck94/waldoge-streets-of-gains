import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyTierAndUsage, hasChaosAccess } from "../_shared/tierVerification.ts";

// Input validation schemas using simple validation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_COUNT = 50;
const MAX_WALLET_LENGTH = 50;
const MIN_WALLET_LENGTH = 32;
const VALID_ROLES = ["user", "assistant"];

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  chaosMode?: boolean;
  imageData?: string;
  walletAddress?: string;
}

function validateChatRequest(body: unknown): { valid: true; data: ChatRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const request = body as Record<string, unknown>;

  // Validate wallet address (required for tier verification)
  if (typeof request.walletAddress !== "string" || 
      request.walletAddress.length < MIN_WALLET_LENGTH || 
      request.walletAddress.length > MAX_WALLET_LENGTH) {
    return { valid: false, error: "Valid wallet address is required" };
  }

  // Validate messages array
  if (!Array.isArray(request.messages)) {
    return { valid: false, error: "Messages must be an array" };
  }

  if (request.messages.length === 0) {
    return { valid: false, error: "Messages array cannot be empty" };
  }

  if (request.messages.length > MAX_MESSAGES_COUNT) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES_COUNT} messages allowed` };
  }

  // Validate each message
  for (let i = 0; i < request.messages.length; i++) {
    const msg = request.messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message ${i} is invalid` };
    }

    const message = msg as Record<string, unknown>;

    if (typeof message.role !== "string" || !VALID_ROLES.includes(message.role)) {
      return { valid: false, error: `Message ${i} has invalid role` };
    }

    if (typeof message.content !== "string") {
      return { valid: false, error: `Message ${i} content must be a string` };
    }

    if (message.content.length === 0) {
      return { valid: false, error: `Message ${i} content cannot be empty` };
    }

    if (message.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message ${i} exceeds ${MAX_MESSAGE_LENGTH} character limit` };
    }
  }

  // Validate chaosMode
  if (request.chaosMode !== undefined && typeof request.chaosMode !== "boolean") {
    return { valid: false, error: "chaosMode must be a boolean" };
  }

  // Validate imageData if present (base64 data URL)
  if (request.imageData !== undefined) {
    if (typeof request.imageData !== "string") {
      return { valid: false, error: "imageData must be a string" };
    }
    // Check it's a valid data URL and not too large (max ~5MB base64)
    if (!request.imageData.startsWith("data:image/")) {
      return { valid: false, error: "imageData must be a valid image data URL" };
    }
    if (request.imageData.length > 7 * 1024 * 1024) { // ~5MB base64 encoded
      return { valid: false, error: "Image too large. Maximum 5MB allowed" };
    }
  }

  return {
    valid: true,
    data: {
      messages: request.messages as ChatMessage[],
      chaosMode: request.chaosMode === true,
      imageData: request.imageData as string | undefined,
      walletAddress: request.walletAddress as string,
    },
  };
}

// Sanitize message content - remove control characters except newlines and tabs
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

// Generic error messages to avoid leaking internal details
const ERROR_MESSAGES = {
  rate_limit: "Whoa there, space explorer! Too many messages too fast. Take a breather and try again in a moment! 🐕💫",
  credits: "The cosmic fuel tank needs a refill! Please try again later. 🚀⛽",
  server_error: "WALDOGE's cosmic transmitter hit some space debris. Please try again! 🌌",
  invalid_request: "Invalid request format. Please try again! 🐕",
  tier_blocked: "Hold WALDOGE tokens to unlock the cosmic chat! 🐕✨",
  usage_limit: "Daily cosmic message limit reached! Come back tomorrow, space explorer! 🌌",
  chaos_locked: "Chaos Mode requires holding 1M+ WALDOGE tokens! 🌌🔥",
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

    const validation = validateChatRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, chaosMode, imageData } = validation.data;

    // Sanitize message content
    const sanitizedMessages = messages.map((msg) => ({
      role: msg.role,
      content: sanitizeContent(msg.content),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = WALDOGE_SYSTEM_PROMPT + (chaosMode ? CHAOS_MODE_ADDITION : "");

    // Build messages for API - handle image if present
    const apiMessages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous messages
    sanitizedMessages.slice(0, -1).forEach((msg) => {
      apiMessages.push({ role: msg.role, content: msg.content });
    });

    // Handle the last message (which may have an image)
    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (imageData) {
      apiMessages.push({
        role: lastMessage.role,
        content: [
          { type: "text", text: lastMessage.content || "What do you see in this image?" },
          { type: "image_url", image_url: { url: imageData } },
        ],
      });
    } else {
      apiMessages.push({ role: lastMessage.role, content: lastMessage.content });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[Internal] Chat function error:", error);
    return new Response(JSON.stringify({ error: ERROR_MESSAGES.server_error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});