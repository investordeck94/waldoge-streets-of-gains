/**
 * imageResidency.ts — level-scoped picture memory for the Street of Gains.
 *
 * WHY THIS EXISTS
 * Every level module used to start downloading its artwork at import time and
 * keep it forever. By Level 7 the page was holding the painted backgrounds of
 * Levels 1–6, all seven boss atlases and seven 1024² boss-head portraits on
 * top of Level 7's own characters — well over 170 MB of decoded pictures on
 * the local copies alone. Mobile browsers answer that pressure by throwing
 * away decoded image data mid-fight and re-decoding it later; while a sheet is
 * being re-decoded, drawImage silently paints nothing. Because Waldoge and
 * Ticker Taker are both atlas sprites, they vanished together for about a
 * second while the vector scenery kept rendering.
 *
 * WHAT IT DOES (presentation only — never touches gameplay state)
 *   1. Each tracked image declares the level indices that actually draw it
 *      (or "always"). When the active level changes, images outside that
 *      scope are released (their pixels are swapped for a 1×1 blank so the
 *      browser frees the decoded bitmap) and in-scope images are (re)loaded.
 *   2. "Pinned" images — Waldoge, Ticker Taker and Level 7's other on-screen
 *      characters — are additionally converted into an ImageBitmap once
 *      loaded. An ImageBitmap is a fully decoded copy that the browser does
 *      not evict from its decoded-image cache, so the sprite never has to be
 *      re-decoded mid-fight. The HTMLImageElement stays as the fallback.
 *
 * The same source files, frame rectangles and draw sizes are used, so the
 * artwork on screen is pixel-identical.
 */

export type ImageScope = "always" | readonly number[];

export interface ResidencyOptions {
  /** Keep a fully decoded ImageBitmap copy while in scope. */
  pin?: boolean;
  /** Initial per-image gate; see setImageWanted. Defaults to true. */
  wanted?: boolean;
}

interface ResidencyRecord {
  img: HTMLImageElement;
  src: string;
  scope: ImageScope;
  pin: boolean;
  resident: boolean;
  /** Extra per-image gate (e.g. only nearby Level 7 backdrops). */
  wanted: boolean;
  bitmap: ImageBitmap | null;
  /** Bumped on every acquire/release so stale bitmap promises are dropped. */
  generation: number;
}

/** 1×1 transparent GIF — replacing a big source with this frees its pixels. */
export const BLANK_IMAGE_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const records = new Map<HTMLImageElement, ResidencyRecord>();
/**
 * Active level index. `null` before a run starts; at that point Level 1's
 * artwork is prefetched so the first level opens exactly as before.
 */
let activeLevel: number | null = null;

function inScope(scope: ImageScope, level: number | null): boolean {
  if (scope === "always") return true;
  return scope.includes(level ?? 0);
}

function dropBitmap(rec: ResidencyRecord) {
  if (rec.bitmap) {
    try { rec.bitmap.close(); } catch { /* already closed */ }
    rec.bitmap = null;
  }
}

function pinBitmap(rec: ResidencyRecord) {
  if (!rec.pin || typeof createImageBitmap !== "function") return;
  const gen = rec.generation;
  createImageBitmap(rec.img).then(
    (bitmap) => {
      if (!rec.resident || rec.generation !== gen) { bitmap.close(); return; }
      dropBitmap(rec);
      rec.bitmap = bitmap;
    },
    () => { /* keep drawing from the HTMLImageElement */ },
  );
}

function acquire(rec: ResidencyRecord) {
  if (rec.resident) return;
  rec.resident = true;
  rec.generation++;
  rec.img.src = rec.src;
}

function release(rec: ResidencyRecord) {
  if (!rec.resident) return;
  rec.resident = false;
  rec.generation++;
  dropBitmap(rec);
  rec.img.src = BLANK_IMAGE_SRC;
}

/**
 * Registers `img` (with its onload/onerror already attached) and assigns its
 * real source only while the active level needs it. Use in place of
 * `img.src = src`. The module's own onload/onerror only ever fire for the
 * real artwork, never for the blank placeholder.
 */
export function residentImage(
  img: HTMLImageElement,
  src: string,
  scope: ImageScope,
  options: ResidencyOptions = {},
): HTMLImageElement {
  const rec: ResidencyRecord = {
    img, src, scope, pin: !!options.pin, resident: false, wanted: options.wanted ?? true, bitmap: null, generation: 0,
  };
  const userLoad = img.onload;
  const userError = img.onerror;
  img.onload = function (this: GlobalEventHandlers, ev: Event) {
    if (!rec.resident) return;
    pinBitmap(rec);
    return userLoad?.call(this, ev);
  };
  img.onerror = function (this: GlobalEventHandlers, ...args: Parameters<OnErrorEventHandlerNonNull>) {
    if (!rec.resident) return;
    return userError?.apply(this, args);
  } as OnErrorEventHandler;
  records.set(img, rec);
  if (rec.wanted && inScope(scope, activeLevel)) acquire(rec);
  return img;
}

/** True while `img` holds its real artwork (not released for another level). */
export function isResident(img: HTMLImageElement | null | undefined): boolean {
  if (!img) return false;
  const rec = records.get(img);
  return rec ? rec.resident : true;
}

/**
 * The best source to draw from: the pinned decoded bitmap when available,
 * otherwise the image element itself.
 */
export function drawSource(img: HTMLImageElement): CanvasImageSource {
  const rec = records.get(img);
  return rec?.resident && rec.bitmap ? rec.bitmap : img;
}

/**
 * Called once per frame with the current level index. A no-op unless the
 * level changed; then releases every out-of-scope image and loads the
 * in-scope ones.
 */
export function setResidentLevel(level: number): void {
  if (!Number.isFinite(level) || level === activeLevel) return;
  activeLevel = level;
  for (const rec of records.values()) {
    if (rec.wanted && inScope(rec.scope, level)) acquire(rec);
    else release(rec);
  }
}

/**
 * Finer-grained gate inside a level: an unwanted image is released even when
 * its level is active. Used to keep only the Level 7 backdrops near the
 * camera decoded.
 */
export function setImageWanted(img: HTMLImageElement | null | undefined, wanted: boolean): void {
  if (!img) return;
  const rec = records.get(img);
  if (!rec || rec.wanted === wanted) return;
  rec.wanted = wanted;
  if (wanted && inScope(rec.scope, activeLevel)) acquire(rec);
  else if (!wanted) release(rec);
}

/** Diagnostics / tests. */
export function residencySnapshot() {
  return {
    activeLevel,
    tracked: records.size,
    resident: [...records.values()].filter((r) => r.resident).map((r) => r.src),
    pinned: [...records.values()].filter((r) => r.bitmap).map((r) => r.src),
  };
}

/** Test helper — forget every tracked image and the active level. */
export function resetResidencyForTests(): void {
  records.clear();
  activeLevel = null;
}
