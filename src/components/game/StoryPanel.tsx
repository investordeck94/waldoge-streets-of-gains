import { useCallback, useEffect, useState } from "react";
import type { StoryPortrait, StoryScene } from "@/game/story/storyTypes";
import { FILF_ATLAS_SIZE, FILF_ATLAS_URL, FILF_FRAMES } from "@/game/presentation/render2d/filfSprites";
import waldogeHead from "@/assets/waldoge-head.png";
import jeetHead from "@/assets/jeet-boss-head.png";

const FILF_PORTRAITS: Partial<Record<StoryPortrait, keyof typeof FILF_FRAMES>> = {
  "filf-normal": "portraitNormal",
  "filf-worried": "portraitWorried",
  "filf-happy": "portraitHappy",
  "filf-thankful": "portraitThankful",
};

function Portrait({ id }: { id: StoryPortrait }) {
  const size = 112;
  const frameId = FILF_PORTRAITS[id];
  if (frameId) {
    const f = FILF_FRAMES[frameId];
    const s = size / Math.max(f.w, f.h);
    return (
      <div
        aria-label="FILF"
        role="img"
        className="shrink-0 rounded-md border-2 border-primary bg-background"
        style={{
          width: size, height: size,
          backgroundImage: `url(${FILF_ATLAS_URL})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${FILF_ATLAS_SIZE.w * s}px ${FILF_ATLAS_SIZE.h * s}px`,
          backgroundPosition: `${-f.x * s + (size - f.w * s) / 2}px ${-f.y * s + (size - f.h * s) / 2}px`,
          imageRendering: "pixelated",
        }}
      />
    );
  }
  const src = id === "jeet" ? jeetHead : waldogeHead;
  return (
    <img
      src={src}
      alt={id === "jeet" ? "Jeet" : "Waldoge"}
      className="shrink-0 rounded-md border-2 border-primary bg-background object-cover"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}

/**
 * Reusable comic-style story overlay. Advance: tap / click / Enter / Space /
 * E / J / gamepad A. Skip: Skip button / Escape / gamepad B.
 */
export function StoryPanel({ scene, onDone }: { scene: StoryScene; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const panel = scene.panels[index];
  const last = index >= scene.panels.length - 1;

  const next = useCallback(() => {
    if (last) onDone();
    else setIndex((i) => i + 1);
  }, [last, onDone]);

  useEffect(() => setIndex(0), [scene.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "escape") { e.preventDefault(); onDone(); }
      else if (k === "enter" || k === " " || k === "e" || k === "j") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [next, onDone]);

  // Gamepad (only if one is connected)
  useEffect(() => {
    let raf = 0;
    let prevA = true, prevB = true;
    const poll = () => {
      const pad = navigator.getGamepads?.().find(Boolean);
      if (pad) {
        const a = !!pad.buttons[0]?.pressed, b = !!pad.buttons[1]?.pressed;
        if (a && !prevA) next();
        if (b && !prevB) onDone();
        prevA = a; prevB = b;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [next, onDone]);

  if (!panel) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/85 backdrop-blur-sm p-3 select-none"
      onClick={next}
      role="dialog"
      aria-label={scene.title}
    >
      <div className="w-full max-w-2xl glass-card border-2 border-primary/70 rounded-lg p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-primary">{scene.title}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDone(); }}
            className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground hover:text-primary px-2 py-1 border border-border rounded"
          >
            SKIP ▶▶
          </button>
        </div>
        <div key={index} className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          {panel.portrait && <Portrait id={panel.portrait} />}
          <div className="flex-1 min-w-0">
            {panel.speaker && (
              <div className="font-heading font-bold text-primary text-sm tracking-wider mb-1">{panel.speaker}</div>
            )}
            <p className={`text-foreground leading-snug ${panel.speaker ? "text-base sm:text-lg" : "text-lg sm:text-xl italic"}`}>
              {panel.speaker ? `“${panel.text}”` : panel.text}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {scene.panels.map((_, i) => (
              <span key={i} className={`h-1.5 w-4 rounded-sm ${i <= index ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="font-mono text-sm font-bold tracking-wider bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            {last ? "CONTINUE ▶" : "NEXT ▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
