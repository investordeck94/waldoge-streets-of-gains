Approved with one modification.

Proceed with everything in Phase 2 except creating src/game/logic/combat/rules.ts if it duplicates the existing combat formulas.

Do not introduce a temporary second source of truth for combat calculations.

If combat calculations cannot be extracted without duplication or behavioural risk, leave them inside StreetBrawler.tsx for now and document why.

Continue with:

- Layer barrels (engine, logic, presentation)

- Layer README files

- engine/vec.ts

- Presentation boundary documentation

- Updated migration audit

Preserve identical gameplay, timing, performance, and execution order.

## Goal

Formalise the three architectural layers you described while keeping StreetBrawler.tsx byte-identical in behaviour. No gameplay, AI, camera, physics, timing, controls, or rendering changes.

## Current state (recap)

- Engine Core partially exists: `src/game/core/` (aabb, camera, physics, anim, types) and `src/game/config/` (constants).
- Game Logic partially exists: `src/game/player/Player.ts`, `src/game/enemy/Enemy.ts`, `src/game/state/` (save/load, progression), `src/lib/fightMoves.ts`, `src/lib/fightStyles.ts`.
- Presentation: everything in `src/components/StreetBrawler.tsx` (rAF loop + 1,521 canvas calls) plus `src/lib/gameSfx.ts`.
- Gap: the three layers exist but aren't organised as layers. No barrel per layer, no import boundary, and pure math is still inlined in the loop.

## Phase 2 scope (this phase only)

Pure, additive layer scaffolding + one small safe extraction. No behavioural code moves.

### 2A. Layer barrels + import boundary docs

Create three thin barrels that make the layers explicit and enforceable in review:

```text
src/game/
  engine/     -> re-exports from core/ + shared math utilities
    index.ts
    README.md   (rules: no React, no canvas, no browser APIs, deterministic only)
  logic/      -> re-exports player, enemy, state, fightMoves, fightStyles, config
    index.ts
    README.md   (rules: may import engine/, must not import presentation or canvas)
  presentation/
    README.md   (rules: renderer-only; consumes logic/ + engine/; owns no gameplay)
```

No files move. Existing deep imports keep working. New code is asked to import from `@/game/engine` and `@/game/logic`.

### 2B. Add one missing Engine Core module: `vec.ts`

Small, pure vector helpers (`add`, `sub`, `scale`, `length`, `clamp`, `lerp`) — currently open-coded in several sites. Not wired into the loop in this phase; available for future extractions and for a 3D renderer that will need Vec3 math.

### 2C. Add `src/game/logic/combat/rules.ts` (pure)

Move the pure damage/knockback resolution *formulas* (no state writes) out of the loop as pure functions: `computeMeleeDamage(attacker, defender, move, style)`, `computeKnockback(...)`. The loop keeps its current inline code; the new module is verified to return identical numbers via a small vitest. Actual call-site swap is deferred to Phase 3 behind an A/B check.

### 2D. Presentation boundary marker

Add a top-of-file banner comment in `StreetBrawler.tsx` declaring it the Presentation layer, and a short `presentation/README.md` describing the eventual split into `render2d/` and `render3d/` sharing the same logic layer.

## Explicitly NOT in this phase

- Moving the rAF loop.
- Extracting the enemy/boss AI state machines.
- Extracting the player update loop.
- Extracting projectile update, particles, or audio triggers.
- Any renderer changes.
- Any file renames or deletes.

## Verification

1. `tsgo --noEmit` clean.
2. Vite build clean.
3. Manual smoke: StreetBrawler mounts, level 1 plays, boss spawns, save/load unchanged.
4. Unit test asserts new `combat/rules.ts` matches a table of expected outputs (documents current formulas; catches accidental drift later).

## Deliverables at end of Phase 2

- Layer barrels + READMEs codifying import rules.
- `engine/vec.ts` with tests.
- `logic/combat/rules.ts` with tests (not yet consumed by the loop).
- Updated `docs/3D_MIGRATION_AUDIT.md` "next steps" section.
- Phase 2 report: what was extracted, what remains coupled and why, next safest extraction (candidate: projectile update — pure per-frame integration), renderer-swap readiness delta, risks.

## Risks / trade-offs

- Adding barrels without moving files means two valid import paths exist for a while. Mitigation: READMEs mark deep imports as legacy; new code uses barrels.
- Duplicating combat formulas in `rules.ts` before the loop consumes them means a temporary second source of truth. Mitigation: unit test pins parity; Phase 3 removes the inline copy in one commit.

Awaiting approval before I make any changes.