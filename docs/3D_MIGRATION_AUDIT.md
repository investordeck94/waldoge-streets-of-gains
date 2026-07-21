# 3D Compatibility Audit — StreetBrawler

**Scope:** `src/components/StreetBrawler.tsx` (~5,300 lines) plus supporting modules under `src/game/*` and `src/lib/*`.

**Goal:** identify what stops the gameplay engine from being reused behind a 3D renderer, and separate logic from rendering **without touching gameplay**.

**Status:** audit + engine-agnostic core modules landed (`src/game/core/*`). The 2D pipeline is unchanged; a future 3D scene can now import shared math, types and camera rules instead of forking them.

---

## 1. Tightly coupled systems

| Coupling | Location | Notes |
|---|---|---|
| Game loop ↔ canvas | `StreetBrawler.tsx` single `useEffect` around the RAF loop | State refs, input handlers, physics, AI, audio and `ctx.*` draw calls all live in the same closure. A 3D renderer would need to hoist the RAF driver out first. |
| Entity model ↔ AABB pixels | `interface Entity` (`width`, `height` in px) | Values are dimensionless world units in practice; a 3D layer can map 1 unit → 1 metre and reuse. |
| Camera ↔ world→screen bias | Every `drawXxx(ctx, e, camX)` signature | `camX` is passed into every draw function. Logic never subtracts `camX` — good; only renderers do. Migration is clean. |
| Audio ↔ actor state | `SFX.punch()` etc. called inline in state transitions | Audio calls sit alongside gameplay side-effects. Should be routed through an event bus (future work — non-blocking for 3D). |
| Input ↔ React state | `keys: Set<string>` ref inside the closure, `keyJustPressed` reset each frame | Already engine-agnostic in shape; a 3D pipeline can reuse the same set. |

## 2. Duplicated logic

| Duplication | Where | Fix |
|---|---|---|
| `Math.abs(a.x - b.x)` proximity checks | 4+ sites (`melee hit`, `powerup pickup`, `weapon pickup`, `projectile hit`) | ✅ Extracted → `horizontalDistance`, `withinHorizontalRange` in `@/game/core/aabb`. |
| AABB overlap open-coded | Melee + projectile paths | ✅ Extracted → `aabbOverlap`. |
| Gravity `vy += GRAVITY` | Player, enemies, powerups, projectiles | ✅ Extracted → `applyGravity` in `@/game/core/physics`. |
| Ground clamp `if (y >= GROUND_Y)` | Player, enemies, boss | ✅ Extracted → `clampToGround`. |
| Camera lerp with look-ahead | Snappy + buttery branches inline in the loop | ✅ Extracted → `computeCameraX` + `CAMERA_PRESETS` in `@/game/core/camera`. |
| Animation progress `stateTimer / N` | 20+ draw sites (`prog = e.stateTimer / 18` etc.) | ✅ Extracted → `progressOf`, `phaseOf`, easing in `@/game/core/anim`. |

## 3. Rendering dependencies

- **1,521 canvas API calls** (`ctx.*`, `canvas.*`, `drawImage`, `fillRect`, `beginPath`, `save/restore`) — all confined to `StreetBrawler.tsx`. Nothing under `src/game/` or `src/lib/` touches a `CanvasRenderingContext2D`.
- Draw functions (`drawBoss`, `drawCandleMinion`, `drawStickFigure`, `drawPlatform`, `drawCity`, `drawCityScene`, `drawSuburbsScene`, `drawAlleyObject`) all take `(ctx, entity, camX)` — a canonical "renderer" signature that a 3D layer can shadow with `(scene, entity)`.
- Parallax layers use `camX * factor` (0.15, 0.4, 0.75, 0.95). In 3D this becomes distinct meshes at different Z depths — no logic change needed.

**Recommendation:** when 3D lands, move each `drawXxx` into `src/game/render2d/` and add a mirror `src/game/render3d/` that consumes the same `Actor` / `PowerUp` / `Platform` types from `@/game/core`.

## 4. Camera assumptions

- Single scalar `camX`; y is fixed (side-scroller). 3D will need a `Vec3` position and a `lookAt`.
- Two presets (snappy / buttery) with predictive look-ahead in the player's facing direction. ✅ Now in `CAMERA_PRESETS`.
- Clamped to `[0, LEVEL_WIDTH - viewportWidth]`. Same clamp works in 3D with a bounded rail.
- No zoom/pitch/roll — the 3D scene will need defaults for these; not blocking.

## 5. Hard-coded 2D logic

| Assumption | Impact | Mitigation |
|---|---|---|
| `y` grows downward (screen space) | Would invert in a right-handed 3D system | `@/game/core` documents `y = world-up` for 3D; 2D renderer keeps its inversion locally. |
| Ground is a single horizontal line at `GROUND_Y` | Works for flat arenas; multi-level 3D terrain would need per-body ground queries | Not blocking — extend `clampToGround` with a heightfield callback later. |
| Parallax = horizontal only | 3D uses depth; obsolete in the 3D branch | No fix needed. |
| Sprite scale in pixels (`width`, `height`) | Direct-drop into 3D as metres if the art scale is 1:100 | Documented in `core/types.ts`. |

## 6. Collision assumptions

- Pure AABB, no rotation. No swept collisions; every check is per-frame instantaneous. Fine for the current design.
- Projectiles use `horizontalDistance < threshold` — cheap and correct for the 2D lane.
- **3D consideration:** replace `aabbOverlap` with capsule-vs-capsule when we ship 3D fighters, but keep `aabbOverlap` for pickups and hitboxes.

## 7. Animation assumptions

- **Procedural stick figures** driven by `stateTimer`. No skeleton, no keyframes, no glTF.
- Every draw function reads `e.stateTimer / DURATION` inline (see section 2).
- Attack windups/recoveries baked into duration frames (e.g. `spinkick = 18f`, `dashpunch = 24f`). ✅ Already centralised in `src/game/config/combat.ts` (`SPECIAL_ATTACKS`).
- **3D consideration:** map each `ActorState` to a glTF clip; drive playback via `progressOf(stateTimer, durationFrames)`. No gameplay change.

---

## What shipped in this pass

Engine-agnostic modules under `src/game/core/`:

- `types.ts` — `Vec2`, `Vec3`, `AABB`, `Facing`, `Actor`, `Projectile`, `PowerUp`, `Platform`
- `aabb.ts` — `aabbOverlap`, `pointInAabb`, `horizontalDistance`, `withinHorizontalRange`, `horizontalDelta`
- `camera.ts` — `CAMERA_PRESETS`, `computeCameraX`, `worldToScreenX`
- `physics.ts` — `applyGravity`, `integrate`, `clampToGround`, `isGrounded`
- `anim.ts` — `progressOf`, `phaseOf`, `easeOutCubic`, `easeInOutSine`
- `index.ts` — barrel

**Zero calls into these from `StreetBrawler.tsx` in this pass** — the current game loop keeps its inlined equivalents so gameplay stays byte-identical. New systems (3D scene, headless AI, tests) should import from `@/game/core`. When the 3D branch begins, we swap the 2D loop's inlined math for `@/game/core` calls one function at a time behind a feature flag.

## Recommended next steps (in order)

1. **Extract the render loop driver** from `StreetBrawler.tsx` into a `useGameLoop(update, render)` hook. Enables swapping `render` for a 3D one.
2. **Move each `drawXxx` into `src/game/presentation/render2d/`** with signature `(ctx, entity, camX) => void`. Then add `src/game/presentation/render3d/` shadow files.
3. **Replace inline collision/gravity/camera math** in the loop with `@/game/engine` calls, one function at a time, verifying gameplay parity after each swap.
4. **Introduce an event bus** for SFX/particles so audio and effects are triggered by state changes, not hand-called at each transition site.

## Phase 2 update (layer scaffolding)

Landed:

- `src/game/engine/` barrel + README codifying the "no React / no DOM / no canvas / deterministic" rule; re-exports `core/` and `config/` plus a new `vec.ts` for 2D+3D vector math.
- `src/game/logic/` barrel + README codifying the "may import engine, may not import presentation" rule; re-exports player/enemy factories, state store, and combat data tables.
- `src/game/presentation/README.md` describing the planned `render2d/` + `render3d/` split.
- `StreetBrawler.tsx` gains a Presentation-layer banner marking it as the single renderer + rAF owner today.

Deliberately NOT landed:

- `src/game/logic/combat/rules.ts` was on the plan but skipped: extracting the damage/knockback formulas without swapping the loop's call sites would create a second source of truth. It will land in the same phase that consumes it, to keep exactly one authoritative implementation at all times.
- No file moves and no behavioural code changes. Existing deep imports continue to work; new code should use the barrels.

Renderer-swap readiness delta: +1 (the boundary is now documented and enforceable in review). The loop itself is unchanged.


## Phase 4 update (power-up kinematics)

Landed:

- `src/game/engine/powerup.ts` — `stepPowerUp(pu)` advances `vy → y → timer` in place and returns pre-integration `prevY` for the caller's platform-landing check. Zero allocations, no RNG, no DOM/React.
- `src/game/config/powerups.ts` — new `POWERUP_GRAVITY = 0.3` constant. Kept in the gameplay config layer (not the Engine Core) because it is a tuning value; `stepPowerUp` imports it from config.
- `src/game/engine/__tests__/powerup.test.ts` — 11 tests, all passing (value lock, single-tick math, order sensitivity, 60-tick frame parity vs. reference, apex crossing for boss drops, identity preservation, untouched fields).
- `src/game/engine/index.ts` — barrel export.
- `src/components/StreetBrawler.tsx` — 4 inline math lines replaced with `const prevY = stepPowerUp(pu);`. Platform snap, ground clamp, pickup radius check, effect application, timer filter, boost timers, spawning, rendering, and audio all remain in the component.

Deliberately NOT landed: collision, pickup collection, spawning, gameplay timers, React state, rendering, audio (per approved scope).

Renderer-swap readiness delta: +1. Power-ups and projectiles now share the "step\<Entity\>() → prevValue" convention for in-place engine helpers that expose pre-state to collision resolution — future extraction candidates (weapon pickups, rain drops, splashes) can follow it verbatim.


## Phase 5 update (shim deprecation & type dedup)

Landed:

- `src/game/assets/index.ts` + `src/game/assets/README.md` — canonical home for asset URLs and the seven boss-head `new Image()` preloaders. Content moved verbatim from the previous `src/game/Assets.ts`; preload timing is byte-identical because ES module re-exports are evaluated eagerly on first import.
- `src/game/Assets.ts` — reduced to `export * from "@/game/assets"` plus `@deprecated` JSDoc.
- `src/game/Constants.ts` — `@deprecated` JSDoc added; body unchanged (already a pure re-export of `@/game/config`).
- `src/game/Types.ts` — inline `Projectile` and `PowerUp` definitions removed; both now re-exported from `@/game/core/types` (the single authoritative source). `Entity` / `AttackState` continue to alias `PlayerEntity` / `PlayerAttackState` from `@/game/player/Player`. Marked `@deprecated`.
- `docs/DEPRECATIONS.md` — new registry of every shim, its canonical replacement, and the planned removal phase.

Intentionally NOT landed (per approved-plan modification):

- Presentation-oriented types (`HitEffect`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`) were **not** moved into `@/game/core/types`. The Engine Core stays free of rendering-oriented concepts. These types remain inline in the `@/game/Types` shim and are documented as such in `docs/DEPRECATIONS.md`. They will relocate to `src/game/presentation/types.ts` when the Presentation layer is formally split (Phase 10).
- `PlayerEntity` and `Actor` remain distinct. Merging is deferred to post-Phase 8.
- `StreetBrawler.tsx` import sites were not migrated. Phase 6 is a mechanical one-file diff that switches its three shim imports to canonical paths.

Verification (Phase 5):

- Typecheck clean.
- Build clean.
- Import audit: `@/game/{Constants,Types,Assets}` still consumed by exactly `StreetBrawler.tsx` (2 import statements — unchanged from pre-Phase-5).
- Duplicate-type audit: `Projectile`, `PowerUp`, `HitEffect`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`, `Actor`, `PlayerEntity` each defined exactly once across `src/`.
- Zero per-frame allocations added; shims contain only file-scope re-exports evaluated once at module load.
- Gameplay parity: renderer loop, physics, AI, camera, audio and rendering paths are untouched.

Renderer-swap readiness delta: +1. The Engine Core is now free of presentation concepts, and the type surface has a single authoritative source per concern — a future 3D renderer can bind to `@/game/core/types` and `@/game/engine` without inheriting rendering-oriented particle/HUD types.
