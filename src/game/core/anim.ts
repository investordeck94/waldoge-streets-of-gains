/**
 * Animation-clock helpers. These operate on the `stateTimer` field that
 * every Actor already carries (frames since the state was entered).
 *
 * Purpose: give both the current stick-figure renderer and any future
 * skeletal / glTF rig a single way to compute normalized progress through
 * an animation, so switching graphics never desyncs the game logic.
 *
 * Convention: `progress` is in [0, 1] and clamps at 1 for animations that
 * should hold on the last frame, or wraps via `phase` for looping motion.
 */

/** Convert frames-elapsed into [0, 1] progress, clamped. */
export function progressOf(stateTimer: number, durationFrames: number): number {
  if (durationFrames <= 0) return 1;
  const p = stateTimer / durationFrames;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/** Looping phase in [0, 1) — useful for idle/walk cycles. */
export function phaseOf(stateTimer: number, cycleFrames: number): number {
  if (cycleFrames <= 0) return 0;
  const p = (stateTimer % cycleFrames) / cycleFrames;
  return p < 0 ? p + 1 : p;
}

/** Ease-out cubic for punchy attack windups. Pure. */
export function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

/** Ease-in-out sine for camera / smoothing. Pure. */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
