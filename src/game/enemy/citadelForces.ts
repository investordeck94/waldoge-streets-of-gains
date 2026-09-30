/** Level 7 encounter staging. Candle Minions stay the canonical enemy. */
import { GROUND_Y } from "@/game/config/player";
import { landingDecksFor } from "@/game/config/world";

export const CITADEL_LEVEL = 6;
export const CITADEL_KEY_GUARD_WAVE = 3;
export const CITADEL_PRISON_GUARD_WAVE = 4;

interface Placeable {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  state?: string;
  hp?: number;
  climbing?: boolean;
}

const WAVE_DECK_IDS: Record<number, readonly string[]> = {
  0: ["taken-west", "taken-mid", "taken-east"],
  1: ["ticker-west", "ticker-mid-low", "ticker-mid-high", "ticker-east"],
  2: ["copy-west", "copy-scan-low", "copy-scan-high", "copy-east"],
  3: ["key-deck-1", "key-deck-2", "key-deck"],
  4: ["prison-deck-1", "prison-deck-2", "cage-level"],
};

/** Place most fighters on the authored vertical route, leaving a floor guard. */
export function applyCitadelRoster<T extends Placeable>(enemies: T[], level: number, wave: number): T[] {
  if (level !== CITADEL_LEVEL || enemies.length === 0) return enemies;
  const wanted = WAVE_DECK_IDS[wave] ?? [];
  const decks = landingDecksFor(level).filter((deck) => deck.id && wanted.includes(deck.id));
  enemies.forEach((enemy, index) => {
    if (index === 0 || decks.length === 0) {
      enemy.y = GROUND_Y;
      return;
    }
    const deck = decks[(index - 1) % decks.length];
    const lane = 42 + ((index * 83) % Math.max(44, deck.x1 - deck.x0 - 84));
    enemy.x = deck.x0 + lane;
    enemy.y = deck.y;
    enemy.vx = 0;
    enemy.vy = 0;
  });
  return enemies;
}

/** Bring only abandoned off-screen Level 7 fighters forward onto valid routes. */
export function recycleCitadelStragglers<T extends Placeable>(
  enemies: T[], level: number, playerX: number, levelWidth: number, targetX?: number,
): number {
  if (level !== CITADEL_LEVEL) return 0;
  let moved = 0;
  for (const enemy of enemies) {
    if (enemy.state === "dead" || (enemy.hp ?? 1) <= 0 || enemy.climbing) continue;
    // Cat Guards are persistent authored elites. Never teleport them from a
    // deck to the street; their route is resolved through real ladders.
    if ((enemy as Placeable & { variant?: string }).variant === "catBlack"
      || (enemy as Placeable & { variant?: string }).variant === "catOrange") continue;
    if (enemy.x >= playerX - 1200) continue;
    enemy.x = Math.min(levelWidth - 60, targetX ?? playerX + 620);
    enemy.y = GROUND_Y;
    enemy.vx = 0;
    enemy.vy = 0;
    moved += 1;
  }
  return moved;
}