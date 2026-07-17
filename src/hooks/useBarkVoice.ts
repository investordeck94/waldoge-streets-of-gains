import { useCallback, useEffect, useRef, useState } from "react";
import { ownerSecretHeader } from "@/lib/ownerSecret";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-tts`;

type VoiceStatus = "idle" | "loading" | "playing" | "paused" | "error" | "unavailable";

// Simple in-memory cache — replaying does not regenerate speech.
const audioCache = new Map<string, string>(); // key -> object URL

const hashKey = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${text.length}:${h}`;
};

// Shared player so only one message speaks at a time.
let currentAudio: HTMLAudioElement | null = null;
let currentOwner: symbol | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

let globalMuted = false;
let globalVolume = 1;
export const getGlobalMuted = () => globalMuted;
export const setGlobalMuted = (m: boolean) => {
  globalMuted = m;
  if (currentAudio) currentAudio.muted = m;
  notify();
};
export const getGlobalVolume = () => globalVolume;
export const setGlobalVolume = (v: number) => {
  globalVolume = Math.max(0, Math.min(1, v));
  if (currentAudio) currentAudio.volume = globalVolume;
  notify();
};
export const stopGlobalAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = null;
  currentOwner = null;
  notify();
};

export function useBarkVoice(text: string, autoPlay: boolean) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMutedState] = useState(globalMuted);
  const [volume, setVolumeState] = useState(globalVolume);
  const ownerRef = useRef<symbol>(Symbol("bark-voice"));
  const autoPlayedRef = useRef(false);
  const key = hashKey(text || "");

  useEffect(() => {
    const l = () => {
      setMutedState(globalMuted);
      setVolumeState(globalVolume);
      if (currentOwner !== ownerRef.current && (status === "playing" || status === "paused")) {
        setStatus("idle");
      }
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [status]);

  const ensureAudioUrl = useCallback(async (): Promise<string> => {
    const cached = audioCache.get(key);
    if (cached) return cached;
    setStatus("loading");
    setError(null);
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        ...ownerSecretHeader(),
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      let detail = `Voice request failed (${res.status})`;
      try {
        const j = await res.json();
        if (j?.detail) detail = j.detail;
        else if (j?.error) detail = j.error;
      } catch {
        /* ignore */
      }
      if (res.status === 503) {
        setStatus("unavailable");
      } else {
        setStatus("error");
      }
      throw new Error(detail);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioCache.set(key, url);
    return url;
  }, [key, text]);

  const play = useCallback(async () => {
    if (!text?.trim()) return;
    try {
      // Steal playback from any other message.
      if (currentAudio && currentOwner !== ownerRef.current) {
        currentAudio.pause();
        currentAudio = null;
      }
      const url = await ensureAudioUrl();
      let audio = currentOwner === ownerRef.current ? currentAudio : null;
      if (!audio) {
        audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = globalVolume;
        audio.muted = globalMuted;
        audio.addEventListener("ended", () => {
          if (currentOwner === ownerRef.current) {
            currentAudio = null;
            currentOwner = null;
          }
          setStatus("idle");
        });
        audio.addEventListener("pause", () => {
          if (currentOwner === ownerRef.current && !audio!.ended) {
            if (audio!.currentTime > 0) setStatus((s) => (s === "playing" ? "paused" : s));
          }
        });
        currentAudio = audio;
        currentOwner = ownerRef.current;
      }
      await audio.play();
      setStatus("playing");
      notify();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      // Autoplay policy: keep status idle so user can tap the play button.
      if (msg.toLowerCase().includes("play")) setStatus("idle");
    }
  }, [ensureAudioUrl, text]);

  const pause = useCallback(() => {
    if (currentOwner === ownerRef.current && currentAudio) {
      currentAudio.pause();
      setStatus("paused");
    }
  }, []);

  const stop = useCallback(() => {
    if (currentOwner === ownerRef.current && currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      currentOwner = null;
    }
    setStatus("idle");
    notify();
  }, []);

  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current || !text?.trim()) return;
    autoPlayedRef.current = true;
    void play();
  }, [autoPlay, text, play]);

  return {
    status,
    error,
    muted,
    volume,
    play,
    pause,
    stop,
    setMuted: setGlobalMuted,
    setVolume: setGlobalVolume,
    isActive: currentOwner === ownerRef.current,
  };
}
