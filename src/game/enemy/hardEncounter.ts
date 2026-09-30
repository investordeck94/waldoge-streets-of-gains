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
  return {
    active: finiteRoster.slice(0, LEVEL_7_HARD_ACTIVE_CAP),
    encounter: {
      level: 6,
      wave,
      queue: finiteRoster.slice(LEVEL_7_HARD_ACTIVE_CAP),
      refillTimer: 0,
      authoredTotal: finiteRoster.length,
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