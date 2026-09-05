/**
 * Trusted origin allow-list for SIWE challenge issuance (audit M-4).
 *
 * The signed message previously carried whatever host the caller put in its
 * Origin header, so any site could brand a challenge as itself. The domain a
 * player sees in their wallet must come from an allow-list the operator
 * controls, and unknown origins are refused outright.
 *
 * Dependency-free (Deno + vitest).
 */

/** Production + preview hosts of this application. */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  "https://waldogeai.lovable.app",
  "https://id-preview--bf55773c-9987-4b10-9248-01cc1aa65f4c.lovable.app",
];

/** Local development hosts (only honoured when explicitly enabled). */
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Lovable preview/sandbox/published hosts. Preview iframes are served from
 * several Lovable domains (lovable.app, lovableproject.com, lovable.dev) with
 * arbitrary subdomain nesting, so allow any subdomain of those apex domains.
 */
const LOVABLE_HOST_RE =
  /^([a-z0-9-]+\.)*[a-z0-9-]+\.(lovable\.app|lovableproject\.com|lovable\.dev)$/;

export interface OriginPolicy {
  allowed: readonly string[];
  allowLocalhost: boolean;
}

export function resolveOriginPolicy(env: Record<string, string | undefined>): OriginPolicy {
  const extra = (env.SOG_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    allowed: [...DEFAULT_ALLOWED_ORIGINS, ...extra],
    allowLocalhost: env.SOG_ALLOW_LOCALHOST_ORIGIN === "1",
  };
}

export type OriginCheck = { ok: true; domain: string } | { ok: false; error: string };

/**
 * Resolve the domain that will appear in the signed challenge.
 * Rejects any origin that is not explicitly trusted.
 */
export function resolveChallengeDomain(
  originHeader: string | null,
  policy: OriginPolicy,
): OriginCheck {
  if (!originHeader) {
    // No Origin (native/no-CORS caller): fall back to the canonical host.
    return { ok: true, domain: hostOf(policy.allowed[0]) ?? "waldogeai.lovable.app" };
  }

  let url: URL;
  try {
    url = new URL(originHeader);
  } catch {
    return { ok: false, error: "origin not allowed" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "origin not allowed" };
  }

  const host = url.host.toLowerCase();

  if (policy.allowed.some((o) => hostOf(o) === host)) return { ok: true, domain: host };
  if (policy.allowLocalhost && LOCAL_HOST_RE.test(host)) return { ok: true, domain: host };
  if (url.protocol === "https:" && LOVABLE_HOST_RE.test(host)) return { ok: true, domain: host };

  return { ok: false, error: "origin not allowed" };
}

function hostOf(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return origin.toLowerCase();
  }
}
