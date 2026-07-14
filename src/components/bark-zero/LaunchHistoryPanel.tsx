import { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, Loader2, Rocket, ExternalLink, Copy, Trash2, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { LaunchProposal } from "./LaunchLabPanel";

type LaunchHistoryRow = {
  id: string;
  token_name: string;
  ticker: string;
  brief: string | null;
  proposal: LaunchProposal;
  status: string;
  mint_address: string | null;
  request_id: string | null;
  signature: string | null;
  narrative_score: number | null;
  launch_score: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft:     "border-white/20 bg-white/5 text-white/60",
  reviewing: "border-neon/40 bg-neon/10 text-neon",
  editing:   "border-yellow-400/40 bg-yellow-500/10 text-yellow-200",
  approved:  "border-green-400/40 bg-green-500/10 text-green-300",
  launched:  "border-green-400/60 bg-green-500/15 text-green-200",
  validated: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
  rejected:  "border-red-400/40 bg-red-500/10 text-red-300",
  failed:    "border-red-400/40 bg-red-500/10 text-red-300",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

const shorten = (s: string | null, n = 10) =>
  !s ? "—" : s.length <= n * 2 + 3 ? s : `${s.slice(0, n)}…${s.slice(-n)}`;

const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

const relaunch = (row: LaunchHistoryRow) => {
  try {
    sessionStorage.setItem(
      "barkZero:relaunch",
      JSON.stringify({ proposal: row.proposal, brief: row.brief ?? "" }),
    );
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("barkZero:navigate", { detail: { tool: "launchlab" } }));
};

export const LaunchHistoryPanel: FC = () => {
  const [rows, setRows] = useState<LaunchHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("bark_zero_launch_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setRows((data ?? []) as LaunchHistoryRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this proposal from history? This cannot be undone.")) return;
    const { error } = await supabase.from("bark_zero_launch_history").delete().eq("id", id);
    if (error) alert(error.message);
    else setRows((r) => r.filter((x) => x.id !== id));
  };

  const statuses = ["all", ...Array.from(new Set(rows.map((r) => r.status)))];
  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.token_name.toLowerCase().includes(q) ||
      r.ticker.toLowerCase().includes(q) ||
      (r.brief ?? "").toLowerCase().includes(q) ||
      (r.mint_address ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-6 sm:p-8 min-h-[70vh] space-y-6"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-neon/40 bg-neon/5 flex items-center justify-center shadow-[0_0_20px_hsl(var(--neon)/0.2)]">
            <History className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h3 className="font-mono text-xl text-white tracking-wide">Launch History</h3>
            <p className="text-xs text-white/50">Every proposal Bark Zero has drafted. Relaunch any idea in one click.</p>
          </div>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-neon"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ticker, brief, mint..."
            className="w-full bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-widest transition-colors",
                filter === s
                  ? "border-neon/60 bg-neon/15 text-neon"
                  : "border-white/10 bg-white/5 text-white/50 hover:text-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-xs text-red-400 font-mono">⚠ {error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <History className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <div className="text-sm text-white/60 font-mono">No proposals recorded yet.</div>
          <div className="text-xs text-white/40 mt-1">Draft one in the Launch Lab to see it here.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] hover:border-neon/30 transition-colors p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base text-white">{r.token_name}</span>
                    <span className="text-neon font-mono text-sm">${r.ticker}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-widest",
                      STATUS_STYLES[r.status] ?? "border-white/20 bg-white/5 text-white/60",
                    )}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-white/40 mt-1">{fmt(r.created_at)}</div>
                  {r.brief && (
                    <div className="text-xs text-white/60 mt-2 line-clamp-2">
                      <span className="text-white/40">brief · </span>{r.brief}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => relaunch(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon/15 border border-neon/40 text-neon hover:bg-neon/25 text-xs font-mono uppercase tracking-widest"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Relaunch
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-red-300 hover:border-red-400/40"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px] font-mono">
                <div>
                  <div className="text-white/40 uppercase tracking-widest">Narrative</div>
                  <div className="text-white text-sm">{r.narrative_score ?? "—"}<span className="text-white/30 text-[10px]">/100</span></div>
                </div>
                <div>
                  <div className="text-white/40 uppercase tracking-widest">Launch</div>
                  <div className="text-white text-sm">{r.launch_score ?? "—"}<span className="text-white/30 text-[10px]">/100</span></div>
                </div>
                <div className="col-span-2 min-w-0">
                  <div className="text-white/40 uppercase tracking-widest">Mint Address</div>
                  <div className="flex items-center gap-1.5 text-white truncate">
                    <span className="truncate">{shorten(r.mint_address, 8)}</span>
                    {r.mint_address && (
                      <button onClick={() => copy(r.mint_address!)} className="text-white/40 hover:text-neon">
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-4 min-w-0">
                  <div className="text-white/40 uppercase tracking-widest">Tx Signature</div>
                  <div className="flex items-center gap-1.5 text-white truncate">
                    <span className="truncate">{shorten(r.signature, 10)}</span>
                    {r.signature && (
                      <>
                        <button onClick={() => copy(r.signature!)} className="text-white/40 hover:text-neon">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a
                          href={`https://solscan.io/tx/${r.signature}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white/40 hover:text-neon inline-flex items-center gap-0.5"
                        >
                          Solscan <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {r.error && (
                <div className="mt-3 text-[11px] text-red-300/80 font-mono">⚠ {r.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
