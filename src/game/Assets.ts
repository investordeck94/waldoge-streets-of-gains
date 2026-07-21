/**
 * game/Assets.ts — Phase 1 asset preloader.
 *
 * PURPOSE
 * Central registry for every static asset the game consumes (music tracks,
 * character/boss sprites, cover art). Consolidates the seven boss-head
 * `new Image()` preloaders that were previously scattered at the top of
 * StreetBrawler.tsx.
 *
 * BEHAVIOUR NOTE
 * The preload pattern is identical to the previous inline version:
 *   • Guarded with `typeof window !== "undefined"` so SSR / module import
 *     during Vite's dependency graph traversal never touches `Image`.
 *   • Each image starts loading at module-import time, so by the time the
 *     first render draws bosses, the browser has already fetched them.
 *   • `.src` is assigned synchronously; nothing awaits the load.
 * This preserves the current "images may briefly be null during first
 * paint, then swap in" behaviour that the boss-draw code already handles
 * via `if (customHead && customHead.complete)`.
 *
 * WHAT INTENTIONALLY STAYED IN StreetBrawler.tsx
 * The waldoge head image (`waldogeHead`) is lazy-loaded *inside* the
 * component (see the `img.src = waldogeHead` line in the render effect)
 * because its lifetime is bound to the canvas mount and its onload assigns
 * into a component ref. Moving that load into a module-level singleton
 * would change timing relative to component mount and risk a first-frame
 * regression. Left alone for Phase 1.
 *
 * The audio track list (`TRACKS`) is likewise per-component: it's built
 * inside the component so React re-mounts get fresh Audio elements. Only
 * the URL constants are re-exported here for future use.
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
