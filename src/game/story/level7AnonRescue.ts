import type { StoryScene } from "./storyTypes";

const T = "arcade-cinematic" as const;
const BG = "bg-l7-citadel";
const W = "WALDOGE";
const anon = (dimmed: boolean) => ({ art: "l7-anon-rescued", x: 70, bottom: 2, scale: 0.5, dimmed });
const wal = (dimmed: boolean, flip = false) => ({ art: "cut-waldoge", x: 26, bottom: 2, scale: 0.66, dimmed, flip });
const anonBubble = { x: 38, y: 10, tailX: 68, tailY: 46 };
const walBubble = { x: 60, y: 10, tailX: 28, tailY: 40 };

/** Plays once, right after Anon's cage is unlocked in Level 7. */
export const LEVEL7_ANON_RESCUE: StoryScene = {
  id: "l7-anon-rescue",
  kind: "rescue",
  title: "ANON RESCUED",
  panels: [
    { treatment: T, panelTitle: "THE MAYOR IS FREE", background: BG, characters: [wal(true), anon(false)],
      dialogue: { speaker: "ANON", portrait: "l7-anon-rescued", text: "I KNEW YOU'D COME, WALDOGE.", bubble: anonBubble }, transition: "fade" },
    { treatment: T, panelTitle: "THE MAYOR IS FREE", background: BG, characters: [wal(true), anon(false)],
      dialogue: { speaker: "ANON", portrait: "l7-anon-rescued", text: "I ALWAYS KNEW YOU'D BE THERE TO HELP US.", bubble: anonBubble } },
    { treatment: T, panelTitle: "THE MAYOR IS FREE", background: BG, characters: [wal(false), anon(true)],
      dialogue: { speaker: W, portrait: "waldoge", text: "DON'T MENTION IT.", bubble: walBubble } },
    { treatment: T, panelTitle: "ONE OF US GOES DOWN", background: BG, characters: [wal(false), anon(true)],
      dialogue: { speaker: W, portrait: "waldoge", text: "RIGHT NOW, I HAVE AN ENTITLED DOPPELGÄNGER TO TEACH A LESSON.", bubble: walBubble } },
    { treatment: T, panelTitle: "ONE OF US GOES DOWN", background: BG, characters: [wal(false), anon(true)],
      dialogue: { speaker: W, portrait: "waldoge", text: "THIS ENDS WITH ONE OF US GOING DOWN.", bubble: walBubble } },
    { treatment: T, panelTitle: "ONE OF US GOES DOWN", background: BG, characters: [wal(false), anon(true)],
      dialogue: { speaker: W, portrait: "waldoge", text: "AND I CAN PROMISE YOU ONE THING...", bubble: walBubble }, transition: "fade" },
    { treatment: T, panelTitle: "ONE OF US GOES DOWN", background: BG, characters: [wal(false), anon(true)],
      dialogue: { speaker: W, portrait: "waldoge", text: "IT WON'T BE ME.", bubble: walBubble } },
  ],
};
