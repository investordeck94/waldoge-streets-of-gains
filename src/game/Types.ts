/**
 * @deprecated Import engine-agnostic types from `@/game/core/types`,
 * entity/attack types from `@/game/player/Player`, and config types from
 * `@/game/config`. This module is a partial re-export shim kept for
 * backwards compatibility during the Phase 5 refactor. See
 * `docs/DEPRECATIONS.md`.
 *
 * PHASE 5 STATE
 * ─────────────
 * • `Projectile` and `PowerUp` are now re-exported from `@/game/core/types`
 *   (the single authoritative source). Duplicate inline definitions were
 *   removed. TypeScript structural typing keeps every existing call site
 *   compiling unchanged.
 *
 * • `Entity` and `AttackState` continue to alias `PlayerEntity` and
 *   `PlayerAttackState` from `@/game/player/Player` (the canonical source).
 *
 * • The five presentation-side buffer types below (`HitEffect`,
 *   `WeaponPickup`, `RainDrop`, `Splash`, `ComboState`) are intentionally
 *   still defined inline here. They describe rendering-oriented state
 *   (particle timers, combo HUD, weather visuals) that does not belong in
 *   the engine-agnostic `core/types.ts`. They will move to a dedicated
 *   `src/game/presentation/types.ts` when the Presentation layer is
 *   formally split (Phase 10). Until then, this shim is the only home
 *   that exposes them — do not treat that as an invitation to add more
 *   presentation-only types to `@/game/core`.
 *
 * WHAT INTENTIONALLY STAYED IN StreetBrawler.tsx
 * ──────────────────────────────────────────────
 * The giant `gameRef` interface (~lines 3030-3095 of StreetBrawler.tsx)
 * that types the per-frame state closure. It references React refs,
 * private camera-debug internals, and audio handles that only the loop
 * touches. Extracting it now would either force us to expose engine
 * internals as a public API or split the interface across two files.
 * That's a later-phase concern once the loop itself is decomposed.
 */

import type { WeaponType } from "@/game/config";

// ---------------------------------------------------------------------------
// Entity + attack states — source of truth is Player.ts. Re-exported so
// callers can `import { Entity } from "@/game/Types"`.
// ---------------------------------------------------------------------------

export type {
  PlayerEntity as Entity,
  PlayerAttackState as AttackState,
} from "@/game/player/Player";

// Re-export shared config types that flow through gameplay code.
export type { WeaponType } from "@/game/config";

// ---------------------------------------------------------------------------
// World-simulation types — canonical source is `@/game/core/types`.
// Re-exported here so existing `@/game/Types` importers keep compiling
// without the duplicate inline definitions that lived here before Phase 5.
// ---------------------------------------------------------------------------

export type { Projectile, PowerUp } from "@/game/core/types";

// ---------------------------------------------------------------------------
// Presentation-side buffer types — pushed into per-frame arrays by the
// renderer. Intentionally NOT in `@/game/core/types`: these describe
// rendering-oriented state (particle timers, weather visuals, combo HUD)
// which the Engine Core must stay free of. They will move to
// `src/game/presentation/types.ts` when the Presentation layer is
// formally split (Phase 10).
// ---------------------------------------------------------------------------

export interface HitEffect {
  x: number;
  y: number;
  timer: number;
  text: string;
  color: string;
  size: number;
}

export interface WeaponPickup {
  x: number;
  y: number;
  vy: number;
  type: WeaponType;
  collected: boolean;
  timer: number;
}

export interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  wind: number;
}

export interface Splash {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  size: number;
  inPuddle: boolean;
}

export interface ComboState {
  inputs: string[];
  timer: number;
  hitCount: number;
  hitTimer: number;
  multiplier: number;
  specialCooldown: number;
  specialEnergy: number;
}
