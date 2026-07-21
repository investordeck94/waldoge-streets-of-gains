/**
 * GameState — central, strongly-typed shape for all persistent and
 * cross-system game data. Add new fields here first; downstream systems
 * (store, persistence, hooks) will pick them up automatically as long
 * as `initialGameState()` provides a default.
 *
 * Design rules:
 * - This file is UI-agnostic and engine-agnostic.
 * - No React, no Canvas, no DOM types here.
 * - Every field must have a serializable default (JSON-safe).
 * - Do NOT put transient/per-frame gameplay data here (that stays in refs
 *   inside the game loop). This module holds authoritative meta-state
 *   that survives across levels, sessions and future features.
 */

import type { Difficulty } from "@/game/config";
import type { StyleName } from "@/lib/fightStyles";

/** Runtime UI mode driven by the React shell around the game canvas. */
export type GameMode = "menu" | "playing" | "gameover" | "victory";

/** Which world/biome the player is currently inside. Extend as new
 *  worlds ship (e.g. "sewers", "casino", "moon"). */
export type WorldId =
  | "mall"
  | "park"
  | "dark_doge"
  | "rooftops"
  | "subway"
  | "boss_arena";

/** Live per-run player stats. Reset on new run; snapshotted into saves. */
export interface PlayerStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  comboCount: number;
  comboName: string;
  style: StyleName;
  /** Total damage dealt in the current run (for future scoring/quests). */
  damageDealt: number;
  /** Total enemies defeated in the current run. */
  kills: number;
  /** Bosses defeated across all runs (cumulative meta stat). */
  bossesDefeated: number;
}

/** Progression: current run position within the world roster. */
export interface Progression {
  world: WorldId;
  /** Zero-based level index within the global LEVELS array. */
  level: number;
  /** Wave counter within the current level. */
  wave: number;
  /** Highest level index ever reached (meta progression). */
  highestLevel: number;
  difficulty: Difficulty;
}

/** In-run currency and long-term progression currency.
 *  `score` is the classic arcade score (session).
 *  `coins` are collected pickups (session, spent at shops).
 *  `bank` is meta-currency that persists across runs. */
export interface Wallet {
  score: number;
  coins: number;
  bank: number;
}

/** XP + level curve for the meta player profile (separate from
 *  gameplay level index). Future: unlock trees, prestige. */
export interface Experience {
  xp: number;
  xpToNext: number;
  profileLevel: number;
  totalXpEarned: number;
}

/** A single inventory entry. Stackable via `qty`. */
export interface InventoryItem {
  id: string;
  qty: number;
  /** Free-form metadata for future item systems (rarity, rolls, etc.). */
  meta?: Record<string, unknown>;
}

export interface Inventory {
  items: InventoryItem[];
  /** Soft cap; enforcement is up to future inventory UI. */
  capacity: number;
}

/** Slots for currently equipped upgrades. Slot ids are open-ended so
 *  new equipment categories can be added without a schema migration. */
export interface EquippedUpgrades {
  slots: Record<string, string | null>;
  /** Passive modifier stack applied on run start. Future systems can
   *  compute derived stats from this list. */
  passives: string[];
}

export type QuestStatus = "active" | "completed" | "failed";

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  /** Arbitrary progress counter (e.g. kills, coins collected). */
  progress: number;
  goal: number;
  /** Optional world scope; if set the quest is only tracked there. */
  world?: WorldId;
  /** Reward payload applied on completion. Handler lives in future
   *  quest engine — GameState just stores the intent. */
  reward?: {
    xp?: number;
    coins?: number;
    items?: InventoryItem[];
  };
}

/** Save-file metadata. Used by persistence layer to migrate old saves. */
export interface SaveMeta {
  /** Bump when GameState shape changes in a non-backwards-compatible way. */
  version: number;
  /** ISO timestamp of last successful save. */
  updatedAt: string;
  /** ISO timestamp of first save (profile creation). */
  createdAt: string;
  /** Free-form label the player can rename (future save slots). */
  slotName: string;
  /** Total playtime accumulated across sessions, in seconds. */
  playtimeSeconds: number;
}

/** The full canonical game state. */
export interface GameState {
  mode: GameMode;
  player: PlayerStats;
  progression: Progression;
  wallet: Wallet;
  experience: Experience;
  inventory: Inventory;
  equipped: EquippedUpgrades;
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  save: SaveMeta;
}
