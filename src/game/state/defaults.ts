/**
 * Default GameState factory. Every field defined in `types.ts` must
 * have a default here so the store, persistence layer and hooks
 * never encounter `undefined`.
 */

import type { GameState } from "./types";

/** Bump when the GameState shape changes in a breaking way and add
 *  a migration in `persist.ts`. */
export const GAME_STATE_VERSION = 1;

export function initialGameState(): GameState {
  const now = new Date().toISOString();
  return {
    mode: "menu",
    player: {
      hp: 100,
      maxHp: 100,
      energy: 0,
      maxEnergy: 100,
      comboCount: 0,
      comboName: "",
      style: "brawler",
      damageDealt: 0,
      kills: 0,
      bossesDefeated: 0,
    },
    progression: {
      world: "mall",
      level: 0,
      wave: 0,
      highestLevel: 0,
      difficulty: "normal",
    },
    wallet: {
      score: 0,
      coins: 0,
      bank: 0,
    },
    experience: {
      xp: 0,
      xpToNext: 100,
      profileLevel: 1,
      totalXpEarned: 0,
    },
    inventory: {
      items: [],
      capacity: 32,
    },
    equipped: {
      slots: {
        weapon: null,
        head: null,
        body: null,
        trinket: null,
      },
      passives: [],
    },
    quests: {
      active: [],
      completed: [],
    },
    save: {
      version: GAME_STATE_VERSION,
      updatedAt: now,
      createdAt: now,
      slotName: "default",
      playtimeSeconds: 0,
    },
  };
}
