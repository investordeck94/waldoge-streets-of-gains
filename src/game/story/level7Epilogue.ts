import type { StoryCharacter, StoryPanelData, StoryScene } from "./storyTypes";

/**
 * FINAL CAMPAIGN EPILOGUE — plays once after Ticker Taker falls at the end of
 * Level 7. Composition follows the supplied six-panel ending storyboard;
 * every character is the canonical project asset (never the storyboard art).
 * One speech bubble per screen, so multi-speaker panels are split into
 * consecutive screens sharing the panel title.
 */
const T = "arcade-cinematic" as const;
type B = NonNullable<NonNullable<StoryPanelData["dialogue"]>["bubble"]>;

const ch = (art: string, x: number, scale: number, dimmed = false, bottom = 2): StoryCharacter => ({ art, x, bottom, scale, dimmed });

// ---- Panel 1: villains down, police arriving ----
const p1 = (speaker: "TT" | "W"): StoryCharacter[] => [
  ch("ep-fatcat-white-defeat", 13, 0.26, speaker === "W" ? false : true),
  ch("ep-fatcat-black-defeat", 36, 0.24, speaker === "W" ? false : true),
  ch("ep-ticker-defeat", 60, 0.3, speaker === "W"),
  ch("cut-waldoge", 84, 0.78, speaker === "TT"),
];
const ttBubble: B = { x: 52, y: 16, tailX: 56, tailY: 70 };
const wBubble1: B = { x: 72, y: 12, tailX: 82, tailY: 22 };

// ---- Panel 2: celebration crowd, Waldoge centre ----
const crowd = (focus: "anon" | "all"): StoryCharacter[] => [
  ch("cut-dobermann", 6, 0.5, true, 4),
  ch("cut-dogevan", 92, 0.5, true, 4),
  ch("cut-420-blaze-it", 80, 0.5, focus === "anon", 3),
  ch("cut-baddie", 68, 0.52, focus === "anon", 2),
  ch("cut-sus-dog", 18, 0.48, focus === "anon", 3),
  ch("cut-doxx", 32, 0.42, focus === "anon", 2),
  ch("cut-monko", 61, 0.4, focus === "anon", 1),
  ch("l6-sq-idle", 40, 0.32, focus === "anon", 30),
  ch("cut-filf", 27, 0.44, focus === "anon", 0),
  ch("cut-waldoge", 50, 0.68, focus === "anon", 0),
  ch("l7-anon-rescued", 14, 0.42, focus !== "anon", 0),
];

// ---- Panel 3: Squirrel belongs ----
const friends = (speaker: "SQ" | "W"): StoryCharacter[] => [
  ch("cut-filf", 70, 0.5, true, 2),
  ch("cut-monko", 86, 0.46, true, 2),
  ch("cut-doxx", 10, 0.42, true, 2),
  ch("cut-waldoge", 46, 0.78, speaker === "SQ", 0),
  ch("l6-sq-idle", 24, 0.5, speaker === "W", 0),
];
const sqBubble: B = { x: 28, y: 16, tailX: 24, tailY: 44 };
const wBubble3: B = { x: 72, y: 14, tailX: 50, tailY: 22 };

// ---- Panel 4: back into hiding ----
const hide = (speaker: "A" | "W"): StoryCharacter[] => [
  ch("l7-anon-rescued", 22, 0.48, speaker === "W"),
  ch("cut-waldoge", 70, 0.78, speaker === "A"),
];
const aBubble: B = { x: 30, y: 16, tailX: 22, tailY: 50 };
const wBubble4: B = { x: 56, y: 16, tailX: 68, tailY: 22 };

// ---- Panel 5: and just like that... ----
const search = (speaker: "SUS" | "MONKO" | "FILF"): StoryCharacter[] => [
  { art: "cut-waldoge", x: 76, bottom: 30, scale: 0.12, dimmed: true },
  ch("cut-filf", 52, 0.5, speaker !== "FILF"),
  ch("cut-monko", 34, 0.46, speaker !== "MONKO"),
  ch("cut-sus-dog", 14, 0.6, speaker !== "SUS"),
];
const susBubble: B = { x: 28, y: 16, tailX: 16, tailY: 36 };
const monkoBubble: B = { x: 40, y: 16, tailX: 34, tailY: 52 };
const filfBubble: B = { x: 62, y: 16, tailX: 52, tailY: 48 };

const panel = (title: string, background: string, characters: StoryCharacter[], speaker: string, portrait: string, text: string, bubble: B, extra: Partial<StoryPanelData> = {}): StoryPanelData => ({
  treatment: T, panelTitle: title, background, characters, dialogue: { speaker, portrait, text, bubble }, ...extra,
});

const P1 = "THE VILLAINS ARE DOWN";
const P2 = "THE ANONVERSE IS FREE";
const P3 = "FRIENDS TOGETHER AGAIN";
const P4 = "TIME TO GO BACK INTO HIDING";
const P5 = "AND JUST LIKE THAT...";

export const LEVEL7_FINAL_EPILOGUE: StoryScene = {
  id: "l7-final-epilogue",
  kind: "level-complete",
  title: "EPILOGUE — WALDOGE: STREETS OF GAINS",
  panels: [
    panel(P1, "bg-ep-arrest", p1("TT"), "TICKER TAKER", "ep-ticker-idle", "THIS ISN'T OVER, WALDOGE.", ttBubble, { transition: "fade" }),
    panel(P1, "bg-ep-arrest", p1("TT"), "TICKER TAKER", "ep-ticker-idle", "YOU HAVEN'T SEEN THE LAST OF ME.", ttBubble),
    panel(P1, "bg-ep-arrest", p1("W"), "WALDOGE", "waldoge", "BYE, FELICIA.", wBubble1),

    panel(P2, "bg-ep-celebration", crowd("anon"), "ANON", "l7-anon-rescued", "THE ANONVERSE IS FREE!", { x: 22, y: 30, tailX: 14, tailY: 52 }, { transition: "fade" }),
    panel(P2, "bg-ep-celebration", crowd("all"), "EVERYONE", "waldoge", "WE DID IT!", { x: 76, y: 30, tailX: 60, tailY: 52 }),

    panel(P3, "bg-ep-friends", friends("SQ"), "SQUIRREL", "l6-sq-portrait", "I NEVER THOUGHT I'D BE STANDING HERE WITH EVERYONE...", sqBubble, { transition: "fade" }),
    panel(P3, "bg-ep-friends", friends("W"), "WALDOGE", "waldoge", "YOU'RE ONE OF US, SQUIRREL.", wBubble3),

    panel(P4, "bg-ep-hiding", hide("A"), "ANON", "l7-anon-rescued", "YOU SAVED ALL OF US.", aBubble, { transition: "fade" }),
    panel(P4, "bg-ep-hiding", hide("W"), "WALDOGE", "waldoge", "WE ALL DID OUR PART.", wBubble4),
    panel(P4, "bg-ep-hiding", hide("W"), "WALDOGE", "waldoge", "BUT I'VE GOT A FEELING THE ANONVERSE WILL BE FINE FOR A WHILE.", wBubble4),
    panel(P4, "bg-ep-hiding", hide("A"), "ANON", "l7-anon-rescued", "SO WHAT NOW?", aBubble),
    panel(P4, "bg-ep-hiding", hide("W"), "WALDOGE", "waldoge", "NOW?", wBubble4),
    panel(P4, "bg-ep-hiding", hide("W"), "WALDOGE", "waldoge", "IT'S TIME FOR ME TO GO BACK INTO HIDING.", wBubble4),

    panel(P5, "bg-ep-alley", search("SUS"), "SUS DOG", "char-sus-dog", "WAIT... WHERE DID WALDOGE GO?!", susBubble, { transition: "fade" }),
    panel(P5, "bg-ep-alley", search("MONKO"), "MONKO", "monko-portrait-normal", "HE'S PROBABLY PLAYING HIDE AND SEEK AGAIN.", monkoBubble),
    panel(P5, "bg-ep-alley", search("FILF"), "FILF", "filf-happy", "CLASSIC WALDOGE.", filfBubble),
    panel(P5, "bg-ep-alley", search("SUS"), "SUS DOG", "char-sus-dog", "I KNEW IT. TIME TO START LOOKING AGAIN...", susBubble),

    {
      treatment: T, panelTitle: "THE END... FOR NOW.", background: "bg-ep-alley",
      characters: [
        { art: "cut-waldoge", x: 52, bottom: 26, scale: 0.16, dimmed: true },
        { art: "ep-logo", x: 50, bottom: 50, scale: 0.42 },
      ],
      narration: "THE END... FOR NOW.",
      subNarration: "THE ANONVERSE WILL NEVER BE THE SAME.",
      transition: "fade",
    },
  ],
};
