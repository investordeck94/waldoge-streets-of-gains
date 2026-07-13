import { FC, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Twitter, Loader2, Sparkles, CheckCircle2, PencilLine, XCircle, Trash2,
  Send, Clock, Pause, Power, ShieldAlert, TrendingUp, MessageSquare,
  BarChart3, Radar, Save, Calendar, Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-x-generate`;
const PUB_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-x-publish`;

// ————————————————————————————————————————————————————————————————
// Types & storage
// ————————————————————————————————————————————————————————————————
type PostKind = "tweet" | "thread" | "reply";
type DraftStatus = "draft" | "approved" | "scheduled" | "published" | "rejected";

interface Draft {
  id: string;
  kind: PostKind;
  brief: string;
  replyingTo?: string;
  text?: string;
  posts?: string[];
  rationale?: string;
  status: DraftStatus;
  createdAt: number;
  scheduledFor?: number;
  publishedIds?: string[];
}

interface XSettings {
  manualMode: boolean;      // if true, nothing publishes without approval
  trustedMode: boolean;     // if true + manualMode off, approved drafts auto-publish
  trustedKinds: PostKind[]; // kinds allowed for trusted auto-publish
  postingPaused: boolean;   // hard stop
  postingDisabled: boolean; // full kill switch
}

const DRAFTS_KEY = "bz.x.drafts.v1";
const SETTINGS_KEY = "bz.x.settings.v1";
const ANALYTICS_KEY = "bz.x.analytics.v1";

const defaultSettings: XSettings = {
  manualMode: true,
  trustedMode: false,
  trustedKinds: ["reply"],
  postingPaused: false,
  postingDisabled: false,
};

function loadDrafts(): Draft[] {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]"); } catch { return []; }
}
function saveDrafts(d: Draft[]) { localStorage.setItem(DRAFTS_KEY, JSON.stringify(d)); }
function loadSettings(): XSettings {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") }; }
  catch { return defaultSettings; }
}
function saveSettings(s: XSettings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

// ————————————————————————————————————————————————————————————————
// Placeholder analytics (until X API is wired for reads)
// ————————————————————————————————————————————————————————————————
interface MockAnalytics {
  followers: number; likes: number; replies: number; reposts: number;
  engagement: number; growth: number;
  best: { text: string; likes: number; reposts: number }[];
  trending: string[];
}
function loadAnalytics(): MockAnalytics {
  try {
    const cached = localStorage.getItem(ANALYTICS_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  const mock: MockAnalytics = {
    followers: 0, likes: 0, replies: 0, reposts: 0,
    engagement: 0, growth: 0,
    best: [], trending: [
      "AI x meme narrative resurging on Solana",
      "Dogecoin community response to spot ETF rumours",
      "Attention scanners becoming a new alpha primitive",
    ],
  };
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(mock));
  return mock;
}

// ————————————————————————————————————————————————————————————————
// Sub components
// ————————————————————————————————————————————————————————————————
const Pill: FC<{ tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }> = ({ tone = "neutral", children }) => {
  const map = {
    neutral: "border-white/20 text-white/60 bg-white/[0.03]",
    good: "border-green-400/40 text-green-300 bg-green-500/10",
    warn: "border-yellow-400/40 text-yellow-200 bg-yellow-500/10",
    bad: "border-red-400/40 text-red-300 bg-red-500/10",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-widest", map[tone])}>
      {children}
    </span>
  );
};

const StatCard: FC<{ label: string; value: string | number; icon: typeof TrendingUp; hint?: string }> = ({ label, value, icon: Icon, hint }) => (
  <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</span>
      <Icon className="w-4 h-4 text-neon/80" />
    </div>
    <div className="text-2xl font-mono text-white">{value}</div>
    {hint && <div className="text-[10px] text-white/40 mt-1 font-mono">{hint}</div>}
  </div>
);

// ————————————————————————————————————————————————————————————————
// Compose tab
// ————————————————————————————————————————————————————————————————
const ComposeTab: FC<{ onSaveDraft: (d: Draft) => void }> = ({ onSaveDraft }) => {
  const [kind, setKind] = useState<PostKind>("tweet");
  const [brief, setBrief] = useState("");
  const [replyingTo, setReplyingTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!brief.trim() || generating) return;
    setError(null); setGenerating(true); setPreview(null);
    try {
      const res = await fetch(GEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ kind, brief, replyingTo: kind === "reply" ? replyingTo : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Request failed (${res.status})`); return; }
      const d: Draft = {
        id: crypto.randomUUID(),
        kind,
        brief,
        replyingTo: kind === "reply" ? replyingTo : undefined,
        text: data.draft?.text,
        posts: data.draft?.posts,
        rationale: data.draft?.rationale,
        status: "draft",
        createdAt: Date.now(),
      };
      setPreview(d);
    } catch (e) {
      setError((e as Error).message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const editText = (v: string) => preview && setPreview({ ...preview, text: v });
  const editPost = (i: number, v: string) => {
    if (!preview?.posts) return;
    const posts = [...preview.posts]; posts[i] = v;
    setPreview({ ...preview, posts });
  };

  const save = () => {
    if (!preview) return;
    onSaveDraft(preview);
    toast.success("Draft saved");
    setPreview(null);
    setBrief("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          {(["tweet", "thread", "reply"] as PostKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-all border",
                kind === k
                  ? "bg-neon/15 text-neon border-neon/50 shadow-[0_0_15px_hsl(var(--neon)/0.2)]"
                  : "border-white/10 text-white/60 hover:text-white",
              )}
            >
              {k}
            </button>
          ))}
        </div>

        <label className="block text-[10px] font-mono uppercase tracking-widest text-neon/80 mb-2">Brief</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder="> what should Bark Zero post about?"
          className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 font-mono"
        />

        {kind === "reply" && (
          <>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-neon/80 mt-3 mb-2">
              Replying to (paste tweet text)
            </label>
            <textarea
              value={replyingTo}
              onChange={(e) => setReplyingTo(e.target.value)}
              rows={2}
              className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-4 py-3 text-sm text-white font-mono"
            />
          </>
        )}

        {error && <div className="mt-3 text-xs text-red-400 font-mono">⚠ {error}</div>}

        <button
          onClick={generate}
          disabled={generating || !brief.trim()}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 disabled:opacity-40 transition-colors"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting...</> : <><Sparkles className="w-4 h-4" /> Generate Draft</>}
        </button>
      </div>

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-neon/30 bg-black/60 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-neon" />
              <span className="text-xs font-mono uppercase tracking-widest text-white/60">Preview · editable</span>
            </div>
            <Pill tone="warn">Draft</Pill>
          </div>

          {preview.kind === "thread" ? (
            <div className="space-y-2">
              {(preview.posts ?? []).map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-[10px] font-mono text-neon/60 mt-3">{i + 1}/{preview.posts?.length}</span>
                  <textarea
                    value={p}
                    onChange={(e) => editPost(i, e.target.value)}
                    rows={2}
                    className="flex-1 resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                  <span className={cn("text-[10px] font-mono mt-3", p.length > 275 ? "text-red-400" : "text-white/40")}>
                    {p.length}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 items-start">
              <textarea
                value={preview.text ?? ""}
                onChange={(e) => editText(e.target.value)}
                rows={4}
                className="flex-1 resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
              <span className={cn("text-[10px] font-mono mt-3", (preview.text?.length ?? 0) > 275 ? "text-red-400" : "text-white/40")}>
                {preview.text?.length ?? 0}
              </span>
            </div>
          )}

          {preview.rationale && (
            <div className="text-xs text-white/50 italic font-mono">Why: {preview.rationale}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black text-sm font-semibold hover:bg-neon/80 transition-colors">
              <Save className="w-4 h-4" /> Save to Drafts
            </button>
            <button onClick={() => setPreview(null)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-white/70 text-sm hover:bg-white/[0.03]">
              Discard
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Drafts tab (review / approve / edit / reject / delete / schedule / publish)
// ————————————————————————————————————————————————————————————————
const DraftsTab: FC<{
  drafts: Draft[];
  setDrafts: (d: Draft[]) => void;
  settings: XSettings;
}> = ({ drafts, setDrafts, settings }) => {
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const remove = (id: string) => setDrafts(drafts.filter((d) => d.id !== id));

  const canPublish = !settings.postingDisabled && !settings.postingPaused;

  const publish = async (d: Draft) => {
    if (!canPublish) { toast.error("Posting is paused or disabled"); return; }
    setPublishingId(d.id);
    try {
      const res = await fetch(PUB_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ kind: d.kind, text: d.text, posts: d.posts }),
      });
      const data = await res.json();
      if (data.status === "not_connected") {
        toast.error("Bark Zero's X account isn't connected yet");
        update(d.id, { status: "approved" });
        return;
      }
      if (data.status === "published") {
        toast.success("Published to X");
        update(d.id, { status: "published", publishedIds: data.ids });
        return;
      }
      toast.error(data.error || "Publish failed");
    } catch (e) {
      toast.error((e as Error).message || "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  const scheduleFor = (d: Draft, when: string) => {
    const ts = new Date(when).getTime();
    if (Number.isNaN(ts)) { toast.error("Invalid schedule"); return; }
    update(d.id, { status: "scheduled", scheduledFor: ts });
    toast.success("Draft scheduled (owner must publish at that time — no autoposter yet)");
  };

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-neon/20 bg-black/50 p-10 text-center">
        <PencilLine className="w-10 h-10 text-neon/60 mx-auto mb-3" />
        <p className="text-white/60 font-mono text-sm">No drafts yet. Head to Compose to generate one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((d) => {
        const isThread = d.kind === "thread";
        const statusTone: Record<DraftStatus, "neutral" | "good" | "warn" | "bad"> = {
          draft: "warn", approved: "good", scheduled: "neutral", published: "good", rejected: "bad",
        };
        return (
          <div key={d.id} className="rounded-xl border border-neon/20 bg-black/50 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Pill>{d.kind}</Pill>
                <Pill tone={statusTone[d.status]}>{d.status}</Pill>
                {d.scheduledFor && (
                  <Pill><Clock className="w-3 h-3" /> {new Date(d.scheduledFor).toLocaleString()}</Pill>
                )}
              </div>
              <span className="text-[10px] text-white/40 font-mono">{new Date(d.createdAt).toLocaleString()}</span>
            </div>

            {isThread ? (
              <ol className="list-decimal ml-5 space-y-1 text-sm text-white/85">
                {(d.posts ?? []).map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            ) : (
              <p className="text-sm text-white/85 whitespace-pre-wrap">{d.text}</p>
            )}

            {d.rationale && <p className="text-xs text-white/40 italic">Why: {d.rationale}</p>}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {d.status !== "approved" && d.status !== "published" && (
                <button
                  onClick={() => update(d.id, { status: "approved" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-400/40 text-green-300 text-xs hover:bg-green-500/25"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Approve
                </button>
              )}
              {d.status === "approved" && (
                <button
                  onClick={() => publish(d)}
                  disabled={publishingId === d.id || !canPublish}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon text-black text-xs font-semibold hover:bg-neon/80 disabled:opacity-40"
                >
                  {publishingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish now
                </button>
              )}
              {d.status !== "rejected" && d.status !== "published" && (
                <button
                  onClick={() => update(d.id, { status: "rejected" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/40 text-red-300 text-xs hover:bg-red-500/25"
                >
                  <XCircle className="w-3.5 h-3.5" /> 🔴 Reject
                </button>
              )}
              {d.status !== "published" && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-white/60 text-xs cursor-pointer hover:bg-white/[0.03]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                  <input
                    type="datetime-local"
                    onChange={(e) => scheduleFor(d, e.target.value)}
                    className="bg-transparent outline-none text-white/80 text-xs w-40 ml-1"
                  />
                </label>
              )}
              <button
                onClick={() => remove(d.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:bg-white/[0.03] ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Monitor tab (placeholder trends until X read API is wired)
// ————————————————————————————————————————————————————————————————
const MonitorTab: FC = () => {
  const feeds = [
    { title: "Trending on X", icon: TrendingUp, items: ["AI x meme narrative", "SOL memecoins", "DOGE ETF chatter", "Attention economy"] },
    { title: "Crypto Narratives", icon: Radar, items: ["Restaking fatigue", "Modular Bitcoin", "Solana consumer apps", "AI agents on-chain"] },
    { title: "Dogecoin News", icon: MessageSquare, items: ["Community update", "Merch drops", "Payment integrations", "Historical throwback threads"] },
    { title: "WALDOGE Mentions", icon: Twitter, items: ["No live mentions feed yet — connect X to populate."] },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {feeds.map((f) => (
        <div key={f.title} className="rounded-xl border border-neon/20 bg-black/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <f.icon className="w-4 h-4 text-neon" />
            <span className="text-xs font-mono uppercase tracking-widest text-white/70">{f.title}</span>
          </div>
          <ul className="space-y-1.5 text-sm text-white/80">
            {f.items.map((i) => <li key={i} className="flex gap-2"><span className="text-neon/60">›</span>{i}</li>)}
          </ul>
        </div>
      ))}
      <div className="md:col-span-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-100/90 font-mono leading-relaxed">
          Monitor feeds populate live once Bark Zero's X account is connected. Until then this is Bark Zero's shortlist of what's worth watching.
        </p>
      </div>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Analytics tab
// ————————————————————————————————————————————————————————————————
const AnalyticsTab: FC = () => {
  const a = useMemo(loadAnalytics, []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Followers" value={a.followers} icon={TrendingUp} hint="Connect X to populate" />
        <StatCard label="Likes" value={a.likes} icon={CheckCircle2} />
        <StatCard label="Replies" value={a.replies} icon={MessageSquare} />
        <StatCard label="Reposts" value={a.reposts} icon={Send} />
        <StatCard label="Engagement" value={`${a.engagement}%`} icon={BarChart3} />
        <StatCard label="Growth (7d)" value={`${a.growth > 0 ? "+" : ""}${a.growth}%`} icon={TrendingUp} />
      </div>

      <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-neon/80 mb-3">Best Performing Posts</div>
        {a.best.length === 0 ? (
          <p className="text-white/50 text-sm">No published posts yet.</p>
        ) : (
          <ul className="space-y-2">
            {a.best.map((p, i) => (
              <li key={i} className="text-sm text-white/85 border-l-2 border-neon/40 pl-3">
                {p.text}
                <div className="text-[10px] text-white/40 font-mono mt-1">♥ {p.likes} · ↻ {p.reposts}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-neon/80 mb-3">Trending Topics Bark Zero is Tracking</div>
        <div className="flex flex-wrap gap-2">
          {a.trending.map((t) => <Pill key={t}>{t}</Pill>)}
        </div>
      </div>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Settings tab (Manual / Trusted / Pause / Disable + connection status)
// ————————————————————————————————————————————————————————————————
const SettingsTab: FC<{
  settings: XSettings;
  setSettings: (s: XSettings) => void;
}> = ({ settings, setSettings }) => {
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState<null | boolean>(null);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch(PUB_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        // send a probe with no valid payload — we only care whether credentials exist
        body: JSON.stringify({ kind: "tweet", text: "" }),
      });
      const data = await res.json();
      if (data.status === "not_connected") setConnected(false);
      else setConnected(true);
    } catch { setConnected(false); }
    finally { setChecking(false); }
  };

  const toggleKind = (k: PostKind) => {
    const has = settings.trustedKinds.includes(k);
    setSettings({
      ...settings,
      trustedKinds: has ? settings.trustedKinds.filter((x) => x !== k) : [...settings.trustedKinds, k],
    });
  };

  const Row: FC<{ title: string; desc: string; value: boolean; onChange: (v: boolean) => void; danger?: boolean }> = ({ title, desc, value, onChange, danger }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div>
        <div className={cn("text-sm font-mono", danger ? "text-red-300" : "text-white")}>{title}</div>
        <div className="text-xs text-white/50 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "w-11 h-6 rounded-full relative transition-colors shrink-0",
          value ? (danger ? "bg-red-500/60" : "bg-neon") : "bg-white/15",
        )}
      >
        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-black transition-all", value ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-mono uppercase tracking-widest text-neon/80">X Account Connection</div>
          <button onClick={check} className="text-xs font-mono text-neon hover:underline">
            {checking ? "checking..." : "check status"}
          </button>
        </div>
        {connected === true && <Pill tone="good"><CheckCircle2 className="w-3 h-3" /> Connected</Pill>}
        {connected === false && <Pill tone="warn"><ShieldAlert className="w-3 h-3" /> Not connected</Pill>}
        {connected === null && <Pill>Unknown</Pill>}
        <p className="text-xs text-white/50 mt-3 font-mono leading-relaxed">
          Bark Zero uses its own dedicated X account, separate from WALDOGE. To enable publishing, add these secrets:
          <br /><span className="text-neon">BARK_ZERO_X_CONSUMER_KEY</span>,{" "}
          <span className="text-neon">BARK_ZERO_X_CONSUMER_SECRET</span>,{" "}
          <span className="text-neon">BARK_ZERO_X_ACCESS_TOKEN</span>,{" "}
          <span className="text-neon">BARK_ZERO_X_ACCESS_TOKEN_SECRET</span>.
        </p>
      </div>

      <div className="rounded-xl border border-neon/20 bg-black/50 p-4">
        <div className="text-xs font-mono uppercase tracking-widest text-neon/80 mb-2">Posting Modes</div>
        <Row
          title="Manual Mode"
          desc="Nothing publishes without owner approval. Recommended default."
          value={settings.manualMode}
          onChange={(v) => setSettings({ ...settings, manualMode: v, trustedMode: v ? false : settings.trustedMode })}
        />
        <Row
          title="Trusted Mode"
          desc="When Manual Mode is off, approved drafts of the selected kinds auto-publish."
          value={settings.trustedMode}
          onChange={(v) => setSettings({ ...settings, trustedMode: v, manualMode: v ? false : settings.manualMode })}
        />
        {settings.trustedMode && (
          <div className="mt-3 flex gap-2">
            {(["tweet", "thread", "reply"] as PostKind[]).map((k) => (
              <button
                key={k}
                onClick={() => toggleKind(k)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono uppercase border transition-all",
                  settings.trustedKinds.includes(k)
                    ? "bg-neon/15 text-neon border-neon/50"
                    : "border-white/15 text-white/50",
                )}
              >{k}</button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.03] p-4">
        <div className="text-xs font-mono uppercase tracking-widest text-red-300/80 mb-2">Kill Switches</div>
        <Row
          title="Pause Posting"
          desc="Temporarily blocks all publish actions. Drafts still generate."
          value={settings.postingPaused}
          onChange={(v) => setSettings({ ...settings, postingPaused: v })}
          danger
        />
        <Row
          title="Disable Posting"
          desc="Hard stop. Bark Zero cannot publish to X under any mode."
          value={settings.postingDisabled}
          onChange={(v) => setSettings({ ...settings, postingDisabled: v })}
          danger
        />
      </div>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Main X Studio panel
// ————————————————————————————————————————————————————————————————
type Tab = "compose" | "drafts" | "monitor" | "analytics" | "settings";
const tabs: { id: Tab; label: string; icon: typeof Twitter }[] = [
  { id: "compose", label: "Compose", icon: PencilLine },
  { id: "drafts", label: "Drafts", icon: Save },
  { id: "monitor", label: "Monitor", icon: Radar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export const XStudioPanel: FC = () => {
  const [tab, setTab] = useState<Tab>("compose");
  const [drafts, setDrafts] = useState<Draft[]>(() => loadDrafts());
  const [settings, setSettings] = useState<XSettings>(() => loadSettings());

  useEffect(() => { saveDrafts(drafts); }, [drafts]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const draftCount = drafts.filter((d) => d.status === "draft" || d.status === "approved" || d.status === "scheduled").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-4 sm:p-6 min-h-[70vh] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-neon/40 bg-neon/5 flex items-center justify-center shadow-[0_0_20px_hsl(var(--neon)/0.2)]">
            <Twitter className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h3 className="font-mono text-xl text-white tracking-wide">X Studio</h3>
            <p className="text-xs text-white/50">Bark Zero's dedicated X account · not the main WALDOGE handle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settings.postingDisabled ? (
            <Pill tone="bad"><Power className="w-3 h-3" /> Disabled</Pill>
          ) : settings.postingPaused ? (
            <Pill tone="warn"><Pause className="w-3 h-3" /> Paused</Pill>
          ) : settings.manualMode ? (
            <Pill tone="good">Manual Mode</Pill>
          ) : settings.trustedMode ? (
            <Pill tone="warn">Trusted Mode</Pill>
          ) : (
            <Pill>Idle</Pill>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest border whitespace-nowrap transition-all",
                active
                  ? "bg-neon/10 text-neon border-neon/50 shadow-[0_0_15px_hsl(var(--neon)/0.15)]"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "drafts" && draftCount > 0 && (
                <span className="ml-1 px-1.5 rounded-full bg-neon/20 text-neon text-[10px]">{draftCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="pt-2">
        {tab === "compose" && <ComposeTab onSaveDraft={(d) => setDrafts([d, ...drafts])} />}
        {tab === "drafts" && <DraftsTab drafts={drafts} setDrafts={setDrafts} settings={settings} />}
        {tab === "monitor" && <MonitorTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "settings" && <SettingsTab settings={settings} setSettings={setSettings} />}
      </div>
    </motion.div>
  );
};
