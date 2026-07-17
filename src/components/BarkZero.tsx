import { FC, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ownerSecretHeader } from "@/lib/ownerSecret";
import {
  MessageSquare,
  Radar,
  FlaskConical,
  Image as ImageIcon,
  Palette,
  Wallet,
  TrendingUp,
  BookOpen,
  Settings as SettingsIcon,
  Send,
  Sparkles,
  Loader2,
  Twitter,
  Brain,
  ShieldCheck,
  Compass,
  NotebookPen,
  Moon,
  Library,
  History,
  Volume2,
} from "lucide-react";
import { barkVoice } from "@/lib/BarkVoiceManager";
import { VoiceSettingsPanel } from "./bark-zero/VoiceSettingsPanel";
import { cn } from "@/lib/utils";
import { BarkZeroAvatar } from "./bark-zero/BarkZeroAvatar";
import { barkAvatar, useBarkAvatar } from "./bark-zero/avatarStore";

const BarkZeroAvatarHero: FC = () => {
  const { state, signalTick, amplitude } = useBarkAvatar();
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (signalTick === 0) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 50);
    return () => window.clearTimeout(t);
  }, [signalTick]);
  return <BarkZeroAvatar state={state} amplitude={amplitude} signal={pulse} />;
};
import { LaunchLabPanel } from "./bark-zero/LaunchLabPanel";
import { XStudioPanel } from "./bark-zero/XStudioPanel";
import { ConstitutionPanel } from "./bark-zero/ConstitutionPanel";
import { MemoryPanel } from "./bark-zero/MemoryPanel";
import { KnowledgePanel } from "./bark-zero/KnowledgePanel";
import { CreativityPanel } from "./bark-zero/CreativityPanel";
import { CuriosityPanel } from "./bark-zero/CuriosityPanel";
import { DiaryPanel } from "./bark-zero/DiaryPanel";
import { DreamsPanel } from "./bark-zero/DreamsPanel";
import { EvolutionPanel } from "./bark-zero/EvolutionPanel";
import { LaunchHistoryPanel } from "./bark-zero/LaunchHistoryPanel";
import { MarketIntelPanel } from "./bark-zero/MarketIntelPanel";
// VoiceControls (ElevenLabs per-message TTS) intentionally not imported — replaced by BarkVoiceManager.


type ChatMessage = { role: "user" | "assistant"; content: string };
const BARK_ZERO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-chat`;

type ToolId =
  | "chat"
  | "xstudio"
  | "constitution"
  | "memory"
  | "knowledge"
  | "creativity"
  | "curiosity"
  | "diary"
  | "dreams"
  | "evolution"
  | "attention"
  | "launchlab"
  | "launchhistory"
  | "marketintel"

  | "meme"
  | "art"
  | "wallet"
  | "xtrend"
  | "narrative"
  | "voice"
  | "settings";

const tools: { id: ToolId; label: string; icon: typeof MessageSquare; desc: string }[] = [
  { id: "chat", label: "AI Chat", icon: MessageSquare, desc: "Talk to Bark Zero" },
  { id: "constitution", label: "Constitution", icon: ShieldCheck, desc: "Bark Zero's permanent principles" },
  { id: "memory", label: "Memory", icon: Brain, desc: "Long-term context Bark Zero remembers" },
  { id: "knowledge", label: "Knowledge", icon: Library, desc: "Facts, history & lore Bark Zero knows" },
  { id: "creativity", label: "Creativity Engine", icon: Sparkles, desc: "Daily creative sparks — memes, jokes, concepts" },
  { id: "curiosity", label: "Curiosity Engine", icon: Compass, desc: "What Bark Zero wonders about" },
  { id: "diary", label: "Bark's Diary", icon: NotebookPen, desc: "Daily inner monologue" },
  { id: "dreams", label: "Dream Mode", icon: Moon, desc: "Idle creative dreams & connections" },
  { id: "evolution", label: "Evolution", icon: TrendingUp, desc: "Lessons that refine Bark Zero's voice" },
  { id: "xstudio", label: "X Studio", icon: Twitter, desc: "Draft, approve & publish to X" },
  { id: "attention", label: "Attention Scanner", icon: Radar, desc: "Track what the market is watching" },
  { id: "marketintel", label: "Market Intel", icon: TrendingUp, desc: "Bark's continuous ranking of AI, DogeOS, Anoncoin, memes & X" },
  { id: "launchlab", label: "Launch Lab", icon: FlaskConical, desc: "Design a token launch" },
  { id: "launchhistory", label: "Launch History", icon: History, desc: "Every proposal Bark Zero has drafted" },

  { id: "meme", label: "Meme Generator", icon: ImageIcon, desc: "Instant meme fuel" },
  { id: "art", label: "Art Studio", icon: Palette, desc: "Generate on-brand visuals" },
  { id: "wallet", label: "Smart Wallet Scanner", icon: Wallet, desc: "Follow the smart money" },
  { id: "xtrend", label: "X Trend Scanner", icon: TrendingUp, desc: "What's spiking on X" },
  { id: "narrative", label: "Narrative Scanner", icon: BookOpen, desc: "Emerging crypto narratives" },
  { id: "voice", label: "Voice", icon: Volume2, desc: "Bark Zero voice pack & playback" },
  { id: "settings", label: "Settings", icon: SettingsIcon, desc: "Terminal preferences" },
];


const suggestedPrompts = [
  "What's the strongest narrative in crypto right now?",
  "Break down $WALDOGE like I'm new to Solana.",
  "Draft a viral meme concept about hidden gems.",
  "Give me 3 wallets worth stalking this week.",
];

// ————————————————————————————————————————————————————————————————
// Chat panel — reuses existing streaming chat endpoint
// ————————————————————————————————————————————————————————————————
const ChatPanel: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const cancelStream = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    barkAvatar.setState("idle");
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    barkAvatar.setState("thinking");

    // Add empty assistant placeholder we'll append to
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    const appendDelta = (delta: string) => {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: last.content + delta };
        }
        return copy;
      });
    };

    const setError = (err: string) => {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          copy[copy.length - 1] = { ...last, content: `⚠ ${err}` };
        }
        return copy;
      });
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(BARK_ZERO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...ownerSecretHeader()
        },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errBody = await res.text().catch(() => "");
        setError(errBody || `Request failed (${res.status})`);
        setStreaming(false);
        barkAvatar.setState("idle");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) appendDelta(delta);
          } catch {
            /* ignore partial chunks */
          }
        }
      }
      setStreaming(false);
      barkAvatar.setState("idle");
      // "Signal Detected" — insightful reply heuristic
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last?.role === "assistant") {
          const c = last.content;
          if (c.length > 240 || /\b(signal|alpha|narrative|thesis|conviction)\b/i.test(c)) {
            barkAvatar.pulseSignal();
          }
        }
        return m;
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") { barkAvatar.setState("idle"); return; }
      setError((err as Error).message || "Connection lost");
      setStreaming(false);
      barkAvatar.setState("idle");
    }
  };

  return (
    <div className="flex flex-col h-[70vh] rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neon/20 bg-black/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon shadow-[0_0_10px_hsl(var(--neon))] animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em] text-neon font-mono">bark_zero // online</span>
        </div>
        <span className="text-xs text-white/40 font-mono">model: waldoge-core</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-6">
            <p className="text-white/60 font-mono text-sm">
              &gt; awaiting input_
            </p>
            <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left text-sm px-4 py-3 rounded-lg border border-neon/20 bg-neon/5 text-white/80 hover:border-neon/60 hover:bg-neon/10 hover:text-white transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          const isLast = i === messages.length - 1;
          const isStreamingThis = streaming && isLast && isAssistant;
          const canSpeak = isAssistant && !!m.content && !m.content.startsWith("⚠") && !isStreamingThis;
          return (
            <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-neon text-black font-medium"
                    : "bg-white/[0.03] border border-neon/15 text-white/90"
                )}
              >
                {m.content || (isStreamingThis ? "▍" : "")}
              </div>
              {/* Voice deliberately does NOT play after every chat response — the OS-style
                  BarkVoiceManager only speaks on meaningful state changes. */}
              {void canSpeak}
            </div>
          );
        })}
      </div>

      <div className="border-t border-neon/20 bg-black/70 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="> ask bark zero anything..."
            className="flex-1 resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 font-mono"
          />
          {streaming ? (
            <button
              onClick={cancelStream}
              className="px-4 py-3 rounded-lg border border-neon/40 text-neon hover:bg-neon/10 transition-colors"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </button>
          ) : (
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="px-4 py-3 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Placeholder tool panel
// ————————————————————————————————————————————————————————————————
const ComingSoonPanel: FC<{ label: string; desc: string; icon: typeof MessageSquare }> = ({
  label,
  desc,
  icon: Icon,
}) => (
  <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-10 min-h-[70vh] flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 rounded-2xl border border-neon/40 bg-neon/5 flex items-center justify-center mb-6 shadow-[0_0_40px_hsl(var(--neon)/0.25)]">
      <Icon className="w-9 h-9 text-neon" />
    </div>
    <h3 className="font-mono text-2xl text-white mb-2 tracking-wide">{label}</h3>
    <p className="text-white/50 max-w-md mb-6">{desc}</p>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/5 text-neon text-xs font-mono uppercase tracking-widest">
      <Sparkles className="w-3.5 h-3.5" /> Booting soon
    </div>
  </div>
);

// ————————————————————————————————————————————————————————————————
// Main Bark Zero surface
// ————————————————————————————————————————————————————————————————
export const BarkZero: FC = () => {
  const [active, setActive] = useState<ToolId>("chat");
  const activeTool = tools.find((t) => t.id === active)!;
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return (localStorage.getItem("bark_zero_owner_secret") ?? "").length > 0; } catch { return false; }
  });
  const [secretInput, setSecretInput] = useState("");

  useEffect(() => {
    const onNav = (e: Event) => {
      const detail = (e as CustomEvent<{ tool?: ToolId }>).detail;
      if (detail?.tool && tools.some((t) => t.id === detail.tool)) setActive(detail.tool);
    };
    window.addEventListener("barkZero:navigate", onNav);
    return () => window.removeEventListener("barkZero:navigate", onNav);
  }, []);

  // ————— Bark Voice: OS-style startup sequence —————
  useEffect(() => {
    if (!unlocked) return;
    barkVoice.preload();
    // First visit → intro (once ever). Then boot. Then contextual greeting.
    const introKey = "bark_voice_intro_played";
    const isFirst = (() => { try { return localStorage.getItem("bark_voice_once:" + introKey) !== "1"; } catch { return false; } })();
    const run = async () => {
      if (isFirst) await barkVoice.play("bark-intro");
      await barkVoice.play("boot-complete");
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) await barkVoice.play("good-morning");
      else await barkVoice.play("welcome-back");
    };
    // Autoplay policies require a user gesture. Try immediately; if blocked,
    // arm a one-shot pointerdown listener that fires the sequence.
    void run();
    const armed = () => { void run(); window.removeEventListener("pointerdown", armed); };
    window.addEventListener("pointerdown", armed, { once: true });
    return () => {
      window.removeEventListener("pointerdown", armed);
      void barkVoice.play("signing-off");
    };
  }, [unlocked]);


  if (!unlocked) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[hsl(145,100%,55%)]/30 bg-black/70 p-8 space-y-4">
          <div className="flex items-center gap-2 text-[hsl(145,100%,55%)]">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-mono text-lg tracking-widest uppercase">Owner Access Required</h2>
          </div>
          <p className="text-white/60 text-sm">
            Bark Zero admin tools call paid AI, launch real tokens, and post from the official X account.
            Enter the owner secret to unlock. It is stored only in this browser.
          </p>
          <input
            type="password"
            autoFocus
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && secretInput.trim()) {
                try { localStorage.setItem("bark_zero_owner_secret", secretInput.trim()); } catch {}
                setUnlocked(true);
              }
            }}
            placeholder="owner secret"
            className="w-full bg-black/60 border border-white/20 focus:border-[hsl(145,100%,55%)]/60 focus:outline-none rounded-lg px-4 py-3 text-sm text-white font-mono"
          />
          <button
            onClick={() => {
              if (!secretInput.trim()) return;
              try { localStorage.setItem("bark_zero_owner_secret", secretInput.trim()); } catch {}
              setUnlocked(true);
            }}
            className="w-full px-4 py-3 rounded-lg bg-[hsl(145,100%,55%)] text-black font-mono uppercase text-xs tracking-widest hover:opacity-90"
          >
            Unlock Bark Zero
          </button>
          <p className="text-white/40 text-xs">
            Wrong secret? Every request will return 401 until it matches the server value.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="bark-zero -mx-2 sm:-mx-4 -my-3 sm:-my-6 min-h-[calc(100vh-8rem)] bg-black text-white">
      <style>{`
        .bark-zero { --neon: 145 100% 55%; }
        .bark-zero .text-neon { color: hsl(var(--neon)); }
        .bark-zero .bg-neon { background-color: hsl(var(--neon)); }
        .bark-zero .border-neon\\/20 { border-color: hsl(var(--neon) / 0.2); }
        .bark-zero .border-neon\\/25 { border-color: hsl(var(--neon) / 0.25); }
        .bark-zero .border-neon\\/30 { border-color: hsl(var(--neon) / 0.3); }
        .bark-zero .border-neon\\/40 { border-color: hsl(var(--neon) / 0.4); }
        .bark-zero .border-neon\\/60 { border-color: hsl(var(--neon) / 0.6); }
        .bark-zero .bg-neon\\/5 { background-color: hsl(var(--neon) / 0.05); }
        .bark-zero .bg-neon\\/10 { background-color: hsl(var(--neon) / 0.1); }
        .bark-zero .hover\\:bg-neon\\/10:hover { background-color: hsl(var(--neon) / 0.1); }
        .bark-zero .hover\\:bg-neon\\/80:hover { background-color: hsl(var(--neon) / 0.8); }
        .bark-zero .hover\\:border-neon\\/60:hover { border-color: hsl(var(--neon) / 0.6); }
        .bark-zero .bg-grid {
          background-image:
            linear-gradient(hsl(var(--neon) / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--neon) / 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="relative overflow-x-hidden [&_*]:break-words [&_pre]:whitespace-pre-wrap [&_textarea]:max-w-full">
        {/* subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--neon)/0.12),_transparent_60%)] pointer-events-none" />

        <div className="relative container mx-auto px-4 py-8">
          {/* Hero — reactive AI avatar */}
          <div className="text-center mb-8">
            <BarkZeroAvatarHero />
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-neon mt-4">
              Powered by $WALDOGE
            </p>
            <p className="mt-3 text-white/70 italic">"Respect the craft."</p>
          </div>


          <div className="grid lg:grid-cols-[280px,minmax(0,1fr)] gap-6 min-w-0">
            {/* Sidebar tools */}
            <aside className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-2 h-fit lg:sticky lg:top-24 min-w-0">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.25em] text-neon/70">
                Modules
              </div>
              <div className="flex lg:flex-col gap-1 overflow-x-auto custom-scrollbar">
                {tools.map((t) => {
                  const Icon = t.icon;
                  const isActive = t.id === active;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActive(t.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all whitespace-nowrap text-left w-full",
                        isActive
                          ? "bg-neon/10 text-neon border border-neon/40 shadow-[0_0_20px_hsl(var(--neon)/0.15)]"
                          : "text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Active panel */}
            <div className="min-w-0 max-w-full overflow-x-hidden">

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {active === "chat" ? (
                    <ChatPanel />
                  ) : active === "constitution" ? (
                    <ConstitutionPanel />
                  ) : active === "memory" ? (
                    <MemoryPanel />
                  ) : active === "knowledge" ? (
                    <KnowledgePanel />
                  ) : active === "creativity" ? (
                    <CreativityPanel />
                  ) : active === "curiosity" ? (
                    <CuriosityPanel />
                  ) : active === "diary" ? (
                    <DiaryPanel />
                  ) : active === "dreams" ? (
                    <DreamsPanel />
                  ) : active === "evolution" ? (
                    <EvolutionPanel />
                  ) : active === "xstudio" ? (
                    <XStudioPanel />
                  ) : active === "launchlab" ? (
                    <LaunchLabPanel />
                  ) : active === "launchhistory" ? (
                    <LaunchHistoryPanel />
                  ) : active === "marketintel" ? (
                    <MarketIntelPanel />

                  ) : (
                    <ComingSoonPanel
                      label={activeTool.label}
                      desc={activeTool.desc}
                      icon={activeTool.icon}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
