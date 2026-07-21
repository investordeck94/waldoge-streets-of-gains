/**
 * Player module — Waldoge: Street of Gains
 * ---------------------------------------------------------------------------
 * PURPOSE
 * Central home for the player *data model* and safe, side-effect-free helpers
 * that operate on that model. This is the first step of the staged migration
 * that will eventually let a future 3D renderer consume the same Player type
 * without changes to gameplay.
 *
 * SCOPE OF THIS EXTRACTION
 * We deliberately keep the extraction conservative. The following ARE moved
 * here because they can be lifted without any behavioural change:
 *   • Player state shape (Entity type re-used by the game)
 *   • Player factory (createPlayer)
 *   • Pure helpers for HP, stamina/energy, state, movement kinematics,
 *     and animation-state queries.
 *
 * WHAT IS INTENTIONALLY LEFT INSIDE StreetBrawler.tsx
 * The live update loop in StreetBrawler.tsx is a single 60 fps closure that
 * mutates `g.player` in-place while simultaneously reading from and writing
 * to a large set of *sibling* systems (input `g.keys` / `g.keyJustPressed`,
 * combo buffer `g.combo`, camera `g.camX` / `g.vxHistory` / `g.camShake`,
 * projectiles, powerups, weapons, platforms, boss AI, and screen-space hit
 * effects). Physics integration, ground snap, facing flip, jump impulse,
 * attack-active windows, hit-pause, and animation-state transitions are all
 * interleaved with those systems within the same frame.
 *
 * Extracting the *update loop*, *movement logic*, *animation-state machine*,
 * or *combat state* into this module would either:
 *   (a) change execution order relative to camera / projectile / AI updates,
 *   (b) require passing 15+ refs across a module boundary, changing timing
 *       by even one frame, or
 *   (c) split hit-pause and stateTimer decrement across two systems, which
 *       are currently in lock-step.
 *
 * The user's explicit rules forbid changing gameplay, physics, animations,
 * timing, camera, controls, combat or AI. So those parts remain in
 * StreetBrawler.tsx exactly as written. This module gives them a typed,
 * documented home to migrate into once the surrounding systems have also
 * been isolated (input, combat, camera — future refactor passes).
 *
 * Everything below is byte-identical in behaviour to the original inline
 * definition in StreetBrawler.tsx.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

// ---------------------------------------------------------------------------
// Types — mirror of the original Entity contract in StreetBrawler.tsx.
// Kept structurally identical so `g.player: Entity` continues to work
// with zero call-site edits.
// ---------------------------------------------------------------------------

export type PlayerAttackState =
  | "idle"
  | "walk"
  | "jump"
  | "punch"
  | "kick"
  | "hit"
  | "dead"
  | "uppercut"
  | "spinkick"
  | "groundpound"
  | "dashpunch"
  | "boss_charge"
  | "boss_slam"
  | "boss_throw";

export interface PlayerEntity {
  x: number;
  y: number;
  vy: number;
  vx: number;
  width: number;
  height: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: PlayerAttackState;
  stateTimer: number;
  attackCooldown: number;
  isPlayer?: boolean;
  isBoss?: boolean;
  bossPhase?: number;
  aiTimer?: number;
  bossName?: string;
}

// ---------------------------------------------------------------------------
// Spawn constants — the exact literal values previously inlined in
// createPlayer(). Exposed so tests / editors / future 3D setup can read them
// without duplicating magic numbers.
// ---------------------------------------------------------------------------

export const PLAYER_SPAWN = {
  x: 200,
  width: 30,
  height: 70,
  maxHp: 100,
  facing: 1 as const,
} as const;

/**
 * Build a fresh player entity at spawn.
 *
 * NOTE: The Y coordinate is intentionally taken as a parameter so this
 * module stays decoupled from GROUND_Y which is defined in
 * `src/game/config/`. StreetBrawler.tsx passes its GROUND_Y import — the
 * numeric result is identical to the original inline literal.
 */
export function createPlayer(groundY: number): PlayerEntity {
  return {
    x: PLAYER_SPAWN.x,
    y: groundY,
    vy: 0,
    vx: 0,
    width: PLAYER_SPAWN.width,
    height: PLAYER_SPAWN.height,
    facing: PLAYER_SPAWN.facing,
    hp: PLAYER_SPAWN.maxHp,
    maxHp: PLAYER_SPAWN.maxHp,
    state: "idle",
    stateTimer: 0,
    attackCooldown: 0,
    isPlayer: true,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers. Each is a *drop-in* wrapper around the arithmetic already
// performed inline in StreetBrawler.tsx. They do NOT change semantics — they
// simply give the same operations a named, typed home. StreetBrawler.tsx may
// migrate call sites to these helpers gradually, one at a time, verifying
// parity as it goes. Any call site that has *not* migrated yet continues to
// work because these helpers never run automatically.
// ---------------------------------------------------------------------------

/** Clamp helper (identical to the inline Math.max/Math.min pattern used). */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// -- Health --------------------------------------------------------------

export function setPlayerHp(p: PlayerEntity, hp: number): void {
  p.hp = clamp(hp, 0, p.maxHp);
}

export function damagePlayer(p: PlayerEntity, amount: number): void {
  p.hp = Math.max(0, p.hp - amount);
}

export function healPlayer(p: PlayerEntity, amount: number): void {
  p.hp = Math.min(p.maxHp, p.hp + amount);
}

export function isPlayerAlive(p: PlayerEntity): boolean {
  return p.hp > 0;
}

// -- Stamina / Energy -----------------------------------------------------
//
// Stamina/energy in Street of Gains is a React-state value (`energy`) that
// lives outside the Entity for UI reactivity reasons. Helpers here operate
// on a raw number so both the React setter and any future engine-side
// buffer can share the same clamp rules.

export const PLAYER_ENERGY = { min: 0, max: 100 } as const;

export function clampEnergy(v: number): number {
  return clamp(v, PLAYER_ENERGY.min, PLAYER_ENERGY.max);
}

export function addEnergy(current: number, delta: number): number {
  return clampEnergy(current + delta);
}

export function spendEnergy(current: number, cost: number): number {
  return clampEnergy(current - cost);
}

export function hasEnergy(current: number, cost: number): boolean {
  return current >= cost;
}

// -- Movement / kinematics -----------------------------------------------
//
// The live loop integrates position with `p.x += p.vx` and `p.y += p.vy`
// followed by a ground snap. Those inline statements stay in
// StreetBrawler.tsx to preserve exact ordering relative to camera + AI +
// projectile updates. These helpers are provided for future use only.

export function applyHorizontalVelocity(p: PlayerEntity): void {
  p.x += p.vx;
}

export function applyVerticalVelocity(p: PlayerEntity): void {
  p.y += p.vy;
}

export function groundSnap(p: PlayerEntity, groundY: number): boolean {
  if (p.y >= groundY) {
    p.y = groundY;
    p.vy = 0;
    return true;
  }
  return false;
}

export function faceTowards(p: PlayerEntity, targetX: number): void {
  p.facing = targetX >= p.x ? 1 : -1;
}

// -- Animation-state queries ---------------------------------------------

const ATTACK_STATES: ReadonlySet<PlayerAttackState> = new Set([
  "punch",
  "kick",
  "uppercut",
  "spinkick",
  "groundpound",
  "dashpunch",
]);

export function isAttacking(p: PlayerEntity): boolean {
  return ATTACK_STATES.has(p.state);
}

export function isAirborne(p: PlayerEntity, groundY: number): boolean {
  return p.y < groundY;
}

export function isStunned(p: PlayerEntity): boolean {
  return p.state === "hit";
}

export function setState(
  p: PlayerEntity,
  state: PlayerAttackState,
  timer = 0,
): void {
  p.state = state;
  p.stateTimer = timer;
}

// -- Stats snapshot ------------------------------------------------------
//
// Used by the GameState mirror to publish read-only player stats to the
// central store. Returns a shallow copy so callers cannot accidentally
// mutate the live entity through the snapshot.

export interface PlayerStatsSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  state: PlayerAttackState;
  stateTimer: number;
  attackCooldown: number;
}

export function snapshotPlayer(p: PlayerEntity): PlayerStatsSnapshot {
  return {
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    hp: p.hp,
    maxHp: p.maxHp,
    facing: p.facing,
    state: p.state,
    stateTimer: p.stateTimer,
    attackCooldown: p.attackCooldown,
  };
}

// ---------------------------------------------------------------------------
// FUTURE WORK (for the next refactor pass, not this one)
// ---------------------------------------------------------------------------
// updatePlayer(p, input, dt, world) — a single frame-step function that
// consumes an already-normalized `input` snapshot (produced by a future
// Input module) and world context (ground, platforms, camera). It will
// replace the ~200 lines of inline player logic in StreetBrawler.tsx's
// game loop, but only *after* the input, combat, and camera systems have
// been factored out too. Attempting it now would violate the "do not
// change timing / physics / animation / combat" rule.
