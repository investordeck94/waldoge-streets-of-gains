/**
 * Story-panel art registry. Separate from gameplay sprites: registering or
 * replacing an entry here never changes in-game rendering.
 *
 * Memory: nothing is loaded at import. Art is fetched only when a panel that
 * uses it is shown (plus a one-panel look-ahead), through a single shared
 * Image per URL, and the look-ahead cache is dropped when the story closes.
 */
import { FILF_ATLAS_SIZE, FILF_ATLAS_URL, FILF_FRAMES } from "@/game/presentation/render2d/filfSprites";
import waldogeHead from "@/assets/waldoge-head.png";
import jeetHead from "@/assets/jeet-boss-head.png";
import type { StoryArtId, StoryPanelData, StoryPortrait } from "./storyTypes";

export interface StoryArt {
  src: string;
  /** Optional crop inside a sprite sheet. */
  frame?: { x: number; y: number; w: number; h: number };
  sheet?: { w: number; h: number };
  alt: string;
}

const filf = (id: keyof typeof FILF_FRAMES, alt = "FILF"): StoryArt => ({
  src: FILF_ATLAS_URL, frame: FILF_FRAMES[id], sheet: FILF_ATLAS_SIZE, alt,
});

export const STORY_ART: Record<StoryArtId, StoryArt> = {
  waldoge: { src: waldogeHead, alt: "Waldoge" },
  jeet: { src: jeetHead, alt: "Jeet" },
  "filf-normal": filf("portraitNormal"),
  "filf-worried": filf("portraitWorried"),
  "filf-happy": filf("portraitHappy"),
  "filf-thankful": filf("portraitThankful"),
  "filf-full": filf("idle"),
};

/** Add or replace story art at runtime / from a level's story module. */
export function registerStoryArt(id: StoryArtId, art: StoryArt): void {
  STORY_ART[id] = art;
}

export const legacyPortraitArt = (p: StoryPortrait): StoryArtId => p;

/** Every art id a panel needs. */
export function panelArtIds(panel: StoryPanelData | undefined): StoryArtId[] {
  if (!panel) return [];
  const ids: StoryArtId[] = [];
  if (panel.background) ids.push(panel.background);
  for (const c of panel.characters ?? []) ids.push(c.art);
  if (panel.dialogue?.portrait) ids.push(panel.dialogue.portrait);
  if (panel.portrait) ids.push(panel.portrait);
  return ids;
}

const warm = new Map<string, HTMLImageElement>();
/** Look-ahead for the next panel; one Image per URL, never duplicated. */
export function prefetchPanel(panel: StoryPanelData | undefined): void {
  if (typeof window === "undefined") return;
  for (const id of panelArtIds(panel)) {
    const art = STORY_ART[id];
    if (!art || warm.has(art.src)) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = art.src;
    warm.set(art.src, img);
  }
}
/** Called when a story closes so look-ahead images can be freed. */
export function releaseStoryPrefetch(): void {
  warm.clear();
}
