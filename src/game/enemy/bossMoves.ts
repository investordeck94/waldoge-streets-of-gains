/**
 * Boss move sets + attack selection — Waldoge: Street of Gains
 * ---------------------------------------------------------------------------
 * Shared by EVERY boss on ALL 7 levels. This module is pure data + pure
 * functions: it never touches the canvas, audio, DOM or React state.
 *
 * WHY THIS EXISTS
 * The boss AI used to hard-code four branches (charge / throw / slam /
 * punch-or-kick) chosen purely by distance. That produced two problems:
 *   1. Every boss played identically and spammed whichever move matched the
 *      current distance band.
 *   2. Attack selection and attack resolution were duplicated, distance-keyed
 *      chains of ternaries — easy for a state to be entered with no matching
 *      exit / hit frame, which is how a boss could end up locked mid-attack.
 *
 * Now each boss owns a named move set (4–7 moves). Every move declares its
 * own duration, hit frames, range, damage, cooldown, phase gate and optional
 * projectile volley, so:
 *   • Every temporary state has a guaranteed exit (stateTimer = duration, and
 *     the shared safety layer in ./movement.ts releases any overrun state).
 *   • Selection is contextual (distance, vertical gap, phase, last move) and
 *     weighted-random, so bosses never spam one attack.
 *   • Animation states stay exactly the ones the renderer already draws
 *     (punch / kick / boss_slam / boss_charge / boss_throw), so visuals,
 *     boss identities and HP are untouched.
 */

import type { PlayerAttackState } from "@/game/player/Player";

/** Animation state a move plays. Restricted to states the renderer knows. */
export type BossMoveAnim =
  | "punch"
  | "kick"
  | "boss_slam"
  | "boss_charge"
  | "boss_throw";

export interface BossProjectileSpec {
  /** stateTimer value (frames remaining) at which this volley spawns. */
  frame: number;
  /** How many projectiles in the volley. */
  count?: number;
  /** Horizontal speed, in the boss's facing direction. */
  speed: number;
  /** Initial vertical velocity of the centre shot. */
  vy?: number;
  /** Vertical spread applied across the volley. */
  spread?: number;
  /** Lifetime in frames. */
  timer?: number;
}

export interface BossMove {
  id: string;
  /** Short label shown as a telegraph when the move starts. */
  name: string;
  anim: BossMoveAnim;
  /** Total frames the state lasts (stateTimer starts here and counts down). */
  duration: number;
  /** stateTimer values at which a melee hit is tested. Empty = no melee hit. */
  hitFrames: number[];
  /** Base damage before boss dmgMult and difficulty scaling. */
  damage: number;
  /** Horizontal reach of the melee hit. */
  range: number;
  /** Vertical reach of the melee hit. */
  vertRange: number;
  /** Horizontal impulse applied to the player on hit. */
  knockback: number;
  /** Upward impulse applied to the player on hit (negative = launch). */
  launch?: number;
  /** True = the hit lands on both sides (area attack), not just in front. */
  omni?: boolean;
  /** Base cooldown in frames after the move ends. */
  cooldown: number;
  /** Distance band in which this move may be chosen. */
  minDist: number;
  maxDist: number;
  /** Earliest boss phase (1–3) in which this move unlocks. */
  minPhase: 1 | 2 | 3;
  /** Relative pick weight inside the eligible set. */
  weight: number;
  /** Px per frame the boss travels while the move is active. */
  advance?: number;
  /** Movement only applies while stateTimer is above this value. */
  advanceUntil?: number;
  /** Screen shake magnitude on a landed hit. */
  shake: number;
  /** Hit-pause frames on a landed hit. */
  hitPause: number;
  /** Projectile volleys spawned by this move. */
  projectiles?: BossProjectileSpec[];
  /** Which existing SFX to play on start, if any. */
  sfx?: "charge" | "slam" | "throw";
  /** Floating callout drawn when the move starts. */
  shout?: string;
}

// ---------------------------------------------------------------------------
// Move sets — one per boss, keyed by the boss name in src/game/config/levels.
// Damage numbers stay in the 3–8 band the original four moves used, so
// existing balance/difficulty scaling is preserved.
// ---------------------------------------------------------------------------

const JEET: BossMove[] = [
  { id: "jeet_jab", name: "Paper Hands Jab", anim: "punch", duration: 14, hitFrames: [9], damage: 3, range: 55, vertRange: 60, knockback: 4, cooldown: 25, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "jeet_kick", name: "Panic Kick", anim: "kick", duration: 17, hitFrames: [11], damage: 4, range: 60, vertRange: 60, knockback: 5, cooldown: 28, minDist: 0, maxDist: 110, minPhase: 1, weight: 9, shake: 7, hitPause: 2 },
  { id: "jeet_dump", name: "Dump Slam", anim: "boss_slam", duration: 25, hitFrames: [12], damage: 6, range: 100, vertRange: 70, knockback: 6, launch: -8, omni: true, cooldown: 45, minDist: 0, maxDist: 120, minPhase: 1, weight: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 DUMP!" },
  { id: "jeet_sellwall", name: "Sell Wall", anim: "boss_throw", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 40, minDist: 120, maxDist: 900, minPhase: 1, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 10, speed: 7, vy: -2 }] },
  { id: "jeet_sprint", name: "Exit Sprint", anim: "boss_charge", duration: 30, hitFrames: [10], damage: 5, range: 60, vertRange: 60, knockback: 10, cooldown: 50, minDist: 200, maxDist: 900, minPhase: 2, weight: 8, advance: 1, advanceUntil: 5, shake: 10, hitPause: 2, sfx: "charge" },
];

const RUGGER: BossMove[] = [
  { id: "rug_yank", name: "Rug Yank", anim: "punch", duration: 14, hitFrames: [9], damage: 4, range: 55, vertRange: 60, knockback: 4, cooldown: 24, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "rug_sweep", name: "Carpet Sweep", anim: "kick", duration: 20, hitFrames: [14, 7], damage: 3, range: 70, vertRange: 45, knockback: 5, cooldown: 32, minDist: 0, maxDist: 120, minPhase: 1, weight: 8, shake: 8, hitPause: 2 },
  { id: "rug_slam", name: "Liquidity Slam", anim: "boss_slam", duration: 25, hitFrames: [12], damage: 6, range: 105, vertRange: 75, knockback: 6, launch: -8, omni: true, cooldown: 44, minDist: 0, maxDist: 130, minPhase: 1, weight: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 RUG SLAM!" },
  { id: "rug_dash", name: "Rug Pull Dash", anim: "boss_charge", duration: 30, hitFrames: [16, 8], damage: 4, range: 60, vertRange: 60, knockback: 9, cooldown: 48, minDist: 160, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "rug_spray", name: "Token Spray", anim: "boss_throw", duration: 26, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 46, minDist: 130, maxDist: 900, minPhase: 2, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, count: 3, speed: 6.5, vy: -2, spread: 2.2 }] },
];

const BAD_ACTOR: BossMove[] = [
  { id: "ba_jab", name: "Shill Jab", anim: "punch", duration: 13, hitFrames: [9], damage: 4, range: 55, vertRange: 60, knockback: 4, cooldown: 22, minDist: 0, maxDist: 90, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "ba_combo", name: "Sucker Combo", anim: "punch", duration: 30, hitFrames: [24, 16, 8], damage: 3, range: 58, vertRange: 60, knockback: 3, cooldown: 40, minDist: 0, maxDist: 100, minPhase: 1, weight: 8, shake: 8, hitPause: 2, shout: "COMBO!" },
  { id: "ba_insider", name: "Insider Slam", anim: "boss_slam", duration: 25, hitFrames: [12], damage: 6, range: 100, vertRange: 80, knockback: 6, launch: -8, omni: true, cooldown: 44, minDist: 0, maxDist: 125, minPhase: 1, weight: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 INSIDER!" },
  { id: "ba_fakenews", name: "Fake News Volley", anim: "boss_throw", duration: 24, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 42, minDist: 120, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, speed: 9, vy: -1 }, { frame: 8, speed: 9, vy: -3 }] },
  { id: "ba_scam", name: "Scam Charge", anim: "boss_charge", duration: 30, hitFrames: [10], damage: 5, range: 60, vertRange: 60, knockback: 10, cooldown: 50, minDist: 180, maxDist: 900, minPhase: 2, weight: 8, advance: 1, advanceUntil: 5, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "ba_fade", name: "Fade Step", anim: "boss_charge", duration: 18, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 34, minDist: 0, maxDist: 110, minPhase: 2, weight: 5, advance: -3.2, advanceUntil: 4, shake: 0, hitPause: 0, shout: "FADE" },
];

const FUDDER: BossMove[] = [
  { id: "fud_jab", name: "Fear Jab", anim: "punch", duration: 14, hitFrames: [9], damage: 4, range: 55, vertRange: 60, knockback: 4, cooldown: 22, minDist: 0, maxDist: 92, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "fud_kick", name: "Doubt Kick", anim: "kick", duration: 17, hitFrames: [11], damage: 5, range: 62, vertRange: 60, knockback: 5, cooldown: 26, minDist: 0, maxDist: 115, minPhase: 1, weight: 9, shake: 8, hitPause: 2 },
  { id: "fud_slam", name: "FUD Slam", anim: "boss_slam", duration: 25, hitFrames: [12], damage: 6, range: 105, vertRange: 80, knockback: 6, launch: -8, omni: true, cooldown: 42, minDist: 0, maxDist: 130, minPhase: 1, weight: 8, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 FUD SLAM!" },
  { id: "fud_bomb", name: "FUD Bomb", anim: "boss_throw", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 36, minDist: 110, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 10, speed: 7, vy: -4 }] },
  { id: "fud_volley", name: "Panic Volley", anim: "boss_throw", duration: 30, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 50, minDist: 140, maxDist: 900, minPhase: 2, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 22, speed: 10, vy: -1 }, { frame: 14, speed: 10, vy: -2.5 }, { frame: 6, speed: 10, vy: -4 }], shout: "PANIC!" },
  { id: "fud_charge", name: "Capitulation Charge", anim: "boss_charge", duration: 30, hitFrames: [16, 8], damage: 5, range: 62, vertRange: 60, knockback: 10, cooldown: 48, minDist: 170, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "fud_scream", name: "Doom Scream", anim: "boss_slam", duration: 34, hitFrames: [14], damage: 7, range: 150, vertRange: 110, knockback: 8, launch: -6, omni: true, cooldown: 62, minDist: 0, maxDist: 170, minPhase: 3, weight: 7, shake: 15, hitPause: 5, sfx: "slam", shout: "☠ DOOM SCREAM!" },
];

const EXIT_LIQUIDITY: BossMove[] = [
  { id: "el_drain", name: "Drain Punch", anim: "punch", duration: 14, hitFrames: [9], damage: 5, range: 56, vertRange: 60, knockback: 4, cooldown: 22, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "el_sweep", name: "Bagholder Sweep", anim: "kick", duration: 20, hitFrames: [14, 7], damage: 4, range: 72, vertRange: 50, knockback: 6, cooldown: 30, minDist: 0, maxDist: 120, minPhase: 1, weight: 8, shake: 8, hitPause: 2 },
  { id: "el_slam", name: "Liquidity Crush", anim: "boss_slam", duration: 26, hitFrames: [12], damage: 7, range: 115, vertRange: 85, knockback: 7, launch: -9, omni: true, cooldown: 44, minDist: 0, maxDist: 140, minPhase: 1, weight: 8, shake: 14, hitPause: 4, sfx: "slam", shout: "💀 CRUSH!" },
  { id: "el_bags", name: "Bag Toss", anim: "boss_throw", duration: 24, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 40, minDist: 120, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, count: 2, speed: 7.5, vy: -3, spread: 2.5 }] },
  { id: "el_dash", name: "Exit Dash", anim: "boss_charge", duration: 30, hitFrames: [10], damage: 6, range: 62, vertRange: 60, knockback: 11, cooldown: 48, minDist: 170, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, shake: 11, hitPause: 3, sfx: "charge" },
  { id: "el_double", name: "Double Dip", anim: "boss_slam", duration: 40, hitFrames: [28, 12], damage: 5, range: 120, vertRange: 90, knockback: 6, launch: -7, omni: true, cooldown: 60, minDist: 0, maxDist: 150, minPhase: 3, weight: 7, shake: 14, hitPause: 4, sfx: "slam", shout: "☠ DOUBLE DIP!" },
];

const MR_MARKETER: BossMove[] = [
  { id: "mm_mic", name: "Mic Drop", anim: "punch", duration: 14, hitFrames: [9], damage: 5, range: 56, vertRange: 60, knockback: 4, cooldown: 20, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2 },
  { id: "mm_hype", name: "Hype Kick", anim: "kick", duration: 17, hitFrames: [11], damage: 6, range: 64, vertRange: 60, knockback: 6, cooldown: 26, minDist: 0, maxDist: 115, minPhase: 1, weight: 9, shake: 8, hitPause: 2 },
  { id: "mm_board", name: "Billboard Slam", anim: "boss_slam", duration: 26, hitFrames: [12], damage: 7, range: 115, vertRange: 90, knockback: 7, launch: -9, omni: true, cooldown: 42, minDist: 0, maxDist: 140, minPhase: 1, weight: 8, shake: 14, hitPause: 4, sfx: "slam", shout: "💀 BILLBOARD!" },
  { id: "mm_spam", name: "Ad Spam", anim: "boss_throw", duration: 28, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 44, minDist: 110, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 18, count: 4, speed: 7, vy: -2, spread: 3 }] },
  { id: "mm_viral", name: "Viral Charge", anim: "boss_charge", duration: 30, hitFrames: [16, 8], damage: 6, range: 62, vertRange: 60, knockback: 11, cooldown: 46, minDist: 170, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, shake: 11, hitPause: 3, sfx: "charge" },
  { id: "mm_pump", name: "Pump Storm", anim: "boss_throw", duration: 40, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 66, minDist: 100, maxDist: 900, minPhase: 3, weight: 7, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 32, count: 2, speed: 9, vy: -1, spread: 2 }, { frame: 22, count: 2, speed: 9, vy: -3, spread: 2 }, { frame: 12, count: 2, speed: 9, vy: -5, spread: 2 }], shout: "☠ PUMP STORM!" },
];

const TICKER_THIEF: BossMove[] = [
  { id: "tt_jab", name: "Ticker Jab", anim: "punch", duration: 13, hitFrames: [9], damage: 6, range: 58, vertRange: 60, knockback: 5, cooldown: 18, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 8, hitPause: 2 },
  { id: "tt_combo", name: "Wick Combo", anim: "punch", duration: 32, hitFrames: [26, 18, 9], damage: 4, range: 60, vertRange: 60, knockback: 3, cooldown: 38, minDist: 0, maxDist: 105, minPhase: 1, weight: 8, shake: 9, hitPause: 2, shout: "WICK COMBO!" },
  { id: "tt_kick", name: "Delisting Kick", anim: "kick", duration: 18, hitFrames: [11], damage: 7, range: 68, vertRange: 65, knockback: 7, cooldown: 24, minDist: 0, maxDist: 120, minPhase: 1, weight: 9, shake: 9, hitPause: 3 },
  { id: "tt_slam", name: "Red Candle Slam", anim: "boss_slam", duration: 26, hitFrames: [12], damage: 8, range: 120, vertRange: 95, knockback: 8, launch: -10, omni: true, cooldown: 40, minDist: 0, maxDist: 145, minPhase: 1, weight: 8, shake: 15, hitPause: 4, sfx: "slam", shout: "💀 RED CANDLE!" },
  { id: "tt_spike", name: "Chart Spike", anim: "boss_throw", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 32, minDist: 110, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 12, speed: 11, vy: 0 }] },
  { id: "tt_barrage", name: "Candle Barrage", anim: "boss_throw", duration: 36, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 56, minDist: 130, maxDist: 900, minPhase: 2, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 28, count: 3, speed: 8, vy: -1, spread: 2.5 }, { frame: 14, count: 2, speed: 8, vy: -4, spread: 2.5 }], shout: "BARRAGE!" },
  { id: "tt_steal", name: "Ticker Steal Dash", anim: "boss_charge", duration: 30, hitFrames: [18, 9], damage: 6, range: 64, vertRange: 60, knockback: 12, cooldown: 44, minDist: 160, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, shake: 12, hitPause: 3, sfx: "charge" },
  { id: "tt_crash", name: "Market Crash", anim: "boss_slam", duration: 42, hitFrames: [30, 14], damage: 7, range: 170, vertRange: 120, knockback: 9, launch: -8, omni: true, cooldown: 70, minDist: 0, maxDist: 190, minPhase: 3, weight: 7, shake: 16, hitPause: 5, sfx: "slam", shout: "☠ MARKET CRASH!" },
];

export const BOSS_MOVESETS: Record<string, BossMove[]> = {
  JEET,
  RUGGER,
  "BAD ACTOR": BAD_ACTOR,
  FUDDER,
  "EXIT LIQUIDITY": EXIT_LIQUIDITY,
  "MR MARKETER": MR_MARKETER,
  "TICKER THIEF": TICKER_THIEF,
};

/** Fallback so an unknown boss name still gets a full, working move set. */
export const DEFAULT_MOVESET = JEET;

export function getMoveSet(bossName: string | undefined): BossMove[] {
  return (bossName && BOSS_MOVESETS[bossName]) || DEFAULT_MOVESET;
}

export function getMoveById(bossName: string | undefined, id: string | undefined): BossMove | null {
  if (!id) return null;
  return getMoveSet(bossName).find((m) => m.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface BossSelectionContext {
  /** Absolute horizontal distance to the player. */
  dist: number;
  /** Absolute vertical distance to the player (player on a platform = large). */
  vertGap: number;
  /** 1–3. */
  phase: number;
  /** Id of the move used last, so we can discourage repeats. */
  lastMoveId?: string;
  /** How many times in a row lastMoveId has been used. */
  repeatCount?: number;
  /** Injectable RNG for deterministic tests. */
  rng?: () => number;
}

/** A move only counts as able to reach a player who is far above/below. */
function reachesVertically(m: BossMove, vertGap: number): boolean {
  if (vertGap <= 60) return true;
  if (m.projectiles && m.projectiles.length > 0) return true;
  return m.vertRange >= vertGap;
}

/**
 * Pick the next move for a boss. Returns null when nothing is appropriate at
 * this distance — the caller then walks/repositions, which guarantees the AI
 * always has something to do and never idles forever.
 */
export function selectBossMove(
  bossName: string | undefined,
  ctx: BossSelectionContext,
): BossMove | null {
  const rng = ctx.rng ?? Math.random;
  const phase = Math.max(1, Math.min(3, Math.round(ctx.phase || 1)));
  const moves = getMoveSet(bossName);

  const eligible = moves.filter(
    (m) =>
      phase >= m.minPhase &&
      ctx.dist >= m.minDist &&
      ctx.dist <= m.maxDist &&
      reachesVertically(m, ctx.vertGap),
  );
  if (eligible.length === 0) return null;

  const repeats = ctx.repeatCount ?? 0;
  const weights = eligible.map((m) => {
    let w = m.weight;
    if (m.id === ctx.lastMoveId) {
      // Hard-block a third identical pick, soften a second one.
      w = repeats >= 2 ? 0 : w * 0.3;
    }
    // Later phases favour the heavier, later-unlocking moves.
    if (m.minPhase > 1) w *= 1 + (phase - m.minPhase) * 0.5;
    return Math.max(0, w);
  });

  let total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    // Everything was blocked by the anti-repeat rule: fall back to any other
    // eligible move, else allow the repeat rather than stalling.
    const others = eligible.filter((m) => m.id !== ctx.lastMoveId);
    const pool = others.length > 0 ? others : eligible;
    return pool[Math.floor(rng() * pool.length)] ?? pool[0];
  }

  let roll = rng() * total;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

/** Every animation state a move can put a boss into (used by the safety layer). */
export const BOSS_MOVE_ANIMS: PlayerAttackState[] = [
  "punch",
  "kick",
  "boss_slam",
  "boss_charge",
  "boss_throw",
];
