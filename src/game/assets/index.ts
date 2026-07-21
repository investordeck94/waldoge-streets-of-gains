/**
 * game/assets/index.ts — canonical asset registry & boss-head preloader.
 *
 * PURPOSE
 * Single source of truth for every static asset the game consumes: music
 * tracks, character/boss sprites, and cover art. Consolidates the seven
 * boss-head `new Image()` preloaders previously scattered at the top of
 * StreetBrawler.tsx.
 *
 * This module was moved out of `src/game/Assets.ts` in Phase 5. The old
 * path (`@/game/Assets`) is preserved as a thin deprecated re-export shim
 * so no runtime behaviour or import-time timing changes.
 *
 * BEHAVIOUR NOTE — byte-identical to the previous inline preloader
 *   • Guarded with `typeof window !== "undefined"` so SSR / Vite dep-graph
 *     traversal never touches `Image`.
 *   • Each image starts loading at module-import time; ES module re-exports
 *     are evaluated eagerly, so the shim path fires the same `new Image()`
 *     calls at the same tick as before.
 *   • `.src` is assigned synchronously; nothing awaits the load.
 *   • First-paint semantics (briefly-null → swap-in) are unchanged; the
 *     boss-draw code already handles it via `if (customHead && customHead.complete)`.
 *
 * WHAT INTENTIONALLY STAYED IN StreetBrawler.tsx
 *   • The `waldogeHead` lazy load — its lifetime is bound to the canvas
 *     mount and its `onload` assigns into a component ref. Moving it here
 *     would change timing relative to component mount.
 *   • The audio track list (`TRACKS`) — per-component so React re-mounts
 *     get fresh Audio elements. Only the URL constants are exposed here.
 */

import waldogeMusicUrl from "@/assets/waldoge-music.mp3";
import waldogeCombatThemeAsset from "@/assets/waldoge-combat-theme.mp3.asset.json";
import waldogeArcadeAsset from "@/assets/waldoge-arcade.mp3.asset.json";
import waldogeHeadUrl from "@/assets/waldoge-head.png";
import streetBrawlerCoverUrl from "@/assets/street-brawler-cover.png";
import jeetBossHead from "@/assets/jeet-boss-head.png";
import badActorBossHead from "@/assets/badactor-boss-head.png";
import ruggerBossHead from "@/assets/rugger-boss-head.png";
import fudderBossHead from "@/assets/boss-fudder-head.png";
import exitLiquidityBossHead from "@/assets/boss-exit-liquidity-head.png";
import mrMarketerBossHead from "@/assets/boss-mr-marketer-head.png";
import tickerThiefBossHead from "@/assets/ticker-thief-head.png";

// ---------------------------------------------------------------------------
// Raw URLs — usable by both the component (for <img>, <audio>) and the
// preloader below.
// ---------------------------------------------------------------------------

export const IMAGE_URLS = {
  waldogeHead: waldogeHeadUrl,
  streetBrawlerCover: streetBrawlerCoverUrl,
  jeetBossHead,
  badActorBossHead,
  ruggerBossHead,
  fudderBossHead,
  exitLiquidityBossHead,
  mrMarketerBossHead,
  tickerThiefBossHead,
} as const;

export const AUDIO_URLS = {
  waldogeMusic: waldogeMusicUrl,
  waldogeCombatTheme: waldogeCombatThemeAsset.url,
  waldogeArcade: waldogeArcadeAsset.url,
} as const;

// ---------------------------------------------------------------------------
// Boss-head preloader. Mirrors the seven inline definitions previously at
// the top of StreetBrawler.tsx (byte-identical: guarded by `typeof window`,
// synchronous `new Image()` + `.src` assignment, no onload/onerror). Kept
// as an inline IIFE so the network request fires at module import.
// ---------------------------------------------------------------------------

function preload(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const i = new Image();
  i.src = src;
  return i;
}

export const BOSS_HEAD_IMAGES = {
  jeet: preload(jeetBossHead),
  badActor: preload(badActorBossHead),
  rugger: preload(ruggerBossHead),
  fudder: preload(fudderBossHead),
  exitLiquidity: preload(exitLiquidityBossHead),
  mrMarketer: preload(mrMarketerBossHead),
  tickerThief: preload(tickerThiefBossHead),
} as const;

// Individually-named exports so StreetBrawler.tsx's boss-head lookup chain
// (jeetHeadImg / badActorHeadImg / ...) can migrate with a one-line alias.
export const jeetHeadImg = BOSS_HEAD_IMAGES.jeet;
export const badActorHeadImg = BOSS_HEAD_IMAGES.badActor;
export const ruggerHeadImg = BOSS_HEAD_IMAGES.rugger;
export const fudderHeadImg = BOSS_HEAD_IMAGES.fudder;
export const exitLiquidityHeadImg = BOSS_HEAD_IMAGES.exitLiquidity;
export const mrMarketerHeadImg = BOSS_HEAD_IMAGES.mrMarketer;
export const tickerThiefHeadImg = BOSS_HEAD_IMAGES.tickerThief;
