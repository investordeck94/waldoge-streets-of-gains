import { useEffect, useRef, type FC } from "react";
import { drawWaldogeSprite, preloadWaldogeSprites } from "@/game/presentation/render2d/waldogeSprites";

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 310;

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
      const cycle = (now - startedAt) % 2600;
      const striking = (cycle >= 620 && cycle < 1040) || (cycle >= 1580 && cycle < 2000);
      const strikeElapsed = cycle >= 1580 ? cycle - 1580 : cycle - 620;
      const stateTimer = striking ? Math.max(0, 12 - (strikeElapsed / 420) * 12) : 0;

      // A tiny guard shuffle gives the fighter life between clean jab cycles.
      const guardShift = Math.sin((now - startedAt) / 330) * 3;
      drawWaldogeSprite(
        context,
        {
          x: CANVAS_WIDTH / 2 + guardShift,
          y: CANVAS_HEIGHT - 20,
          vx: striking ? 0 : Math.cos((now - startedAt) / 330) * 0.7,
          vy: 0,
          height: 130,
          facing: 1,
          state: striking ? "punch" : "idle",
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
      aria-label="Waldoge shadowboxing in his red and white fighting gear"
      className="h-full w-full object-contain drop-shadow-[0_10px_18px_hsl(var(--background)/0.9)]"
    />
  );
};