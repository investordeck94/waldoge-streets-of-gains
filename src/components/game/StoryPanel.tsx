import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { StoryArtId, StoryCharacter, StoryPanelData, StoryScene } from "@/game/story/storyTypes";
import { STORY_ART, prefetchPanel, releaseStoryPrefetch } from "@/game/story/storyAssets";

/** Renders one registered art entry (whole image or a sprite-sheet crop). */
function Art({ id, height, flip, className = "", fit = "contain" }: {
  id: StoryArtId; height?: number | string; flip?: boolean; className?: string; fit?: "contain" | "cover";
}) {
  const art = STORY_ART[id];
  if (!art) return null;
  const transform = flip ? "scaleX(-1)" : undefined;
  if (art.frame && art.sheet) {
    const f = art.frame;
    // Percent-based crop scales with the element, so it works at any size.
    const style: CSSProperties = {
      aspectRatio: `${f.w} / ${f.h}`,
      height,
      backgroundImage: `url(${art.src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${(art.sheet.w / f.w) * 100}% ${(art.sheet.h / f.h) * 100}%`,
      backgroundPosition: `${art.sheet.w === f.w ? 0 : (f.x / (art.sheet.w - f.w)) * 100}% ${art.sheet.h === f.h ? 0 : (f.y / (art.sheet.h - f.h)) * 100}%`,
      imageRendering: "pixelated",
      transform,
    };
    return <div role="img" aria-label={art.alt} className={className} style={style} />;
  }
  return (
    <img
      src={art.src}
      alt={art.alt}
      draggable={false}
      className={className}
      style={{ height, imageRendering: "pixelated", transform, objectFit: fit }}
    />
  );
}

const POS: Record<NonNullable<StoryCharacter["position"]>, string> = {
  left: "left-[4%]",
  center: "left-1/2 -translate-x-1/2",
  right: "right-[4%]",
};

function Stage({ panel }: { panel: StoryPanelData }) {
  if (!panel.background && !panel.characters?.length) return null;
  const captiveNoir = panel.treatment === "captive-noir";
  return (
    <div className={`relative w-full aspect-[16/9] max-h-[45svh] overflow-hidden bg-background mb-3 ${captiveNoir ? "rounded-sm border-2 border-foreground/20 shadow-[4px_4px_0_hsl(var(--background))]" : "rounded-md border-2 border-primary/60"}`}>
      {panel.background && (
        <Art id={panel.background} className="absolute inset-0 w-full h-full" fit="cover" height="100%" />
      )}
      {panel.characters?.map((c, i) => {
        const free = typeof c.x === "number";
        return (
          <div
            key={`${c.art}-${i}`}
            className={`absolute ${free ? "-translate-x-1/2" : `bottom-0 ${POS[c.position ?? "center"]}`} transition-opacity ${c.dimmed ? "opacity-50" : ""}`}
            style={{
              height: `${Math.max(0.1, Math.min(1, c.scale ?? 0.9)) * 100}%`,
              ...(free ? { left: `${c.x}%`, bottom: `${c.bottom ?? 0}%` } : {}),
              ...(c.rotate ? { rotate: `${c.rotate}deg`, transformOrigin: "bottom center" } : {}),
            }}
          >
            <Art id={c.art} flip={c.flip} height="100%" className="max-w-none" />
          </div>
        );
      })}
      {panel.dialogue?.bubble && <SpeechBubble d={panel.dialogue} />}
      {captiveNoir && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-background/30" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(hsl(var(--foreground))_1px,transparent_1px)] [background-size:4px_4px]" />
          <div className="absolute left-2 top-2 border border-border bg-background/90 px-2 py-1 font-mono text-[8px] font-bold tracking-wider text-muted-foreground">
            LOC: {panel.locationLabel ?? "STREETS_OF_GAINS_04"}
          </div>
          <div className="absolute bottom-2 left-2 -skew-x-6 border border-background bg-accent px-2 py-1 font-heading text-[9px] font-black tracking-wider text-accent-foreground shadow-[2px_2px_0_hsl(var(--background))]">
            IMPRISONED
          </div>
        </>
      )}
    </div>
  );
}

function SpeechBubble({ d }: { d: NonNullable<StoryPanelData["dialogue"]> }) {
  const b = d.bubble!;
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polygon
          points={`${b.x - 3},${b.y + 8} ${b.x + 3},${b.y + 8} ${b.tailX},${b.tailY}`}
          className="fill-foreground stroke-background"
          strokeWidth={0.4}
        />
      </svg>
      <div
        className="absolute -translate-x-1/2 max-w-[46%] rounded-2xl border-2 border-background bg-foreground px-2 py-1 sm:px-3 sm:py-2 shadow-[3px_3px_0_hsl(var(--background))]"
        style={{ left: `${b.x}%`, top: `${b.y}%` }}
      >
        <div className="font-heading text-[8px] sm:text-[10px] font-black tracking-wider text-primary">{d.speaker}</div>
        <p className="font-heading text-[9px] sm:text-xs font-bold uppercase leading-tight text-background">{d.text}</p>
      </div>
    </>
  );
}

const TRANSITION: Record<string, string> = {
  fade: "animate-in fade-in duration-300",
  slide: "animate-in fade-in slide-in-from-bottom-2 duration-300",
  cut: "",
};

/**
 * Reusable comic/arcade story overlay.
 * Advance: tap / click / Enter / Space / E / J / gamepad A.
 * Skip: Skip button / Escape / gamepad B.
 * While open, keyboard input is captured so nothing reaches the game.
 */
export function StoryPanel({ scene, onDone }: { scene: StoryScene; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const panel = scene.panels[index];
  const last = index >= scene.panels.length - 1;
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    releaseStoryPrefetch();
    onDone();
  }, [onDone]);
  const skip = useCallback(() => { if (!scene.unskippable) finish(); }, [scene.unskippable, finish]);
  const next = useCallback(() => {
    if (last) finish();
    else setIndex((i) => i + 1);
  }, [last, finish]);

  useEffect(() => { setIndex(0); doneRef.current = false; }, [scene.id]);
  useEffect(() => { prefetchPanel(scene.panels[index + 1]); }, [scene, index]);

  // Optional auto-advance
  useEffect(() => {
    if (!panel?.durationMs) return;
    const t = window.setTimeout(next, panel.durationMs);
    return () => window.clearTimeout(t);
  }, [panel, next]);

  // Keyboard — capture phase, swallow so gameplay never sees it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (e.repeat) return;
      if (k === "escape") { e.preventDefault(); skip(); }
      else if (k === "enter" || k === " " || k === "e" || k === "j") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [next, skip]);

  // Gamepad (only if one is connected)
  useEffect(() => {
    let raf = 0;
    let prevA = true, prevB = true;
    const poll = () => {
      const pad = navigator.getGamepads?.().find(Boolean);
      if (pad) {
        const a = !!pad.buttons[0]?.pressed, b = !!pad.buttons[1]?.pressed;
        if (a && !prevA) next();
        if (b && !prevB) skip();
        prevA = a; prevB = b;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [next, skip]);

  if (!panel) return null;
  const speaker = panel.dialogue?.speaker ?? panel.speaker;
  const line = panel.dialogue?.text ?? panel.text;
  const portrait = panel.dialogue?.portrait ?? panel.portrait;
  const captiveNoir = panel.treatment === "captive-noir";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/85 backdrop-blur-sm p-3 select-none overflow-x-hidden touch-manipulation"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={next}
      role="dialog"
      aria-modal="true"
      aria-label={scene.title}
    >
      <div className={`relative w-full max-w-2xl border-2 border-primary/70 p-3 sm:p-5 max-h-[95svh] overflow-y-auto ${captiveNoir ? "rounded-sm bg-card shadow-[0_0_28px_hsl(var(--primary)/0.16)]" : "glass-card rounded-lg shadow-2xl"}`}>
        {captiveNoir && <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.035] [background-image:linear-gradient(transparent_50%,hsl(var(--foreground)/0.25)_50%)] [background-size:100%_2px]" />}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-primary truncate">{scene.title}</span>
          {!scene.unskippable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); skip(); }}
              className="shrink-0 font-mono text-xs font-bold tracking-wider text-muted-foreground hover:text-primary px-3 py-2 min-h-[40px] border border-border rounded"
            >
              SKIP STORY ▶▶
            </button>
          )}
        </div>
        <div key={index} className={TRANSITION[panel.transition ?? "slide"]}>
          <Stage panel={panel} />
          {panel.narration && (
            <p className="text-foreground text-base sm:text-xl italic leading-snug mb-2 break-words whitespace-pre-line">{panel.narration}</p>
          )}
          {panel.subNarration && (
            <p className="text-muted-foreground text-xs sm:text-sm italic uppercase tracking-wide leading-snug mb-2 break-words whitespace-pre-line">{panel.subNarration}</p>
          )}
          {line && !panel.dialogue?.bubble && (
            <div className="flex gap-3 sm:gap-4 items-start">
              {portrait && (
                <div className={`relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 border-2 border-primary bg-background overflow-hidden flex items-center justify-center ${captiveNoir ? "rounded-sm shadow-[4px_4px_0_hsl(var(--background))]" : "rounded-md"}`}>
                  <Art id={portrait} height="100%" className="max-w-full" fit="cover" />
                  {captiveNoir && (
                    <div className="pointer-events-none absolute inset-0 flex justify-around px-1 opacity-80">
                      <span className="h-full w-1.5 border-x border-muted-foreground bg-secondary" />
                      <span className="h-full w-1.5 border-x border-muted-foreground bg-secondary" />
                      <span className="h-full w-1.5 border-x border-muted-foreground bg-secondary" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {speaker && (
                  <div className="font-heading font-bold text-primary text-sm tracking-wider mb-1">{speaker}</div>
                )}
                <p className={`text-foreground leading-snug break-words ${speaker ? "text-base sm:text-lg" : "text-lg sm:text-xl italic"}`}>
                  {speaker ? `“${line}”` : line}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 gap-2">
          <div className="flex gap-1 flex-wrap">
            {scene.panels.map((_, i) => (
              <span key={i} className={`h-1.5 w-4 rounded-sm ${i <= index ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="shrink-0 font-mono text-sm font-bold tracking-wider bg-primary text-primary-foreground px-5 py-3 min-h-[44px] rounded"
          >
            {last ? "CONTINUE ▶" : "NEXT ▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
