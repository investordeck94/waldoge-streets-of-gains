/**
 * Boss tactics layer — Waldoge: Street of Gains
 * ---------------------------------------------------------------------------
 * PURE DATA + PURE FUNCTIONS. No canvas, no audio, no React, no allocation in
 * the per-frame path (the only object created here is one small bias record,
 * and only at the moment a boss actually makes a decision — a few times per
 * second, not 60).
 *
 * WHY THIS EXISTS
 * `selectBossMove()` already picks a contextual, weighted, anti-repeat move.
 * What it could not see was *what the player was doing*: only TICKER TAKER had
 * a hand-written bias table, and every other boss simply matched a distance
 * band. That made the roster feel identical and far too passive.
 *
 * This module adds three things, all on top of the existing systems:
 *   1. MOVE CLASSIFICATION — tags derived from data each move already declares
 *      (duration, telegraph, advance, projectiles, omni, vertRange, hop). No
 *      new fields on BossMove, computed once at module load and cached.
 *   2. A TACTICAL READ — a handful of booleans about the player (airborne,
 *      attacking, recovering from a whiff, camping passively, charged up).
 *   3. PER-BOSS PROFILES — the level 1 → level 7 difficulty curve expressed as
 *      identity, not as HP. Each boss gets its own cooldown scaling, phase
 *      escalation, chain cap and "tactical IQ" (how strongly the read moves
 *      its weights). JEET barely reads the player; TICKER TAKER reads
 *      everything.
 *
 * FAIRNESS RULE: nothing here changes a move's damage, startup, telegraph or
 * duration. Bosses get harder by choosing BETTER moves at BETTER moments — the
 * counterplay windows authored into every move are untouched.
 */

import { getMoveSet, type BossMove } from "./bossMoves";

// ---------------------------------------------------------------------------
// 1. Move classification (computed once, cached forever)
// ---------------------------------------------------------------------------

export interface MoveTags {
  /** Short committed strike — the tool for punishing a whiff. */
  fast: boolean;
  /** Long wind-up. Great as a read, terrible as a reaction. */
  heavy: boolean;
  /** Fires a projectile volley. */
  ranged: boolean;
  /** Travels forward — gap closer. */
  gapCloser: boolean;
  /** Travels backward — spacing reset. */
  retreat: boolean;
  /** Can plausibly hit a player above the ground. */
  antiAir: boolean;
  /** Hits on both sides / wide — area control. */
  area: boolean;
  /** Counter-poses; best used while the player is committed. */
  counter: boolean;
  /** Steals the player's energy meter instead of HP. */
  drain: boolean;
  /** Calls in minions. */
  summon: boolean;
  /** Deals no direct damage (utility). */
  utility: boolean;
}

const TAG_CACHE = new Map<string, MoveTags>();

export function tagsFor(m: BossMove): MoveTags {
  const hit = TAG_CACHE.get(m.id);
  if (hit) return hit;
  const tags: MoveTags = {
    fast: m.duration <= 20 && m.hitFrames.length > 0 && (m.telegraph ?? 0) < 0.4,
    heavy: (m.telegraph ?? 0) >= 0.4 || m.duration >= 34,
    ranged: !!m.projectiles?.length,
    gapCloser: (m.advance ?? 0) > 0,
    retreat: (m.advance ?? 0) < 0,
    antiAir: m.vertRange >= 80 || !!m.hop,
    area: !!m.omni,
    counter: m.martial === "counter" || m.martial === "dodge",
    drain: !!m.drainEnergy,
    summon: !!m.summon,
    utility: m.damage <= 0 && !m.projectiles?.length && !m.drainEnergy && !m.summon,
  };
  TAG_CACHE.set(m.id, tags);
  return tags;
}

// ---------------------------------------------------------------------------
// 2. Per-boss profiles — THE LEVEL 1 → LEVEL 7 CURVE
// ---------------------------------------------------------------------------

export interface BossProfile {
  /** Base multiplier on decision downtime. Lower = acts more often. */
  cdMult: number;
  /** Cooldown reduction per phase above 1 (0.10 = 10% faster each phase). */
  phaseStep: number;
  /** How strongly the tactical read bends move weights. 0 = ignores player. */
  tactic: number;
  /** Max links in one combo chain at phase 1 (phase 3 adds one). */
  chainCap: number;
  /** Multiplier on each move's authored chainChance. */
  chainBonus: number;
  /** Multiplier on walking speed while repositioning. */
  mobility: number;
  /** Backs off when the player is right on top of it (spacing control). */
  spacing: boolean;
  /** Extra pressure (shorter downtime) when the player plays passively. */
  punishPassive: number;
}

/**
 * Ordered JEET → TICKER TAKER. Every column moves in the harder direction, so
 * the curve is explicit and auditable in one place.
 *
 *  L1 JEET            readable, slow decisions, barely reads the player
 *  L2 RUGGER          rushdown — shorter downtime, real chaining
 *  L3 BAD ACTOR       deception — reads whiffs, mixes ranged pressure
 *  L4 FUDDER          area control — heavy coverage, punishes passive play
 *  L5 EXIT LIQUIDITY  speed/mobility — big jump in decision frequency
 *  L6 MR MARKETER     overwhelming activity — ranged + summons + pressure
 *  L7 TICKER TAKER    adaptive ultimate boss — best at everything
 */
export const BOSS_PROFILES: Record<string, BossProfile> = {
  JEET:              { cdMult: 1.12, phaseStep: 0.06, tactic: 0.35, chainCap: 1, chainBonus: 0.9,  mobility: 0.95, spacing: false, punishPassive: 0.95 },
  RUGGER:            { cdMult: 0.96, phaseStep: 0.09, tactic: 0.55, chainCap: 2, chainBonus: 1.15, mobility: 1.08, spacing: false, punishPassive: 0.9  },
  "BAD ACTOR":       { cdMult: 0.90, phaseStep: 0.11, tactic: 0.72, chainCap: 2, chainBonus: 1.2,  mobility: 1.1,  spacing: true,  punishPassive: 0.86 },
  FUDDER:            { cdMult: 0.88, phaseStep: 0.12, tactic: 0.80, chainCap: 2, chainBonus: 1.2,  mobility: 0.95, spacing: false, punishPassive: 0.82 },
  "EXIT LIQUIDITY":  { cdMult: 0.80, phaseStep: 0.13, tactic: 0.90, chainCap: 3, chainBonus: 1.3,  mobility: 1.25, spacing: true,  punishPassive: 0.80 },
  "MR MARKETER":     { cdMult: 0.76, phaseStep: 0.14, tactic: 1.00, chainCap: 3, chainBonus: 1.35, mobility: 1.18, spacing: true,  punishPassive: 0.76 },
  "TICKER TAKER":    { cdMult: 0.70, phaseStep: 0.16, tactic: 1.25, chainCap: 3, chainBonus: 1.45, mobility: 1.35, spacing: true,  punishPassive: 0.72 },
};

const DEFAULT_PROFILE: BossProfile = BOSS_PROFILES.JEET;

export function getBossProfile(name: string | undefined): BossProfile {
  return (name && BOSS_PROFILES[name]) || DEFAULT_PROFILE;
}

// ---------------------------------------------------------------------------
// 3. The tactical read
// ---------------------------------------------------------------------------

export interface TacticalRead {
  /** Horizontal distance to the player. */
  dist: number;
  /** Vertical distance to the player. */
  vertGap: number;
  /** Boss phase, 1–3. */
  phase: number;
  /** Player is off the ground. */
  airborne: boolean;
  /** Player is mid-attack (committed). */
  attacking: boolean;
  /** Player is in attack recovery — the punish window. */
  recovering: boolean;
  /** Player is doing nothing at range (camping / turtling). */
  passive: boolean;
  /** Player special meter, 0–1. */
  energyFrac: number;
}

const MIN_BIAS = 0.2;
const MAX_BIAS = 3.2;

/**
 * Build per-move weight multipliers from the tactical read. The result feeds
 * the existing `bias` field of `selectBossMove()` — selection, anti-repeat and
 * phase gating are untouched.
 *
 * `profile.tactic` scales how far each multiplier is allowed to move away from
 * 1, which is what makes JEET readable and TICKER TAKER frightening while both
 * run the exact same code.
 */
export function computeBossBias(
  bossName: string | undefined,
  read: TacticalRead,
): Record<string, number> {
  const profile = getBossProfile(bossName);
  const iq = profile.tactic;
  const bias: Record<string, number> = {};

  for (const m of getMoveSet(bossName)) {
    const t = tagsFor(m);
    let w = 1;

    // --- Distance intent ---------------------------------------------------
    if (read.dist > 260) {
      if (t.gapCloser) w *= 1.9;
      if (t.ranged) w *= 1.7;
      if (t.retreat) w *= 0.25;
    } else if (read.dist > 110) {
      if (t.ranged) w *= 1.25;
      if (t.gapCloser) w *= 1.35;
      if (t.retreat) w *= 0.6;
    } else {
      if (t.fast) w *= 1.3;
      if (t.area) w *= 1.2;
      if (t.ranged) w *= 0.5;
      if (t.gapCloser) w *= 0.45;
    }

    // --- Punish the player's recovery (the whiff window) -------------------
    if (read.recovering) {
      if (t.fast) w *= 1.9;
      if (t.gapCloser && read.dist > 110) w *= 1.5;
      if (t.heavy) w *= 0.65;
      if (t.utility) w *= 0.4;
    }

    // --- React to a committed player ---------------------------------------
    if (read.attacking) {
      if (t.counter) w *= 1.8;
      if (t.retreat) w *= 1.5;
      if (t.heavy) w *= 0.6;
    }

    // --- Anti-air: never spam ground pokes at a jumping player -------------
    if (read.airborne) {
      if (t.antiAir) w *= 1.8;
      if (t.ranged) w *= 1.25;
      if (!t.antiAir && !t.ranged) w *= 0.35;
    }

    // --- Pressure a passive player -----------------------------------------
    if (read.passive) {
      if (t.gapCloser) w *= 1.9;
      if (t.ranged) w *= 1.6;
      if (t.summon) w *= 1.4;
      if (t.retreat) w *= 0.25;
    }

    // --- Steal energy when there is energy worth stealing ------------------
    if (t.drain) w *= 0.5 + read.energyFrac * 2.6;

    // Scale the whole read by the boss's tactical IQ, then clamp.
    w = 1 + (w - 1) * iq;
    bias[m.id] = Math.min(MAX_BIAS, Math.max(MIN_BIAS, w));
  }

  return bias;
}

// ---------------------------------------------------------------------------
// 4. Cooldowns and chaining
// ---------------------------------------------------------------------------

/** Absolute floor/ceiling on decision downtime — no runaway, no zero. */
export const MIN_BOSS_COOLDOWN = 8;
export const MAX_BOSS_COOLDOWN = 300;

/**
 * Frames of downtime after `move` finishes.
 *
 * base (move.cooldown + move.duration)
 *   × boss profile          (level 1 → 7 curve)
 *   × phase escalation      (later phases decide faster)
 *   × difficulty            (NEW TO CRYPTO → FULL TRENCH)
 *   × passive-play pressure (only when the player is turtling)
 * then clamped to [MIN, MAX].
 *
 * Every boss keeps real commitment and recovery: the floor is 8 frames on top
 * of the move's own duration, so punish windows always exist.
 */
export function bossCooldownFrames(
  bossName: string | undefined,
  move: BossMove,
  phase: number,
  difficultyCd: number,
  passive: boolean,
): number {
  const profile = getBossProfile(bossName);
  const ph = Math.max(1, Math.min(3, Math.round(phase || 1)));
  const phaseFactor = Math.max(0.5, 1 - (ph - 1) * profile.phaseStep);
  const dcd = Number.isFinite(difficultyCd) && difficultyCd > 0 ? difficultyCd : 1;
  const base = Math.max(0, move.cooldown) + Math.max(0, move.duration);
  const raw = base * profile.cdMult * phaseFactor * dcd * (passive ? profile.punishPassive : 1);
  if (!Number.isFinite(raw)) return MIN_BOSS_COOLDOWN;
  return Math.min(MAX_BOSS_COOLDOWN, Math.max(MIN_BOSS_COOLDOWN, Math.round(raw)));
}

/** Hard ceiling on links in a single combo, whatever the profile says. */
export const ABSOLUTE_CHAIN_CAP = 4;

/** How many links this boss may chain in the current phase. */
export function chainCapFor(bossName: string | undefined, phase: number): number {
  const profile = getBossProfile(bossName);
  const ph = Math.max(1, Math.min(3, Math.round(phase || 1)));
  return Math.min(ABSOLUTE_CHAIN_CAP, profile.chainCap + (ph >= 3 ? 1 : 0));
}

/**
 * Chain probability for one link. Returns 0 once the cap is reached, which is
 * what guarantees A→B→A→B can never run forever: `depth` counts links since
 * the last free decision and the cap is at most 4.
 */
export function chainChanceFor(
  bossName: string | undefined,
  move: BossMove,
  phase: number,
  depth: number,
): number {
  if (depth >= chainCapFor(bossName, phase)) return 0;
  const profile = getBossProfile(bossName);
  const ph = Math.max(1, Math.min(3, Math.round(phase || 1)));
  const base = move.chainChance ?? 0.35;
  // Each extra link is less likely than the last, so long combos stay rare.
  const decay = Math.pow(0.75, Math.max(0, depth));
  return Math.min(0.8, base * profile.chainBonus * (1 + (ph - 1) * 0.15) * decay);
}
