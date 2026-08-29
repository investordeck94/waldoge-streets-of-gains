# Phase 2E — Controlled DogeOS Chikyū Testnet Deployment

**Status: BLOCKED before broadcast. Nothing has been deployed.**
All pre-deployment verification that can be done without keys is complete and
passing. The remaining step requires credentials only the project owner holds.

---

## 1. Pre-deployment verification (complete)

### Chain

| Check | Result |
| --- | --- |
| `eth_chainId` on `https://rpc.testnet.dogeos.com` | `0x5fdaf3` = **6281971** ✓ |
| RPC reachable, chain live | yes, head block ≈ 7,339,000 ✓ |

### WDOGE `0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE`

Address read from `contracts/script/Deploy.s.sol` — **not** invented or substituted.

| Check | Result |
| --- | --- |
| bytecode present on chain | yes ✓ |
| `symbol()` | `WDOGE` ✓ |
| `decimals()` | 18 ✓ |
| fee-on-transfer | none — transfers credit the exact amount sent ✓ |
| rebasing | none — balances do not drift across a 7-day warp ✓ |
| transfer restrictions | none observed on the paths the contract uses ✓ |
| token type | wrapped-native (`deposit()`/`withdraw()`), standard ERC-20 surface |

### Deploy script guards (`contracts/script/Deploy.s.sol`)

- reverts `WrongChain` unless `block.chainid == 6281971` ✓
- reverts `RewardTokenHasNoCode` if WDOGE has no bytecode on the target chain ✓
- reverts `OwnerNotSet` / `SignerNotSet` / `OwnerMustDifferFromSigner` ✓
- reads back and asserts the full deployed configuration post-broadcast ✓
- WDOGE address and all four limits are compile-time constants, not env inputs ✓

### Fork rehearsal against real chain state

`contracts/test/StreetsOfGainsRewards.dogeosFork.t.sol` forks the live DogeOS
Chikyū testnet and runs the whole flow against the **real WDOGE contract**.
Nothing is broadcast; no key is used; no value moves.

```
FOUNDRY_PROFILE=fork forge test --match-path test/StreetsOfGainsRewards.dogeosFork.t.sol
7 passed, 0 failed
```

Covered: token due diligence, deployed-configuration assertions, happy path
submit → accrue → claim → wallet receives WDOGE, and the Phase 2E negative
matrix (replay, tampered reward/score/player/nonce/runId, expired attestation,
wrong wallet, double claim, zero-entitlement claim, insufficient funding, pause
blocks submit but never claim, entitlement survives pause, cross-player runId
griefing, recovery cannot take entitled funds). In every failure case no
entitlement was created and no tokens moved.

**Finding (non-blocking, tooling only):** the live WDOGE bytecode uses
post-paris opcodes, so fork tests must run under a cancun EVM. Added
`[profile.fork]` to `contracts/foundry.toml`; the default paris profile and the
deployment bytecode are unchanged.

Full suite status: 73 default tests + 7 fork tests + 66 vitest tests passing.

---

## 2. Deployment blocker

Deployment cannot proceed because three inputs do not exist in this project and
must not be fabricated:

1. **`SOG_OWNER`** — administrative address. Should be a multisig, or at minimum
   an address controlled separately from the signer. Never equal to the signer.
2. **`SOG_SIGNER`** — public address of the backend attestation EOA.
3. **A funded deployer key** — a DogeOS Chikyū testnet EOA holding enough native
   DOGE for gas, supplied to `forge script` at broadcast time. It is never
   written to a file, never committed, never sent to the frontend.

There is also no WDOGE in this environment to fund the contract with. Testnet
WDOGE is obtained by wrapping native testnet DOGE via `deposit()`.

Per the Phase 2E instruction to stop rather than work around a failure, no
substitute addresses were invented and nothing was broadcast.

---

## 3. Deployment runbook (execute when credentials exist)

Every command below is testnet-only and pinned to chain 6281971.

**Step 1 — deploy**

```bash
cd contracts
export SOG_OWNER=0x...       # multisig / separate admin
export SOG_SIGNER=0x...      # backend signer PUBLIC address
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.dogeos.com \
  --broadcast --interactives 1     # key entered interactively, never stored
```

Record the deployed address and the deploy tx hash from
`broadcast/Deploy.s.sol/6281971/run-latest.json`.

**Step 2 — independent read-back verification (no key, read-only)**

```bash
SOG_REWARDS_ADDRESS=0x... SOG_OWNER=0x... SOG_SIGNER=0x... \
  forge script script/Verify.s.sol --rpc-url https://rpc.testnet.dogeos.com
```

`script/Verify.s.sol` hard-fails unless: chain is 6281971, bytecode exists,
`rewardToken == WDOGE` with 18 decimals, owner and signer match and differ, both
non-zero, `epochLength == 1 day`, caps are exactly 10 / 50 / 1,000 WDOGE, the
contract is **not paused**, and `totalEntitled == 0`. It also prints the
`domainSeparator` and the current WDOGE balance. **Do not fund unless this
passes.**

**Step 3 — explorer verification**

```bash
forge verify-contract <address> src/StreetsOfGainsRewards.sol:StreetsOfGainsRewards \
  --chain-id 6281971 --verifier blockscout \
  --verifier-url https://blockscout.testnet.dogeos.com/api
```

**Step 4 — backend configuration** (backend secrets only, never Vite/browser env)

| Secret | Value |
| --- | --- |
| `SOG_REWARDS_CONTRACT_ADDRESS` | deployed address |
| `SOG_SIGNER_PRIVATE_KEY` | signer key — server-side only, never logged or returned |
| `SOG_EXPECTED_SIGNER_ADDRESS` | signer public address; backend fails closed on mismatch |

Chain id, RPC, WDOGE address and the EIP-712 domain are already pinned in
`supabase/functions/_shared/sog/config.ts`.

**Step 5 — conservative funding**

Wrap and transfer **1,000–2,000 WDOGE** (one to two epoch pools) to the contract.
No treasury-style deposit. The configured epoch pool is the blast radius of a
signer compromise.

**Step 6 — live end-to-end run with wallet A**, then re-run the negative matrix
against the deployed contract, recording player, contract, runId, nonce, reward,
submit tx, claim tx, entitlement and resulting WDOGE balance.

---

## 4. Code changes made in Phase 2E

- `contracts/test/StreetsOfGainsRewards.dogeosFork.t.sol` — new fork rehearsal suite.
- `contracts/script/Verify.s.sol` — new read-only post-deployment verifier.
- `contracts/foundry.toml` — added `[profile.fork]`; excluded the fork suite from
  the default run.
- No change to `StreetsOfGainsRewards.sol`, `Deploy.s.sol`, the backend, the
  frontend, or `src/game/**`.

---

## 5. Standing limits

This is a controlled testnet exercise. The contract is **unaudited** and
non-upgradeable. Testnet success is not evidence of mainnet readiness. The
security boundary is unchanged:

> **Backend authorizes rewards. Contract authenticates the authorization.
> The contract does not prove gameplay authenticity.**
