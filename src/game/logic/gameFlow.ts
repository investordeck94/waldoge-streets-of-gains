import type { Difficulty } from "@/game/config";

/** Zero-based level to load after a defeat. Hard mode always resets the run. */
export function retryLevelFor(difficulty: Difficulty, defeatedLevel: number): number {
  if (difficulty === "blackMonday") return 0;
  return Math.max(0, Math.floor(Number.isFinite(defeatedLevel) ? defeatedLevel : 0));
}

export function retryButtonLabel(difficulty: Difficulty, defeatedLevel: number): string {
  const retryLevel = retryLevelFor(difficulty, defeatedLevel);
  return difficulty === "blackMonday"
    ? "RESTART RUN FROM LEVEL 1"
    : `RETRY LEVEL ${retryLevel + 1}`;
}