/** Level-7-only elite Cat Guards. Pure roster, decision and strike helpers. */
import { strikeConnects } from "@/game/core/strike";
import type { DifficultyModifiers } from "@/game/config/difficulty";
import type { PlayerEntity } from "@/game/player/Player";

export const CAT_GUARD_LEVEL = 6;

export type CatGuardVariant = "catBlack" | "catOrange";
export type CatGuardMove =
  | "lightPunch" | "heavyPunch" | "frontKick" | "roundhouse" | "cartwheel";

export interface CatGuardFields {
  variant?: CatGuardVariant | "raider";
  catMove?: CatGuardMove;
  catCombo?: CatGuardMove[];
  catDecision?: number;
  catAttackLanded?: boolean;
  catRunning?: boolean;
  /** Last AI-authored horizontal intent; rendering never reads or mutates it. */
  catMoveSpeed?: number;
  /** Exact authored ladder selected by the Level-7 navigation graph. */
  climbLadderId?: string;
  catClimbIntent?: "up" | "down";
}

export type CatGuardState = PlayerEntity & CatGuardFields & { climbing?: boolean };

export interface CatGuardMoveSpec {
  duration: number;
  activeFrom: number;
  activeTo: number;
  range: number;
  damage: number;
  knockback: number;
}

export const CAT_GUARD_MOVES: Record<CatGuardMove, CatGuardMoveSpec> = {
  lightPunch: { duration: 20, activeFrom: 12, activeTo: 10, range: 43, damage: 6, knockback: 3 },
  heavyPunch: { duration: 30, activeFrom: 17, activeTo: 14, range: 48, damage: 9, knockback: 4.5 },
  frontKick: { duration: 28, activeFrom: 16, activeTo: 13, range: 57, damage: 8, knockback: 5 },
  roundhouse: { duration: 34, activeFrom: 19, activeTo: 16, range: 65, damage: 10, knockback: 6 },
  // Eight authored frames: damage exists only at leg sweep / kick impact.
  cartwheel: { duration: 48, activeFrom: 22, activeTo: 16, range: 78, damage: 12, knockback: 7 },
};

export const CARTWHEEL_PHASES = [
  "stance", "drop", "handPlant", "rotation", "legSweep", "kickImpact", "completion", "recovery",
] as const;

const AUTHORED_GUARDS: ReadonlyArray<ReadonlyArray<{
  variant: CatGuardVariant; x: number; y: number;
}>> = [
  [{ variant: "catBlack", x: 1480, y: 262 }],
  [{ variant: "catOrange", x: 2820, y: 204 }, { variant: "catBlack", x: 3380, y: 262 }],
  [{ variant: "catBlack", x: 4620, y: 204 }, { variant: "catOrange", x: 5160, y: 262 }],
  [
    { variant: "catBlack", x: 6200, y: 262 },
    { variant: "catOrange", x: 6380, y: 262 },
    { variant: "catBlack", x: 6620, y: 204 },
    { variant: "catOrange", x: 6760, y: 146 },
  ],
  [
    { variant: "catBlack", x: 7460, y: 190 },
    { variant: "catOrange", x: 7820, y: 320 },
    { variant: "catBlack", x: 8140, y: 320 },
  ],
];

interface Spawnable extends CatGuardFields {
  x: number; y: number; vx: number; vy: number; width: number; height: number;
  facing: 1 | -1; hp: number; maxHp: number; state: PlayerEntity["state"];
  stateTimer: number; attackCooldown: number; aiTimer?: number;
}

/** Append authored guards; existing Candle Minions are never converted or removed. */
export function appendCatGuardRoster<T extends Spawnable>(
  enemies: T[], level: number, wave: number,
): T[] {
  if (level !== CAT_GUARD_LEVEL) return enemies;
  const baseline = enemies[0];
  if (!baseline) return enemies;
  for (const [index, placement] of (AUTHORED_GUARDS[wave] ?? []).entries()) {
    const hp = Math.max(24, Math.round(baseline.maxHp * (placement.variant === "catBlack" ? 0.82 : 0.92)));
    enemies.push({
      ...baseline,
      x: placement.x,
      y: placement.y,
      vx: 0,
      vy: 0,
      facing: -1,
      hp,
      maxHp: hp,
      state: "idle",
      stateTimer: 0,
      attackCooldown: 24 + index * 12,
      aiTimer: index * 11,
      variant: placement.variant,
      catDecision: 18 + index * 8,
      catAttackLanded: false,
    });
  }
  return enemies;
}

export function isCatGuard(value: CatGuardFields): value is CatGuardFields & { variant: CatGuardVariant } {
  return value.variant === "catBlack" || value.variant === "catOrange";
}

export function cartwheelPhase(stateTimer: number): typeof CARTWHEEL_PHASES[number] {
  const duration = CAT_GUARD_MOVES.cartwheel.duration;
  const elapsed = Math.max(0, Math.min(duration - 1, duration - stateTimer));
  return CARTWHEEL_PHASES[Math.min(7, Math.floor(elapsed / (duration / 8)))];
}

function beginMove(e: CatGuardState, move: CatGuardMove): void {
  const spec = CAT_GUARD_MOVES[move];
  e.catMove = move;
  e.state = move === "lightPunch" || move === "heavyPunch" ? "punch" : "kick";
  e.stateTimer = spec.duration;
  e.catAttackLanded = false;
}

function chooseSequence(e: CatGuardState, random: () => number, cartwheelPressure: number): CatGuardMove[] {
  const black = e.variant === "catBlack";
  const roll = random();
  if (roll < (black ? 0.24 : 0.16)) return ["lightPunch", "lightPunch", "frontKick"];
  if (roll < (black ? 0.39 : 0.28) * cartwheelPressure) return ["lightPunch", "cartwheel"];
  if (roll < (black ? 0.60 : 0.45) * cartwheelPressure) return ["cartwheel"];
  if (roll < (black ? 0.80 : 0.63)) return ["roundhouse"];
  return [black ? "lightPunch" : "heavyPunch"];
}

/** Variant-aware AI using only the existing global difficulty modifiers. */
export function stepCatGuard(
  e: CatGuardState,
  target: Pick<PlayerEntity, "x" | "y" | "hp" | "state">,
  baseSpeed: number,
  mods: DifficultyModifiers,
  random: () => number = Math.random,
): void {
  if (!isCatGuard(e) || e.hp <= 0 || e.state === "dead" || e.climbing) return;
  if (e.state === "hit") { e.catMove = undefined; e.catCombo = undefined; return; }

  if (e.catMove && e.stateTimer <= 0) {
    e.catMove = undefined;
    const next = e.catCombo?.shift();
    if (next) { beginMove(e, next); return; }
    e.catCombo = undefined;
    e.state = "idle";
  }
  if (e.catMove && e.stateTimer > 0) return;

  e.catDecision = Math.max(0, (e.catDecision ?? 0) - 1);
  const dx = target.x - e.x;
  const dist = Math.abs(dx);
  e.facing = dx >= 0 ? 1 : -1;
  const black = e.variant === "catBlack";
  const decisionRate = black ? 0.78 : 1.08;
  const recovery = mods.enemyCooldown * decisionRate;
  const chase = mods.enemySpeed * (black ? 1.16 : 0.94);

  if (dist > 58) {
    // The shared physics pass is the only code that applies velocity to world
    // position. Cat Guard AI authors intent here; it never translates x itself.
    const moveSpeed = baseSpeed * chase;
    e.vx = e.facing * moveSpeed;
    e.catMoveSpeed = moveSpeed;
    e.catRunning = dist > 180;
    e.state = "walk";
    return;
  }
  e.vx = 0;
  e.catMoveSpeed = 0;
  e.catRunning = false;
  if (e.attackCooldown > 0 || (e.catDecision ?? 0) > 0 || target.hp <= 0 || target.state === "dead") {
    e.state = "idle";
    return;
  }

  const cartwheelPressure = Math.max(0.65, Math.min(1.45, 1 / mods.enemyCooldown));
  const sequence = chooseSequence(e, random, cartwheelPressure);
  const first = sequence.shift();
  if (!first) return;
  e.catCombo = sequence;
  beginMove(e, first);
  e.attackCooldown = Math.round((black ? 34 : 42) * recovery);
  e.catDecision = Math.round((black ? 12 : 18) * recovery);
}

/** One-hit-latched AABB strike resolution, including Cartwheel impact frames. */
export function resolveCatGuardStrike(
  e: CatGuardState,
  target: Pick<PlayerEntity, "x" | "y" | "width" | "height" | "state">,
): { hit: boolean; damage: number; knockback: number } {
  const move = e.catMove;
  if (!move || e.catAttackLanded) return { hit: false, damage: 0, knockback: 0 };
  const spec = CAT_GUARD_MOVES[move];
  if (e.stateTimer > spec.activeFrom || e.stateTimer < spec.activeTo || target.state === "dead") {
    return { hit: false, damage: 0, knockback: 0 };
  }
  const hit = strikeConnects(e, target, spec.range, move === "cartwheel", 58);
  if (!hit) return { hit: false, damage: 0, knockback: 0 };
  const variantDamage = e.variant === "catOrange" && move !== "lightPunch" ? 1.16 : 1;
  return { hit: true, damage: Math.round(spec.damage * variantDamage), knockback: spec.knockback };
}

export function authoredCatGuardRoster(wave: number) {
  return AUTHORED_GUARDS[wave] ?? [];
}