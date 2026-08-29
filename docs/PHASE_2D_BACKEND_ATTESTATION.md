# Phase 2D — Backend Reward Attestation (DogeOS Chikyū testnet)

**Status: implemented, NOT deployed.** No contract deployment, no funding, no
DogeOS transactions, no real signer key exists as a result of this phase.

## 1. Architecture

```text
player finishes a run (2D Streets of Gains, unchanged)
  ↓
wallet-ownership sign-in (personal_sign challenge)      sog-auth-challenge / sog-auth-verify
  ↓  opaque session token (SHA-256 hash stored server-side)
run submitted to the backend                            sog-submit-run
  ↓  validate → rate limit → duplicate check → reward calculation
  ↓  READ nonces(player) from DogeOS RPC
  ↓  build EIP-712 RunAttestation → sign with server-only key
attestation + signature returned to the browser
  ↓
player's wallet calls StreetsOfGainsRewards.submitRun()  (msg.sender == player)
  ↓  reward accrues (pending)
player calls claimReward()                               (never done by the backend)
```

The backend is the **only** system able to produce a valid reward signature.
It never submits or claims on the player's behalf.

## 2. Endpoints

| Function | Auth | Purpose |
| --- | --- | --- |
| `sog-auth-challenge` | none | issues a single-use, 5-minute signing message for a wallet |
| `sog-auth-verify` | signature | verifies `personal_sign`, consumes the challenge, issues a 12-hour session |
| `sog-submit-run` | `x-sog-session` | validates a run and returns a signed attestation |
| `sog-run-status` | `x-sog-session` | records the client-reported broadcast tx hash |

## 3. Authentication and wallet ownership

The project has no Supabase Auth user system; Phase 1B identity is a
browser-local normalized (lowercase) EVM address, which is **not** an
authentication mechanism. Phase 2D therefore adds the smallest secure
ownership proof: an EIP-191 `personal_sign` challenge over a server-issued,
single-use nonce. The recovered address — never the body-declared one — becomes
the session's wallet. Reward endpoints derive the player from the session only;
a `wallet` field in the body is accepted solely as a cross-check and any
mismatch returns `wallet mismatch`.

This reuses the Phase 1A EIP-1193 provider and the Phase 1B normalization
rules. No second wallet stack and no competing identity system were created.

## 4. Nonce handling (critical)

`StreetsOfGainsRewards` enforces **strict nonce equality**
(`a.nonce == nonces[player]`). The backend therefore:

- reads `nonces(player)` over JSON-RPC from `https://rpc.testnet.dogeos.com`
  immediately before every signature,
- keeps **no** local nonce counter, no cache, no `previous + 1` assumption,
- never accepts a nonce from the browser.

A failed RPC read returns `nonce synchronization error` (503) and signs nothing.

## 5. EIP-712 domain and struct

```text
domain:  name "StreetsOfGainsRewards", version "1",
         chainId 6281971 (0x5FDAF3), verifyingContract = deployed address

RunAttestation(address player,uint256 score,uint32 wave,uint16 level,
               bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)
```

Field order and types are asserted against the Solidity typehash in
`supabase/functions/_shared/sog/__tests__/attestation.test.ts`, and a full
signature is replayed through the real contract in
`contracts/test/StreetsOfGainsRewards.backendCompat.t.sol`.

## 6. Server-controlled values

Never accepted from the browser: `rewardAmount`, `nonce`, `deadline`, `runId`,
`signer`, `chainId`, `contractAddress`, RPC URL, reward caps.

- **runId**: 32 bytes of CSPRNG output per authorization (never timestamp-derived).
- **deadline**: `now + 900s` (15 minutes) — short by design.
- **reward**: `supabase/functions/_shared/sog/reward.ts`, milestone-based on
  waves plus a capped score bonus, hard-clamped to the per-run cap and to the
  remaining wallet/epoch and pool/epoch headroom so the backend never signs an
  attestation that would predictably revert.

## 7. Secrets

| Variable | Where | Notes |
| --- | --- | --- |
| `SOG_SIGNER_PRIVATE_KEY` | backend secret only | example only: `0x<64 hex chars>` — **never a real key in docs, code, git, or frontend env** |
| `SOG_REWARDS_CONTRACT_ADDRESS` | backend secret/config | unset until deployment; endpoints fail closed with 503 |
| `SOG_EXPECTED_SIGNER_ADDRESS` | backend config (optional) | if set and the key derives a different address, the backend **fails closed** |
| `SOG_MAX_REWARD_PER_RUN_WEI` etc. | backend config (optional) | may only *tighten* the deploy-time caps |

The key is never logged, returned, or included in any error. Signer load
failures return the opaque string `signer configuration error`.

## 8. Replay protection

- **On-chain (authoritative):** `keccak256(player, runId)` + strict nonce.
- **Database (defence in depth):** unique index on `(wallet, run_id)` and on
  `(wallet, client_run_key)`, where `client_run_key` is a server-derived
  SHA-256 fingerprint of the logical run. The row is inserted *before* signing,
  so the database — not application logic — is the gate.

## 9. Rate limiting and abuse control

Authenticated requests only; max 12 authorizations per wallet per hour;
per-run/per-wallet-epoch/per-epoch-pool reward ceilings; strict payload
validation; duplicate rejection. The Solidity contract is the last line of
defence, not the only one.

## 10. Attestation status model

`authorized → submitted → confirmed → claimed`, plus `rejected`.

Phase 2D implements `authorized` and `submitted` only. `submitted` records a
**client-reported** transaction hash and is **not** proof of inclusion.
`confirmed` and `claimed` require a receipt/event indexer — a later phase.

## 11. Anti-cheat boundary (read this)

> The server validates the submitted run according to the configured
> validation rules and authorizes a reward. The contract verifies
> authorization integrity, not gameplay authenticity.

The game engine emits no signed or deterministic run transcript, so the backend
**cannot** prove a run was genuinely played. `validation.ts` applies structural
bounds and plausibility heuristics (score/wave/level ranges, minimum time per
wave, maximum score per wave) — these reject nonsense, they do not prove
legitimacy. No telemetry was added to the game engine in this phase.

What could eventually be validated server-side if the engine ever emits it: a
seeded deterministic run log (RNG seed + input timeline) that the server can
replay headlessly. That is a separate, opt-in decision — not part of Phase 2D.

## 12. Testnet only

DogeOS Chikyū testnet, chain id 6281971. Reward token is testnet WDOGE. The
contract remains unaudited, non-upgradeable and **undeployed**.
