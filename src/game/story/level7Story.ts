import type { StoryCharacter, StoryPanelData, StoryScene } from "./storyTypes";

/**
 * LEVEL 7 OPENING — THE CITADEL. Nine chapters from the supplied brief, one
 * speech bubble per screen. Ticker Taker uses his in-game sprite; every other
 * character uses existing canonical art.
 */
const T = "arcade-cinematic" as const;
const BG = "bg-l7-citadel";
type B = NonNullable<NonNullable<StoryPanelData["dialogue"]>["bubble"]>;
const ch = (art: string, x: number, scale: number, dimmed = false, flip = false): StoryCharacter => ({ art, x, bottom: 2, scale, dimmed, flip });

const TT = "ep-ticker-idle", FW = "l7-fatcat-white-idle", FB = "l7-fatcat-black-idle";

const line = (title: string, characters: StoryCharacter[], speaker: string, portrait: string, text: string, bubble: B, extra: Partial<StoryPanelData> = {}): StoryPanelData => ({
  treatment: T, panelTitle: title, background: BG, characters, dialogue: { speaker, portrait, text, bubble }, ...extra,
});
const many = (title: string, chars: StoryCharacter[], speaker: string, portrait: string, lines: string[], bubble: B) =>
  lines.map((t, i) => line(title, chars, speaker, portrait, t, bubble, i === 0 ? { transition: "fade" } : {}));

// Casts
const solo = [ch(TT, 50, 0.72)];
const soloB: B = { x: 50, y: 6, tailX: 50, tailY: 26 };

const kidnap = [ch("l7-anon-cage", 50, 0.5, true), ch(FW, 16, 0.5, true), ch(FB, 84, 0.52, true, true), ch(TT, 32, 0.6)];
const kidnapB: B = { x: 34, y: 6, tailX: 32, tailY: 36 };

const promo = (s: "TT" | "F1" | "F2") => [ch(FW, 20, 0.56, s !== "F1"), ch(TT, 50, 0.64, s !== "TT"), ch(FB, 80, 0.58, s !== "F2", true)];
const promoB = { TT: { x: 50, y: 6, tailX: 50, tailY: 32 }, F1: { x: 26, y: 10, tailX: 20, tailY: 40 }, F2: { x: 72, y: 10, tailX: 80, tailY: 40 } } as const;

const listCast = (s: "F1" | "F2") => [ch(FW, 18, 0.52, s !== "F1"), ch(FB, 82, 0.54, s !== "F2", true)];

const arrive = (s: "F1" | "F2") => [ch("cut-waldoge", 20, 0.66, true), ch(FW, 58, 0.56, s !== "F1", true), ch(FB, 82, 0.58, s !== "F2", true)];
const arriveB = { F1: { x: 56, y: 8, tailX: 58, tailY: 38 }, F2: { x: 70, y: 8, tailX: 82, tailY: 38 } } as const;

const twins = [ch("cut-waldoge", 24, 0.66, true), ch(TT, 74, 0.7, false, true)];
const twinB: B = { x: 66, y: 6, tailX: 74, tailY: 28 };

const TARGET_LIST = "TARGET LIST\n1. WALDOGE\n2. ANON\n3. FILF\n4. MONKO\n5. 420 BLAZE IT\n6. BADDIE\n7. SUS DOG";

export const LEVEL7_OPENING_CITADEL: StoryScene = {
  id: "l7-opening-citadel",
  kind: "level-intro",
  title: "LEVEL 7 — THE CITADEL",
  panels: [
    { treatment: T, panelTitle: "LEVEL 7 — THE CITADEL", background: BG, narration: "FOR YEARS, THE ANONVERSE LIVED FREE.", subNarration: "BUT SOMEONE HAS BEEN WATCHING.", transition: "fade" },
    { treatment: T, panelTitle: "THE ANONVERSE IS UNDER ATTACK", background: BG, narration: "EVERY BOSS WALDOGE DEFEATED... EVERY GOON HE FOUGHT...", subNarration: "EVERY FRIEND HE RESCUED..." },
    { treatment: T, panelTitle: "THE ANONVERSE IS UNDER ATTACK", background: BG, narration: "WAS PART OF SOMETHING MUCH BIGGER." },

    ...many("THE ONE BEHIND IT ALL", solo, "TICKER TAKER", TT, [
      "WALDOGE THINKS HE'S BEEN FIGHTING CRIMINALS.", "HE HASN'T.", "HE'S BEEN FIGHTING ME.",
      "EVERY BOSS. EVERY GOON. EVERYONE HE RESCUED.", "IT ALL LED HIM HERE.", "AND NOW... I'M DONE PLAYING GAMES.",
    ], soloB),

    ...many("THE MAYOR IS TAKEN", kidnap, "TICKER TAKER", TT, [
      "THE ANONVERSE NEEDS A LEADER.", "AND IF THEY WON'T FOLLOW ME...", "I'LL TAKE THEIR LEADER INSTEAD.",
    ], kidnapB),

    ...many("THE FAT CATS' PROMOTION", promo("TT"), "TICKER TAKER", TT, ["FAT CATS.", "TAKE THE ANONVERSE.", "IF YOU CAN TAKE CONTROL OF IT... YOU CAN RUN IT."], promoB.TT),
    line("THE FAT CATS' PROMOTION", promo("F1"), "FAT CAT 1", FW, "YOU HEARD HIM. THE ANONVERSE IS OURS.", promoB.F1),
    line("THE FAT CATS' PROMOTION", promo("F2"), "FAT CAT 2", FB, "WE RUN THE STREETS. WE RUN THE MARKETS.", promoB.F2),
    line("THE FAT CATS' PROMOTION", promo("F2"), "FAT CAT 2", FB, "NOW WE RUN THE ANONVERSE.", promoB.F2),

    line("TARGET LIST", listCast("F1"), "FAT CAT 1", FW, "THESE ARE THE ONES STANDING IN OUR WAY.", promoB.F1, { narration: TARGET_LIST, transition: "fade" }),
    line("TARGET LIST", listCast("F2"), "FAT CAT 2", FB, "WE GAVE THE ORDERS... ON BEHALF OF TICKER TAKER.", promoB.F2, { narration: TARGET_LIST }),
    line("TARGET LIST", listCast("F1"), "FAT CAT 1", FW, "AND YOU'RE NUMBER ONE.", promoB.F1, { narration: TARGET_LIST }),

    line("WALDOGE ARRIVES", arrive("F1"), "FAT CAT 1", FW, "LOOK WHO FINALLY SHOWED UP.", arriveB.F1, { transition: "fade" }),
    line("WALDOGE ARRIVES", arrive("F2"), "FAT CAT 2", FB, "WE WERE WONDERING WHEN YOU'D COME FOR YOUR LITTLE FRIENDS.", arriveB.F2),

    ...many("THE TWIN REVEALED", twins, "TICKER TAKER", TT, [
      "YOU REALLY DON'T REMEMBER ME...", "OF COURSE YOU DON'T.", "I'M YOUR BROTHER.", "YOUR LONG-LOST TWIN.",
      "WHILE EVERYONE LOVED YOU... I WATCHED.", "AND EVERY TIME THEY CHOSE YOU... I HATED YOU A LITTLE MORE.",
      "YOU HAD EVERYTHING I NEVER HAD.", "SO I DECIDED... IF I COULDN'T HAVE IT... NEITHER COULD YOU.",
    ], twinB),

    ...many("THE FINAL CONFRONTATION", twins, "TICKER TAKER", TT, [
      "YOU'RE CHAOS. I'M CONTROL.", "YOU GIVE PEOPLE HOPE. I GIVE THEM FEAR.",
      "YOU BUILT THE ANONVERSE... I'M GOING TO DESTROY IT.", "AND I'M GOING TO DESTROY YOU.", "WELCOME TO THE END.",
    ], twinB),

    {
      treatment: T, panelTitle: "LEVEL 7 OBJECTIVES", background: BG, transition: "fade",
      narration: "ANON, THE MAYOR OF THE ANONVERSE, HAS BEEN KIDNAPPED BY TICKER TAKER AND THE FAT CATS.",
      subNarration: "DEFEAT THE FAT CATS • OBTAIN THE KEY • RESCUE ANON • FIND AND DEFEAT TICKER TAKER",
    },
  ],
};
