import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Trash2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Evo = {
  id: string; event_type: string; signal: string; lesson: string; weight: number;
  related_kind: string | null; related_id: string | null; is_active: boolean; created_at: string;
};

const EVENT_TYPES = ["owner_feedback", "successful_post", "engagement_signal", "self_reflection"] as const;
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-inner-life`;

export const EvolutionPanel: FC = () => {
  const [rows, setRows] = useState<Evo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Evo> | null>(null);
  const [reflecting, setReflecting] = useState(false);
  const [reflectSignal, setReflectSignal] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bark_zero_evolution").select("*")
      .order("weight", { ascending: false }).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Evo[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft?.event_type || !draft.signal || !draft.lesson) return toast.error("event_type, signal, lesson required");
    const { data, error } = await supabase.from("bark_zero_evolution").insert({
      event_type: draft.event_type, signal: draft.signal, lesson: draft.lesson,
      weight: draft.weight ?? 50,
    }).select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [data as Evo, ...rs]);
    setDraft(null);
    toast.success("Lesson recorded");
  };

  const reflect = async () => {
    if (!reflectSignal.trim()) return toast.error("Describe the signal first");
    setReflecting(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "evolution_reflection", signal: reflectSignal }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("Reflection stored");
      setReflectSignal("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setReflecting(false); }
  };

  const toggleActive = async (r: Evo) => {
    const { error } = await supabase.from("bark_zero_evolution").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, is_active: !x.is_active } : x));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete lesson?")) return;
    const { error } = await supabase.from("bark_zero_evolution").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-neon">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-mono text-xl tracking-wide">Evolution System</h2>
          </div>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            Lessons from successful posts, engagement, owner feedback and self-reflection. Refines Bark Zero's voice over time —
            <span className="text-neon"> never overrides the Constitution.</span>
          </p>
        </div>
        <button onClick={() => setDraft({ event_type: "owner_feedback", signal: "", lesson: "", weight: 50 })}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80">
          <Plus className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={reflectSignal} onChange={(e) => setReflectSignal(e.target.value)}
          placeholder="Describe a signal (a post that landed, a piece of feedback…)"
          className="flex-1 min-w-[240px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
        <button onClick={reflect} disabled={reflecting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50">
          {reflecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Reflect
        </button>
      </div>

      {draft && (
        <div className="mb-4 rounded-xl border border-neon/40 bg-neon/5 p-4 space-y-3">
          <div className="grid sm:grid-cols-[180px,1fr,80px] gap-2">
            <select value={draft.event_type} onChange={(e) => setDraft({ ...draft, event_type: e.target.value })}
              className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60">
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={draft.signal ?? ""} onChange={(e) => setDraft({ ...draft, signal: e.target.value })}
              placeholder="Signal (what happened)"
              className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
            <input type="number" min={0} max={100} value={draft.weight ?? 50}
              onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
              className="bg-black/60 border border-neon/20 rounded-lg px-2 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
          </div>
          <textarea value={draft.lesson ?? ""} onChange={(e) => setDraft({ ...draft, lesson: e.target.value })}
            rows={3} placeholder="Lesson (what should Bark Zero internalize?)"
            className="w-full bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon/60" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-xs font-mono">Cancel</button>
            <button onClick={create} className="px-3 py-1.5 rounded-lg bg-neon text-black text-xs font-mono uppercase tracking-widest hover:bg-neon/80">Save</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono"><Loader2 className="w-4 h-4 animate-spin" /> loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-white/50 text-sm">No lessons yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className={cn("rounded-xl border p-3",
              r.is_active ? "border-neon/25 bg-black/40" : "border-white/10 bg-black/20 opacity-60")}>
              <div className="flex items-center gap-2 text-xs font-mono mb-1">
                <span className="px-2 py-0.5 rounded bg-neon/10 text-neon uppercase tracking-widest">{r.event_type}</span>
                <span className="text-white/40">weight {r.weight}</span>
                <label className="ml-auto flex items-center gap-1 text-white/60">
                  <input type="checkbox" checked={r.is_active} onChange={() => toggleActive(r)} /> active
                </label>
                <button onClick={() => remove(r.id)} className="text-red-400/70 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white/70 text-sm"><span className="text-neon/70 font-mono text-xs">SIGNAL: </span>{r.signal}</p>
              <p className="text-white/90 text-sm mt-1"><span className="text-neon/70 font-mono text-xs">LESSON: </span>{r.lesson}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
