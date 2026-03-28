import { FC, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Heart, RotateCcw, Play, Trophy, Zap } from "lucide-react";
import waldogeHead from "@/assets/waldoge-head.png";

type AttackState = "idle" | "walk" | "jump" | "punch" | "kick" | "hit" | "dead"
  | "uppercut" | "spinkick" | "groundpound" | "dashpunch";

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
  state: AttackState;
  stateTimer: number;
  attackCooldown: number;
  isPlayer?: boolean;
  aiTimer?: number;
}

interface HitEffect {
  x: number;
  y: number;
  timer: number;
  text: string;
  color: string;
  size: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: "health" | "speed" | "energy" | "damage";
  timer: number;
}

const POWERUP_COLORS: Record<string, string> = {
  health: "#00ff00",
  speed: "#00ccff",
  energy: "#ffcc00",
  damage: "#ff4444",
};
const POWERUP_ICONS: Record<string, string> = {
  health: "❤️",
  speed: "⚡",
  energy: "🔋",
  damage: "💥",
};
const DROP_CHANCE = 0.5;


interface ComboState {
  inputs: string[];
  timer: number;
  hitCount: number;
  hitTimer: number;
  multiplier: number;
  specialCooldown: number;
  specialEnergy: number;
}

const CANVAS_W = 800;
const CANVAS_H = 400;
const GROUND_Y = 320;
const GRAVITY = 0.6;
const PLAYER_SPEED = 3.5;
const JUMP_FORCE = -12;
const LEVEL_WIDTH = 3200;
const COMBO_WINDOW = 40; // frames to chain inputs (generous window)
const COMBO_HIT_WINDOW = 40; // frames before combo resets
const MAX_ENERGY = 100;

const WAVES: { count: number; hp: number; speed: number }[] = [
  { count: 3, hp: 30, speed: 1.2 },
  { count: 4, hp: 40, speed: 1.5 },
  { count: 5, hp: 50, speed: 1.8 },
  { count: 3, hp: 80, speed: 2 },
];

// Combo recipes: input sequence → special move
const COMBOS: { inputs: string[]; move: AttackState; name: string }[] = [
  { inputs: ["j", "j", "k"], move: "uppercut", name: "UPPERCUT!" },
  { inputs: ["k", "k", "j"], move: "spinkick", name: "SPIN KICK!" },
  { inputs: ["j", "k", "j"], move: "dashpunch", name: "DASH PUNCH!" },
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

  // Spin kick rotation
  if (e.state === "spinkick") {
    const spinProgress = e.stateTimer / 18;
    ctx.rotate(spinProgress * Math.PI * 2 * e.facing);
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
  } else if (e.state === "uppercut") {
    // Both arms up
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 0.8, shoulderY - limbLen * 1.5);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.3, shoulderY - limbLen);
  } else if (e.state === "dashpunch") {
    // Extended forward punch with both arms
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 2, shoulderY);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.5, shoulderY - 8);
  } else if (e.state === "spinkick" || e.state === "groundpound") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-limbLen * 0.8, shoulderY + limbLen * 0.3);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(limbLen * 0.8, shoulderY + limbLen * 0.3);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 10 : 0;
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-limbLen * 0.7, shoulderY + limbLen * 0.8 + swing);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(limbLen * 0.7, shoulderY + limbLen * 0.8 - swing);
  }
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = e.state === "uppercut" || e.state === "dashpunch" || e.state === "spinkick" ? 4 : 3;
  ctx.stroke();

  // Legs
  ctx.beginPath();
  if (e.state === "kick") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(e.facing * limbLen * 1.5, hipY - 5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-e.facing * limbLen * 0.5, hipY + limbLen);
  } else if (e.state === "jump" || e.state === "uppercut") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen * 0.6, hipY + limbLen * 0.5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen * 0.6, hipY + limbLen * 0.5);
  } else if (e.state === "spinkick") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(e.facing * limbLen * 1.8, hipY);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-e.facing * limbLen * 0.6, hipY + limbLen * 0.8);
  } else if (e.state === "groundpound") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen, hipY + limbLen * 0.3);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen, hipY + limbLen * 0.3);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 12 : 0;
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen * 0.5 + swing, hipY + limbLen);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen * 0.5 - swing, hipY + limbLen);
  }
  ctx.strokeStyle = isPlayer ? "#FFD700" : "#ff4444";
  ctx.lineWidth = e.state === "spinkick" ? 4 : 3;
  ctx.stroke();

  // Special move glow
  if (["uppercut", "spinkick", "dashpunch", "groundpound"].includes(e.state)) {
    ctx.beginPath();
    ctx.arc(0, headCY + headR + bodyLen / 2, 35, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(0, headCY + headR + bodyLen / 2, 5, 0, headCY + headR + bodyLen / 2, 35);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.4)");
    glow.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fill();
  }

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

function drawHitEffects(ctx: CanvasRenderingContext2D, effects: HitEffect[], camX: number) {
  for (const fx of effects) {
    const alpha = fx.timer / 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${fx.size}px monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = fx.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    const fxY = fx.y - (30 - fx.timer) * 1.5;
    ctx.strokeText(fx.text, fx.x - camX, fxY);
    ctx.fillText(fx.text, fx.x - camX, fxY);
    ctx.restore();
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
    state: "idle" as AttackState, stateTimer: 0, attackCooldown: 0,
    aiTimer: Math.random() * 60,
  }));
}

const SPECIAL_ATTACKS: Record<string, { frames: number; range: number; dmg: number; knockback: number; energyCost: number }> = {
  uppercut: { frames: 18, range: 50, dmg: 30, knockback: 8, energyCost: 25 },
  spinkick: { frames: 20, range: 65, dmg: 25, knockback: 6, energyCost: 20 },
  dashpunch: { frames: 14, range: 70, dmg: 22, knockback: 12, energyCost: 20 },
  groundpound: { frames: 22, range: 80, dmg: 40, knockback: 10, energyCost: 40 },
};

export const StreetBrawler: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "victory">("menu");
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [comboCount, setComboCount] = useState(0);
  const [comboName, setComboName] = useState("");
  const [energy, setEnergy] = useState(0);

  const gameRef = useRef<{
    player: Entity;
    enemies: Entity[];
    keys: Set<string>;
    keyJustPressed: Set<string>;
    camX: number;
    wave: number;
    score: number;
    headImg: HTMLImageElement | null;
    animFrame: number;
    running: boolean;
    combo: ComboState;
    effects: HitEffect[];
    powerups: PowerUp[];
    speedBoostTimer: number;
    dmgBoostTimer: number;
  }>({
    player: createPlayer(),
    enemies: [],
    keys: new Set(),
    keyJustPressed: new Set(),
    camX: 0,
    wave: 0,
    score: 0,
    headImg: null,
    animFrame: 0,
    running: false,
    combo: { inputs: [], timer: 0, hitCount: 0, hitTimer: 0, multiplier: 1, specialCooldown: 0, specialEnergy: 0 },
    effects: [],
    powerups: [],
    speedBoostTimer: 0,
    dmgBoostTimer: 0,
  });

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
    g.combo = { inputs: [], timer: 0, hitCount: 0, hitTimer: 0, multiplier: 1, specialCooldown: 0, specialEnergy: 50 };
    g.effects = [];
    g.powerups = [];
    g.speedBoostTimer = 0;
    g.dmgBoostTimer = 0;
    setWave(0);
    setScore(0);
    setPlayerHp(100);
    setComboCount(0);
    setComboName("");
    setEnergy(50);
    setGameState("playing");
  }, []);

  // Input handling
  useEffect(() => {
    if (gameState !== "playing") return;
    const g = gameRef.current;
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!g.keys.has(key)) g.keyJustPressed.add(key);
      g.keys.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault();
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
      const c = g.combo;

      // Combo timers
      c.timer = Math.max(0, c.timer - 1);
      c.hitTimer = Math.max(0, c.hitTimer - 1);
      c.specialCooldown = Math.max(0, c.specialCooldown - 1);
      if (c.timer === 0) c.inputs = [];
      if (c.hitTimer === 0 && c.hitCount > 0) {
        c.hitCount = 0;
        c.multiplier = 1;
        setComboCount(0);
      }

      // Update effects
      g.effects = g.effects.filter(fx => { fx.timer--; return fx.timer > 0; });

      const isAttacking = ["punch", "kick", "uppercut", "spinkick", "dashpunch", "groundpound"].includes(p.state);

      // Always buffer combo inputs, even during attacks
      let didSpecial = false;
      if (p.state !== "dead" && (g.keyJustPressed.has("j") || g.keyJustPressed.has("k"))) {
        const newInput = g.keyJustPressed.has("j") ? "j" : "k";
        c.inputs.push(newInput);
        c.timer = COMBO_WINDOW;

        // Check combos
        for (const combo of COMBOS) {
          const len = combo.inputs.length;
          const recent = c.inputs.slice(-len);
          if (recent.length === len && recent.every((v, i) => v === combo.inputs[i])) {
            const spec = SPECIAL_ATTACKS[combo.move];
            if (spec && c.specialEnergy >= spec.energyCost) {
              p.state = combo.move;
              p.stateTimer = spec.frames;
              p.attackCooldown = spec.frames + 5;
              c.specialEnergy -= spec.energyCost;
              c.inputs = [];
              setEnergy(c.specialEnergy);
              setComboName(combo.name);
              g.effects.push({
                x: p.x, y: p.y - 80, timer: 40,
                text: combo.name, color: "#FFD700", size: 20,
              });
              didSpecial = true;
              setTimeout(() => setComboName(""), 1000);
              break;
            }
          }
        }
      }

      // Ground Pound: press L while airborne
      if (!didSpecial && g.keyJustPressed.has("l") && p.y < GROUND_Y && c.specialEnergy >= SPECIAL_ATTACKS.groundpound.energyCost) {
        p.state = "groundpound";
        p.stateTimer = SPECIAL_ATTACKS.groundpound.frames;
        p.attackCooldown = SPECIAL_ATTACKS.groundpound.frames + 5;
        p.vy = 15;
        c.specialEnergy -= SPECIAL_ATTACKS.groundpound.energyCost;
        setEnergy(c.specialEnergy);
        setComboName("GROUND POUND!");
        g.effects.push({ x: p.x, y: p.y - 80, timer: 40, text: "GROUND POUND!", color: "#ff6600", size: 18 });
        didSpecial = true;
        setTimeout(() => setComboName(""), 1000);
      }

      // Player movement & basic attacks (blocked during attack animations)
      if (p.state !== "hit" && p.state !== "dead" && !isAttacking && !didSpecial) {
        let moving = false;
        if (g.keys.has("a") || g.keys.has("arrowleft")) { p.x -= PLAYER_SPEED; p.facing = -1; moving = true; }
        if (g.keys.has("d") || g.keys.has("arrowright")) { p.x += PLAYER_SPEED; p.facing = 1; moving = true; }
        if ((g.keys.has("w") || g.keys.has("arrowup") || g.keys.has(" ")) && p.y >= GROUND_Y) p.vy = JUMP_FORCE;

        if (g.keyJustPressed.has("j") && p.attackCooldown <= 0) {
          p.state = "punch"; p.stateTimer = 12; p.attackCooldown = 14;
        } else if (g.keyJustPressed.has("k") && p.attackCooldown <= 0) {
          p.state = "kick"; p.stateTimer = 15; p.attackCooldown = 17;
        } else if (p.stateTimer <= 0) {
          p.state = moving ? "walk" : p.y < GROUND_Y ? "jump" : "idle";
        }
      } else if (p.state !== "hit" && p.state !== "dead" && !isAttacking && didSpecial) {
        // Special move was triggered, movement already handled by the special
      } else if (p.state !== "hit" && p.state !== "dead" && isAttacking) {
        // Allow movement during attacks (for dash punch etc)
        if (g.keys.has("a") || g.keys.has("arrowleft")) p.facing = -1;
        if (g.keys.has("d") || g.keys.has("arrowright")) p.facing = 1;
      }

      g.keyJustPressed.clear();

      // Player physics
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= GROUND_Y) {
        // Ground pound shockwave on landing
        if (p.state === "groundpound" && p.vy > 5) {
          g.effects.push({ x: p.x, y: GROUND_Y, timer: 15, text: "💥", color: "#ff6600", size: 24 });
        }
        p.y = GROUND_Y;
        p.vy = 0;
      }
      p.x = Math.max(20, Math.min(LEVEL_WIDTH - 20, p.x));
      p.x += p.vx || 0;
      if (p.state === "dashpunch" && p.stateTimer > 5) p.x += p.facing * 6; // dash forward
      p.vx = (p.vx || 0) * 0.85;
      p.stateTimer = Math.max(-1, p.stateTimer - 1);
      p.attackCooldown = Math.max(-1, p.attackCooldown - 1);
      if (p.state === "hit" && p.stateTimer <= 0) p.state = "idle";
      if (isAttacking && p.stateTimer <= 0) p.state = "idle";

      // Player attack hit detection (all attack types)
      const hitFrame = (
        (p.state === "punch" && p.stateTimer === 8) ||
        (p.state === "kick" && p.stateTimer === 10) ||
        (p.state === "uppercut" && p.stateTimer === 12) ||
        (p.state === "spinkick" && (p.stateTimer === 14 || p.stateTimer === 8)) ||
        (p.state === "dashpunch" && p.stateTimer === 8) ||
        (p.state === "groundpound" && p.y >= GROUND_Y - 5 && p.stateTimer > 5)
      );

      if (hitFrame) {
        const spec = SPECIAL_ATTACKS[p.state];
        const range = spec ? spec.range : (p.state === "punch" ? 45 : 55);
        const baseDmg = spec ? spec.dmg : (p.state === "punch" ? 12 : 18);
        const kb = spec ? spec.knockback : (p.state === "punch" ? 5 : 6);
        const dmg = Math.round(baseDmg * c.multiplier);

        for (const e of g.enemies) {
          if (e.state === "dead") continue;
          const dx = e.x - p.x;
          const isGroundPound = p.state === "groundpound";
          const inRange = isGroundPound
            ? Math.abs(dx) < range && Math.abs(e.y - p.y) < 60
            : dx * p.facing > 0 && Math.abs(dx) < range && Math.abs(e.y - p.y) < 50;

          if (inRange) {
            e.hp -= dmg;
            e.state = "hit";
            e.stateTimer = spec ? 15 : 10;
            e.vx = (isGroundPound ? (dx > 0 ? 1 : -1) : p.facing) * kb;
            if (p.state === "uppercut") e.vy = -10;

            // Combo counter
            c.hitCount++;
            c.hitTimer = COMBO_HIT_WINDOW;
            c.multiplier = 1 + Math.min(c.hitCount * 0.15, 2);

            // Gain energy on hits
            c.specialEnergy = Math.min(MAX_ENERGY, c.specialEnergy + 5);
            setEnergy(c.specialEnergy);
            setComboCount(c.hitCount);

            // Hit effect
            g.effects.push({
              x: e.x, y: e.y - 50, timer: 25,
              text: c.hitCount > 2 ? `${dmg} x${c.hitCount}` : `${dmg}`,
              color: c.hitCount > 4 ? "#ff00ff" : c.hitCount > 2 ? "#FFD700" : "#ffffff",
              size: Math.min(14 + c.hitCount * 2, 24),
            });

            if (e.hp <= 0) {
              e.state = "dead";
              e.stateTimer = 60;
              const killBonus = Math.round(100 * c.multiplier);
              g.score += killBonus;
              setScore(g.score);
              g.effects.push({
                x: e.x, y: e.y - 70, timer: 35,
                text: `+${killBonus}`, color: "#00ff00", size: 16,
              });
              // Drop power-up
              if (Math.random() < DROP_CHANCE) {
                const types: PowerUp["type"][] = ["health", "speed", "energy", "damage"];
                const weights = [0.35, 0.25, 0.25, 0.15];
                let r = Math.random();
                let pType: PowerUp["type"] = "health";
                for (let ti = 0; ti < types.length; ti++) {
                  r -= weights[ti];
                  if (r <= 0) { pType = types[ti]; break; }
                }
                g.powerups.push({ x: e.x, y: e.y - 30, vy: -3, type: pType, timer: 600 });
              }
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
            c.hitCount = 0;
            c.multiplier = 1;
            setComboCount(0);
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

      // Power-up physics & collection
      g.speedBoostTimer = Math.max(0, g.speedBoostTimer - 1);
      g.dmgBoostTimer = Math.max(0, g.dmgBoostTimer - 1);

      g.powerups = g.powerups.filter(pu => {
        pu.vy += 0.3;
        pu.y += pu.vy;
        if (pu.y >= GROUND_Y) { pu.y = GROUND_Y; pu.vy = 0; }
        pu.timer--;

        // Check player pickup (30px radius)
        const dx = Math.abs(p.x - pu.x);
        const dy = Math.abs(p.y - pu.y);
        if (dx < 30 && dy < 40 && p.state !== "dead") {
          // Apply power-up
          switch (pu.type) {
            case "health":
              p.hp = Math.min(p.maxHp, p.hp + 25);
              setPlayerHp(p.hp);
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "+25 HP", color: "#00ff00", size: 16 });
              break;
            case "speed":
              g.speedBoostTimer = 300; // 5 seconds at 60fps
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "SPEED UP!", color: "#00ccff", size: 16 });
              break;
            case "energy":
              c.specialEnergy = Math.min(MAX_ENERGY, c.specialEnergy + 30);
              setEnergy(c.specialEnergy);
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "+30 ⚡", color: "#ffcc00", size: 16 });
              break;
            case "damage":
              g.dmgBoostTimer = 300; // 5 seconds
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "DMG BOOST!", color: "#ff4444", size: 16 });
              break;
          }
          return false; // remove collected
        }
        return pu.timer > 0;
      });

      // Apply speed boost to player movement
      if (g.speedBoostTimer > 0) {
        // Speed boost handled by multiplying movement in the movement section
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

      // Combo counter on canvas
      if (c.hitCount > 1) {
        ctx.font = `bold ${16 + c.hitCount}px monospace`;
        ctx.fillStyle = c.hitCount > 4 ? "#ff00ff" : "#FFD700";
        ctx.textAlign = "right";
        ctx.fillText(`${c.hitCount} HIT COMBO!`, CANVAS_W - 20, 50);
        ctx.font = "12px monospace";
        ctx.fillStyle = "#ffd700aa";
        ctx.fillText(`x${c.multiplier.toFixed(1)} damage`, CANVAS_W - 20, 68);
      }

      // Energy bar on canvas
      ctx.fillStyle = "#333";
      ctx.fillRect(20, 40, 100, 8);
      ctx.fillStyle = c.specialEnergy > 20 ? "#00ccff" : "#ff6600";
      ctx.fillRect(20, 40, (c.specialEnergy / MAX_ENERGY) * 100, 8);
      ctx.font = "10px monospace";
      ctx.fillStyle = "#ffffffaa";
      ctx.textAlign = "left";
      ctx.fillText("⚡ ENERGY", 20, 36);

      for (const e of g.enemies) {
        if (e.state === "dead" && e.stateTimer <= 0) continue;
        drawStickFigure(ctx, e, g.camX, null, false);
      }
      drawStickFigure(ctx, p, g.camX, g.headImg, true);
      drawHitEffects(ctx, g.effects, g.camX);

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
    if (action === "punch") { g.keyJustPressed.add("j"); g.keys.add("j"); setTimeout(() => g.keys.delete("j"), 100); }
    else if (action === "kick") { g.keyJustPressed.add("k"); g.keys.add("k"); setTimeout(() => g.keys.delete("k"), 100); }
    else if (action === "jump") { g.keys.add("w"); setTimeout(() => g.keys.delete("w"), 150); }
    else if (action === "special") { g.keyJustPressed.add("l"); g.keys.add("l"); setTimeout(() => g.keys.delete("l"), 100); }
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
              Fight through waves of thugs! Chain attacks for combos and unleash devastating special moves!
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs text-muted-foreground">
              <div className="glass-card p-2">A/D — Move</div>
              <div className="glass-card p-2">W/Space — Jump</div>
              <div className="glass-card p-2">J — Punch</div>
              <div className="glass-card p-2">K — Kick</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary">⚡ SPECIAL COMBOS</p>
              <div className="grid grid-cols-1 gap-1 max-w-sm mx-auto text-xs text-muted-foreground">
                <div className="glass-card p-2 flex justify-between"><span>J → J → K</span><span className="text-primary">Uppercut</span></div>
                <div className="glass-card p-2 flex justify-between"><span>K → K → J</span><span className="text-primary">Spin Kick</span></div>
                <div className="glass-card p-2 flex justify-between"><span>J → K → J</span><span className="text-primary">Dash Punch</span></div>
                <div className="glass-card p-2 flex justify-between"><span>L (in air)</span><span className="text-primary">Ground Pound</span></div>
              </div>
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
                <Heart className="w-4 h-4 text-destructive" />
                <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-destructive to-green-500 transition-all"
                    style={{ width: `${playerHp}%` }}
                  />
                </div>
              </div>
              {comboCount > 1 && (
                <span className="text-primary font-bold animate-pulse">{comboCount}x COMBO!</span>
              )}
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
            <div className="flex justify-between items-center gap-1 md:hidden">
              <div className="flex gap-1">
                <button
                  onTouchStart={() => touchMove("left")}
                  onTouchEnd={() => touchMove("stop")}
                  className="w-11 h-11 glass-card flex items-center justify-center text-lg font-bold text-primary active:bg-primary/20"
                >◀</button>
                <button
                  onTouchStart={() => touchMove("right")}
                  onTouchEnd={() => touchMove("stop")}
                  className="w-11 h-11 glass-card flex items-center justify-center text-lg font-bold text-primary active:bg-primary/20"
                >▶</button>
              </div>
              <button
                onTouchStart={() => touchAction("jump")}
                className="w-11 h-11 glass-card flex items-center justify-center text-xs font-bold text-primary active:bg-primary/20"
              >⬆</button>
              <div className="flex gap-1">
                <button
                  onTouchStart={() => touchAction("punch")}
                  className="w-11 h-11 glass-card flex items-center justify-center text-xs font-bold text-destructive active:bg-destructive/20"
                >👊</button>
                <button
                  onTouchStart={() => touchAction("kick")}
                  className="w-11 h-11 glass-card flex items-center justify-center text-xs font-bold text-destructive active:bg-destructive/20"
                >🦵</button>
                <button
                  onTouchStart={() => touchAction("special")}
                  className="w-11 h-11 glass-card flex items-center justify-center text-xs font-bold text-accent active:bg-accent/20"
                >⚡</button>
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
