// Client helper for the Bark Zero owner-only shared secret.
// The secret is entered once by the site owner and stored locally; every
// Bark Zero admin edge function verifies it server-side.
const KEY = "bark_zero_owner_secret";
export const OWNER_SECRET_CHANGED_EVENT = "barkZero:ownerSecretChanged";
export const OWNER_UNAUTHORIZED_EVENT = "barkZero:unauthorized";

export type OwnerSecretVerification = {
  ok: boolean;
  status?: number;
  message?: string;
  responseBody?: string;
};

const emitOwnerEvent = (name: string, detail?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export function getOwnerSecret(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function setOwnerSecret(v: string) {
  const trimmed = v.trim();
  try { localStorage.setItem(KEY, trimmed); } catch { /* ignore */ }
  emitOwnerEvent(OWNER_SECRET_CHANGED_EVENT, { hasSecret: trimmed.length > 0 });
}

export function clearOwnerSecret(reason: "manual" | "unauthorized" = "manual", message?: string) {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  emitOwnerEvent(OWNER_SECRET_CHANGED_EVENT, { hasSecret: false, reason, message });
  if (reason === "unauthorized") {
    emitOwnerEvent(OWNER_UNAUTHORIZED_EVENT, {
      message: message || "Owner secret rejected by server. Re-enter the correct BARK_ZERO_OWNER_SECRET.",
    });
  }
}

export function hasOwnerSecret(): boolean {
  return getOwnerSecret().trim().length > 0;
}

/** Header block to spread into every Bark Zero admin fetch. */
export function ownerSecretHeader(): Record<string, string> {
  const v = getOwnerSecret().trim();
  return v ? { "x-owner-secret": v } : {};
}

/**
 * Verify a candidate owner secret before saving it locally. The verification
 * endpoint may return either HTTP 401 or HTTP 200 { ok: false } for a rejected
 * value, so callers should use this normalized result instead of checking only
 * response.ok.
 */
export async function verifyOwnerSecret(secret: string): Promise<OwnerSecretVerification> {
  const candidate = secret.trim();
  if (!candidate) return { ok: false, message: "Owner secret is required." };

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-owner-verify`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "x-owner-secret": candidate,
      },
      body: JSON.stringify({ checkOnly: true }),
    });

    const bodyText = await res.text().catch(() => "");
    let payload: { ok?: boolean; error?: string; message?: string } = {};
    try { payload = bodyText ? JSON.parse(bodyText) : {}; } catch { /* keep raw text */ }

    if (res.ok && payload.ok === true) return { ok: true, status: res.status };

    return {
      ok: false,
      status: res.status,
      message:
        payload.error ||
        payload.message ||
        (res.status === 401
          ? "Server rejected that owner secret. Value must match BARK_ZERO_OWNER_SECRET exactly."
          : `Verification failed (HTTP ${res.status}).`),
      responseBody: bodyText || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Network error verifying owner secret: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
