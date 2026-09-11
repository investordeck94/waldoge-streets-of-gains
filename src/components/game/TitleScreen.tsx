/**
 * TitleScreen — the real main menu for WALDOGE: STREETS OF GAINS.
 *
 * Presentation only. It owns no gameplay state: START/CONTINUE call back into
 * StreetBrawler's existing `startGame`, and SETTINGS mutates the same React
 * settings state that already mirrors into the save file.
 */
import { useState, type FC, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, BookOpen, Settings as SettingsIcon, X, Volume2, VolumeX, Camera } from "lucide-react";
import type { Difficulty } from "@/game/config";
import titleBg from "@/assets/title-financial-city.jpg.asset.json";
import { TitleWaldogeFighter } from "@/components/game/TitleWaldogeFighter";

export interface ContinueInfo {
  available: boolean;
  level: number;
  levelName: string;
  difficulty: Difficulty;
  bestScore: number;
}

interface TitleScreenProps {
  onStart: (diff: Difficulty, startLevel?: number) => void;
  continueInfo: ContinueInfo;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  camPreset: "snappy" | "buttery";
  onCamPreset: (p: "snappy" | "buttery") => void;
  leaderboardSlot?: ReactNode;
}

const DIFFICULTIES: { id: Difficulty; label: string; blurb: string; accent: string }[] = [
  { id: "easy", label: "NEW TO CRYPTO", blurb: "Standard goons · solo boss · full pickups", accent: "border-emerald-400/60 hover:bg-emerald-500/15" },
  { id: "normal", label: "HALF A DEGEN", blurb: "More goons · boss + 2 minions · faster boss", accent: "border-primary/60 hover:bg-primary/15" },
  { id: "blackMonday", label: "FULL TRENCH MODE", blurb: "Max goons · boss + 4 minions · brutal damage", accent: "border-destructive/60 hover:bg-destructive/15" },
];

const CONTROLS: [string, string][] = [
  ["A / D", "Move left & right"],
  ["W / Space", "Jump"],
  ["J", "Punch"],
  ["K", "Kick"],
  ["Q", "Switch fight style"],
  ["Up/Down + Jump", "Climb ladders"],
];

const COMBOS: [string, string][] = [
  ["J → J → K", "Uppercut"],
  ["K → K → J", "Spin Kick"],
  ["J → K → J", "Dash Punch"],
  ["L (in air)", "Ground Pound"],
];

const MenuButton: FC<{
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon: ReactNode;
  label: string;
  hint?: string;
}> = ({ onClick, disabled, primary, icon, label, hint }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "group relative w-full flex items-center gap-4 px-5 py-3 rounded-sm border-2 text-left transition-all duration-200 font-heading tracking-wide shadow-lg",
      "backdrop-blur-md",
      disabled
        ? "border-border/60 bg-background/85 text-muted-foreground cursor-not-allowed"
        : primary
          ? "border-primary bg-destructive/80 text-foreground shadow-[0_0_22px_hsl(var(--destructive)/0.48)] hover:bg-destructive hover:scale-[1.02]"
          : "border-border/80 bg-background/85 text-foreground hover:border-primary/70 hover:bg-background hover:scale-[1.01]",
    ].join(" ")}
  >
    <span className={disabled ? "" : "text-primary"}>{icon}</span>
    <span className="flex-1">
      <span className="block text-base sm:text-lg font-black">{label}</span>
      {hint && <span className="block text-[10px] font-mono text-muted-foreground normal-case">{hint}</span>}
    </span>
  </button>
);

const Modal: FC<{ title: string; onClose: () => void; children: ReactNode }> = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-30 flex items-center justify-center p-3 bg-background/80 backdrop-blur-md"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.94, y: 12 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.96, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md max-h-full overflow-y-auto rounded-xl border border-primary/40 bg-background/95 p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold text-primary tracking-wide">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-muted/50 transition">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export const TitleScreen: FC<TitleScreenProps> = ({
  onStart,
  continueInfo,
  sfxEnabled,
  onToggleSfx,
  camPreset,
  onCamPreset,
  leaderboardSlot,
}) => {
  const [panel, setPanel] = useState<"main" | "difficulty">("main");
  const [modal, setModal] = useState<null | "howto" | "settings">(null);

  return (
    <div className="relative mx-auto flex min-h-[780px] w-full max-w-[680px] flex-col overflow-hidden border border-border/50 sm:min-h-[960px]">
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        <img
          src={titleBg.url}
          alt=""
          aria-hidden
          width={1024}
          height={1536}
          className="h-full w-full object-cover object-center animate-[pulse_9s_ease-in-out_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-transparent to-background/75" />
      </div>

      <div className="relative z-10 flex min-h-[780px] flex-col items-center px-4 py-5 sm:min-h-[960px] sm:px-10 sm:py-8">
        {/* Logotype */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 -rotate-2 text-center"
        >
          <p className="font-mono text-[8px] tracking-[0.38em] text-primary sm:text-[10px]">A WALDOGE ARCADE BEAT-EM-UP</p>
          <h1 className="mt-2 font-heading font-black uppercase italic leading-[0.76] drop-shadow-[0_6px_0_hsl(var(--background))]">
            <span className="block text-6xl text-foreground drop-shadow-[5px_6px_0_hsl(var(--waldoge-red))] sm:text-8xl">WALDOGE</span>
            <span className="block text-[2.55rem] text-foreground drop-shadow-[4px_5px_0_hsl(var(--waldoge-red))] sm:text-[4.5rem]">STREETS OF GAINS</span>
          </h1>
          <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </motion.div>

        {/* Live title fighter — existing game artwork, independent of gameplay. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="relative -mt-4 flex h-[300px] w-full shrink-0 items-end justify-center sm:h-[420px]"
        >
          <div className="absolute bottom-2 h-10 w-64 rounded-[50%] bg-background/80 blur-md" />
          <div className="relative h-full w-full max-w-[560px]">
            <TitleWaldogeFighter />
          </div>
        </motion.div>

        {/* Menu */}
        <div className="relative z-10 -mt-10 flex w-full items-center justify-center sm:-mt-16">
          <div className="w-full max-w-[370px] space-y-2">
            <AnimatePresence mode="wait">
              {panel === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22 }}
                   className="space-y-2.5"
                >
                  <MenuButton primary icon={<Play className="w-5 h-5" />} label="START GAME" onClick={() => setPanel("difficulty")} />
                  <MenuButton
                    icon={<RotateCcw className="w-5 h-5" />}
                    label="CONTINUE"
                    disabled={!continueInfo.available}
                    hint={
                      continueInfo.available
                        ? `Level ${continueInfo.level + 1} — ${continueInfo.levelName} · best ${continueInfo.bestScore}`
                        : "No saved progress yet"
                    }
                    onClick={
                      continueInfo.available
                        ? () => onStart(continueInfo.difficulty, continueInfo.level)
                        : undefined
                    }
                  />
                  <MenuButton icon={<BookOpen className="w-5 h-5" />} label="HOW TO PLAY" onClick={() => setModal("howto")} />
                  <MenuButton icon={<SettingsIcon className="w-5 h-5" />} label="SETTINGS" onClick={() => setModal("settings")} />
                </motion.div>
              ) : (
                <motion.div
                  key="difficulty"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.22 }}
                   className="space-y-2"
                >
                  <p className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground text-center">CHOOSE DIFFICULTY</p>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onStart(d.id)}
                      className={`w-full rounded-lg border bg-background/50 backdrop-blur-sm px-5 py-3 text-left transition-all hover:translate-x-1 ${d.accent}`}
                    >
                      <span className="block font-heading text-sm font-bold text-foreground">{d.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{d.blurb}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setPanel("main")}
                    className="w-full text-[11px] font-mono text-muted-foreground hover:text-primary transition py-2"
                  >
                    ← BACK
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {leaderboardSlot && <div className="mt-5 hidden w-full max-w-md mx-auto sm:block">{leaderboardSlot}</div>}

        <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
          7 districts · 7 bosses · one very good dog
        </p>
      </div>

      <AnimatePresence>
        {modal === "howto" && (
          <Modal title="HOW TO PLAY" onClose={() => setModal(null)}>
            <p className="text-xs text-muted-foreground mb-4">
              Fight through 7 districts of red-candle goons. Each district ends with a tougher boss — survive them all.
            </p>
            <p className="font-mono text-[10px] tracking-widest text-primary mb-2">CONTROLS</p>
            <div className="space-y-1 mb-4">
              {CONTROLS.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-border/30 py-1">
                  <span className="font-mono text-foreground">{k}</span>
                  <span className="text-muted-foreground">{v}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] tracking-widest text-primary mb-2">SPECIAL COMBOS</p>
            <div className="space-y-1 mb-4">
              {COMBOS.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs border-b border-border/30 py-1">
                  <span className="font-mono text-foreground">{k}</span>
                  <span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              On mobile, use the on-screen pad: move, jump, punch and kick. Jump at a ladder to climb.
            </p>
          </Modal>
        )}

        {modal === "settings" && (
          <Modal title="SETTINGS" onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Sound effects</p>
                  <p className="text-[10px] text-muted-foreground">Hits, combos and impacts</p>
                </div>
                <button
                  onClick={onToggleSfx}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-bold transition ${
                    sfxEnabled ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
                  }`}
                >
                  {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {sfxEnabled ? "ON" : "OFF"}
                </button>
              </div>

              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Camera feel
                </p>
                <p className="text-[10px] text-muted-foreground mb-2">How tightly the camera follows Waldoge</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["snappy", "buttery"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => onCamPreset(p)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition ${
                        camPreset === p ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
