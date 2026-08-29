# Streets of Gains — Rewards Contract (Phase 2B)

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

### Replay protection (two complementary mechanisms)

1. **EIP-712 domain** binds chainId + verifyingContract → no cross-chain / cross-contract replay.
2. **`msg.sender == attestation.player`** → wallet A's attestation is useless to wallet B.
3. **Per-player monotonic nonce** (`nonces[player]`) → an old attestation can never be replayed, and the backend cannot accidentally authorise two concurrent runs out of order.
4. **One-shot `runProcessed[runId]`** → the same authorised run cannot be paid twice even if the backend re-signs it with a fresh nonce (retry idempotency).
5. **`deadline`** → bounded validity window.

Nonce alone would not stop a re-signed duplicate run; runId alone would not stop an "old but never used" attestation being held back and replayed after limits change. Both are kept.

### Reward accounting

- `submitRun` moves no tokens. It increments `pendingRewards[player]` and `totalEntitled`.
- `claimReward` zeroes `pendingRewards[msg.sender]`, decrements `totalEntitled`, then `safeTransfer`s (checks-effects-interactions + `ReentrancyGuard`).
- Caps enforced at accrual time: `maxRewardPerRun`, `maxRewardPerWalletPerEpoch`, `maxRewardPoolPerEpoch`, each additionally bounded by immutable hard ceilings (`1_000e18` / `10_000e18` / `1_000_000e18`).
- `recoverUnentitled` can only move `balance - totalEntitled`, so admin can never take accrued player rewards.

### Epoch model

`epoch = (block.timestamp - epochGenesis) / epochLength`, `epochLength` immutable (1 day at deploy). Wallet and pool caps reset per epoch. No loops anywhere.

### Powers

**Admin (owner, two-step transfer):** rotate signer · pause/unpause · set reward caps within hard ceilings · withdraw unentitled reward tokens · rescue foreign ERC-20s.
**Admin cannot:** mint entitlements, take accrued rewards, change reward token, change epoch length, upgrade.
**Player:** `submitRun` (own attestation only) · `claimReward` (own balance only).

### Gas (optimizer 800, from `forge test --gas-report`)

| function | min | avg | max |
| --- | --- | --- | --- |
| `submitRun` | 26,840 | 109,494 | 230,722 |
| `claimReward` | 28,574 | 48,162 | 65,545 |

Deployment: ~1,963,552 gas, 10,191 bytes.

## Trust assumptions / remaining review items

- The backend signer is fully trusted to score runs honestly; caps bound the blast radius, they do not prevent abuse.
- Reward token is assumed to be a standard, non-rebasing, non-fee-on-transfer ERC-20. Testnet WDOGE (`0xF6BDB158A5ddF77F1B83bC9074F6a472c58D78aE`) was verified as a standard 18-decimal ERC-20, but it is a testnet asset with no value.
- `pause()` also blocks claims — deliberate, but it means the admin can temporarily freeze player withdrawals.
- Signature malleability is handled by OZ `ECDSA`; the nonce/runId checks also make malleated duplicates useless.
- **This contract has not been audited.** Signer key management, deployment parameters, epoch/cap tuning and the pause policy all still require human security review before mainnet-style use.
