/**
 * MR. MARKETER'S RAIDING TEAM — Level 6 elite henchmen.
 *
 * Pure data + pure functions. The Raiding Team are ordinary grunt entities
 * with a `variant` tag: they reuse the existing enemy AI, movement, melee
 * hit detection, navigation and death handling untouched. The only addition
 * is a telegraphed MP40 burst, expressed here as a small state machine the
 * game loop steps once per frame.
 *
 * The RED CANDLE MINIONS are unaffected: every wave keeps a majority of them
 * and the Raiding Team are layered on top as the organised elite.
 */

import { landingDecksFor } from "@/game/config/world";

/** Level index of Mr. Marketer's Territory. */
export const MARKETER_LEVEL = 5;

/** Wave index of the authored KEY GUARD encounter (The Funnel Factory). */
export const KEY_GUARD_WAVE = 2;

export interface RaiderFields {
  /** Undefined = existing Candle Minion. */
  variant?: "raider";
  /** Frames left in the current aim/shot window (0 = not shooting). */
  raiderAim?: number;
  /** Frames until the next burst is allowed. */
  raiderCooldown?: number;
  /** True once this frame's shot has been emitted. */
  raiderFired?: boolean;
}

interface Placeable extends RaiderFields {
  x: number;
  y: number;
}

/** Aim wind-up length, in frames (readable telegraph before the shot). */
export const RAIDER_AIM_FRAMES = 26;
/** Frames the muzzle stays hot after firing. */
export const RAIDER_SHOT_FRAMES = 12;
/** Cooldown between bursts. */
export const RAIDER_COOLDOWN = 150;
/** Minimum / maximum horizontal firing range. */
export const RAIDER_MIN_RANGE = 170;
export const RAIDER_MAX_RANGE = 460;

/**
 * Tag part of a Level 6 wave as Raiding Team and stage some of them on the
 * authored decks, so vertical routes carry real combat. Candle Minions keep
 * every untagged slot. Mutates and returns the same array.
 */
export function applyRaidingTeamRoster<T extends Placeable>(
  enemies: T[],
  level: number,
  wave: number,
): T[] {
  if (level !== MARKETER_LEVEL || enemies.length === 0) return enemies;
  const decks = landingDecksFor(level);
  // The key guard encounter is primarily Raiding Team; elsewhere they are the
  // minority elite escort for the Candle Minions.
  const raiderEvery = wave === KEY_GUARD_WAVE ? 1 : 2;
  enemies.forEach((e, i) => {
    const isRaider = wave === KEY_GUARD_WAVE ? i % raiderEvery === 0 : i % 2 === 1;
    if (!isRaider) return;
    e.variant = "raider";
    e.raiderCooldown = 60 + i * 24;
    e.raiderAim = 0;
    // Every second raider patrols the nearest deck to its spawn point.
    if (i % 4 === 1) {
      let best: { x0: number; x1: number; y: number } | null = null;
      let bestD = Infinity;
      for (const deck of decks) {
        const cx = (deck.x0 + deck.x1) / 2;
        const d = Math.abs(cx - e.x);
        if (d < bestD) { bestD = d; best = deck; }
      }
      if (best && bestD < 900) {
        e.x = Math.min(best.x1 - 30, Math.max(best.x0 + 30, e.x));
        e.y = best.y;
      }
    }
  });
  return enemies;
}

/** True when this entity is a Raiding Team henchman. */
export function isRaider(e: RaiderFields): boolean {
  return e.variant === "raider";
}

export interface RaiderTargetView {
  x: number;
  y: number;
  hp: number;
  state: string;
}

export interface RaiderState extends RaiderFields {
  x: number;
  y: number;
  facing: number;
  hp: number;
  state: string;
}

/**
 * Step one raider's ranged state machine.
 *
 * @returns "fire" exactly on the frame the burst leaves the barrel, otherwise
 * null. The caller owns projectile creation, damage and audio — nothing here
 * touches global combat.
 */
export function stepRaiderRanged(e: RaiderState, target: RaiderTargetView): "fire" | null {
  if (!isRaider(e) || e.state === "dead" || e.hp <= 0) { e.raiderAim = 0; return null; }
  if ((e.raiderCooldown ?? 0) > 0) e.raiderCooldown = (e.raiderCooldown ?? 0) - 1;

  if ((e.raiderAim ?? 0) > 0) {
    const next = (e.raiderAim ?? 0) - 1;
    e.raiderAim = next;
    // The shot leaves the barrel at the end of the wind-up.
    return next === RAIDER_SHOT_FRAMES ? "fire" : null;
  }

  if (e.state === "hit" || target.state === "dead" || target.hp <= 0) return null;
  const dx = target.x - e.x;
  const dist = Math.abs(dx);
  const sameFloor = Math.abs(target.y - e.y) < 60;
  if (!sameFloor) return null;
  if (dist < RAIDER_MIN_RANGE || dist > RAIDER_MAX_RANGE) return null;
  if ((e.raiderCooldown ?? 0) > 0) return null;
  e.raiderAim = RAIDER_AIM_FRAMES;
  e.raiderCooldown = RAIDER_COOLDOWN;
  e.facing = dx > 0 ? 1 : -1;
  return null;
}
