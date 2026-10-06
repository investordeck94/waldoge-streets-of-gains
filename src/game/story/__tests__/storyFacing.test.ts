import { describe, expect, it } from "vitest";
import { storyCharacterFlip } from "../storyFacing";
import { LEVEL7_OPENING_CITADEL } from "../level7Story";
import { LEVEL7_FINAL_EPILOGUE } from "../level7Epilogue";
import { LEVEL6_SQUIRREL_RESCUE } from "../level6Story";
import type { StoryPanelData } from "../storyTypes";

describe("Waldoge story facing", () => {
  it("faces the Fat Cats and Ticker Taker on his right in every opening panel", () => {
    const panels = LEVEL7_OPENING_CITADEL.panels.filter(p => p.characters?.some(c => c.art === "cut-waldoge"));
    expect(panels.length).toBeGreaterThan(0);
    for (const panel of panels) {
      const w = panel.characters?.find(c => c.art === "cut-waldoge");
      if (w) expect(storyCharacterFlip(panel, w)).toBe(true);
    }
  });
  it("faces Squirrel on the right while listening and replying", () => {
    for (const panel of LEVEL6_SQUIRREL_RESCUE.panels) {
      const w = panel.characters?.find(c => c.art === "cut-waldoge");
      if (w) expect(storyCharacterFlip(panel, w)).toBe(true);
    }
  });
  it("faces defeated villains, Anon and Squirrel on his left in epilogue conversations", () => {
    for (const panel of LEVEL7_FINAL_EPILOGUE.panels.slice(0, 13)) {
      const w = panel.characters?.find(c => c.art === "cut-waldoge");
      if (w) expect(storyCharacterFlip(panel, w)).toBe(false);
    }
  });
  it("prioritizes the speaker over a nearer bystander and corrects a stale flip", () => {
    const w = { art: "cut-waldoge", x: 50, flip: false };
    const panel: StoryPanelData = { characters: [w, { art: "cut-monko", x: 40 }, { art: "cut-filf", x: 80 }], dialogue: { speaker: "FILF", portrait: "filf-happy", text: "Thanks!" } };
    expect(storyCharacterFlip(panel, w)).toBe(true);
  });
  it("uses bubble anchoring for a speaker painted into the background", () => {
    const w = { art: "cut-waldoge", x: 76, flip: true };
    expect(storyCharacterFlip({ dialogue: { speaker: "EXIT LIQUIDITY", text: "You!", bubble: { x: 56, y: 12, tailX: 26, tailY: 36 } } }, w)).toBe(false);
  });
  it("preserves solo poses and never mirrors other characters or follows props", () => {
    const w = { art: "cut-waldoge", x: 40, flip: false };
    expect(storyCharacterFlip({ characters: [w, { art: "doxx-phone", x: 64 }] }, w)).toBe(false);
    expect(storyCharacterFlip({}, { art: "cut-monko", flip: true })).toBe(true);
  });
});