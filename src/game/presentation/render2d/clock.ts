/**
 * Shared render clock.
 *
 * Every sprite/VFX module used to call `Date.now()` independently (often several
 * times per draw, per entity, per frame). That is both wasted work and a source
 * of intra-frame inconsistency: two parts of the same character could sample a
 * different millisecond and animate out of phase.
 *
 * The game loop now stamps the clock ONCE per frame with the
 * requestAnimationFrame timestamp; all renderers read `renderNow()`.
 *
 * PURELY PRESENTATIONAL — never used for gameplay timing.
 */

let now = 0;

/** Called once per frame by the game loop with the rAF timestamp. */
export function setRenderClock(t: number): void {
  now = Number.isFinite(t) ? t : now;
}

/** Current frame timestamp in ms. Stable for the whole frame. */
export function renderNow(): number {
  return now;
}

/**
 * Deterministic 0..1 "noise" replacing per-frame `Math.random()` in cosmetic
 * effects. Same seed + same frame = same value, so visuals are reproducible
 * and no RNG runs inside draw calls.
 */
export function flicker(seed: number, speed = 0.02): number {
  const v = Math.sin((now * speed + seed * 12.9898) * 1.13) * 43758.5453;
  return v - Math.floor(v);
}
