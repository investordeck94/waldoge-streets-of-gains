import { FC } from "react";
import { Play, Pause, Square, Volume2, VolumeX, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBarkVoice } from "@/hooks/useBarkVoice";

interface VoiceControlsProps {
  text: string;
  autoPlay: boolean;
}

const Waveform: FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-end gap-[2px] h-4 w-8" aria-hidden>
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={cn(
          "w-[3px] rounded-sm bg-neon/80",
          active ? "animate-[bark-wave_0.9s_ease-in-out_infinite]" : "h-1 opacity-40",
        )}
        style={active ? { animationDelay: `${i * 0.12}s` } : undefined}
      />
    ))}
  </div>
);

export const VoiceControls: FC<VoiceControlsProps> = ({ text, autoPlay }) => {
  const v = useBarkVoice(text, autoPlay);
  const playing = v.status === "playing";
  const paused = v.status === "paused";
  const loading = v.status === "loading";
  const unavailable = v.status === "unavailable";

  if (unavailable) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 font-mono">
        <AlertTriangle className="w-3 h-3" />
        voice temporarily unavailable
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-white/70">
      <button
        type="button"
        onClick={playing ? v.pause : v.play}
        disabled={loading}
        className="p-1.5 rounded-md border border-neon/20 hover:border-neon/60 hover:text-neon transition-colors disabled:opacity-50"
        aria-label={playing ? "Pause voice" : paused ? "Resume voice" : "Play voice"}
        title={playing ? "Pause" : paused ? "Resume" : "Play"}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={v.stop}
        disabled={!playing && !paused}
        className="p-1.5 rounded-md border border-neon/20 hover:border-neon/60 hover:text-neon transition-colors disabled:opacity-30"
        aria-label="Stop voice"
        title="Stop"
      >
        <Square className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => v.setMuted(!v.muted)}
        className="p-1.5 rounded-md border border-neon/20 hover:border-neon/60 hover:text-neon transition-colors"
        aria-label={v.muted ? "Unmute" : "Mute"}
        title={v.muted ? "Unmute" : "Mute"}
      >
        {v.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={v.volume}
        onChange={(e) => v.setVolume(Number(e.target.value))}
        className="w-16 accent-neon"
        aria-label="Volume"
      />
      <Waveform active={playing && v.isActive} />
      {v.error && !unavailable && (
        <span className="text-[10px] font-mono text-white/40 truncate max-w-[140px]" title={v.error}>
          {v.error}
        </span>
      )}
    </div>
  );
};
