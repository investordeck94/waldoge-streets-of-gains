import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "launch_lab_concept",
  title: "Generate token concept",
  description:
    "Draft a meme-coin concept in Bark Zero's voice — name, ticker, narrative, lore, marketing angles, risk notes. This is IDEATION ONLY. No token is created, deployed, or funded. The Waldoge site owner must explicitly approve any real launch in-app.",
  inputSchema: {
    theme: z.string().min(1).describe("Theme, narrative or seed idea for the token."),
    audience: z.string().describe("Target audience or community. Empty string if none.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ theme, audience }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { content: [{ type: "text", text: "LOVABLE_API_KEY not configured" }], isError: true };
    }
    const prompt = `Draft a meme-coin CONCEPT (ideation only, never a launch instruction).
Theme: ${theme}
${audience ? `Audience: ${audience}` : ""}

Return sections:
- Bark's Analysis (2-3 dry British sentences)
- Name & Ticker
- Narrative (1 paragraph)
- Lore (short)
- 3 marketing angles
- Risks (bullet points)
- Confidence score 1-100 with one-line reason.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are Bark Zero drafting token CONCEPTS for review. Never claim a token was launched. Reject weak ideas (score < 62) and say so plainly.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { content: [{ type: "text", text: `Gateway ${res.status}: ${txt.slice(0, 300)}` }], isError: true };
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return {
      content: [
        { type: "text", text: String(reply) },
        {
          type: "text",
          text: "\n\n⚠️ Concept only — no token deployed. Owner approval required in the Waldoge app to launch.",
        },
      ],
    };
  },
});
