import { FC, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Heart, RotateCcw, Play, Trophy, Zap, Volume2, VolumeX } from "lucide-react";
import waldogeHead from "@/assets/waldoge-head.png";
import { SFX } from "@/lib/gameSfx";

type AttackState = "idle" | "walk" | "jump" | "punch" | "kick" | "hit" | "dead"
  | "uppercut" | "spinkick" | "groundpound" | "dashpunch"
  | "boss_charge" | "boss_slam" | "boss_throw";

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
  isBoss?: boolean;
  bossPhase?: number;
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

interface WeaponPickup {
  x: number;
  y: number;
  collected: boolean;
}

const BAT_DURATION = 600; // frames (~10 seconds at 60fps)
const BAT_RANGE_BONUS = 25;
const BAT_DMG_MULTIPLIER = 1.8;

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
  { count: 0, hp: 0, speed: 0 }, // Boss wave
];

const BOSS_HP = 500;
const BOSS_CHARGE_SPEED = 6;

interface Projectile {
  x: number; y: number; vx: number; vy: number; timer: number;
}

function spawnBoss(playerX: number): Entity {
  return {
    x: playerX + 500, y: GROUND_Y, vy: 0, vx: 0,
    width: 50, height: 90, facing: -1,
    hp: BOSS_HP, maxHp: BOSS_HP,
    state: "idle", stateTimer: 0, attackCooldown: 60,
    isBoss: true, bossPhase: 1, aiTimer: 90,
  };
}

function drawBoss(ctx: CanvasRenderingContext2D, e: Entity, camX: number) {
  const sx = e.x - camX;
  const sy = e.y;
  const scale = 1.8;
  const headR = 20;
  const bodyLen = 40;
  const limbLen = 28;

  ctx.save();
  ctx.translate(sx, sy);
  if (e.state === "hit") ctx.globalAlpha = 0.6;
  if (e.state === "dead") { ctx.rotate(e.facing * Math.PI / 3); ctx.globalAlpha = 0.4; }

  const headCY = -bodyLen - limbLen - headR;

  // Boss aura
  if (e.state !== "dead") {
    ctx.beginPath();
    ctx.arc(0, headCY + headR + bodyLen / 2, 50, 0, Math.PI * 2);
    const aura = ctx.createRadialGradient(0, headCY + headR + bodyLen / 2, 5, 0, headCY + headR + bodyLen / 2, 50);
    const phase = e.bossPhase || 1;
    const auraColor = phase >= 3 ? "255, 0, 0" : phase >= 2 ? "255, 100, 0" : "200, 0, 255";
    aura.addColorStop(0, `rgba(${auraColor}, 0.3)`);
    aura.addColorStop(1, `rgba(${auraColor}, 0)`);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  // Head — skull-like
  ctx.beginPath();
  ctx.arc(0, headCY, headR, 0, Math.PI * 2);
  ctx.fillStyle = e.state === "dead" ? "#444" : "#8b0000";
  ctx.fill();
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 3;
  ctx.stroke();
  // Eyes
  ctx.fillStyle = "#ff4444";
  ctx.fillRect(-8, headCY - 5, 6, 5);
  ctx.fillRect(3, headCY - 5, 6, 5);
  // Mouth
  ctx.beginPath();
  ctx.moveTo(-8, headCY + 8);
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(-6 + i * 3, headCY + (i % 2 === 0 ? 8 : 14));
  }
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Body
  const neckY = headCY + headR;
  const hipY = neckY + bodyLen;
  ctx.beginPath();
  ctx.moveTo(0, neckY);
  ctx.lineTo(0, hipY);
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Arms
  const shoulderY = neckY + 10;
  ctx.beginPath();
  if (e.state === "boss_slam") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.8, shoulderY - limbLen);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen, shoulderY - limbLen * 0.5);
  } else if (e.state === "boss_charge") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.5, shoulderY);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen, shoulderY - limbLen * 0.8);
  } else if (e.state === "boss_throw") {
    const prog = e.stateTimer / 20;
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * (1 + prog), shoulderY - limbLen * prog);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.5, shoulderY + limbLen * 0.5);
  } else if (e.state === "punch") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.5, shoulderY - 5);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.5, shoulderY + 10);
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 200) * 12 : 0;
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-limbLen * 0.8, shoulderY + limbLen * 0.8 + swing);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(limbLen * 0.8, shoulderY + limbLen * 0.8 - swing);
  }
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Legs
  ctx.beginPath();
  const legSwing = e.state === "walk" || e.state === "boss_charge" ? Math.sin(Date.now() / 120) * 15 : 0;
  ctx.moveTo(0, hipY);
  ctx.lineTo(-limbLen * 0.6 + legSwing, hipY + limbLen);
  ctx.moveTo(0, hipY);
  ctx.lineTo(limbLen * 0.6 - legSwing, hipY + limbLen);
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();

  // Boss HP bar — large, at top of screen (drawn separately)
}

function drawBossHpBar(ctx: CanvasRenderingContext2D, boss: Entity, canvasW: number) {
  const barW = canvasW * 0.6;
  const barH = 12;
  const barX = (canvasW - barW) / 2;
  const barY = 8;
  const hpPct = Math.max(0, boss.hp / boss.maxHp);

  // Background
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = "#333";
  ctx.fillRect(barX, barY, barW, barH);

  // HP fill with color based on phase
  const phase = boss.bossPhase || 1;
  const hpColor = phase >= 3 ? "#ff0000" : phase >= 2 ? "#ff6600" : "#cc00ff";
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX, barY, barW * hpPct, barH);

  // Border
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

  // Name
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#ff4444";
  ctx.textAlign = "center";
  const phaseText = phase >= 3 ? "ENRAGED" : phase >= 2 ? "FURIOUS" : "BOSS";
  ctx.fillText(`☠ ${phaseText} — DARK DOGE ☠`, canvasW / 2, barY + barH + 14);
}

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
  isPlayer: boolean,
  hasBat = false,
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
    // Draw bat in hand during punch
    if (hasBat) {
      ctx.stroke();
      ctx.beginPath();
      const batX = e.facing * limbLen * 1.5;
      const batY = shoulderY - 5;
      ctx.save();
      ctx.translate(batX, batY);
      ctx.rotate(e.facing * -0.3);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(-2, -22, 5, 24);
      ctx.fillStyle = "#A0522D";
      ctx.fillRect(-4, -26, 9, 8);
      ctx.restore();
      ctx.beginPath();
    }
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
    // Draw bat held at side when idle/walking
    if (hasBat) {
      ctx.stroke();
      ctx.beginPath();
      const handX = e.facing * limbLen * 0.7;
      const handY = shoulderY + limbLen * 0.8 - swing;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(e.facing * 0.3);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(-2, -2, 5, 22);
      ctx.fillStyle = "#A0522D";
      ctx.fillRect(-3, 18, 7, 6);
      ctx.restore();
      ctx.beginPath();
    }
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

interface AlleyObject {
  x: number;
  y: number;
  type: "crate" | "trashcan";
  hp: number;
  maxHp: number;
  broken: boolean;
  breakTimer: number;
}

function spawnAlleyObjects(): AlleyObject[] {
  const objs: AlleyObject[] = [];
  for (let i = 0; i < 12; i++) {
    const x = 350 + i * 250 + Math.random() * 100;
    const type = Math.random() > 0.4 ? "crate" : "trashcan";
    objs.push({
      x, y: GROUND_Y,
      type,
      hp: type === "crate" ? 15 : 25,
      maxHp: type === "crate" ? 15 : 25,
      broken: false,
      breakTimer: 0,
    });
  }
  return objs;
}

function drawAlleyObject(ctx: CanvasRenderingContext2D, obj: AlleyObject, camX: number) {
  const sx = obj.x - camX;
  if (sx < -60 || sx > CANVAS_W + 60) return;
  ctx.save();

  if (obj.broken) {
    ctx.globalAlpha = Math.max(0, obj.breakTimer / 40);
    // Debris
    ctx.translate(sx, obj.y);
    ctx.fillStyle = obj.type === "crate" ? "#8B6914" : "#666";
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 10;
      const dy = -(obj.breakTimer / 40) * (10 + i * 5);
      ctx.fillRect(dx - 3, dy - 3, 6 + (i % 3), 5);
    }
    ctx.restore();
    return;
  }

  ctx.translate(sx, obj.y);

  if (obj.type === "crate") {
    // Wooden crate
    const w = 28, h = 26;
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = "#6B4F12";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h, w, h);
    // Planks
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.moveTo(0, -h);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = "#5C4010";
    ctx.lineWidth = 1;
    ctx.stroke();
    // X marks
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, -h + 3);
    ctx.lineTo(w / 2 - 3, -3);
    ctx.moveTo(w / 2 - 3, -h + 3);
    ctx.lineTo(-w / 2 + 3, -3);
    ctx.strokeStyle = "#5C401044";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Damage cracks
    if (obj.hp < obj.maxHp) {
      ctx.strokeStyle = "#00000066";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, -h + 2);
      ctx.lineTo(-2, -h / 2);
      ctx.lineTo(4, -h / 2 + 3);
      ctx.stroke();
    }
  } else {
    // Metal trash can
    const w = 22, h = 34;
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2 - 2, -h);
    ctx.lineTo(w / 2 + 2, -h);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lid
    ctx.fillStyle = "#666";
    ctx.fillRect(-w / 2 - 4, -h - 4, w + 8, 5);
    ctx.strokeStyle = "#888";
    ctx.strokeRect(-w / 2 - 4, -h - 4, w + 8, 5);
    // Handle
    ctx.beginPath();
    ctx.arc(0, -h - 6, 4, Math.PI, 0);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Ridges
    for (let ry = -h + 8; ry < -4; ry += 10) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, ry);
      ctx.lineTo(w / 2, ry);
      ctx.strokeStyle = "#4a4a4a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Dent on damage
    if (obj.hp < obj.maxHp) {
      ctx.fillStyle = "#44444488";
      ctx.beginPath();
      ctx.ellipse(5, -h / 2, 6, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCity(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  // === LAYER 0: Sky with gradient ===
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#0a0a18");
  skyGrad.addColorStop(0.4, "#12102a");
  skyGrad.addColorStop(1, "#1a1530");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);

  // Stars
  ctx.fillStyle = "#ffffff22";
  for (let i = 0; i < 40; i++) {
    const sx = (i * 127 + 50) % canvasW;
    const sy = (i * 73 + 10) % (GROUND_Y * 0.4);
    const sz = ((i * 31) % 3) + 1;
    const twinkle = Math.sin(frameCount / 30 + i) * 0.3 + 0.7;
    ctx.globalAlpha = twinkle * 0.4;
    ctx.fillRect(sx, sy, sz, sz);
  }
  ctx.globalAlpha = 1;

  // === LAYER 1: Far skyline (slowest parallax 0.15) ===
  for (let i = 0; i < 25; i++) {
    const bx = i * 180 - (camX * 0.15) % 180;
    const bh = 60 + (i * 41) % 100;
    ctx.fillStyle = "#0d0b1e";
    ctx.fillRect(bx, GROUND_Y - bh, 100, bh);
    // Tiny windows
    ctx.fillStyle = "#ffd70015";
    for (let wy = GROUND_Y - bh + 8; wy < GROUND_Y - 8; wy += 14) {
      for (let wx = bx + 8; wx < bx + 92; wx += 18) {
        if ((wx * 7 + wy * 11) % 4 !== 0) ctx.fillRect(wx, wy, 5, 6);
      }
    }
  }

  // === LAYER 2: Mid buildings (parallax 0.4) ===
  for (let i = 0; i < 20; i++) {
    const bx = i * 160 - (camX * 0.4) % 160;
    const bh = 80 + (i * 59) % 130;
    ctx.fillStyle = "#15112a";
    ctx.fillRect(bx, GROUND_Y - bh, 90, bh);
    // Bigger windows
    ctx.fillStyle = "#ffd70028";
    for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + 82; wx += 22) {
        const lit = (wx * 13 + wy * 7) % 6 !== 0;
        if (lit) {
          ctx.fillStyle = ((wx + wy) % 3 === 0) ? "#ff66cc20" : "#ffd70028";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
    // Fire escape lines
    if (i % 3 === 0) {
      ctx.strokeStyle = "#1a1535";
      ctx.lineWidth = 1;
      for (let fy = GROUND_Y - bh + 30; fy < GROUND_Y - 10; fy += 35) {
        ctx.beginPath();
        ctx.moveTo(bx + 85, fy);
        ctx.lineTo(bx + 95, fy);
        ctx.lineTo(bx + 95, fy + 30);
        ctx.stroke();
      }
    }
  }

  // === LAYER 3: Foreground alley walls (parallax 0.75) ===
  // Left alley wall
  for (let i = 0; i < 30; i++) {
    const bx = i * 200 - (camX * 0.75) % 200;
    const bh = GROUND_Y - 20; // Tall walls
    // Brick wall
    ctx.fillStyle = "#1e1832";
    ctx.fillRect(bx, GROUND_Y - bh, 40, bh);
    // Brick pattern
    ctx.strokeStyle = "#16102a";
    ctx.lineWidth = 0.5;
    for (let by = GROUND_Y - bh; by < GROUND_Y; by += 8) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 40, by);
      ctx.stroke();
      const offset = (Math.floor(by / 8) % 2) * 10;
      for (let bxi = bx + offset; bxi < bx + 40; bxi += 20) {
        ctx.beginPath();
        ctx.moveTo(bxi, by);
        ctx.lineTo(bxi, by + 8);
        ctx.stroke();
      }
    }
    // Right wall on other side
    ctx.fillStyle = "#1e1832";
    ctx.fillRect(bx + 160, GROUND_Y - bh, 40, bh);
    ctx.strokeStyle = "#16102a";
    ctx.lineWidth = 0.5;
    for (let by = GROUND_Y - bh; by < GROUND_Y; by += 8) {
      ctx.beginPath();
      ctx.moveTo(bx + 160, by);
      ctx.lineTo(bx + 200, by);
      ctx.stroke();
    }
  }

  // === Neon signs (parallax 0.75, on walls) ===
  for (let i = 0; i < 8; i++) {
    const nx = i * 400 + 60 - (camX * 0.75) % 400;
    if (nx < -100 || nx > canvasW + 100) continue;
    const ny = GROUND_Y - 200 + (i % 3) * 30;

    // Flickering intensity
    const flicker = Math.sin(frameCount / 3 + i * 100) * 0.15
      + Math.sin(frameCount / 7 + i * 50) * 0.1
      + Math.sin(frameCount / 13 + i * 200) * 0.05;
    const intensity = Math.max(0.3, Math.min(1, 0.7 + flicker));

    const neonColor = i % 3 === 0 ? [255, 50, 150] : i % 3 === 1 ? [50, 200, 255] : [255, 100, 50];

    // Glow halo
    ctx.save();
    ctx.globalAlpha = intensity * 0.25;
    const glow = ctx.createRadialGradient(nx, ny, 5, nx, ny, 60);
    glow.addColorStop(0, `rgba(${neonColor.join(",")}, 0.6)`);
    glow.addColorStop(1, `rgba(${neonColor.join(",")}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(nx - 60, ny - 60, 120, 120);
    ctx.restore();

    // Sign box
    ctx.save();
    ctx.globalAlpha = intensity;
    ctx.strokeStyle = `rgb(${neonColor.join(",")})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgb(${neonColor.join(",")})`;
    ctx.shadowBlur = 8;
    const signs = ["BAR", "OPEN", "XXX", "24h", "EAT", "酒", "LIVE", "DOGE"];
    ctx.strokeRect(nx - 20, ny - 10, 40, 18);
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = `rgb(${neonColor.join(",")})`;
    ctx.textAlign = "center";
    ctx.fillText(signs[i % signs.length], nx, ny + 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // === Atmospheric overlay ===
  ctx.save();
  ctx.globalAlpha = 0.12;
  const atmosGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  atmosGrad.addColorStop(0, "#2a1050");
  atmosGrad.addColorStop(0.5, "#1a0a40");
  atmosGrad.addColorStop(1, "#0a0520");
  ctx.fillStyle = atmosGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);
  ctx.restore();

  // === FLOOR: Cracked asphalt ===
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 80);
  floorGrad.addColorStop(0, "#1a1a22");
  floorGrad.addColorStop(0.3, "#151518");
  floorGrad.addColorStop(1, "#0e0e12");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);

  // Road markings (cracked)
  ctx.strokeStyle = "#ffd70025";
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const mx = i * 100 - (camX * 0.95) % 100;
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y + 35);
    ctx.lineTo(mx + 35, GROUND_Y + 35);
    ctx.stroke();
  }

  // Cracks in asphalt
  ctx.strokeStyle = "#0a0a0e";
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const cx = i * 170 - (camX * 0.95) % 170 + 30;
    ctx.beginPath();
    ctx.moveTo(cx, GROUND_Y + 2);
    const seed = (i * 137) % 100;
    ctx.lineTo(cx + (seed % 15) - 7, GROUND_Y + 15);
    ctx.lineTo(cx + (seed % 20) - 10, GROUND_Y + 30);
    ctx.lineTo(cx + (seed % 10) - 5, GROUND_Y + 45);
    ctx.stroke();
    // Branch crack
    if (seed > 40) {
      ctx.beginPath();
      ctx.moveTo(cx + (seed % 15) - 7, GROUND_Y + 15);
      ctx.lineTo(cx + 15, GROUND_Y + 25);
      ctx.stroke();
    }
  }

  // === Puddles with neon reflections ===
  for (let i = 0; i < 6; i++) {
    const px = i * 500 + 200 - (camX * 0.95) % 500;
    if (px < -80 || px > canvasW + 80) continue;
    const pw = 50 + (i * 23) % 40;
    const ph = 6;
    const py = GROUND_Y + 10 + (i % 3) * 15;

    // Puddle base (dark reflective)
    ctx.save();
    ctx.globalAlpha = 0.6;
    const pudGrad = ctx.createRadialGradient(px, py, 2, px, py, pw / 2);
    pudGrad.addColorStop(0, "#1a1530");
    pudGrad.addColorStop(1, "#0e0a1a");
    ctx.fillStyle = pudGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, pw / 2, ph, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Neon reflection in puddle
    const reflectColor = i % 3 === 0 ? "255, 50, 150" : i % 3 === 1 ? "50, 200, 255" : "255, 100, 50";
    const reflFlicker = Math.sin(frameCount / 5 + i * 80) * 0.1 + 0.15;
    ctx.save();
    ctx.globalAlpha = reflFlicker;
    const reflGrad = ctx.createRadialGradient(px, py, 1, px, py, pw / 3);
    reflGrad.addColorStop(0, `rgba(${reflectColor}, 0.5)`);
    reflGrad.addColorStop(1, `rgba(${reflectColor}, 0)`);
    ctx.fillStyle = reflGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, pw / 3, ph * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shimmer ripple
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = `rgba(${reflectColor}, 0.3)`;
    ctx.lineWidth = 0.5;
    const rippleR = (frameCount / 20 + i * 10) % 20;
    ctx.beginPath();
    ctx.ellipse(px, py, rippleR, rippleR * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Gutter line at ground level
  ctx.strokeStyle = "#252530";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvasW, GROUND_Y);
  ctx.stroke();
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
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const sfxRef = useRef(true);

  const sfx = useCallback((fn: () => void) => {
    if (sfxRef.current) fn();
  }, []);

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
    projectiles: Projectile[];
    speedBoostTimer: number;
    dmgBoostTimer: number;
    weapons: WeaponPickup[];
    batTimer: number;
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
    projectiles: [],
    speedBoostTimer: 0,
    dmgBoostTimer: 0,
    weapons: [],
    batTimer: 0,
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
    g.projectiles = [];
    g.speedBoostTimer = 0;
    g.dmgBoostTimer = 0;
    g.batTimer = 0;
    // Spawn weapon pickups along the level
    g.weapons = [
      { x: 600, y: GROUND_Y, collected: false },
      { x: 1400, y: GROUND_Y, collected: false },
      { x: 2200, y: GROUND_Y, collected: false },
      { x: 2800, y: GROUND_Y, collected: false },
    ];
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
              // SFX for special moves
              if (combo.move === "uppercut") sfx(() => SFX.uppercut());
              else if (combo.move === "spinkick") sfx(() => SFX.spinKick());
              else if (combo.move === "dashpunch") sfx(() => SFX.dashPunch());
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
         sfx(() => SFX.groundPound());
        setTimeout(() => setComboName(""), 1000);
      }

      // Player movement & basic attacks (blocked during attack animations)
      if (p.state !== "hit" && p.state !== "dead" && !isAttacking && !didSpecial) {
        const speed = PLAYER_SPEED * (g.speedBoostTimer > 0 ? 1.6 : 1);
        let moving = false;
        if (g.keys.has("a") || g.keys.has("arrowleft")) { p.x -= speed; p.facing = -1; moving = true; }
        if (g.keys.has("d") || g.keys.has("arrowright")) { p.x += speed; p.facing = 1; moving = true; }
        if ((g.keys.has("w") || g.keys.has("arrowup") || g.keys.has(" ")) && p.y >= GROUND_Y) p.vy = JUMP_FORCE;

        if (g.keyJustPressed.has("j") && p.attackCooldown <= 0) {
          p.state = "punch"; p.stateTimer = 12; p.attackCooldown = 14;
          sfx(() => g.batTimer > 0 ? SFX.batSwing() : SFX.punch());
        } else if (g.keyJustPressed.has("k") && p.attackCooldown <= 0) {
          p.state = "kick"; p.stateTimer = 15; p.attackCooldown = 17;
          sfx(() => g.batTimer > 0 ? SFX.batSwing() : SFX.kick());
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
        const baseRange = spec ? spec.range : (p.state === "punch" ? 45 : 55);
        const range = baseRange + (g.batTimer > 0 ? BAT_RANGE_BONUS : 0);
        const baseDmg = spec ? spec.dmg : (p.state === "punch" ? 12 : 18);
        const dmgMult = (g.dmgBoostTimer > 0 ? 1.5 : 1) * (g.batTimer > 0 ? BAT_DMG_MULTIPLIER : 1);
        const kb = spec ? spec.knockback : (p.state === "punch" ? 5 : 6);
        const dmg = Math.round(baseDmg * c.multiplier * dmgMult);

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
            sfx(() => SFX.comboHit(c.hitCount));
            g.effects.push({
              x: e.x, y: e.y - 50, timer: 25,
              text: c.hitCount > 2 ? `${dmg} x${c.hitCount}` : `${dmg}`,
              color: c.hitCount > 4 ? "#ff00ff" : c.hitCount > 2 ? "#FFD700" : "#ffffff",
              size: Math.min(14 + c.hitCount * 2, 24),
            });

            if (e.hp <= 0) {
              e.state = "dead";
              e.stateTimer = 60;
              sfx(() => e.isBoss ? SFX.victory() : SFX.enemyDeath());
              const killBonus = e.isBoss ? Math.round(1000 * c.multiplier) : Math.round(100 * c.multiplier);
              g.score += killBonus;
              setScore(g.score);
              g.effects.push({
                x: e.x, y: e.y - 70, timer: e.isBoss ? 60 : 35,
                text: e.isBoss ? `BOSS DEFEATED! +${killBonus}` : `+${killBonus}`,
                color: e.isBoss ? "#FFD700" : "#00ff00",
                size: e.isBoss ? 22 : 16,
              });
              // Drop power-up (boss always drops)
              const dropChance = e.isBoss ? 1 : DROP_CHANCE;
              if (Math.random() < dropChance) {
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
        if ((e.state === "boss_charge" || e.state === "boss_slam" || e.state === "boss_throw") && e.stateTimer <= 0) e.state = "idle";

        // Boss AI
        if (e.isBoss) {
          // Update boss phase based on HP
          if (e.hp <= e.maxHp * 0.3) e.bossPhase = 3;
          else if (e.hp <= e.maxHp * 0.6) e.bossPhase = 2;

          const bossStates: AttackState[] = ["boss_charge", "boss_slam", "boss_throw", "punch", "kick"];
          const isBossAttacking = bossStates.includes(e.state) || e.state === "hit";

          if (!isBossAttacking) {
            const dx = p.x - e.x;
            const dist = Math.abs(dx);
            e.facing = dx > 0 ? 1 : -1;
            const phaseSpeed = 1.5 + (e.bossPhase || 1) * 0.5;

            if (e.attackCooldown <= 0) {
              // Choose attack based on distance and phase
              const phase = e.bossPhase || 1;
              if (dist > 250 && phase >= 2) {
                // Charge attack
                e.state = "boss_charge";
                e.stateTimer = 30;
                sfx(() => SFX.bossCharge());
                e.attackCooldown = 50 - phase * 8;
              } else if (dist > 150) {
                // Throw projectile
                e.state = "boss_throw";
                e.stateTimer = 20;
                e.attackCooldown = 40 - phase * 5;
              } else if (dist < 80) {
                // Slam (AOE)
                e.state = "boss_slam";
                e.stateTimer = 25;
                sfx(() => SFX.bossSlam());
                e.attackCooldown = 45 - phase * 8;
              } else {
                // Regular attacks
                const atk = Math.random() > 0.5 ? "punch" : "kick";
                e.state = atk;
                e.stateTimer = atk === "punch" ? 14 : 17;
                e.attackCooldown = 25 - phase * 3;
              }
            } else {
              // Walk toward player
              if (dist > 60) {
                e.x += e.facing * phaseSpeed;
                e.state = "walk";
              } else {
                e.state = "idle";
              }
            }
          }

          // Boss charge movement
          if (e.state === "boss_charge" && e.stateTimer > 5) {
            e.x += e.facing * BOSS_CHARGE_SPEED;
          }

          // Boss attack hit detection
          const bossHitFrame = (
            (e.state === "punch" && e.stateTimer === 9) ||
            (e.state === "kick" && e.stateTimer === 11) ||
            (e.state === "boss_charge" && e.stateTimer === 10) ||
            (e.state === "boss_slam" && e.stateTimer === 12)
          );

          // Boss throw spawns projectile
          if (e.state === "boss_throw" && e.stateTimer === 10) {
            sfx(() => SFX.bossThrow());
            g.projectiles.push({
              x: e.x + e.facing * 30, y: e.y - 30,
              vx: e.facing * 7, vy: -2,
              timer: 120,
            });
          }

          if (bossHitFrame) {
            const range = e.state === "boss_slam" ? 100 : e.state === "boss_charge" ? 60 : 55;
            const dmg = e.state === "boss_slam" ? 20 : e.state === "boss_charge" ? 15 : e.state === "punch" ? 10 : 12;
            const edx = p.x - e.x;
            const inRange = e.state === "boss_slam"
              ? Math.abs(edx) < range && Math.abs(p.y - e.y) < 70
              : edx * e.facing > 0 && Math.abs(edx) < range && Math.abs(p.y - e.y) < 60;

            if (inRange && p.state !== "dead") {
              sfx(() => SFX.hit());
              p.hp -= dmg;
              p.state = "hit";
              p.stateTimer = e.state === "boss_slam" ? 15 : 10;
              p.vx = e.facing * (e.state === "boss_charge" ? 10 : e.state === "boss_slam" ? 6 : 4);
              if (e.state === "boss_slam") p.vy = -8;
              c.hitCount = 0;
              c.multiplier = 1;
              setComboCount(0);
              setPlayerHp(Math.max(0, p.hp));
              g.effects.push({
                x: p.x, y: p.y - 50, timer: 25,
                text: `${dmg}`, color: "#ff0000", size: 18,
              });
              if (p.hp <= 0) {
                p.state = "dead";
                g.running = false;
                sfx(() => SFX.gameOver());
                setGameState("gameover");
                return;
              }
            }

            // Boss slam shockwave effect
            if (e.state === "boss_slam" && e.stateTimer === 12) {
              g.effects.push({ x: e.x, y: GROUND_Y, timer: 20, text: "💀 SLAM!", color: "#ff0000", size: 22 });
            }
          }

          continue; // skip normal enemy AI
        }

        // Normal enemy AI
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
            sfx(() => SFX.hit());
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
              sfx(() => SFX.gameOver());
              setGameState("gameover");
              return;
            }
          }
        }
      }

      // Projectile physics
      g.projectiles = g.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.vy += 0.15;
        proj.timer--;
        if (proj.y >= GROUND_Y) return false;

        // Hit player
        const dx = Math.abs(p.x - proj.x);
        const dy = Math.abs(p.y - proj.y);
        if (dx < 25 && dy < 35 && p.state !== "dead") {
          sfx(() => SFX.hit());
          p.hp -= 12;
          p.state = "hit";
          p.stateTimer = 10;
          p.vx = proj.vx > 0 ? 4 : -4;
          c.hitCount = 0;
          c.multiplier = 1;
          setComboCount(0);
          setPlayerHp(Math.max(0, p.hp));
          g.effects.push({ x: proj.x, y: proj.y - 20, timer: 20, text: "12", color: "#ff4444", size: 14 });
          if (p.hp <= 0) {
            p.state = "dead";
            g.running = false;
            sfx(() => SFX.gameOver());
            setGameState("gameover");
            return false;
          }
          return false;
        }
        return proj.timer > 0;
      });

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
          sfx(() => SFX.powerupPickup());
          // Apply power-up
          switch (pu.type) {
            case "health":
              p.hp = Math.min(p.maxHp, p.hp + 25);
              setPlayerHp(p.hp);
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "+25 HP", color: "#00ff00", size: 16 });
              break;
            case "speed":
              g.speedBoostTimer = 300;
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "SPEED UP!", color: "#00ccff", size: 16 });
              break;
            case "energy":
              c.specialEnergy = Math.min(MAX_ENERGY, c.specialEnergy + 30);
              setEnergy(c.specialEnergy);
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "+30 ⚡", color: "#ffcc00", size: 16 });
              break;
            case "damage":
              g.dmgBoostTimer = 300;
              g.effects.push({ x: pu.x, y: pu.y - 20, timer: 30, text: "DMG BOOST!", color: "#ff4444", size: 16 });
              break;
          }
          return false;
        }
        return pu.timer > 0;
      });

      // Weapon pickup collection & bat timer
      g.batTimer = Math.max(0, g.batTimer - 1);
      for (const wp of g.weapons) {
        if (wp.collected) continue;
        const dx = Math.abs(p.x - wp.x);
        const dy = Math.abs(p.y - wp.y);
        if (dx < 35 && dy < 40 && p.state !== "dead") {
          wp.collected = true;
          g.batTimer = BAT_DURATION;
          sfx(() => SFX.weaponPickup());
          g.effects.push({ x: wp.x, y: wp.y - 30, timer: 40, text: "🏏 BAT EQUIPPED!", color: "#ff8c00", size: 16 });
        }
      }

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
            sfx(() => SFX.victory());
            setGameState("victory");
            return;
          }
          const isBossWave = g.wave === WAVES.length - 1;
          if (isBossWave) {
            g.enemies = [spawnBoss(p.x)];
            g.projectiles = [];
            g.effects.push({ x: p.x, y: p.y - 100, timer: 90, text: "⚠ BOSS FIGHT! ⚠", color: "#ff0000", size: 24 });
            sfx(() => SFX.bossEntrance());
          } else {
            sfx(() => SFX.waveStart());
            g.enemies = spawnEnemies(g.wave, p.x);
          }
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
      const isBossWave = g.wave === WAVES.length - 1;
      const boss = g.enemies.find(e => e.isBoss && e.state !== "dead");
      if (boss) {
        drawBossHpBar(ctx, boss, CANVAS_W);
      } else {
        ctx.fillStyle = "#ffd70088";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`WAVE ${g.wave + 1}/${WAVES.length}`, CANVAS_W / 2, 25);
      }

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

      // Draw power-ups
      for (const pu of g.powerups) {
        const px = pu.x - g.camX;
        const py = pu.y;
        const bob = Math.sin(Date.now() / 200) * 3;
        // Glow
        ctx.beginPath();
        ctx.arc(px, py - 10 + bob, 14, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(px, py - 10 + bob, 2, px, py - 10 + bob, 14);
        glow.addColorStop(0, POWERUP_COLORS[pu.type] + "88");
        glow.addColorStop(1, POWERUP_COLORS[pu.type] + "00");
        ctx.fillStyle = glow;
        ctx.fill();
        // Icon
        ctx.font = "16px serif";
        ctx.textAlign = "center";
        ctx.fillText(POWERUP_ICONS[pu.type], px, py - 5 + bob);
        // Despawn warning flash
        if (pu.timer < 120 && Math.floor(pu.timer / 10) % 2 === 0) {
          ctx.globalAlpha = 0.3;
        }
        ctx.globalAlpha = 1;
      }

      // Draw weapon pickups on ground
      for (const wp of g.weapons) {
        if (wp.collected) continue;
        const wx = wp.x - g.camX;
        const wy = wp.y;
        const bob = Math.sin(Date.now() / 300) * 2;
        // Glow
        ctx.beginPath();
        ctx.arc(wx, wy - 12 + bob, 16, 0, Math.PI * 2);
        const wGlow = ctx.createRadialGradient(wx, wy - 12 + bob, 3, wx, wy - 12 + bob, 16);
        wGlow.addColorStop(0, "rgba(255, 140, 0, 0.5)");
        wGlow.addColorStop(1, "rgba(255, 140, 0, 0)");
        ctx.fillStyle = wGlow;
        ctx.fill();
        // Draw bat shape
        ctx.save();
        ctx.translate(wx, wy - 12 + bob);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-3, -18, 6, 28);
        ctx.fillStyle = "#A0522D";
        ctx.fillRect(-5, -22, 10, 8);
        ctx.restore();
      }

      // Boost indicators
      let boostY = 60;
      if (g.speedBoostTimer > 0) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#00ccff";
        ctx.textAlign = "left";
        ctx.fillText(`⚡ SPEED ${Math.ceil(g.speedBoostTimer / 60)}s`, 20, boostY);
        boostY += 14;
      }
      if (g.dmgBoostTimer > 0) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#ff4444";
        ctx.textAlign = "left";
        ctx.fillText(`💥 DMG x1.5 ${Math.ceil(g.dmgBoostTimer / 60)}s`, 20, boostY);
        boostY += 14;
      }
      if (g.batTimer > 0) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#ff8c00";
        ctx.textAlign = "left";
        ctx.fillText(`🏏 BAT ${Math.ceil(g.batTimer / 60)}s`, 20, boostY);
      }

      for (const e of g.enemies) {
        if (e.state === "dead" && e.stateTimer <= 0) continue;
        if (e.isBoss) {
          drawBoss(ctx, e, g.camX);
        } else {
          drawStickFigure(ctx, e, g.camX, null, false);
        }
      }

      // Draw projectiles
      for (const proj of g.projectiles) {
        const px = proj.x - g.camX;
        const py = proj.y;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        const projGlow = ctx.createRadialGradient(px, py, 2, px, py, 8);
        projGlow.addColorStop(0, "#ff4444");
        projGlow.addColorStop(1, "#ff000044");
        ctx.fillStyle = projGlow;
        ctx.fill();
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.fillText("🔥", px, py + 4);
      }

      drawStickFigure(ctx, p, g.camX, g.headImg, true, g.batTimer > 0);
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
              <span className="text-primary font-bold">
                {wave === WAVES.length - 1 ? "⚠ BOSS" : `Wave ${wave + 1}/${WAVES.length}`}
              </span>
              <span className="text-muted-foreground">Score: <span className="text-primary">{score}</span></span>
              <button
                onClick={() => { const v = !sfxEnabled; setSfxEnabled(v); sfxRef.current = v; }}
                className="p-1 rounded hover:bg-muted/50 transition"
                title={sfxEnabled ? "Mute SFX" : "Unmute SFX"}
              >
                {sfxEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </button>
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
