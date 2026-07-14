import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ownerSecretHeader } from "@/lib/ownerSecret";
import { Loader2, Compass, Search, Trash2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Curiosity = {
  id: string; question: string; findings: string | null; opinion: string | null;
  sources: unknown; status: "open" | "researched" | "archived"; tags: string[];
  created_at: string; updated_at: string;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-inner-life`;

export const CuriosityPanel: FC = () => {
  const [rows, setRows] = useState<Curiosity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [askingNew, setAskingNew] = useState(false);
  const [hint, setHint] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bark_zero_curiosities").select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Curiosity[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const askNew = async () => {
    setAskingNew(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...ownerSecretHeader() },
        body: JSON.stringify({ action: "curiosity_question", hint: hint || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("New curiosity added");
      setHint("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setAskingNew(false); }
  };

  const research = async (c: Curiosity) => {
    setBusy(c.id);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...ownerSecretHeader() },
        body: JSON.stringify({ action: "curiosity_research", question: c.question }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("Researched");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this curiosity?")) return;
    const { error } = await supabase.from("bark_zero_curiosities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-center gap-2 text-neon mb-2">
        <Compass className="w-5 h-5" />
        <h2 className="font-mono text-xl tracking-wide">Curiosity Engine</h2>
      </div>
      <p className="text-white/60 text-sm mb-4 max-w-2xl">
        "What am I curious about today?" — Bark Zero asks himself questions, researches, and forms opinions.
      </p>

      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="optional theme (e.g. music, GTA 6, Doge)…"
          className="flex-1 min-w-[220px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
        <button onClick={askNew} disabled={askingNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50">
          {askingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />} Ask something new
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono"><Loader2 className="w-4 h-4 animate-spin" /> loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-white/50 text-sm">No curiosities yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={cn("rounded-xl border p-4 space-y-2",
              r.status === "researched" ? "border-neon/30 bg-black/40" : "border-yellow-500/25 bg-yellow-500/5")}>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={cn("px-2 py-0.5 rounded uppercase tracking-widest",
                  r.status === "researched" ? "bg-neon/10 text-neon" : "bg-yellow-500/20 text-yellow-300")}>{r.status}</span>
                <span className="ml-auto text-white/40">{new Date(r.updated_at).toLocaleString()}</span>
              </div>
              <p className="text-white font-mono">❓ {r.question}</p>
              {r.findings && <p className="text-white/70 text-sm"><span className="text-neon/70 font-mono text-xs">FINDINGS: </span>{r.findings}</p>}
              {r.opinion && <p className="text-white/80 text-sm italic"><span className="text-neon/70 font-mono text-xs not-italic">OPINION: </span>{r.opinion}</p>}
              <div className="flex gap-2 pt-1">
                {r.status !== "researched" && (
                  <button onClick={() => research(r)} disabled={busy === r.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neon/40 text-neon text-xs font-mono hover:bg-neon/10 disabled:opacity-50">
                    {busy === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Research
                  </button>
                )}
                <button onClick={() => remove(r.id)}
                  className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 text-xs font-mono hover:bg-red-500/10">
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
