# Phase 2F — tWALDOGE Testnet Faucet

## tWALDOGE has no monetary value

`tWALDOGE` ("Waldoge Testnet", 18 decimals) is a **worthless testnet token**. It has no price, no
backing, no redemption value, and it is not an investment. It exists **only** for the
**DogeOS Chikyū testnet (chain id 6281971)** so testers can exercise Streets of Gains flows without
real assets. It must never be deployed to, bridged to, or listed on any production/mainnet
environment, and balances may be wiped at any time.

## What this faucet is

A server-side faucet that mints tWALDOGE to a wallet that has **proved it owns that address**.

Endpoint: `POST /functions/v1/twaldoge-faucet-claim`, header `x-sog-session`, body `{ }` (an
optional `wallet` field must match the authenticated wallet or the request is rejected with 403).

The recipient is always the session wallet — the wallet that signed the sign-in challenge
(`sog-auth-challenge` / `sog-auth-verify`). A client-declared address is never trusted on its own.
Only the wallet-ownership proof is reused: the faucet is **not** connected to the Streets of Gains
reward authorization system, produces no EIP-712 attestations, imports no SOG reward logic and has
no access to the SOG signer key.

## Limits (conservative initial policy)

| Rule | Value |
| --- | --- |
| Max per claim | 100 tWALDOGE (hard ceiling in code; env may only lower it) |
| Cooldown | 1 successful claim per wallet per 24h (env may only lengthen it) |
| Concurrency | 1 in-flight claim per wallet, enforced by a partial unique DB index |
| Chain | 6281971 only; refuses any other chain id and never switches networks |
| Zero / malformed address | rejected before any chain interaction |
| Missing or invalid config | fails closed — 503, nothing is minted |

Failed mints are recorded as `failed` and do **not** consume the 24h cooldown. Every attempt is
logged to `public.twaldoge_faucet_claims` (backend-only table, service role, RLS enabled with no
policies so nothing is reachable from the browser), which is what prevents rate-limit bypass through
repeated requests.

## Wallet / minter separation

The faucet uses a **dedicated faucet authority** that is distinct from:

- `SOG_OWNER` (rewards admin)
- `SOG_SIGNER` (rewards attestation signer)
- the deployer wallet
- any user wallet

Enforced in code: configuration is rejected if the faucet minter address equals
`SOG_EXPECTED_SIGNER_ADDRESS` or `SOG_OWNER_ADDRESS`, and the minter loader refuses to start if its
private key equals `SOG_SIGNER_PRIVATE_KEY`. The loader also fails closed unless the key derives to
the public `TWALDOGE_MINTER_ADDRESS`.

## No private keys in source control

No private key or seed phrase belongs in this repository, in any config file, or in the frontend.
The faucet key exists only as an environment-managed edge-function secret and is never logged,
returned, or echoed in an error message.

### Environment variables

Public (non-secret) configuration:

| Name | Meaning |
| --- | --- |
| `TWALDOGE_TOKEN_ADDRESS` | deployed `WaldogeTestnetToken` address |
| `TWALDOGE_MINTER_ADDRESS` | public address of the dedicated faucet minter EOA |
| `TWALDOGE_CHAIN_ID` | must be `6281971` |

Optional tightening: `TWALDOGE_FAUCET_AMOUNT_WEI` (≤ 100e18), `TWALDOGE_FAUCET_COOLDOWN_SECONDS`
(≥ 86400).

Secret (edge-function secret store only, never committed):

| Name | Meaning |
| --- | --- |
| `TWALDOGE_FAUCET_MINTER_PRIVATE_KEY` | dedicated faucet authority key — **not** the SOG signer key |

None of these are configured yet, so the faucet currently fails closed with a 503.

## Explicitly NOT part of this phase

- No deployment of `WaldogeTestnetToken` (or anything else).
- No granting of `MINTER_ROLE` — the faucet authority will hold it *eventually*, but nothing is
  deployed, so no role has been or can be granted yet.
- No funding of any wallet, no key generation, no key access.
- No changes to `StreetsOfGainsRewards.sol`, the SOG backend reward/signing logic, the SOG frontend
  reward flow, or `src/game/**`.

## Files

| File | Role |
| --- | --- |
| `supabase/functions/_shared/faucet/config.ts` | env-based config, chain-id lock, address validation, caps (dependency-free) |
| `supabase/functions/_shared/faucet/claim.ts` | pure claim engine with injected store/minter |
| `supabase/functions/_shared/faucet/store.ts` | Supabase-backed claim log (Deno only) |
| `supabase/functions/_shared/faucet/minter.ts` | dedicated minter, viem write to `mint(address,uint256)` (Deno only) |
| `supabase/functions/twaldoge-faucet-claim/index.ts` | HTTP endpoint |
| `supabase/functions/_shared/faucet/__tests__/faucet.test.ts` | 22 vitest tests |
