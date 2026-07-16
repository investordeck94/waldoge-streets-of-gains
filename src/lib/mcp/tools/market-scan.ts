import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "market_scan",
  title: "Bark Zero market scan",
  description:
    "Scan the current crypto/attention landscape for narratives (AI, memes, gaming, culture) and return AI-estimated rankings with a score 1-100. Scores are AI-generated estimates, not live market data.",
  inputSchema: {
    focus: z
      .string()
      .describe("Optional focus area, e.g. 'AI agents', 'Solana memes', 'gaming'. Empty string for a general scan.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ focus }) => {
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
          {
            role: "system",
            content:
              "You are Bark Zero doing a narrative landscape scan. Return 5-8 narratives, each with: name, one-line thesis, score 1-100, and a one-line 'why now'. State clearly at the top that scores are AI-generated estimates, not live market data.",
          },
          { role: "user", content: focus ? `Focus: ${focus}` : "General crypto attention scan." },
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
