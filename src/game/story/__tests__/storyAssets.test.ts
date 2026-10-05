import { describe, expect, it } from "vitest";
import { STORY_ART, panelArtIds, registerStoryArt } from "../storyAssets";

describe("story art registry", () => {
  it("collects every art id a panel needs", () => {
    expect(panelArtIds({
      background: "bg", characters: [{ art: "a" }, { art: "b" }],
      dialogue: { speaker: "X", text: "hi", portrait: "p" },
    })).toEqual(["bg", "a", "b", "p"]);
  });
  it("lets story art be replaced without touching gameplay", () => {
    registerStoryArt("test-art", { src: "/x.png", alt: "X" });
    expect(STORY_ART["test-art"].src).toBe("/x.png");
  });
});
