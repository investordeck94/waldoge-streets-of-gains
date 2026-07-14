// Tiny pub/sub for Bark Zero avatar state, kept out of React tree so any panel
// (chat, TTS, etc.) can drive the avatar without prop-drilling.
import { useEffect, useState } from "react";
import type { BarkZeroAvatarState } from "./BarkZeroAvatar";

type Listener = (s: { state: BarkZeroAvatarState; signalTick: number; amplitude: number }) => void;

const store = {
  state: "idle" as BarkZeroAvatarState,
  signalTick: 0,
  amplitude: 0,
  listeners: new Set<Listener>(),
  emit() {
    const snap = { state: this.state, signalTick: this.signalTick, amplitude: this.amplitude };
    this.listeners.forEach((l) => l(snap));
  },
};

export const barkAvatar = {
  setState(s: BarkZeroAvatarState) {
    if (store.state === s) return;
    store.state = s;
    store.emit();
  },
  pulseSignal() {
    store.signalTick += 1;
    store.emit();
  },
  setAmplitude(a: number) {
    store.amplitude = a;
    store.emit();
  },
};

export function useBarkAvatar() {
  const [snap, setSnap] = useState({
    state: store.state,
    signalTick: store.signalTick,
    amplitude: store.amplitude,
  });
  useEffect(() => {
    const l: Listener = (s) => setSnap(s);
    store.listeners.add(l);
    return () => { store.listeners.delete(l); };
  }, []);
  return snap;
}
