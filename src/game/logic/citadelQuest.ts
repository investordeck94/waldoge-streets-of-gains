/** Pure Level 7 key → cage → rescue state transitions. */
export interface CitadelQuestState {
  keyAvailable: boolean;
  keyTaken: boolean;
  rescued: boolean;
}

export const initialCitadelQuest = (): CitadelQuestState => ({
  keyAvailable: false,
  keyTaken: false,
  rescued: false,
});

export function unlockCitadelKey(state: CitadelQuestState, clearedWave: number, keyGuardWave: number): void {
  if (clearedWave > keyGuardWave) state.keyAvailable = true;
}

export function collectCitadelKey(
  state: CitadelQuestState,
  player: { x: number; y: number },
  key: { x: number; y: number },
): boolean {
  if (!state.keyAvailable || state.keyTaken) return false;
  if (Math.abs(player.x - key.x) >= 46 || Math.abs(player.y - key.y) >= 54) return false;
  state.keyTaken = true;
  return true;
}

export function rescueAnon(
  state: CitadelQuestState,
  player: { x: number; y: number },
  cage: { x: number; y: number },
): boolean {
  if (!state.keyTaken || state.rescued) return false;
  if (Math.abs(player.x - cage.x) >= 72 || Math.abs(player.y - cage.y) >= 48) return false;
  state.rescued = true;
  return true;
}