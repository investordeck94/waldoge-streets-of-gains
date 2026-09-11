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
import titleBg from "@/assets/title-screen-bg.jpg";
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
      "group relative w-full flex items-center gap-3 px-5 py-3.5 rounded-lg border text-left transition-all duration-200 font-heading tracking-wide",
      "backdrop-blur-sm",
      disabled
        ? "border-border/40 bg-background/40 text-muted-foreground cursor-not-allowed"
        : primary
          ? "border-primary bg-primary/20 text-foreground hover:bg-primary/35 hover:translate-x-1"
          : "border-border/60 bg-background/50 text-foreground hover:border-primary/70 hover:bg-primary/10 hover:translate-x-1",
    ].join(" ")}
  >
    <span className={disabled ? "" : "text-primary"}>{icon}</span>
    <span className="flex-1">
      <span className="block text-sm sm:text-base font-bold">{label}</span>
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
    <div className="relative w-full overflow-hidden rounded-xl border border-border/50 min-h-[78svh] flex flex-col">
      {/* Cinematic backdrop */}
      <div className="absolute inset-0">
        <img
          src={titleBg}
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center scale-105 animate-[pulse_9s_ease-in-out_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent,hsl(var(--background))_78%)]" />
        <div
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, hsl(var(--foreground)/0.5) 0px, hsl(var(--foreground)/0.5) 1px, transparent 1px, transparent 3px)" }}
        />
      </div>

      <div className="relative z-10 grid min-h-[78svh] grid-rows-[auto_minmax(150px,0.75fr)_auto_auto] px-4 py-5 sm:grid-cols-[minmax(260px,0.8fr)_minmax(300px,0.62fr)] sm:grid-rows-[auto_1fr_auto] sm:px-8 sm:py-8 lg:px-12">
        {/* Logotype */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center sm:col-span-2"
        >
          <p className="font-mono text-[9px] sm:text-xs tracking-[0.4em] text-muted-foreground">A WALDOGE ARCADE BEAT-EM-UP</p>
          <h1 className="mt-1 font-heading font-black uppercase leading-[0.82]">
            <span className="block text-4xl sm:text-6xl text-foreground drop-shadow-[3px_4px_0_hsl(var(--waldoge-red))]">WALDOGE</span>
            <span className="block text-[2rem] sm:text-6xl text-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.55)]">STREETS OF GAINS</span>
          </h1>
          <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </motion.div>

        {/* Live title fighter — existing game artwork, independent of gameplay. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="relative flex min-h-0 items-end justify-center sm:row-start-2"
        >
          <div className="absolute bottom-5 h-10 w-52 rounded-[50%] bg-background/70 blur-md" />
          <div className="relative h-full max-h-[330px] w-full max-w-[440px]">
            <TitleWaldogeFighter />
          </div>
        </motion.div>

        {/* Menu */}
        <div className="flex items-center justify-center sm:row-start-2 sm:py-4">
          <div className="w-full max-w-sm space-y-2">
            <AnimatePresence mode="wait">
              {panel === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22 }}
                   className="space-y-2"
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

        {leaderboardSlot && <div className="mt-3 w-full max-w-md mx-auto sm:col-span-2">{leaderboardSlot}</div>}

        <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground sm:col-span-2">
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
