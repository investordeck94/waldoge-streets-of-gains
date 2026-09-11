/**
 * Combat tunables: input buffer windows and the special-attack table.
 *
 * Per-style move data (jab/heavy/special frame data, hitstun, knockback)
 * lives in `src/lib/fightMoves.ts` — do not duplicate it here.
 * Per-style multipliers (speed/damage/stamina) live in `src/lib/fightStyles.ts`.
 */

export interface SpecialAttackStats {
  /** Total state-timer duration in frames. */
  frames: number;
  /** Reach in world units. */
  range: number;
  /** Base damage before style / boost multipliers. */
  dmg: number;
  /** Horizontal knockback applied to the target. */
  knockback: number;
  /** Special-energy cost to trigger. */
  energyCost: number;
}

/** Frames the input buffer waits between combo inputs. */
export const COMBO_WINDOW = 40;

/** Frames a combo streak stays alive between successful hits. */
export const COMBO_HIT_WINDOW = 40;

/**
 * Hard ceiling for the impact freeze, in frames. Simulation is fully paused
 * while hit-pause runs, so an out-of-range value (bad data, future move) must
 * never be able to stall the game.
 */
export const MAX_HIT_PAUSE = 10;

/**
 * Absolute ceilings on live entity arrays. Volleys and summons are already
 * bounded by their own cooldowns and caps; these are the last line of defence
 * against unbounded growth (and the frame-time collapse that follows) if any
 * future move or chain spawns faster than things expire.
 */
export const MAX_LIVE_PROJECTILES = 48;
export const MAX_LIVE_ENEMIES = 28;




/**
 * Named special attacks unlocked via input sequences (see COMBOS in the
 * game component). Values match the pre-refactor inline table exactly.
 */
export const SPECIAL_ATTACKS: Record<string, SpecialAttackStats> = {
  uppercut:    { frames: 18, range: 50, dmg: 30, knockback: 8,  energyCost: 25 },
  spinkick:    { frames: 20, range: 65, dmg: 25, knockback: 6,  energyCost: 20 },
  dashpunch:   { frames: 14, range: 70, dmg: 22, knockback: 12, energyCost: 20 },
  groundpound: { frames: 22, range: 80, dmg: 40, knockback: 10, energyCost: 40 },
};
