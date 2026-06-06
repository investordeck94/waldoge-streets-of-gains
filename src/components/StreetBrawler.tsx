import { FC, useEffect, useRef, useState, useCallback } from "react";
import waldogeMusic from "@/assets/waldoge-music.mp3";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, RotateCcw, Play, Trophy, Zap, Volume2, VolumeX, Maximize, Minimize, Pause } from "lucide-react";
import waldogeHead from "@/assets/waldoge-head.png";
import streetBrawlerCover from "@/assets/street-brawler-cover.png";
import jeetBossHead from "@/assets/jeet-boss-head.png";
import badActorBossHead from "@/assets/badactor-boss-head.png";
import ruggerBossHead from "@/assets/rugger-boss-head.png";
import fudderBossHead from "@/assets/boss-fudder-head.png";
import exitLiquidityBossHead from "@/assets/boss-exit-liquidity-head.png";
import mrMarketerBossHead from "@/assets/boss-mr-marketer-head.png";
import { SFX } from "@/lib/gameSfx";
import { STYLES, nextStyle, type StyleName } from "@/lib/fightStyles";
import { MOVE_SETS, CHAIN_RESET_MS, msToFrames, type Move } from "@/lib/fightMoves";

// Preloaded boss head images
const jeetHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = jeetBossHead; return i; })() : null;
const badActorHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = badActorBossHead; return i; })() : null;
const ruggerHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = ruggerBossHead; return i; })() : null;
const fudderHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = fudderBossHead; return i; })() : null;
const exitLiquidityHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = exitLiquidityBossHead; return i; })() : null;
const mrMarketerHeadImg: HTMLImageElement | null =
  typeof window !== "undefined" ? (() => { const i = new Image(); i.src = mrMarketerBossHead; return i; })() : null;

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
  bossName?: string;
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

type WeaponType = "bat" | "sword" | "shuriken";

interface WeaponPickup {
  x: number;
  y: number;
  vy: number;
  type: WeaponType;
  collected: boolean;
  timer: number;
}

const WEAPON_STATS: Record<WeaponType, { duration: number; rangeBonus: number; dmgMult: number; color: string; icon: string; name: string }> = {
  bat:      { duration: 600, rangeBonus: 25, dmgMult: 1.8, color: "#ff8c00", icon: "🏏", name: "BAT" },
  sword:    { duration: 480, rangeBonus: 35, dmgMult: 2.2, color: "#00ccff", icon: "⚔️", name: "SWORD" },
  shuriken: { duration: 360, rangeBonus: 10, dmgMult: 1.3, color: "#cc44ff", icon: "✦", name: "SHURIKEN" },
};
const SHURIKEN_AMMO = 5;
const WEAPON_DROP_CHANCE = 0.25;

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  wind: number;
}

interface Splash {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  size: number;
  inPuddle: boolean;
}

const RAIN_COUNT = 120;
const PUDDLE_POSITIONS = [200, 700, 1200, 1700, 2200, 2700]; // approximate puddle X coords

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

// Each level: 2 minion waves followed by a boss. Difficulty scales per level.
interface LevelConfig {
  waves: { count: number; hp: number; speed: number }[]; // minion waves before boss
  boss: { hp: number; chargeSpeed: number; aiSpeed: number; dmgMult: number; name: string };
  name: string;
  theme: SceneTheme;
}

type SceneTheme = "alley" | "city" | "suburbs" | "mall" | "park" | "office" | "chart";

const LEVELS: LevelConfig[] = [
  // Level 1 — easy intro boss
  {
    name: "ALLEY ROOKIE",
    theme: "alley",
    waves: [
      { count: 2, hp: 20, speed: 1.0 },
      { count: 3, hp: 25, speed: 1.2 },
    ],
    boss: { hp: 220, chargeSpeed: 4, aiSpeed: 1.2, dmgMult: 0.6, name: "JEET" },
  },
  {
    name: "BACKSTREET BRAWLER",
    theme: "city",
    waves: [
      { count: 3, hp: 30, speed: 1.3 },
      { count: 3, hp: 35, speed: 1.5 },
    ],
    boss: { hp: 300, chargeSpeed: 4.5, aiSpeed: 1.5, dmgMult: 0.75, name: "RUGGER" },
  },
  {
    name: "DOCKSIDE ENFORCER",
    theme: "suburbs",
    waves: [
      { count: 3, hp: 40, speed: 1.5 },
      { count: 4, hp: 45, speed: 1.7 },
    ],
    boss: { hp: 380, chargeSpeed: 5, aiSpeed: 1.8, dmgMult: 0.9, name: "BAD ACTOR" },
  },
  {
    name: "NEON KINGPIN",
    theme: "mall",
    waves: [
      { count: 4, hp: 50, speed: 1.7 },
      { count: 4, hp: 55, speed: 1.9 },
    ],
    boss: { hp: 460, chargeSpeed: 5.5, aiSpeed: 2.0, dmgMult: 1.0, name: "FUDDER" },
  },
  {
    name: "ROOFTOP REAPER",
    theme: "park",
    waves: [
      { count: 4, hp: 60, speed: 1.9 },
      { count: 5, hp: 65, speed: 2.1 },
    ],
    boss: { hp: 560, chargeSpeed: 6, aiSpeed: 2.2, dmgMult: 1.15, name: "EXIT LIQUIDITY" },
  },
  {
    name: "UNDERGROUND WARLORD",
    theme: "office",
    waves: [
      { count: 5, hp: 70, speed: 2.1 },
      { count: 5, hp: 80, speed: 2.3 },
    ],
    boss: { hp: 680, chargeSpeed: 6.5, aiSpeed: 2.5, dmgMult: 1.3, name: "MR MARKETER" },
  },
  // Level 7 — final hardest boss
  {
    name: "DARK DOGE OVERLORD",
    theme: "chart",
    waves: [
      { count: 5, hp: 90, speed: 2.3 },
      { count: 6, hp: 100, speed: 2.5 },
    ],
    boss: { hp: 850, chargeSpeed: 7.5, aiSpeed: 3.0, dmgMult: 1.5, name: "TICKER THIEF" },
  },
];

const WAVES_PER_LEVEL = 3; // 2 minion waves + 1 boss
const TOTAL_LEVELS = LEVELS.length;

interface Projectile {
  x: number; y: number; vx: number; vy: number; timer: number;
  isPlayerProjectile?: boolean;
  damage?: number;
}

function spawnBoss(playerX: number, levelIndex: number): Entity {
  const cfg = LEVELS[Math.min(levelIndex, LEVELS.length - 1)].boss;
  return {
    x: playerX + 500, y: GROUND_Y, vy: 0, vx: 0,
    width: 50, height: 90, facing: -1,
    hp: cfg.hp, maxHp: cfg.hp,
    state: "idle", stateTimer: 0, attackCooldown: 60,
    isBoss: true, bossPhase: 1, aiTimer: 90,
    bossName: cfg.name,
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

  // Head — use custom image for specific bosses, skull for others
  const customHead =
    e.bossName === "JEET" ? jeetHeadImg
    : e.bossName === "BAD ACTOR" ? badActorHeadImg
    : e.bossName === "RUGGER" ? ruggerHeadImg
    : e.bossName === "FUDDER" ? fudderHeadImg
    : e.bossName === "EXIT LIQUIDITY" ? exitLiquidityHeadImg
    : e.bossName === "MR MARKETER" ? mrMarketerHeadImg
    : null;
  if (customHead && customHead.complete && customHead.naturalWidth > 0) {
    const imgSize = headR * 3.2;
    if (e.state === "dead") ctx.globalAlpha *= 0.6;
    ctx.drawImage(customHead, -imgSize / 2, headCY - imgSize / 2, imgSize, imgSize);
  } else {
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
  }

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

  // Above-head HP bar (floats with boss)
  if (e.state !== "dead") {
    const barW = 90;
    const barH = 8;
    const barX = sx - barW / 2;
    const barY = sy - bodyLen - limbLen - headR * 2 - 28;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    const phase = e.bossPhase || 1;
    const hpColor = phase >= 3 ? "#ff0000" : phase >= 2 ? "#ff6600" : "#cc00ff";

    // Outer shadow/border
    ctx.fillStyle = "#000";
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    // Track
    ctx.fillStyle = "#2a0a0a";
    ctx.fillRect(barX, barY, barW, barH);
    // Fill
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    // Glossy highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(barX, barY, barW * hpPct, 2);
    // Bright border
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

    // Boss name above the bar
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#ffd700";
    const label = `☠ ${e.bossName || "BOSS"}`;
    ctx.strokeText(label, sx, barY - 5);
    ctx.fillText(label, sx, barY - 5);

    // HP number under the bar
    ctx.font = "bold 9px monospace";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "#ffffff";
    const hpTxt = `${Math.max(0, Math.ceil(e.hp))} / ${e.maxHp}`;
    ctx.strokeText(hpTxt, sx, barY + barH + 10);
    ctx.fillText(hpTxt, sx, barY + barH + 10);
  }
}

function drawBossHpBar(ctx: CanvasRenderingContext2D, boss: Entity, canvasW: number) {
  const barW = canvasW * 0.7;
  const barH = 16;
  const barX = (canvasW - barW) / 2;
  const barY = 10;
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

  // HP numeric
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`, canvasW / 2, barY + barH - 4);

  // Border
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

  // Name
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#ff4444";
  ctx.textAlign = "center";
  const phaseText = phase >= 3 ? "ENRAGED" : phase >= 2 ? "FURIOUS" : "BOSS";
  const name = boss.bossName || "BOSS";
  ctx.fillText(`☠ ${phaseText} — ${name} ☠`, canvasW / 2, barY + barH + 16);
}

// Combo recipes: input sequence → special move
const COMBOS: { inputs: string[]; move: AttackState; name: string }[] = [
  { inputs: ["j", "j", "k"], move: "uppercut", name: "UPPERCUT!" },
  { inputs: ["k", "k", "j"], move: "spinkick", name: "SPIN KICK!" },
  { inputs: ["j", "k", "j"], move: "dashpunch", name: "DASH PUNCH!" },
];

// Red candle-stickman minion: cylindrical candle body, flame on head,
// angry eyes, glove fists, stick limbs. Inspired by user reference image.
function drawCandleMinion(ctx: CanvasRenderingContext2D, e: Entity, camX: number) {
  const sx = e.x - camX;
  const sy = e.y;
  if (sx < -80 || sx > CANVAS_W + 80) return;

  const candleW = 22;        // body width
  const headLen = 28;        // upper candle segment height
  const torsoLen = 22;       // lower candle segment height
  const limbLen = 22;
  const wickLen = 8;

  // Vertical layout (relative to feet at y=sy)
  const hipY = -limbLen;                 // top of legs
  const torsoTop = hipY - torsoLen;      // top of lower segment
  const gap = 10;                        // visible neck gap between segments
  const headBottom = torsoTop - gap;     // bottom of head/upper candle
  const headTop = headBottom - headLen;  // top of upper candle
  const wickTop = headTop - wickLen;     // tip where flame sits

  ctx.save();
  ctx.translate(sx, sy);

  if (e.state === "hit") ctx.globalAlpha = 0.7;
  if (e.state === "dead") {
    ctx.rotate((e.facing * Math.PI) / 3);
    ctx.globalAlpha = 0.4;
  }

  // ---- Helpers ----
  const candleRed = e.state === "dead" ? "#5a1010" : "#d42020";
  const candleHi = e.state === "dead" ? "#7a2020" : "#ff6464";
  const candleSh = e.state === "dead" ? "#3a0808" : "#8a0d0d";
  const outline = "#3a0000";

  function drawCandleSegment(cy: number, h: number, w: number) {
    // Body
    ctx.fillStyle = candleRed;
    ctx.fillRect(-w / 2, cy, w, h);
    // Highlight stripe
    ctx.fillStyle = candleHi;
    ctx.fillRect(-w / 2 + 2, cy + 2, 3, h - 4);
    // Side shadow
    ctx.fillStyle = candleSh;
    ctx.fillRect(w / 2 - 3, cy + 2, 2, h - 4);
    // Outline
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, cy, w, h);
    // Top rim band
    ctx.fillStyle = "#ffb0b0";
    ctx.fillRect(-w / 2 + 1, cy + 1, w - 2, 2);
    // Bottom rim shadow
    ctx.fillStyle = candleSh;
    ctx.fillRect(-w / 2 + 1, cy + h - 3, w - 2, 2);
  }

  // ---- Lower segment (torso) ----
  drawCandleSegment(torsoTop, torsoLen, candleW);

  // ---- Upper segment (head) ----
  drawCandleSegment(headBottom - headLen, headLen, candleW);

  // ---- Angry eyes on head segment ----
  if (e.state !== "dead") {
    ctx.fillStyle = "#000";
    // Slanted eyebrow + eye for angry look
    ctx.save();
    // Left eye
    ctx.translate(-5, headBottom - headLen / 2 + 1);
    ctx.rotate(-0.35 * e.facing);
    ctx.fillRect(-3, -1, 6, 3);
    ctx.restore();
    // Right eye
    ctx.save();
    ctx.translate(5, headBottom - headLen / 2 + 1);
    ctx.rotate(0.35 * e.facing);
    ctx.fillRect(-3, -1, 6, 3);
    ctx.restore();
  }

  // ---- Wick ----
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, headTop);
  ctx.lineTo(0, wickTop);
  ctx.stroke();

  // ---- Flame (animated flicker) ----
  if (e.state !== "dead") {
    const flicker = Math.sin(Date.now() / 90 + sx * 0.05) * 1.2;
    const fY = wickTop;
    // Outer orange flame
    ctx.beginPath();
    ctx.moveTo(0, fY - 14 - flicker);
    ctx.bezierCurveTo(7, fY - 8, 5, fY + 2, 0, fY + 2);
    ctx.bezierCurveTo(-5, fY + 2, -7, fY - 8, 0, fY - 14 - flicker);
    ctx.fillStyle = "#ff6a00";
    ctx.fill();
    // Inner yellow
    ctx.beginPath();
    ctx.moveTo(0, fY - 9 - flicker * 0.6);
    ctx.bezierCurveTo(3.5, fY - 5, 3, fY, 0, fY);
    ctx.bezierCurveTo(-3, fY, -3.5, fY - 5, 0, fY - 9 - flicker * 0.6);
    ctx.fillStyle = "#ffd000";
    ctx.fill();
    // Flame glow
    const glow = ctx.createRadialGradient(0, fY - 6, 1, 0, fY - 6, 18);
    glow.addColorStop(0, "rgba(255, 180, 60, 0.35)");
    glow.addColorStop(1, "rgba(255, 180, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, fY - 6, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Arms (stick) with red glove fists ----
  const shoulderL = -candleW / 2 + 1;
  const shoulderR = candleW / 2 - 1;
  const shoulderY = torsoTop + 4;

  // Compute hand positions based on state
  let lHandX = shoulderL - limbLen * 0.7;
  let lHandY = shoulderY + limbLen * 0.6;
  let rHandX = shoulderR + limbLen * 0.7;
  let rHandY = shoulderY + limbLen * 0.6;

  if (e.state === "punch") {
    // Front fist forward, back hand low
    if (e.facing > 0) {
      rHandX = shoulderR + limbLen * 1.4;
      rHandY = shoulderY - 2;
      lHandX = shoulderL - limbLen * 0.4;
      lHandY = shoulderY + limbLen * 0.7;
    } else {
      lHandX = shoulderL - limbLen * 1.4;
      lHandY = shoulderY - 2;
      rHandX = shoulderR + limbLen * 0.4;
      rHandY = shoulderY + limbLen * 0.7;
    }
  } else if (e.state === "kick") {
    lHandX = shoulderL - limbLen * 0.5;
    lHandY = shoulderY + limbLen * 0.3;
    rHandX = shoulderR + limbLen * 0.5;
    rHandY = shoulderY + limbLen * 0.3;
  } else if (e.state === "walk") {
    const sw = Math.sin(Date.now() / 150) * 6;
    lHandY += sw;
    rHandY -= sw;
  }

  // Draw arm sticks
  ctx.strokeStyle = candleRed;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shoulderL, shoulderY);
  ctx.lineTo(lHandX, lHandY);
  ctx.moveTo(shoulderR, shoulderY);
  ctx.lineTo(rHandX, rHandY);
  ctx.stroke();

  // Glove fists
  function drawFist(fx: number, fy: number) {
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fillStyle = candleRed;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Highlight
    ctx.beginPath();
    ctx.arc(fx - 1.5, fy - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8080";
    ctx.fill();
  }
  drawFist(lHandX, lHandY);
  drawFist(rHandX, rHandY);

  // ---- Legs ----
  let lFootX = -candleW / 4 - 4;
  let lFootY = 0;
  let rFootX = candleW / 4 + 4;
  let rFootY = 0;

  if (e.state === "kick") {
    if (e.facing > 0) {
      rFootX = candleW / 2 + limbLen * 1.2;
      rFootY = -8;
    } else {
      lFootX = -candleW / 2 - limbLen * 1.2;
      lFootY = -8;
    }
  } else if (e.state === "jump" || e.state === "uppercut") {
    lFootY = -limbLen * 0.4;
    rFootY = -limbLen * 0.4;
  } else if (e.state === "walk") {
    const sw = Math.sin(Date.now() / 150) * 6;
    lFootX += sw;
    rFootX -= sw;
  }

  ctx.strokeStyle = candleRed;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-candleW / 4, hipY);
  ctx.lineTo(lFootX, lFootY);
  ctx.moveTo(candleW / 4, hipY);
  ctx.lineTo(rFootX, rFootY);
  ctx.stroke();

  // Shoe blobs
  function drawShoe(fx: number, fy: number, dir: number) {
    ctx.beginPath();
    ctx.ellipse(fx + dir * 3, fy, 6, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = candleRed;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  drawShoe(lFootX, lFootY, -1);
  drawShoe(rFootX, rFootY, 1);

  ctx.restore();

  // HP bar above flame — small/subtle
  if (e.state !== "dead") {
    const barW = 28;
    const barH = 3;
    const barX = sx - barW / 2;
    const barY = sy + wickTop - 12;
    // Background + border
    ctx.fillStyle = "#000";
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(barX, barY, barW, barH);
    // Fill
    ctx.fillStyle = e.hp > e.maxHp * 0.4 ? "#ff4040" : "#ffaa00";
    ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
  }
}


function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  camX: number,
  headImg: HTMLImageElement | null,
  isPlayer: boolean,
  weaponType: WeaponType | null = null,
  style: StyleName = "brawler",
) {
  const styleColor =
    style === "brawler" ? "#FFD700" :
    style === "rush" ? "#00ccff" :
    style === "muayThai" ? "#ff8800" :
    "#00ff66";
  const isBrawler = style === "brawler";
  const isRush = style === "rush";
  const isMuay = style === "muayThai";
  const isGreen = style === "greenCandle";
  const sx = e.x - camX;
  const sy = e.y;
  const headR = 16;
  const bodyLen = 30;
  const limbLen = 20;

  ctx.save();
  ctx.translate(sx, sy);

  // Per-style stance transforms (silhouette differentiation while idle/walking)
  if (isPlayer) {
    if (style === "rush") {
      // Forward-leaning ninja/speed stance
      ctx.transform(1, 0, -0.18 * e.facing, 1, 0, 0);
    } else if (style === "muayThai") {
      // Compact upright Muay Thai stance; lean forward into knee strike
      ctx.scale(0.95, 1);
      if (e.state === "kick") ctx.transform(1, 0, -0.22 * e.facing, 1, 0, 0);
    } else if (style === "greenCandle") {
      // Hunched berserker — wider, shorter. Skip hunch during lariat so the
      // body spin reads cleanly on screen.
      if (e.state === "spinkick") {
        ctx.scale(1.15, 1);
      } else {
        ctx.scale(1.28, 0.82);
        ctx.transform(1, 0, 0.08 * e.facing, 1, 0, 6);
      }
    }
  }



  if (e.state === "hit") ctx.globalAlpha = 0.6;
  if (e.state === "dead") {
    ctx.rotate((e.facing * Math.PI) / 3);
    ctx.globalAlpha = 0.4;
  }

  // Spin kick rotation — amount varies per style for recognizable silhouettes
  if (e.state === "spinkick") {
    const spinProgress = e.stateTimer / 18;
    const spins =
      isPlayer && style === "rush" ? 2.2 :        // tornado kick — extra spins
      isPlayer && style === "greenCandle" ? 3.0 : // lariat — very visible spin
      isPlayer && style === "muayThai" ? 1.1 :    // spinning elbow
      isPlayer && style === "brawler" ? 0.55 :    // half-spin roundhouse
      1;
    ctx.rotate(spinProgress * Math.PI * 2 * spins * e.facing);
  }

  const headCY = -bodyLen - limbLen - headR;

  // Head
  if (isPlayer && headImg && headImg.complete) {
    const s = headR * 3;
    ctx.save();
    if (e.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(headImg, -s / 2, headCY - s / 2, s, s);
    ctx.restore();
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
  if (isPlayer) {
    // Where's Waldo stickman torso: alternating red/white horizontal bands
    ctx.lineCap = "butt";
    const torsoH = hipY - neckY;
    const bandCount = 7;
    const bandH = torsoH / bandCount;
    const bandW = 10; // total stripe width across the stick body
    for (let i = 0; i < bandCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#d92b2b" : "#f5ece0";
      ctx.fillRect(-bandW / 2, neckY + i * bandH, bandW, bandH + 0.5);
    }
    // Thin dark outline so the stripes read cleanly
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-bandW / 2, neckY, bandW, torsoH);
    ctx.lineCap = "round";

  } else {
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Arms
  const shoulderY = neckY + 8;
  ctx.beginPath();
  if (e.state === "punch") {
    // Per-style punch silhouettes
    let frontArmEnd: [number, number];
    let backArmEnd: [number, number];
    let elbow: [number, number] | null = null;
    if (isPlayer && style === "rush") {
      // Lunging long jab
      frontArmEnd = [e.facing * limbLen * 2.8, shoulderY + 2];
      backArmEnd = [-e.facing * limbLen * 0.8, shoulderY + 12];
    } else if (isPlayer && style === "muayThai") {
      // Elbow strike thrust forward — elbow leads as the offensive striking surface
      elbow = [e.facing * limbLen * 1.1, shoulderY - 6];
      frontArmEnd = [e.facing * limbLen * 1.7, shoulderY - 2];
      backArmEnd = [-e.facing * limbLen * 0.2, shoulderY - 12];
    } else if (isPlayer && style === "greenCandle") {
      // Overhead smash
      frontArmEnd = [e.facing * limbLen * 1.4, shoulderY - limbLen * 1.4];
      backArmEnd = [-e.facing * limbLen * 0.5, shoulderY + 12];
    } else {
      // Brawler straight cross
      frontArmEnd = [e.facing * limbLen * 2.2, shoulderY - 3];
      backArmEnd = [-e.facing * limbLen * 0.6, shoulderY + 10];
    }
    ctx.moveTo(0, shoulderY);
    if (elbow) {
      ctx.lineTo(elbow[0], elbow[1]);
      ctx.lineTo(frontArmEnd[0], frontArmEnd[1]);
    } else {
      ctx.lineTo(frontArmEnd[0], frontArmEnd[1]);
    }
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(backArmEnd[0], backArmEnd[1]);
    // Draw weapon in hand during punch
    if (weaponType) {
      ctx.stroke();
      ctx.beginPath();
      const wX = frontArmEnd[0] * 0.85;
      const wY = frontArmEnd[1] - 2;
      ctx.save();
      ctx.translate(wX, wY);
      ctx.rotate(e.facing * -0.3);
      if (weaponType === "bat") {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-2, -22, 5, 24);
        ctx.fillStyle = "#A0522D";
        ctx.fillRect(-4, -26, 9, 8);
      } else if (weaponType === "sword") {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(-1.5, -28, 3, 30);
        ctx.fillStyle = "#888";
        ctx.fillRect(-4, -1, 8, 4);
        ctx.fillStyle = "#664400";
        ctx.fillRect(-2, 3, 4, 7);
      } else if (weaponType === "shuriken") {
        ctx.fillStyle = "#cc44ff";
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.fillRect(-1, -8, 2, 8);
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.beginPath();
    }
  } else if (e.state === "kick") {
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-e.facing * limbLen * 0.5, shoulderY - 8);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 0.3, shoulderY + 5);
  } else if (e.state === "uppercut") {
    if (isPlayer && style === "rush") {
      // Rising dash uppercut — long angled strike
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(e.facing * limbLen * 1.9, shoulderY - limbLen * 1.3);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-e.facing * limbLen * 0.5, shoulderY + 6);
    } else if (isPlayer && style === "muayThai") {
      // Upward elbow — bent arm with elbow leading skyward
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(e.facing * limbLen * 0.55, shoulderY - 4);
      ctx.lineTo(e.facing * limbLen * 0.2, shoulderY - limbLen * 1.7);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-e.facing * limbLen * 0.3, shoulderY - 6);
    } else if (isPlayer && style === "greenCandle") {
      // Brutal two-arm launcher — both arms thrust up & out
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(e.facing * limbLen * 0.9, shoulderY - limbLen * 1.7);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-e.facing * limbLen * 0.9, shoulderY - limbLen * 1.7);
    } else {
      // Brawler boxing uppercut — tight vertical front arm, back guard up
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(e.facing * limbLen * 0.55, shoulderY - limbLen * 1.8);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-e.facing * limbLen * 0.35, shoulderY - limbLen * 0.5);
    }
  } else if (e.state === "dashpunch") {
    // Extended forward punch with both arms
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 2, shoulderY);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 1.5, shoulderY - 8);
  } else if (e.state === "spinkick" || e.state === "groundpound") {
    if (isPlayer && e.state === "spinkick" && style === "muayThai") {
      // Spinning elbow — bent arm across chest
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.6, shoulderY - 10);
      ctx.lineTo(-limbLen * 0.7, shoulderY - 14);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.5, shoulderY + 8);
    } else if (isPlayer && e.state === "spinkick" && style === "greenCandle") {
      // Berserker lariat — both arms extended wide (clothesline)
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 1.7, shoulderY - 2);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 1.7, shoulderY - 2);
    } else if (isPlayer && e.state === "spinkick" && style === "rush") {
      // Tornado kick — arms tucked tight for fast spin
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 0.45, shoulderY + 4);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.45, shoulderY + 4);
    } else {
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 0.8, shoulderY + limbLen * 0.3);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.8, shoulderY + limbLen * 0.3);
    }
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 10 : 0;
    if (style === "rush") {
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 1.3, shoulderY + 4);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 1.3, shoulderY + 4);
    } else if (style === "muayThai") {
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 0.35, shoulderY - 8);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.35, shoulderY - 8);
    } else if (style === "greenCandle") {
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 1.0, shoulderY + 16);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 1.0, shoulderY + 16);
    } else {
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(-limbLen * 0.7, shoulderY + limbLen * 0.8 + swing);
      ctx.moveTo(0, shoulderY);
      ctx.lineTo(limbLen * 0.7, shoulderY + limbLen * 0.8 - swing);
    }
    // Draw weapon held at side when idle/walking
    if (weaponType) {
      ctx.stroke();
      ctx.beginPath();
      const handX = e.facing * limbLen * 0.7;
      const handY = shoulderY + limbLen * 0.8 - swing;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(e.facing * 0.3);
      if (weaponType === "bat") {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-2, -2, 5, 22);
        ctx.fillStyle = "#A0522D";
        ctx.fillRect(-3, 18, 7, 6);
      } else if (weaponType === "sword") {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(-1.5, -2, 3, 26);
        ctx.fillStyle = "#888";
        ctx.fillRect(-4, -3, 8, 3);
        ctx.fillStyle = "#664400";
        ctx.fillRect(-2, 24, 4, 5);
      } else if (weaponType === "shuriken") {
        ctx.fillStyle = "#cc44ff";
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.fillRect(-1, -6, 2, 6);
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.beginPath();
    }
  }
  ctx.strokeStyle = isPlayer ? "#d92b2b" : "#ff4444";
  ctx.lineWidth = isPlayer
    ? (e.state === "uppercut" || e.state === "dashpunch" || e.state === "spinkick" ? 7 : 6)
    : (e.state === "uppercut" || e.state === "dashpunch" || e.state === "spinkick" ? 4 : 3);
  ctx.lineCap = "round";
  ctx.stroke();
  // White stripe accent over arms (player Waldoge branding)
  if (isPlayer) {
    ctx.save();
    ctx.strokeStyle = "#f5ece0";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // Rush style: cyan speed trail on punch
  if (isPlayer && style === "rush" && e.state === "punch") {
    ctx.strokeStyle = "rgba(0,200,255,0.5)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(e.facing * limbLen * 3, shoulderY);
    ctx.stroke();
  }

  // Green Candle: large spinning green motion rings on the lariat
  if (isPlayer && style === "greenCandle" && e.state === "spinkick") {
    const p = e.stateTimer / 18;
    // Outer expanding aura
    ctx.strokeStyle = "rgba(0,255,100,0.25)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, hipY - 8, 48 + p * 14, 0, Math.PI * 2);
    ctx.stroke();
    // Mid swirl ring with broken arcs to suggest rotation
    ctx.strokeStyle = "rgba(0,255,120,0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, hipY - 4, 38, 0.2, Math.PI * 1.2);
    ctx.arc(0, hipY - 4, 38, Math.PI * 1.4, Math.PI * 1.95);
    ctx.stroke();
    // Inner bright ring
    ctx.strokeStyle = "rgba(180,255,200,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, hipY - 4, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Green Candle: pump rage particles around head
  if (isPlayer && isGreen) {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(0,255,100,0.25)";
      ctx.beginPath();
      ctx.arc(
        (Math.random() - 0.5) * 20,
        headCY - Math.random() * 20,
        3 + Math.random() * 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Boxing gloves on the player's hands
  if (isPlayer) {
    const drawGlove = (gx: number, gy: number, extended: boolean) => {
      const r = extended ? 11 : 10;
      // Wrist cuff
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(gx - e.facing * r * 0.4, gy + r * 0.5, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      // Glove body
      ctx.fillStyle = "#d62828";
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(gx - r * 0.3, gy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Thumb
      ctx.fillStyle = "#b81e1e";
      ctx.beginPath();
      ctx.arc(gx + e.facing * r * 0.5, gy + r * 0.2, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    };

    let frontHand: [number, number] | null = null;
    let backHand: [number, number] | null = null;

    if (e.state === "punch") {
      if (style === "rush") {
        frontHand = [e.facing * limbLen * 2.8, shoulderY + 2];
        backHand = [-e.facing * limbLen * 0.8, shoulderY + 12];
      } else if (style === "muayThai") {
        // elbow tip thrust forward (the striking surface)
        frontHand = [e.facing * limbLen * 1.7, shoulderY - 2];
        backHand = [-e.facing * limbLen * 0.2, shoulderY - 12];
      } else if (style === "greenCandle") {
        frontHand = [e.facing * limbLen * 1.4, shoulderY - limbLen * 1.4];
        backHand = [-e.facing * limbLen * 0.5, shoulderY + 12];
      } else {
        frontHand = [e.facing * limbLen * 2.2, shoulderY - 3];
        backHand = [-e.facing * limbLen * 0.6, shoulderY + 10];
      }
    } else if (e.state === "kick") {
      frontHand = [-e.facing * limbLen * 0.5, shoulderY - 8];
      backHand = [e.facing * limbLen * 0.3, shoulderY + 5];
    } else if (e.state === "uppercut") {
      if (style === "rush") {
        frontHand = [e.facing * limbLen * 1.9, shoulderY - limbLen * 1.3];
        backHand = [-e.facing * limbLen * 0.5, shoulderY + 6];
      } else if (style === "muayThai") {
        frontHand = [e.facing * limbLen * 0.2, shoulderY - limbLen * 1.7];
        backHand = [-e.facing * limbLen * 0.3, shoulderY - 6];
      } else if (style === "greenCandle") {
        frontHand = [e.facing * limbLen * 0.9, shoulderY - limbLen * 1.7];
        backHand = [-e.facing * limbLen * 0.9, shoulderY - limbLen * 1.7];
      } else {
        frontHand = [e.facing * limbLen * 0.55, shoulderY - limbLen * 1.8];
        backHand = [-e.facing * limbLen * 0.35, shoulderY - limbLen * 0.5];
      }
    } else if (e.state === "dashpunch") {
      frontHand = [e.facing * limbLen * 2, shoulderY];
      backHand = [e.facing * limbLen * 1.5, shoulderY - 8];
    } else if (e.state === "spinkick" || e.state === "groundpound") {
      if (e.state === "spinkick" && style === "muayThai") {
        frontHand = [-limbLen * 0.7, shoulderY - 14];
        backHand = [limbLen * 0.5, shoulderY + 8];
      } else if (e.state === "spinkick" && style === "greenCandle") {
        frontHand = [limbLen * 1.7, shoulderY - 2];
        backHand = [-limbLen * 1.7, shoulderY - 2];
      } else if (e.state === "spinkick" && style === "rush") {
        frontHand = [limbLen * 0.45, shoulderY + 4];
        backHand = [-limbLen * 0.45, shoulderY + 4];
      } else {
        frontHand = [-limbLen * 0.8, shoulderY + limbLen * 0.3];
        backHand = [limbLen * 0.8, shoulderY + limbLen * 0.3];
      }
    } else {
      const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 10 : 0;
      // Match per-style idle/walk arm geometry
      if (style === "rush") {
        frontHand = [limbLen * 1.3, shoulderY + 4];
        backHand = [-limbLen * 1.3, shoulderY + 4];
      } else if (style === "muayThai") {
        // Hands high beside head (high guard)
        frontHand = [limbLen * 0.35, shoulderY - 8];
        backHand = [-limbLen * 0.35, shoulderY - 8];
      } else if (style === "greenCandle") {
        frontHand = [limbLen * 1.0, shoulderY + 16];
        backHand = [-limbLen * 1.0, shoulderY + 16];
      } else {
        frontHand = [-limbLen * 0.7, shoulderY + limbLen * 0.8 + swing];
        backHand = [limbLen * 0.7, shoulderY + limbLen * 0.8 - swing];
      }
    }

    const extended =
      e.state === "punch" || e.state === "uppercut" || e.state === "dashpunch";
    if (backHand) drawGlove(backHand[0], backHand[1], false);
    if (frontHand) drawGlove(frontHand[0], frontHand[1], extended);
  }

  // Legs — capture endpoints so we can add Waldoge stripe accents on player
  let legAEnd: [number, number] = [0, hipY + limbLen];
  let legBEnd: [number, number] = [0, hipY + limbLen];
  let legAMid: [number, number] | null = null; // optional bend (knee) for multi-segment legs
  let legBMid: [number, number] | null = null;

  ctx.beginPath();
  if (e.state === "kick") {
    if (isPlayer && style === "muayThai") {
      const kneeX = e.facing * limbLen * 1.25;
      const kneeY = hipY - limbLen * 0.95;
      const footX = e.facing * limbLen * 0.7;
      const footY = hipY - limbLen * 0.25;
      ctx.moveTo(0, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.moveTo(0, hipY);
      ctx.lineTo(-e.facing * limbLen * 0.1, hipY + limbLen);
      legAMid = [kneeX, kneeY]; legAEnd = [footX, footY];
      legBEnd = [-e.facing * limbLen * 0.1, hipY + limbLen];
    } else {
      if (isPlayer && style === "rush") {
        ctx.moveTo(0, hipY);
        ctx.lineTo(e.facing * limbLen * 2.1, hipY - 2);
        legAEnd = [e.facing * limbLen * 2.1, hipY - 2];
      } else if (isPlayer && style === "greenCandle") {
        ctx.moveTo(0, hipY);
        ctx.lineTo(e.facing * limbLen * 0.9, hipY + limbLen * 0.25);
        ctx.lineTo(e.facing * limbLen * 1.7, hipY + limbLen * 0.85);
        legAMid = [e.facing * limbLen * 0.9, hipY + limbLen * 0.25];
        legAEnd = [e.facing * limbLen * 1.7, hipY + limbLen * 0.85];
      } else {
        ctx.moveTo(0, hipY);
        ctx.lineTo(e.facing * limbLen * 1.5, hipY - 5);
        legAEnd = [e.facing * limbLen * 1.5, hipY - 5];
      }
      ctx.moveTo(0, hipY);
      ctx.lineTo(-e.facing * limbLen * 0.5, hipY + limbLen);
      legBEnd = [-e.facing * limbLen * 0.5, hipY + limbLen];
    }
  } else if (e.state === "jump" || e.state === "uppercut") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen * 0.6, hipY + limbLen * 0.5);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen * 0.6, hipY + limbLen * 0.5);
    legAEnd = [limbLen * 0.6, hipY + limbLen * 0.5];
    legBEnd = [-limbLen * 0.6, hipY + limbLen * 0.5];
  } else if (e.state === "spinkick") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(e.facing * limbLen * 1.8, hipY);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-e.facing * limbLen * 0.6, hipY + limbLen * 0.8);
    legAEnd = [e.facing * limbLen * 1.8, hipY];
    legBEnd = [-e.facing * limbLen * 0.6, hipY + limbLen * 0.8];
  } else if (e.state === "groundpound") {
    ctx.moveTo(0, hipY);
    ctx.lineTo(-limbLen, hipY + limbLen * 0.3);
    ctx.moveTo(0, hipY);
    ctx.lineTo(limbLen, hipY + limbLen * 0.3);
    legAEnd = [limbLen, hipY + limbLen * 0.3];
    legBEnd = [-limbLen, hipY + limbLen * 0.3];
  } else {
    const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 12 : 0;
    let aX: number, bX: number, aY = hipY + limbLen, bY = hipY + limbLen;
    if (isPlayer && style === "rush") {
      aX = e.facing * (limbLen * 0.9 - swing * 0.5);
      bX = -e.facing * (limbLen * 0.4 + swing * 0.5);
    } else if (isPlayer && style === "muayThai") {
      aX = e.facing * (limbLen * 0.35 - swing * 0.4); aY = hipY + limbLen * 0.95;
      bX = -e.facing * (limbLen * 0.4 + swing * 0.4);
    } else if (isPlayer && style === "greenCandle") {
      aX = e.facing * (limbLen * 0.9 - swing * 0.6);
      bX = -e.facing * (limbLen * 0.9 + swing * 0.6);
    } else {
      aX = limbLen * 0.5 - swing;
      bX = -limbLen * 0.5 + swing;
    }
    ctx.moveTo(0, hipY); ctx.lineTo(aX, aY);
    ctx.moveTo(0, hipY); ctx.lineTo(bX, bY);
    legAEnd = [aX, aY]; legBEnd = [bX, bY];
  }
  ctx.strokeStyle = isPlayer ? "#d92b2b" : "#ff4444";
  ctx.lineWidth = isPlayer ? (e.state === "spinkick" ? 7 : 6) : (e.state === "spinkick" ? 4 : 3);
  ctx.lineCap = "round";
  ctx.stroke();

  // Waldoge white stripe accents on upper legs (perpendicular bands, matches torso)
  if (isPlayer) {
    const drawLegStripes = (
      end: [number, number],
      mid: [number, number] | null,
    ) => {
      // Upper segment = hip -> (mid ?? end)
      const tx = mid ? mid[0] : end[0];
      const ty = mid ? mid[1] : end[1];
      const dx = tx - 0;
      const dy = ty - hipY;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len, uy = dy / len;
      // perpendicular
      const px = -uy, py = ux;
      const halfW = 3.5; // stripe half-width across leg
      ctx.strokeStyle = "#f5ece0";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "butt";
      // 2 evenly spaced stripes on upper portion (25% and 55% down the upper segment)
      for (const t of [0.28, 0.58]) {
        const cx = ux * len * t;
        const cy = hipY + uy * len * t;
        ctx.beginPath();
        ctx.moveTo(cx - px * halfW, cy - py * halfW);
        ctx.lineTo(cx + px * halfW, cy + py * halfW);
        ctx.stroke();
      }
    };
    drawLegStripes(legAEnd, legAMid);
    drawLegStripes(legBEnd, legBMid);
    ctx.lineCap = "round";
  }


  // Red & white sneakers on the player's feet
  if (isPlayer) {
    let frontFoot: [number, number] | null = null;
    let backFoot: [number, number] | null = null;

    if (e.state === "kick") {
      if (style === "muayThai") {
        // Foot tucked back under thigh (knee-strike silhouette)
        frontFoot = [e.facing * limbLen * 0.7, hipY - limbLen * 0.25];
        backFoot = [-e.facing * limbLen * 0.1, hipY + limbLen];
      } else if (style === "rush") {
        frontFoot = [e.facing * limbLen * 2.1, hipY - 2];
        backFoot = [-e.facing * limbLen * 0.5, hipY + limbLen];
      } else if (style === "greenCandle") {
        frontFoot = [e.facing * limbLen * 1.7, hipY + limbLen * 0.85];
        backFoot = [-e.facing * limbLen * 0.5, hipY + limbLen];
      } else {
        frontFoot = [e.facing * limbLen * 1.5, hipY - 5];
        backFoot = [-e.facing * limbLen * 0.5, hipY + limbLen];
      }
    } else if (e.state === "jump" || e.state === "uppercut") {
      frontFoot = [e.facing * limbLen * 0.6, hipY + limbLen * 0.5];
      backFoot = [-e.facing * limbLen * 0.6, hipY + limbLen * 0.5];
    } else if (e.state === "spinkick") {
      frontFoot = [e.facing * limbLen * 1.8, hipY];
      backFoot = [-e.facing * limbLen * 0.6, hipY + limbLen * 0.8];
    } else if (e.state === "groundpound") {
      frontFoot = [e.facing * limbLen, hipY + limbLen * 0.3];
      backFoot = [-e.facing * limbLen, hipY + limbLen * 0.3];
    } else {
      const swing = e.state === "walk" ? Math.sin(Date.now() / 150) * 12 : 0;
      if (style === "rush") {
        frontFoot = [e.facing * (limbLen * 0.9 - swing * 0.5), hipY + limbLen];
        backFoot = [-e.facing * (limbLen * 0.4 + swing * 0.5), hipY + limbLen];
      } else if (style === "muayThai") {
        frontFoot = [e.facing * (limbLen * 0.35 - swing * 0.4), hipY + limbLen * 0.95];
        backFoot = [-e.facing * (limbLen * 0.4 + swing * 0.4), hipY + limbLen];
      } else if (style === "greenCandle") {
        frontFoot = [e.facing * (limbLen * 0.9 - swing * 0.6), hipY + limbLen];
        backFoot = [-e.facing * (limbLen * 0.9 + swing * 0.6), hipY + limbLen];
      } else {
        frontFoot = [e.facing * (limbLen * 0.5 - swing), hipY + limbLen];
        backFoot = [-e.facing * (limbLen * 0.5 + swing), hipY + limbLen];
      }
    }

    const drawSneaker = (fx: number, fy: number) => {
      const w = 19;
      const h = 8;
      const dir = e.facing;
      ctx.save();
      ctx.translate(fx, fy);
      // Sole (white)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(dir * 2, h * 0.5, w * 0.6, h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Upper (red)
      ctx.fillStyle = "#d62828";
      ctx.beginPath();
      ctx.ellipse(dir * 2, -1, w * 0.55, h * 0.85, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
      // White toe cap
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(dir * (w * 0.45), 0, w * 0.18, h * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // White lace stripe
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(dir * -1, -3, 3, 2);
      ctx.restore();
    };

    if (backFoot) drawSneaker(backFoot[0], backFoot[1]);
    if (frontFoot) drawSneaker(frontFoot[0], frontFoot[1]);
  }

  // Special move glow
  if (["uppercut", "spinkick", "dashpunch", "groundpound"].includes(e.state)) {
    ctx.beginPath();
    ctx.arc(0, headCY + headR + bodyLen / 2, 35, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(0, headCY + headR + bodyLen / 2, 5, 0, headCY + headR + bodyLen / 2, 35);
    const auraColor =
      style === "brawler" ? "rgba(255,215,0,0.4)" :
      style === "rush" ? "rgba(0,200,255,0.4)" :
      style === "muayThai" ? "rgba(255,120,0,0.4)" :
      "rgba(0,255,100,0.45)";
    glow.addColorStop(0, isPlayer ? auraColor : "rgba(255, 215, 0, 0.4)");
    glow.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Rush style speed cues — motion streaks while moving, afterimage ghost
  // silhouettes during punch / dash. Drawn last so they layer on top, but
  // remain translucent so the body silhouette stays readable.
  if (isPlayer && style === "rush") {
    const moving = e.state === "walk";
    const attacking = e.state === "punch" || e.state === "dashpunch";
    if (moving || attacking) {
      ctx.save();
      // Motion streaks behind the body
      ctx.strokeStyle = "rgba(0,210,255,0.55)";
      ctx.lineWidth = 2;
      const streakCount = attacking ? 5 : 4;
      for (let i = 1; i <= streakCount; i++) {
        const off = -e.facing * i * (attacking ? 10 : 7);
        ctx.globalAlpha = Math.max(0.05, 0.45 - i * 0.08);
        ctx.beginPath();
        ctx.moveTo(off, neckY + 6);
        ctx.lineTo(off - e.facing * 16, neckY + 6 + (i % 2 ? 2 : -2));
        ctx.moveTo(off, hipY - 4);
        ctx.lineTo(off - e.facing * 18, hipY - 4 + (i % 2 ? -2 : 2));
        ctx.moveTo(off, (neckY + hipY) / 2);
        ctx.lineTo(off - e.facing * 20, (neckY + hipY) / 2);
        ctx.stroke();
      }
      // Afterimage ghost silhouettes during punch/dash
      if (attacking) {
        ctx.strokeStyle = "rgba(0,200,255,0.4)";
        ctx.lineWidth = 3;
        for (let g = 1; g <= 2; g++) {
          const gx = -e.facing * g * 14;
          ctx.globalAlpha = 0.35 - g * 0.1;
          // Body
          ctx.beginPath();
          ctx.moveTo(gx, neckY);
          ctx.lineTo(gx, hipY);
          // Head circle
          ctx.moveTo(gx + headR, headCY);
          ctx.arc(gx, headCY, headR, 0, Math.PI * 2);
          // Front arm extended
          ctx.moveTo(gx, neckY + 8);
          ctx.lineTo(gx + e.facing * limbLen * 2.4, neckY + 10);
          // Legs
          ctx.moveTo(gx, hipY);
          ctx.lineTo(gx + e.facing * limbLen * 0.7, hipY + limbLen);
          ctx.moveTo(gx, hipY);
          ctx.lineTo(gx - e.facing * limbLen * 0.4, hipY + limbLen);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
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

// ============== PLATFORMS (Phase 1 — static, jump-through) ==============
type PlatformStyle = "fireEscape" | "dumpster" | "balcony" | "scaffold" | "rooftop";
interface Platform {
  x: number;       // left edge in world coords
  y: number;       // top surface y (player foot lands here)
  w: number;       // width
  h: number;       // visual thickness
  style: PlatformStyle;
}

// Per-level platform layouts. Heights are above GROUND_Y (320). Player feet land on `y`.
// Layouts are hand-tuned to be reachable with the existing JUMP_FORCE (-12, GRAVITY 0.6).
// Max jump height ≈ 120px, so platforms sit between y = 200 and y = 260.
function spawnPlatforms(level: number): Platform[] {
  const themeStyles: PlatformStyle[][] = [
    ["dumpster", "fireEscape", "dumpster", "fireEscape"],  // alley
    ["balcony", "fireEscape", "balcony", "fireEscape"],     // city
    ["rooftop", "balcony", "rooftop", "balcony"],           // suburbs
    ["scaffold", "balcony", "scaffold", "balcony"],         // mall
    ["rooftop", "scaffold", "rooftop", "scaffold"],         // park
    ["balcony", "scaffold", "balcony", "scaffold"],         // office
    ["scaffold", "rooftop", "scaffold", "rooftop"],         // chart
  ];
  const styles = themeStyles[Math.min(level, themeStyles.length - 1)];
  const out: Platform[] = [];
  // Place 4 platforms spaced across the level.
  const positions = [
    { x: 500,  y: 240, w: 140 },
    { x: 1100, y: 215, w: 160 },
    { x: 1800, y: 250, w: 130 },
    { x: 2500, y: 220, w: 170 },
  ];
  positions.forEach((pos, i) => {
    out.push({ x: pos.x, y: pos.y, w: pos.w, h: 12, style: styles[i % styles.length] });
  });
  return out;
}

function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, camX: number) {
  const sx = plat.x - camX;
  if (sx + plat.w < -40 || sx > CANVAS_W + 40) return;
  const y = plat.y;
  ctx.save();
  switch (plat.style) {
    case "dumpster": {
      // Green dumpster body sitting on the ground, with a flat lid top at `y`.
      const bodyTop = y;
      const bodyH = Math.max(40, GROUND_Y - bodyTop);
      ctx.fillStyle = "#2d5a3a";
      ctx.fillRect(sx, bodyTop, plat.w, bodyH);
      ctx.fillStyle = "#1f4028";
      ctx.fillRect(sx, bodyTop + bodyH - 6, plat.w, 6);
      // Lid (top surface)
      ctx.fillStyle = "#3a7048";
      ctx.fillRect(sx - 2, bodyTop - plat.h, plat.w + 4, plat.h);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(sx - 2, bodyTop - plat.h, plat.w + 4, 2);
      // Side ribs
      ctx.strokeStyle = "#1f4028";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const rx = sx + (plat.w / 4) * i;
        ctx.beginPath(); ctx.moveTo(rx, bodyTop + 4); ctx.lineTo(rx, bodyTop + bodyH - 8); ctx.stroke();
      }
      break;
    }
    case "fireEscape": {
      // Steel grate platform with railing and support bracket.
      ctx.fillStyle = "#3a3a42";
      ctx.fillRect(sx, y, plat.w, plat.h);
      ctx.fillStyle = "#5a5a62";
      ctx.fillRect(sx, y, plat.w, 2);
      // Grate pattern
      ctx.strokeStyle = "#1a1a1f";
      ctx.lineWidth = 0.6;
      for (let gx = sx + 4; gx < sx + plat.w; gx += 6) {
        ctx.beginPath(); ctx.moveTo(gx, y + 3); ctx.lineTo(gx, y + plat.h - 1); ctx.stroke();
      }
      // Railing
      ctx.strokeStyle = "#2a2a30";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + 2, y); ctx.lineTo(sx + 2, y - 24);
      ctx.moveTo(sx + plat.w - 2, y); ctx.lineTo(sx + plat.w - 2, y - 24);
      ctx.moveTo(sx + 2, y - 24); ctx.lineTo(sx + plat.w - 2, y - 24);
      ctx.moveTo(sx + 2, y - 12); ctx.lineTo(sx + plat.w - 2, y - 12);
      ctx.stroke();
      // Support brackets down to ground
      ctx.strokeStyle = "#2a2a30";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 8, y + plat.h); ctx.lineTo(sx + 8, GROUND_Y);
      ctx.moveTo(sx + plat.w - 8, y + plat.h); ctx.lineTo(sx + plat.w - 8, GROUND_Y);
      ctx.stroke();
      break;
    }
    case "balcony": {
      // Stone/concrete ledge with iron railing.
      ctx.fillStyle = "#8a8478";
      ctx.fillRect(sx, y, plat.w, plat.h);
      ctx.fillStyle = "#6a6458";
      ctx.fillRect(sx, y + plat.h - 3, plat.w, 3);
      ctx.fillStyle = "#a8a294";
      ctx.fillRect(sx, y, plat.w, 2);
      // Railing posts
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 1.2;
      for (let rx = sx + 6; rx < sx + plat.w - 4; rx += 10) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx, y - 18); ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(sx + 4, y - 18); ctx.lineTo(sx + plat.w - 4, y - 18); ctx.stroke();
      break;
    }
    case "scaffold": {
      // Wood plank on metal pipe frame.
      ctx.fillStyle = "#b8864a";
      ctx.fillRect(sx, y, plat.w, plat.h);
      ctx.fillStyle = "#8a6030";
      // Plank seams
      for (let px = sx + 30; px < sx + plat.w; px += 30) {
        ctx.fillRect(px, y, 1, plat.h);
      }
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(sx, y + plat.h - 2, plat.w, 2);
      // Metal pipe legs + cross brace
      ctx.strokeStyle = "#6a6a72";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 6, y + plat.h); ctx.lineTo(sx + 6, GROUND_Y);
      ctx.moveTo(sx + plat.w - 6, y + plat.h); ctx.lineTo(sx + plat.w - 6, GROUND_Y);
      ctx.moveTo(sx + 6, y + plat.h); ctx.lineTo(sx + plat.w - 6, GROUND_Y);
      ctx.moveTo(sx + plat.w - 6, y + plat.h); ctx.lineTo(sx + 6, GROUND_Y);
      ctx.stroke();
      break;
    }
    case "rooftop": {
      // Low rooftop with parapet trim and brick supports.
      ctx.fillStyle = "#5a4838";
      ctx.fillRect(sx, y, plat.w, plat.h + 2);
      ctx.fillStyle = "#3a2e22";
      ctx.fillRect(sx, y + plat.h, plat.w, 2);
      // Tile top
      ctx.fillStyle = "#7a6450";
      ctx.fillRect(sx, y, plat.w, 3);
      // Brick column below
      ctx.fillStyle = "#6a4a38";
      const colH = GROUND_Y - (y + plat.h);
      if (colH > 0) {
        ctx.fillRect(sx + 10, y + plat.h, 16, colH);
        ctx.fillRect(sx + plat.w - 26, y + plat.h, 16, colH);
        ctx.strokeStyle = "#3a2418";
        ctx.lineWidth = 0.5;
        for (let by = y + plat.h + 6; by < GROUND_Y; by += 8) {
          ctx.beginPath(); ctx.moveTo(sx + 10, by); ctx.lineTo(sx + 26, by); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx + plat.w - 26, by); ctx.lineTo(sx + plat.w - 10, by); ctx.stroke();
        }
      }
      break;
    }
  }
  ctx.restore();
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
  // === LAYER 0: Daytime sky gradient ===
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#4a90d9");
  skyGrad.addColorStop(0.5, "#87ceeb");
  skyGrad.addColorStop(1, "#b0d4f1");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);

  // Clouds instead of stars
  ctx.fillStyle = "#ffffffcc";
  for (let i = 0; i < 8; i++) {
    const cx = (i * 250 + 80 + Math.sin(frameCount / 200 + i) * 20) % (canvasW + 100) - 50;
    const cy = 30 + (i * 37) % 60;
    const cw = 60 + (i * 19) % 40;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy + 5, cw / 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 18, cy + 3, cw / 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // === LAYER 1: Far skyline (slowest parallax 0.15) ===
  for (let i = 0; i < 25; i++) {
    const bx = i * 180 - (camX * 0.15) % 180;
    const bh = 60 + (i * 41) % 100;
    ctx.fillStyle = "#8899aa";
    ctx.fillRect(bx, GROUND_Y - bh, 100, bh);
    // Windows
    ctx.fillStyle = "#aaddff88";
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
    ctx.fillStyle = "#7a8a9a";
    ctx.fillRect(bx, GROUND_Y - bh, 90, bh);
    // Windows
    for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + 82; wx += 22) {
        const lit = (wx * 13 + wy * 7) % 6 !== 0;
        if (lit) {
          ctx.fillStyle = ((wx + wy) % 3 === 0) ? "#66bbee88" : "#aaddff66";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
    // Fire escape lines
    if (i % 3 === 0) {
      ctx.strokeStyle = "#5a6a7a";
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
  for (let i = 0; i < 30; i++) {
    const bx = i * 200 - (camX * 0.75) % 200;
    const bh = GROUND_Y - 20;
    // Brick wall
    ctx.fillStyle = "#b8785a";
    ctx.fillRect(bx, GROUND_Y - bh, 40, bh);
    // Brick pattern
    ctx.strokeStyle = "#9a6248";
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
    // Right wall
    ctx.fillStyle = "#b8785a";
    ctx.fillRect(bx + 160, GROUND_Y - bh, 40, bh);
    ctx.strokeStyle = "#9a6248";
    ctx.lineWidth = 0.5;
    for (let by = GROUND_Y - bh; by < GROUND_Y; by += 8) {
      ctx.beginPath();
      ctx.moveTo(bx + 160, by);
      ctx.lineTo(bx + 200, by);
      ctx.stroke();
    }
  }

  // === Shop signs (parallax 0.75) ===
  for (let i = 0; i < 8; i++) {
    const nx = i * 400 + 60 - (camX * 0.75) % 400;
    if (nx < -100 || nx > canvasW + 100) continue;
    const ny = GROUND_Y - 200 + (i % 3) * 30;

    ctx.save();
    // Sign background
    ctx.fillStyle = "#e8d8a0";
    ctx.fillRect(nx - 22, ny - 12, 44, 22);
    ctx.strokeStyle = "#8a7a50";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(nx - 22, ny - 12, 44, 22);
    // Sign text
    const signs = ["CAFE", "SHOP", "DELI", "24h", "EAT", "DOGE", "PIZZA", "NEWS"];
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#4a3a20";
    ctx.textAlign = "center";
    ctx.fillText(signs[i % signs.length], nx, ny + 4);
    ctx.restore();
  }

  // === Atmospheric haze ===
  ctx.save();
  ctx.globalAlpha = 0.05;
  const atmosGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  atmosGrad.addColorStop(0, "#ffffff");
  atmosGrad.addColorStop(1, "#e0d8c0");
  ctx.fillStyle = atmosGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);
  ctx.restore();

  // === FLOOR: Concrete sidewalk ===
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 80);
  floorGrad.addColorStop(0, "#9a9a9a");
  floorGrad.addColorStop(0.3, "#8a8a8a");
  floorGrad.addColorStop(1, "#7a7a7a");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);

  // Road markings
  ctx.strokeStyle = "#ffd70088";
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const mx = i * 100 - (camX * 0.95) % 100;
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y + 35);
    ctx.lineTo(mx + 35, GROUND_Y + 35);
    ctx.stroke();
  }

  // Cracks
  ctx.strokeStyle = "#6a6a6a";
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
    if (seed > 40) {
      ctx.beginPath();
      ctx.moveTo(cx + (seed % 15) - 7, GROUND_Y + 15);
      ctx.lineTo(cx + 15, GROUND_Y + 25);
      ctx.stroke();
    }
  }

  // === Shadows on ground instead of puddles ===
  for (let i = 0; i < 6; i++) {
    const px = i * 500 + 200 - (camX * 0.95) % 500;
    if (px < -80 || px > canvasW + 80) continue;
    const pw = 50 + (i * 23) % 40;
    const py = GROUND_Y + 10 + (i % 3) * 15;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.ellipse(px, py, pw / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ground line
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvasW, GROUND_Y);
  ctx.stroke();
}

// ============== THEMED SCENERY (used per-level) ==============
interface ThemePalette {
  skyTop: string; skyMid: string; skyBot: string;
  farBldg: string; midBldg: string; nearBldg: string;
  windowOn: string; windowOff: string;
  ground1: string; ground2: string; ground3: string;
  accent: string;
}

const THEME_PALETTES: Record<SceneTheme, ThemePalette> = {
  alley:   { skyTop:"#4a90d9", skyMid:"#87ceeb", skyBot:"#b0d4f1", farBldg:"#8899aa", midBldg:"#7a8a9a", nearBldg:"#b8785a", windowOn:"#ffd96655", windowOff:"#3a4a5a", ground1:"#9a9a9a", ground2:"#8a8a8a", ground3:"#7a7a7a", accent:"#ffd700" },
  city:    { skyTop:"#1a1f3a", skyMid:"#2d2456", skyBot:"#5a3a78", farBldg:"#1f2a40", midBldg:"#2a3550", nearBldg:"#3a4565", windowOn:"#ffe066", windowOff:"#1a1a2a", ground1:"#2a2a35", ground2:"#1f1f2a", ground3:"#15151f", accent:"#ff44aa" },
  suburbs: { skyTop:"#a0c8ff", skyMid:"#cce0ff", skyBot:"#fff0d0", farBldg:"#b89978", midBldg:"#d4a878", nearBldg:"#e8c896", windowOn:"#ffeebb", windowOff:"#5a4530", ground1:"#7ab85a", ground2:"#5fa045", ground3:"#4a8030", accent:"#ff6644" },
  mall:    { skyTop:"#f8e8c0", skyMid:"#ffd8a0", skyBot:"#ffc080", farBldg:"#c4b89a", midBldg:"#d8c8a8", nearBldg:"#f0e0c0", windowOn:"#ff66cc", windowOff:"#88aaff", ground1:"#d8d4cc", ground2:"#c8c4bc", ground3:"#b8b4ac", accent:"#00ddff" },
  park:    { skyTop:"#7ec8e3", skyMid:"#a8dceb", skyBot:"#cfe9d4", farBldg:"#3a7048", midBldg:"#2f5e3a", nearBldg:"#1f4a28", windowOn:"#ffeebb", windowOff:"#1a3a20", ground1:"#7ad05a", ground2:"#5fb845", ground3:"#3f9030", accent:"#ffaa44" },
  office:  { skyTop:"#d8d8e0", skyMid:"#c0c0cc", skyBot:"#a8a8b8", farBldg:"#5a6478", midBldg:"#6a7488", nearBldg:"#8090a8", windowOn:"#aaccee", windowOff:"#3a4555", ground1:"#5a5a6a", ground2:"#4a4a58", ground3:"#3a3a48", accent:"#00aaff" },
  chart:   { skyTop:"#050818", skyMid:"#0a0f28", skyBot:"#0f1538", farBldg:"#0a1a30", midBldg:"#0d2240", nearBldg:"#102855", windowOn:"#00ff88", windowOff:"#1a2a40", ground1:"#0a1428", ground2:"#06101e", ground3:"#030814", accent:"#00ff88" },
};

function drawSkyAndFloor(ctx: CanvasRenderingContext2D, p: ThemePalette, canvasW: number, camX: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.55, p.skyMid);
  skyGrad.addColorStop(1, p.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);

  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 80);
  floorGrad.addColorStop(0, p.ground1);
  floorGrad.addColorStop(0.4, p.ground2);
  floorGrad.addColorStop(1, p.ground3);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);

  ctx.strokeStyle = p.accent + "88";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const mx = i * 100 - (camX * 0.95) % 100;
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y + 35);
    ctx.lineTo(mx + 35, GROUND_Y + 35);
    ctx.stroke();
  }
  ctx.strokeStyle = p.ground3;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvasW, GROUND_Y);
  ctx.stroke();
}

function drawCityScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.city;
  drawSkyAndFloor(ctx, pal, canvasW, camX);
  ctx.fillStyle = "#ffe9b0";
  ctx.beginPath(); ctx.arc(canvasW - 90, 70, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.skyTop;
  ctx.beginPath(); ctx.arc(canvasW - 80, 64, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffffaa";
  for (let i = 0; i < 40; i++) {
    const sx = (i * 73) % canvasW;
    const sy = (i * 37) % 110;
    const tw = (Math.sin(frameCount / 20 + i) + 1) * 0.5;
    ctx.globalAlpha = 0.5 + tw * 0.5;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 30; i++) {
    const bx = i * 140 - (camX * 0.2) % 140;
    const bh = 120 + (i * 53) % 180;
    ctx.fillStyle = pal.farBldg;
    ctx.fillRect(bx, GROUND_Y - bh, 80, bh);
    for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 8; wy += 12) {
      for (let wx = bx + 6; wx < bx + 74; wx += 14) {
        ctx.fillStyle = ((wx * 7 + wy * 11 + i) % 4 === 0) ? pal.windowOn : pal.windowOff;
        ctx.fillRect(wx, wy, 6, 7);
      }
    }
  }
  for (let i = 0; i < 20; i++) {
    const bx = i * 200 - (camX * 0.5) % 200;
    const bh = 180 + (i * 79) % 160;
    ctx.fillStyle = pal.midBldg;
    ctx.fillRect(bx, GROUND_Y - bh, 110, bh);
    for (let wy = GROUND_Y - bh + 12; wy < GROUND_Y - 10; wy += 16) {
      for (let wx = bx + 10; wx < bx + 100; wx += 18) {
        ctx.fillStyle = ((wx * 13 + wy * 5 + i * 3) % 3 === 0) ? pal.windowOn : pal.windowOff;
        ctx.fillRect(wx, wy, 9, 11);
      }
    }
    if (i % 2 === 0) {
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + 55, GROUND_Y - bh); ctx.lineTo(bx + 55, GROUND_Y - bh - 25); ctx.stroke();
      ctx.fillStyle = "#ff3344";
      ctx.beginPath(); ctx.arc(bx + 55, GROUND_Y - bh - 25, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (let i = 0; i < 15; i++) {
    const bx = i * 320 - (camX * 0.85) % 320;
    if (bx < -200 || bx > canvasW + 200) continue;
    ctx.fillStyle = pal.nearBldg;
    ctx.fillRect(bx, GROUND_Y - 80, 200, 80);
    const colors = ["#ff44aa", "#00ddff", "#ffe066", "#aa44ff"];
    const col = colors[i % colors.length];
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.fillRect(bx + 30, GROUND_Y - 60, 140, 18);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    const labels = ["NEON BAR", "ARCADE", "RAMEN", "CLUB X"];
    ctx.fillText(labels[i % labels.length], bx + 100, GROUND_Y - 47);
  }
}

function drawSuburbsScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.suburbs;
  drawSkyAndFloor(ctx, pal, canvasW, camX);
  ctx.fillStyle = "#fff0a0";
  ctx.beginPath(); ctx.arc(120, 70, 30, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 8; i++) {
    const hx = i * 280 - (camX * 0.1) % 280;
    ctx.fillStyle = "#a8c890";
    ctx.beginPath();
    ctx.ellipse(hx, GROUND_Y, 180, 70, 0, Math.PI, 0);
    ctx.fill();
  }
  for (let i = 0; i < 25; i++) {
    const bx = i * 220 - (camX * 0.55) % 220;
    if (bx < -150 || bx > canvasW + 50) continue;
    const bh = 90 + (i % 3) * 15;
    const houseColors = ["#e8c896", "#d4a878", "#f0d8b8", "#c8a880"];
    ctx.fillStyle = houseColors[i % houseColors.length];
    ctx.fillRect(bx, GROUND_Y - bh, 140, bh);
    ctx.fillStyle = "#8a4a2a";
    ctx.beginPath();
    ctx.moveTo(bx - 8, GROUND_Y - bh);
    ctx.lineTo(bx + 70, GROUND_Y - bh - 35);
    ctx.lineTo(bx + 148, GROUND_Y - bh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6a3a1a";
    ctx.fillRect(bx + 60, GROUND_Y - 45, 22, 45);
    ctx.fillStyle = "#aaccee";
    ctx.fillRect(bx + 15, GROUND_Y - bh + 25, 30, 25);
    ctx.fillRect(bx + 95, GROUND_Y - bh + 25, 30, 25);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx + 30, GROUND_Y - bh + 25); ctx.lineTo(bx + 30, GROUND_Y - bh + 50); ctx.moveTo(bx + 15, GROUND_Y - bh + 37); ctx.lineTo(bx + 45, GROUND_Y - bh + 37); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 110, GROUND_Y - bh + 25); ctx.lineTo(bx + 110, GROUND_Y - bh + 50); ctx.moveTo(bx + 95, GROUND_Y - bh + 37); ctx.lineTo(bx + 125, GROUND_Y - bh + 37); ctx.stroke();
    ctx.fillStyle = "#5a3018";
    ctx.fillRect(bx + 165, GROUND_Y - 50, 8, 50);
    ctx.fillStyle = "#3a8030";
    ctx.beginPath(); ctx.arc(bx + 169, GROUND_Y - 60, 22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 80; i++) {
    const fx = i * 18 - (camX * 0.9) % 18;
    ctx.fillRect(fx, GROUND_Y - 14, 6, 14);
    ctx.beginPath(); ctx.moveTo(fx, GROUND_Y - 14); ctx.lineTo(fx + 3, GROUND_Y - 18); ctx.lineTo(fx + 6, GROUND_Y - 14); ctx.closePath(); ctx.fill();
  }
}

function drawMallScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.mall;
  ctx.fillStyle = pal.skyMid;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);
  ctx.fillStyle = "#fff8d8";
  for (let i = 0; i < 12; i++) {
    const sx = i * 180 - (camX * 0.1) % 180;
    ctx.fillRect(sx, 0, 120, 35);
    ctx.fillStyle = "#88aaff";
    ctx.fillRect(sx, 32, 120, 3);
    ctx.fillStyle = "#fff8d8";
  }
  ctx.fillStyle = pal.ground1;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);
  ctx.strokeStyle = "#a8a4a0"; ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const tx = i * 60 - (camX * 0.95) % 60;
    ctx.beginPath(); ctx.moveTo(tx, GROUND_Y); ctx.lineTo(tx, GROUND_Y + 80); ctx.stroke();
  }
  for (let y = GROUND_Y + 20; y < GROUND_Y + 80; y += 25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const bx = i * 260 - (camX * 0.6) % 260;
    if (bx < -200 || bx > canvasW + 50) continue;
    ctx.fillStyle = pal.nearBldg;
    ctx.fillRect(bx, GROUND_Y - 120, 220, 120);
    ctx.fillStyle = "#cfe8ff";
    ctx.fillRect(bx + 20, GROUND_Y - 90, 180, 70);
    ctx.strokeStyle = "#888"; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 20, GROUND_Y - 90, 180, 70);
    const colors = ["#ff66cc", "#00ddff", "#ffaa44", "#aa66ff"];
    const labels = ["FASHION", "TECH", "TOYS", "DOGE +"];
    const col = colors[i % colors.length];
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.fillRect(bx + 20, GROUND_Y - 115, 180, 22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    ctx.fillText(labels[i % labels.length], bx + 110, GROUND_Y - 100);
  }
  for (let i = 0; i < 20; i++) {
    const lx = i * 160 - (camX * 0.6) % 160;
    ctx.fillStyle = "#ffeb88";
    ctx.beginPath(); ctx.arc(lx, 60, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 54); ctx.stroke();
  }
}

function drawParkScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.park;
  drawSkyAndFloor(ctx, pal, canvasW, camX);
  ctx.fillStyle = "#fff5b0";
  ctx.beginPath(); ctx.arc(canvasW - 100, 80, 28, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 30; i++) {
    const tx = i * 80 - (camX * 0.25) % 80;
    ctx.fillStyle = "#3a7048";
    ctx.beginPath(); ctx.arc(tx, GROUND_Y - 30, 36, Math.PI, 0); ctx.fill();
  }
  for (let i = 0; i < 25; i++) {
    const tx = i * 180 - (camX * 0.55) % 180;
    if (tx < -60 || tx > canvasW + 60) continue;
    ctx.fillStyle = "#5a3018";
    ctx.fillRect(tx - 6, GROUND_Y - 90, 12, 90);
    ctx.fillStyle = "#2f5e3a";
    ctx.beginPath(); ctx.arc(tx, GROUND_Y - 110, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a7048";
    ctx.beginPath(); ctx.arc(tx - 18, GROUND_Y - 95, 24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 18, GROUND_Y - 95, 24, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 12; i++) {
    const bx = i * 380 - (camX * 0.9) % 380;
    if (bx < -100 || bx > canvasW + 100) continue;
    if (i % 2 === 0) {
      ctx.fillStyle = "#6a3a1a";
      ctx.fillRect(bx, GROUND_Y - 18, 60, 6);
      ctx.fillRect(bx + 4, GROUND_Y - 12, 4, 12);
      ctx.fillRect(bx + 52, GROUND_Y - 12, 4, 12);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(bx, GROUND_Y - 60, 4, 60);
      ctx.fillStyle = "#ffeb88";
      ctx.beginPath(); ctx.arc(bx + 2, GROUND_Y - 64, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (let i = 0; i < 40; i++) {
    const fx = i * 90 - (camX * 0.95) % 90;
    const fc = ["#ff6677", "#ffaa44", "#ffffff", "#ff44aa"][i % 4];
    ctx.fillStyle = fc;
    ctx.beginPath(); ctx.arc(fx, GROUND_Y + 18 + (i % 3) * 6, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawOfficeScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.office;
  ctx.fillStyle = pal.skyTop;
  ctx.fillRect(0, 0, canvasW, GROUND_Y);
  ctx.strokeStyle = "#888"; ctx.lineWidth = 1;
  for (let x = 0; x < canvasW; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 50); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(canvasW, 50); ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const lx = i * 200 - (camX * 0.2) % 200;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 18;
    ctx.fillRect(lx, 18, 110, 8);
    ctx.shadowBlur = 0;
  }
  for (let i = 0; i < 20; i++) {
    const bx = i * 240 - (camX * 0.5) % 240;
    ctx.fillStyle = "#9aa0a8";
    ctx.fillRect(bx, GROUND_Y - 130, 180, 130);
    ctx.fillStyle = "#787c84";
    ctx.fillRect(bx - 6, GROUND_Y - 135, 192, 8);
    ctx.fillStyle = "#f8f8f0";
    ctx.fillRect(bx + 30, GROUND_Y - 110, 120, 60);
    ctx.strokeStyle = "#444"; ctx.lineWidth = 2;
    ctx.strokeRect(bx + 30, GROUND_Y - 110, 120, 60);
    ctx.strokeStyle = ["#ff4444","#0088ff","#22aa44"][i % 3];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 40, GROUND_Y - 95);
    ctx.lineTo(bx + 70, GROUND_Y - 100);
    ctx.lineTo(bx + 100, GROUND_Y - 90);
    ctx.lineTo(bx + 140, GROUND_Y - 80);
    ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const dx = i * 320 - (camX * 0.9) % 320;
    if (dx < -150 || dx > canvasW + 50) continue;
    ctx.fillStyle = "#5a4530";
    ctx.fillRect(dx, GROUND_Y - 28, 130, 8);
    ctx.fillRect(dx + 8, GROUND_Y - 20, 4, 20);
    ctx.fillRect(dx + 118, GROUND_Y - 20, 4, 20);
    ctx.fillStyle = "#222";
    ctx.fillRect(dx + 30, GROUND_Y - 60, 70, 40);
    ctx.fillStyle = "#00ccff";
    ctx.fillRect(dx + 34, GROUND_Y - 56, 62, 32);
    ctx.fillStyle = "#222";
    ctx.fillRect(dx + 60, GROUND_Y - 24, 10, 6);
  }
  ctx.fillStyle = pal.ground1;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);
  ctx.fillStyle = pal.ground2;
  for (let x = 0; x < canvasW; x += 8) {
    if (Math.floor((x + camX) / 8) % 2 === 0) ctx.fillRect(x, GROUND_Y, 4, 80);
  }
}

function drawChartScene(ctx: CanvasRenderingContext2D, camX: number, canvasW: number, frameCount: number) {
  const pal = THEME_PALETTES.chart;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 80);
  skyGrad.addColorStop(0, pal.skyTop);
  skyGrad.addColorStop(0.6, pal.skyMid);
  skyGrad.addColorStop(1, pal.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, GROUND_Y + 80);
  ctx.strokeStyle = "#0a3a4a"; ctx.lineWidth = 1;
  const gridSize = 40;
  const ox = -((camX * 0.9) % gridSize);
  for (let x = ox; x < canvasW; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y + 80); ctx.stroke();
  }
  for (let y = 0; y < GROUND_Y + 80; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
  }
  ctx.fillStyle = "#00ff88aa"; ctx.font = "10px monospace"; ctx.textAlign = "left";
  for (let i = 0; i < 6; i++) {
    const py = 30 + i * 50;
    ctx.fillText(`$${(1.0 - i * 0.15).toFixed(2)}`, 4, py);
  }
  const candleW = 12;
  const candleSpacing = 18;
  for (let i = 0; i < 200; i++) {
    const cx = i * candleSpacing - (camX * 0.5) % (candleSpacing * 200);
    if (cx < -20 || cx > canvasW + 20) continue;
    const seed = (i * 1103515245 + 12345) & 0x7fffffff;
    const r1 = (seed % 1000) / 1000;
    const r2 = ((seed >> 8) % 1000) / 1000;
    const trend = Math.sin(i / 8) * 60;
    const mid = 180 + trend;
    const isGreen = r1 > 0.45;
    const bodyTop = mid - r2 * 25;
    const bodyBot = mid + (1 - r2) * 25;
    const wickTop = bodyTop - r1 * 18;
    const wickBot = bodyBot + (1 - r1) * 18;
    ctx.strokeStyle = isGreen ? "#00ff88" : "#ff4466";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx + candleW/2, wickTop); ctx.lineTo(cx + candleW/2, wickBot); ctx.stroke();
    ctx.fillStyle = isGreen ? "#00ff88" : "#ff4466";
    ctx.fillRect(cx, bodyTop, candleW, Math.max(2, bodyBot - bodyTop));
  }
  ctx.strokeStyle = "#00ff88";
  ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < canvasW; x += 6) {
    const wx = x + camX;
    const ty = 200 + Math.sin(wx / 80) * 40 + Math.sin(wx / 220) * 25 - (wx * 0.02);
    if (x === 0) ctx.moveTo(x, ty); else ctx.lineTo(x, ty);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = pal.ground2;
  ctx.fillRect(0, GROUND_Y, canvasW, 80);
  ctx.strokeStyle = "#00ff8866"; ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const mx = i * 100 - (camX * 0.95) % 100;
    ctx.beginPath(); ctx.moveTo(mx, GROUND_Y + 35); ctx.lineTo(mx + 35, GROUND_Y + 35); ctx.stroke();
  }
  ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(canvasW, GROUND_Y); ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, theme: SceneTheme, camX: number, canvasW: number, frameCount: number) {
  switch (theme) {
    case "alley":   return drawCity(ctx, camX, canvasW, frameCount);
    case "city":    return drawCityScene(ctx, camX, canvasW, frameCount);
    case "suburbs": return drawSuburbsScene(ctx, camX, canvasW, frameCount);
    case "mall":    return drawMallScene(ctx, camX, canvasW, frameCount);
    case "park":    return drawParkScene(ctx, camX, canvasW, frameCount);
    case "office":  return drawOfficeScene(ctx, camX, canvasW, frameCount);
    case "chart":   return drawChartScene(ctx, camX, canvasW, frameCount);
  }
}

// ============== BOSS INTRO BANNER ==============
interface BossIntro { active: boolean; timer: number; total: number; level: number; bossName: string; levelName: string; }

function drawBossIntro(ctx: CanvasRenderingContext2D, intro: BossIntro, canvasW: number, canvasH: number) {
  if (!intro.active) return;
  const t = intro.timer;
  const total = intro.total;
  const progress = 1 - t / total;
  let alpha = 1;
  let slideX = 0;
  if (progress < 0.2) {
    const k = progress / 0.2;
    alpha = k;
    slideX = (1 - k) * canvasW;
  } else if (progress > 0.8) {
    const k = (progress - 0.8) / 0.2;
    alpha = 1 - k;
    slideX = -k * canvasW * 0.6;
  }
  ctx.save();
  ctx.globalAlpha = alpha * 0.65;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.globalAlpha = alpha * 0.92;
  ctx.translate(canvasW / 2 + slideX, canvasH / 2);
  ctx.rotate(-0.05);
  const sashH = 110;
  const sashGrad = ctx.createLinearGradient(0, -sashH/2, 0, sashH/2);
  sashGrad.addColorStop(0, "#3a0008");
  sashGrad.addColorStop(0.5, "#aa0014");
  sashGrad.addColorStop(1, "#3a0008");
  ctx.fillStyle = sashGrad;
  ctx.fillRect(-canvasW, -sashH/2, canvasW * 2, sashH);
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(-canvasW, -sashH/2 - 4, canvasW * 2, 3);
  ctx.fillRect(-canvasW, sashH/2 + 1, canvasW * 2, 3);
  const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.04;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`— LEVEL ${intro.level + 1} / ${LEVELS.length} —`, 0, -28);
  ctx.fillStyle = "#ffeecc";
  ctx.font = "bold 12px monospace";
  ctx.fillText(intro.levelName, 0, -10);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.font = "bold 32px monospace";
  ctx.strokeText(intro.bossName, 0, 22);
  ctx.fillText(intro.bossName, 0, 22);
  ctx.fillStyle = "#ff6677";
  ctx.font = "bold 11px monospace";
  ctx.fillText("☠  BOSS APPROACHING  ☠", 0, 42);
  ctx.restore();
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

function spawnEnemies(levelIndex: number, waveIndex: number, playerX: number): Entity[] {
  const lvl = LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
  const w = lvl?.waves[waveIndex];
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
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [comboCount, setComboCount] = useState(0);
  const [comboName, setComboName] = useState("");
  const [energy, setEnergy] = useState(0);
  const [styleName, setStyleName] = useState<StyleName>("brawler");
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const [showCamDebug, setShowCamDebug] = useState(false);
  const camDebugRef = useRef(false);
  const [camPreset, setCamPreset] = useState<"snappy" | "buttery">("snappy");
  const sfxRef = useRef(true);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music element once
  useEffect(() => {
    const audio = new Audio(waldogeMusic);
    audio.loop = true;
    audio.volume = 0.35;
    musicRef.current = audio;
    return () => {
      audio.pause();
      musicRef.current = null;
    };
  }, []);

  // Play/pause music based on game state and pause status
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (gameState === "playing" && !isPaused && sfxEnabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      if (gameState !== "playing" || gameState === "playing" && false) {
        // reset to start when leaving play
      }
    }
    if (gameState !== "playing") {
      audio.currentTime = 0;
    }
  }, [gameState, isPaused, sfxEnabled]);

  // Sync mute toggle with music volume
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.muted = !sfxEnabled;
  }, [sfxEnabled]);

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
    level: number;
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
    weaponType: WeaponType | null;
    weaponTimer: number;
    shurikenAmmo: number;
    style: StyleName;
    lightChain: { index: number; lastFrame: number };
    currentMove: Move | null;
    attackActive: boolean;
    attackActiveFrames: number;
    hitApplied: boolean;
    alleyObjects: AlleyObject[];
    platforms: Platform[];
    animFrameCount: number;
    rain: RainDrop[];
    splashes: Splash[];
    bossIntro: BossIntro;
    healFlash: number;
    camAnchor: number;
    camLookAhead: number;
    camPreset: "snappy" | "buttery";
    vxAvg: number;
    vxHistory: number[];
    camShake: { x: number; y: number; magnitude: number; timer: number; duration: number };
    hitPause: number;
    debugCam: {
      anchor: number;
      lerp: number;
      playerScreenX: number;
      offset: number;
      deadzone: number;
      lookAhead: number;
      vx: number;
    };
    specialFx: { style: StyleName; timer: number; total: number } | null;
  }>({
    player: createPlayer(),
    enemies: [],
    keys: new Set(),
    keyJustPressed: new Set(),
    camX: 0,
    wave: 0,
    level: 0,
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
    weaponType: null,
    weaponTimer: 0,
    shurikenAmmo: 0,
    style: "brawler",
    lightChain: { index: 0, lastFrame: -9999 },
    currentMove: null,
    attackActive: false,
    attackActiveFrames: 0,
    hitApplied: false,
    alleyObjects: [],
    platforms: [],
    animFrameCount: 0,
    rain: [],
    splashes: [],
    bossIntro: { active: false, timer: 0, total: 0, level: 0, bossName: "", levelName: "" },
    healFlash: 0,
    camAnchor: 0.5,
    camLookAhead: 0,
    specialFx: null,
    camPreset: "snappy",
    vxAvg: 0,
    vxHistory: [],
    camShake: { x: 0, y: 0, magnitude: 0, timer: 0, duration: 0 },
    hitPause: 0,
    debugCam: { anchor: 0.5, lerp: 0, playerScreenX: 0, offset: 0, deadzone: 0, lookAhead: 0, vx: 0 },
  });

  useEffect(() => {
    const img = new Image();
    img.src = waldogeHead;
    img.onload = () => { gameRef.current.headImg = img; };
  }, []);

  // Sync camera preset into game ref so the loop reads it without re-mounting
  useEffect(() => {
    gameRef.current.camPreset = camPreset;
  }, [camPreset]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.player = createPlayer();
    g.wave = 0;
    g.level = 0;
    g.score = 0;
    g.camX = 0;
    g.enemies = spawnEnemies(0, 0, 200);
    g.combo = { inputs: [], timer: 0, hitCount: 0, hitTimer: 0, multiplier: 1, specialCooldown: 0, specialEnergy: 50 };
    g.effects = [];
    g.powerups = [];
    g.projectiles = [];
    g.speedBoostTimer = 0;
    g.dmgBoostTimer = 0;
    g.weaponType = null;
    g.weaponTimer = 0;
    g.shurikenAmmo = 0;
    g.bossIntro = { active: false, timer: 0, total: 0, level: 0, bossName: "", levelName: "" };
    g.healFlash = 0;
    g.vxHistory = [];
    g.camLookAhead = 0;
    g.vxAvg = 0;
    g.camShake = { x: 0, y: 0, magnitude: 0, timer: 0, duration: 0 };
    g.hitPause = 0;
    g.style = "brawler";
    g.lightChain = { index: 0, lastFrame: -9999 };
    g.currentMove = null;
    g.attackActive = false;
    g.attackActiveFrames = 0;
    g.hitApplied = false;
    setStyleName("brawler");
    // Spawn weapon pickups along the level (varied types)
    g.weapons = [
      { x: 600, y: GROUND_Y, vy: 0, type: "bat", collected: false, timer: 900 },
      { x: 1400, y: GROUND_Y, vy: 0, type: "sword", collected: false, timer: 900 },
      { x: 2200, y: GROUND_Y, vy: 0, type: "shuriken", collected: false, timer: 900 },
      { x: 2800, y: GROUND_Y, vy: 0, type: "bat", collected: false, timer: 900 },
    ];
    g.alleyObjects = spawnAlleyObjects();
    g.platforms = spawnPlatforms(0);
    g.animFrameCount = 0;
    // Initialize rain
    g.rain = [];
    for (let i = 0; i < RAIN_COUNT; i++) {
      g.rain.push({
        x: Math.random() * (CANVAS_W + 200) - 100,
        y: Math.random() * (GROUND_Y + 40),
        speed: 6 + Math.random() * 6,
        length: 8 + Math.random() * 12,
        opacity: 0.15 + Math.random() * 0.25,
        wind: -1.5 - Math.random() * 1,
      });
    }
    g.splashes = [];
    setWave(0);
    setLevel(0);
    setScore(0);
    setPlayerHp(100);
    setComboCount(0);
    setComboName("");
    setEnergy(50);
    pausedRef.current = false;
    setIsPaused(false);
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
    if (!canvas) return;
    // Lock the backing buffer to the fixed internal game resolution.
    // CSS handles visual scaling via aspect-ratio so the game never stretches
    // or crops regardless of phone screen size.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = gameRef.current;
    g.running = true;

    const tick = () => {
      if (!g.running) return;
      if (pausedRef.current) {
        // Draw pause overlay over the last frame and skip simulation
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 48px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = "#fff";
        ctx.font = "14px monospace";
        ctx.fillText("Tap Resume to continue", CANVAS_W / 2, CANVAS_H / 2 + 30);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
        g.animFrame = requestAnimationFrame(tick);
        return;
      }

      // Hit-pause: freeze simulation for a few frames on impactful hits
      // for that classic "juicy" feel. Rendering still happens so shake reads.
      if (g.hitPause > 0) {
        g.hitPause -= 1;
        // Re-render last frame with shake offset for visible impact
        if (g.camShake.timer > 0) {
          const dur = Math.max(1, g.camShake.duration);
          const t = g.camShake.timer;
          const m = g.camShake.magnitude * (t / dur);
          g.camShake.x = (Math.random() - 0.5) * 2 * m;
          g.camShake.y = (Math.random() - 0.5) * 2 * m;
          g.camShake.timer -= 1;
        }
        g.animFrame = requestAnimationFrame(tick);
        return;
      }

      // Helper: trigger screen shake. Stronger or longer shakes win over
      // weaker ongoing ones so a finisher always overrides a light punch.
      const triggerShake = (intensity: number, duration: number) => {
        const remaining = g.camShake.timer;
        const currentMag = remaining > 0 ? g.camShake.magnitude * (remaining / Math.max(1, g.camShake.duration)) : 0;
        if (intensity >= currentMag || duration > remaining) {
          g.camShake = { x: 0, y: 0, magnitude: intensity, timer: duration, duration };
        }
      };

      g.animFrameCount++;
      const p = g.player;
      const c = g.combo;

      // Style swap (Q key) — cycles brawler → rush → muayThai
      if (g.keyJustPressed.has("q")) {
        g.style = nextStyle(g.style);
        setStyleName(g.style);
        sfx(() => SFX.powerupPickup());
        g.effects.push({
          x: p.x, y: p.y - 90, timer: 40,
          text: STYLES[g.style].label, color: STYLES[g.style].tint, size: 18,
        });
        if (import.meta.env.DEV) {
          console.log("[Brawler] STYLE SWAP →", g.style);
          console.log("[Brawler] STATS:", STYLES[g.style]);
          console.log("[Brawler] MOVESET:", MOVE_SETS[g.style]);
        }
      }
      const fightStyle = STYLES[g.style];

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

      // Update rain particles
      for (const drop of g.rain) {
        drop.y += drop.speed;
        drop.x += drop.wind;
        if (drop.y >= GROUND_Y + 5) {
          // Check if landing in puddle area
          const worldX = drop.x + g.camX;
          const inPuddle = PUDDLE_POSITIONS.some(px => Math.abs(worldX - px) < 40);
          g.splashes.push({
            x: drop.x, y: GROUND_Y + 2,
            timer: inPuddle ? 12 : 8,
            maxTimer: inPuddle ? 12 : 8,
            size: inPuddle ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
            inPuddle,
          });
          // Reset drop to top
          drop.y = -10 - Math.random() * 30;
          drop.x = Math.random() * (CANVAS_W + 200) - 100;
          drop.speed = 6 + Math.random() * 6;
          drop.length = 8 + Math.random() * 12;
          drop.opacity = 0.15 + Math.random() * 0.25;
        }
      }
      // Update splashes
      g.splashes = g.splashes.filter(s => { s.timer--; return s.timer > 0; });

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
              c.specialEnergy -= Math.round(spec.energyCost * fightStyle.staminaCost);
              c.inputs = [];
              setEnergy(c.specialEnergy);
              setComboName(combo.name);
              g.effects.push({
                x: p.x, y: p.y - 80, timer: 40,
                text: combo.name, color: "#FFD700", size: 20,
              });
              didSpecial = true;
              // SFX + screen shake for special moves
              if (combo.move === "uppercut") {
                sfx(() => SFX.uppercut());
                triggerShake(8, 16);
                g.hitPause = 3;
              } else if (combo.move === "spinkick") {
                sfx(() => SFX.spinKick());
                triggerShake(7, 14);
                g.hitPause = 2;
              } else if (combo.move === "dashpunch") {
                sfx(() => SFX.dashPunch());
                triggerShake(9, 16);
                g.hitPause = 3;
              }
              setTimeout(() => setComboName(""), 1000);
              break;
            }
          }
        }
      }

      // ── L key actions: shuriken (highest) → groundpound (air) → style special (ground) ──
      const SPECIAL_ENERGY_COST = 25;
      if (!didSpecial && g.keyJustPressed.has("l") && p.attackCooldown <= 0 && p.state !== "dead") {
        // 🌀 SHURIKEN THROW (highest priority if equipped)
        if (g.weaponType === "shuriken" && g.shurikenAmmo > 0 && p.y >= GROUND_Y - 5) {
          g.shurikenAmmo--;
          p.state = "punch";
          p.stateTimer = 12;
          p.attackCooldown = 14;
          g.projectiles.push({
            x: p.x + p.facing * 30,
            y: p.y - 40,
            vx: p.facing * 14,
            vy: 0,
            timer: 90,
            isPlayerProjectile: true,
            damage: Math.round(18 * fightStyle.damage),
          });
          sfx(() => SFX.shurikenThrow?.());
          triggerShake(2, 4);
          g.effects.push({ x: p.x, y: p.y - 60, timer: 20, text: "✦", color: "#cc44ff", size: 14 });
          if (g.shurikenAmmo <= 0) { g.weaponType = null; g.weaponTimer = 0; }
          didSpecial = true;
        }
        // 💥 AIR: GROUNDPOUND
        else if (p.y < GROUND_Y && c.specialEnergy >= SPECIAL_ATTACKS.groundpound.energyCost) {
          p.state = "groundpound";
          p.stateTimer = SPECIAL_ATTACKS.groundpound.frames;
          p.attackCooldown = SPECIAL_ATTACKS.groundpound.frames + 5;
          p.vy = 15;
          c.specialEnergy -= Math.round(SPECIAL_ATTACKS.groundpound.energyCost * fightStyle.staminaCost);
          setEnergy(c.specialEnergy);
          setComboName("GROUND POUND!");
          g.effects.push({ x: p.x, y: p.y - 80, timer: 40, text: "GROUND POUND!", color: "#ff6600", size: 18 });
          didSpecial = true;
          sfx(() => SFX.groundPound());
          setTimeout(() => setComboName(""), 1000);
        }
        // 🔥 GROUND: STYLE SPECIAL
        else if (p.y >= GROUND_Y - 5 && c.specialEnergy >= SPECIAL_ENERGY_COST) {
          const specialSet = MOVE_SETS[g.style].special;
          if (specialSet && specialSet.length > 0) {
            const move = specialSet[0];
            g.currentMove = move;
            g.hitApplied = false;
            const totalFrames = Math.max(8, Math.round(msToFrames(move.recovery) / fightStyle.speed));
            const activeFrames = Math.max(2, Math.round(msToFrames(move.hitstun) / fightStyle.speed));
            g.attackActive = true;
            g.attackActiveFrames = activeFrames;
            p.state = "kick";
            p.stateTimer = totalFrames;
            p.attackCooldown = totalFrames + 4;
            c.specialEnergy -= Math.round(SPECIAL_ENERGY_COST * fightStyle.staminaCost);
            setEnergy(c.specialEnergy);
            triggerShake(g.style === "brawler" ? 14 : 8, g.style === "brawler" ? 22 : 16);
            g.specialFx = { style: g.style, timer: totalFrames, total: totalFrames };
            setComboName(move.name.toUpperCase() + "!");
            g.effects.push({
              x: p.x, y: p.y - 80, timer: 40,
              text: move.name.toUpperCase() + "!", color: STYLES[g.style].tint, size: 18,
            });
            didSpecial = true;
            sfx(() => SFX.uppercut());
            setTimeout(() => setComboName(""), 1000);
            if (import.meta.env.DEV) {
              console.log("[Brawler] STYLE:", g.style);
              console.log("[Brawler] INPUT: special");
              console.log("[Brawler] MOVE:", move.name, move);
            }
          }
        }
      }

      // Player movement & basic attacks (blocked during attack animations)
      if (p.state !== "hit" && p.state !== "dead" && !isAttacking && !didSpecial) {
        const speed = PLAYER_SPEED * (g.speedBoostTimer > 0 ? 1.6 : 1) * fightStyle.speed;
        let moving = false;
        if (g.keys.has("a") || g.keys.has("arrowleft")) { p.x -= speed; p.facing = -1; moving = true; }
        if (g.keys.has("d") || g.keys.has("arrowright")) { p.x += speed; p.facing = 1; moving = true; }
        if ((g.keys.has("w") || g.keys.has("arrowup") || g.keys.has(" ")) && (p.y >= GROUND_Y || (p as Entity & { onPlatform?: Platform | null }).onPlatform)) { p.vy = JUMP_FORCE; (p as Entity & { onPlatform?: Platform | null }).onPlatform = null; }

        // Reset light-chain index after CHAIN_RESET_MS of inactivity
        const chainResetFrames = msToFrames(CHAIN_RESET_MS);
        if (g.animFrameCount - g.lightChain.lastFrame > chainResetFrames) {
          g.lightChain.index = 0;
        }

        if (g.keyJustPressed.has("j") && p.attackCooldown <= 0) {
          // Light attack — chains through style's light moveset (jab → straight → hook for brawler)
          const lightSet = MOVE_SETS[g.style].light;
          const move = lightSet[g.lightChain.index % lightSet.length];
          g.lightChain.index++;
          g.lightChain.lastFrame = g.animFrameCount;
          g.currentMove = move;
          g.hitApplied = false;
          // Total animation = recovery (already includes startup), scaled by style speed
          const totalFrames = Math.max(4, Math.round(msToFrames(move.recovery) / fightStyle.speed));
          // Active hit window scales with hitstun & style speed (Rush snappier, Muay Thai longer)
          const activeFrames = Math.max(2, Math.round(msToFrames(move.hitstun) / fightStyle.speed));
          g.attackActive = true;
          g.attackActiveFrames = activeFrames;
          p.state = "punch"; p.stateTimer = totalFrames; p.attackCooldown = totalFrames + 2;
          sfx(() => g.weaponType ? (g.weaponType === "sword" ? SFX.swordSlash() : SFX.batSwing()) : SFX.punch());
          if (import.meta.env.DEV) {
            console.log("[Brawler] STYLE:", g.style);
            console.log("[Brawler] INPUT: light");
            console.log("[Brawler] MOVE:", move.name, move, `chain=${g.lightChain.index - 1}`);
            console.log("[Brawler] CURRENT MOVE:", g.currentMove);
            console.log("[Brawler] STATE TIMER:", p.stateTimer, "ACTIVE FRAMES:", activeFrames);
          }
        } else if (g.keyJustPressed.has("k") && p.attackCooldown <= 0) {
          // Heavy attack — single move per style (uppercut/dash strike/roundhouse)
          const heavySet = MOVE_SETS[g.style].heavy;
          const move = heavySet[0];
          g.currentMove = move;
          g.hitApplied = false;
          const totalFrames = Math.max(5, Math.round(msToFrames(move.recovery) / fightStyle.speed));
          const activeFrames = Math.max(2, Math.round(msToFrames(move.hitstun) / fightStyle.speed));
          g.attackActive = true;
          g.attackActiveFrames = activeFrames;
          p.state = "kick"; p.stateTimer = totalFrames; p.attackCooldown = totalFrames + 2;
          sfx(() => g.weaponType ? (g.weaponType === "sword" ? SFX.swordSlash() : SFX.batSwing()) : SFX.kick());
          if (import.meta.env.DEV) {
            console.log("[Brawler] STYLE:", g.style);
            console.log("[Brawler] INPUT: heavy");
            console.log("[Brawler] MOVE:", move.name, move);
            console.log("[Brawler] CURRENT MOVE:", g.currentMove);
            console.log("[Brawler] STATE TIMER:", p.stateTimer, "ACTIVE FRAMES:", activeFrames);
          }
        } else if (p.stateTimer <= 0) {
          // NOTE: don't null currentMove here — it's cleared after damage applies
          // (or when a new attack overwrites it). Nulling here can race the hit-frame check.
          p.state = moving ? "walk" : p.y < GROUND_Y ? "jump" : "idle";
        }
      } else if (p.state !== "hit" && p.state !== "dead" && !isAttacking && didSpecial) {
        // Special move was triggered, movement already handled by the special
      } else if (p.state !== "hit" && p.state !== "dead" && isAttacking) {
        // Allow movement during attacks (for dash punch etc)
        if (g.keys.has("a") || g.keys.has("arrowleft")) p.facing = -1;
        if (g.keys.has("d") || g.keys.has("arrowright")) p.facing = 1;
      }

      // (Shuriken throw consolidated into the L-key block above)


      g.keyJustPressed.clear();

      // Player physics (with jump-through platforms)
      const pAny = p as Entity & { onPlatform?: Platform | null };
      const prevFootY = p.y;
      p.vy += GRAVITY;
      p.y += p.vy;
      // Ground collision (unchanged)
      if (p.y >= GROUND_Y) {
        if (p.state === "groundpound" && p.vy > 5) {
          g.effects.push({ x: p.x, y: GROUND_Y, timer: 15, text: "💥", color: "#ff6600", size: 24 });
        }
        p.y = GROUND_Y;
        p.vy = 0;
        pAny.onPlatform = null;
      } else if (p.vy >= 0 && p.state !== "groundpound") {
        // Platform landing — only while descending; pass through from below; groundpound ignores.
        const halfW = 16;
        for (const plat of g.platforms) {
          if (p.x + halfW > plat.x && p.x - halfW < plat.x + plat.w) {
            if (prevFootY <= plat.y + 1 && p.y >= plat.y) {
              p.y = plat.y;
              p.vy = 0;
              pAny.onPlatform = plat;
              break;
            }
          }
        }
      }
      p.x = Math.max(20, Math.min(LEVEL_WIDTH - 20, p.x));
      p.x += p.vx || 0;
      if (p.state === "dashpunch" && p.stateTimer > 5) p.x += p.facing * 6; // dash forward
      p.vx = (p.vx || 0) * 0.85;
      // Walk off platform edge — start falling on next frame.
      if (pAny.onPlatform) {
        const plat = pAny.onPlatform;
        const halfW = 16;
        if (p.x + halfW <= plat.x || p.x - halfW >= plat.x + plat.w) {
          pAny.onPlatform = null;
        } else {
          // Stay snapped to platform top while standing on it.
          p.y = plat.y;
        }
      }

      p.stateTimer = Math.max(-1, p.stateTimer - 1);
      p.attackCooldown = Math.max(-1, p.attackCooldown - 1);
      // Decay active hit window — attackActive flips off when the move's active frames elapse
      if (g.attackActive) {
        g.attackActiveFrames -= 1;
        if (g.attackActiveFrames <= 0) g.attackActive = false;
      }
      if (p.state === "hit" && p.stateTimer <= 0) p.state = "idle";
      if (isAttacking && p.stateTimer <= 0) p.state = "idle";

      // Player attack hit detection (all attack types)
      // Legacy hand-tuned specials fire on a single specific frame.
      const hitFrameSpec = (
        (p.state === "uppercut" && p.stateTimer === 12) ||
        (p.state === "spinkick" && (p.stateTimer === 14 || p.stateTimer === 8)) ||
        (p.state === "dashpunch" && p.stateTimer === 8) ||
        (p.state === "groundpound" && p.y >= GROUND_Y - 5 && p.stateTimer > 5)
      );
      // Data-driven J/K/L basics: percentage-based active window from attackCooldown.
      // Window opens at ~50% through the animation and lasts a few frames; hitApplied
      // ensures each press lands at most once.
      let hitFrameBasic = false;
      if (!SPECIAL_ATTACKS[p.state] && g.currentMove && !g.hitApplied) {
        const totalFrames = p.attackCooldown;
        const activeStart = Math.floor(totalFrames * 0.5); // middle of animation
        const activeEnd = Math.max(0, activeStart - 2);    // small window (timer counts down)
        hitFrameBasic = p.stateTimer <= activeStart && p.stateTimer >= activeEnd;
        if (import.meta.env.DEV && hitFrameBasic) {
          console.log("[Brawler] HIT WINDOW:", p.stateTimer, `(active ${activeEnd}-${activeStart}, total ${totalFrames}, style ${g.style})`);
        }
      }
      const hitFrame = hitFrameSpec || hitFrameBasic;

      if (hitFrame) {
        const spec = SPECIAL_ATTACKS[p.state];
        // For J/K basic attacks the active move data drives range/damage/knockback.
        // Specials (uppercut/spinkick/dashpunch/groundpound) keep their hand-tuned values.
        const move = !spec ? g.currentMove : null;

        // Sanity: basic attacks need currentMove (guard already in hitFrameBasic, but defensive).
        if (!spec && !g.currentMove) {
          if (import.meta.env.DEV) {
            console.log("[Brawler] HIT-FRAME SKIPPED — CURRENT MOVE:", g.currentMove, "STYLE:", g.style, "STATE TIMER:", p.stateTimer);
          }
        } else {
        const baseRange = spec ? spec.range : (move ? move.range : (p.state === "punch" ? 45 : 55));
        const range = baseRange + (g.weaponType ? WEAPON_STATS[g.weaponType].rangeBonus : 0);
        const baseDmg = spec ? spec.dmg : (move ? move.damage : (p.state === "punch" ? 12 : 18));
        const dmgMult = (g.dmgBoostTimer > 0 ? 1.5 : 1) * (g.weaponType ? WEAPON_STATS[g.weaponType].dmgMult : 1);
        const kb = spec ? spec.knockback : (move ? move.knockback : (p.state === "punch" ? 5 : 6));
        let dmg = Math.round(baseDmg * c.multiplier * dmgMult * fightStyle.damage);
        // Green Candle rage: bonus damage scales with combo hit count (cap +50%)
        if (g.style === "greenCandle") {
          const rageBonus = Math.min(c.hitCount * 0.03, 0.5);
          dmg = Math.round(dmg * (1 + rageBonus));
        }
        if (import.meta.env.DEV) {
          console.log("[Brawler] HIT FRAME — CURRENT MOVE:", g.currentMove, "STYLE:", g.style, "STATE TIMER:", p.stateTimer);
          console.log("[Brawler] DAMAGE:", dmg, `(base=${baseDmg} × combo=${c.multiplier.toFixed(2)} × boost=${dmgMult} × style=${fightStyle.damage})`);
        }

        // Heavy-impact screen shake on groundpound landing
        if (p.state === "groundpound") {
          triggerShake(12, 22);
          g.hitPause = 4;
        }

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
            e.stateTimer = spec ? 15 : (move ? Math.max(8, msToFrames(move.hitstun) / 2) : 10);
            e.vx = (isGroundPound ? (dx > 0 ? 1 : -1) : p.facing) * kb;
            if (p.state === "uppercut") e.vy = -10;
            // Green Candle parabolic launch on every hit
            if (g.style === "greenCandle") e.vy = -12;

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

            // Per-hit screen shake by attack tier (light/medium/heavy)
            // Light: punch. Medium: kick/specials. Heavy: groundpound (already triggered above).
            if (p.state === "punch") {
              triggerShake(2.5, 6);
            } else if (p.state === "kick") {
              triggerShake(4, 9);
            } else if (spec && p.state !== "groundpound") {
              triggerShake(5, 10);
            }

            g.effects.push({
              x: e.x, y: e.y - 50, timer: 25,
              text: c.hitCount > 2 ? `${dmg} x${c.hitCount}` : `${dmg}`,
              color: c.hitCount > 4 ? "#ff00ff" : c.hitCount > 2 ? "#FFD700" : "#ffffff",
              size: Math.min(14 + c.hitCount * 2, 24),
            });

            // Move name pop (only on first hit of the move so it doesn't spam)
            if (move && c.hitCount === 1) {
              g.effects.push({
                x: p.x, y: p.y - 95, timer: 30,
                text: move.name.toUpperCase(), color: STYLES[g.style].tint, size: 12,
              });
            }

            if (e.hp <= 0) {
              e.state = "dead";
              e.stateTimer = 60;
              sfx(() => e.isBoss ? SFX.victory() : SFX.enemyDeath());
              // Finisher: strong shake + hit-pause for satisfying KO feel
              triggerShake(e.isBoss ? 14 : 7, e.isBoss ? 28 : 14);
              g.hitPause = Math.max(g.hitPause, e.isBoss ? 8 : 4);
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
              // Drop weapon (separate from power-ups)
              if (Math.random() < WEAPON_DROP_CHANCE) {
                const wTypes: WeaponType[] = ["bat", "sword", "shuriken"];
                const wWeights = [0.4, 0.3, 0.3];
                let wr = Math.random();
                let wType: WeaponType = "bat";
                for (let wi = 0; wi < wTypes.length; wi++) {
                  wr -= wWeights[wi];
                  if (wr <= 0) { wType = wTypes[wi]; break; }
                }
                g.weapons.push({ x: e.x + 20, y: e.y - 40, vy: -4, type: wType, collected: false, timer: 600 });
              }
            }
          }
        }
        // Mark hit as applied so the same press can't double-hit on a later frame
        // within the active window. currentMove is kept so the alley-object loop below
        // can still read range/damage; it's nulled when the next attack overwrites it
        // or the animation ends naturally.
        if (!spec) {
          g.hitApplied = true;
          g.attackActive = false;
        }
        } // end else (spec || (currentMove && attackActive))
      }

      // Hit detection on alley objects (crates, trash cans)
      if (hitFrame) {
        const spec = SPECIAL_ATTACKS[p.state];
        const baseRange = spec ? spec.range : (p.state === "punch" ? 45 : 55);
        const objRange = baseRange + (g.weaponType ? WEAPON_STATS[g.weaponType].rangeBonus : 0);
        const baseDmg = spec ? spec.dmg : (p.state === "punch" ? 12 : 18);
        const objDmgMult = (g.dmgBoostTimer > 0 ? 1.5 : 1) * (g.weaponType ? WEAPON_STATS[g.weaponType].dmgMult : 1);
        const objDmg = Math.round(baseDmg * objDmgMult);

        for (const obj of g.alleyObjects) {
          if (obj.broken) continue;
          const dx = obj.x - p.x;
          const isGP = p.state === "groundpound";
          const inRange = isGP
            ? Math.abs(dx) < objRange && Math.abs(obj.y - p.y) < 60
            : dx * p.facing > 0 && Math.abs(dx) < objRange && Math.abs(obj.y - p.y) < 50;
          if (inRange) {
            obj.hp -= objDmg;
            sfx(() => SFX.hit());
            g.effects.push({
              x: obj.x, y: obj.y - 30, timer: 20,
              text: `${objDmg}`, color: "#ccaa44", size: 12,
            });
            if (obj.hp <= 0) {
              obj.broken = true;
              obj.breakTimer = 40;
              sfx(() => SFX.enemyDeath());
              const bonus = obj.type === "trashcan" ? 25 : 15;
              g.score += bonus;
              setScore(g.score);
              g.effects.push({
                x: obj.x, y: obj.y - 50, timer: 30,
                text: `+${bonus}`, color: "#ffaa00", size: 14,
              });
              // Chance to drop power-up from objects
              if (Math.random() < 0.3) {
                const types: PowerUp["type"][] = ["health", "energy"];
                const pType = types[Math.floor(Math.random() * types.length)];
                g.powerups.push({ x: obj.x, y: obj.y - 20, vy: -3, type: pType, timer: 600 });
              }
            }
          }
        }
      }

      // Update broken object timers
      for (const obj of g.alleyObjects) {
        if (obj.broken && obj.breakTimer > 0) obj.breakTimer--;
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
          const bossCfg = LEVELS[Math.min(g.level, LEVELS.length - 1)].boss;
          // Update boss phase based on HP
          if (e.hp <= e.maxHp * 0.3) e.bossPhase = 3;
          else if (e.hp <= e.maxHp * 0.6) e.bossPhase = 2;

          const bossStates: AttackState[] = ["boss_charge", "boss_slam", "boss_throw", "punch", "kick"];
          const isBossAttacking = bossStates.includes(e.state) || e.state === "hit";

          if (!isBossAttacking) {
            const dx = p.x - e.x;
            const dist = Math.abs(dx);
            e.facing = dx > 0 ? 1 : -1;
            const phaseSpeed = bossCfg.aiSpeed + (e.bossPhase || 1) * 0.4;

            if (e.attackCooldown <= 0) {
              const phase = e.bossPhase || 1;
              const cdScale = Math.max(0.55, 1.25 - g.level * 0.1);
              if (dist > 250 && phase >= 2) {
                e.state = "boss_charge";
                e.stateTimer = 30;
                sfx(() => SFX.bossCharge());
                e.attackCooldown = Math.round((50 - phase * 8) * cdScale);
              } else if (dist > 150) {
                e.state = "boss_throw";
                e.stateTimer = 20;
                e.attackCooldown = Math.round((40 - phase * 5) * cdScale);
              } else if (dist < 80) {
                e.state = "boss_slam";
                e.stateTimer = 25;
                sfx(() => SFX.bossSlam());
                e.attackCooldown = Math.round((45 - phase * 8) * cdScale);
              } else {
                const atk = Math.random() > 0.5 ? "punch" : "kick";
                e.state = atk;
                e.stateTimer = atk === "punch" ? 14 : 17;
                e.attackCooldown = Math.round((25 - phase * 3) * cdScale);
              }
            } else {
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
            e.x += e.facing * bossCfg.chargeSpeed;
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
            const baseDmg = e.state === "boss_slam" ? 6 : e.state === "boss_charge" ? 5 : e.state === "punch" ? 3 : 4;
            const dmg = Math.max(2, Math.round(baseDmg * bossCfg.dmgMult));
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
              // Boss hit screen shake — slam is the heaviest
              const bossShakeMag = e.state === "boss_slam" ? 13 : e.state === "boss_charge" ? 10 : 7;
              triggerShake(bossShakeMag, 20);
              g.hitPause = e.state === "boss_slam" ? 4 : 2;
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
            e.x += e.facing * (LEVELS[g.level]?.waves[g.wave]?.speed || 1.5);
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
          const dmg = e.state === "punch" ? 1 : 1;
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
        if (!proj.isPlayerProjectile) proj.vy += 0.15;
        proj.timer--;
        if (proj.y >= GROUND_Y) return false;

        if (proj.isPlayerProjectile) {
          // Player shuriken hits enemies
          for (const e of g.enemies) {
            if (e.state === "dead") continue;
            const edx = Math.abs(e.x - proj.x);
            const edy = Math.abs(e.y - proj.y);
            if (edx < 40 && edy <= 50) {
              const shurikenDmg = proj.damage ?? 20;
              e.hp -= shurikenDmg;
              e.state = "hit";
              e.stateTimer = 8;
              e.vx = (proj.vx > 0 ? 1 : -1) * 4;
              sfx(() => SFX.hit());
              c.hitCount++;
              c.hitTimer = COMBO_HIT_WINDOW;
              c.multiplier = 1 + Math.min(c.hitCount * 0.15, 2);
              c.specialEnergy = Math.min(MAX_ENERGY, c.specialEnergy + 3);
              setEnergy(c.specialEnergy);
              setComboCount(c.hitCount);
              g.effects.push({ x: e.x, y: e.y - 50, timer: 20, text: `${shurikenDmg}`, color: "#cc44ff", size: 14 });
              g.effects.push({ x: proj.x, y: proj.y, timer: 12, text: "✦", color: "#ff66ff", size: 16 });
              if (e.hp <= 0) {
                e.state = "dead";
                e.stateTimer = 60;
                sfx(() => SFX.enemyDeath());
                const killBonus = Math.round(100 * c.multiplier);
                g.score += killBonus;
                setScore(g.score);
                g.effects.push({ x: e.x, y: e.y - 70, timer: 35, text: `+${killBonus}`, color: "#00ff00", size: 16 });
              }
              return false;
            }
          }
        } else {
          // Boss projectile hits player
          const dx = Math.abs(p.x - proj.x);
          const dy = Math.abs(p.y - proj.y);
          if (dx < 25 && dy < 35 && p.state !== "dead") {
            sfx(() => SFX.hit());
            p.hp -= 4;
            p.state = "hit";
            p.stateTimer = 10;
            p.vx = proj.vx > 0 ? 4 : -4;
            c.hitCount = 0;
            c.multiplier = 1;
            setComboCount(0);
            setPlayerHp(Math.max(0, p.hp));
            g.effects.push({ x: proj.x, y: proj.y - 20, timer: 20, text: "4", color: "#ff4444", size: 14 });
            if (p.hp <= 0) {
              p.state = "dead";
              g.running = false;
              sfx(() => SFX.gameOver());
              setGameState("gameover");
              return false;
            }
            return false;
          }
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
              // BULLISH callout above the player
              g.effects.push({ x: p.x, y: p.y - 110, timer: 75, text: "BULLISH", color: "#00ff66", size: 36 });
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

      // Weapon pickup collection & weapon timer
      g.weaponTimer = Math.max(0, g.weaponTimer - 1);
      if (g.weaponTimer === 0 && g.weaponType) { g.weaponType = null; g.shurikenAmmo = 0; }

      g.weapons = g.weapons.filter(wp => {
        if (wp.collected) return false;
        // Physics for dropped weapons
        wp.vy += 0.3;
        wp.y += wp.vy;
        if (wp.y >= GROUND_Y) { wp.y = GROUND_Y; wp.vy = 0; }
        wp.timer--;
        // Check player pickup
        const dx = Math.abs(p.x - wp.x);
        const dy = Math.abs(p.y - wp.y);
        if (dx < 35 && dy < 40 && p.state !== "dead") {
          const ws = WEAPON_STATS[wp.type];
          g.weaponType = wp.type;
          g.weaponTimer = ws.duration;
          if (wp.type === "shuriken") g.shurikenAmmo = SHURIKEN_AMMO;
          sfx(() => SFX.weaponPickup());
          g.effects.push({ x: wp.x, y: wp.y - 30, timer: 40, text: `${ws.icon} ${ws.name} EQUIPPED!`, color: ws.color, size: 16 });
          return false;
        }
        return wp.timer > 0;
      });

      if (g.speedBoostTimer > 0) {
        // Speed boost handled by multiplying movement in the movement section
      }

      // Wave / Level progression
      const alive = g.enemies.filter(e => e.state !== "dead");
      if (alive.length === 0) {
        g.enemies = g.enemies.filter(e => e.stateTimer > 0);
        if (g.enemies.length === 0) {
          // Was the just-cleared wave the boss wave (index === waves.length)?
          const justClearedBoss = g.wave >= LEVELS[g.level].waves.length;

          if (justClearedBoss) {
            // Advance to next level
            g.level++;
            g.wave = 0;
            setLevel(g.level);
            setWave(0);
            if (g.level >= TOTAL_LEVELS) {
              g.running = false;
              sfx(() => SFX.victory());
              setGameState("victory");
              return;
            }
            // Fully heal player between levels (reward)
            p.hp = p.maxHp;
            setPlayerHp(p.hp);
            g.healFlash = 60;
            g.effects.push({
              x: p.x, y: p.y - 110, timer: 120,
              text: `LEVEL ${g.level + 1}: ${LEVELS[g.level].name}`,
              color: "#FFD700", size: 22,
            });
            g.effects.push({
              x: p.x, y: p.y - 80, timer: 90,
              text: "♥ FULL HP", color: "#22ff66", size: 18,
            });
            sfx(() => SFX.waveStart());
            g.enemies = spawnEnemies(g.level, 0, p.x);
            g.platforms = spawnPlatforms(g.level);
            (p as Entity & { onPlatform?: Platform | null }).onPlatform = null;
          } else {
            // Next wave within current level
            g.wave++;
            setWave(g.wave);
            const isBossWave = g.wave === LEVELS[g.level].waves.length;
            if (isBossWave) {
              g.enemies = [spawnBoss(p.x, g.level)];
              g.projectiles = [];
              // Trigger animated boss intro banner
              g.bossIntro = {
                active: true,
                timer: 150,
                total: 150,
                level: g.level,
                bossName: LEVELS[g.level].boss.name,
                levelName: LEVELS[g.level].name,
              };
              sfx(() => SFX.bossEntrance());
            } else {
              sfx(() => SFX.waveStart());
              g.enemies = spawnEnemies(g.level, g.wave, p.x);
            }
          }
        }
      }

      // Camera follow with screen-space deadzone + predictive look-ahead.
      // Uses a smoothed velocity (moving average) so the camera ignores
      // the tiny ±jitter at the moment the player decelerates to a stop.
      g.vxHistory.push(p.vx);
      if (g.vxHistory.length > 8) g.vxHistory.shift();
      g.vxAvg = g.vxHistory.reduce((s, v) => s + v, 0) / g.vxHistory.length;
      const vxSmooth = g.vxAvg;

      const MOVE_THRESHOLD = 0.6;
      const moving = Math.abs(vxSmooth) > MOVE_THRESHOLD;

      // Direction analysis: is the player moving FORWARD (same dir as facing)
      // or BACKWARD (retreating)?  Look-ahead only grows on forward motion;
      // on backward motion it stays small so the camera doesn't drift back.
      const movingForward = moving && Math.sign(vxSmooth) === p.facing;
      const movingBackward = moving && Math.sign(vxSmooth) !== p.facing;

      // Persist last "moving forward" anchor so retreating doesn't flip the
      // anchor to the other side of the screen. Player sits at ~1/4 screen
      // facing right (or 3/4 facing left), with ~half the view ahead.
      if (movingForward) {
        const targetAnchor = p.facing > 0 ? 0.12 : 0.88; // push further forward
        g.camAnchor += (targetAnchor - g.camAnchor) * 0.2;
      } else {
        const neutralAnchor = p.facing > 0 ? 0.25 : 0.75;
        g.camAnchor += (neutralAnchor - g.camAnchor) * 0.1;
      }

      // Preset-driven feel
      const snappy = g.camPreset === "snappy";

      // Simple direction-based fixed offset:
      //   camera.x = player.x + (direction * offset)
      // The camera sits a fixed distance ahead of the player based on
      // facing/movement direction. No velocity scaling — clean and predictable.
      const FIXED_OFFSET = snappy ? 160 : 220;
      let lookAheadTarget = 0;
      if (movingForward) {
        // Lead in the direction the player is moving
        lookAheadTarget = p.facing * FIXED_OFFSET;
      } else if (movingBackward) {
        // Retreating: hold last forward bias, decay slowly toward 0
        lookAheadTarget = 0;
      } else {
        // Idle: keep current bias, ease back to neutral
        lookAheadTarget = 0;
      }
      // Ease toward target — snap forward fast, decay gently
      const lookAheadEase = movingForward ? 0.25 : 0.08;
      g.camLookAhead += (lookAheadTarget - g.camLookAhead) * lookAheadEase;
      const velLookAhead = g.camLookAhead;

      const playerScreenX = p.x - g.camX;
      const anchorScreenX = CANVAS_W * g.camAnchor;

      // Deadzone — collapses tight when moving forward so the camera
      // commits to leading; wider when idle to avoid micro-jitter.
      const DEADZONE_HALF = snappy
        ? (movingForward ? 20 : moving ? 40 : 70)
        : (movingForward ? 30 : moving ? 60 : 100);
      const offset = playerScreenX - anchorScreenX;

      let lerpSpeed = 0;
      let targetCam = g.camX;

      if (movingForward) {
        // FORCE forward camera push (ignore deadzone) — commits to leading.
        targetCam = (p.x + velLookAhead) - anchorScreenX;
        g.camX += (targetCam - g.camX) * 0.35;
      } else if (Math.abs(offset) > DEADZONE_HALF) {
        // Normal behaviour for idle / backwards motion.
        targetCam = (p.x + velLookAhead) - anchorScreenX;
        const dist = Math.abs(targetCam - g.camX);
        const baseLerp = snappy
          ? (moving ? 0.22 : 0.08)
          : (moving ? 0.10 : 0.04);
        const maxLerp = snappy ? 0.4 : 0.22;
        lerpSpeed = Math.min(maxLerp, baseLerp + dist * 0.0008);
        g.camX += (targetCam - g.camX) * lerpSpeed;
      }
      g.camX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_W, g.camX));

      // Camera shake (decays each frame, applied as render offset only)
      if (g.camShake.timer > 0) {
        const dur = Math.max(1, g.camShake.duration);
        const t = g.camShake.timer;
        const m = g.camShake.magnitude * (t / dur);
        g.camShake.x = (Math.random() - 0.5) * 2 * m;
        g.camShake.y = (Math.random() - 0.5) * 2 * m;
        g.camShake.timer -= 1;
      } else {
        g.camShake.x = 0;
        g.camShake.y = 0;
      }

      g.debugCam = {
        anchor: g.camAnchor,
        lerp: lerpSpeed,
        playerScreenX,
        offset,
        deadzone: DEADZONE_HALF,
        lookAhead: velLookAhead,
        vx: vxSmooth,
      };

      // Draw
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      // Apply camera shake offset (visual only — does not affect game state).
      // Shake stays inside save/restore so the debug overlay below is unaffected.
      ctx.save();
      if (g.camShake.x !== 0 || g.camShake.y !== 0) {
        ctx.translate(g.camShake.x, g.camShake.y);
      }
      const currentTheme = LEVELS[Math.min(g.level, LEVELS.length - 1)].theme;
      drawScene(ctx, currentTheme, g.camX, CANVAS_W, g.animFrameCount);

      // Draw alley objects (crates, trash cans)
      for (const obj of g.alleyObjects) {
        if (obj.broken && obj.breakTimer <= 0) continue;
        drawAlleyObject(ctx, obj, g.camX);
      }

      // Draw platforms (Phase 1)
      for (const plat of g.platforms) {
        drawPlatform(ctx, plat, g.camX);
      }

      // Draw rain
      ctx.save();
      for (const drop of g.rain) {
        ctx.globalAlpha = drop.opacity;
        ctx.strokeStyle = "#aaccff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.wind * 0.5, drop.y - drop.length);
        ctx.stroke();
      }
      ctx.restore();

      // Draw splashes
      ctx.save();
      for (const s of g.splashes) {
        const progress = 1 - s.timer / s.maxTimer;
        ctx.globalAlpha = (1 - progress) * 0.5;
        if (s.inPuddle) {
          ctx.strokeStyle = "#8899cc";
          ctx.lineWidth = 0.8;
          const r = s.size * (1 + progress * 3);
          ctx.beginPath();
          ctx.ellipse(s.x, s.y + 8, r, r * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
          if (progress < 0.5) {
            ctx.beginPath();
            ctx.ellipse(s.x, s.y + 8, r * 0.5, r * 0.15, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = "#8899cc";
          const spread = s.size * (1 + progress * 2);
          for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI - Math.PI * 0.1;
            const dist = spread * (0.5 + progress);
            const sx = s.x + Math.cos(angle) * dist;
            const sy = s.y - Math.sin(angle) * dist * 0.8;
            ctx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);
          }
        }
      }
      ctx.restore();

      // Wave text
      const lvlWaves = LEVELS[g.level]?.waves.length ?? 0;
      const boss = g.enemies.find(e => e.isBoss && e.state !== "dead");
      if (boss) {
        drawBossHpBar(ctx, boss, CANVAS_W);
      } else {
        ctx.fillStyle = "#ffd70088";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `LEVEL ${g.level + 1}/${TOTAL_LEVELS} — WAVE ${Math.min(g.wave + 1, lvlWaves)}/${lvlWaves}`,
          CANVAS_W / 2, 25,
        );
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
        const flashing = pu.timer < 120 && Math.floor(pu.timer / 10) % 2 === 0;
        ctx.save();
        if (flashing) ctx.globalAlpha = 0.4;

        // Glow
        ctx.beginPath();
        ctx.arc(px, py - 10 + bob, 16, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(px, py - 10 + bob, 2, px, py - 10 + bob, 16);
        glow.addColorStop(0, POWERUP_COLORS[pu.type] + "88");
        glow.addColorStop(1, POWERUP_COLORS[pu.type] + "00");
        ctx.fillStyle = glow;
        ctx.fill();

        if (pu.type === "health") {
          // Green candle health pickup — matches red minion style but green
          const cx = px;
          const baseY = py - 2 + bob;
          const candleW = 12;
          const candleH = 18;
          const wickLen = 4;

          // Candle body
          ctx.fillStyle = "#1ec24a";
          ctx.fillRect(cx - candleW / 2, baseY - candleH, candleW, candleH);
          // Highlight stripe
          ctx.fillStyle = "#7cff8c";
          ctx.fillRect(cx - candleW / 2 + 1, baseY - candleH + 2, 2, candleH - 4);
          // Side shadow
          ctx.fillStyle = "#0d6b1c";
          ctx.fillRect(cx + candleW / 2 - 2, baseY - candleH + 2, 1, candleH - 4);
          // Top rim
          ctx.fillStyle = "#b6ffc4";
          ctx.fillRect(cx - candleW / 2 + 1, baseY - candleH + 1, candleW - 2, 1.5);
          // Outline
          ctx.strokeStyle = "#062b0d";
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - candleW / 2, baseY - candleH, candleW, candleH);
          // Wick
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, baseY - candleH);
          ctx.lineTo(cx, baseY - candleH - wickLen);
          ctx.stroke();
          // Flame (flicker)
          const flick = Math.sin(Date.now() / 90 + cx * 0.05) * 0.8;
          const fY = baseY - candleH - wickLen;
          ctx.beginPath();
          ctx.moveTo(cx, fY - 8 - flick);
          ctx.bezierCurveTo(4, fY - 4, 3, fY + 1, cx, fY + 1);
          ctx.bezierCurveTo(cx - 3, fY + 1, cx - 4, fY - 4, cx, fY - 8 - flick);
          ctx.fillStyle = "#ff8a1a";
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx, fY - 5 - flick * 0.5);
          ctx.bezierCurveTo(cx + 2, fY - 2, cx + 1.5, fY, cx, fY);
          ctx.bezierCurveTo(cx - 1.5, fY, cx - 2, fY - 2, cx, fY - 5 - flick * 0.5);
          ctx.fillStyle = "#ffe14a";
          ctx.fill();
        } else {
          // Other power-ups keep emoji icon
          ctx.font = "16px serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(POWERUP_ICONS[pu.type], px, py - 5 + bob);
        }
        ctx.restore();
      }

      // Draw weapon pickups on ground
      for (const wp of g.weapons) {
        if (wp.collected) continue;
        const wx = wp.x - g.camX;
        if (wx < -40 || wx > CANVAS_W + 40) continue;
        const wy = wp.y;
        const bob = Math.sin(Date.now() / 300) * 2;
        const ws = WEAPON_STATS[wp.type];
        // Despawn flash
        if (wp.timer < 120 && Math.floor(wp.timer / 10) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }
        // Glow
        ctx.beginPath();
        ctx.arc(wx, wy - 12 + bob, 16, 0, Math.PI * 2);
        const wGlow = ctx.createRadialGradient(wx, wy - 12 + bob, 3, wx, wy - 12 + bob, 16);
        wGlow.addColorStop(0, ws.color + "88");
        wGlow.addColorStop(1, ws.color + "00");
        ctx.fillStyle = wGlow;
        ctx.fill();
        // Draw weapon shape
        ctx.save();
        ctx.translate(wx, wy - 12 + bob);
        ctx.rotate(-Math.PI / 4);
        if (wp.type === "bat") {
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(-3, -18, 6, 28);
          ctx.fillStyle = "#A0522D";
          ctx.fillRect(-5, -22, 10, 8);
        } else if (wp.type === "sword") {
          ctx.fillStyle = "#ccc";
          ctx.fillRect(-1.5, -22, 3, 32);
          ctx.fillStyle = "#888";
          ctx.fillRect(-5, 7, 10, 4);
          ctx.fillStyle = "#664400";
          ctx.fillRect(-2.5, 11, 5, 8);
        } else if (wp.type === "shuriken") {
          const spin = Date.now() / 200;
          ctx.rotate(spin);
          ctx.fillStyle = "#cc44ff";
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-3, -10);
            ctx.lineTo(0, -12);
            ctx.lineTo(3, -10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
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
      if (g.weaponType) {
        const ws = WEAPON_STATS[g.weaponType];
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = ws.color;
        ctx.textAlign = "left";
        const ammoText = g.weaponType === "shuriken" ? ` x${g.shurikenAmmo}` : "";
        ctx.fillText(`${ws.icon} ${ws.name} ${Math.ceil(g.weaponTimer / 60)}s${ammoText}`, 20, boostY);
      }

      for (const e of g.enemies) {
        if (e.state === "dead" && e.stateTimer <= 0) continue;
        if (e.isBoss) {
          drawBoss(ctx, e, g.camX);
        } else {
          drawCandleMinion(ctx, e, g.camX);
        }
      }

      // Draw projectiles
      for (const proj of g.projectiles) {
        const px = proj.x - g.camX;
        const py = proj.y;
        if (proj.isPlayerProjectile) {
          // Spinning shuriken
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Date.now() / 80);
          ctx.fillStyle = "#cc44ff";
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-2, -7);
            ctx.lineTo(0, -9);
            ctx.lineTo(2, -7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        } else {
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
      }

      // Style aura — colored glow ring under player so the active style is readable at a glance.
      // Default brawler skips the ring (neutral baseline).
      if (g.style !== "brawler") {
        const px = p.x - g.camX;
        const py = p.y - p.height / 2;
        const pulse = 0.7 + 0.3 * Math.sin(g.animFrameCount * 0.15);
        // Bigger, hotter aura when player is on a rage streak
        const auraSize = c.hitCount > 10 ? 10 : 0;
        ctx.save();
        ctx.globalAlpha = 0.55 * pulse;
        ctx.strokeStyle = STYLES[g.style].tint;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(px, p.y - 2, 22 + auraSize, 6 + auraSize * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.35 * pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py + 6, 28 + auraSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ─── Style-specific SPECIAL move visuals (visuals only — no combat changes) ───
      // Tied to g.specialFx which is set the instant the style special triggers.
      if (g.specialFx && g.specialFx.timer > 0) {
        const fx = g.specialFx;
        const t = fx.timer / fx.total;            // 1 -> 0 over the move
        const progress = 1 - t;                   // 0 -> 1
        const px = p.x - g.camX;
        const py = p.y - p.height / 2;
        ctx.save();

        if (fx.style === "brawler") {
          // Haymaker: full-screen white impact flash on the active window
          const flash = Math.max(0, 1 - Math.abs(progress - 0.45) * 4);
          if (flash > 0) {
            ctx.globalAlpha = flash * 0.55;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          }
          // Heavy arc swoosh in front of the player
          ctx.globalAlpha = 0.7 * t;
          ctx.strokeStyle = "#fff8c8";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(px + p.facing * 20, py + 4, 50, p.facing === 1 ? -Math.PI / 2 : Math.PI / 2, p.facing === 1 ? Math.PI / 2 : (3 * Math.PI) / 2);
          ctx.stroke();
        } else if (fx.style === "rush") {
          // Afterimage barrage: 3 cyan ghost silhouettes trailing behind the player
          ctx.fillStyle = "rgba(0,200,255,0.35)";
          for (let i = 1; i <= 3; i++) {
            const off = i * 14 * p.facing;
            ctx.globalAlpha = (0.35 - i * 0.08) * t;
            ctx.beginPath();
            ctx.ellipse(px - off, py + 4, 10, 22, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          // Blue speed streaks
          ctx.globalAlpha = 0.8 * t;
          ctx.strokeStyle = "#7fe8ff";
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const yy = py - 10 + i * 8;
            ctx.beginPath();
            ctx.moveTo(px - p.facing * 50, yy);
            ctx.lineTo(px - p.facing * 10, yy);
            ctx.stroke();
          }
        } else if (fx.style === "muayThai") {
          // Flying knee: orange impact burst at strike point + leap arc trail
          const burstX = px + p.facing * 28;
          const burstY = py + 2;
          // Radial burst
          ctx.globalAlpha = Math.max(0, 1 - progress * 1.5);
          const grad = ctx.createRadialGradient(burstX, burstY, 4, burstX, burstY, 38);
          grad.addColorStop(0, "rgba(255,180,60,0.9)");
          grad.addColorStop(1, "rgba(255,80,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(burstX, burstY, 38, 0, Math.PI * 2);
          ctx.fill();
          // Leap streak behind player
          ctx.globalAlpha = 0.6 * t;
          ctx.strokeStyle = "#ff9a3c";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - p.facing * 40, py + 30);
          ctx.quadraticCurveTo(px - p.facing * 20, py - 20, px, py);
          ctx.stroke();
        } else if (fx.style === "greenCandle") {
          // Berserker lariat: spinning green ring + thick aura
          const spin = progress * Math.PI * 6;
          ctx.translate(px, py + 4);
          ctx.rotate(spin);
          ctx.globalAlpha = 0.6 * t;
          ctx.strokeStyle = "#39ff88";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 42, 14, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.35 * t;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.ellipse(0, 0, 50, 18, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
        fx.timer--;
        if (fx.timer <= 0) g.specialFx = null;
      }

      drawStickFigure(ctx, p, g.camX, g.headImg, true, g.weaponType, g.style);

      // Heal flash: expanding green ring + glow around player when fully healed at level start
      if (g.healFlash > 0) {
        const t = g.healFlash / 60; // 1 -> 0
        const progress = 1 - t;
        const px = p.x - g.camX;
        const py = p.y - p.height / 2;
        const ringR = 20 + progress * 90;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.strokeStyle = "#22ff66";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#22ff66";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.stroke();
        // Inner pulse
        ctx.globalAlpha = t * 0.4;
        ctx.fillStyle = "#22ff66";
        ctx.beginPath();
        ctx.arc(px, py, 30 + Math.sin(progress * Math.PI) * 12, 0, Math.PI * 2);
        ctx.fill();
        // Floating sparkle hearts
        ctx.globalAlpha = t;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#aaffcc";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + progress * Math.PI;
          const r = 35 + progress * 30;
          ctx.fillText("♥", px + Math.cos(ang) * r, py + Math.sin(ang) * r - progress * 20);
        }
        ctx.restore();
        g.healFlash -= 1;
      }

      drawHitEffects(ctx, g.effects, g.camX);

      // Boss intro banner overlay (drawn last, above everything)
      if (g.bossIntro.active) {
        drawBossIntro(ctx, g.bossIntro, CANVAS_W, CANVAS_H);
        g.bossIntro.timer -= 1;
        if (g.bossIntro.timer <= 0) g.bossIntro.active = false;
      }

      // End shake transform — overlays below render in true screen space.
      ctx.restore();

      // Camera debug overlay
      if (camDebugRef.current) {
        const d = g.debugCam;
        const lines = [
          `anchor:    ${d.anchor.toFixed(2)}  (screen ${(CANVAS_W * d.anchor).toFixed(0)}px)`,
          `lerp:      ${d.lerp.toFixed(3)}`,
          `playerSX:  ${d.playerScreenX.toFixed(0)}px`,
          `offset:    ${d.offset.toFixed(0)}px  (deadzone ±${d.deadzone}px)`,
          `lookAhead: ${d.lookAhead.toFixed(0)}px  (vx ${d.vx.toFixed(2)})`,
          `camX:      ${g.camX.toFixed(0)}`,
        ];
        const padX = 8, padY = 6, lineH = 13;
        const boxW = 230;
        const boxH = padY * 2 + lines.length * lineH;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(8, 8, boxW, boxH);
        ctx.strokeStyle = "rgba(255,215,0,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, boxW, boxH);
        ctx.fillStyle = "#FFD700";
        ctx.font = "11px monospace";
        ctx.textBaseline = "top";
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], 8 + padX, 8 + padY + i * lineH);
        }
        ctx.textBaseline = "alphabetic";

        // Visualize anchor line + deadzone band
        const ax = CANVAS_W * d.anchor;
        ctx.strokeStyle = "rgba(255,215,0,0.6)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, CANVAS_H); ctx.stroke();
        ctx.strokeStyle = "rgba(0,255,180,0.35)";
        ctx.beginPath(); ctx.moveTo(ax - d.deadzone, 0); ctx.lineTo(ax - d.deadzone, CANVAS_H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax + d.deadzone, 0); ctx.lineTo(ax + d.deadzone, CANVAS_H); ctx.stroke();
        ctx.setLineDash([]);
        // Player screen X marker
        ctx.strokeStyle = "rgba(255,80,80,0.8)";
        ctx.beginPath(); ctx.moveTo(d.playerScreenX, 0); ctx.lineTo(d.playerScreenX, CANVAS_H); ctx.stroke();
      }

      g.animFrame = requestAnimationFrame(tick);
    };

    g.animFrame = requestAnimationFrame(tick);

    return () => {
      const g = gameRef.current;
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2 sm:gap-4 w-full max-w-4xl mx-auto relative">
      {gameState === "playing" && (
        <div className="absolute top-2 right-2 z-20 flex gap-1.5">
          <button
            onClick={() => setCamPreset((p) => (p === "snappy" ? "buttery" : "snappy"))}
            className="px-2 py-1 rounded glass-card hover:bg-muted/50 transition text-[10px] font-mono text-primary"
            title={`Camera feel: ${camPreset.toUpperCase()} — click to toggle`}
            aria-label="Toggle camera preset"
          >
            {camPreset === "snappy" ? "SNAPPY" : "BUTTERY"}
          </button>
          <button
            onClick={() => {
              const next = !camDebugRef.current;
              camDebugRef.current = next;
              setShowCamDebug(next);
            }}
            className="px-2 py-1 rounded glass-card hover:bg-muted/50 transition text-[10px] font-mono"
            title="Toggle camera debug overlay"
            aria-label="Toggle camera debug overlay"
            style={{ color: showCamDebug ? "#FFD700" : undefined }}
          >
            CAM
          </button>
          <button
            onClick={() => {
              const next = !pausedRef.current;
              pausedRef.current = next;
              setIsPaused(next);
            }}
            className="p-1.5 rounded glass-card hover:bg-muted/50 transition"
            title={isPaused ? "Resume" : "Pause"}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused
              ? <Play className="w-4 h-4 text-primary" />
              : <Pause className="w-4 h-4 text-primary" />}
          </button>
          <button
            onClick={() => {
              const el = containerRef.current;
              if (!el) return;
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                el.requestFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 rounded glass-card hover:bg-muted/50 transition"
            title={document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen"}
          >
            {document.fullscreenElement
              ? <Minimize className="w-4 h-4 text-primary" />
              : <Maximize className="w-4 h-4 text-primary" />}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 sm:gap-3">
        <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h2 className="text-lg sm:text-xl font-bold text-primary font-heading">Street Brawler</h2>
      </div>

      <div
        className="relative w-full mx-auto"
        style={{
          // Allow the canvas to grow up to ~55svh on mobile so it's not tiny,
          // but never wider than the native 800px so visuals stay crisp.
          // 55svh * (800/400 aspect) = 110svw cap for width, then min() with 100% keeps it inside the column.
          maxWidth: `min(100%, ${CANVAS_W}px, calc(55svh * ${CANVAS_W} / ${CANVAS_H}))`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg border border-border/50 w-full block"
          style={{
            aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            height: "auto",
            imageRendering: "pixelated",
            display: gameState === "playing" ? "block" : "none",
          }}
        />
        {/* Landscape rotate hint — portrait-only game */}
        {gameState === "playing" && (
          <div className="landscape-rotate-hint absolute inset-0 hidden items-center justify-center bg-background/95 rounded-lg z-50 p-6 text-center">
            <div>
              <div className="text-4xl mb-3">📱↻</div>
              <h3 className="text-lg font-bold text-primary mb-1">Rotate to Portrait</h3>
              <p className="text-sm text-muted-foreground">This game is best played in portrait mode.</p>
            </div>
          </div>
        )}
      </div>

      {gameState === "playing" && (
        <div className="game-wrapper space-y-3 w-full">
          {/* Player HP — own full-width row, large */}
          <div className="glass-card px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold font-mono text-green-400 tracking-wider">PLAYER HP</span>
            </div>
            <div
              className="relative h-9 w-full rounded-sm overflow-visible border-2"
              style={{
                borderColor: "#0d3a14",
                background:
                  "repeating-linear-gradient(90deg, #0a1f0c 0px, #0a1f0c 6px, #0d2a10 6px, #0d2a10 12px)",
                boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)",
              }}
              title={`HP: ${Math.round(playerHp)}/100`}
            >
              {/* Wax fill */}
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{
                  width: `${playerHp}%`,
                  background:
                    "linear-gradient(180deg, #7cff8c 0%, #2bd14a 35%, #14a82e 70%, #0a6b1c 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.35)",
                }}
              />
              {/* Vertical highlight stripe (candle gloss) */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  width: "4px",
                  left: `calc(${Math.max(0, playerHp - 6)}% + 2px)`,
                  background: "rgba(255,255,255,0.5)",
                  display: playerHp > 4 ? "block" : "none",
                }}
              />
              {/* HP number overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm font-bold font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] tabular-nums">
                  {Math.max(0, Math.round(playerHp))} / 100
                </span>
              </div>
              {/* Flame at the tip of the wax */}
              {playerHp > 2 && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `calc(${playerHp}% - 11px)`,
                    top: "-16px",
                    width: "22px",
                    height: "26px",
                  }}
                >
                  <svg viewBox="0 0 12 14" width="22" height="26">
                    <path
                      d="M6 0 C8 4 10 6 8 10 C7 12 5 13 6 14 C2 13 1 9 3 6 C4 4 5 3 6 0 Z"
                      fill="#ff8a1a"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.85;1;0.85"
                        dur="0.5s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path
                      d="M6 4 C7 6 8 8 7 10 C6 11 5 11 6 12 C4 11 4 8 5 7 C5.5 6 5.7 5 6 4 Z"
                      fill="#ffe14a"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center glass-card px-4 py-2 text-sm flex-wrap gap-2">
            <button
              onClick={() => {
                const g = gameRef.current;
                g.style = nextStyle(g.style);
                setStyleName(g.style);
                sfxRef.current && SFX.powerupPickup();
              }}
              className="px-2 py-0.5 rounded font-bold text-xs font-mono transition border-2"
              style={{
                color: STYLES[styleName].tint,
                borderColor: STYLES[styleName].tint,
                background: `${STYLES[styleName].tint.replace("hsl(", "hsla(").replace(")", " / 0.12)")}`,
              }}
              title="Cycle fight style (Q)"
            >
              {STYLES[styleName].label} <span className="opacity-60">[Q]</span>
            </button>
            {comboCount > 1 && (
              <span className="text-primary font-bold animate-pulse">{comboCount}x COMBO!</span>
            )}
            <span className="text-primary font-bold">
              {`L${level + 1}/${TOTAL_LEVELS} · ${wave >= LEVELS[level].waves.length ? "⚠ BOSS" : `W${wave + 1}/${LEVELS[level].waves.length}`}`}
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

          {/* Mobile touch controls */}
          <div className="flex justify-between items-start gap-3 md:hidden px-1 pt-2 pb-1 select-none">
            {/* Left: D-pad */}
            <div className="flex gap-3">
              <button
                onTouchStart={() => touchMove("left")}
                onTouchEnd={() => touchMove("stop")}
                onContextMenu={(e) => e.preventDefault()}
                className="w-14 h-14 glass-card flex items-center justify-center text-2xl font-bold text-primary active:bg-primary/30 active:scale-95 transition-transform touch-none"
              >◀</button>
              <button
                onTouchStart={() => touchMove("right")}
                onTouchEnd={() => touchMove("stop")}
                onContextMenu={(e) => e.preventDefault()}
                className="w-14 h-14 glass-card flex items-center justify-center text-2xl font-bold text-primary active:bg-primary/30 active:scale-95 transition-transform touch-none"
              >▶</button>
            </div>
            {/* Right: Action cluster — jump/punch/kick aligned, special under punch */}
            <div className="flex gap-2 items-start">
              <button
                onTouchStart={() => touchAction("jump")}
                onContextMenu={(e) => e.preventDefault()}
                className="w-14 h-14 glass-card flex items-center justify-center text-[11px] font-extrabold tracking-wider text-primary active:bg-primary/30 active:scale-95 transition-transform touch-none"
                aria-label="Jump"
              >JUMP</button>
              <div className="flex flex-col gap-4 items-center">
                <button
                  onTouchStart={() => touchAction("punch")}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 glass-card flex items-center justify-center text-2xl font-bold text-primary active:bg-primary/30 active:scale-95 transition-transform touch-none"
                  aria-label="Punch"
                >👊</button>
                <button
                  onTouchStart={() => touchAction("special")}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 glass-card flex items-center justify-center text-2xl font-bold text-yellow-400 active:bg-yellow-400/30 active:scale-95 transition-transform touch-none"
                  aria-label="Special"
                >⚡</button>
              </div>
              <button
                onTouchStart={() => touchAction("kick")}
                onContextMenu={(e) => e.preventDefault()}
                className="w-14 h-14 glass-card flex items-center justify-center text-2xl font-bold text-primary active:bg-primary/30 active:scale-95 transition-transform touch-none"
                aria-label="Kick"
              >🦶</button>
            </div>
          </div>

          {comboName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <span className="text-primary font-bold text-lg animate-pulse">⚡ {comboName}!</span>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {gameState === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 text-center space-y-6"
          >
            <img src={streetBrawlerCover} alt="Waldoge Street Brawl" className="w-full max-w-md mx-auto object-contain rounded-lg shadow-2xl" />
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Battle through 7 levels of red candle goons. Each level ends with a tougher boss — survive them all!
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
                <p className="text-muted-foreground">You conquered all 7 levels! 🔥</p>
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
