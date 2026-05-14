// Per-style move sets. Light moves chain on repeated J presses (jab → straight → hook),
// heavy moves trigger on K. The chain index resets after CHAIN_RESET_MS of inactivity.
// Timings are in milliseconds; converted to 60fps frames at use-site.

export type MoveType = "light" | "heavy" | "special";

export interface Move {
  name: string;
  damage: number;       // base damage, multiplied by fightStyle.damage and combo multiplier
  knockback: number;    // horizontal impulse on hit
  hitstun: number;      // ms — used for enemy stateTimer and screen shake intensity
  startup: number;      // ms — frames before hit window
  recovery: number;     // ms — total animation length (startup + active + recovery)
  range: number;
}

export type StyleName = "brawler" | "rush" | "muayThai" | "greenCandle";

type StyleMoveSet = {
  light: Move[];
  heavy: Move[];
  special?: Move[];
};

export const MOVE_SETS: Record<StyleName, Required<StyleMoveSet>> = {
  brawler: {
    light: [
      { name: "jab",      damage: 8,  knockback: 2, hitstun: 100, startup: 80,  recovery: 120, range: 45 },
      { name: "straight", damage: 10, knockback: 3, hitstun: 120, startup: 90,  recovery: 130, range: 50 },
      { name: "hook",     damage: 14, knockback: 4, hitstun: 150, startup: 120, recovery: 160, range: 55 },
    ],
    heavy: [
      { name: "uppercut", damage: 22, knockback: 8, hitstun: 250, startup: 200, recovery: 300, range: 55 },
    ],
    special: [
      { name: "haymaker", damage: 32, knockback: 12, hitstun: 350, startup: 250, recovery: 400, range: 60 },
    ],
  },
  rush: {
    light: [
      { name: "quick jab", damage: 5, knockback: 1, hitstun: 60, startup: 40, recovery: 80, range: 40 },
      { name: "flurry",    damage: 6, knockback: 1, hitstun: 70, startup: 50, recovery: 90, range: 40 },
    ],
    heavy: [
      { name: "dash strike", damage: 16, knockback: 5, hitstun: 180, startup: 120, recovery: 180, range: 65 },
    ],
    special: [
      { name: "blitz combo", damage: 24, knockback: 4, hitstun: 220, startup: 100, recovery: 250, range: 70 },
    ],
  },
  muayThai: {
    light: [
      { name: "elbow", damage: 11, knockback: 3, hitstun: 140, startup: 90,  recovery: 120, range: 35 },
      { name: "knee",  damage: 13, knockback: 4, hitstun: 160, startup: 110, recovery: 140, range: 30 },
    ],
    heavy: [
      { name: "roundhouse", damage: 26, knockback: 10, hitstun: 300, startup: 220, recovery: 350, range: 65 },
    ],
    special: [
      { name: "clinch knees", damage: 35, knockback: 6, hitstun: 400, startup: 300, recovery: 400, range: 25 },
    ],
  },
};

// Reset the chained light combo after this many ms of no light input
export const CHAIN_RESET_MS = 1000;

// Convert ms to 60fps frames
export const msToFrames = (ms: number) => Math.max(1, Math.round(ms / 16.667));

export function getMove(style: StyleName, type: MoveType, chainIndex: number): Move | null {
  const styleSet = MOVE_SETS[style] || MOVE_SETS.brawler;
  const set = styleSet[type];
  if (!set || set.length === 0) {
    if (import.meta.env.DEV) console.warn("[fightMoves] No moves found for", style, type);
    return null;
  }
  return set[chainIndex % set.length];
}
