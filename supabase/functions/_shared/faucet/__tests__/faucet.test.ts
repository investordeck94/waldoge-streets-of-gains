import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAUCET_CHAIN_ID,
  MAX_FAUCET_AMOUNT_WEI,
  MIN_CLAIM_COOLDOWN_SECONDS,
  normalizeRecipient,
  resolveFaucetConfig,
} from "../config.ts";
import { processFaucetClaim, type ClaimRecord, type FaucetStore } from "../claim.ts";

const WAD = 10n ** 18n;
const TOKEN = "0x1111111111111111111111111111111111111111";
const MINTER = "0x2222222222222222222222222222222222222222";
const PLAYER = "0x00000000000000000000000000000000000000aB";
const TX = "0x" + "ab".repeat(32);

function baseEnv(extra: Record<string, string | undefined> = {}) {
  return {
    TWALDOGE_TOKEN_ADDRESS: TOKEN,
    TWALDOGE_MINTER_ADDRESS: MINTER,
    TWALDOGE_CHAIN_ID: String(FAUCET_CHAIN_ID),
    ...extra,
  } as Record<string, string | undefined>;
}

/** In-memory store honouring the "one pending claim per wallet" constraint. */
function memoryStore() {
  const rows: Array<
    { id: string; wallet: string; status: string; createdAt: number; amountWei: bigint }
  > = [];
  let seq = 0;
  const store: FaucetStore & { rows: typeof rows } = {
    rows,
    async findLastSuccess(wallet: string): Promise<ClaimRecord | null> {
      const hit = [...rows].reverse().find((r) => r.wallet === wallet && r.status === "success");
      return hit ? { id: hit.id, createdAt: hit.createdAt } : null;
    },
    async openPendingClaim(wallet: string, amountWei: bigint): Promise<ClaimRecord | null> {
      if (rows.some((r) => r.wallet === wallet && r.status === "pending")) return null;
      const row = {
        id: `c${++seq}`,
        wallet,
        status: "pending",
        createdAt: Date.now(),
        amountWei,
      };
      rows.push(row);
      return { id: row.id, createdAt: row.createdAt };
    },
    async markSuccess(id: string) {
      const row = rows.find((r) => r.id === id);
      if (row) row.status = "success";
    },
    async markFailure(id: string) {
      const row = rows.find((r) => r.id === id);
      if (row) row.status = "failed";
    },
  };
  return store;
}

function okMinter() {
  return { mint: vi.fn(async () => TX) };
}

describe("faucet config", () => {
  it("resolves a complete configuration with conservative defaults", () => {
    const r = resolveFaucetConfig(baseEnv());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config.tokenAddress).toBe(TOKEN);
    expect(r.config.minterAddress).toBe(MINTER);
    expect(r.config.chainId).toBe(FAUCET_CHAIN_ID);
    expect(r.config.amountWei).toBe(100n * WAD);
    expect(r.config.cooldownSeconds).toBe(MIN_CLAIM_COOLDOWN_SECONDS);
  });

  it("fails closed when configuration is missing", () => {
    expect(resolveFaucetConfig({}).ok).toBe(false);
    expect(resolveFaucetConfig({ TWALDOGE_TOKEN_ADDRESS: TOKEN }).ok).toBe(false);
    expect(resolveFaucetConfig({ TWALDOGE_MINTER_ADDRESS: MINTER }).ok).toBe(false);
  });

  it("rejects malformed and zero token/minter addresses", () => {
    expect(resolveFaucetConfig(baseEnv({ TWALDOGE_TOKEN_ADDRESS: "0xnope" })).ok).toBe(false);
    expect(
      resolveFaucetConfig(baseEnv({ TWALDOGE_MINTER_ADDRESS: `0x${"0".repeat(40)}` })).ok,
    ).toBe(false);
  });

  it("refuses any chain other than DogeOS Chikyu 6281971", () => {
    for (const bad of ["1", "11155111", "6281970", "abc"]) {
      const r = resolveFaucetConfig(baseEnv({ TWALDOGE_CHAIN_ID: bad }));
      expect(r.ok).toBe(false);
    }
  });

  it("refuses a minter that collides with the SOG signer or owner", () => {
    expect(resolveFaucetConfig(baseEnv({ SOG_EXPECTED_SIGNER_ADDRESS: MINTER })).ok).toBe(false);
    expect(resolveFaucetConfig(baseEnv({ SOG_OWNER_ADDRESS: `0x${MINTER.slice(2).toUpperCase()}` })).ok).toBe(
      false,
    );
  });

  it("clamps the per-claim amount to the 100 tWALDOGE ceiling", () => {
    const r = resolveFaucetConfig(
      baseEnv({ TWALDOGE_FAUCET_AMOUNT_WEI: (1_000_000n * WAD).toString() }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.config.amountWei).toBe(MAX_FAUCET_AMOUNT_WEI);
  });

  it("allows env to lower the amount and lengthen (never shorten) the cooldown", () => {
    const r = resolveFaucetConfig(
      baseEnv({
        TWALDOGE_FAUCET_AMOUNT_WEI: (5n * WAD).toString(),
        TWALDOGE_FAUCET_COOLDOWN_SECONDS: "60",
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config.amountWei).toBe(5n * WAD);
    expect(r.config.cooldownSeconds).toBe(MIN_CLAIM_COOLDOWN_SECONDS);
  });

  it("normalizes recipients and rejects the zero address", () => {
    expect(normalizeRecipient(PLAYER)).toBe(PLAYER.toLowerCase());
    expect(normalizeRecipient(`0x${"0".repeat(40)}`)).toBeNull();
    expect(normalizeRecipient("not-an-address")).toBeNull();
    expect(normalizeRecipient(null)).toBeNull();
  });
});

describe("faucet claim engine", () => {
  let store: ReturnType<typeof memoryStore>;
  let minter: ReturnType<typeof okMinter>;

  beforeEach(() => {
    store = memoryStore();
    minter = okMinter();
  });

  it("mints the configured amount on a valid claim", async () => {
    const r = await processFaucetClaim(baseEnv(), PLAYER, { store, minter });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.wallet).toBe(PLAYER.toLowerCase());
    expect(r.amountWei).toBe((100n * WAD).toString());
    expect(r.txHash).toBe(TX);
    expect(r.chainId).toBe(FAUCET_CHAIN_ID);
    expect(minter.mint).toHaveBeenCalledWith(PLAYER.toLowerCase(), 100n * WAD);
  });

  it("rejects a malformed address without touching the chain", async () => {
    const r = await processFaucetClaim(baseEnv(), "0x123", { store, minter });
    expect(r).toMatchObject({ ok: false, status: 400 });
    expect(minter.mint).not.toHaveBeenCalled();
  });

  it("rejects the zero address", async () => {
    const r = await processFaucetClaim(baseEnv(), `0x${"0".repeat(40)}`, { store, minter });
    expect(r).toMatchObject({ ok: false, status: 400 });
    expect(minter.mint).not.toHaveBeenCalled();
  });

  it("refuses to operate on the wrong chain id", async () => {
    const r = await processFaucetClaim(baseEnv({ TWALDOGE_CHAIN_ID: "1" }), PLAYER, {
      store,
      minter,
    });
    expect(r).toMatchObject({ ok: false, status: 503 });
    expect(minter.mint).not.toHaveBeenCalled();
  });

  it("fails closed with missing configuration", async () => {
    const r = await processFaucetClaim({}, PLAYER, { store, minter });
    expect(r).toMatchObject({ ok: false, status: 503 });
    expect(minter.mint).not.toHaveBeenCalled();
  });

  it("cannot operate without the minter address configured", async () => {
    const env = baseEnv();
    delete env.TWALDOGE_MINTER_ADDRESS;
    const r = await processFaucetClaim(env, PLAYER, { store, minter });
    expect(r).toMatchObject({ ok: false, status: 503 });
    expect(minter.mint).not.toHaveBeenCalled();
  });

  it("enforces the 24h rate limit on repeated claims", async () => {
    const first = await processFaucetClaim(baseEnv(), PLAYER, { store, minter });
    expect(first.ok).toBe(true);

    const second = await processFaucetClaim(baseEnv(), PLAYER, { store, minter });
    expect(second).toMatchObject({ ok: false, status: 429 });
    if (!second.ok) expect(second.retryAfterSeconds).toBeGreaterThan(0);
    expect(minter.mint).toHaveBeenCalledTimes(1);
  });

  it("allows a new claim once the cooldown has elapsed", async () => {
    await processFaucetClaim(baseEnv(), PLAYER, { store, minter });
    const later = Date.now() + (MIN_CLAIM_COOLDOWN_SECONDS + 1) * 1000;
    const r = await processFaucetClaim(baseEnv(), PLAYER, {
      store,
      minter,
      now: () => later,
    });
    expect(r.ok).toBe(true);
    expect(minter.mint).toHaveBeenCalledTimes(2);
  });

  it("prevents concurrent double claims for the same wallet", async () => {
    let release: (v: string) => void = () => {};
    const slowMinter = {
      mint: vi.fn(() => new Promise<string>((resolve) => (release = resolve))),
    };
    const a = processFaucetClaim(baseEnv(), PLAYER, { store, minter: slowMinter });
    const b = await processFaucetClaim(baseEnv(), PLAYER, { store, minter: slowMinter });
    expect(b).toMatchObject({ ok: false, status: 409 });
    release(TX);
    expect((await a).ok).toBe(true);
    expect(slowMinter.mint).toHaveBeenCalledTimes(1);
  });

  it("reports a mint failure without consuming the cooldown", async () => {
    const failing = {
      mint: vi.fn(async () => {
        throw new Error("insufficient funds for gas");
      }),
    };
    const r = await processFaucetClaim(baseEnv(), PLAYER, { store, minter: failing });
    expect(r).toMatchObject({ ok: false, status: 502 });
    // No leaked internals in the client-facing error.
    if (!r.ok) expect(r.error).not.toContain("gas");
    expect(store.rows.every((row) => row.status === "failed")).toBe(true);

    const retry = await processFaucetClaim(baseEnv(), PLAYER, { store, minter });
    expect(retry.ok).toBe(true);
  });

  it("treats a bogus transaction hash as a failure", async () => {
    const bogus = { mint: vi.fn(async () => "not-a-hash") };
    const r = await processFaucetClaim(baseEnv(), PLAYER, { store, minter: bogus });
    expect(r).toMatchObject({ ok: false, status: 502 });
  });

  it("never mints above the configured faucet amount, whatever the client sends", async () => {
    const r = await processFaucetClaim(
      baseEnv({ TWALDOGE_FAUCET_AMOUNT_WEI: (5n * WAD).toString() }),
      // A client-supplied amount has nowhere to enter: only an address is taken.
      PLAYER,
      { store, minter },
    );
    expect(r.ok).toBe(true);
    expect(minter.mint).toHaveBeenCalledWith(PLAYER.toLowerCase(), 5n * WAD);
    const [, amount] = minter.mint.mock.calls[0] as [string, bigint];
    expect(amount).toBeLessThanOrEqual(MAX_FAUCET_AMOUNT_WEI);
  });
});
