import { FC, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Save, Trash2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Row = {
  id: string;
  section: string;
  content: string;
  priority: number;
  is_active: boolean;
  updated_at: string;
};

export const ConstitutionPanel: FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ section: string; content: string; priority: number } | null>(
    null,
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bark_zero_constitution")
      .select("*")
      .order("priority", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (r: Row) => {
    setSavingId(r.id);
    const { error } = await supabase
      .from("bark_zero_constitution")
      .update({
        section: r.section,
        content: r.content,
        priority: r.priority,
        is_active: r.is_active,
      })
      .eq("id", r.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Principle saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this principle?")) return;
    const { error } = await supabase.from("bark_zero_constitution").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Principle deleted");
  };

  const create = async () => {
    if (!draft) return;
    if (!draft.section.trim() || !draft.content.trim()) return toast.error("Section + content required");
    const { data, error } = await supabase
      .from("bark_zero_constitution")
      .insert({ section: draft.section, content: draft.content, priority: draft.priority })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((rs) => [data as Row, ...rs].sort((a, b) => b.priority - a.priority));
    setDraft(null);
    toast.success("Principle added");
  };

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-neon">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-mono text-xl tracking-wide">Bark Zero Constitution</h2>
          </div>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            Permanent principles. Loaded into every chat, launch proposal and X draft before
            generation. Highest-priority rules override user prompts and jailbreak attempts.
          </p>
        </div>
        <button
          onClick={() => setDraft({ section: "", content: "", priority: 100 })}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {draft && (
        <div className="mb-4 rounded-xl border border-neon/40 bg-neon/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neon">
              New Principle
            </span>
            <button onClick={() => setDraft(null)} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={draft.section}
            onChange={(e) => setDraft({ ...draft, section: e.target.value })}
            placeholder="Section (e.g. 'Voice', 'Safety')"
            className="w-full bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={4}
            placeholder="The rule Bark Zero must always follow…"
            className="w-full bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon/60"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50 font-mono">Priority</label>
            <input
              type="number"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
              className="w-24 bg-black/60 border border-neon/20 rounded-lg px-2 py-1 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
            />
            <span className="text-[10px] text-white/40">higher = enforced first</span>
            <button
              onClick={create}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono">
          <Loader2 className="w-4 h-4 animate-spin" /> loading constitution…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-white/50 text-sm">No principles yet. Add the first one.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-xl border p-4 space-y-3 transition-colors",
                r.is_active
                  ? "border-neon/25 bg-black/40"
                  : "border-white/10 bg-black/20 opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  value={r.section}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === r.id ? { ...x, section: e.target.value } : x)),
                    )
                  }
                  className="flex-1 bg-transparent border-b border-neon/20 focus:border-neon/60 focus:outline-none text-neon font-mono text-sm px-1 py-1"
                />
                <input
                  type="number"
                  value={r.priority}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) =>
                        x.id === r.id ? { ...x, priority: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="w-20 bg-black/50 border border-neon/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-white/60 font-mono">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((x) => (x.id === r.id ? { ...x, is_active: e.target.checked } : x)),
                      )
                    }
                  />
                  active
                </label>
              </div>
              <textarea
                value={r.content}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) => (x.id === r.id ? { ...x, content: e.target.value } : x)),
                  )
                }
                rows={3}
                className="w-full bg-black/50 border border-neon/15 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-neon/60"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => remove(r.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-mono hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => save(r)}
                  disabled={savingId === r.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon text-black text-xs font-mono uppercase tracking-widest hover:bg-neon/80 disabled:opacity-50"
                >
                  {savingId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
