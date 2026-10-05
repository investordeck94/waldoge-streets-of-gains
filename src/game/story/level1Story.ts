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
        { art: "cut-dogevan", x: 31, bottom: 38, scale: 0.26 },
        { art: "cut-anon", x: 40, bottom: 40, scale: 0.22 },
        { art: "cut-squirrel", x: 63, bottom: 33, scale: 0.13 },
        // middle row
        { art: "cut-doxx", x: 36, bottom: 16, scale: 0.3 },
        { art: "cut-420-blaze-it", x: 48, bottom: 20, scale: 0.36 },
        { art: "cut-sus-dog", x: 84, bottom: 8, scale: 0.48, flip: true },
        { art: "cut-dobermann", x: 95, bottom: 26, scale: 0.36, flip: true },
        // front row
        { art: "cut-monko", x: 8, bottom: 0, scale: 0.56 },
        { art: "cut-filf", x: 23, bottom: 0, scale: 0.54 },
        { art: "cut-waldoge", x: 56, bottom: 0, scale: 0.62 },
        { art: "cut-baddie", x: 71, bottom: 0, scale: 0.55, flip: true },
      ],
    },
  ],
};

/** Panel 3 — Waldoge hides, SUS Dog plays detective. */
export const STORY_PANEL_3_HIDE_AND_SEEK: StoryScene = {
  id: "story-3-hide-and-seek",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-hide-seek",
      narration: "WALDOGE WOULD PLAY\nHIDE AND SEEK…",
      subNarration: "WHILE SUS DOG PLAYED DETECTIVE,\nTRYING TO FIND HIM.",
      transition: "fade",
      characters: [
        // Waldoge peeks out from behind the hedge (bush drawn after him).
        { art: "cut-waldoge", x: 66, bottom: 14, scale: 0.62, rotate: -8 },
        { art: "prop-bush", x: 64, bottom: 2, scale: 0.5 },
        // SUS Dog searches on the path, leaning in the wrong direction.
        { art: "cut-sus-dog", x: 22, bottom: 0, scale: 0.8, rotate: -6 },
        { art: "prop-magnifier", x: 34, bottom: 40, scale: 0.22, flip: true },
      ],
    },
  ],
};

/** Panel 4 — Monko peacefully stacking bananas. */
export const STORY_PANEL_4_MONKO_BANANAS: StoryScene = {
  id: "story-4-monko-bananas",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-banana-stack",
      narration: "MONKO WOULD SPEND\nHIS DAYS STACKING BANANAS.",
      transition: "fade",
      characters: [
        // Monko faces the tower he is building (his cutout faces left).
        { art: "cut-monko", x: 67, bottom: 0, scale: 0.52 },
        // The next banana, mid-flight on its way to the top of the stack.
        { art: "prop-banana", x: 59, bottom: 55, scale: 0.075, rotate: -18 },
        // One ready at his feet.
        { art: "prop-banana", x: 61, bottom: 3, scale: 0.05 },
      ],
    },
  ],
};

/** Panel 5 — Doxx enjoying blackjack in an Anonverse casino. */
export const STORY_PANEL_5_DOXX_BLACKJACK: StoryScene = {
  id: "story-5-doxx-blackjack",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-casino",
      narration: "DOXX WOULD PLAY\nBLACKJACK.",
      transition: "fade",
      characters: [
        // Supplied Doxx artwork, seated at the table's edge facing his cards.
        { art: "cut-doxx", x: 76, bottom: 0, scale: 0.7 },
      ],
    },
  ],
};

/** Panel 6 — 420 Blaze It relaxing on an Anonverse sky terrace. */
export const STORY_PANEL_6_BLAZE_CHILL: StoryScene = {
  id: "story-6-blaze-chill",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-chill-terrace",
      narration: "420 BLAZE IT\nWOULD GET STONED ALL DAY.",
      transition: "fade",
      characters: [
        // Supplied 420 Blaze It artwork, lounging beside the hammock,
        // tilted back into an easy, unhurried lean.
        { art: "cut-420-blaze-it", x: 33, bottom: 0, scale: 0.58, rotate: -5 },
      ],
    },
  ],
};

/** Panel 7 — Dobermann standing guard over the peaceful Anonverse. */
export const STORY_PANEL_7_DOBERMANN_GUARD: StoryScene = {
  id: "story-7-dobermann-guard",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-watchtower",
      narration: "DOBERMANN STOOD ON GUARD,\nREADY TO BITE HEADS OFF.",
      transition: "fade",
      characters: [
        // Supplied Dobermann artwork, unchanged, watching over the town.
        { art: "cut-dobermann", x: 30, bottom: 0, scale: 0.62 },
      ],
    },
  ],
};

/** Panel 8 — FILF and Baddie showing off on the Anonverse promenade. */
export const STORY_PANEL_8_FILF_BADDIE: StoryScene = {
  id: "story-8-filf-baddie",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-show-off",
      narration: "FILF AND BADDIE\nWOULD SHOW OFF FOR THE GUYS.",
      transition: "fade",
      characters: [
        // Supplied FILF and Baddie artwork, unchanged, strutting centre stage.
        { art: "cut-filf", x: 38, bottom: 0, scale: 0.66 },
        { art: "cut-baddie", x: 58, bottom: 0, scale: 0.66 },
      ],
    },
  ],
};

/** Panel 9 — Squirrel ignored by the town while happily collecting nuts. */
export const STORY_PANEL_9_SQUIRREL_NUTS: StoryScene = {
  id: "story-9-squirrel-nuts",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-squirrel-nuts",
      narration: "SQUIRREL WOULD GET IGNORED\nAND FIND NUTS.",
      transition: "fade",
      characters: [
        // Supplied Squirrel artwork, unchanged. Its canvas carries large
        // transparent margins, so `bottom` is shifted to keep his feet on
        // the ground (about 40% of the image height is empty below him).
        { art: "cut-squirrel", x: 68, bottom: -38, scale: 0.95 },
      ],
    },
  ],
};

/** Panel 10 — Anon as mayor and leader of the Anonverse. */
export const STORY_PANEL_10_ANON_MAYOR: StoryScene = {
  id: "story-10-anon-mayor",
  kind: "opening",
  title: "WALDOGE: STREETS OF GAINS",
  panels: [
    {
      background: "bg-anon-mayor",
      narration: "ANON WAS THE TOWN\nMAYOR AND LEADER.",
      transition: "fade",
      characters: [
        // Supplied Anon artwork, unchanged — standing beside the podium,
        // overlooking the residents going about their day below.
        { art: "cut-anon", x: 68, bottom: 0, scale: 0.55 },
      ],
    },
  ],
};
