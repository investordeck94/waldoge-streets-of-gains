import { FC, useEffect, useMemo, useState } from "react";
import { Radar, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type IntelRow = {
  id: string;
  category: "ai" | "dogeos" | "anoncoin" | "meme" | "x";
  slug: string;
  title: string;
  summary: string;
  source: string | null;
  scores: Record<string, number> | null;
  composite: number;
  rank: number | null;
  bark_take: string | null;
  scanned_at: string;
};

const CAT_LABELS: Record<IntelRow["category"], string> = {
  ai: "AI Narratives",
  dogeos: "DogeOS Ecosystem",
  anoncoin: "Anoncoin Launches",
  meme: "Successful Memes",
  x: "X Trends",
};

const ORDER: IntelRow["category"][] = ["ai", "dogeos", "anoncoin", "meme", "x"];

const SCAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-market-scan`;

export const MarketIntelPanel: FC = () => {
  const [rows, setRows] = useState<IntelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("bark_zero_market_intel")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("rank", { ascending: true });
    if (error) setError(error.message);
    else {
      const list = (data as IntelRow[]) ?? [];
      setRows(list);
      setLastScan(list[0]?.scanned_at ?? null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const scan = async (categories?: IntelRow["category"][]) => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(SCAN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(categories?.length ? { categories } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Scan failed (${res.status})`);
      await load();
    } catch (e) {
      setError((e as Error).message ?? "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const byCat = useMemo(() => {
    const m = new Map<IntelRow["category"], IntelRow[]>();
    for (const r of rows) {
      const arr = m.get(r.category) ?? [];
      arr.push(r); m.set(r.category, arr);
    }
    return m;
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neon/20 bg-white/[0.02] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-neon/80 mb-1">
              ▸ Market Intelligence
            </div>
            <div className="text-lg text-white font-semibold">
              Bark's Continuously Ranked Landscape
            </div>
            <div className="text-xs text-white/60 mt-1 leading-relaxed">
              Bark tracks AI narratives, DogeOS, Anoncoin launches, successful memes, and X trends.
              This ranking feeds directly into every launch proposal.
            </div>
            {lastScan && (
              <div className="text-[11px] text-white/40 font-mono mt-2">
                Last scan: {new Date(lastScan).toLocaleString()}
              </div>
            )}
          </div>
          <button
            onClick={() => scan()}
            disabled={scanning}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon text-black text-sm font-semibold hover:bg-neon/80 disabled:opacity-40 transition-colors"
          >
            {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning all…</>
              : <><Radar className="w-4 h-4" /> Scan All Now</>}
          </button>
        </div>
        {error && <div className="mt-3 text-xs text-red-400 font-mono">⚠ {error}</div>}
      </div>

      {loading && !rows.length && (
        <div className="text-white/50 text-sm font-mono flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading ranking…
        </div>
      )}

      {!loading && !rows.length && (
        <div className="rounded-xl border border-neon/15 bg-white/[0.02] p-6 text-center">
          <TrendingUp className="w-8 h-8 text-neon/60 mx-auto mb-2" />
          <div className="text-white/80 text-sm">No ranking yet.</div>
          <div className="text-white/50 text-xs mt-1">Hit "Scan All Now" to have Bark build one.</div>
        </div>
      )}

      {ORDER.map((cat) => {
        const list = byCat.get(cat) ?? [];
        return (
          <div key={cat} className="rounded-xl border border-neon/15 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon">
                {CAT_LABELS[cat]} · {list.length} tracked
              </div>
              <button
                onClick={() => scan([cat])}
                disabled={scanning}
                className="text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-neon inline-flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw className="w-3 h-3" /> rescan
              </button>
            </div>

            {list.length === 0 ? (
              <div className="text-xs text-white/40 font-mono py-4 text-center">
                No items tracked in this category yet.
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      (r.rank ?? 99) === 1
                        ? "border-neon/50 bg-neon/[0.05]"
                        : "border-white/10 bg-black/20 hover:border-neon/25",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-white/50">#{r.rank ?? "?"}</span>
                          <span className="text-sm text-white font-semibold truncate">{r.title}</span>
                        </div>
                        <div className="text-xs text-white/70 mt-1 leading-relaxed break-words">
                          {r.summary}
                        </div>
                        {r.bark_take && (
                          <div className="text-xs text-neon/90 mt-2 italic leading-relaxed break-words">
                            Bark: {r.bark_take}
                          </div>
                        )}
                        {r.source && (
                          <div className="text-[10px] font-mono text-white/40 mt-1">
                            src: {r.source}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-mono text-white/40">score</div>
                        <div className="text-xl font-mono text-neon">{r.composite}</div>
                      </div>
                    </div>
                    {r.scores && Object.keys(r.scores).length > 0 && (
                      <div className="grid grid-cols-5 gap-1 mt-3 text-center">
                        {(["attention","originality","competition","viralPotential","communityStrength"] as const)
                          .filter((k) => r.scores && k in r.scores)
                          .map((k) => (
                            <div key={k} className="rounded bg-black/40 px-1 py-1">
                              <div className="text-[9px] font-mono uppercase text-white/40 truncate">{k.slice(0,3)}</div>
                              <div className="text-[11px] font-mono text-white/80">{Math.round(r.scores![k] ?? 0)}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
