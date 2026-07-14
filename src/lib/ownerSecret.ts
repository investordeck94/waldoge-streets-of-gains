// Client helper for the Bark Zero owner-only shared secret.
// The secret is entered once by the site owner and stored locally; every
// Bark Zero admin edge function verifies it server-side.
const KEY = "bark_zero_owner_secret";

export function getOwnerSecret(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function setOwnerSecret(v: string) {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
}

export function clearOwnerSecret() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function hasOwnerSecret(): boolean {
  return getOwnerSecret().trim().length > 0;
}

/** Header block to spread into every Bark Zero admin fetch. */
export function ownerSecretHeader(): Record<string, string> {
  const v = getOwnerSecret();
  return v ? { "x-owner-secret": v } : {};
}
