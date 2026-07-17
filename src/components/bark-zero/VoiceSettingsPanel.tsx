import { FC, useEffect, useState } from "react";
import { Play, Volume2, VolumeX, RotateCcw, PlayCircle, ListMusic, AlertTriangle, CheckCircle2 } from "lucide-react";
import { barkVoice, type BarkVoiceState } from "@/lib/BarkVoiceManager";
import { BARK_VOICE_CONFIG, type BarkVoiceCategory } from "@/lib/barkVoiceConfig";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<BarkVoiceCategory, string> = {
  startup: "Startup",
  thinking: "AI Thinking",
  launchlab: "Launch Lab",
  xstudio: "X Studio",
  memory: "Memory",
  monitoring: "Monitoring",
  general: "General",
  closing: "Closing",
};

export const VoiceSettingsPanel: FC = () => {
  const [state, setState] = useState<BarkVoiceState>(barkVoice.state);
  useEffect(() => barkVoice.subscribe(setState), []);

  const grouped = BARK_VOICE_CONFIG.reduce<Record<string, typeof BARK_VOICE_CONFIG>>((acc, e) => {
    (acc[e.category] ||= []).push(e);
    return acc;
  }, {});

  const testAll = async () => {
    for (const e of BARK_VOICE_CONFIG) {
      await barkVoice.play(e.id, { force: true });
      await new Promise((r) => setTimeout(r, 250));
      // wait until it finishes
      await new Promise<void>((resolve) => {
        const check = () => {
          if (barkVoice.state.currentId !== e.id) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-mono text-xl text-neon tracking-wide flex items-center gap-2">
            <ListMusic className="w-5 h-5" /> Voice · Bark Zero
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Central audio system. Every module routes through <code className="text-neon">barkVoice</code>.
          </p>
        </div>
        <div className="text-xs font-mono text-white/50 flex items-center gap-2">
          {state.missing.length === 0 && state.ready === state.total ? (
            <span className="text-neon flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {state.ready}/{state.total} loaded</span>
          ) : state.missing.length > 0 ? (
            <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {state.missing.length} missing</span>
          ) : (
            <span>{state.ready}/{state.total} loaded…</span>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neon/20 bg-black/50 p-4 space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span className="text-white/80">Voice enabled</span>
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => barkVoice.setEnabled(e.target.checked)}
              className="accent-[hsl(145,100%,55%)] w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-white/80">Muted</span>
            <button
              onClick={() => barkVoice.toggleMute()}
              className="text-neon hover:opacity-80"
              aria-label={state.muted ? "Unmute" : "Mute"}
            >
              {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </label>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/80">Volume</span>
              <span className="text-white/50 font-mono text-xs">{Math.round(state.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.volume}
              onChange={(e) => barkVoice.setVolume(parseFloat(e.target.value))}
              className="w-full accent-[hsl(145,100%,55%)]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-neon/20 bg-black/50 p-4 space-y-2">
          <button
            onClick={() => barkVoice.replayIntro()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neon/40 bg-neon/10 text-neon font-mono text-xs uppercase tracking-widest hover:bg-neon/20"
          >
            <PlayCircle className="w-4 h-4" /> Replay Bark Intro
          </button>
          <button
            onClick={testAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 bg-white/[0.03] text-white/80 font-mono text-xs uppercase tracking-widest hover:bg-white/[0.06]"
          >
            <Play className="w-4 h-4" /> Test All Voices
          </button>
          <button
            onClick={() => barkVoice.restoreDefaults()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/15 text-white/70 font-mono text-xs uppercase tracking-widest hover:bg-white/[0.04]"
          >
            <RotateCcw className="w-4 h-4" /> Restore Defaults
          </button>
        </div>
      </div>

      {/* Individual previews */}
      <div className="space-y-5">
        {(Object.keys(grouped) as BarkVoiceCategory[]).map((cat) => (
          <div key={cat}>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/70 mb-2">
              {CATEGORY_LABEL[cat]}
            </div>
            <div className="grid gap-1.5">
              {grouped[cat].map((entry) => {
                const isMissing = state.missing.includes(entry.id);
                const isPlaying = state.currentId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                      isMissing ? "border-red-500/40 bg-red-500/5" :
                      isPlaying ? "border-neon/60 bg-neon/10" :
                      "border-white/10 bg-white/[0.02]",
                    )}
                  >
                    <button
                      onClick={() => barkVoice.play(entry.id, { force: true })}
                      disabled={isMissing}
                      className="shrink-0 w-8 h-8 rounded-md border border-neon/40 bg-black/60 text-neon flex items-center justify-center hover:bg-neon/10 disabled:opacity-30"
                      aria-label={`Preview ${entry.phrase}`}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-white/90 truncate">"{entry.phrase}"</div>
                      <div className="text-white/40 text-xs font-mono truncate">{entry.id} · {entry.description}</div>
                    </div>
                    {isMissing && <span className="text-red-400 text-xs font-mono">missing</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
