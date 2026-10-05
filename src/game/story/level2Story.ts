import type { StoryScene } from "./storyTypes";

/** Level 2 (Rugger's Empire) — Doxx's secret call from captivity. */
export const LEVEL2_OPENING_CALL: StoryScene = {
  id: "l2-doxx-call",
  kind: "opening",
  title: "LEVEL 2 — DOXX'S HIDDEN CALL",
  panels: [
    {
      background: "bg-l2-call",
      characters: [
        { art: "cut-waldoge", x: 40, bottom: 0, scale: 0.78 },
        { art: "doxx-phone", x: 64, bottom: 48, scale: 0.2, rotate: 12 },
      ],
      narration: "...RING... RING...",
      subNarration: "UNKNOWN CALLER — WALDOGE ANSWERS.",
      transition: "fade",
    },
    {
      background: "bg-rugger-cell",
      characters: [{ art: "doxx-tied-phone", x: 46, bottom: 2, scale: 0.7 }],
      subNarration: "SOMEWHERE IN RUGGER'S EMPIRE, ON A HIDDEN PHONE…",
      dialogue: { speaker: "DOXX", text: "WALDOGE! IT'S DOXX.", portrait: "doxx-bust-call" },
    },
    {
      background: "bg-rugger-cell",
      characters: [{ art: "doxx-tied-phone-2", x: 50, bottom: 2, scale: 0.7 }],
      subNarration: "(WHISPERING — HE CAN'T TALK FOR LONG)",
      dialogue: { speaker: "DOXX", text: "RUGGER'S GOT ME… HE CAPTURED ME AND STOLE MY BLUEPRINTS.", portrait: "doxx-bust-call" },
    },
    {
      background: "bg-rugger-cell",
      characters: [{ art: "doxx-tied-phone", x: 46, bottom: 2, scale: 0.7 }],
      dialogue: { speaker: "DOXX", text: "I NEED YOU TO GET MY BLUEPRINTS BACK… AND GET ME OUT OF HERE!", portrait: "doxx-bust-urgent" },
    },
    {
      background: "bg-rugger-cell",
      characters: [{ art: "doxx-tied-phone-2", x: 50, bottom: 2, scale: 0.7 }],
      dialogue: { speaker: "DOXX", text: "FIND RUGGER. HE HAS THE BLUEPRINTS. AND PLEASE… GET ME OUT OF HERE!", portrait: "doxx-bust-urgent" },
      subNarration: "*CLICK* — CALL DISCONNECTED.",
    },
    {
      background: "bg-l2-call",
      characters: [{ art: "doxx-blueprint", x: 50, bottom: 14, scale: 0.55 }],
      narration: "DOXX IS CAPTURED.\nRUGGER HAS HIS BLUEPRINTS.",
      subNarration: "FIND RUGGER.\nRECOVER THE BLUEPRINTS.\nRESCUE DOXX.",
      transition: "fade",
    },
  ],
};

export const LEVEL2_DOXX_RESCUE: StoryScene = {
  id: "l2-doxx-rescue",
  kind: "rescue",
  title: "DOXX RESCUED",
  panels: [
    { dialogue: { speaker: "DOXX", text: "WALDOGE! YOU FOUND ME — AND MY BLUEPRINTS!", portrait: "doxx-bust-call" } },
    { dialogue: { speaker: "WALDOGE", text: "Hang tight. Rugger and I are about to have a talk.", portrait: "waldoge" } },
  ],
};
