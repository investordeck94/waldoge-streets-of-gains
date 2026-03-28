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
const PLAYER_SPEED = 3.5;
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
  const headR = 16;
  const bodyLen = 30;
  const limbLen = 20;

  ctx.save();
  ctx.translate(sx, sy);

  if (e.state === "hit") ctx.globalAlpha = 0.6;
  if (e.state === "dead") {
    ctx.rotate((e.facing * Math.PI) / 3);
    ctx.globalAlpha = 0.4;
  }

  const headCY = -bodyLen - limbLen - headR;

  // Head
  if (isPlayer && headImg && headImg.complete) {
    const s = headR * 3;
    ctx.drawImage(headImg, -s / 2, headCY - s / 2, s, s);
  } else {
    ctx.beginPath();
    ctx.arc(0, headCY, headR, 0, Math.PI * 2);
    ctx.fillStyle = e.state === "dead" ? "#666" : "#ff4444";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillRect(-6, headCY - 4, 4, 3);
    ctx.fillRect(3, headCY - 4, 4, 3);
    ctx.beginPath();
    ctx.moveTo(-5, headCY + 6);
    ctx.lineTo(0, headCY + 3);
    ctx.lineTo(5, headCY + 6);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Body
  const neckY = headCY + headR;
  const hipY = neckY + bodyLen;
  ctx.beginPath();
  ctx.moveTo(0, neckY);
  ctx.lineTo(0, hipY);
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arms
  const shoulderY = neckY + 8;
  ctx.beginPath();
  if (e.state === "punch") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.5, shoulderY - 5);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.6, shoulderY + 10);
  } else if (e.state === "kick") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.5, shoulderY - 8);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 0.3, shoulderY + 5);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 10 : 0;
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-limbLen * 0.7, shoulderY + limbLen * 0.8 + swing);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(limbLen * 0.7, shoulderY + limbLen * 0.8 - swing);
  }
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Legs
  ctx.beginPath();
  if (e.state === "kick") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(e.facing * limbLen * 1.5, hipY - 5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-e.facing * limbLen * 0.5, hipY + limbLen);
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

  // HP bar
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
        if ((wx * 7 + wy * 13) % 5 !== 0) ctx.fillRect(wx, wy, 10, 12);
      }
    }
  }

  for (let i = 0; i < 30; i++) {
    const bx = i * 140 - (camX * 0.6) % 140;
    const bh = 50 + (i * 53) % 80;
    ctx.fillStyle = "#1a2744";
    ctx.fillRect(bx, GROUND_Y - bh, 80, bh);
    ctx.fillStyle = "#ffd70055";
    for (let wy = GROUND_Y - bh + 8; wy < GROUND_Y - 8; wy += 16) {
      for (let wx = bx + 8; wx < bx + 72; wx += 20) {
        ctx.fillRect(wx, wy, 8, 10);
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

function createPlayer(): Entity {
  return {
    x: 200, y: GROUND_Y, vy: 0, vx: 0,
    width: 30, height: 70, facing: 1,
    hp: 100, maxHp: 100,
    state: "idle", stateTimer: 0, attackCooldown: 0,
    isPlayer: true,
  };
}

function spawnEnemies(waveIndex: number, playerX: number): Entity[] {
  const w = WAVES[waveIndex];
  if (!w) return [];
  return Array.from({ length: w.count }, (_, i) => ({
    x: playerX + 400 + i * 150 + Math.random() * 200,
    y: GROUND_Y, vy: 0, vx: 0,
    width: 30, height: 70, facing: -1 as const,
    hp: w.hp, maxHp: w.hp,
    state: "idle" as const, stateTimer: 0, attackCooldown: 0,
    aiTimer: Math.random() * 60,
  }));
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
    running: boolean;
  }>({
    player: createPlayer(),
    enemies: [],
    keys: new Set(),
    camX: 0,
    wave: 0,
    score: 0,
    headImg: null,
    animFrame: 0,
    running: false,
  });

  // Load head image
  useEffect(() => {
    const img = new Image();
    img.src = waldogeHead;
    img.onload = () => { gameRef.current.headImg = img; };
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.player = createPlayer();
    g.wave = 0;
    g.score = 0;
    g.camX = 0;
    g.enemies = spawnEnemies(0, 200);
    setWave(0);
    setScore(0);
    setPlayerHp(100);
    setGameState("playing");
  }, []);

  // Input handling
  useEffect(() => {
    if (gameState !== "playing") return;
    const g = gameRef.current;
    const onDown = (e: KeyboardEvent) => {
      g.keys.add(e.key.toLowerCase());
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => g.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;
    g.running = true;

    const tick = () => {
      if (!g.running) return;
      const p = g.player;

      // Player movement
      if (p.state !== "hit" && p.state !== "dead") {
        let moving = false;
        if (g.keys.has("a") || g.keys.has("arrowleft")) { p.x -= PLAYER_SPEED; p.facing = -1; moving = true; }
        if (g.keys.has("d") || g.keys.has("arrowright")) { p.x += PLAYER_SPEED; p.facing = 1; moving = true; }
        if ((g.keys.has("w") || g.keys.has("arrowup") || g.keys.has(" ")) && p.y >= GROUND_Y) p.vy = JUMP_FORCE;

        if (g.keys.has("j") && p.attackCooldown <= 0 && p.state !== "punch" && p.state !== "kick") {
          p.state = "punch"; p.stateTimer = 12; p.attackCooldown = 18;
        } else if (g.keys.has("k") && p.attackCooldown <= 0 && p.state !== "punch" && p.state !== "kick") {
          p.state = "kick"; p.stateTimer = 15; p.attackCooldown = 22;
        } else if (p.stateTimer <= 0 && p.state !== "punch" && p.state !== "kick") {
          p.state = moving ? "walk" : p.y < GROUND_Y ? "jump" : "idle";
        }
      }

      // Player physics
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; }
      p.x = Math.max(20, Math.min(LEVEL_WIDTH - 20, p.x));
      p.x += p.vx || 0;
      p.vx = (p.vx || 0) * 0.85;
      p.stateTimer = Math.max(-1, p.stateTimer - 1);
      p.attackCooldown = Math.max(-1, p.attackCooldown - 1);
      if (p.state === "hit" && p.stateTimer <= 0) p.state = "idle";
      if ((p.state === "punch" || p.state === "kick") && p.stateTimer <= 0) p.state = "idle";

      // Player attack hit detection
      if ((p.state === "punch" && p.stateTimer === 8) || (p.state === "kick" && p.stateTimer === 10)) {
        const range = p.state === "punch" ? 45 : 55;
        const dmg = p.state === "punch" ? 12 : 18;
        for (const e of g.enemies) {
          if (e.state === "dead") continue;
          const dx = e.x - p.x;
          if (dx * p.facing > 0 && Math.abs(dx) < range && Math.abs(e.y - p.y) < 50) {
            e.hp -= dmg;
            e.state = "hit";
            e.stateTimer = 10;
            e.vx = p.facing * 5;
            if (e.hp <= 0) {
              e.state = "dead";
              e.stateTimer = 60;
              g.score += 100;
              setScore(g.score);
            }
          }
        }
      }

      // Enemy AI
      for (const e of g.enemies) {
        if (e.state === "dead") { e.stateTimer--; continue; }

        e.vy += GRAVITY;
        e.y += e.vy;
        e.x += e.vx || 0;
        e.vx = (e.vx || 0) * 0.85;
        if (e.y >= GROUND_Y) { e.y = GROUND_Y; e.vy = 0; }
        e.stateTimer = Math.max(-1, e.stateTimer - 1);
        e.attackCooldown = Math.max(-1, e.attackCooldown - 1);
        if (e.state === "hit" && e.stateTimer <= 0) e.state = "idle";
        if ((e.state === "punch" || e.state === "kick") && e.stateTimer <= 0) e.state = "idle";

        if (e.state !== "hit" && e.state !== "punch" && e.state !== "kick") {
          const dx = p.x - e.x;
          const dist = Math.abs(dx);
          e.facing = dx > 0 ? 1 : -1;

          if (dist > 50) {
            e.x += e.facing * (WAVES[g.wave]?.speed || 1.5);
            e.state = "walk";
          } else if (e.attackCooldown <= 0) {
            const atk = Math.random() > 0.5 ? "punch" : "kick";
            e.state = atk;
            e.stateTimer = atk === "punch" ? 12 : 15;
            e.attackCooldown = 30 + Math.random() * 20;
          }
        }

        // Enemy attack hit
        if ((e.state === "punch" && e.stateTimer === 8) || (e.state === "kick" && e.stateTimer === 10)) {
          const range = e.state === "punch" ? 40 : 50;
          const dmg = e.state === "punch" ? 5 : 8;
          const edx = p.x - e.x;
          if (edx * e.facing > 0 && Math.abs(edx) < range && Math.abs(p.y - e.y) < 50 && p.state !== "dead") {
            p.hp -= dmg;
            p.state = "hit";
            p.stateTimer = 8;
            p.vx = e.facing * 3;
            setPlayerHp(Math.max(0, p.hp));
            if (p.hp <= 0) {
              p.state = "dead";
              g.running = false;
              setGameState("gameover");
              return;
            }
          }
        }
      }

      // Wave progression
      const alive = g.enemies.filter(e => e.state !== "dead");
      if (alive.length === 0) {
        g.enemies = g.enemies.filter(e => e.stateTimer > 0);
        if (g.enemies.length === 0) {
          g.wave++;
          setWave(g.wave);
          if (g.wave >= WAVES.length) {
            g.running = false;
            setGameState("victory");
            return;
          }
          g.enemies = spawnEnemies(g.wave, p.x);
        }
      }

      // Camera
      const targetCam = p.x - CANVAS_W / 3;
      g.camX += (targetCam - g.camX) * 0.1;
      g.camX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_W, g.camX));

      // Draw
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawCity(ctx, g.camX, CANVAS_W);

      // Wave text
      ctx.fillStyle = "#ffd70088";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`WAVE ${g.wave + 1}/${WAVES.length}`, CANVAS_W / 2, 25);

      for (const e of g.enemies) {
        if (e.state === "dead" && e.stateTimer <= 0) continue;
        drawStickFigure(ctx, e, g.camX, null, false);
      }
      drawStickFigure(ctx, p, g.camX, g.headImg, true);

      g.animFrame = requestAnimationFrame(tick);
    };

    g.animFrame = requestAnimationFrame(tick);
    return () => {
      g.running = false;
      cancelAnimationFrame(g.animFrame);
    };
  }, [gameState]);

  // Touch controls
  const touchAction = useCallback((action: string) => {
    const g = gameRef.current;
    if (action === "punch") { g.keys.add("j"); setTimeout(() => g.keys.delete("j"), 100); }
    else if (action === "kick") { g.keys.add("k"); setTimeout(() => g.keys.delete("k"), 100); }
    else if (action === "jump") { g.keys.add("w"); setTimeout(() => g.keys.delete("w"), 150); }
  }, []);

  const touchMove = useCallback((dir: "left" | "right" | "stop") => {
    const g = gameRef.current;
    g.keys.delete("a");
    g.keys.delete("d");
    if (dir === "left") g.keys.add("a");
    if (dir === "right") g.keys.add("d");
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Swords className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-primary font-heading">Street Brawler</h2>
      </div>

      <AnimatePresence mode="wait">
        {gameState === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 text-center space-y-6"
          >
            <img src={waldogeHead} alt="Waldoge" className="w-24 h-24 mx-auto object-contain" />
            <h3 className="text-2xl font-bold text-primary font-heading">WALDOGE STREET BRAWLER</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Fight through waves of thugs on the mean streets! Use WASD to move, J to punch, K to kick.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-xs text-muted-foreground">
              <div className="glass-card p-2">A/D — Move</div>
              <div className="glass-card p-2">W/Space — Jump</div>
              <div className="glass-card p-2">J — Punch</div>
              <div className="glass-card p-2">K — Kick</div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 mx-auto hover:opacity-90 transition"
            >
              <Play className="w-5 h-5" /> START BRAWL
            </button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 w-full"
          >
            <div className="flex justify-between items-center glass-card px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                    style={{ width: `${playerHp}%` }}
                  />
                </div>
              </div>
              <span className="text-primary font-bold">Wave {wave + 1}/{WAVES.length}</span>
              <span className="text-muted-foreground">Score: <span className="text-primary">{score}</span></span>
            </div>

            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-lg border border-border/50"
              style={{ imageRendering: "pixelated" }}
            />

            {/* Mobile touch controls */}
            <div className="flex justify-between items-center gap-2 md:hidden">
              <div className="flex gap-1">
                <button
                  onTouchStart={() => touchMove("left")}
                  onTouchEnd={() => touchMove("stop")}
                  className="w-12 h-12 glass-card flex items-center justify-center text-lg font-bold text-primary active:bg-primary/20"
                >◀</button>
                <button
                  onTouchStart={() => touchMove("right")}
                  onTouchEnd={() => touchMove("stop")}
                  className="w-12 h-12 glass-card flex items-center justify-center text-lg font-bold text-primary active:bg-primary/20"
                >▶</button>
              </div>
              <button
                onTouchStart={() => touchAction("jump")}
                className="w-12 h-12 glass-card flex items-center justify-center text-xs font-bold text-primary active:bg-primary/20"
              >JUMP</button>
              <div className="flex gap-1">
                <button
                  onTouchStart={() => touchAction("punch")}
                  className="w-12 h-12 glass-card flex items-center justify-center text-xs font-bold text-red-400 active:bg-red-500/20"
                >👊</button>
                <button
                  onTouchStart={() => touchAction("kick")}
                  className="w-12 h-12 glass-card flex items-center justify-center text-xs font-bold text-red-400 active:bg-red-500/20"
                >🦵</button>
              </div>
            </div>
          </motion.div>
        )}

        {(gameState === "gameover" || gameState === "victory") && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center space-y-4"
          >
            {gameState === "victory" ? (
              <>
                <Trophy className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-2xl font-bold text-primary font-heading">VICTORY!</h3>
                <p className="text-muted-foreground">You cleared all waves!</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-destructive font-heading">GAME OVER</h3>
                <p className="text-muted-foreground">The streets got the best of you...</p>
              </>
            )}
            <p className="text-lg text-primary font-bold">Score: {score}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 mx-auto hover:opacity-90 transition"
            >
              <RotateCcw className="w-5 h-5" /> PLAY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
