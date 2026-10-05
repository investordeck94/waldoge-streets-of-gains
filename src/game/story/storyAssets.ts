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
import waldogeStory from "@/assets/story/story-waldoge.jpeg.asset.json";
import baddieStory from "@/assets/story/story-baddie.jpeg.asset.json";
import anonStory from "@/assets/story/story-anon.jpeg.asset.json";
import monkoStory from "@/assets/story/story-monko.jpeg.asset.json";
import dogevanStory from "@/assets/story/story-dogevan.jpeg.asset.json";
import doxxStory from "@/assets/story/story-doxx.jpeg.asset.json";
import squirrelStory from "@/assets/story/story-squirrel.png.asset.json";
import sus_dogStory from "@/assets/story/story-sus-dog.jpeg.asset.json";
import blaze420_blaze_itStory from "@/assets/story/story-420-blaze-it.jpeg.asset.json";
import dobermannStory from "@/assets/story/story-dobermann.jpeg.asset.json";
import filfStory from "@/assets/story/story-filf.jpeg.asset.json";
import earthBg from "@/assets/story/story-earth.jpg";
import cut_waldoge from "@/assets/story/cutouts/waldoge.webp";
import cut_baddie from "@/assets/story/cutouts/baddie.webp";
import cut_anon from "@/assets/story/cutouts/anon.webp";
import cut_monko from "@/assets/story/cutouts/monko.webp";
import cut_dogevan from "@/assets/story/cutouts/dogevan.webp";
import cut_doxx from "@/assets/story/cutouts/doxx.webp";
import casinoBg from "@/assets/story/story-casino.jpg";
import chillTerraceBg from "@/assets/story/story-chill-terrace.jpg";
import watchtowerBg from "@/assets/story/story-watchtower.jpg";
import showOffBg from "@/assets/story/story-show-off.jpg";
import squirrelNutsBg from "@/assets/story/story-squirrel-nuts.jpg";
import anonMayorBg from "@/assets/story/story-anon-mayor.jpg";
import oncePeacefulBg from "@/assets/story/story-once-peaceful.jpg";
import cut_sus_dog from "@/assets/story/cutouts/sus-dog.webp";
import cut_b420_blaze_it from "@/assets/story/cutouts/420-blaze-it.webp";
import cut_dobermann from "@/assets/story/cutouts/dobermann.webp";
import cut_filf from "@/assets/story/cutouts/filf.webp";
import hideSeekBg from "@/assets/story/story-hide-seek.jpg";
import bushProp from "@/assets/story/story-bush.png";
import magnifierProp from "@/assets/story/story-magnifier.png";
import bananaStackBg from "@/assets/story/story-banana-stack.jpg";
import bananaProp from "@/assets/story/story-banana.png";
import anonverseBg from "@/assets/story/story-anonverse.jpg";
import { DOXX_ATLAS_SIZE, DOXX_ATLAS_URL, DOXX_FRAMES } from "@/game/presentation/render2d/doxxSprites";
import l2CallBg from "@/assets/story/story-l2-call.jpg";
import ruggerCellBg from "@/assets/story/story-rugger-cell.jpg";
import oldTheatreBg from "@/assets/story/story-old-theatre.jpg";
import studioCaptiveBg from "@/assets/story/story-studio-captive.jpg";
import cut_sus_caged_stand from "@/assets/story/cutouts/sus-caged-stand.webp";
import cut_sus_caged_sit from "@/assets/story/cutouts/sus-caged-sit.webp";
import cut_sus_tied from "@/assets/story/cutouts/sus-tied.webp";
import cut_sus_tied_slump from "@/assets/story/cutouts/sus-tied-slump.webp";
import ruggerHead from "@/assets/rugger-boss-head.png";
import badActorHead from "@/assets/badactor-boss-head.png";
import baddieCaptiveAtlas from "@/assets/baddie-captive-atlas.png.asset.json";
import baddieCaptiveAtlasLocal from "@/assets/baddie-captive-atlas-local.png";
import fudderAtlas from "@/assets/fudder-atlas.png.asset.json";
import fudderWorldBg from "@/assets/level4-media.jpg-local.jpg";
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

const doxx = (id: keyof typeof DOXX_FRAMES, alt = "Doxx"): StoryArt => ({
  src: DOXX_ATLAS_URL, frame: DOXX_FRAMES[id], sheet: DOXX_ATLAS_SIZE, alt,
});

export const STORY_ART: Record<StoryArtId, StoryArt> = {
  waldoge: { src: waldogeHead, alt: "Waldoge" },
  jeet: { src: jeetHead, alt: "Jeet" },
  "filf-normal": filf("portraitNormal"),
  "filf-worried": filf("portraitWorried"),
  "filf-happy": filf("portraitHappy"),
  "filf-thankful": filf("portraitThankful"),
  "filf-full": filf("idle"),
  "filf-caged": filf("cage", "FILF caged"),
  "bg-earth": { src: earthBg, alt: "Planet Earth from space" },
  // Background-free copies of the canonical art (white removed only) for scene composition.
  "cut-waldoge": { src: cut_waldoge, alt: "waldoge" },
  "cut-baddie": { src: cut_baddie, alt: "baddie" },
  "cut-anon": { src: cut_anon, alt: "anon" },
  "cut-monko": { src: cut_monko, alt: "monko" },
  "cut-dogevan": { src: cut_dogevan, alt: "dogevan" },
  "cut-doxx": { src: cut_doxx, alt: "doxx" },
  "cut-sus-dog": { src: cut_sus_dog, alt: "sus-dog" },
  "cut-420-blaze-it": { src: cut_b420_blaze_it, alt: "420-blaze-it" },
  "cut-dobermann": { src: cut_dobermann, alt: "dobermann" },
  "cut-filf": { src: cut_filf, alt: "filf" },
  "cut-squirrel": { src: squirrelStory.url, alt: "Squirrel" },
  "bg-hide-seek": { src: hideSeekBg, alt: "Anonverse park corner" },
  "prop-bush": { src: bushProp, alt: "Hedge bush" },
  "prop-magnifier": { src: magnifierProp, alt: "Magnifying glass" },
  "bg-anonverse": { src: anonverseBg, alt: "The peaceful futuristic Anonverse" },
  "bg-banana-stack": { src: bananaStackBg, alt: "Anonverse plaza with a ridiculous banana tower" },
  "prop-banana": { src: bananaProp, alt: "Banana" },
  "bg-casino": { src: casinoBg, alt: "Futuristic Anonverse casino with a blackjack table" },
  "bg-chill-terrace": { src: chillTerraceBg, alt: "Peaceful Anonverse sky terrace with a hammock" },
  "bg-watchtower": { src: watchtowerBg, alt: "Stone watchtower rooftop overlooking the Anonverse at dusk" },
  "bg-show-off": { src: showOffBg, alt: "Sunny Anonverse promenade with cheering townsfolk holding up 10 score cards" },
  "bg-squirrel-nuts": { src: squirrelNutsBg, alt: "Sunny Anonverse plaza corner with an oak tree and scattered acorns" },
  "bg-anon-mayor": { src: anonMayorBg, alt: "Anonverse town square seen from a mayor's balcony podium, residents below" },
  "bg-l2-call": { src: l2CallBg, alt: "Neon Anon Eco street at night" },
  "bg-rugger-cell": { src: ruggerCellBg, alt: "Secret holding cell in Rugger's casino vault" },
  // Doxx — crops of the supplied canonical NPC sheet; blueprints = supplied art.
  "doxx-tied-phone": doxx("tiedPhone"),
  "doxx-tied-phone-2": doxx("tiedPhone2"),
  "doxx-bust-call": doxx("bustCall"),
  "doxx-bust-urgent": doxx("bustUrgent"),
  "doxx-phone": doxx("phone", "Hidden phone"),
  "doxx-blueprint": doxx("blueprint", "Doxx's blueprints"),
  "bg-old-theatre": { src: oldTheatreBg, alt: "Abandoned old movie theatre at night" },
  "bg-studio-captive": { src: studioCaptiveBg, alt: "Dark film studio holding room" },
  // Supplied SUS Dog captive sheet — fake checker background removed only.
  "sus-caged-stand": { src: cut_sus_caged_stand, alt: "SUS Dog caged" },
  "sus-caged-sit": { src: cut_sus_caged_sit, alt: "SUS Dog caged" },
  "sus-tied": { src: cut_sus_tied, alt: "SUS Dog tied up" },
  "sus-tied-slump": { src: cut_sus_tied_slump, alt: "SUS Dog tied up" },
  "rugger-head": { src: ruggerHead, alt: "Rugger" },
  "badactor-head": { src: badActorHead, alt: "Bad Actor" },
  "bg-fudder-world": { src: fudderWorldBg, alt: "Fudder's controlled propaganda world" },
  "fudder-story": { src: fudderAtlas.url, frame: { x: 21, y: 8, w: 190, h: 241 }, sheet: { w: 1024, h: 512 }, alt: "Fudder" },
  "baddie-caged": { src: baddieCaptiveAtlasLocal, frame: { x: 0, y: 0, w: 115, h: 145 }, sheet: { w: 700, h: 280 }, alt: "Baddie locked inside a cage" },
  "baddie-thankful": { src: baddieCaptiveAtlasLocal, frame: { x: 400, y: 0, w: 114, h: 256 }, sheet: { w: 700, h: 280 }, alt: "Baddie thankful after her rescue" },
  "baddie-worried": { src: baddieCaptiveAtlasLocal, frame: { x: 520, y: 0, w: 167, h: 136 }, sheet: { w: 700, h: 280 }, alt: "Baddie worried" },
  "bg-once-peaceful": { src: oncePeacefulBg, alt: "The Anonverse at dusk under storm clouds, streets shuttered and empty" },

/**
 * CANONICAL STORY CHARACTERS — approved artwork, used exactly as supplied
 * (never redrawn, recoloured or cropped). Story panels only; gameplay
 * sprites are separate. Ids: `char-<name>`.
 */
  "char-waldoge": { src: waldogeStory.url, alt: "Waldoge" },
  "char-baddie": { src: baddieStory.url, alt: "Baddie" },
  "char-anon": { src: anonStory.url, alt: "Anon (TV-head)" },
  "char-monko": { src: monkoStory.url, alt: "Monko" },
  "char-dogevan": { src: dogevanStory.url, alt: "Dogevan" },
  "char-doxx": { src: doxxStory.url, alt: "Doxx" },
  "char-squirrel": { src: squirrelStory.url, alt: "Squirrel" },
  "char-sus-dog": { src: sus_dogStory.url, alt: "SUS Dog" },
  "char-420-blaze-it": { src: blaze420_blaze_itStory.url, alt: "420 Blaze It" },
  "char-dobermann": { src: dobermannStory.url, alt: "Dobermann" },
  "char-filf": { src: filfStory.url, alt: "FILF" },
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
