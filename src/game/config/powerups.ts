/**
 * Powerup drop chance + cosmetic maps (color / icon).
 *
 * The effect values themselves (heal amount, boost duration) are still applied
 * inline in the game-loop pickup handler; splitting those requires a
 * behavior-safe pass and is deferred.
 */

export type PowerUpType = "health" | "speed" | "energy" | "damage";

/** Probability a regular enemy drops a powerup on death. */
export const DROP_CHANCE = 0.5;

export const POWERUP_COLORS: Record<PowerUpType, string> = {
  health: "#00ff00",
  speed:  "#00ccff",
  energy: "#ffcc00",
  damage: "#ff4444",
};

export const POWERUP_ICONS: Record<PowerUpType, string> = {
  health: "❤️",
  speed:  "⚡",
  energy: "🔋",
  damage: "💥",
};
