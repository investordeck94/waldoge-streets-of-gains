/**
 * Level roster.
 *
 * Each level plays: 2 minion waves → 1 boss wave. Difficulty scales gradually
 * from level 1 (JEET) to level 7 (TICKER TAKER, the ultimate anti-Waldoge boss).
 *
 * Values are byte-identical to the original StreetBrawler.tsx inline table.
 */

import type { LevelConfig } from "./types";

export const LEVELS: LevelConfig[] = [
  // Level 1 — easy intro boss
  {
    name: "ALLEY ROOKIE",
    theme: "alley",
    waves: [
      { count: 2, hp: 20, speed: 1.0 },
      { count: 3, hp: 25, speed: 1.2 },
    ],
    boss: { hp: 220, chargeSpeed: 4, aiSpeed: 1.2, dmgMult: 0.6, name: "JEET" },
  },
  {
    name: "BACKSTREET BRAWLER",
    theme: "city",
    waves: [
      { count: 3, hp: 30, speed: 1.3 },
      { count: 3, hp: 35, speed: 1.5 },
    ],
    boss: { hp: 300, chargeSpeed: 4.5, aiSpeed: 1.5, dmgMult: 0.75, name: "RUGGER" },
  },
  {
    name: "DOCKSIDE ENFORCER",
    theme: "suburbs",
    waves: [
      { count: 3, hp: 40, speed: 1.5 },
      { count: 4, hp: 45, speed: 1.7 },
    ],
    boss: { hp: 380, chargeSpeed: 5, aiSpeed: 1.8, dmgMult: 0.9, name: "BAD ACTOR" },
  },
  {
    name: "NEON KINGPIN",
    theme: "mall",
    // Level 4 is five authored sections wide (Entrance, Media, Industrial,
    // Factory, Arena). One staged minion wave per non-boss section so no
    // playable stretch of FUDDER TERRITORY is empty of enemies.
    waves: [
      { count: 3, hp: 45, speed: 1.6 }, // Entrance / Propaganda Street
      { count: 4, hp: 50, speed: 1.7 }, // Media District
      { count: 5, hp: 55, speed: 1.8 }, // Industrial Complex (ambush)
      { count: 5, hp: 60, speed: 1.9 }, // Propaganda Factory
    ],

    // FUDDER is a heavy sumo boss: tankier and hits harder, but slower on his
    // feet than the other bosses — his readable wind-ups are the counterplay.
    boss: { hp: 520, chargeSpeed: 5.5, aiSpeed: 1.6, dmgMult: 1.0, name: "FUDDER" },

  },
  {
    name: "ROOFTOP REAPER",
    theme: "park",
    waves: [
      { count: 3, hp: 56, speed: 1.8 }, // Dead Coin Cemetery
      { count: 4, hp: 58, speed: 1.85 }, // Liquidation Street
      { count: 4, hp: 60, speed: 1.9 }, // The Dead Exchange
      { count: 5, hp: 62, speed: 2.0 }, // The Liquidity Vault
      { count: 5, hp: 65, speed: 2.1 }, // Exit Liquidity's Domain
    ],
    boss: { hp: 560, chargeSpeed: 6, aiSpeed: 2.2, dmgMult: 1.15, name: "EXIT LIQUIDITY" },
  },
  {
    name: "UNDERGROUND WARLORD",
    theme: "office",
    // Level 6 is five authored blueprint sections wide, so every section gets
    // its own staged encounter of Candle Minions + Mr. Marketer's Raiding Team.
    waves: [
      { count: 4, hp: 70, speed: 2.1 }, // Advertising Street
      { count: 5, hp: 72, speed: 2.15 }, // Cold Call District
      { count: 5, hp: 75, speed: 2.2 }, // Funnel Factory — KEY GUARD
      { count: 5, hp: 78, speed: 2.25 }, // Manipulation District
      { count: 5, hp: 80, speed: 2.3 }, // Mr. Marketer HQ elite guards
    ],
    boss: { hp: 680, chargeSpeed: 6.5, aiSpeed: 2.5, dmgMult: 1.3, name: "MR MARKETER" },
  },
  // Level 7 — final hardest boss
  {
    name: "THE TAKER'S CITADEL",
    theme: "chart",
    waves: [
      { count: 5, hp: 90, speed: 2.3 },
      { count: 6, hp: 100, speed: 2.5 },
      { count: 6, hp: 102, speed: 2.55 },
      { count: 6, hp: 105, speed: 2.6 },
      { count: 7, hp: 108, speed: 2.65 },
    ],
    boss: { hp: 850, chargeSpeed: 7.5, aiSpeed: 3.0, dmgMult: 1.5, name: "TICKER TAKER" },
  },
];

/** 2 minion waves + 1 boss wave. */
export const WAVES_PER_LEVEL = 3;

export const TOTAL_LEVELS = LEVELS.length;
