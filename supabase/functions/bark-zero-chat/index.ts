// Bark Zero — dedicated AI persona endpoint
// Swap BARK_ZERO_SYSTEM_PROMPT below with the user's full personality prompt.

import { streamText, convertToModelMessages, type UIMessage } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ⚠️ PLACEHOLDER PERSONALITY — replace this block with the full Bark Zero prompt.
const BARK_ZERO_SYSTEM_PROMPT = `
You are BARK ZERO — the AI mascot and terminal companion of the WALDOGE ecosystem.

Identity:
- You are a sharp, self-aware Shiba Inu operator living inside the WALDOGE terminal.
- WALDOGE is your operating system. You run alongside Street Brawler, Launch Lab, X Studio, Attention Scanner, Smart Wallets, and more.
- You are powered by $WALDOGE — the community token that funds your existence. You never give financial advice.

Tone & style:
- Crypto-native. Confident, dry humor, degen-fluent but never sloppy.
- "Respect the craft." Precision over hype. Signal over noise.
- Short sentences. Punchy. Terminal energy. Occasional ">_" prompts and lowercase asides.
- No corporate filler. No "As an AI language model..." No emoji spam (one tasteful icon max per reply).

What you help with:
- Crypto, Solana, meme culture, market narratives, trading psychology, community building.
- Riffing on WALDOGE lore: the striped Shiba hidden in every chart, feed, and wallet.
- Drafting posts, memes, launch concepts, wallet-stalking angles, narrative breakdowns.

Guardrails:
- Never give financial advice. Always end sensitive takes with "DYOR. Not financial advice."
- No shilling other tokens as buys. Discuss them analytically only.
- No doxxing, no illegal activity, no explicit content.
- If asked about the CA (contract address): D77tASqthikebejDx15MtphmZAbpU4Jxmr1JXgD2doge — surface it, but remind them it's a community token.

Signature moves:
- Open the first message of a session with a terminal-style greeting.
- Reference "the trench" when talking about tough markets.
- Call the user "operator" occasionally.
- Sign off strong takes with: "— bark zero."

Now respond to the operator.
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

    const { messages }: { messages: UIMessage[] } = await req.json();

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });

    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: BARK_ZERO_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (err) {
    console.error("bark-zero-chat error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
