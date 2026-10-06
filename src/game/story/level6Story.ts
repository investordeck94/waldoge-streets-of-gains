import type { StoryScene } from "./storyTypes";

/**
 * Level 6 opening — THE MARKETING MACHINE. Uses only canonical game art:
 * the new Squirrel frames, Mr Marketer / Raiding Team atlases, Waldoge cutout
 * and Level 6 section scenery. One speaker per panel so every bubble is owned.
 */
const T = "arcade-cinematic" as const;
const MK = "MR MARKETER";
const mkBubble = { x: 30, y: 10, tailX: 70, tailY: 40 };
const sqCaged = { art: "l6-sq-caged", x: 28, bottom: 2, scale: 0.8 } as const;
const marketer = { art: "l6-marketer", x: 74, bottom: 1, scale: 0.86 } as const;

export const LEVEL6_OPENING_MARKETING_MACHINE: StoryScene = {
  id: "l6-opening-marketing-machine",
  kind: "opening",
  title: "LEVEL 6 — THE MARKETING MACHINE",
  panels: [
    {
      treatment: T, panelTitle: "THE FORGOTTEN ONE", background: "bg-l6-advertising",
      characters: [{ art: "l6-sq-idle", x: 70, bottom: 2, scale: 0.5 }],
      narration: "SQUIRREL WAS ALWAYS THERE.", subNarration: "BUT NOBODY REALLY NOTICED HIM.", transition: "fade",
    },
    {
      treatment: T, panelTitle: "THE FORGOTTEN ONE", background: "bg-l6-advertising",
      characters: [{ art: "l6-sq-idle", x: 70, bottom: 2, scale: 0.5 }],
      dialogue: { speaker: "SQUIRREL", portrait: "l6-sq-portrait", text: "I'M ALWAYS HERE… BUT NOBODY EVER SEEMS TO NOTICE.", bubble: { x: 32, y: 14, tailX: 64, tailY: 48 } },
    },
    {
      treatment: T, panelTitle: "THE ONE WHO NOTICED", background: "bg-l6-coldcall",
      characters: [{ art: "l6-sq-idle", x: 26, bottom: 2, scale: 0.45, dimmed: true }, marketer],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "I NOTICED YOU, SQUIRREL. EVERYONE ELSE IGNORED YOU. I SAW SOMETHING THEY DIDN'T.", bubble: mkBubble },
    },
    {
      treatment: T, panelTitle: "THE ONE WHO NOTICED", background: "bg-l6-coldcall",
      characters: [{ art: "l6-sq-talk", x: 26, bottom: 2, scale: 0.45 }, { ...marketer, dimmed: true }],
      dialogue: { speaker: "SQUIRREL", portrait: "l6-sq-portrait", text: "YOU DID? I FINALLY MATTER?", bubble: { x: 52, y: 16, tailX: 30, tailY: 52 } },
    },
    {
      treatment: T, panelTitle: "THE FALSE PROMISE", background: "bg-l6-funnel",
      characters: [{ art: "l6-sq-working", x: 28, bottom: 2, scale: 0.42, dimmed: true }, { art: "l6-marketer-pitch", x: 74, bottom: 1, scale: 0.86 }],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "COME WITH ME. I'LL GIVE YOU A PURPOSE. KEEP WORKING, SQUIRREL. THE MACHINE DOESN'T STOP.", bubble: mkBubble },
    },
    {
      treatment: T, panelTitle: "THE FALSE PROMISE", background: "bg-l6-funnel",
      characters: [{ art: "l6-sq-working", x: 30, bottom: 2, scale: 0.46 }],
      dialogue: { speaker: "SQUIRREL", portrait: "l6-sq-portrait-cry", text: "THIS ISN'T WHAT YOU PROMISED!", bubble: { x: 56, y: 16, tailX: 34, tailY: 56 } },
    },
    {
      treatment: T, panelTitle: "THE CAGE", background: "bg-l6-manipulation",
      characters: [sqCaged, { ...marketer, dimmed: true }],
      dialogue: { speaker: "SQUIRREL", portrait: "l6-sq-portrait-cry", text: "I THOUGHT YOU WERE THE ONLY ONE WHO CARED ABOUT ME.", bubble: { x: 56, y: 10, tailX: 32, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "THE CAGE", background: "bg-l6-manipulation",
      characters: [{ ...sqCaged, dimmed: true }, marketer],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "I DID CARE. I JUST REALISED YOU WERE USEFUL.", bubble: { x: 42, y: 10, tailX: 70, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "MR MARKETER REVEALED", background: "bg-l6-hq",
      characters: [{ art: "cut-waldoge", x: 22, bottom: 2, scale: 0.7, dimmed: true }, marketer],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "WALDOGE. I THOUGHT THAT FAT MANKINI-WEARING SUMO WRESTLER… THE GRIM RIPPLE… WOULD HAVE CAUGHT UP TO YOU BY NOW.", bubble: { x: 46, y: 8, tailX: 70, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "MR MARKETER REVEALED", background: "bg-l6-hq",
      characters: [{ art: "cut-waldoge", x: 22, bottom: 2, scale: 0.7, dimmed: true }, marketer],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "BUT HERE YOU ARE. STILL CAUSING PROBLEMS. I'M THE UNDERBOSS. I WORK DIRECTLY FOR TICKER TAKER.", bubble: { x: 46, y: 8, tailX: 70, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "THE KEY", background: "bg-l6-hq",
      characters: [
        { art: "l6-raider", x: 14, bottom: 2, scale: 0.5, dimmed: true },
        { art: "l6-raider", x: 34, bottom: 2, scale: 0.5, dimmed: true, flip: true },
        marketer,
      ],
      dialogue: { speaker: MK, portrait: "l6-marketer-head", text: "YOU WANT SQUIRREL? THE KEY IS IN THE HANDS OF MY RAIDING TEAM. BEAT THEM. TAKE THE KEY. THEN COME AND GET YOUR FRIEND.", bubble: { x: 40, y: 8, tailX: 70, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "SQUIRREL'S CRY FOR HELP", background: "bg-l6-manipulation",
      characters: [{ art: "l6-sq-caged", x: 34, bottom: 2, scale: 0.86 }],
      dialogue: { speaker: "SQUIRREL", portrait: "l6-sq-portrait-cry", text: "WALDOGE! PLEASE HURRY! GET ME OUT OF HERE!", bubble: { x: 66, y: 14, tailX: 40, tailY: 40 } },
    },
    {
      treatment: T, panelTitle: "LEVEL 6 OBJECTIVE", background: "bg-l6-hq",
      characters: [{ art: "cut-waldoge", x: 80, bottom: 2, scale: 0.8 }],
      narration: "SQUIRREL WAS IGNORED BY EVERYONE.\nMR MARKETER MADE HIM FEEL IMPORTANT.\nHE FORCED SQUIRREL TO WORK FOR HIM.\nSQUIRREL HAS NOW BEEN LOCKED IN A CAGE.\nTHE RAIDING TEAM HAS THE KEY.",
      subNarration: "DEFEAT THE RAIDING TEAM.\nTAKE THE KEY.\nFIND SQUIRREL.\nRESCUE SQUIRREL.\nDEFEAT MR MARKETER.",
      transition: "fade",
    },
  ],
};
