# Streets of Gains — Rewards Contract (Phase 2B + 2C hardening)

Self-contained Foundry project. **Nothing here is deployed, wired to the frontend, or connected to a backend.**

## Setup

Libraries are not committed (`lib/` is gitignored):

```bash
cd contracts/lib
curl -sL https://github.com/foundry-rs/forge-std/archive/refs/tags/v1.9.6.tar.gz | tar xz && mv forge-std-1.9.6 forge-std
curl -sL https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/v5.1.0.tar.gz | tar xz && mv openzeppelin-contracts-5.1.0 openzeppelin-contracts
cd .. && forge test
```

- Solidity `0.8.24`, evm version `paris` (safe for DogeOS Chikyū), optimizer on (800 runs)
- OpenZeppelin Contracts `5.1.0`, forge-std `1.9.6`

## Architecture

`src/StreetsOfGainsRewards.sol` — single, **non-upgradeable** contract.

```
backend validates run -> signs EIP-712 attestation
player calls submitRun(attestation, signature)   // verify + record + accrue, NO transfer
player calls claimReward()                       // transfer only
```

### EIP-712 domain

| field | value |
| --- | --- |
| name | `StreetsOfGainsRewards` |
| version | `1` |
| chainId | `6281971` (DogeOS Chikyū) |
| verifyingContract | deployed address |

### Attestation

```
RunAttestation(address player,uint256 score,uint32 wave,uint16 level,bytes32 runId,uint256 nonce,uint256 deadline,uint256 rewardAmount)
```

### Replay protection (complementary mechanisms)

1. **EIP-712 domain** binds chainId + verifyingContract → no cross-chain / cross-contract replay.
2. **`msg.sender == attestation.player`** → wallet A's attestation is useless to wallet B.
3. **Per-player monotonic nonce** (`nonces[player]`) → an old attestation can never be replayed, and the backend cannot accidentally authorise two concurrent runs out of order.
4. **One-shot run key** `runProcessed[keccak256(abi.encode(player, runId))]` → the same authorised run cannot be paid twice even if the backend re-signs it with a fresh nonce (retry idempotency). Since Phase 2C the key is **bound to the player**: two players may legitimately share a raw `runId`, and no wallet can burn (grief) another wallet's `runId`. Helpers: `runKeyOf(player, runId)`, `isRunProcessed(player, runId)`.
5. **`deadline`** → bounded validity window (`deadline == block.timestamp` is still valid).

Nonce alone would not stop a re-signed duplicate run; the run key alone would not stop an "old but never used" attestation being held back and replayed after limits change. Both are kept.

### Nonce liveness — backend requirement (MEDIUM-2)

Nonces are **strict equality**; replay protection is deliberately not weakened.

- The backend **MUST** read `nonces(player)` from the contract immediately before signing every attestation.
- The backend **MUST NOT** keep its own nonce counter. An independent counter drifts from the contract and produces `BadNonce` reverts.
- A signed-but-never-submitted attestation consumes **nothing** on-chain. It simply expires at its `deadline`; the wallet is never bricked.
- Recovery from drift is: re-read `nonces(player)`, re-sign with a fresh `runId`, resubmit.

Covered by `test_UnsubmittedAttestationDoesNotBrickWallet` and `test_OperatorCanResyncAfterNonceDrift`.

### Reward accounting

- `submitRun` moves no tokens. It increments `pendingRewards[player]` and `totalEntitled`.
- `claimReward` zeroes `pendingRewards[msg.sender]`, decrements `totalEntitled`, then `safeTransfer`s (checks-effects-interactions + `ReentrancyGuard`).
- Caps enforced at accrual time: `maxRewardPerRun`, `maxRewardPerWalletPerEpoch`, `maxRewardPoolPerEpoch`, each additionally bounded by immutable hard ceilings (`1_000e18` / `10_000e18` / `1_000_000e18`).
- `recoverUnentitled` can only move `balance - totalEntitled`, so admin can never take accrued player rewards.
- **Pause never blocks claims (HIGH-3).** `submitRun` is `whenNotPaused`; `claimReward` is not. Pausing halts new attestations only — anything already accrued stays claimable forever, even if the owner key is lost while paused.

### Epoch model

`epoch = (block.timestamp - epochGenesis) / epochLength`, `epochLength` immutable (1 day at deploy). Wallet and pool caps reset per epoch. No loops anywhere.

### Powers

**Admin (owner, two-step transfer):** rotate signer · pause/unpause **new submissions only** · set reward caps within hard ceilings · withdraw unentitled reward tokens · rescue foreign ERC-20s.
**Admin cannot:** mint entitlements, take accrued rewards, freeze accrued claims, change reward token, change epoch length, upgrade.
**Player:** `submitRun` (own attestation only) · `claimReward` (own balance only).

### Gas (optimizer 800, from `forge test --gas-report`)

| function | min | avg | max |
| --- | --- | --- | --- |
| `submitRun` | 26,840 | 109,494 | 230,722 |
| `claimReward` | 28,574 | 48,162 | 65,545 |

Deployment: ~1,963,552 gas, 10,191 bytes.

## Security model (read before deploying)

**Client is untrusted.** Gameplay runs entirely in the browser. Scores, waves and levels can be fabricated by anyone with dev tools. The contract never sees gameplay.

**The backend signer is the reward integrity boundary.** The contract verifies that an attestation was signed by `signer`, issued to `msg.sender`, unexpired, unreplayed and within caps. It does **not** and cannot verify that the run actually happened. Anti-cheat is therefore **cheat-bounded, not cheat-proof**: caps bound the damage, they do not prevent dishonest scoring.

**Signer compromise.** A stolen signer key can mint entitlements up to `maxRewardPerRun` per run, `maxRewardPerWalletPerEpoch` per wallet per epoch and `maxRewardPoolPerEpoch` across all wallets per epoch — and can repeat that **every epoch**. There is no global lifetime cap (adding one would either strand the contract permanently or need a second admin lever; it was deliberately not added). The practical mitigations are operational:

- **Epoch pool = blast radius.** The deployed `maxRewardPoolPerEpoch` is an operational risk limit, not a budget target.
- **Fund only ~1–2 epochs of WDOGE at a time.** The contract cannot pay out tokens it does not hold; under-funding is the real ceiling.
- Rotate the signer (`setSigner`) and `pause()` submissions immediately on suspicion — accrued claims stay live.

**Owner / signer separation (HIGH-2).** `owner` is the administrative authority; `signer` is the attestation authority. They must be different accounts. Production/testnet deployments should use a **multisig owner** and a **separate signer EOA**. `Deploy.s.sol` reverts if `SOG_OWNER == SOG_SIGNER` or either is the zero address. A **timelock on admin changes is future work** — it was deliberately not added in Phase 2C to avoid expanding the contract surface.

**Owner powers remain meaningful.** A compromised owner can raise caps to the hard ceilings and rotate the signer, which combined with a funded contract is a drain path. Multisig ownership is the mitigation.

**WDOGE assumptions.** The reward token is immutable and assumed to be a standard, non-rebasing, non-fee-on-transfer, non-blacklisting 18-decimal ERC-20. Testnet WDOGE `0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE` was verified as such. Hostile-token behaviour (revert, `false` return, reentrancy, fee-on-transfer, blacklist) is covered by tests: transfers that fail leave the entitlement intact and claimable later; a fee-on-transfer token would under-deliver to the player (documented, not fixed, since the token is fixed at deploy).

**Deployment constraints.** Must be deployed on **chain 6281971** (DogeOS Chikyū) — `Deploy.s.sol` reverts otherwise, and also requires `WDOGE.code.length > 0`. The contract is **non-upgradeable**: there is no proxy and no migration path; a redeploy means a new address and a new EIP-712 domain.

**This is not an audited production contract.** It targets a valueless testnet asset.

## Deployment parameters (conservative testnet defaults)

`script/Deploy.s.sol` — **not executed**. Pre-flight requires chain 6281971, live WDOGE bytecode, non-zero and distinct owner/signer. After deployment it reads the configuration back from the chain, asserts every field, and prints it.

| parameter | value | rationale |
| --- | --- | --- |
| `epochLength` | 1 day | matches daily reward cadence |
| `maxRewardPerRun` | 10 WDOGE | best-case single run |
| `maxRewardPerWalletPerEpoch` | 50 WDOGE | ~5 rewarded runs per wallet per day |
| `maxRewardPoolPerEpoch` | 1,000 WDOGE | ~20 active testnet wallets at full allowance |

Hard ceilings in the contract stay far above these (`1,000` / `10,000` / `1,000,000` WDOGE) so caps can be tuned without redeploying. **Fund at most 1–2 epoch pools (≤ ~2,000 WDOGE).**

## Tests

```bash
forge test                      # unit + boundary + fuzz
forge test --match-contract Invariant   # stateful invariants
```

- Unit + boundary + fuzz: 68 tests (`fuzz.runs = 1024`).
- Invariants: 9 properties, `runs = 512`, `depth = 100` → 51,200 calls each.
- Invariants cover: `totalEntitled == Σ pendingRewards`; `epochPoolUsed == Σ epochPaid`; caps never exceeded; accrued == claimed + outstanding; token balance reconciles with funding − claims − recoveries; nonce increments exactly once per successful submission; processed run keys never revert to false; solvency preserved across `recoverUnentitled`; entitlements never destroyed by pausing.

## Future work (explicitly NOT in Phase 2C)

- Backend attestation endpoint (nonce read, run validation, EIP-712 signing, key custody)
- Server-side replay verification and run-legitimacy heuristics
- Timelocked admin changes
- Guardian / emergency-pause role separate from the owner
- Frontend submission + claim UI
- Leaderboard indexing
- Independent production audit
- Deployment itself (nothing has been deployed)

## WaldogeTestnetToken (tWALDOGE) — testnet only

`src/WaldogeTestnetToken.sol` — "Waldoge Testnet" / `tWALDOGE`, 18 decimals, OpenZeppelin `ERC20` + `AccessControl`.

**This token has NO monetary value.** It exists solely for the DogeOS Chikyū testnet (chain id 6281971):
no price, no backing, no redemption, not an investment. It must never be deployed to, bridged to, or
listed on any production/mainnet environment. Balances may be wiped at any time.

- Mint authority is separated from admin authority: `DEFAULT_ADMIN_ROLE` (role management only, cannot
  mint) and `MINTER_ROLE` (the only role that can call `mint`/`mintBatch`, intended for a future faucet).
- Both addresses are constructor arguments; the deployer receives no privileges and no supply is pre-minted.
- `MAX_MINT_PER_CALL = 1,000,000e18` bounds a single mint; every mint emits `TestnetMint`.
- `burn(uint256)` lets holders burn their own balance when resetting test wallets.
- Fully independent of `StreetsOfGainsRewards.sol`. Tests: `test/WaldogeTestnetToken.t.sol` (17 tests).
- Not deployed. No deployment script is provided.
