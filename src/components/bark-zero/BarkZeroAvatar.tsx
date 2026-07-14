import { FC, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import avatarAsset from "@/assets/bark-zero-avatar.png.asset.json";
const avatarSrc = avatarAsset.url;

export type BarkZeroAvatarState = "idle" | "thinking" | "speaking";

interface Props {
  state?: BarkZeroAvatarState;
  /** 0..1 microphone amplitude when state="speaking" */
  amplitude?: number;
  /** Briefly triggers the "> SIGNAL DETECTED" pulse when toggled true. */
  signal?: boolean;
  className?: string;
}

// Feature coordinates in % of the 1254x1254 source image
const EYE_L = { cx: 43.5, cy: 36.5, rx: 3.1, ry: 2.2 };
const EYE_R = { cx: 56.5, cy: 36.5, rx: 3.1, ry: 2.2 };
const POM   = { cx: 50, cy: 7.5, r: 2.4 };
const MOUTH = { cx: 50, cy: 55, rx: 6, ry: 2 };
const KEYS  = [
  // rough grid across keyboard band
  ...Array.from({ length: 12 }, (_, i) => ({ x: 15 + i * 5.8, y: 86 })),
  ...Array.from({ length: 11 }, (_, i) => ({ x: 17 + i * 5.8, y: 90 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: 20 + i * 5.8, y: 94 })),
];
// Cursor after ZERO_
const CURSOR = { x: 74.5, y: 78, w: 3.2, h: 4.5 };

export const BarkZeroAvatar: FC<Props> = ({
  state = "idle",
  amplitude = 0,
  signal = false,
  className,
}) => {
  const reduce = useReducedMotion();
  const [showSignal, setShowSignal] = useState(false);
  const signalTimer = useRef<number | null>(null);
  const [tabVisible, setTabVisible] = useState(true);

  // Pause when tab hidden
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!signal) return;
    setShowSignal(true);
    if (signalTimer.current) window.clearTimeout(signalTimer.current);
    signalTimer.current = window.setTimeout(() => setShowSignal(false), 1400);
    return () => {
      if (signalTimer.current) window.clearTimeout(signalTimer.current);
    };
  }, [signal]);

  const thinking = state === "thinking";
  const speaking = state === "speaking";
  const active = tabVisible && !reduce;

  // eye blink cadence (idle) — random by adding key
  const [blinkKey, setBlinkKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t: number;
    const schedule = () => {
      const wait = 4000 + Math.random() * 4000;
      t = window.setTimeout(() => {
        setBlinkKey((k) => k + 1);
        schedule();
      }, wait);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [active]);

  // Ear twitch occasional
  const [twitchL, setTwitchL] = useState(0);
  const [twitchR, setTwitchR] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t: number;
    const schedule = () => {
      const wait = 6000 + Math.random() * 6000;
      t = window.setTimeout(() => {
        if (Math.random() > 0.5) setTwitchL((v) => v + 1);
        else setTwitchR((v) => v + 1);
        schedule();
      }, wait);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [active]);

  // Mouth opening driven by amplitude when speaking
  const mouthOpen = speaking ? 1 + Math.min(1, amplitude) * 2.2 : 1;

  // Randomised thinking key pulses
  const [thinkTick, setThinkTick] = useState(0);
  useEffect(() => {
    if (!thinking || !active) return;
    const id = window.setInterval(() => setThinkTick((t) => t + 1), 110);
    return () => window.clearInterval(id);
  }, [thinking, active]);

  // Precompute particle offsets
  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    delay: (i * 0.35) % 3,
  }));

  return (
    <div className={"relative mx-auto w-full max-w-md aspect-square " + (className ?? "")}
         aria-label="Bark Zero avatar">
      {/* Ambient red glow (stronger when speaking / signal) */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,40,40,0.28), transparent 60%)" }}
        animate={active
          ? {
              opacity: speaking ? [0.4, 0.75, 0.4] : thinking ? [0.25, 0.5, 0.25] : [0.15, 0.28, 0.15],
              scale: speaking ? [0.95, 1.05, 0.95] : [0.97, 1.02, 0.97],
            }
          : { opacity: 0.2 }}
        transition={{ duration: speaking ? 1.2 : 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Breathing wrapper */}
      <motion.div
        className="relative w-full h-full"
        animate={active ? { y: [0, -2, 0] } : { y: 0 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Base logo — never redesigned */}
        {/* Base logo — screen-blended so the pure black background drops out
            and only the red/white ASCII strokes remain, blending naturally
            with whatever surface sits behind the avatar. A soft radial mask
            feathers the edges so the square image never shows a hard seam. */}
        <img
          src={avatarSrc}
          alt="Bark Zero"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{
            mixBlendMode: "screen",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 50%, #000 55%, rgba(0,0,0,0.75) 72%, transparent 92%)",
            maskImage:
              "radial-gradient(circle at 50% 50%, #000 55%, rgba(0,0,0,0.75) 72%, transparent 92%)",
          }}
        />

        {/* SVG overlay — animated pieces */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Pom-pom subtle sway */}
          <motion.circle
            cx={POM.cx}
            cy={POM.cy}
            r={POM.r}
            fill="transparent"
            stroke="rgba(255,80,80,0.55)"
            strokeDasharray="1 1.2"
            strokeWidth="0.35"
            animate={active ? { cx: [POM.cx - 0.4, POM.cx + 0.4, POM.cx - 0.4] } : {}}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Ear twitches — rotate tiny amount around ear base */}
          <motion.g
            key={"eL-" + twitchL}
            style={{ originX: "34%", originY: "22%" } as any}
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -2.5, 0] }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
          <motion.g
            key={"eR-" + twitchR}
            style={{ originX: "66%", originY: "22%" } as any}
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 2.5, 0] }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          {/* Eyes — black rects masking the eye area on blink.
              Thinking = eyes scan L/R. Signal = brighten. */}
          {[EYE_L, EYE_R].map((e, i) => (
            <g key={i}>
              {/* brighten pulse on signal */}
              {showSignal && (
                <motion.ellipse
                  cx={e.cx}
                  cy={e.cy}
                  rx={e.rx * 1.3}
                  ry={e.ry * 1.3}
                  fill="rgba(255,60,60,0.35)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              )}
              {/* scan pupil during thinking */}
              {thinking && (
                <motion.circle
                  cx={e.cx}
                  cy={e.cy}
                  r={0.55}
                  fill="rgba(255,90,90,0.9)"
                  animate={{ cx: [e.cx - 1.2, e.cx + 1.2, e.cx - 1.2] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              {/* Blink shutter — covers eye area with black */}
              <motion.rect
                key={"blink-" + blinkKey + "-" + i}
                x={e.cx - e.rx - 0.2}
                y={e.cy - e.ry - 0.2}
                width={(e.rx + 0.2) * 2}
                height={(e.ry + 0.2) * 2}
                fill="#000"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [0, 1, 0] }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                style={{ originX: `${e.cx}%`, originY: `${e.cy}%`, transformBox: "fill-box", transformOrigin: "center" } as any}
              />
            </g>
          ))}

          {/* Mouth — reveals a thin red bar when speaking */}
          {speaking && (
            <motion.ellipse
              cx={MOUTH.cx}
              cy={MOUTH.cy}
              rx={MOUTH.rx}
              ry={MOUTH.ry * 0.35 * mouthOpen}
              fill="rgba(255,60,60,0.35)"
              stroke="rgba(255,80,80,0.8)"
              strokeWidth="0.2"
              strokeDasharray="0.8 0.6"
            />
          )}

          {/* Keyboard pulses — soft red on each key. Faster + brighter when thinking. */}
          {KEYS.map((k, i) => {
            const isLit = thinking
              ? (i + thinkTick) % 5 === 0
              : Math.floor(Date.now() / 900 + i) % 8 === 0;
            return (
              <motion.rect
                key={i}
                x={k.x - 1.4}
                y={k.y - 1.1}
                width={2.8}
                height={2.2}
                rx={0.4}
                fill="rgba(255,45,45,0.7)"
                animate={{ opacity: isLit ? [0, 0.9, 0] : 0 }}
                transition={{ duration: thinking ? 0.35 : 1.6, ease: "easeOut" }}
              />
            );
          })}

          {/* Scan line during thinking */}
          {thinking && (
            <motion.rect
              x={18}
              width={64}
              height={0.6}
              fill="rgba(255,60,60,0.55)"
              initial={{ y: 10 }}
              animate={{ y: [10, 92, 10] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Cursor after ZERO_ */}
          <motion.rect
            x={CURSOR.x}
            y={CURSOR.y}
            width={CURSOR.w}
            height={CURSOR.h}
            fill="rgba(255,60,60,0.95)"
            animate={active ? { opacity: [1, 0, 1] } : { opacity: 1 }}
            transition={{ duration: thinking ? 0.35 : 0.9, repeat: Infinity, ease: "linear" }}
          />

          {/* Rising red data particles during thinking */}
          {thinking && particles.map((p) => (
            <motion.circle
              key={p.id}
              cx={p.x}
              r={0.35}
              fill="rgba(255,80,80,0.85)"
              initial={{ cy: 88, opacity: 0 }}
              animate={{ cy: [88, 40], opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
            />
          ))}

          {/* SIGNAL DETECTED terminal flash */}
          {showSignal && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.3, times: [0, 0.1, 0.75, 1] }}
            >
              <rect x={30} y={70} width={40} height={4} fill="rgba(0,0,0,0.6)" stroke="rgba(255,60,60,0.7)" strokeWidth="0.15" />
              <text
                x={50}
                y={73.1}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="2.1"
                fill="rgba(255,90,90,1)"
                letterSpacing="0.3"
              >
                &gt; SIGNAL DETECTED
              </text>
            </motion.g>
          )}
        </svg>
      </motion.div>

      {/* State chip */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-red-500/40 text-[10px] font-mono uppercase tracking-[0.25em] text-red-400">
        <span className={
          "w-1.5 h-1.5 rounded-full " +
          (thinking ? "bg-red-400 animate-pulse" : speaking ? "bg-red-500 animate-pulse" : "bg-red-500/60")
        } />
        {state}
      </div>
    </div>
  );
};

export default BarkZeroAvatar;
