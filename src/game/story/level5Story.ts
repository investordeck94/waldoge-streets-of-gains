import type { StoryScene } from "./storyTypes";

const captured = { art: "monko-caged", x: 80, bottom: 2, scale: 0.66 } as const;
const capturedQuiet = { ...captured, dimmed: true } as const;
const exitPortrait = "exit-liquidity-head";

/** Exact seven-panel Level 5 opening — speaker ownership per supplied board. */
export const LEVEL5_OPENING_EXIT_LIQUIDITY: StoryScene = {
  id: "l5-opening-exit-liquidity",
  kind: "opening",
  title: "LEVEL 5 — THE GRAVEYARD OF GAINS",
  panels: [
    {
      treatment: "arcade-cinematic", panelTitle: "WELCOME TO THE GRAVEYARD OF GAINS",
      background: "bg-level5-cemetery",
      narration: "WELCOME TO THE\nGRAVEYARD OF GAINS…",
      subNarration: "WHERE FAILED PROJECTS,\nDEAD COINS AND LOST\nFORTUNES COME TO DIE.",
      transition: "fade",
    },
    {
      treatment: "arcade-cinematic", panelTitle: "MONKO IS CAPTURED",
      background: "bg-level5-cemetery",
      characters: [{ ...captured, x: 64, scale: 0.78 }],
      dialogue: { speaker: "MONKO", portrait: "monko-portrait-worried", text: "LET ME OUT! MY BANANAS! THOSE ARE MY BANANAS!", bubble: { x: 28, y: 18, tailX: 56, tailY: 48 } },
    },
    {
      treatment: "arcade-cinematic", panelTitle: "EXIT LIQUIDITY REVEAL",
      background: "bg-level5-throne",
      dialogue: { speaker: "EXIT LIQUIDITY", portrait: exitPortrait, text: "ALL YOUR ASSETS BELONG TO ME NOW.", bubble: { x: 56, y: 12, tailX: 26, tailY: 36 } },
    },
    {
      treatment: "arcade-cinematic", panelTitle: "MONKO IS FIRST",
      background: "bg-level5-throne",
      characters: [capturedQuiet, { art: "monko-banana-stash", x: 58, bottom: 1, scale: 0.3 }],
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "ONE BY ONE I WILL TAKE THE ANONVERSE ASSETS. STARTING WITH YOU, MONKO. YOUR BANANAS ARE MINE.",
        bubble: { x: 56, y: 12, tailX: 26, tailY: 36 },
      },
    },
    {
      treatment: "arcade-cinematic", panelTitle: "WALDOGE IS NEXT",
      background: "bg-level5-throne",
      monitor: { art: "cut-waldoge", x: 76, y: 44, w: 36 },
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "THEN THAT CRETIN WHO'S BEEN CAUSING MY ORGANISATION PROBLEMS… THAT HIDING DOG. LET'S SEE IF HE COMES OUT OF HIDING NOW.",
        bubble: { x: 56, y: 12, tailX: 26, tailY: 36 },
      },
    },
    {
      treatment: "arcade-cinematic", panelTitle: "NOT FUDDER",
      background: "bg-level5-throne",
      dialogue: {
        speaker: "EXIT LIQUIDITY",
        portrait: exitPortrait,
        text: "ONE THING I MUST SAY… I'M NOT FUDDER. AND I'M CERTAINLY NOT ONE OF HIS MINIONS. YOU'RE IN FOR A WHOLE LOT WORSE.",
        bubble: { x: 56, y: 12, tailX: 26, tailY: 36 },
      },
    },
    {
      treatment: "arcade-cinematic", panelTitle: "THE MISSION",
      background: "bg-level5-cemetery",
      characters: [{ art: "cut-waldoge", x: 80, bottom: 2, scale: 0.8 }],
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
