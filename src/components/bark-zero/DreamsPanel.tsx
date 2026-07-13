import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Moon, Trash2, CloudMoon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Dream = { id: string; content: string; theme: string | null; connections: string[]; is_private: boolean; created_at: string };
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-inner-life`;

export const DreamsPanel: FC = () => {
  const [rows, setRows] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [dreaming, setDreaming] = useState(false);
  const [hint, setHint] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bark_zero_dreams").select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Dream[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const dream = async () => {
    setDreaming(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "dream", hint: hint || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("Dreamed");
      setHint("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setDreaming(false); }
  };
  const togglePrivate = async (r: Dream) => {
    const { error } = await supabase.from("bark_zero_dreams").update({ is_private: !r.is_private }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, is_private: !x.is_private } : x));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete dream?")) return;
    const { error } = await supabase.from("bark_zero_dreams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-center gap-2 text-neon mb-2">
        <Moon className="w-5 h-5" />
        <h2 className="font-mono text-xl tracking-wide">Dream Mode</h2>
      </div>
      <p className="text-white/60 text-sm mb-4 max-w-2xl">
        When idle, Bark Zero dreams — random creative connections. Private by default; toggle to surface as inspiration.
      </p>

      <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="optional seed (e.g. Yoda, Scooby Doo, Scarface)…"
          className="flex-1 min-w-[220px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60" />
        <button onClick={dream} disabled={dreaming}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50">
          {dreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudMoon className="w-4 h-4" />} Dream
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono"><Loader2 className="w-4 h-4 animate-spin" /> loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-white/50 text-sm">No dreams yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-neon/25 bg-black/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                {r.theme && <span className="px-2 py-0.5 rounded bg-neon/10 text-neon uppercase tracking-widest">{r.theme}</span>}
                <button onClick={() => togglePrivate(r)}
                  className="ml-auto inline-flex items-center gap-1 text-white/50 hover:text-white">
                  {r.is_private ? <><EyeOff className="w-3.5 h-3.5" /> private</> : <><Eye className="w-3.5 h-3.5" /> shared</>}
                </button>
                <button onClick={() => remove(r.id)} className="text-red-400/70 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white/85 text-sm italic leading-relaxed whitespace-pre-wrap">"{r.content}"</p>
              {r.connections?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {r.connections.map((c, i) => (
                    <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50">{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
