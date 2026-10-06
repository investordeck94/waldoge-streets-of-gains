/**
 * Doxx Lucky Dip (Levels 3–7) + 420 Blaze It handover + equipment damage rules.
 * Pure logic; never touches score. Coins via coinWallet, items via inventory.
 */
import { getCoins, spendCoins } from "@/game/collectibles/coinWallet";
import { addItem, type ItemId } from "./inventory";

export const LUCKY_DIP_COST = 300;
export const LUCKY_DIP_REWARDS: readonly ItemId[] = ["dobermann", "sidearm", "gauntlets", "health"];
/** Level index (0-based) → stand world x. Levels 1–2 have none. Near each level start, clear of objectives/boss arenas. */
// Levels 5 and 6 open with a walkway at x 520–1080, so their stall and
// 420 Blaze It sit on the clear street stretch between the walkways instead.
export const LUCKY_DIP_STANDS: Record<number, number> = { 2: 470, 3: 470, 4: 470, 5: 1850, 6: 1850 };
export const INTERACT_RANGE = 70;

const PENDING_KEY = "sogLuckyDipPending_v1";
let purchasing = false;

/** Atomic: charge exactly 300 and store exactly one reward. A purchase whose
 *  coins were spent but reward not stored (crash mid-way) is completed on next load. */
export function purchaseLuckyDip(rand: () => number = Math.random): ItemId | null {
  if (purchasing || getCoins() < LUCKY_DIP_COST) return null;
  purchasing = true;
  try {
    const reward = LUCKY_DIP_REWARDS[Math.min(3, Math.floor(rand() * 4))];
    try { localStorage.setItem(PENDING_KEY, reward); } catch { /* ignore */ }
    if (!spendCoins(LUCKY_DIP_COST)) { try { localStorage.removeItem(PENDING_KEY); } catch { /* */ } return null; }
    addItem(reward);
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    return reward;
  } finally { purchasing = false; }
}
try {
  const p = typeof localStorage !== "undefined" ? localStorage.getItem(PENDING_KEY) : null;
  // A pending marker means coins may have been spent before reward stored; we can't
  // tell for sure, so only finalise if it names a valid reward (never rerolls).
  if (p && (LUCKY_DIP_REWARDS as readonly string[]).includes(p)) { addItem(p as ItemId); localStorage.removeItem(PENDING_KEY); }
} catch { /* ignore */ }

/** 420 Blaze It is NOT an NPC or shop: he only appears briefly as the
 *  presentation of a Lucky Dip "health" reward. The item itself is stored
 *  atomically by purchaseLuckyDip; the handover adds nothing extra. */
export const BLAZE_HANDOVER_OFFSET_X = 70;
/** Equipment hit rules. Standard enemies: one hit defeats. Bosses / Fat Cats:
 *  double damage, capped at 12% max HP per hit, and never the killing blow from above 12%. */
export function equipmentDamage(base: number, target: { hp: number; maxHp: number; isBoss?: boolean }, isTough: boolean, equipped: ItemId | null): number {
  if (equipped !== "sidearm" && equipped !== "gauntlets") return base;
  if (!target.isBoss && !isTough) return Math.max(base, target.hp);
  return Math.max(base, Math.min(base * 2, Math.round(target.maxHp * 0.12)));
}

export interface DogAlly { x: number; y: number; vx: number; facing: 1 | -1; kills: number; state: "run" | "attack" | "vanish"; timer: number; targetCd: number; frame: number; bossChip: number }
export const DOG_MAX_KILLS = 6;
export const DOG_BOSS_CHIP_TOTAL = 0.08; // at most 8% of boss max HP over his whole visit
