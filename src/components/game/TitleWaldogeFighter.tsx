import { useEffect, useRef, type FC } from "react";
import { drawWaldogeSprite, preloadWaldogeSprites } from "@/game/presentation/render2d/waldogeSprites";

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 500;

/** Presentation-only title animation. It never enters or mutates the game loop. */
export const TitleWaldogeFighter: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    preloadWaldogeSprites();
    let frameId = 0;
    const startedAt = performance.now();

    const draw = (now: number) => {
      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const cycle = (now - startedAt) % 3600;
      let state: "idle" | "punch" | "dashpunch" | "uppercut" = "idle";
      let stateTimer = 0;
      let facing: 1 | -1 = 1;

      // Guard → left jab → right cross → rising uppercut → guarded recovery.
      if (cycle >= 700 && cycle < 1120) {
        state = "punch";
        stateTimer = Math.max(0, 12 - ((cycle - 700) / 420) * 12);
      } else if (cycle >= 1180 && cycle < 1620) {
        state = "dashpunch";
        stateTimer = Math.max(0, 14 - ((cycle - 1180) / 440) * 14);
        facing = -1;
      } else if (cycle >= 1690 && cycle < 2240) {
        state = "uppercut";
        stateTimer = Math.max(0, 18 - ((cycle - 1690) / 550) * 18);
      }

      const guardShift = state === "idle" ? Math.sin((now - startedAt) / 330) * 3 : 0;
      drawWaldogeSprite(
        context,
        {
          x: CANVAS_WIDTH / 2 + guardShift,
            y: CANVAS_HEIGHT - 10,
            vx: state === "idle" ? Math.cos((now - startedAt) / 330) * 0.7 : 0,
          vy: 0,
            height: 235,
            facing,
            state,
          stateTimer,
        },
        0,
        null,
        "brawler",
      );
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
        aria-label="Waldoge performing a jab, cross and uppercut boxing combo"
        className="h-full w-full object-contain drop-shadow-[0_16px_20px_hsl(var(--background)/0.95)]"
    />
  );
};