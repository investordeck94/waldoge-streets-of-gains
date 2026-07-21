&nbsp;

Approved with one modification.

Proceed with the proposed Phase 5 except for one implementation detail.

Do not move presentation-oriented types into src/game/core/types.ts.

Instead:

- Keep Engine Core types focused on engine-agnostic world simulation.

- If the presentation-only types cannot yet move to a dedicated presentation/types module without increasing complexity, leave them in the existing compatibility shim for this phase and document the dependency.

- Introduce presentation/types only when the Presentation layer is formally split in a later phase.

The Engine Core should remain free of rendering-oriented or presentation-only concepts wherever practical.

Everything else in the proposal is approved.

After implementation:

- Confirm gameplay parity.

- Confirm zero allocation changes.

- Confirm backwards compatibility.

- Confirm there is still only one authoritative source of truth for engine types.

# Phase 5 Proposal — Deprecate Legacy Shims & Unify Shared Types

## 0. Objective

Turn `src/game/Constants.ts`, `src/game/Types.ts`, and `src/game/Assets.ts` into thin **deprecated re-export layers** whose only remaining consumer is `src/components/StreetBrawler.tsx`, and establish a single authoritative source of truth per concern:


| Concern                                                                   | Authoritative source              |
| ------------------------------------------------------------------------- | --------------------------------- |
| Numeric tunables & config types                                           | `src/game/config/**`              |
| Engine-agnostic gameplay types (Actor, Projectile, PowerUp, AABB, Vec2/3) | `src/game/core/types.ts`          |
| Deterministic engine helpers                                              | `src/game/engine/**`              |
| Gameplay rules / entities / state                                         | `src/game/logic/**`               |
| Static asset URLs & preloaded images                                      | `src/game/assets/**` (new folder) |


No runtime code moves. No values change. No gameplay, physics, timing, AI, camera, rendering, or per-frame allocations are altered.

## 1. Current State (measured)

- `Constants.ts` (63 lines): **already** a pure re-export of `@/game/config`. Nothing to unify — only needs the `@deprecated` JSDoc tag.
- `Assets.ts` (102 lines): the **only** module that actually preloads boss-head `Image()` objects. Not a shim yet — it owns state.
- `Types.ts` (120 lines): owns 7 interface definitions (`HitEffect`, `PowerUp`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`, `Projectile`) and re-exports `Entity`/`AttackState` from `Player.ts`.
- Only importer of any of the three shims: `src/components/StreetBrawler.tsx` (lines 49, 142).
- Duplicate type surfaces detected:
  - `PlayerEntity` in `game/player/Player.ts` (canonical) vs `Entity = PlayerEntity` alias in `StreetBrawler.tsx` and in `Types.ts`.
  - `Actor` in `game/core/types.ts` (engine-agnostic, world-space) — **not** used by the loop yet; structurally overlaps with `PlayerEntity`.
  - `Projectile` **defined twice**: `game/Types.ts` and `game/core/types.ts` (shapes are compatible but not identical — the Types.ts one has no doc comments; the core one has a `/** Frames remaining */` note).
  - `PowerUp` **defined twice**: `game/Types.ts` and `game/core/types.ts` (compatible shapes).

Duplicate `Projectile`/`PowerUp` is currently invisible because nothing imports them from `@/game/engine` (which re-exports `../core`). The moment a caller does, TypeScript will surface an ambiguity. This must be fixed *before* Phase 6 adopts more engine modules.

## 2. Proposed End State

```text
src/game/
├── config/                (SOURCE OF TRUTH: numbers + config types)
├── core/types.ts          (SOURCE OF TRUTH: Actor, AABB, Vec2/3, Projectile, PowerUp, Platform)
├── engine/                (SOURCE OF TRUTH: deterministic helpers)
├── logic/                 (SOURCE OF TRUTH: player/enemy/state)
├── assets/
│   ├── index.ts           (SOURCE OF TRUTH: IMAGE_URLS, AUDIO_URLS, BOSS_HEAD_IMAGES, individual aliases)
│   └── README.md
├── Constants.ts           (DEPRECATED SHIM → re-exports @/game/config, @deprecated JSDoc)
├── Types.ts               (DEPRECATED SHIM → re-exports @/game/core/types + presentation-only types)
└── Assets.ts              (DEPRECATED SHIM → re-exports @/game/assets)
```

`StreetBrawler.tsx` continues to import from the shim paths in Phase 5. Migration of its import sites is deferred to a later phase to keep Phase 5 diff minimal.

## 3. Files Modified / Created / Unchanged

### 3.1 New files

- `src/game/assets/index.ts` — moved content of current `Assets.ts` verbatim (same imports, same `preload()` IIFE, same named exports). Byte-identical preload timing.
- `src/game/assets/README.md` — 1-page note on preload semantics and SSR guard.
- `src/game/core/types.ts` — **additions only**: three new presentation-only interfaces that today live in `Types.ts` (`HitEffect`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`). *See §4 for the split rationale.*
- `docs/DEPRECATIONS.md` — table of every shim, replacement import path, and target removal phase.

### 3.2 Modified files

- `src/game/Constants.ts` — add `@deprecated` JSDoc pointing at `@/game/config`. Body unchanged (already a re-export).
- `src/game/Types.ts` — becomes pure re-export:
  - `export type { Projectile, PowerUp } from "@/game/core/types";`
  - `export type { HitEffect, WeaponPickup, RainDrop, Splash, ComboState } from "@/game/core/types";`
  - `export type { PlayerEntity as Entity, PlayerAttackState as AttackState } from "@/game/player/Player";`
  - `export type { WeaponType } from "@/game/config";`
  - Add `@deprecated` JSDoc.
- `src/game/Assets.ts` — becomes `export * from "@/game/assets";` plus `@deprecated` JSDoc.
- `src/game/core/types.ts` — **additive** interface definitions from §4. No changes to existing `Actor`, `AABB`, `Vec2/3`, `Projectile`, `PowerUp`, `Platform`.
- `src/game/engine/index.ts` — no change (already re-exports `../core`). Explicit re-export list may be tightened *only if* Phase 5 verification detects a name collision; otherwise untouched.
- `docs/3D_MIGRATION_AUDIT.md` — append Phase 5 completion row.

### 3.3 Files that MUST remain unchanged

- `src/components/StreetBrawler.tsx` (imports keep hitting the shim paths).
- `src/game/player/Player.ts` — `PlayerEntity` remains the canonical player shape.
- `src/game/enemy/Enemy.ts`.
- `src/game/engine/projectile.ts`, `src/game/engine/powerup.ts`, `src/game/engine/vec.ts` and their tests.
- `src/game/config/**`.
- `src/game/state/**`.
- `src/game/logic/index.ts`.
- Every draw/update code path inside the rAF loop.

## 4. Handling Duplicate Types

### 4.1 `Projectile` and `PowerUp` (duplicated in `Types.ts` and `core/types.ts`)

Shapes are already structurally compatible. Chosen resolution:

1. Treat `core/types.ts` as the canonical definition.
2. Delete the inline definitions in `Types.ts` and re-export from `core/types.ts` instead.

Because TypeScript uses structural typing, existing usages in `StreetBrawler.tsx` (which spread these into per-frame buffers) continue to type-check unchanged. The `stepProjectile`/`stepPowerUp` helpers already accept the `core/types.ts` shape, so their call sites become *more* precisely typed — with zero runtime effect.

### 4.2 Presentation-only types (`HitEffect`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`)

These describe visual/particle/UI state, not world simulation. Two viable homes:

- **Option A (recommended):** Move them into `core/types.ts` under a `// Presentation-side buffers` section. Pros: one file to read; matches how `Projectile`/`PowerUp` already live there. Cons: mixes rendering-oriented data with world-simulation data.
- **Option B:** Create `src/game/presentation/types.ts` and export from there. Pros: cleaner boundary. Cons: introduces a Presentation import surface before Phase 10 is ready.

Proposal chooses **Option A** for Phase 5 (minimum surface area, defers Presentation layer creation to Phase 10). If Phase 10 later prefers to relocate them, that becomes a single find-and-replace behind the same shim.

### 4.3 `Entity` / `PlayerEntity` / `Actor`

- Keep `PlayerEntity` as the runtime shape used by the loop (StreetBrawler, Player, Enemy).
- Keep `Actor` in `core/types.ts` as the *engine-agnostic world-space* interface — do **not** merge with `PlayerEntity` yet. `Actor` uses world coordinates and no rendering fields; `PlayerEntity` currently carries loop/animation fields the renderer relies on. Merging them prematurely risks a rendering regression.
- Add a JSDoc note in `core/types.ts` explicitly stating: *"`Actor` is the future 3D-safe superset; `PlayerEntity` will structurally satisfy `Actor` after Phase 8 (physics adoption). Do not import `Actor` into the rAF loop yet."*
- No code touches `PlayerEntity` in Phase 5.

## 5. Import Map (Before / After)


| Import path         | Before             | After Phase 5                 | After eventual removal                                   |
| ------------------- | ------------------ | ----------------------------- | -------------------------------------------------------- |
| `@/game/Constants`  | ✔ (thin re-export) | ✔ deprecated                  | replaced by `@/game/config`                              |
| `@/game/Types`      | ✔ (owns defs)      | ✔ deprecated (pure re-export) | replaced by `@/game/core/types` + `@/game/player/Player` |
| `@/game/Assets`     | ✔ (owns preload)   | ✔ deprecated (pure re-export) | replaced by `@/game/assets`                              |
| `@/game/assets`     | —                  | new canonical path            | canonical                                                |
| `@/game/core/types` | ✔                  | ✔ (superset)                  | canonical                                                |
| `@/game/config`     | ✔                  | ✔                             | canonical                                                |
| `@/game/engine`     | ✔                  | ✔ (unchanged)                 | canonical                                                |
| `@/game/logic`      | ✔                  | ✔ (unchanged)                 | canonical                                                |


`StreetBrawler.tsx` imports at lines 49 and 142 stay as-is in Phase 5.

## 6. Backwards Compatibility

- Every public export name kept: `IMAGE_URLS`, `AUDIO_URLS`, `BOSS_HEAD_IMAGES`, `jeetHeadImg` … `tickerThiefHeadImg`, `HitEffect`, `PowerUp`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`, `Projectile`, `Entity`, `AttackState`, `WeaponType`, and the 20+ constants surfaced by `Constants.ts`.
- Boss-head preload IIFE stays at module-import time from `assets/index.ts`. The shim re-export path (`Assets.ts`) does not add a new module boundary that would delay the `new Image()` calls — ES module re-exports are evaluated eagerly on first import, and `StreetBrawler.tsx` still imports `@/game/Assets` at top level, so the `Image` handles are created at the same instant in the module graph as today.
- `waldogeHead` lazy load path inside the component is left alone (Assets.ts already documents this).

## 7. Risk Assessment


| Change                                         | Gameplay                 | Performance | Timing                              | Type safety                                       | 3D-migration benefit                                        |
| ---------------------------------------------- | ------------------------ | ----------- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `Constants.ts` → add `@deprecated` JSDoc       | none                     | none        | none                                | none                                              | signals canonical path                                      |
| `Types.ts` → re-export from `core/types.ts`    | none (structural compat) | none        | none                                | tightens: single canonical `Projectile`/`PowerUp` | removes duplicate that would block Phase 8/10               |
| `Assets.ts` → re-export from `assets/index.ts` | none                     | none        | preload fires at same tick (see §6) | none                                              | asset layer becomes independently swappable for a 3D loader |
| Add presentation types to `core/types.ts`      | none                     | none        | none                                | tighter: fewer definitions                        | Presentation types visible to future renderers              |
| Leave `PlayerEntity`/`Actor` distinct          | none                     | none        | none                                | none (unchanged)                                  | staged — merged only after Phase 8 physics adoption         |


Zero per-frame allocation change: no new object literals are introduced anywhere on the hot path. All edits are file-level re-exports evaluated once at module load.

## 8. Implementation Strategy

- The rAF loop in `StreetBrawler.tsx` is untouched.
- No gameplay ownership moves. No files under `engine/`, `logic/`, `player/`, `enemy/`, `state/`, or `config/` are modified (except additive types in `core/types.ts`).
- No rendering code moves.
- Ordering, so each step is independently verifiable:
  1. Create `src/game/assets/index.ts` + README (copy content verbatim).
  2. Add the 5 presentation types to `core/types.ts` (additive).
  3. Rewrite `Assets.ts` and `Types.ts` as pure re-exports; add `@deprecated` JSDoc to all three shims.
  4. Add `docs/DEPRECATIONS.md` and append the Phase 5 row to `docs/3D_MIGRATION_AUDIT.md`.

Each step compiles cleanly on its own. No intermediate state breaks the build.

## 9. Verification Plan

- **Typecheck**: `tsgo` clean — special attention to `StreetBrawler.tsx` types for `Projectile[]`, `PowerUp[]`, and pickup arrays.
- **Build**: production `bun run build` succeeds without new warnings.
- **Import validation**: `rg -n "from ['\"]@/game/(Constants|Types|Assets)['\"]" src/` shows exactly the same 2 lines in `StreetBrawler.tsx` as today.
- **Duplicate-type validation**: `rg -n "^export (interface|type) (Projectile|PowerUp|HitEffect|WeaponPickup|RainDrop|Splash|ComboState)\b" src/` returns exactly one hit per name (all in `core/types.ts`).
- **Gameplay parity**: manual smoke test — start Level 1, land 2 hits, throw a shuriken, collect a power-up, take boss damage; frame times and behaviours unchanged.
- **Zero-behavioural-change proof**: existing Vitest suites (`projectile.test.ts`, `powerup.test.ts`) — 25/25 must remain green with **no test file edits**.
- **Zero-allocation proof**: shim rewrite adds no `new`, no object/array literals, no arrow functions on hot paths. `rg -n "\bnew \b|=>\s*\(" src/game/{Constants,Types,Assets}.ts src/game/assets/index.ts` audited before merge.

## 10. Deliverables

**New files**

- `src/game/assets/index.ts`
- `src/game/assets/README.md`
- `docs/DEPRECATIONS.md`

**Modified files**

- `src/game/Constants.ts` (JSDoc only)
- `src/game/Types.ts` (body → pure re-exports)
- `src/game/Assets.ts` (body → pure re-export)
- `src/game/core/types.ts` (additive: 5 presentation interfaces)
- `docs/3D_MIGRATION_AUDIT.md` (append Phase 5 row)

**Deprecated files (kept, do not delete this phase)**

- `src/game/Constants.ts`
- `src/game/Types.ts`
- `src/game/Assets.ts`

**Remaining technical debt after Phase 5**

- `StreetBrawler.tsx` still imports from the three shim paths.
- `PlayerEntity` and `Actor` remain distinct (intentional; merged post-Phase 8).
- `gameRef` mega-interface still lives inside `StreetBrawler.tsx`.
- `waldogeHead` still lazy-loaded inside the component.

## 11. Recommended Phase 6

**Adopt shim-free imports in `StreetBrawler.tsx`.** Mechanical, one-file diff: replace `@/game/Constants|Types|Assets` imports with `@/game/config`, `@/game/core/types`, `@/game/player/Player`, and `@/game/assets`. After Phase 6 succeeds, the three shim files can be deleted in Phase 7 with a single `rm`. This ordering keeps every phase reversible and each diff small.

## 12. Awaiting Approval

No files will be modified until you approve this proposal.