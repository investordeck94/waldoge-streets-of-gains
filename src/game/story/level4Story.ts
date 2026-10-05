import type { StoryScene } from "./storyTypes";

export const LEVEL4_OPENING_FUDDER_REVEAL: StoryScene = {
  id: "l4-opening-fudder-reveal",
  kind: "opening",
  title: "LEVEL 4 — FUDDER'S WORLD",
  panels: [
    {
      background: "bg-fudder-world",
      narration: "FUDDER HAD HIS OWN WORLD…",
      subNarration: "AND IN HIS WORLD,\nHE CONTROLLED THE NARRATIVE.",
      transition: "fade",
    },
    {
      background: "bg-fudder-world",
      narration: "JEET AND RUGGER\nBOTH WORKED FOR HIM.",
      subNarration: "AND BAD ACTOR\nWAS HIS RIGHT-HAND MAN.",
    },
    {
      background: "bg-fudder-world",
      characters: [{ art: "baddie-caged", x: 50, bottom: 1, scale: 0.86 }],
      narration: "BADDIE HAD BEEN CAPTURED.",
      subNarration: "LOCKED BEHIND BARS IN FUDDER'S WORLD.",
    },
    {
      background: "bg-fudder-world",
      characters: [
        { art: "fudder-story", x: 27, bottom: 0, scale: 0.9 },
        { art: "baddie-caged", x: 72, bottom: 1, scale: 0.72 },
      ],
      dialogue: { speaker: "FUDDER", text: "DON'T WORRY, BADDIE…\nI'LL MAKE SURE EVERYONE KNOWS WALDOGE IS A JUST A SHIT COIN.\nI HAVE POWERFUL FRIENDS." },
    },
    {
      background: "bg-fudder-world",
      characters: [
        { art: "fudder-story", x: 27, bottom: 0, scale: 0.9 },
        { art: "baddie-caged", x: 72, bottom: 1, scale: 0.72 },
      ],
      dialogue: { speaker: "FUDDER", text: "LET ME SPEAK TO THIS WALDOGE WHO'S BEEN CAUSING ALL MY PEOPLE PROBLEMS.\nLET'S SEE IF HE CAN RESCUE YOU THIS TIME." },
    },
    {
      background: "bg-fudder-world",
      characters: [
        { art: "fudder-story", x: 30, bottom: 0, scale: 0.96 },
        { art: "baddie-caged", x: 75, bottom: 1, scale: 0.6, dimmed: true },
      ],
      narration: "FUDDER HAD BEEN\nWATCHING WALDOGE ALL ALONG.",
      subNarration: "AND NOW…\nHE WAS MAKING IT PERSONAL.",
      transition: "fade",
    },
  ],
};

export const LEVEL4_BADDIE_RESCUE: StoryScene = {
  id: "l4-baddie-rescue",
  kind: "rescue",
  title: "BADDIE RESCUED",
  panels: [
    {
      background: "bg-fudder-world",
      characters: [{ art: "baddie-thankful", x: 50, bottom: 0, scale: 0.86 }],
      dialogue: { speaker: "BADDIE", text: "YOU FOUND THE KEY! I KNEW FUDDER COULDN'T KEEP ME CAGED FOREVER.", portrait: "baddie-worried" },
    },
    {
      dialogue: { speaker: "WALDOGE", text: "Get somewhere safe. I'm ending Fudder's story next.", portrait: "waldoge" },
    },
  ],
};