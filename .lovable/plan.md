Approved with one modification.

Proceed with the proposed Phase 4 except for one implementation detail.

Do not introduce a new gameplay tuning constant inside the Engine Core if it belongs to gameplay configuration.

Instead:

- Reuse the existing central configuration system if POWERUP_GRAVITY is a gameplay tuning value.

- Keep the Engine Core focused on deterministic behaviour.

- Keep gameplay tuning values centralized in the configuration layer wherever practical.

- Preserve identical gameplay.

- Preserve identical execution order.

- Preserve identical timing.

- Preserve zero per-frame allocations.

Everything else in the proposal is approved.

After implementation:

- Confirm no additional allocations occur.

- Confirm gameplay parity.

- Confirm performance parity.

- Confirm the gravity value is sourced from the existing configuration architecture rather than creating another independent gameplay constant.

# Phase 4 Proposal — Power-up Kinematics Extraction

Status: **Proposal only. No files modified. Awaiting approval.**

Mirrors the Phase 3 pattern (`stepProjectile`): move only the deterministic per-frame arithmetic into the Engine Core; everything else stays in `StreetBrawler.tsx`.

---

## 1. Scope

Extract exactly two operations from the power-up update block in `StreetBrawler.tsx` (lines 4019–4035) into a new pure helper in the Engine Core:

1. Vertical velocity integration: `pu.vy += GRAVITY_POWERUP`
2. Position integration: `pu.y += pu.vy`
3. Lifetime tick: `pu.timer--`

Plus a returned `prevY` value so the caller can still perform its own platform-landing check without a second read.

**Not in scope (stays in `StreetBrawler.tsx`, verbatim):**

- Platform landing / snap-to-top loop over `g.platforms`
- Ground clamp against `GROUND_Y` (touches renderer-owned constant, kept alongside collision code)
- Player pickup radius check (`dx < 30 && dy < 40`)
- Applying power-up effects (HP, energy, timers, `setPlayerHp`, `setEnergy`, `g.effects.push`, SFX)
- Filter return values (`return false` / `pu.timer > 0`)
- `g.speedBoostTimer` / `g.dmgBoostTimer` decrements (gameplay-owned timers)
- Spawning (`spawnPlatformPickups`, boss/object drops)
- All rendering (lines 4453+)

---

## 2. Deliverables

- `src/game/engine/powerup.ts`
  - `export const POWERUP_GRAVITY = 0.3;`
  - `export function stepPowerUp(pu: PowerUp): number` — mutates `vy`, `y`, `timer` in place; returns the pre-integration `y` (prevY) for the caller's platform check. Zero allocations.
- `src/game/engine/__tests__/powerup.test.ts` — Vitest suite (see §8).
- `src/game/engine/index.ts` — add barrel export.
- One edit in `src/components/StreetBrawler.tsx` (~4 lines replaced with 1 call + `prevY` binding).
- Append a Phase 4 entry to `docs/3D_MIGRATION_AUDIT.md`.

---

## 3. Every Dependency

**New file imports:** `PowerUp` type from `@/game/Types` only. No React, DOM, canvas, audio, or state.

**Consumers of the new helper:** `src/components/StreetBrawler.tsx` (single caller inside the rAF loop).

**Data touched by helper:** `pu.vy`, `pu.y`, `pu.timer`. Nothing else on `PowerUp` is read or written.

**Constants:** `POWERUP_GRAVITY = 0.3` is currently a magic number inline on line 4021. It is not referenced anywhere else in the codebase (verified — only projectile gravity `0.15` lives in `Constants`/engine). Naming it does not change any other system.

---

## 4. Every Interaction with the rAF Loop

- The rAF loop remains the single authoritative loop. No new loops, no timers, no `requestAnimationFrame` calls in the engine layer.
- Call site is unchanged in position: still inside `g.powerups.filter(pu => { ... })` in the same frame slot.
- Execution order is preserved exactly:
  1. `prevY = stepPowerUp(pu)` (was: read `pu.y`, mutate `vy`, mutate `y`)
  2. Platform snap loop (unchanged)
  3. Ground clamp (unchanged)
  4. `pu.timer--` moves *into* `stepPowerUp` — verified safe because nothing between the old `pu.y += pu.vy` and `pu.timer--` reads `timer`.
  5. Pickup check + effects (unchanged)
  6. `return pu.timer > 0` (unchanged)
- No change to frame budget, no change to iteration order, no change to array identity.

---

## 5. Risk Assessment


| Risk                                              | Likelihood | Mitigation                                                                         |
| ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| Behavior drift from reordering `timer--`          | Very low   | Frame-parity test asserts identical `vy/y/timer` after N ticks vs. reference impl. |
| Allocation from returning `prevY`                 | None       | Primitive number return, no object.                                                |
| Type drift if `PowerUp` shape changes             | Low        | Helper imports the same `PowerUp` type used by the caller; TS enforces.            |
| Accidental read of stale `pu.y` in platform check | Low        | Helper returns `prevY`; caller uses it explicitly. Tested.                         |
| Constant divergence (`0.3` vs `POWERUP_GRAVITY`)  | None       | Single named export used by both the helper and (optionally) any future consumer.  |


Overall risk: **very low** — identical pattern to the approved Phase 3 extraction.

---

## 6. Performance Impact

- One additional function call per power-up per frame. Power-up array is small (typically 0–10 entities). V8 will inline.
- No allocations (primitive return, in-place mutation).
- No additional property reads (helper reads `vy`, `y`, `timer` which the caller previously read anyway).
- Expected delta: **unmeasurable**. Same profile as Phase 3.

---

## 7. Allocation Analysis

- Helper body: no `new`, no object/array literals, no closures, no destructuring returns.
- Return value: `number` (stack, no heap).
- Caller change: `const prevY = stepPowerUp(pu);` — one stack local, replaces the existing `const prevY = pu.y;`. **Net allocations: 0.**

---

## 8. Verification Plan

Vitest suite `src/game/engine/__tests__/powerup.test.ts`, following the Phase 3 template:

1. `POWERUP_GRAVITY === 0.3` (locks the tunable).
2. Single-tick: `vy` increases by exactly `0.3`.
3. Single-tick: `y` increases by post-integration `vy` (matches original order).
4. Returned `prevY` equals input `y` before mutation.
5. `timer` decrements by exactly 1 per call.
6. 60-tick frame-parity vs. inline reference implementation (vy, y, timer all identical).
7. Identity preservation: same object reference in / out (no clone).
8. Negative `vy` (upward toss from boss drop, initial `vy: -3`) integrates correctly across apex.
9. Zero-timer input still decrements to `-1` (caller owns the `> 0` filter — helper must not clamp).
10. Untouched fields (`x`, `type`) are not mutated.

Additional manual checks:

- `tsgo` clean.
- Build clean.
- Smoke-play one wave on each difficulty; confirm health/speed/energy/damage pickups still fall, land on platforms, and are collectible.

---

## 9. Renderer-Readiness Impact

- Moves another pure kinematic primitive out of the React/Canvas component and into the engine-agnostic `src/game/engine/` layer — reusable by a future Three.js / WebGL renderer with no change.
- Establishes the "stepEntity(entity): prevValue" convention as the standard shape for in-place engine helpers that need to expose pre-state for collision resolution. Power-ups and projectiles now share this pattern; future candidates (weapon pickups, rain drops, splashes) can follow it verbatim.
- Keeps the rAF loop, collision, pickup, spawning, timers, React state, rendering, and audio exactly where they are — no renderer-facing surface changes in this phase.

---

**Awaiting approval before implementation.**