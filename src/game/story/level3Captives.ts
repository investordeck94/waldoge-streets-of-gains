/**
 * Level 3 captives — SUS Dog and FILF in two SEPARATE cages, each opened by
 * its own key. Pure state machine, no combat data, never in `g.enemies`.
 *
 *   per captive: caged → (interact WITH its key) → opening → freed (once)
 */
export const CAPTIVES_LEVEL = 2;
export const CAPTIVE_OPEN_FRAMES = 70;
export const CAPTIVE_RESCUE_RANGE = 95;
export const CAPTIVE_KEY_PICKUP_RANGE = 48;
export const CAPTIVE_RESCUE_BONUS = 2500;

export type CaptiveId = "sus" | "filf";
export interface CaptiveDef { id: CaptiveId; name: string; cageX: number; keyX: number; color: string }

/** Street-floor spots between the two fights and before Bad Actor's arena. */
export const CAPTIVES: Record<CaptiveId, CaptiveDef> = {
  sus: { id: "sus", name: "SUS DOG", keyX: 3200, cageX: 6600, color: "#ffb347" },
  filf: { id: "filf", name: "FILF", keyX: 9900, cageX: 12200, color: "#ff5fa2" },
};

export interface CaptiveState {
  phase: "caged" | "opening" | "freed";
  timer: number;
  rescued: boolean;
  keyCollected: boolean;
  lockedCooldown: number;
}
export type CaptivesState = Record<CaptiveId, CaptiveState>;

const one = (): CaptiveState => ({ phase: "caged", timer: 0, rescued: false, keyCollected: false, lockedCooldown: 0 });
export const initialCaptivesState = (): CaptivesState => ({ sus: one(), filf: one() });

export function tryCollectCaptiveKey(s: CaptiveState, def: CaptiveDef, px: number, py: number, floorY: number): boolean {
  if (s.keyCollected || s.rescued) return false;
  if (Math.abs(px - def.keyX) > CAPTIVE_KEY_PICKUP_RANGE || py < floorY - 60) return false;
  s.keyCollected = true;
  return true;
}

export const canRescueCaptive = (s: CaptiveState, def: CaptiveDef, px: number, py: number, floorY: number) =>
  s.phase === "caged" && Math.abs(px - def.cageX) <= CAPTIVE_RESCUE_RANGE && py >= floorY - 40;

export function beginCaptiveRescue(s: CaptiveState): boolean {
  if (s.phase !== "caged" || !s.keyCollected) return false;
  s.phase = "opening";
  s.timer = 0;
  return true;
}

/** True exactly once: the frame the captive is freed. */
export function stepCaptive(s: CaptiveState): boolean {
  s.timer++;
  if (s.lockedCooldown > 0) s.lockedCooldown--;
  if (s.phase === "opening" && s.timer >= CAPTIVE_OPEN_FRAMES) {
    s.phase = "freed"; s.timer = 0; s.rescued = true;
    return true;
  }
  return false;
}

export function captivesObjectiveText(s: CaptivesState): string {
  const keys = Number(s.sus.keyCollected) + Number(s.filf.keyCollected);
  const freed = Number(s.sus.rescued) + Number(s.filf.rescued);
  if (freed === 2) return "OBJECTIVE: SUS DOG & FILF RESCUED — FIND BAD ACTOR";
  return `OBJECTIVE: RESCUE SUS DOG & FILF · KEYS ${keys}/2 · FREED ${freed}/2`;
}
