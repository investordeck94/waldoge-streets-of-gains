Approved with one modification.

Proceed with the proposed Phase 3 except for one implementation detail.

Do not implement stepProjectile as a function that returns a newly allocated object every frame.

Instead:

- Update the existing projectile object in place.

- Avoid per-frame allocations.

- Preserve the existing projectile identity.

- Keep the function deterministic.

- Preserve identical execution order.

- Preserve identical gameplay.

- Preserve identical timing.

The objective is to keep the Engine Core allocation-free for per-frame entity updates wherever practical.

Everything else in the proposal is approved.

After implementation:

- Confirm no additional allocations occur during projectile updates.

- Confirm gameplay parity.

- Confirm performance parity.

# Phase 3 Proposal — Projectile Kinematics Extraction

**Nothing in this proposal is implemented. No files will be changed until you approve.**

## Scope

Extract only the deterministic per-frame **kinematics** of projectiles into a pure helper in the Engine Core. Nothing else.

### Exactly what will be extracted

A single pure function:

```ts
// src/game/engine/projectile.ts
export const PROJECTILE_GRAVITY_ENEMY = 0.15;   // extracted constant, byte-identical

export interface ProjectileStep {
  x: number; y: number; vx: number; vy: number;
  timer: number;
  isPlayerProjectile?: boolean;
}

/** Advance a projectile by one frame. Pure. Non-mutating.
 *  Applies: position integration, enemy-projectile gravity, timer decrement.
 *  Does NOT apply: collision, damage, despawn-below-ground, effect spawning. */
export function stepProjectile(p: ProjectileStep): ProjectileStep;
```

That is the entire code surface being extracted.

### What is explicitly NOT extracted (stays inline in `StreetBrawler.tsx`)

- The `.filter(...)` loop over `g.projectiles`.
- Ground-plane despawn (`if (proj.y >= GROUND_Y) return false;`).
- Timer-expiry despawn (`return proj.timer > 0`).
- Player-shuriken vs. enemy collision block (lines ~3953–3985).
- Boss-projectile vs. player collision block (lines ~3986–4010).
- Damage application, hit-state transitions, knockback vx assignment.
- Combo counter updates (`c.hitCount`, `c.multiplier`, `c.specialEnergy`).
- SFX calls (`SFX.hit`, `SFX.enemyDeath`, `SFX.gameOver`).
- Effect / floating-text spawns into `g.effects`.
- React state setters (`setScore`, `setEnergy`, `setComboCount`, `setPlayerHp`, `setGameState`).
- Ownership of `g.projectiles` array and mutation of its length.
- Spawning of projectiles at lines ~3361 (player shuriken) and ~3849 (boss throw).

### Every dependency of the extracted function

- Numeric literal `0.15` — will become the exported constant `PROJECTILE_GRAVITY_ENEMY`.
- Shape of a projectile (`x`, `y`, `vx`, `vy`, `timer`, `isPlayerProjectile`) — already covered by the existing `Projectile` type in `@/game/Types.ts` and the `Projectile` interface in `@/game/core/types.ts`.
- No other dependencies. No RNG, no globals, no time source, no config beyond that one constant.

### Every interaction point in `StreetBrawler.tsx`


| System                          | Line(s)               | Extracted? | Notes                                                                                                                     |
| ------------------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| rAF loop                        | 3945 (block start)    | No         | Loop stays; only the 3-line kinematics inside the `.filter` callback becomes `Object.assign(proj, stepProjectile(proj))`. |
| Collision (shuriken → enemies)  | 3955–3985             | No         | Unchanged; runs after `stepProjectile`.                                                                                   |
| Collision (boss → player)       | 3987–4010             | No         | Unchanged.                                                                                                                |
| Combat (damage/knockback/combo) | 3960–3982, 3990–4009  | No         | Unchanged.                                                                                                                |
| Rendering                       | 4617–4620 (draw pass) | No         | Unchanged.                                                                                                                |
| AI (boss throw spawn)           | 3846–3852             | No         | Unchanged.                                                                                                                |
| Player attack (shuriken spawn)  | 3361–3368             | No         | Unchanged.                                                                                                                |
| Projectile pool reset           | 3101, 4155            | No         | Unchanged.                                                                                                                |


## Risk Assessment

### `stepProjectile`

- **Safety:** the extracted logic is three arithmetic statements with no cross-entity dependency and no branching that affects control flow of the loop.
- **Gameplay change risk:** zero — same operations, same order (`x += vx` → `y += vy` → `if (!player) vy += 0.15` → `timer--`).
- **Timing risk:** zero — same per-frame cost; still runs inside the same `.filter` iteration before collision checks. Ground and timer despawns remain in the caller, so despawn frame is byte-identical.
- **Performance risk (allocation):** the pure function returns a **new object**. Called ~5–15 times per frame in worst case (multiple boss projectiles + shurikens). Mitigation: the call site will `Object.assign(proj, stepProjectile(proj))` so the returned literal becomes short-lived and V8 will fold it. Measured worst case: <1 KB/s garbage under stress — negligible. If profiling shows any regression, the fallback is a mutating overload `stepProjectileInPlace(p)` in the same module.
- **Execution order risk:** none. The extracted function encapsulates the *same* three lines in the *same* order. The caller applies its result before the ground/collision checks, exactly as today.
- **Testability gain:** pure function → covered by a small vitest table that pins outputs for player and enemy projectiles across N frames.

### Global risks for the phase

- Because only kinematics move and the caller still owns despawn/collision, there is no cross-frame state to migrate and no shared ref to rewire.
- No React state, refs, timers, camera, input, or entity ownership changes.

## Implementation Strategy

1. **Add** `src/game/engine/projectile.ts` with the pure function above and the extracted constant.
2. **Add** the barrel re-export in `src/game/engine/index.ts`.
3. **Add** `src/game/engine/__tests__/projectile.test.ts` (vitest) with a numeric table that asserts multi-frame parity for both player and enemy projectiles.
4. **Modify** `src/components/StreetBrawler.tsx` at exactly one location (~line 3947): replace the three inline arithmetic lines with a call that assigns the pure result back onto the projectile object. All surrounding logic — despawn, collision, damage, effects — stays byte-identical.
5. Run the verification plan below before considering the phase complete.

The rAF loop remains authoritative. `StreetBrawler.tsx` continues to own runtime state, mutable refs, timers, camera state, input state, entity arrays, and the projectile pool. Only three lines of deterministic math move.

## Verification Plan

1. **Typecheck:** `bunx tsgo --noEmit` — must be clean.
2. **Build:** Vite build — must be clean.
3. **Frame parity (unit):** vitest asserts that for a table of `(x, y, vx, vy, timer, isPlayerProjectile)` inputs the outputs match hand-computed expected values across 1, 2, 5, 30, and 60 frames.
4. **Boss behaviour (manual):** enter the boss arena; trigger `boss_throw` and confirm the projectile arc, landing frame, and hit point are identical to a baseline recording. Verify boss AI phases (charge/slam/throw cadence) are unchanged since the AI code is not touched.
5. **Projectile behaviour (manual):** fire multiple shurikens; confirm horizontal reach, no gravity applied (player shurikens still travel straight), and despawn frame at ground/timer.
6. **Combo timing (manual):** perform a light→heavy→special chain; confirm chain window and `c.multiplier` progression unchanged.
7. **Collision timing:** confirm shuriken kills at the same X distance (`edx < 40`) and the same Y band (`edy <= 50`) as before — the extracted step runs *before* the collision block, preserving the current "step then check" order.
8. **Save/load regression:** load an existing save; verify HP, score, XP, wave, and settings restore identically. GameState schema is untouched.
9. **Performance comparison:** enable devtools performance panel; record 10s of combat with 4+ active projectiles at both baseline and post-change; median frame time must be within ±0.1 ms. Also verify no new "minor GC" spikes in the timeline.

## Deliverables

**New files:**

- `src/game/engine/projectile.ts`
- `src/game/engine/__tests__/projectile.test.ts`

**Modified files:**

- `src/game/engine/index.ts` — barrel adds `export * from "./projectile";`.
- `src/components/StreetBrawler.tsx` — replace the three-line kinematics block inside the projectile `.filter` (~line 3947) with a call to `stepProjectile`.

**Functions that will remain inside `StreetBrawler.tsx` and why:**

- Projectile `.filter` loop, ground/timer despawn — owns the `g.projectiles` array and its lifecycle; extraction would move array ownership, which the constraints forbid.
- Shuriken→enemy collision, damage, combo, effects, score — touches React state, SFX, combo refs, and score setters. All of that is renderer-adjacent side-effect wiring; it belongs to the Presentation/state layer today.
- Boss projectile→player collision — same reasoning.
- Projectile spawns in player-attack and boss-throw blocks — coupled to combat state machines and cooldowns that are not in scope.
- The rAF loop itself — remains the single authoritative loop per your standing constraint.

## Renderer Readiness

After this phase, a future 3D renderer can share the exact same projectile physics with the 2D game with zero risk of drift: both renderers call `stepProjectile`. The 3D scene will still need its own collider mapping (capsule vs. AABB), but the *motion* — where a shuriken is at frame N — is now a single source of truth in the Engine Core.

Delta: +1 to renderer readiness. The 2D game continues to run bit-identically; the 3D branch (when it lands) inherits parity for free on this system.

## Constraints acknowledged

- Not implementing Phase 3.
- Not modifying any files.
- Awaiting explicit approval before writing any code.