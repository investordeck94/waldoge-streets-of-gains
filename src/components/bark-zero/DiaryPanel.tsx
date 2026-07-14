import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ownerSecretHeader } from "@/lib/ownerSecret";
import { Loader2, NotebookPen, Trash2, Feather } from "lucide-react";
import { toast } from "sonner";

type Diary = { id: string; entry_date: string; content: string; mood: string | null; created_at: string };
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-inner-life`;

export const DiaryPanel: FC = () => {
  const [rows, setRows] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [hint, setHint] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bark_zero_diary").select("*")
      .order("entry_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Diary[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const write = async () => {
    setWriting(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...ownerSecretHeader() },
        body: JSON.stringify({ action: "diary", hint: hint || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("Diary entry saved");
      setHint("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setWriting(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete entry?")) return;
    const { error } = await supabase.from("bark_zero_diary").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-center gap-2 text-neon mb-2">
        <NotebookPen className="w-5 h-5" />
        <h2 className="font-mono text-xl tracking-wide">Bark's Diary</h2>
      </div>
      <p className="text-white/60 text-sm mb-4 max-w-2xl">
        One short entry a day. Bark Zero's inner monologue about what the world's up to.
      </p>

      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="optional prompt (what happened today?)…"
          className="flex-1 min-w-[220px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
        <button onClick={write} disabled={writing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50">
          {writing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />} Write today's entry
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono"><Loader2 className="w-4 h-4 animate-spin" /> loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-white/50 text-sm">Diary empty. Write the first page.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-neon/25 bg-black/40 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-neon/10 text-neon uppercase tracking-widest">{r.entry_date}</span>
                {r.mood && <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 tracking-widest">{r.mood}</span>}
                <button onClick={() => remove(r.id)} className="ml-auto text-red-400/70 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
