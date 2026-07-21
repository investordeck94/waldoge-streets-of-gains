# Deprecations

Compatibility shims kept for backwards compatibility during the phased
3D-migration refactor. Each shim re-exports from a canonical module and
adds nothing new. New code MUST import from the canonical path.

| Shim path            | Canonical replacement                                                                                                                          | Introduced | Planned removal | Notes                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@/game/Constants`   | `@/game/config`                                                                                                                                | Phase 1    | Phase 7         | Already a pure re-export. Values live in `src/game/config/`.                                                       |
| `@/game/Assets`      | `@/game/assets`                                                                                                                                | Phase 1    | Phase 7         | Boss-head preloader body moved to `src/game/assets/index.ts` in Phase 5. Preload timing is byte-identical.         |
| `@/game/Types`       | `@/game/core/types` (Projectile, PowerUp) + `@/game/player/Player` (Entity, AttackState) + `@/game/config` (WeaponType) + itself (see below)   | Phase 1    | Phase 10        | Presentation-only types (`HitEffect`, `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`) still live here.         |

## Presentation-type dependency on `@/game/Types`

Five interfaces intentionally remain inline in `src/game/Types.ts`:

- `HitEffect`
- `WeaponPickup`
- `RainDrop`
- `Splash`
- `ComboState`

These describe rendering-oriented per-frame buffer state (particle
timers, weather visuals, combo HUD). They do NOT belong in the
engine-agnostic `@/game/core/types` module: the Engine Core must stay
free of presentation concerns so a future 3D renderer can consume it
untouched.

They will move to a dedicated `src/game/presentation/types.ts` when the
Presentation layer is formally split (Phase 10). Until then, the
`@/game/Types` shim is their canonical home — treat it as such and do
not duplicate them elsewhere.

## Removal procedure

1. Migrate `src/components/StreetBrawler.tsx` (the only remaining
   importer of the shim paths) to canonical imports (Phase 6).
2. Verify: `rg -n "from ['\"]@/game/(Constants|Types|Assets)['\"]" src/`
   returns zero hits.
3. Delete the shim files (Phase 7 for `Constants.ts` and `Assets.ts`;
   Phase 10 for `Types.ts`, together with the presentation-types move).

## Duplicate-type policy

Only one authoritative source of truth per type is allowed. Verified in
Phase 5:

- `Projectile`, `PowerUp` → `@/game/core/types` (single definition; the
  previous duplicates in `@/game/Types` were replaced by re-exports).
- `PlayerEntity` / `Entity` → `@/game/player/Player` (single definition;
  `Entity` is an alias).
- `Actor` → `@/game/core/types` (engine-agnostic superset; NOT yet
  merged with `PlayerEntity` — that merge is scheduled after Phase 8
  physics adoption).
