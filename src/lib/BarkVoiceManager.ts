// BarkVoiceManager — single global audio pipeline for Bark Zero.
// No module should ever construct an Audio() for voice; call barkVoice.play(id).

import { BARK_VOICE_CONFIG, BARK_VOICE_MAP, type BarkVoiceId } from "./barkVoiceConfig";

const LS = {
  enabled: "bark_voice_enabled",
  volume: "bark_voice_volume",
  muted: "bark_voice_muted",
  lastPlayed: "bark_voice_last_played",   // per-id timestamp
  dayPlayed: "bark_voice_day_played",     // per-id yyyy-mm-dd
  onceFlag: "bark_voice_once:",           // prefix + onceKey
};

type Listener = (state: BarkVoiceState) => void;

export interface BarkVoiceState {
  enabled: boolean;
  muted: boolean;
  volume: number;         // 0..1
  currentId: BarkVoiceId | null;
  ready: number;          // number of files preloaded
  total: number;
  missing: BarkVoiceId[];
}

class BarkVoiceManagerImpl {
  private cache = new Map<BarkVoiceId, HTMLAudioElement>();
  private missing = new Set<BarkVoiceId>();
  private current: HTMLAudioElement | null = null;
  private currentId: BarkVoiceId | null = null;
  private lastPlayedInSession: BarkVoiceId | null = null;
  private listeners = new Set<Listener>();
  private ready = 0;
  private preloadStarted = false;

  private _enabled: boolean;
  private _muted: boolean;
  private _volume: number;

  constructor() {
    this._enabled = this.readLS(LS.enabled, "1") !== "0";
    this._muted = this.readLS(LS.muted, "0") === "1";
    const v = parseFloat(this.readLS(LS.volume, "0.8"));
    this._volume = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8;
  }

  // ————— storage helpers —————
  private readLS(k: string, fallback: string) {
    try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
  }
  private writeLS(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} }

  private readMap(k: string): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch { return {}; }
  }
  private writeMap(k: string, m: Record<string, string>) {
    try { localStorage.setItem(k, JSON.stringify(m)); } catch {}
  }

  // ————— public getters / state —————
  get state(): BarkVoiceState {
    return {
      enabled: this._enabled,
      muted: this._muted,
      volume: this._volume,
      currentId: this.currentId,
      ready: this.ready,
      total: BARK_VOICE_CONFIG.length,
      missing: [...this.missing],
    };
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => { this.listeners.delete(fn); };
  }
  private emit() { for (const fn of this.listeners) fn(this.state); }

  // ————— preload —————
  preload(): Promise<void> {
    if (this.preloadStarted) return Promise.resolve();
    this.preloadStarted = true;
    const loaders = BARK_VOICE_CONFIG.map((entry) => new Promise<void>((resolve) => {
      const a = new Audio();
      a.preload = "auto";
      a.src = entry.file;
      a.volume = this._volume;
      const done = () => { this.ready += 1; this.emit(); resolve(); };
      a.addEventListener("canplaythrough", () => { this.cache.set(entry.id, a); done(); }, { once: true });
      a.addEventListener("error", () => {
        this.missing.add(entry.id);
        console.warn(`[BarkVoice] missing/failed: ${entry.file}`);
        done();
      }, { once: true });
      // kick load
      try { a.load(); } catch {}
    }));
    return Promise.all(loaders).then(() => { this.emit(); });
  }

  // ————— control —————
  setEnabled(v: boolean) {
    this._enabled = v;
    this.writeLS(LS.enabled, v ? "1" : "0");
    if (!v) this.stop();
    this.emit();
  }
  mute() { this._muted = true; this.writeLS(LS.muted, "1"); if (this.current) this.current.muted = true; this.emit(); }
  unmute() { this._muted = false; this.writeLS(LS.muted, "0"); if (this.current) this.current.muted = false; this.emit(); }
  toggleMute() { this._muted ? this.unmute() : this.mute(); }
  setVolume(v: number) {
    const clamped = Math.min(1, Math.max(0, v));
    this._volume = clamped;
    this.writeLS(LS.volume, String(clamped));
    for (const a of this.cache.values()) a.volume = clamped;
    this.emit();
  }

  stop() {
    if (this.current) {
      try { this.current.pause(); this.current.currentTime = 0; } catch {}
    }
    this.current = null;
    this.currentId = null;
    this.emit();
  }

  // ————— gating —————
  private canPlay(id: BarkVoiceId, opts: { force?: boolean }): boolean {
    if (opts.force) return true;
    if (!this._enabled) return false;
    const entry = BARK_VOICE_MAP[id];
    if (!entry) return false;

    // once-only lifetime flag (e.g. bark-intro)
    if (entry.onceKey) {
      if (this.readLS(LS.onceFlag + entry.onceKey, "0") === "1") return false;
    }
    // time-of-day
    if (entry.timeWindow) {
      const h = new Date().getHours();
      if (h < entry.timeWindow.startHour || h >= entry.timeWindow.endHour) return false;
    }
    // once per day
    if (entry.oncePerDay) {
      const day = this.readMap(LS.dayPlayed);
      const today = new Date().toISOString().slice(0, 10);
      if (day[id] === today) return false;
    }
    // cooldown
    if (entry.cooldownMs) {
      const last = this.readMap(LS.lastPlayed);
      const ts = parseInt(last[id] || "0", 10);
      if (Date.now() - ts < entry.cooldownMs) return false;
    }
    // never same clip twice in a row
    if (this.lastPlayedInSession === id) return false;
    return true;
  }

  private markPlayed(id: BarkVoiceId) {
    const entry = BARK_VOICE_MAP[id];
    if (!entry) return;
    if (entry.onceKey) this.writeLS(LS.onceFlag + entry.onceKey, "1");
    if (entry.oncePerDay) {
      const day = this.readMap(LS.dayPlayed);
      day[id] = new Date().toISOString().slice(0, 10);
      this.writeMap(LS.dayPlayed, day);
    }
    if (entry.cooldownMs) {
      const last = this.readMap(LS.lastPlayed);
      last[id] = String(Date.now());
      this.writeMap(LS.lastPlayed, last);
    }
    this.lastPlayedInSession = id;
  }

  /** Play a voice line by ID. Silently no-ops if gated. `force:true` bypasses gating (used by Settings previews & Replay Intro). */
  async play(id: BarkVoiceId, opts: { force?: boolean } = {}): Promise<void> {
    if (!BARK_VOICE_MAP[id]) { console.warn(`[BarkVoice] unknown id: ${id}`); return; }
    if (this.missing.has(id)) return;
    if (!this.canPlay(id, opts)) return;

    // stop anything currently playing
    if (this.current) {
      try { this.current.pause(); this.current.currentTime = 0; } catch {}
    }

    const audio = this.cache.get(id) ?? (() => {
      const a = new Audio(BARK_VOICE_MAP[id].file);
      a.preload = "auto";
      this.cache.set(id, a);
      return a;
    })();

    audio.volume = this._volume;
    audio.muted = this._muted;
    audio.currentTime = 0;

    this.current = audio;
    this.currentId = id;
    this.emit();

    const cleanup = () => {
      if (this.current === audio) { this.current = null; this.currentId = null; this.emit(); }
      audio.removeEventListener("ended", cleanup);
      audio.removeEventListener("error", cleanup);
    };
    audio.addEventListener("ended", cleanup);
    audio.addEventListener("error", cleanup);

    try {
      await audio.play();
      this.markPlayed(id);
    } catch (err) {
      // Autoplay blocked or missing file — swallow to keep app functional.
      console.warn(`[BarkVoice] play blocked/failed for ${id}:`, err);
      cleanup();
    }
  }

  /** Force-replay bark intro from Settings. */
  replayIntro() {
    // clear the once-flag so future first-launch logic still works only from Settings
    this.writeLS(LS.onceFlag + "bark_voice_intro_played", "0");
    return this.play("bark-intro", { force: true });
  }

  /** Restore default preferences (volume, enabled, muted). Does not clear intro-played flag. */
  restoreDefaults() {
    this.setVolume(0.8);
    this.setEnabled(true);
    this.unmute();
  }
}

export const barkVoice = new BarkVoiceManagerImpl();

// Expose for debugging in the console (dev-only nicety).
if (typeof window !== "undefined") {
  (window as unknown as { barkVoice?: BarkVoiceManagerImpl }).barkVoice = barkVoice;
}
