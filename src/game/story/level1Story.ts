import type { StoryScene } from "./storyTypes";

/** Level 1 (Anon Eco) story content. Only Level 1 is authored for now. */

export const LEVEL1_OPENING: StoryScene = {
  id: "l1-opening",
  kind: "opening",
  title: "LEVEL 1 — ANON ECO",
  panels: [
    { text: "Anon Eco was supposed to be a quiet little corner of the ecosystem..." },
    { portrait: "jeet", text: "Then Jeet moved in." },
    { portrait: "jeet", text: "Loud music. Constant harassment. Crude comments. Nobody could get any peace." },
    { portrait: "jeet", text: "FILF, SUS, 420 Blaze, Monko, Dox, Anoncoin... Jeet has been hassling everyone around here." },
    { text: "And now he's taken things too far..." },
    { portrait: "filf-worried", text: "FILF has been locked up." },
    { portrait: "waldoge", speaker: "WALDOGE", text: "Waldoge isn't letting that slide." },
  ],
};

export const LEVEL1_FILF_RESCUE: StoryScene = {
  id: "l1-filf-rescue",
  kind: "rescue",
  title: "FILF RESCUED",
  panels: [
    { portrait: "filf-happy", speaker: "FILF", text: "Thank you, Waldoge. Jeet has been making life miserable for everyone around here." },
    { portrait: "waldoge", speaker: "WALDOGE", text: "Not anymore. Stay safe — Jeet and I are about to have a word." },
    { portrait: "filf-thankful", speaker: "FILF", text: "He's holed up at the end of the street. Go get him!" },
  ],
};

export const LEVEL1_COMPLETE: StoryScene = {
  id: "l1-complete",
  kind: "level-complete",
  title: "LEVEL 1 CLEAR",
  panels: [
    { portrait: "jeet", text: "Jeet is done terrorising Anon Eco. The music stops. The street breathes again." },
    { portrait: "filf-happy", speaker: "FILF", text: "You did it! The whole neighbourhood owes you one." },
    { portrait: "waldoge", speaker: "WALDOGE", text: "Jeet didn't come up with all this on his own. Someone's pulling strings." },
    { text: "Anon Eco is safe... for now. But this is only the beginning." },
  ],
};
