import type { StoryCharacter, StoryPanelData } from "./storyTypes";

const WALDOGE_ART = new Set(["cut-waldoge", "char-waldoge"]);
const positionX = (c: StoryCharacter): number => c.x ?? ({ left: 15, center: 50, right: 85 }[c.position ?? "center"]);
const name = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const isProp = (art: string): boolean => /^(prop-|bg-|ep-logo$)|phone$|blueprint$|banana-stash$/.test(art);

/** Canonical Waldoge story art faces left unmirrored. Gameplay is untouched. */
export function storyCharacterFlip(panel: StoryPanelData, character: StoryCharacter): boolean | undefined {
  if (!WALDOGE_ART.has(character.art)) return character.flip;
  const x = positionX(character);
  const others = (panel.characters ?? []).filter(c => !WALDOGE_ART.has(c.art) && !isProp(c.art));
  const dialogue = panel.dialogue;
  const speaker = dialogue?.speaker ?? panel.speaker;
  const listening = speaker && name(speaker) !== "waldoge" && name(speaker) !== "everyone";
  let targetX: number | undefined;

  if (listening) {
    // A bubble tail also locates speakers painted into a background, not just stage cutouts.
    targetX = dialogue?.bubble?.tailX;
    if (targetX === undefined) {
      const portrait = dialogue?.portrait ?? panel.portrait;
      const actor = others.find(c => c.art === portrait) ?? others.find(c => name(c.art).includes(name(speaker)));
      if (actor) targetX = positionX(actor);
    }
  }
  // When Waldoge replies, keep him facing the nearest conversation partner.
  if (targetX === undefined) {
    const nearest = [...others].sort((a, b) => Math.abs(positionX(a) - x) - Math.abs(positionX(b) - x))[0];
    if (nearest) targetX = positionX(nearest);
  }
  if (targetX === undefined || Math.abs(targetX - x) < 1) return character.flip;
  return targetX > x;
}