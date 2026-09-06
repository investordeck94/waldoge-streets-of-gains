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
 * Now each boss owns a named move set (5–8 moves). Every move declares its
 * own duration, hit frames, range, damage, cooldown, phase gate and optional
 * projectile volley, so:
 *   • Every temporary state has a guaranteed exit (stateTimer = duration, and
 *     the shared safety layer in ./movement.ts releases any overrun state).
 *   • Selection is contextual (distance, vertical gap, phase, last move) and
 *     weighted-random, so bosses never spam one attack.
 *   • Animation states stay exactly the ones the renderer already draws
 *     (punch / kick / boss_slam / boss_charge / boss_throw), so visuals,
 *     boss identities and HP are untouched.
 *
 * MARTIAL-ARTS LAYER
 * Every move additionally declares a `martial` form (jab, roundhouse, flying
 * kick, spin, sweep, slam, lunge, combo, dodge, counter, throw). The form is
 * a *presentation* hint the renderer uses to pose the boss like a karate
 * fighter — it never changes selection, damage or timing. Crypto-themed move
 * names are unchanged; only how they look and flow is upgraded. Heavy moves
 * also declare a `telegraph` window (fraction of the move spent winding up)
 * and optional `hop` (jumping attacks) plus `chainTo` combo follow-ups.
 */

import type { PlayerAttackState } from "@/game/player/Player";

/** Animation state a move plays. Restricted to states the renderer knows. */
export type BossMoveAnim =
  | "punch"
  | "kick"
  | "boss_slam"
  | "boss_charge"
  | "boss_throw";

/** Karate/martial-arts pose family used by the renderer. Visual only. */
export type MartialForm =
  | "jab"
  | "straight"
  | "combo"
  | "roundhouse"
  | "flying_kick"
  | "sweep"
  | "spin"
  | "slam"
  | "lunge"
  | "throw"
  | "dodge"
  | "counter";

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
  /** Karate pose family the renderer animates. Visual only. */
  martial: MartialForm;
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
  /** Upward impulse given to the BOSS on start (jumping attacks). */
  hop?: number;
  /** Fraction of the move (0–1) spent winding up — drawn as a telegraph. */
  telegraph?: number;
  /** Move ids this move can chain into immediately as a combo. */
  chainTo?: string[];
  /** Probability (0–1) the chain fires. */
  chainChance?: number;
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
// existing balance/difficulty scaling is preserved. Names are unchanged.
// ---------------------------------------------------------------------------

const JEET: BossMove[] = [
  { id: "jeet_jab", name: "Paper Hands Jab", anim: "punch", martial: "jab", duration: 14, hitFrames: [9], damage: 3, range: 55, vertRange: 60, knockback: 4, cooldown: 25, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2, chainTo: ["jeet_kick", "jeet_dump"], chainChance: 0.4 },
  { id: "jeet_kick", name: "Panic Kick", anim: "kick", martial: "roundhouse", duration: 17, hitFrames: [11], damage: 4, range: 60, vertRange: 60, knockback: 5, cooldown: 28, minDist: 0, maxDist: 110, minPhase: 1, weight: 9, shake: 7, hitPause: 2 },
  { id: "jeet_dump", name: "Dump Slam", anim: "boss_slam", martial: "slam", duration: 25, hitFrames: [12], damage: 6, range: 100, vertRange: 70, knockback: 6, launch: -8, omni: true, cooldown: 45, minDist: 0, maxDist: 120, minPhase: 1, weight: 7, telegraph: 0.45, hop: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 DUMP!" },
  { id: "jeet_sellwall", name: "Sell Wall", anim: "boss_throw", martial: "throw", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 40, minDist: 120, maxDist: 900, minPhase: 1, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 10, speed: 7, vy: -2 }] },
  { id: "jeet_sprint", name: "Exit Sprint", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [10], damage: 5, range: 60, vertRange: 60, knockback: 10, cooldown: 50, minDist: 200, maxDist: 900, minPhase: 2, weight: 8, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "jeet_cope", name: "Cope Counter", anim: "punch", martial: "counter", duration: 22, hitFrames: [8], damage: 5, range: 62, vertRange: 60, knockback: 7, cooldown: 38, minDist: 0, maxDist: 105, minPhase: 2, weight: 6, telegraph: 0.55, shake: 9, hitPause: 3, shout: "COPE!" },
];

const RUGGER: BossMove[] = [
  { id: "rug_yank", name: "Rug Yank", anim: "punch", martial: "straight", duration: 14, hitFrames: [9], damage: 4, range: 55, vertRange: 60, knockback: 4, cooldown: 24, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2, chainTo: ["rug_sweep"], chainChance: 0.45 },
  { id: "rug_sweep", name: "Carpet Sweep", anim: "kick", martial: "sweep", duration: 20, hitFrames: [14, 7], damage: 3, range: 70, vertRange: 45, knockback: 5, cooldown: 32, minDist: 0, maxDist: 120, minPhase: 1, weight: 8, shake: 8, hitPause: 2 },
  { id: "rug_slam", name: "Liquidity Slam", anim: "boss_slam", martial: "slam", duration: 25, hitFrames: [12], damage: 6, range: 105, vertRange: 75, knockback: 6, launch: -8, omni: true, cooldown: 44, minDist: 0, maxDist: 130, minPhase: 1, weight: 7, telegraph: 0.45, hop: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 RUG SLAM!" },
  { id: "rug_dash", name: "Rug Pull Dash", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [16, 8], damage: 4, range: 60, vertRange: 60, knockback: 9, cooldown: 48, minDist: 160, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "rug_spray", name: "Token Spray", anim: "boss_throw", martial: "throw", duration: 26, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 46, minDist: 130, maxDist: 900, minPhase: 1, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, count: 3, speed: 6.5, vy: -2, spread: 2.2 }] },
  { id: "rug_finale", name: "Total Rug", anim: "boss_slam", martial: "spin", duration: 36, hitFrames: [26, 12], damage: 6, range: 140, vertRange: 100, knockback: 8, launch: -8, omni: true, cooldown: 60, minDist: 0, maxDist: 160, minPhase: 3, weight: 7, telegraph: 0.4, shake: 15, hitPause: 5, sfx: "slam", shout: "\u2620 TOTAL RUG!" },
  { id: "rug_slip", name: "Slippage Slip", anim: "boss_charge", martial: "dodge", duration: 18, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 34, minDist: 0, maxDist: 110, minPhase: 2, weight: 5, advance: -2.8, advanceUntil: 4, shake: 0, hitPause: 0, shout: "SLIP" },
];

const BAD_ACTOR: BossMove[] = [
  { id: "ba_jab", name: "Shill Jab", anim: "punch", martial: "jab", duration: 13, hitFrames: [9], damage: 4, range: 55, vertRange: 60, knockback: 4, cooldown: 22, minDist: 0, maxDist: 90, minPhase: 1, weight: 10, shake: 7, hitPause: 2, chainTo: ["ba_combo"], chainChance: 0.45 },
  { id: "ba_combo", name: "Sucker Combo", anim: "punch", martial: "combo", duration: 30, hitFrames: [24, 16, 8], damage: 3, range: 58, vertRange: 60, knockback: 3, cooldown: 40, minDist: 0, maxDist: 100, minPhase: 1, weight: 8, shake: 8, hitPause: 2, shout: "COMBO!" },
  { id: "ba_insider", name: "Insider Slam", anim: "boss_slam", martial: "slam", duration: 25, hitFrames: [12], damage: 6, range: 100, vertRange: 80, knockback: 6, launch: -8, omni: true, cooldown: 44, minDist: 0, maxDist: 125, minPhase: 1, weight: 7, telegraph: 0.45, hop: 7, shake: 13, hitPause: 4, sfx: "slam", shout: "💀 INSIDER!" },
  { id: "ba_fakenews", name: "Fake News Volley", anim: "boss_throw", martial: "throw", duration: 24, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 42, minDist: 120, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, speed: 9, vy: -1 }, { frame: 8, speed: 9, vy: -3 }] },
  { id: "ba_scam", name: "Scam Charge", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [10], damage: 5, range: 60, vertRange: 60, knockback: 10, cooldown: 50, minDist: 180, maxDist: 900, minPhase: 2, weight: 8, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 10, hitPause: 2, sfx: "charge" },
  { id: "ba_fade", name: "Fade Step", anim: "boss_charge", martial: "dodge", duration: 18, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 34, minDist: 0, maxDist: 110, minPhase: 2, weight: 5, advance: -3.2, advanceUntil: 4, shake: 0, hitPause: 0, shout: "FADE" },
  { id: "ba_honeypot", name: "Honeypot Counter", anim: "kick", martial: "counter", duration: 24, hitFrames: [9], damage: 6, range: 66, vertRange: 65, knockback: 8, cooldown: 42, minDist: 0, maxDist: 110, minPhase: 2, weight: 6, telegraph: 0.55, shake: 10, hitPause: 3, shout: "HONEYPOT!" },
];

// FUDDER — sumo-style palm-slap boss. Close range, heavy, readable wind-ups,
// slower than the other bosses but hits hard and knocks the player far.
const FUDDER: BossMove[] = [
  { id: "fud_palm", name: "FUD Palm Slap", anim: "punch", martial: "jab", duration: 20, hitFrames: [8], damage: 6, range: 66, vertRange: 62, knockback: 8, cooldown: 26, minDist: 0, maxDist: 100, minPhase: 1, weight: 12, telegraph: 0.4, shake: 10, hitPause: 3, chainTo: ["fud_double"], chainChance: 0.4 },
  { id: "fud_double", name: "Double Palm Slap", anim: "punch", martial: "combo", duration: 34, hitFrames: [22, 9], damage: 5, range: 68, vertRange: 62, knockback: 7, cooldown: 40, minDist: 0, maxDist: 105, minPhase: 1, weight: 9, telegraph: 0.3, shake: 11, hitPause: 3, shout: "DOUBLE SLAP!" },
  { id: "fud_bump", name: "Heavy Body Bump", anim: "boss_slam", martial: "slam", duration: 28, hitFrames: [12], damage: 8, range: 78, vertRange: 80, knockback: 13, launch: -6, omni: true, cooldown: 46, minDist: 0, maxDist: 90, minPhase: 1, weight: 8, telegraph: 0.5, hop: 5, shake: 15, hitPause: 5, sfx: "slam", shout: "💥 BODY BUMP!" },
  { id: "fud_charge", name: "Sumo Charge", anim: "boss_charge", martial: "lunge", duration: 34, hitFrames: [18, 9], damage: 6, range: 70, vertRange: 62, knockback: 14, cooldown: 54, minDist: 150, maxDist: 900, minPhase: 1, weight: 10, advance: 0.9, advanceUntil: 6, telegraph: 0.35, shake: 12, hitPause: 3, sfx: "charge", shout: "SUMO CHARGE!" },
  { id: "fud_sweep", name: "Wide Palm Sweep", anim: "kick", martial: "sweep", duration: 26, hitFrames: [16, 8], damage: 5, range: 88, vertRange: 70, knockback: 9, omni: true, cooldown: 42, minDist: 0, maxDist: 120, minPhase: 2, weight: 8, telegraph: 0.35, shake: 11, hitPause: 3 },
  { id: "fud_quake", name: "Belly Quake", anim: "boss_slam", martial: "spin", duration: 38, hitFrames: [16], damage: 9, range: 150, vertRange: 110, knockback: 12, launch: -6, omni: true, cooldown: 66, minDist: 0, maxDist: 170, minPhase: 3, weight: 7, telegraph: 0.5, shake: 16, hitPause: 5, sfx: "slam", shout: "☠ BELLY QUAKE!" },
  { id: "fud_wave", name: "FUD Wave", anim: "boss_throw", martial: "throw", duration: 30, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 52, minDist: 120, maxDist: 900, minPhase: 1, weight: 7, telegraph: 0.35, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 18, count: 2, speed: 7, vy: -3, spread: 2.4 }], shout: "FUD WAVE!" },
  { id: "fud_shuffle", name: "Sumo Shuffle", anim: "boss_charge", martial: "dodge", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 38, minDist: 0, maxDist: 110, minPhase: 2, weight: 4, advance: -2.2, advanceUntil: 4, shake: 0, hitPause: 0, shout: "HMPH" },
];


const EXIT_LIQUIDITY: BossMove[] = [
  { id: "el_drain", name: "Drain Punch", anim: "punch", martial: "straight", duration: 14, hitFrames: [9], damage: 5, range: 56, vertRange: 60, knockback: 4, cooldown: 22, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2, chainTo: ["el_sweep"], chainChance: 0.45 },
  { id: "el_sweep", name: "Bagholder Sweep", anim: "kick", martial: "sweep", duration: 20, hitFrames: [14, 7], damage: 4, range: 72, vertRange: 50, knockback: 6, cooldown: 30, minDist: 0, maxDist: 120, minPhase: 1, weight: 8, shake: 8, hitPause: 2 },
  { id: "el_slam", name: "Liquidity Crush", anim: "boss_slam", martial: "slam", duration: 26, hitFrames: [12], damage: 7, range: 115, vertRange: 85, knockback: 7, launch: -9, omni: true, cooldown: 44, minDist: 0, maxDist: 140, minPhase: 1, weight: 8, telegraph: 0.45, hop: 8, shake: 14, hitPause: 4, sfx: "slam", shout: "💀 CRUSH!" },
  { id: "el_bags", name: "Bag Toss", anim: "boss_throw", martial: "throw", duration: 24, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 40, minDist: 120, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 16, count: 2, speed: 7.5, vy: -3, spread: 2.5 }] },
  { id: "el_dash", name: "Exit Dash", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [10], damage: 6, range: 62, vertRange: 60, knockback: 11, cooldown: 48, minDist: 170, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 11, hitPause: 3, sfx: "charge" },
  { id: "el_double", name: "Double Dip", anim: "boss_slam", martial: "combo", duration: 40, hitFrames: [28, 12], damage: 5, range: 120, vertRange: 90, knockback: 6, launch: -7, omni: true, cooldown: 60, minDist: 0, maxDist: 150, minPhase: 3, weight: 7, telegraph: 0.35, shake: 14, hitPause: 4, sfx: "slam", shout: "☠ DOUBLE DIP!" },
  { id: "el_flush", name: "Bagholder Flush", anim: "kick", martial: "flying_kick", duration: 26, hitFrames: [12], damage: 6, range: 74, vertRange: 92, knockback: 10, launch: -5, cooldown: 48, minDist: 70, maxDist: 230, minPhase: 2, weight: 7, advance: 1.4, advanceUntil: 8, hop: 10, telegraph: 0.35, shake: 12, hitPause: 3, sfx: "charge", shout: "FLUSH!" },
];

const MR_MARKETER: BossMove[] = [
  { id: "mm_mic", name: "Mic Drop", anim: "punch", martial: "jab", duration: 14, hitFrames: [9], damage: 5, range: 56, vertRange: 60, knockback: 4, cooldown: 20, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 7, hitPause: 2, chainTo: ["mm_hype"], chainChance: 0.45 },
  { id: "mm_hype", name: "Hype Kick", anim: "kick", martial: "roundhouse", duration: 17, hitFrames: [11], damage: 6, range: 64, vertRange: 60, knockback: 6, cooldown: 26, minDist: 0, maxDist: 115, minPhase: 1, weight: 9, shake: 8, hitPause: 2 },
  { id: "mm_board", name: "Billboard Slam", anim: "boss_slam", martial: "slam", duration: 26, hitFrames: [12], damage: 7, range: 115, vertRange: 90, knockback: 7, launch: -9, omni: true, cooldown: 42, minDist: 0, maxDist: 140, minPhase: 1, weight: 8, telegraph: 0.45, hop: 8, shake: 14, hitPause: 4, sfx: "slam", shout: "💀 BILLBOARD!" },
  { id: "mm_spam", name: "Ad Spam", anim: "boss_throw", martial: "throw", duration: 28, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 44, minDist: 110, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 18, count: 4, speed: 7, vy: -2, spread: 3 }] },
  { id: "mm_viral", name: "Viral Charge", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [16, 8], damage: 6, range: 62, vertRange: 60, knockback: 11, cooldown: 46, minDist: 170, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 11, hitPause: 3, sfx: "charge" },
  { id: "mm_pump", name: "Pump Storm", anim: "boss_throw", martial: "spin", duration: 40, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 66, minDist: 100, maxDist: 900, minPhase: 3, weight: 7, telegraph: 0.3, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 32, count: 2, speed: 9, vy: -1, spread: 2 }, { frame: 22, count: 2, speed: 9, vy: -3, spread: 2 }, { frame: 12, count: 2, speed: 9, vy: -5, spread: 2 }], shout: "☠ PUMP STORM!" },
  { id: "mm_spin", name: "Engagement Spin", anim: "kick", martial: "spin", duration: 28, hitFrames: [20, 10], damage: 4, range: 88, vertRange: 70, knockback: 6, omni: true, cooldown: 40, minDist: 0, maxDist: 120, minPhase: 2, weight: 7, shake: 10, hitPause: 3, shout: "SPIN!" },
];

const TICKER_THIEF: BossMove[] = [
  { id: "tt_jab", name: "Ticker Jab", anim: "punch", martial: "jab", duration: 13, hitFrames: [9], damage: 6, range: 58, vertRange: 60, knockback: 5, cooldown: 18, minDist: 0, maxDist: 95, minPhase: 1, weight: 10, shake: 8, hitPause: 2, chainTo: ["tt_combo", "tt_kick"], chainChance: 0.5 },
  { id: "tt_combo", name: "Wick Combo", anim: "punch", martial: "combo", duration: 32, hitFrames: [26, 18, 9], damage: 4, range: 60, vertRange: 60, knockback: 3, cooldown: 38, minDist: 0, maxDist: 105, minPhase: 1, weight: 8, shake: 9, hitPause: 2, shout: "WICK COMBO!" },
  { id: "tt_kick", name: "Delisting Kick", anim: "kick", martial: "roundhouse", duration: 18, hitFrames: [11], damage: 7, range: 68, vertRange: 65, knockback: 7, cooldown: 24, minDist: 0, maxDist: 120, minPhase: 1, weight: 9, shake: 9, hitPause: 3 },
  { id: "tt_slam", name: "Red Candle Slam", anim: "boss_slam", martial: "slam", duration: 26, hitFrames: [12], damage: 8, range: 120, vertRange: 95, knockback: 8, launch: -10, omni: true, cooldown: 40, minDist: 0, maxDist: 145, minPhase: 1, weight: 8, telegraph: 0.45, hop: 8, shake: 15, hitPause: 4, sfx: "slam", shout: "💀 RED CANDLE!" },
  { id: "tt_spike", name: "Chart Spike", anim: "boss_throw", martial: "throw", duration: 20, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 32, minDist: 110, maxDist: 900, minPhase: 1, weight: 9, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 12, speed: 11, vy: 0 }] },
  { id: "tt_barrage", name: "Candle Barrage", anim: "boss_throw", martial: "throw", duration: 36, hitFrames: [], damage: 0, range: 0, vertRange: 0, knockback: 0, cooldown: 56, minDist: 130, maxDist: 900, minPhase: 2, weight: 8, shake: 0, hitPause: 0, sfx: "throw", projectiles: [{ frame: 28, count: 3, speed: 8, vy: -1, spread: 2.5 }, { frame: 14, count: 2, speed: 8, vy: -4, spread: 2.5 }], shout: "BARRAGE!" },
  { id: "tt_steal", name: "Ticker Steal Dash", anim: "boss_charge", martial: "lunge", duration: 30, hitFrames: [18, 9], damage: 6, range: 64, vertRange: 60, knockback: 12, cooldown: 44, minDist: 160, maxDist: 900, minPhase: 1, weight: 9, advance: 1, advanceUntil: 5, telegraph: 0.3, shake: 12, hitPause: 3, sfx: "charge" },
  { id: "tt_crash", name: "Market Crash", anim: "boss_slam", martial: "combo", duration: 42, hitFrames: [30, 14], damage: 7, range: 170, vertRange: 120, knockback: 9, launch: -8, omni: true, cooldown: 70, minDist: 0, maxDist: 190, minPhase: 3, weight: 7, telegraph: 0.4, hop: 9, shake: 16, hitPause: 5, sfx: "slam", shout: "☠ MARKET CRASH!" },
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

/**
 * Roll a combo follow-up for a move that just finished. Returns the chained
 * move (already validated as belonging to the same boss) or null. Chains are
 * always optional — the normal cooldown path runs when this returns null, so
 * a boss can never depend on a chain to keep acting.
 */
export function rollChain(
  bossName: string | undefined,
  move: BossMove | null,
  rng: () => number = Math.random,
): BossMove | null {
  if (!move?.chainTo?.length) return null;
  if (rng() > (move.chainChance ?? 0.35)) return null;
  const id = move.chainTo[Math.floor(rng() * move.chainTo.length)] ?? move.chainTo[0];
  return getMoveById(bossName, id);
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
