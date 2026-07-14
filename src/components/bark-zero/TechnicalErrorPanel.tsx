import type { FetchErrorDetails } from "@/lib/fetchError";

interface Props {
  error: FetchErrorDetails;
  className?: string;
  title?: string;
}

/**
 * Neon-red error card with a collapsible "Technical Details" panel
 * exposing HTTP status, response body, exception info, and raw AI output.
 */
export function TechnicalErrorPanel({ error, className = "", title = "⚠" }: Props) {
  const hasDetails =
    error.status !== undefined ||
    !!error.responseBody ||
    !!error.exception ||
    !!error.stack ||
    !!error.rawResponse ||
    !!error.url;

  return (
    <div className={`rounded-lg border border-red-500/40 bg-red-500/5 p-3 ${className}`}>
      <div className="text-xs text-red-400 font-mono">
        {title} {error.message}
      </div>

      {hasDetails && (
        <details className="mt-2">
          <summary className="text-[10px] font-mono uppercase tracking-widest text-red-300/70 cursor-pointer hover:text-red-300">
            Technical Details
          </summary>
          <div className="mt-2 space-y-2 text-[10px] font-mono text-white/70">
            <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1">
              {error.functionName && (
                <>
                  <dt className="text-red-300/70">function</dt>
                  <dd className="break-all">{error.functionName}</dd>
                </>
              )}
              {error.method && (
                <>
                  <dt className="text-red-300/70">method</dt>
                  <dd>{error.method}</dd>
                </>
              )}
              {error.url && (
                <>
                  <dt className="text-red-300/70">url</dt>
                  <dd className="break-all">{error.url}</dd>
                </>
              )}
              {error.status !== undefined && (
                <>
                  <dt className="text-red-300/70">status</dt>
                  <dd>
                    {error.status} {error.statusText || ""}
                  </dd>
                </>
              )}
              {error.exception && (
                <>
                  <dt className="text-red-300/70">exception</dt>
                  <dd className="break-all">{error.exception}</dd>
                </>
              )}
            </dl>

            {error.responseBody && (
              <div>
                <div className="text-red-300/70 mb-1">response body</div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all bg-black/40 p-2 rounded text-white/60">
{error.responseBody}
                </pre>
              </div>
            )}

            {error.rawResponse && (
              <div>
                <div className="text-red-300/70 mb-1">raw AI response</div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all bg-black/40 p-2 rounded text-white/60">
{error.rawResponse}
                </pre>
              </div>
            )}

            {error.stack && (
              <div>
                <div className="text-red-300/70 mb-1">stack</div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all bg-black/40 p-2 rounded text-white/60">
{error.stack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
