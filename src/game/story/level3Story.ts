import type { StoryScene } from "./storyTypes";

/** Level 3 rescue beats — short, one per cage. */
export const LEVEL3_SUS_RESCUE: StoryScene = {
  id: "l3-sus-rescue",
  kind: "rescue",
  title: "SUS DOG RESCUED",
  panels: [
    {
      background: "bg-old-theatre",
      characters: [{ art: "cut-sus-dog", x: 50, bottom: 2, scale: 0.7 }],
      dialogue: { speaker: "SUS DOG", text: "I KNEW SOMETHING SUS WAS GOING ON HERE. THANKS, WALDOGE." },
    },
    { dialogue: { speaker: "WALDOGE", text: "One down. Now to find FILF.", portrait: "waldoge" } },
  ],
};

export const LEVEL3_FILF_RESCUE: StoryScene = {
  id: "l3-filf-rescue",
  kind: "rescue",
  title: "FILF RESCUED",
  panels: [
    { dialogue: { speaker: "FILF", text: "WALDOGE! YOU SAVED ME — AGAIN!", portrait: "filf-thankful" } },
    { dialogue: { speaker: "WALDOGE", text: "Stay safe. Bad Actor's next.", portrait: "waldoge" } },
  ],
};
