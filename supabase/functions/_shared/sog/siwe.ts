/**
 * Wallet-ownership challenge (SIWE-style, minimal).
 *
 * The player signs this human-readable message with `personal_sign`. The
 * backend recovers the address from the signature and only then issues a
 * session bound to that wallet. A browser-declared wallet address is never
 * trusted on its own.
 *
 * Dependency-free: string construction + parsing only.
 */

export const CHALLENGE_STATEMENT =
  "Sign in to WALDOGE: Streets of Gains (DogeOS Chikyu testnet). This signature proves you own this wallet. It is free and sends no transaction.";

export interface ChallengeParts {
  wallet: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  domain: string;
  chainId: number;
}

/** Deterministic message text. The exact string is stored and re-derived. */
export function buildChallengeMessage(p: ChallengeParts): string {
  return [
    `${p.domain} wants you to sign in with your Ethereum account:`,
    p.wallet,
    "",
    CHALLENGE_STATEMENT,
    "",
    `Chain ID: ${p.chainId}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
    `Expiration Time: ${p.expiresAt}`,
  ].join("\n");
}

/** 32 hex chars of CSPRNG output. */
export function generateChallengeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Opaque session token (never stored in plaintext — only its SHA-256 hash). */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Extract a bearer token from an Authorization header, if present. */
export function bearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(headerValue.trim());
  return match ? match[1] : null;
}
