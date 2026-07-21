/**
 * game/Types.ts — Phase 1 barrel of shared game types.
 *
 * PURPOSE
 * A single import path (`@/game/Types`) for every non-entity type the
 * game loop passes around: hit effects, powerups, weapon pickups, weather
 * particles, combo state, and projectiles.
 *
 * The player/enemy Entity shape lives in `src/game/player/Player.ts` and
 * is re-exported here for convenience so downstream systems only need one
 * import.
 *
 * SCOPE — WHAT MOVED, WHAT STAYED
 * Moved (previously inline in StreetBrawler.tsx, byte-identical shapes):
 *   • HitEffect, PowerUp, WeaponPickup, RainDrop, Splash
 *   • ComboState, Projectile
 * Re-exported from existing modules (source of truth unchanged):
 *   • Entity, AttackState (from Player.ts)
 *   • WeaponType (from config)
 *
 * WHAT INTENTIONALLY STAYED IN StreetBrawler.tsx
 * The giant `gameRef` interface (lines ~3030-3095 of StreetBrawler.tsx)
 * that types the per-frame state closure. It references React refs,
 * private camera-debug internals, and audio handles that only the loop
 * touches. Extracting it now would either force us to expose engine
 * internals as a public API or split the interface across two files,
 * neither of which is cheap to keep in sync. That's a Phase-2+ concern
 * once the loop itself is decomposed.
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
// Visual / particle types — pushed into per-frame buffers by the loop.
// ---------------------------------------------------------------------------

export interface HitEffect {
  x: number;
  y: number;
  timer: number;
  text: string;
  color: string;
  size: number;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: "health" | "speed" | "energy" | "damage";
  timer: number;
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

// ---------------------------------------------------------------------------
// Combat state
// ---------------------------------------------------------------------------

export interface ComboState {
  inputs: string[];
  timer: number;
  hitCount: number;
  hitTimer: number;
  multiplier: number;
  specialCooldown: number;
  specialEnergy: number;
}

// ---------------------------------------------------------------------------
// Projectile — used by shuriken throws + boss ranged attacks.
// ---------------------------------------------------------------------------

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  isPlayerProjectile?: boolean;
  damage?: number;
}
