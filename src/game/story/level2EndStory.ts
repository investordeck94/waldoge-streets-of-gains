import type { StoryScene } from "./storyTypes";

/**
 * Level 2 ending → Level 3 setup. Plays after Rugger is defeated, before
 * Level 3 starts. Bad Actor only ever appears as a caller (portrait), never
 * beside Waldoge.
 */
export const LEVEL2_ENDING_BAD_ACTOR_CALL: StoryScene = {
  id: "l2-end-bad-actor-call",
  kind: "level-complete",
  title: "LEVEL 2 COMPLETE — THE BAD ACTOR CALL",
  panels: [
    {
      background: "bg-rugger-cell",
      narration: "RUGGER IS DOWN… BUT STILL TALKING.",
      dialogue: { speaker: "RUGGER", text: "I WAS ONLY WORKING ON\n★ BAD ACTOR'S ★ ORDERS…", portrait: "rugger-head" },
      transition: "fade",
    },
    {
      background: "bg-l2-call",
      characters: [
        { art: "cut-waldoge", x: 40, bottom: 0, scale: 0.78 },
        { art: "doxx-phone", x: 64, bottom: 48, scale: 0.2, rotate: 12 },
      ],
      narration: "...RING... RING...",
      subNarration: "UNKNOWN CALLER — WALDOGE ANSWERS.",
    },
    {
      background: "bg-studio-captive",
      characters: [
        { art: "sus-caged-stand", x: 32, bottom: 4, scale: 0.82 },
        { art: "filf-caged", x: 70, bottom: 4, scale: 0.8 },
      ],
      subNarration: "THE CALLER IS BAD ACTOR. SUS DOG AND FILF ARE ALIVE — HELD AGAINST THEIR WILL.",
      dialogue: { speaker: "BAD ACTOR", text: "I'VE GOT SUS DOG AND FILF. I'M HOLDING THEM CAPTIVE…", portrait: "badactor-head" },
    },
    {
      background: "bg-old-theatre",
      characters: [{ art: "cut-sus-dog", x: 30, bottom: 2, scale: 0.6 }],
      narration: "SUS DOG THOUGHT SOMETHING\nSUS WAS GOING ON\nAROUND THE OLD MOVIE THEATRE…",
      subNarration: "SO HE WENT TO CHECK IT OUT.",
    },
    {
      background: "bg-studio-captive",
      characters: [{ art: "sus-tied", x: 50, bottom: 6, scale: 0.55 }],
      narration: "★ SUS'TER ACT: THE MOVIE ★",
      dialogue: { speaker: "BAD ACTOR", text: "AND NOW I'M GOING TO MAKE THEM STAR IN… SUS'TER ACT: THE MOVIE.", portrait: "badactor-head" },
    },
    {
      background: "bg-l2-call",
      characters: [{ art: "cut-waldoge", x: 50, bottom: 0, scale: 0.78 }],
      dialogue: { speaker: "BAD ACTOR", text: "IF YOU WANT THEM BACK… COME FIND ME.", portrait: "badactor-head" },
      subNarration: "*CLICK* — CALL DISCONNECTED.",
    },
    {
      background: "bg-old-theatre",
      narration: "WALDOGE HAS A NEW MISSION.",
      subNarration: "FIND BAD ACTOR.\nRESCUE SUS DOG.\nRESCUE FILF.",
      transition: "fade",
    },
  ],
};
