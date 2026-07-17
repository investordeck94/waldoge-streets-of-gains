// Client helper for the Bark Zero owner-only shared secret.
// The secret is entered once by the site owner and stored locally; every
// Bark Zero admin edge function verifies it server-side.
const KEY = "bark_zero_owner_secret";
export const OWNER_SECRET_CHANGED_EVENT = "barkZero:ownerSecretChanged";
export const OWNER_UNAUTHORIZED_EVENT = "barkZero:unauthorized";

const emitOwnerEvent = (name: string, detail?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export function getOwnerSecret(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function setOwnerSecret(v: string) {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
  emitOwnerEvent(OWNER_SECRET_CHANGED_EVENT, { hasSecret: v.trim().length > 0 });
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
  const v = getOwnerSecret();
  return v ? { "x-owner-secret": v } : {};
}
