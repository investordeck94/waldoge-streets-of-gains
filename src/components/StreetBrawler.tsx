import { FC, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Heart, RotateCcw, Play, Trophy } from "lucide-react";
import waldogeHead from "@/assets/waldoge-head.png";

interface Entity {
  x: number;
  y: number;
  vy: number;
  vx: number;
  width: number;
  height: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: "idle" | "walk" | "jump" | "punch" | "kick" | "hit" | "dead";
  stateTimer: number;
  attackCooldown: number;
  isPlayer?: boolean;
  aiTimer?: number;
}

const CANVAS_W = 800;
const CANVAS_H = 400;
const GROUND_Y = 320;
const GRAVITY = 0.6;
const PLAYER_SPEED = 3;
const JUMP_FORCE = -12;
const LEVEL_WIDTH = 3200;

const WAVES: { count: number; hp: number; speed: number }[] = [
  { count: 3, hp: 30, speed: 1.2 },
  { count: 4, hp: 40, speed: 1.5 },
  { count: 5, hp: 50, speed: 1.8 },
  { count: 3, hp: 80, speed: 2 },
];

function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  camX: number,
  headImg: HTMLImageElement | null,
  isPlayer: boolean
) {
  const sx = e.x - camX;
  const sy = e.y;
  const f = e.facing;
  const headR = 16;
  const bodyLen = 30;
  const limbLen = 20;

  ctx.save();
  ctx.translate(sx, sy);

  if (e.state === "hit") {
    ctx.globalAlpha = 0.6;
  }

  if (e.state === "dead") {
    ctx.rotate((f * Math.PI) / 3);
    ctx.globalAlpha = 0.4;
  }

  const headCenterY = -bodyLen - limbLen - headR;

  if (isPlayer && headImg && headImg.complete) {
    const imgSize = headR * 3;
    ctx.drawImage(headImg, -imgSize / 2, headCenterY - imgSize / 2, imgSize, imgSize);
  } else {
    ctx.beginPath();
    ctx.arc(0, headCenterY, headR, 0, Math.PI * 2);
    ctx.fillStyle = e.state === "dead" ? "#666" : "#ff4444";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.fillRect(-6, headCenterY - 4, 4, 3);
    ctx.fillRect(3, headCenterY - 4, 4, 3);
    ctx.beginPath();
    ctx.moveTo(-5, headCenterY + 6);
    ctx.lineTo(0, headCenterY + 3);
    ctx.lineTo(5, headCenterY + 6);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const neckY = headCenterY + headR;
  const hipY = neckY + bodyLen;
  ctx.beginPath();
  ctx.moveTo(0, neckY);
  ctx.lineTo(0, hipY);
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  if (e.state === "punch") {
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(f * limbLen * 1.5, neckY + 3);
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(-f * limbLen * 0.6, neckY + 18);
  } else if (e.state === "kick") {
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(-f * limbLen * 0.5, neckY);
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(f * limbLen * 0.3, neckY + 13);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 10 : 0;
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(-limbLen * 0.7, neckY + 8 + limbLen * 0.8 + swing);
    ctx.moveTo(0, neckY + 8);
    ctx.lineTo(limbLen * 0.7, neckY + 8 + limbLen * 0.8 - swing);
  }
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  if (e.state === "kick") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(f * limbLen * 1.5, hipY - 5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-f * limbLen * 0.5, hipY + limbLen);
  } else if (e.state === "jump") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen * 0.6, hipY + limbLen * 0.5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen * 0.6, hipY + limbLen * 0.5);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 12 : 0;
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen * 0.5 + swing, hipY + limbLen);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen * 0.5 - swing, hipY + limbLen);
  }
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  if (e.state !== "dead") {
    const barW = 40;
    const barH = 4;
    const barX = sx - barW / 2;
    const barY = sy - bodyLen - limbLen - headR * 2 - 20;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = e.hp > e.maxHp * 0.3 ? "#00ff00" : "#ff0000";
    ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
  }
}

function drawCity(ctx: CanvasRenderingContext2D, camX: number, canvasW: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#1a1a2e");
  skyGrad.addColorStop(1, "#16213e");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);

  for (let i = 0; i < 20; i++) {
    const bx = i * 200 - (camX * 0.3) % 200;
    const bh = 80 + (i * 37) % 120;
    ctx.fillStyle = "#0f1729";
    ctx.fillRect(bx, GROUND_Y - bh, 120, bh);
    ctx.fillStyle = "#ffd70033";
    for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 10; wy += 20) {
      for (let wx = bx + 10; wx < bx + 110; wx += 25) {
        if (Math.random() > 0.3) ctx.fillRect(wx, wy, 10, 12);
      }
    }
  }

  ctx.fillStyle = "#2d3748";
  ctx.fillRect(0, GROUND_Y, canvasW, canvasW - GROUND_Y);
  ctx.fillStyle = "#ffd70044";
  for (let i = 0; i < 40; i++) {
    const mx = i * 100 - (camX * 0.95) % 100;
    ctx.fillRect(mx, GROUND_Y + 30, 40, 4);
  }
}

export const StreetBrawler: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "victory">("menu");
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);

  const gameRef = useRef<{
    player: Entity;
    enemies: Entity[];
    keys: Set<string>;
    camX: number;
    wave: number;
    score: number;
    headImg: HTMLImageElement | null;
    animFrame: number;
    enemiesDefeated: number;
  }>({
    player: { x: 200, y: GROUND_Y, vy: 0, vx: 0, width: 30, height: 70, facing: 1, hp: 100, maxHp: 100, state: "idle", stateTimer: 0, attackCooldown: 0, isPlayer: true },
    enemies: [],
    keys: new Set(),
    camX: 0,
    wave: 0,
    score: 0,
    headImg: null,
    animFrame: 0,
    enemiesDefeated: 0,
  });

  const spawnEnemies = (waveIndex: number): Entity[] => {
    const w = WAVES[waveIndex];
    if (!w) return [];
    return Array.from({ length: w.count }).map((_, i) => ({
      x: 600 + i * 150,
      y: GROUND_Y, vy: 0, vx: 0, width: 30, height: 70, facing: -1,
      hp: w.hp, maxHp: w.hp, state: "idle", stateTimer: 0, attackCooldown: 0, aiTimer: Math.random() * 60
    }));
  };

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.player = { x: 200, y: GROUND_Y, vy: 0, vx: 0, width: 30, height: 70, facing: 1, hp: 100, maxHp: 100, state: "idle", stateTimer: 0, attackCooldown: 0, isPlayer: true };
    g.wave = 0;
    g.score = 0;
    g.camX = 0;
    g.enemies = spawnEnemies(0);
    setWave(0);
    setScore(0);
    setPlayerHp(100);
    setGameState("playing");
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = waldogeHead;
    img.onload = () => { gameRef.current.headImg = img; };
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;
    const g = gameRef.current;
    const handleKeyDown = (e: KeyboardEvent) => g.keys.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => g.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    const tick = () => {
      const p = g.player;
      if (p.state !== "hit" && p.state !== "dead") {
        if (g.keys.has("a")) { p.x -= PLAYER_SPEED; p.facing = -1; }
        if (g.keys.has("d")) { p.x += PLAYER_SPEED; p.facing = 1; }
        if ((g.keys.has("w") || g.keys.has(" ")) && p.y >= GROUND_Y) p.vy = JUMP_FORCE;
        if (g.keys.has("j") && p.attackCooldown <= 0) { p.state = "punch"; p.stateTimer = 12; p.attackCooldown = 18; }
        else if (g.keys.has("k") && p.attackCooldown <= 0) { p.state = "kick"; p.stateTimer = 15; p.attackCooldown = 22; }
      }
      p.vy += GRAVITY; p.y += p.vy;
      if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; }
      p.stateTimer = Math.max(0, p.stateTimer - 1);
      p.attackCooldown = Math.max(0, p.attackCooldown - 1);
      if (p.stateTimer === 0 && p.state !== "idle") p.state = "idle";

      g.enemies.forEach(e => {
        if (e.state === "dead") return;
        const dx = p.x - e.x;
        e.facing = dx > 0 ? 1 : -1;
        if (Math.abs(dx) > 50) e.x += e.facing * (WAVES[g.wave]?.speed || 1);
        else if (e.attackCooldown <= 0) { e.state = "punch"; e.stateTimer = 10; e.attackCooldown = 40; }
        e.stateTimer = Math.max(0, e.stateTimer - 1);
        e.attackCooldown = Math.max(0, e.attackCooldown - 1);
        if (e.stateTimer === 0 && e.state !== "idle") e.state = "idle";
      });

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawCity(ctx, g.camX, CANVAS_W);
      g.enemies.forEach(e => drawStickFigure(ctx, e, g.camX, null, false));
      drawStickFigure(ctx, p, g.camX, g.headImg, true);
      g.animFrame = requestAnimationFrame(tick);
    };
    g.animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(g.animFrame);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-primary">WALDOGE BRAWLER</h2>
      {gameState === "menu" && (
        <button onClick={startGame} className="px-8 py-3 bg-primary text-white rounded-lg">START</button>
      )}
      {gameState === "playing" && (
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="bg-black rounded-lg" />
      )}
    </div>
  );
};
