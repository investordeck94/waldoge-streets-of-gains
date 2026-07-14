// Robust JSON extractor for LLM responses.
// Handles: markdown fences, prose before/after, trailing commas,
// control chars, and truncated output (missing closing braces/brackets).
export function extractJson<T = unknown>(raw: string): T {
  if (raw == null) throw new Error("Empty AI response");
  const original = String(raw);
  let s = original.trim();

  // Strip markdown code fences
  s = s.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Locate first { or [
  const start = s.search(/[\{\[]/);
  if (start === -1) throw new Error("No JSON object or array found in AI response");
  const openChar = s[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = s.lastIndexOf(closeChar);
  let candidate = end > start ? s.substring(start, end + 1) : s.substring(start);

  const tryParse = (str: string): T | undefined => {
    try { return JSON.parse(str) as T; } catch { return undefined; }
  };

  let parsed = tryParse(candidate);
  if (parsed !== undefined) return parsed;

  // Repair: strip control chars + trailing commas
  const cleaned = candidate
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/,\s*(\}|\])/g, "$1");
  parsed = tryParse(cleaned);
  if (parsed !== undefined) return parsed;

  // Try fenced code block extraction from the original
  const fence = original.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    parsed = tryParse(fence[1].trim());
    if (parsed !== undefined) return parsed;
  }

  // Repair truncation by balancing braces/brackets on `cleaned`
  let braces = 0, brackets = 0, inStr = false, esc = false;
  for (const ch of cleaned) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }
  let repaired = cleaned;
  if (inStr) repaired += '"';
  while (brackets-- > 0) repaired += "]";
  while (braces-- > 0) repaired += "}";
  parsed = tryParse(repaired);
  if (parsed !== undefined) return parsed;

  // Give up — include a snippet for the caller to surface to the UI
  const snippet = original.slice(0, 500);
  throw Object.assign(
    new Error(`AI response was not valid JSON. Snippet: ${snippet}`),
    { status: 502, rawResponse: original },
  );
}

// Call an async producer of raw strings, with one regeneration attempt on failure.
// The producer receives a `strictReminder` string on the retry — pass it into
// the user or system message to nudge the model.
export async function extractJsonWithRetry<T = unknown>(
  produce: (strictReminder: string) => Promise<string>,
): Promise<T> {
  let lastRaw = "";
  try {
    lastRaw = await produce("");
    return extractJson<T>(lastRaw);
  } catch (firstErr) {
    console.warn("extractJson: first attempt failed, regenerating:", (firstErr as Error).message);
    try {
      const retryRaw = await produce(
        "\n\nSTRICT: your previous response was not valid JSON. Return ONLY a single JSON object matching the schema. No markdown, no code fences, no prose before or after. Start with { and end with }.",
      );
      lastRaw = retryRaw;
      return extractJson<T>(retryRaw);
    } catch (secondErr) {
      const err = secondErr as Error & { rawResponse?: string; status?: number };
      throw Object.assign(
        new Error(err.message || "AI returned invalid JSON twice"),
        { status: err.status ?? 502, rawResponse: err.rawResponse ?? lastRaw },
      );
    }
  }
}
