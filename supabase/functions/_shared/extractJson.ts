// Robust JSON extractor for LLM responses.
// Handles: markdown fences, prose before/after, trailing commas, control chars.
// Detects incomplete/truncated JSON before parsing so callers can retry that
// specific section instead of silently accepting a repaired partial object.

type JsonIssue = Error & { status?: number; rawResponse?: string; code?: string; truncated?: boolean };

function stripFences(raw: string) {
  return String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

export function detectIncompleteJson(raw: string): { incomplete: boolean; reason?: string } {
  const s = stripFences(raw);
  const start = s.search(/[\{\[]/);
  if (start === -1) return { incomplete: false };

  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  let sawJsonStart = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (ch === "{") { stack.push("}"); sawJsonStart = true; }
    else if (ch === "[") { stack.push("]"); sawJsonStart = true; }
    else if (ch === "}" || ch === "]") {
      if (stack.length === 0 || stack[stack.length - 1] !== ch) return { incomplete: false };
      stack.pop();
      if (sawJsonStart && stack.length === 0) return { incomplete: false };
    }
  }

  if (inStr) return { incomplete: true, reason: "unterminated string" };
  if (stack.length > 0) return { incomplete: true, reason: `missing closing ${stack.reverse().join("")}` };
  return { incomplete: false };
}

function balancedJsonCandidate(raw: string): string | null {
  const s = stripFences(raw);
  const start = s.search(/[\{\[]/);
  if (start === -1) return null;

  const stack: string[] = [];
  let inStr = false;
  let esc = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length === 0 || stack[stack.length - 1] !== ch) return null;
      stack.pop();
      if (stack.length === 0) return s.substring(start, i + 1);
    }
  }
  return null;
}

export function extractJson<T = unknown>(raw: string): T {
  if (raw == null) throw new Error("Empty AI response");
  const original = String(raw);
  const incomplete = detectIncompleteJson(original);
  if (incomplete.incomplete) {
    throw Object.assign(
      new Error(`AI response JSON was incomplete (${incomplete.reason ?? "missing closing brace/bracket"})`),
      { status: 502, rawResponse: original, code: "incomplete_json", truncated: true },
    ) as JsonIssue;
  }

  const candidate = balancedJsonCandidate(original);
  if (!candidate) throw new Error("No complete JSON object or array found in AI response");

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
  options?: { sectionName?: string; maxAttempts?: number },
): Promise<T> {
  let lastRaw = "";
  const maxAttempts = options?.maxAttempts ?? 3;
  const section = options?.sectionName ? ` for ${options.sectionName}` : "";
  let reminder = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      lastRaw = await produce(reminder);
      return extractJson<T>(lastRaw);
    } catch (err) {
      const issue = err as JsonIssue;
      if (attempt >= maxAttempts) {
        throw Object.assign(
          new Error(issue.message || `AI returned invalid JSON${section}`),
          { status: issue.status ?? 502, rawResponse: issue.rawResponse ?? lastRaw, code: issue.code, truncated: issue.truncated },
        ) as JsonIssue;
      }
      console.warn(`extractJson: attempt ${attempt} failed${section}, regenerating section only:`, issue.message);
      reminder = issue.truncated
        ? `\n\nSTRICT RETRY${section}: your previous JSON was truncated/incomplete. Regenerate ONLY this section as one complete JSON object. Do not repeat other sections. No markdown, no code fences, no prose. Start with { and end with }.`
        : `\n\nSTRICT RETRY${section}: your previous response was not valid JSON. Regenerate ONLY this section as one complete JSON object matching the schema. No markdown, no code fences, no prose. Start with { and end with }.`;
    }
  }

  throw Object.assign(new Error(`AI returned invalid JSON${section}`), { status: 502, rawResponse: lastRaw }) as JsonIssue;
}
