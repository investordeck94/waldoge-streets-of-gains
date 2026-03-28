// Synthesized retro sound effects using Web Audio API — zero latency, no API keys
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.15, ramp = true) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const SFX = {
  punch() {
    playNoise(0.08, 0.12);
    playTone(200, 0.08, "square", 0.1);
  },

  kick() {
    playNoise(0.12, 0.15);
    playTone(120, 0.12, "sawtooth", 0.12);
  },

  hit() {
    // Player getting hit
    playNoise(0.1, 0.1);
    playTone(300, 0.1, "square", 0.08);
    playTone(150, 0.15, "sawtooth", 0.06);
  },

  uppercut() {
    playTone(200, 0.05, "square", 0.12);
    setTimeout(() => playTone(400, 0.05, "square", 0.14), 30);
    setTimeout(() => playTone(800, 0.15, "sawtooth", 0.12), 60);
    playNoise(0.15, 0.1);
  },

  spinKick() {
    playTone(300, 0.08, "sawtooth", 0.1);
    setTimeout(() => playTone(500, 0.08, "sawtooth", 0.12), 50);
    setTimeout(() => playTone(300, 0.1, "sawtooth", 0.1), 100);
    playNoise(0.2, 0.08);
  },

  dashPunch() {
    playTone(150, 0.05, "square", 0.1);
    setTimeout(() => playTone(250, 0.05, "square", 0.12), 20);
    setTimeout(() => playTone(350, 0.1, "square", 0.14), 40);
    playNoise(0.12, 0.12);
  },

  groundPound() {
    playTone(80, 0.3, "sawtooth", 0.15);
    playTone(60, 0.4, "square", 0.1);
    playNoise(0.2, 0.15);
  },

  enemyDeath() {
    playTone(400, 0.05, "square", 0.1);
    setTimeout(() => playTone(300, 0.05, "square", 0.08), 40);
    setTimeout(() => playTone(200, 0.1, "square", 0.06), 80);
    setTimeout(() => playTone(100, 0.15, "sawtooth", 0.05), 120);
  },

  // Boss sounds
  bossCharge() {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    playNoise(0.3, 0.08);
  },

  bossSlam() {
    playTone(50, 0.5, "sawtooth", 0.18);
    playTone(40, 0.6, "square", 0.12);
    playNoise(0.3, 0.18);
    setTimeout(() => playNoise(0.2, 0.1), 100);
  },

  bossThrow() {
    playTone(500, 0.05, "square", 0.08);
    setTimeout(() => playTone(400, 0.05, "square", 0.1), 30);
    setTimeout(() => playTone(300, 0.1, "sawtooth", 0.08), 60);
  },

  bossEntrance() {
    playTone(100, 0.15, "sawtooth", 0.12);
    setTimeout(() => playTone(80, 0.15, "sawtooth", 0.14), 150);
    setTimeout(() => playTone(60, 0.3, "sawtooth", 0.16), 300);
    setTimeout(() => playNoise(0.3, 0.12), 400);
  },

  // Power-ups
  powerupPickup() {
    playTone(600, 0.06, "square", 0.08);
    setTimeout(() => playTone(800, 0.06, "square", 0.1), 50);
    setTimeout(() => playTone(1000, 0.1, "square", 0.08), 100);
  },

  powerupHealth() {
    playTone(500, 0.08, "sine", 0.1);
    setTimeout(() => playTone(700, 0.08, "sine", 0.12), 60);
    setTimeout(() => playTone(900, 0.12, "sine", 0.1), 120);
  },

  // UI
  waveStart() {
    playTone(400, 0.1, "square", 0.08);
    setTimeout(() => playTone(500, 0.1, "square", 0.1), 100);
    setTimeout(() => playTone(600, 0.15, "square", 0.08), 200);
  },

  gameOver() {
    playTone(400, 0.15, "sawtooth", 0.1);
    setTimeout(() => playTone(300, 0.15, "sawtooth", 0.1), 150);
    setTimeout(() => playTone(200, 0.2, "sawtooth", 0.12), 300);
    setTimeout(() => playTone(100, 0.4, "sawtooth", 0.1), 500);
  },

  victory() {
    playTone(400, 0.1, "square", 0.1);
    setTimeout(() => playTone(500, 0.1, "square", 0.1), 100);
    setTimeout(() => playTone(600, 0.1, "square", 0.1), 200);
    setTimeout(() => playTone(800, 0.2, "square", 0.12), 300);
    setTimeout(() => playTone(1000, 0.3, "square", 0.1), 450);
  },

  comboHit(count: number) {
    const freq = 300 + Math.min(count, 10) * 50;
    playTone(freq, 0.06, "square", 0.08 + Math.min(count * 0.01, 0.06));
    playNoise(0.06, 0.06 + Math.min(count * 0.01, 0.08));
  },
};
