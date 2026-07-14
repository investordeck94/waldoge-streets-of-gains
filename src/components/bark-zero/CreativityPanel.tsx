import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ownerSecretHeader } from "@/lib/ownerSecret";
import { Loader2, Sparkles, Trash2, Lightbulb, Check, XCircle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Creation = {
  id: string; kind: string; title: string; content: string;
  status: "draft" | "approved" | "rejected" | "archived";
  metadata: Record<string, unknown>; created_at: string; owner_notes: string | null;
};

const KINDS = ["any", "meme", "logo", "token_concept", "joke", "tweet", "film_rec", "music_rec", "artwork", "observation"] as const;
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-inner-life`;

export const CreativityPanel: FC = () => {
  const [rows, setRows] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [kind, setKind] = useState<typeof KINDS[number]>("any");
  const [hint, setHint] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Creation["status"]>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bark_zero_creations").select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Creation[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...ownerSecretHeader() },
        body: JSON.stringify({ action: "creation", kind: kind === "any" ? undefined : kind, hint: hint || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Generation failed");
      toast.success(`Drafted: ${j.record?.title ?? "creation"}`);
      setHint("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setGenerating(false); }
  };

  const setStatus = async (id: string, status: Creation["status"]) => {
    const { error } = await supabase.from("bark_zero_creations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this creation?")) return;
    const { error } = await supabase.from("bark_zero_creations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-neon">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-mono text-xl tracking-wide">Creativity Engine</h2>
          </div>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            "What interesting thing could I create today?" — memes, jokes, token concepts, film picks. Drafts only. Nothing publishes without your approval.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-white/60 font-mono">Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof KINDS[number])}
            className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60">
            {KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
          <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="optional hint (theme, mood, target)…"
            className="flex-1 min-w-[220px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
          <button onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} Spark it
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(["all", "draft", "approved", "rejected", "archived"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest",
              statusFilter === s ? "bg-neon text-black" : "border border-neon/20 text-white/60 hover:text-white")}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono"><Loader2 className="w-4 h-4 animate-spin" /> loading…</div>
      ) : filtered.length === 0 ? (
        <p className="text-white/50 text-sm">No creations here yet. Spark one above.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-neon/25 bg-black/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-neon/10 text-neon uppercase tracking-widest">{r.kind}</span>
                <span className={cn("px-2 py-0.5 rounded uppercase tracking-widest",
                  r.status === "approved" ? "bg-emerald-500/15 text-emerald-300" :
                  r.status === "rejected" ? "bg-red-500/15 text-red-300" :
                  r.status === "archived" ? "bg-white/10 text-white/50" : "bg-yellow-500/15 text-yellow-300")}>{r.status}</span>
                <span className="ml-auto text-white/40">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <h3 className="text-white font-mono">{r.title}</h3>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{r.content}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => setStatus(r.id, "approved")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-300 text-xs font-mono hover:bg-emerald-500/10">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => setStatus(r.id, "rejected")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/40 text-red-300 text-xs font-mono hover:bg-red-500/10">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => setStatus(r.id, "archived")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/20 text-white/70 text-xs font-mono hover:bg-white/10">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button onClick={() => remove(r.id)} className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 text-xs font-mono hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
