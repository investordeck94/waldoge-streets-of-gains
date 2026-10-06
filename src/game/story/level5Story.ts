import type { StoryScene } from "./storyTypes";

const captured = { art: "monko-caged", x: 80, bottom: 2, scale: 0.62 } as const;
const capturedQuiet = { ...captured, dimmed: true } as const;
const exitPortrait = "exit-liquidity-head";

/** Exact seven-panel Level 5 opening — speaker ownership per supplied board. */
export const LEVEL5_OPENING_EXIT_LIQUIDITY: StoryScene = {
  id: "l5-opening-exit-liquidity",
  kind: "opening",
  title: "LEVEL 5 — THE GRAVEYARD OF GAINS",
  panels: [
    {
      background: "bg-level5-cemetery",
      narration: "WELCOME TO THE\nGRAVEYARD OF GAINS…",
      subNarration: "WHERE FAILED PROJECTS,\nDEAD COINS AND LOST\nFORTUNES COME TO DIE.",
      transition: "fade",
    },
    {
      background: "bg-level5-cemetery",
      characters: [{ ...captured, x: 62 }],
      dialogue: { speaker: "MONKO", portrait: "monko-portrait-worried", text: "LET ME OUT! MY BANANAS! THOSE ARE MY BANANAS!", bubble: { x: 26, y: 8, tailX: 56, tailY: 50 } },
    },
    {
      background: "bg-level5-throne",
      dialogue: { speaker: "EXIT LIQUIDITY", portrait: exitPortrait, text: "ALL YOUR ASSETS BELONG TO ME NOW.", bubble: { x: 52, y: 4, tailX: 24, tailY: 34 } },
    },
    {
      background: "bg-level5-throne",
      characters: [capturedQuiet, { art: "monko-banana-stash", x: 58, bottom: 1, scale: 0.3 }],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "ONE BY ONE I WILL TAKE THE ANONVERSE ASSETS. STARTING WITH YOU, MONKO. YOUR BANANAS ARE MINE.",
        bubble: { x: 52, y: 4, tailX: 24, tailY: 34 },
      },
      subNarration: "MONKO (FROM THE CAGE): “NO! MY BANANAS!”",
    },
    {
      background: "bg-level5-throne",
      characters: [{ art: "cut-waldoge", x: 76, bottom: 2, scale: 0.6 }],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "THEN THAT CRETIN WHO'S BEEN CAUSING MY ORGANISATION PROBLEMS… THAT HIDING DOG. LET'S SEE IF HE COMES OUT OF HIDING NOW.",
        bubble: { x: 52, y: 4, tailX: 24, tailY: 34 },
      },
    },
    {
      background: "bg-level5-throne",
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "ONE THING I MUST SAY… I'M NOT FUDDER. AND I'M CERTAINLY NOT ONE OF HIS MINIONS. YOU'RE IN FOR A WHOLE LOT WORSE.",
        bubble: { x: 52, y: 4, tailX: 24, tailY: 34 },
      },
    },
    {
      background: "bg-level5-cemetery",
      characters: [{ art: "cut-waldoge", x: 50, bottom: 2, scale: 0.7 }],
      narration: "MONKO HAS BEEN CAPTURED.\nHIS BANANAS HAVE BEEN STOLEN.",
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
