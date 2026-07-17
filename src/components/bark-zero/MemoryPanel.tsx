import { FC, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Save, Trash2, Brain, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Memory = {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  weight: number;
  is_active: boolean;
  updated_at: string;
};

const CATEGORIES = [
  "WALDOGE Lore",
  "Dogecoin History",
  "Catchphrases",
  "Running Jokes",
  "Community Preferences",
  "Successful Posts",
  "Community Memes",
  "Music",
  "Films",
  "Games",
  "Previous Launches",
  "Conversations",
  "Other",
];

export const MemoryPanel: FC = () => {
  const [rows, setRows] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string>("All");
  const [draft, setDraft] = useState<Partial<Memory> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bark_zero_memories")
      .select("*")
      .order("weight", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Memory[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCat !== "All" && r.category !== filterCat) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [rows, query, filterCat]);

  const save = async (r: Memory) => {
    setSavingId(r.id);
    const { error } = await supabase
      .from("bark_zero_memories")
      .update({
        category: r.category,
        title: r.title,
        content: r.content,
        tags: r.tags,
        weight: r.weight,
        is_active: r.is_active,
      })
      .eq("id", r.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Memory saved");
    import("@/lib/BarkVoiceManager").then((m) => m.barkVoice.play("memory-updated"));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this memory?")) return;
    const { error } = await supabase.from("bark_zero_memories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Memory deleted");
  };

  const create = async () => {
    if (!draft?.category || !draft.title || !draft.content) {
      return toast.error("Category, title and content required");
    }
    const payload = {
      category: draft.category,
      title: draft.title,
      content: draft.content,
      tags: draft.tags ?? [],
      weight: draft.weight ?? 50,
    };
    const { data, error } = await supabase
      .from("bark_zero_memories")
      .insert(payload)
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((rs) => [data as Memory, ...rs]);
    setDraft(null);
    toast.success("Memory added");
  };

  const parseTags = (v: string) =>
    v.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-5 min-h-[70vh]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-neon">
            <Brain className="w-5 h-5" />
            <h2 className="font-mono text-xl tracking-wide">Bark Zero Memory</h2>
          </div>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            Long-term context Bark Zero draws on when generating. WALDOGE lore, catchphrases, running
            jokes, successful posts, community preferences. Higher weight = more influence.
          </p>
        </div>
        <button
          onClick={() =>
            setDraft({ category: CATEGORIES[0], title: "", content: "", tags: [], weight: 50 })
          }
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80"
        >
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search memories…"
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-neon/20 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-neon/60"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
        >
          <option>All</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {draft && (
        <div className="mb-4 rounded-xl border border-neon/40 bg-neon/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neon">New Memory</span>
            <button onClick={() => setDraft(null)} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              value={draft.title ?? ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Short title"
              className="bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
            />
          </div>
          <textarea
            value={draft.content ?? ""}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={4}
            placeholder="The memory Bark Zero should carry…"
            className="w-full bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon/60"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={(draft.tags ?? []).join(", ")}
              onChange={(e) => setDraft({ ...draft, tags: parseTags(e.target.value) })}
              placeholder="tags, comma, separated"
              className="flex-1 min-w-[200px] bg-black/60 border border-neon/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
            />
            <label className="text-xs text-white/50 font-mono">Weight</label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.weight ?? 50}
              onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
              className="w-20 bg-black/60 border border-neon/20 rounded-lg px-2 py-1 text-sm text-white font-mono focus:outline-none focus:border-neon/60"
            />
            <button
              onClick={create}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neon text-black font-mono text-xs uppercase tracking-widest hover:bg-neon/80"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm font-mono">
          <Loader2 className="w-4 h-4 animate-spin" /> loading memories…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-white/50 text-sm">No memories match.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((r) => (
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
                <select
                  value={r.category}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === r.id ? { ...x, category: e.target.value } : x)),
                    )
                  }
                  className="bg-black/50 border border-neon/20 rounded px-2 py-1 text-xs text-neon font-mono focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) =>
                        x.id === r.id ? { ...x, weight: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="w-16 bg-black/50 border border-neon/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-white/60 font-mono ml-auto">
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
              <input
                value={r.title}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) => (x.id === r.id ? { ...x, title: e.target.value } : x)),
                  )
                }
                className="w-full bg-transparent border-b border-neon/20 focus:border-neon/60 focus:outline-none text-white font-mono text-sm px-1 py-1"
              />
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
              <input
                value={r.tags.join(", ")}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) => (x.id === r.id ? { ...x, tags: parseTags(e.target.value) } : x)),
                  )
                }
                placeholder="tags"
                className="w-full bg-black/50 border border-neon/15 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono focus:outline-none focus:border-neon/60"
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
