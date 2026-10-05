/**
 * Reusable story / narration panel data model (Levels 1–7).
 *
 * A scene is a short ordered list of panels. Each panel is either narration
 * (no speaker) or a character line. Portrait ids are resolved by the
 * presentation layer (`StoryPanel.tsx`), so content files stay pure data.
 */

export type StoryPortrait =
  | "waldoge"
  | "jeet"
  | "filf-normal"
  | "filf-worried"
  | "filf-happy"
  | "filf-thankful";

export interface StoryPanelData {
  /** Omit for narration. */
  speaker?: string;
  portrait?: StoryPortrait;
  text: string;
}

export type StoryKind = "opening" | "mid-level" | "rescue" | "boss-intro" | "level-complete";

export interface StoryScene {
  id: string;
  kind: StoryKind;
  /** Small caption above the panel, e.g. "LEVEL 1 — ANON ECO". */
  title: string;
  panels: StoryPanelData[];
}
