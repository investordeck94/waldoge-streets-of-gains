import type { StoryScene } from "./storyTypes";

/** Level 1 (Anon Eco) story content. Only Level 1 is authored for now. */

/** Panel 1 — Earth from space. Shown before the Level 1 opening. */
export const STORY_PANEL_1_EARTH: StoryScene = {
  id: "story-1-earth",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    { background: "bg-earth", narration: "ONCE UPON A TIME,\nON A PLANET CALLED EARTH…", transition: "fade" },
  ],
};

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

/** Panel 2 — the peaceful Anonverse; every canonical character once. */
export const STORY_PANEL_2_ANONVERSE: StoryScene = {
  id: "story-2-anonverse",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-anonverse",
      narration: "IN A LAND CALLED\nTHE ANONVERSE…",
      transition: "fade",
      characters: [
        // back row (smaller, on the far walkway)
        { art: "cut-dogevan", x: 34, bottom: 30, scale: 0.3 },
        { art: "cut-anon", x: 46, bottom: 30, scale: 0.3 },
        { art: "cut-squirrel", x: 58, bottom: 31, scale: 0.2 },
        // middle row
        { art: "cut-doxx", x: 22, bottom: 14, scale: 0.42 },
        { art: "cut-420-blaze-it", x: 40, bottom: 14, scale: 0.42 },
        { art: "cut-sus-dog", x: 68, bottom: 14, scale: 0.44, flip: true },
        { art: "cut-dobermann", x: 84, bottom: 16, scale: 0.44, flip: true },
        // front row
        { art: "cut-monko", x: 8, bottom: 0, scale: 0.58 },
        { art: "cut-filf", x: 30, bottom: 0, scale: 0.55 },
        { art: "cut-waldoge", x: 52, bottom: 0, scale: 0.64 },
        { art: "cut-baddie", x: 75, bottom: 0, scale: 0.58, flip: true },
      ],
    },
  ],
};
