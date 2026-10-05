/**
 * Reusable story / narration panel data model (Levels 1–7).
 *
 * A scene is an ordered `panels` sequence. Content files are pure data; art
 * is referenced by id through `storyAssets.ts`, so story artwork can be
 * swapped later without touching gameplay sprites or logic.
 */

/** Id registered in `STORY_ART` (storyAssets.ts). */
export type StoryArtId = string;

/** Legacy portrait ids (kept so existing scenes keep working). */
export type StoryPortrait =
  | "waldoge"
  | "jeet"
  | "filf-normal"
  | "filf-worried"
  | "filf-happy"
  | "filf-thankful";

export type StoryCharacterPosition = "left" | "center" | "right";

export interface StoryCharacter {
  art: StoryArtId;
  position?: StoryCharacterPosition; // default "center"
  /** Mirror horizontally (e.g. to face the other character). */
  flip?: boolean;
  /** Height as a fraction of the stage (0.2–1). Default 0.9. */
  scale?: number;
  /** Dim when this character is not the one speaking. */
  dimmed?: boolean;
}

export type StoryTransition = "fade" | "slide" | "cut";

export interface StoryPanelData {
  /** Environment artwork behind the characters. */
  background?: StoryArtId;
  /** Full-body / bust artwork placed on the stage. */
  characters?: StoryCharacter[];
  /** Narration caption (italic box). */
  narration?: string;
  /** Character line. */
  dialogue?: { speaker: string; text: string; portrait?: StoryArtId };
  /** Auto-advance after this many ms (tap still advances earlier). */
  durationMs?: number;
  transition?: StoryTransition;

  // --- Legacy compact form (portrait card + one line of text) ---
  speaker?: string;
  portrait?: StoryPortrait;
  text?: string;
}

export type StoryKind = "opening" | "mid-level" | "rescue" | "boss-intro" | "level-complete";

export interface StoryScene {
  id: string;
  kind: StoryKind;
  /** Small caption above the panel, e.g. "LEVEL 1 — ANON ECO". */
  title: string;
  panels: StoryPanelData[];
  /** Hide the Skip control (default: skippable). */
  unskippable?: boolean;
}
