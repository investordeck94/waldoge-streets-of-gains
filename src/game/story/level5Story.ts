import type { StoryScene } from "./storyTypes";

const captured = { art: "monko-caged", x: 78, bottom: 2, scale: 0.76 } as const;
const exitPortrait = "exit-liquidity-head";

/** Exact seven-panel Level 5 opening. Exit Liquidity owns every dialogue line. */
export const LEVEL5_OPENING_EXIT_LIQUIDITY: StoryScene = {
  id: "l5-opening-exit-liquidity",
  kind: "opening",
  title: "LEVEL 5 — THE GRAVEYARD OF GAINS",
  panels: [
    {
      background: "bg-level5-cemetery",
      narration: "WELCOME TO THE\nGRAVEYARD OF GAINS…",
      subNarration: "WHERE FAILED PROJECTS,\nDEAD COINS AND LOST FORTUNES\nCOME TO DIE.",
      transition: "fade",
    },
    {
      background: "bg-level5-throne",
      characters: [captured],
      narration: "MONKO HAS BEEN CAPTURED.",
      subNarration: "EXIT LIQUIDITY HAS TAKEN HIM PRISONER.",
    },
    {
      background: "bg-level5-throne",
      characters: [captured],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "EVERYTHING YOU HAVE… EVERYTHING THE ANONVERSE HAS BUILT… IT ALL BELONGS TO ME NOW. I'LL TAKE IT ONE PIECE AT A TIME.",
      },
    },
    {
      background: "bg-level5-throne",
      characters: [captured, { art: "monko-banana-stash", x: 55, bottom: 1, scale: 0.3 }],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "AND I'M STARTING WITH YOU, MONKO. YOUR BANANAS ARE MINE.",
      },
    },
    {
      background: "bg-level5-throne",
      characters: [captured],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "AND THEN THERE'S THAT CRETIN HIDING IN THE SHADOWS… WALDOGE. YOU'VE BEEN CAUSING MY ORGANISATION PROBLEMS FOR FAR TOO LONG. LET'S SEE HOW LONG YOU STAY IN HIDING.",
      },
    },
    {
      background: "bg-level5-throne",
      characters: [captured],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "ONE THING YOU SHOULD UNDERSTAND… I'M NOT FUDDER. AND I'M CERTAINLY NOT ONE OF HIS MINIONS. WHAT'S COMING FOR YOU IS MUCH WORSE. YOU HAVEN'T EVEN SEEN THE BEGINNING YET.",
      },
    },
    {
      background: "bg-level5-cemetery",
      narration: "MONKO HAS BEEN CAPTURED.\nEXIT LIQUIDITY HAS STOLEN HIS BANANAS.",
      subNarration: "FIND MONKO.\nRECOVER HIS BANANAS.\nRESCUE MONKO.\nDEFEAT EXIT LIQUIDITY.",
      transition: "fade",
    },
  ],
};

export const LEVEL5_MONKO_RESCUE: StoryScene = {
  id: "l5-monko-rescue",
  kind: "rescue",
  title: "MONKO RESCUED",
  panels: [
    {
      background: "bg-level5-throne",
      characters: [{ art: "monko-rescue-happy", x: 76, bottom: 1, scale: 0.72 }],
      dialogue: { speaker: "MONKO", portrait: "monko-portrait-normal", text: "YOU FOUND MY BANANAS AND GOT ME OUT! GO END EXIT LIQUIDITY'S REIGN, WALDOGE!" },
    },
    {
      background: "bg-level5-throne",
      characters: [{ art: "monko-rescue-wave", x: 76, bottom: 1, scale: 0.72 }],
      dialogue: { speaker: "WALDOGE", portrait: "waldoge", text: "Get somewhere safe. Exit Liquidity is next." },
    },
  ],
};
