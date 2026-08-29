import { describe, expect, it } from "vitest";
import {
  bearerToken,
  buildChallengeMessage,
  CHALLENGE_STATEMENT,
  generateChallengeNonce,
  generateSessionToken,
  hashToken,
} from "../siwe.ts";
import { CHALLENGE_TTL_SECONDS, SESSION_TTL_SECONDS } from "../config.ts";

describe("wallet ownership challenge", () => {
  it("binds the wallet, chain and nonce into the signed text", () => {
    const msg = buildChallengeMessage({
      wallet: "0x1111111111111111111111111111111111111111",
      nonce: "abc",
      issuedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:05:00.000Z",
      domain: "waldogeai.lovable.app",
      chainId: 6281971,
    });
    expect(msg).toContain("0x1111111111111111111111111111111111111111");
    expect(msg).toContain("Chain ID: 6281971");
    expect(msg).toContain("Nonce: abc");
    expect(msg).toContain(CHALLENGE_STATEMENT);
  });

  it("issues unique high-entropy nonces and tokens", () => {
    const nonces = new Set(Array.from({ length: 300 }, generateChallengeNonce));
    const tokens = new Set(Array.from({ length: 300 }, generateSessionToken));
    expect(nonces.size).toBe(300);
    expect(tokens.size).toBe(300);
    expect([...tokens][0]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes session tokens (plaintext is never storable)", async () => {
    const token = generateSessionToken();
    const hash = await hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
    expect(await hashToken(token)).toBe(hash);
  });

  it("uses conservative lifetimes", () => {
    expect(CHALLENGE_TTL_SECONDS).toBeLessThanOrEqual(600);
    expect(SESSION_TTL_SECONDS).toBeLessThanOrEqual(60 * 60 * 24);
  });

  it("parses bearer tokens strictly", () => {
    expect(bearerToken("Bearer abc123")).toBe("abc123");
    expect(bearerToken("abc123")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});
