// Rich error captured from any fetch / edge-function call.
export type FetchErrorDetails = {
  message: string;              // user-facing summary
  functionName?: string;        // edge function or endpoint label
  method?: string;              // HTTP method
  url?: string;                 // full URL called
  status?: number;              // HTTP status code (if any response)
  statusText?: string;
  responseBody?: string;        // raw response text (truncated)
  exception?: string;           // JS exception name/message
  stack?: string;               // exception stack (truncated)
  rawResponse?: string;         // AI raw output (when the backend forwarded it)
};

const MAX = 4000;
const clip = (s: string) => (s.length > MAX ? s.slice(0, MAX) + `\n… (truncated, ${s.length - MAX} more chars)` : s);

/**
 * Build a FetchErrorDetails from an HTTP Response whose status is not ok.
 * Safe to await even if the body was already consumed.
 */
export async function fromResponse(
  res: Response,
  ctx: { functionName?: string; method?: string; url?: string } = {},
): Promise<FetchErrorDetails> {
  let bodyText = "";
  let rawResponse: string | undefined;
  let parsedMessage: string | undefined;
  try {
    bodyText = await res.text();
    try {
      const j = JSON.parse(bodyText);
      parsedMessage = j?.error || j?.message || j?.msg;
      if (typeof j?.rawResponse === "string") rawResponse = j.rawResponse;
    } catch { /* not JSON */ }
  } catch { /* body unavailable */ }

  return {
    message: parsedMessage || `${ctx.functionName || "Request"} failed with HTTP ${res.status}`,
    functionName: ctx.functionName,
    method: ctx.method || "GET",
    url: ctx.url || res.url,
    status: res.status,
    statusText: res.statusText,
    responseBody: bodyText ? clip(bodyText) : undefined,
    rawResponse: rawResponse ? clip(rawResponse) : undefined,
  };
}

/** Build a FetchErrorDetails from a thrown exception (network failure, abort, CORS, etc). */
export function fromException(
  e: unknown,
  ctx: { functionName?: string; method?: string; url?: string } = {},
): FetchErrorDetails {
  const err = e instanceof Error ? e : new Error(String(e));
  const raw = err.message || "";
  // Safari's opaque network failure is literally "Load failed".
  const friendly =
    raw === "Load failed" || /NetworkError|Failed to fetch/i.test(raw)
      ? `Network request to ${ctx.functionName || "edge function"} failed before a response was received (possible CORS error, function crash, or connection drop).`
      : raw || "Unknown error";
  return {
    message: friendly,
    functionName: ctx.functionName,
    method: ctx.method,
    url: ctx.url,
    exception: `${err.name}: ${raw}`,
    stack: err.stack ? clip(err.stack) : undefined,
  };
}

/** Build from a structured error payload emitted inside an SSE stream. */
export function fromStreamPayload(
  payload: { error?: string; rawResponse?: string; [k: string]: unknown },
  ctx: { functionName?: string; url?: string } = {},
): FetchErrorDetails {
  return {
    message: payload.error || "Pipeline error",
    functionName: ctx.functionName,
    url: ctx.url,
    responseBody: JSON.stringify(payload, null, 2).slice(0, MAX),
    rawResponse: typeof payload.rawResponse === "string" ? clip(payload.rawResponse) : undefined,
  };
}
