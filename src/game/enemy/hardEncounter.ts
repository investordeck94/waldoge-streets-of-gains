/** Finite encounter queue used only by Level 7 FULL TRENCH MODE. */

export const LEVEL_7_HARD_ACTIVE_CAP = 7;
export const LEVEL_7_HARD_REFILL_BATCH = 2;
export const LEVEL_7_HARD_REFILL_FRAMES = 24;

export interface EncounterEnemy {
  hp: number;
  state: string;
}

export interface Level7HardEncounter<T extends EncounterEnemy> {
  readonly level: 6;
  readonly wave: number;
  queue: T[];
  refillTimer: number;
  readonly authoredTotal: number;
  /** Fighters moved into the active encounter (opening slice + refills). Never exceeds authoredTotal. */
  spawned: number;
}

export interface Level7HardWave<T extends EncounterEnemy> {
  active: T[];
  encounter: Level7HardEncounter<T>;
}

export function shouldUseLevel7HardEncounter(level: number, difficulty: string): boolean {
  return level === 6 && difficulty === "blackMonday";
}

export function isLivingEncounterEnemy(enemy: EncounterEnemy): boolean {
  return enemy.hp > 0 && enemy.state !== "dead";
}

/** Build one finite roster and expose only the opening active slice. */
export function beginLevel7HardWave<T extends EncounterEnemy>(roster: T[], wave: number): Level7HardWave<T> {
  // Identity de-duplication prevents the same instance from occupying both the
  // active list and queue if a caller accidentally supplies it twice.
  const finiteRoster = [...new Set(roster)];
  const active = finiteRoster.slice(0, LEVEL_7_HARD_ACTIVE_CAP);
  return {
    active,
    encounter: {
      level: 6,
      wave,
      queue: finiteRoster.slice(LEVEL_7_HARD_ACTIVE_CAP),
      refillTimer: 0,
      authoredTotal: finiteRoster.length,
      spawned: active.length,
    },
  };
}

/**
 * Refill freed living capacity from the finite queue. Dead bodies may remain
 * for their defeat animation, but never consume capacity.
 */
export function stepLevel7HardWave<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): number {
  encounter.refillTimer = Math.max(0, encounter.refillTimer - 1);
  if (encounter.refillTimer > 0 || encounter.queue.length === 0) return 0;

  const living = active.filter(isLivingEncounterEnemy).length;
  const capacity = Math.max(0, LEVEL_7_HARD_ACTIVE_CAP - living);
  const amount = Math.min(capacity, LEVEL_7_HARD_REFILL_BATCH, encounter.queue.length);
  if (amount === 0) return 0;

  active.push(...encounter.queue.splice(0, amount));
  encounter.spawned += amount;
  encounter.refillTimer = LEVEL_7_HARD_REFILL_FRAMES;
  return amount;
}

/** The sole Hard-wave completion rule: no living active or queued fighters. */
export function isLevel7HardWaveComplete<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): boolean {
  return encounter.queue.length === 0 && active.every((enemy) => !isLivingEncounterEnemy(enemy));
}

export interface Level7HardProgress {
  wave: number;
  authored: number;
  spawned: number;
  living: number;
  killed: number;
  queued: number;
  /** Fighters still to beat this wave: living active + queued. 0 ⇒ wave complete. */
  remaining: number;
}

/** Read-only snapshot used by the HUD counter and the on-device trace overlay. */
export function level7HardProgress<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): Level7HardProgress {
  const living = active.filter(isLivingEncounterEnemy).length;
  const queued = encounter.queue.length;
  return {
    wave: encounter.wave,
    authored: encounter.authoredTotal,
    spawned: encounter.spawned,
    living,
    killed: encounter.spawned - living,
    queued,
    remaining: living + queued,
  };
}

// ---------------------------------------------------------------------------
// Engagement slots — Level 7 FULL TRENCH MODE only.
// The active cap bounds how many fighters exist; engagement bounds how many
// may press Waldoge at once. Without it every live Candle Minion converges on
// the same 50-unit strike distance and the capped group still stacks into a
// single overlapping wall. Waiting fighters hold a staggered stand-off ring
// and rotate in as engaged fighters fall. HP, damage, speed and cooldowns are
// untouched; Cat Guards keep their own navigation and are never assigned.
// ---------------------------------------------------------------------------

export const LEVEL_7_HARD_ENGAGED_MAX = 2;
export const LEVEL_7_HARD_HOLD_BASE = 150;
export const LEVEL_7_HARD_HOLD_STEP = 72;
/** Same-surface tolerance: fighters on another deck keep normal navigation. */
export const LEVEL_7_HARD_SAME_SURFACE_Y = 30;

export interface EngagementFighter extends EncounterEnemy {
  x: number;
  y: number;
  isBoss?: boolean;
  climbing?: boolean;
}

/**
 * Deterministic per-frame assignment. Returns a map from waiting fighter to
 * its stand-off distance from Waldoge; fighters absent from the map (engaged,
 * off-surface, climbing, bosses, excluded) use their normal AI.
 */
export function assignLevel7HardEngagement<T extends EngagementFighter>(
  fighters: T[],
  player: { x: number; y: number },
  exclude: (fighter: T) => boolean = () => false,
): Map<T, number> {
  const holds = new Map<T, number>();
  const eligible = fighters
    .filter((f) => isLivingEncounterEnemy(f) && !f.isBoss && !f.climbing && !exclude(f)
      && Math.abs(f.y - player.y) <= LEVEL_7_HARD_SAME_SURFACE_Y)
    .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x) || a.x - b.x);
  const waiting = eligible.slice(LEVEL_7_HARD_ENGAGED_MAX);
  const rank = { left: 0, right: 0 };
  for (const f of waiting) {
    const side = f.x < player.x ? "left" : "right";
    holds.set(f, LEVEL_7_HARD_HOLD_BASE + rank[side] * LEVEL_7_HARD_HOLD_STEP);
    rank[side] += 1;
  }
  return holds;
}
