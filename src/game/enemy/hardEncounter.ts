/** Finite encounter queue used only by Level 7 FULL TRENCH MODE. */

export const LEVEL_7_HARD_ACTIVE_CAP = 10;
export const LEVEL_7_HARD_REFILL_BATCH = 2;
export const LEVEL_7_HARD_REFILL_FRAMES = 24;

export interface EncounterEnemy {
  hp: number;
  state: string;
}

export interface Level7HardEncounter<T extends EncounterEnemy> {
  readonly level: 6;
  readonly wave: number;
  /** Roster entries that have NOT spawned yet. Only ever shrinks. */
  queue: T[];
  refillTimer: number;
  readonly authoredTotal: number;
  /** Fighters moved into the active encounter (opening slice + refills). Never exceeds authoredTotal. */
  spawned: number;
  /** Stable roster identity (1-based) for every authored entry of this wave. */
  readonly rosterIds: Map<T, number>;
  /** Every roster entry that has left the queue. One-way: never re-queued, never re-spawned. */
  readonly released: Set<T>;
  /** Every roster entry observed defeated. One-way: a defeated entry never becomes active again. */
  readonly defeated: Set<T>;
  /** Roster ids in spawn order (opening slice first). Each id appears at most once. */
  readonly spawnLog: number[];
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
  const rosterIds = new Map<T, number>();
  finiteRoster.forEach((fighter, index) => rosterIds.set(fighter, index + 1));
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
      rosterIds,
      released: new Set(active),
      defeated: new Set(),
      spawnLog: active.map((f) => rosterIds.get(f) as number),
    },
  };
}

/** Record every roster entry that is now defeated. Defeat is permanent. */
export function recordLevel7HardDefeats<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): void {
  for (const enemy of active) {
    if (!isLivingEncounterEnemy(enemy) && encounter.rosterIds.has(enemy)) encounter.defeated.add(enemy);
  }
}

/**
 * Refill freed living capacity from the finite queue. Dead bodies may remain
 * for their defeat animation, but never consume capacity. Every spawn consumes
 * exactly one specific, never-before-released queue entry. `place` lets the
 * caller position an arriving fighter (e.g. just off-screen) before it becomes
 * active; it never creates or copies fighters.
 */
export function stepLevel7HardWave<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
  place?: (fighter: T) => void,
): T[] {
  recordLevel7HardDefeats(active, encounter);
  encounter.refillTimer = Math.max(0, encounter.refillTimer - 1);
  if (encounter.refillTimer > 0 || encounter.queue.length === 0) return [];

  const living = active.filter(isLivingEncounterEnemy).length;
  const capacity = Math.max(0, LEVEL_7_HARD_ACTIVE_CAP - living);
  if (capacity === 0) return [];

  const entering: T[] = [];
  while (entering.length < Math.min(capacity, LEVEL_7_HARD_REFILL_BATCH) && encounter.queue.length > 0) {
    const next = encounter.queue.shift() as T;
    // One-way guard: an entry that already left the queue, or was defeated,
    // is discarded rather than spawned a second time.
    if (encounter.released.has(next) || encounter.defeated.has(next) || !isLivingEncounterEnemy(next)) continue;
    encounter.released.add(next);
    encounter.spawnLog.push(encounter.rosterIds.get(next) as number);
    place?.(next);
    entering.push(next);
  }
  if (entering.length === 0) return entering;

  active.push(...entering);
  encounter.spawned += entering.length;
  encounter.refillTimer = LEVEL_7_HARD_REFILL_FRAMES;
  return entering;
}

/** The sole Hard-wave completion rule: no living active or queued fighters. */
export function isLevel7HardWaveComplete<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): boolean {
  return encounter.queue.length === 0 && active.every((enemy) => !isLivingEncounterEnemy(enemy));
}

/** Living fighters in the active list that are not entries of this wave's roster. Must always be 0. */
export function unrosteredLevel7HardFighters<T extends EncounterEnemy>(
  active: T[],
  encounter: Level7HardEncounter<T>,
): number {
  return active.filter((e) => isLivingEncounterEnemy(e) && !encounter.released.has(e)).length;
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

export const LEVEL_7_HARD_ENGAGED_MAX = 3;
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
