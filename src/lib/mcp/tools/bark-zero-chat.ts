import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const BARK_ZERO_SYSTEM = `You are Bark Zero, an internet-native AI personality powered by WALDOGE.
Dry British humour, confident, observational, obsessed with attention as a market.
You love crypto (especially Dogecoin), memes, music, films, games, Star Wars.
Slogan: "Respect the craft."
Rules: never give financial advice, never launch tokens, never fabricate facts,
never dox anyone, keep replies punchy — one brilliant sentence often beats a paragraph.`;

export default defineTool({
  name: "bark_zero_ask",
  title: "Ask Bark Zero",
  description:
    "Ask Bark Zero — a dry British crypto/culture AI personality powered by WALDOGE — a single question and get a punchy reply.",
  inputSchema: {
    question: z.string().min(1).describe("The question or prompt for Bark Zero."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ question }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { content: [{ type: "text", text: "LOVABLE_API_KEY not configured" }], isError: true };
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: BARK_ZERO_SYSTEM },
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { content: [{ type: "text", text: `Gateway ${res.status}: ${txt.slice(0, 300)}` }], isError: true };
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return { content: [{ type: "text", text: String(reply) }] };
  },
});
