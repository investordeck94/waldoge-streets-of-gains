import { FC, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, FlaskConical, CheckCircle2, PencilLine, XCircle, ShieldAlert, Sparkles, Rocket, Upload, Radar, Trophy, RefreshCw, ImageIcon, Download, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PostLaunchKitPanel } from "./PostLaunchKitPanel";

type LandscapeNarrative = {
  id: string;
  category: "ai" | "meme" | "x" | "dogeos" | "anoncoin" | string;
  title: string;
  summary: string;
  scores: {
    attention: number;
    originality: number;
    competition: number;
    viralPotential: number;
    communityStrength: number;
  };
  composite: number;
};

type Landscape = {
  narratives: LandscapeNarrative[];
  chosenId: string;
  rationale: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  ai: "AI",
  meme: "Meme",
  x: "X Trends",
  dogeos: "DogeOS",
  anoncoin: "Anoncoin",
};

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-launch-proposal`;
const LAUNCH_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-anoncoin-launch`;
const ASSET_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-generate-asset`;

type AssetKind = "logo" | "banner" | "telegram";
type AssetState = {
  dataUrl: string | null;
  filename: string | null;
  loading: boolean;
  error: string | null;
};
const emptyAsset = (): AssetState => ({ dataUrl: null, filename: null, loading: false, error: null });
const ASSET_META: Record<AssetKind, { label: string; aspect: string; hint: string }> = {
  logo:     { label: "Token Logo",       aspect: "aspect-square",   hint: "Square · used as ticker image" },
  banner:   { label: "X Banner",         aspect: "aspect-[3/2]",    hint: "Wide · header for X profile" },
  telegram: { label: "Telegram Profile", aspect: "aspect-square",   hint: "Square · TG group / channel" },
};

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

type LaunchResult = {
  ok: boolean;
  validateOnly?: boolean;
  mintAddress: string | null;
  requestId: string | null;
  signature: string | null;
  confirmed: boolean;
  broadcastError: string | null;
  anoncoin?: unknown;
};

export type LaunchProposal = {
  barksAnalysis: string;
  tokenName: string;
  ticker: string;
  narrative: string;
  whyNow: string;
  attentionAnalysis: string;
  competitionAnalysis: string;
  memeScore: number;
  communityScore: number;
  launchConfidence: number;
  narrativeScore: number;
  suggestedLiquidity: string;
  logoConcept: string;
  artworkPrompt: string;
  lore: string;
  description: string;
  websiteCopy: string;
  xThread: string[];
  telegramAnnouncement: string;
  marketingPlan: string[];
  tokenomics: string;
  risks: string[];
};


type Status = "idle" | "generating" | "reviewing" | "editing" | "approved" | "rejected";

const briefSuggestions = [
  "Emerging AI x meme narrative on Solana",
  "Something inspired by GTA 6 delays",
  "Surprise me — pick the strongest current trend",
  "A token around 'attention as currency'",
];

const Score: FC<{ label: string; value: number }> = ({ label, value }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
        <span>{label}</span>
        <span className="text-neon">{clamped}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-neon shadow-[0_0_10px_hsl(var(--neon))]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
};

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-neon/20 bg-white/[0.02] p-4">
    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-2">{title}</div>
    <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{children}</div>
  </div>
);

const PIPELINE_STEPS: Array<{ id: string; label: string }> = [
  { id: "landscape_scan",   label: "Scan Landscape" },
  { id: "narrative_chosen", label: "Choose Best Narrative" },
  { id: "token",            label: "Generate Token" },
  { id: "marketing",        label: "Generate Marketing" },
  { id: "xthread",          label: "Generate X Thread" },
  { id: "telegram",         label: "Generate Telegram" },
  { id: "assets",           label: "Draft Launch Assets" },
  { id: "done",             label: "Ready for Approval" },
];

const PipelineProgress: FC<{ current: string | null; completed: Set<string> }> = ({ current, completed }) => (
  <div className="mt-5 rounded-xl border border-neon/20 bg-black/40 p-4">
    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-3">
      Bark Zero Pipeline
    </div>
    <ol className="space-y-2">
      {PIPELINE_STEPS.map((step, i) => {
        const isDone = completed.has(step.id);
        const isActive = current === step.id && !isDone;
        return (
          <li key={step.id} className="flex items-center gap-3">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center border shrink-0 text-[10px] font-mono",
              isDone   ? "bg-neon text-black border-neon" :
              isActive ? "border-neon text-neon shadow-[0_0_12px_hsl(var(--neon)/0.6)]" :
                         "border-white/15 text-white/40",
            )}>
              {isDone
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : isActive
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : i + 1}
            </div>
            <span className={cn(
              "text-xs font-mono",
              isDone   ? "text-white/80" :
              isActive ? "text-neon" :
                         "text-white/40",
            )}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);

export const LaunchLabPanel: FC = () => {
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [proposal, setProposal] = useState<LaunchProposal | null>(null);
  const [landscape, setLandscape] = useState<Landscape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorRaw, setErrorRaw] = useState<string | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<string | null>(null);
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());

  const [rejection, setRejection] = useState<{ reason: string; landscape: Landscape | null } | null>(null);


  // Anoncoin launch form state (only used after owner approval)
  const [tickerImage, setTickerImage] = useState<File | null>(null);
  const [twitterLink, setTwitterLink] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchMode, setLaunchMode] = useState<"validate" | "launch" | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchFieldErrors, setLaunchFieldErrors] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-flight checks (gate "Approve Launch" in reviewing state)
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [preflight, setPreflight] = useState<{
    loading: boolean;
    passed: boolean;
    error: string | null;
    mintAddress: string | null;
    requestId: string | null;
  }>({ loading: false, passed: false, error: null, mintAddress: null, requestId: null });

  // Launch history persistence
  const [historyId, setHistoryId] = useState<string | null>(null);

  // Auto-generated launch assets (logo / banner / telegram)
  const [assets, setAssets] = useState<Record<AssetKind, AssetState>>({
    logo: emptyAsset(), banner: emptyAsset(), telegram: emptyAsset(),
  });

  const generateAsset = async (kind: AssetKind, p: LaunchProposal) => {
    setAssets((prev) => ({ ...prev, [kind]: { ...prev[kind], loading: true, error: null } }));
    try {
      const res = await fetch(ASSET_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          kind,
          tokenName: p.tokenName,
          ticker: p.ticker,
          logoConcept: p.logoConcept,
          artworkPrompt: p.artworkPrompt,
          narrative: p.narrative,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.b64_json) {
        setAssets((prev) => ({ ...prev, [kind]: { ...emptyAsset(), error: data.error || `Failed (${res.status})` } }));
        return;
      }
      const dataUrl = `data:${data.mimeType || "image/png"};base64,${data.b64_json}`;
      setAssets((prev) => ({
        ...prev,
        [kind]: { dataUrl, filename: data.filename || `${p.ticker.toLowerCase()}-${kind}.png`, loading: false, error: null },
      }));
      // Auto-set the token logo as the launch ticker image if user hasn't picked one
      if (kind === "logo") {
        try {
          const file = await dataUrlToFile(dataUrl, data.filename || `${p.ticker.toLowerCase()}-logo.png`);
          setTickerImage((existing) => existing ?? file);
        } catch { /* ignore */ }
      }
    } catch (e) {
      setAssets((prev) => ({ ...prev, [kind]: { ...emptyAsset(), error: (e as Error).message || "Network error" } }));
    }
  };

  const regenerateAsset = (kind: AssetKind) => {
    if (!proposal) return;
    if (kind === "logo") invalidateValidation();
    generateAsset(kind, proposal);
  };

  // Auto-fire all three when a fresh proposal arrives
  const lastAutoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!proposal) return;
    const sig = `${proposal.tokenName}::${proposal.ticker}`;
    if (lastAutoRef.current === sig) return;
    lastAutoRef.current = sig;
    setAssets({ logo: emptyAsset(), banner: emptyAsset(), telegram: emptyAsset() });
    (["logo", "banner", "telegram"] as AssetKind[]).forEach((k) => generateAsset(k, proposal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.tokenName, proposal?.ticker]);


  const invalidateValidation = () => {
    setValidated(false);
    setLaunchResult((r) => (r?.validateOnly ? null : r));
  };

  const submitLaunch = async (validateOnly = false) => {
    if (!proposal || launching) return;
    if (!validateOnly && !validated) {
      setLaunchError("Validate the token first — validation must pass before launch.");
      return;
    }
    setLaunchError(null);
    setLaunchFieldErrors({});
    if (!tickerImage) {
      setLaunchFieldErrors({ tickerImage: "Upload the token image" });
      return;
    }
    setLaunching(true);
    setLaunchMode(validateOnly ? "validate" : "launch");
    if (validateOnly) setValidated(false);
    try {
      const fd = new FormData();
      fd.append("tickerName", proposal.tokenName);
      fd.append("tickerSymbol", proposal.ticker);
      fd.append("description", proposal.description);
      fd.append("tickerImage", tickerImage);
      if (twitterLink.trim()) fd.append("twitterLink", twitterLink.trim());
      if (telegramLink.trim()) fd.append("telegramLink", telegramLink.trim());
      if (validateOnly) fd.append("validateOnly", "true");
      const res = await fetch(LAUNCH_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fieldErrors) setLaunchFieldErrors(data.fieldErrors);
        if (data.code === "duplicate_ticker") {
          setLaunchError(`Ticker $${proposal.ticker} is already taken. Edit the proposal and pick another symbol.`);
        } else {
          setLaunchError(data.error || `${validateOnly ? "Validation" : "Launch"} failed (${res.status})`);
        }
        return;
      }
      setLaunchResult(data as LaunchResult);
      if (validateOnly) setValidated(true);
    } catch (e) {
      setLaunchError((e as Error).message || "Network error");
    } finally {
      setLaunching(false);
    }
  };



  const generate = async (text?: string) => {
    const b = (text ?? brief).trim();
    if (!b || status === "generating") return;
    setBrief(b);
    setError(null);
    setErrorRaw(null);
    setRejection(null);
    setStatus("generating");
    setProposal(null);
    setLandscape(null);
    setPipelinePhase("landscape_scan");
    setCompletedPhases(new Set());
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ brief: b }),
      });
      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({} as any));
        setError(errData.error || `Request failed (${res.status})`);
        if (typeof errData.rawResponse === "string") setErrorRaw(errData.rawResponse);
        setStatus("idle");
        setPipelinePhase(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalProposal: LaunchProposal | null = null;
      let finalLandscape: Landscape | null = null;

      const markComplete = (p: string) =>
        setCompletedPhases((prev) => new Set(prev).add(p));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let msg: any;
          try { msg = JSON.parse(line.slice(6)); } catch { continue; }
          const phase = msg.phase as string;

          if (phase === "landscape_scan") {
            setPipelinePhase("landscape_scan");
          } else if (phase === "narrative_chosen") {
            markComplete("landscape_scan");
            markComplete("narrative_chosen");
            if (msg.landscape) setLandscape(msg.landscape as Landscape);
            finalLandscape = (msg.landscape as Landscape) ?? finalLandscape;
            setPipelinePhase("token");
          } else if (phase === "token") {
            markComplete("token");
            setPipelinePhase("marketing");
          } else if (phase === "marketing") {
            markComplete("marketing");
            setPipelinePhase("xthread");
          } else if (phase === "xthread") {
            markComplete("xthread");
            setPipelinePhase("telegram");
          } else if (phase === "telegram") {
            markComplete("telegram");
            setPipelinePhase("assets");
          } else if (phase === "assets") {
            markComplete("assets");
            setPipelinePhase("done");
          } else if (phase === "rejected") {
            setLandscape((msg.landscape as Landscape) ?? null);
            setRejection({
              reason: String(msg.reason ?? "Bark rejected the landscape."),
              landscape: (msg.landscape as Landscape) ?? null,
            });
            setStatus("idle");
            setPipelinePhase(null);
            return;
          } else if (phase === "error") {
            setError(msg.error || "Pipeline error");
            if (typeof msg.rawResponse === "string") setErrorRaw(msg.rawResponse);
            setStatus("idle");
            setPipelinePhase(null);
            return;
          } else if (phase === "done") {
            markComplete("done");
            finalProposal = msg.proposal as LaunchProposal;
            finalLandscape = (msg.landscape as Landscape) ?? finalLandscape;
          }
        }
      }

      if (!finalProposal) {
        setError("Pipeline ended without a proposal.");
        setStatus("idle");
        setPipelinePhase(null);
        return;
      }

      const p = finalProposal;
      setLandscape(finalLandscape);
      setProposal(p);
      setStatus("reviewing");
      setPipelinePhase(null);

      // Persist a new history record for this proposal
      try {
        const { data: inserted, error: insErr } = await supabase
          .from("bark_zero_launch_history")
          .insert([{
            token_name: p.tokenName,
            ticker: p.ticker,
            brief: b,
            proposal: p as never,
            status: "reviewing",
            narrative_score: Math.round(p.narrativeScore ?? 0) || null,
            launch_score: Math.round(p.launchConfidence ?? 0) || null,
          }])
          .select("id")
          .single();
        if (!insErr && inserted?.id) setHistoryId(inserted.id);
      } catch { /* history is best-effort */ }
    } catch (e) {
      setError((e as Error).message || "Connection lost");
      setStatus("idle");
      setPipelinePhase(null);
    }
  };

  // Push status/mint updates back into the history row
  useEffect(() => {
    if (!historyId) return;
    const patch: Record<string, unknown> = { status };
    if (status === "approved" && launchResult && !launchResult.validateOnly) {
      patch.status = "launched";
      patch.mint_address = launchResult.mintAddress;
      patch.request_id = launchResult.requestId;
      patch.signature = launchResult.signature;
    }
    supabase.from("bark_zero_launch_history").update(patch).eq("id", historyId).then(() => {});
  }, [status, launchResult, historyId]);

  // Pick up a "Relaunch" request from Launch History
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("barkZero:relaunch");
      if (!raw) return;
      sessionStorage.removeItem("barkZero:relaunch");
      const parsed = JSON.parse(raw) as { proposal: LaunchProposal; brief?: string };
      if (!parsed?.proposal) return;
      setBrief(parsed.brief ?? "");
      setProposal(parsed.proposal);
      setLandscape(null);
      setStatus("reviewing");
      // Insert a fresh history row for this relaunch
      supabase
        .from("bark_zero_launch_history")
        .insert([{
          token_name: parsed.proposal.tokenName,
          ticker: parsed.proposal.ticker,
          brief: parsed.brief ?? null,
          proposal: parsed.proposal as never,
          status: "reviewing",
          narrative_score: Math.round(parsed.proposal.narrativeScore ?? 0) || null,
          launch_score: Math.round(parsed.proposal.launchConfidence ?? 0) || null,
        }])
        .select("id")
        .single()
        .then(({ data }) => { if (data?.id) setHistoryId(data.id); });
    } catch { /* ignore */ }
  }, []);

  const reset = () => {
    setProposal(null);
    setLandscape(null);
    setStatus("idle");
    setError(null);
    setTickerImage(null);
    setTwitterLink("");
    setTelegramLink("");
    setLaunchResult(null);
    setLaunchError(null);
    setLaunchFieldErrors({});
    setValidated(false);
    setOwnerConfirmed(false);
    setPreflight({ loading: false, passed: false, error: null, mintAddress: null, requestId: null });
    setAssets({ logo: emptyAsset(), banner: emptyAsset(), telegram: emptyAsset() });
    lastAutoRef.current = null;
  };

  const invalidatePreflight = () => {
    setPreflight({ loading: false, passed: false, error: null, mintAddress: null, requestId: null });
  };

  const runPreflight = async () => {
    if (!proposal || preflight.loading) return;
    // Ensure we have an image — prefer explicit tickerImage, else the auto logo asset
    let image: File | null = tickerImage;
    if (!image && assets.logo.dataUrl) {
      try {
        image = await dataUrlToFile(
          assets.logo.dataUrl,
          assets.logo.filename ?? `${proposal.ticker.toLowerCase()}-logo.png`,
        );
      } catch { /* ignore */ }
    }
    if (!image) {
      setPreflight({ loading: false, passed: false, error: "Logo not ready — wait for asset generation or upload one.", mintAddress: null, requestId: null });
      return;
    }
    setPreflight({ loading: true, passed: false, error: null, mintAddress: null, requestId: null });
    try {
      const fd = new FormData();
      fd.append("tickerName", proposal.tokenName);
      fd.append("tickerSymbol", proposal.ticker);
      fd.append("description", proposal.description);
      fd.append("tickerImage", image);
      fd.append("validateOnly", "true");
      const res = await fetch(LAUNCH_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.code === "duplicate_ticker"
          ? `Ticker $${proposal.ticker} is already taken.`
          : (data.error || `Validation failed (${res.status})`);
        setPreflight({ loading: false, passed: false, error: msg, mintAddress: null, requestId: null });
        return;
      }
      setPreflight({
        loading: false,
        passed: true,
        error: null,
        mintAddress: data.mintAddress ?? null,
        requestId: data.requestId ?? null,
      });
    } catch (e) {
      setPreflight({ loading: false, passed: false, error: (e as Error).message || "Network error", mintAddress: null, requestId: null });
    }
  };


  // ————— Brief input state —————
  if (status === "idle" || status === "generating") {
    return (
      <div className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-6 sm:p-8 min-h-[70vh]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl border border-neon/40 bg-neon/5 flex items-center justify-center shadow-[0_0_20px_hsl(var(--neon)/0.2)]">
            <FlaskConical className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h3 className="font-mono text-xl text-white tracking-wide">Launch Lab</h3>
            <p className="text-xs text-white/50">Bark Zero drafts. You approve. Nothing launches without you.</p>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 mb-6 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-100/90 font-mono leading-relaxed">
            Owner approval required. Bark Zero will never spend funds, sign transactions or launch a token
            automatically. Every proposal is a draft until you press <span className="text-neon">Approve Launch</span>.
          </p>
        </div>

        <label className="block text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-2">
          Brief
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="> a trend, a vibe, or 'surprise me'..."
          rows={4}
          className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 font-mono"
        />

        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          {briefSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => setBrief(s)}
              className="text-left text-xs px-3 py-2 rounded-lg border border-neon/15 bg-neon/5 text-white/70 hover:border-neon/50 hover:text-white transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
            <div className="text-xs text-red-400 font-mono">⚠ {error}</div>
            {errorRaw && (
              <details className="mt-2">
                <summary className="text-[10px] font-mono uppercase tracking-widest text-red-300/70 cursor-pointer hover:text-red-300">
                  show raw AI response
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto text-[10px] text-white/60 font-mono whitespace-pre-wrap break-all bg-black/40 p-2 rounded">
{errorRaw}
                </pre>
              </details>
            )}
          </div>
        )}



        {rejection && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-400 mb-2">
              Bark Rejected This Landscape
            </div>
            <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {rejection.reason}
            </div>
            <div className="mt-2 text-[11px] text-white/50 font-mono">
              Nothing here clears the bar. Sharpen the brief and try again — no generic memecoins.
            </div>
          </div>
        )}


        <button
          onClick={() => generate()}
          disabled={status === "generating" || !brief.trim()}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 disabled:opacity-40 transition-colors"
        >
          {status === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Scanning landscape & drafting proposal...
            </>
          ) : (
            <>
              <Radar className="w-4 h-4" /> Scan Landscape & Generate Proposal
            </>
          )}
        </button>

        {status === "generating" && (
          <PipelineProgress current={pipelinePhase} completed={completedPhases} />
        )}
      </div>
    );
  }

  if (!proposal) return null;

  const updateField = <K extends keyof LaunchProposal>(k: K, v: LaunchProposal[K]) => {
    setProposal({ ...proposal, [k]: v });
    // Any edit to identity/copy invalidates the preflight validation
    if (k === "tokenName" || k === "ticker" || k === "description") {
      invalidatePreflight();
      setOwnerConfirmed(false);
    }
  };

  // ————— Approved: Anoncoin launch flow —————
  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-neon/40 bg-black/60 backdrop-blur-xl p-6 sm:p-8 min-h-[70vh] space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-neon" />
          <div>
            <h3 className="font-mono text-2xl text-white">Launch Approved</h3>
            <p className="text-xs text-white/50">
              Upload artwork and confirm to mint via Anoncoin. Bark Zero broadcasts the signed transaction to Solana.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Section title="Token">
            <div className="text-lg text-neon font-mono">{proposal.tokenName} · ${proposal.ticker}</div>
            <div className="mt-1">{proposal.description}</div>
          </Section>
          <Section title="Suggested Liquidity">{proposal.suggestedLiquidity}</Section>
        </div>

        {launchResult && !launchResult.validateOnly ? (
          <div className="rounded-xl border p-5 space-y-3 border-green-400/50 bg-green-500/5">
            <div className="flex items-center gap-2 font-mono text-sm text-green-300">
              <CheckCircle2 className="w-5 h-5" />
              {launchResult.confirmed
                ? "Launch confirmed on Solana"
                : "Launch submitted — confirmation pending"}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <div className="text-white/40 uppercase tracking-widest mb-1">Mint Address</div>
                <div className="text-white break-all">{launchResult.mintAddress ?? "—"}</div>
              </div>
              <div>
                <div className="text-white/40 uppercase tracking-widest mb-1">Request ID</div>
                <div className="text-white break-all">{launchResult.requestId ?? "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-white/40 uppercase tracking-widest mb-1">Tx Signature</div>
                <div className="text-white break-all">{launchResult.signature ?? "—"}</div>
              </div>
            </div>
            {launchResult.broadcastError && (
              <div className="text-xs text-yellow-300/90 font-mono">⚠ {launchResult.broadcastError}</div>
            )}
            {launchResult.signature && (
              <a
                href={`https://solscan.io/tx/${launchResult.signature}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-mono text-neon hover:underline"
              >
                view on Solscan ↗
              </a>
            )}
            {launchResult.anoncoin !== undefined && (
              <details className="text-xs">
                <summary className="cursor-pointer text-white/50 font-mono uppercase tracking-widest">
                  Raw API response
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-white/10 text-[11px] text-white/80 overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(launchResult.anoncoin, null, 2)}
                </pre>
              </details>
            )}
            <button
              onClick={reset}
              className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-neon"
            >
              ← draft another proposal
            </button>

            {/* Post-launch content kit — auto-generated on successful mint */}
            <PostLaunchKitPanel
              proposal={proposal}
              mintAddress={launchResult.mintAddress}
              signature={launchResult.signature}
            />
          </div>

        ) : (
          <div className="rounded-xl border border-neon/25 bg-white/[0.02] p-5 space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80">Launch Details</div>

            {/* Step indicator */}
            <ol className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
              <li className="px-2 py-1 rounded border border-green-400/40 bg-green-500/10 text-green-300">1 · Proposal ✓</li>
              <li className="text-white/30">→</li>
              <li className={cn(
                "px-2 py-1 rounded border",
                validated
                  ? "border-green-400/40 bg-green-500/10 text-green-300"
                  : "border-neon/50 bg-neon/10 text-neon",
              )}>
                2 · Validate {validated ? "✓" : ""}
              </li>
              <li className="text-white/30">→</li>
              <li className={cn(
                "px-2 py-1 rounded border",
                validated
                  ? "border-neon/50 bg-neon/10 text-neon"
                  : "border-white/10 bg-white/5 text-white/40",
              )}>
                3 · Launch
              </li>
            </ol>

            <div>
              <label className="block text-xs font-mono text-white/60 mb-1">Ticker Image *</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setTickerImage(e.target.files?.[0] ?? null);
                    invalidateValidation();
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neon/30 bg-neon/5 text-neon text-xs font-mono hover:bg-neon/10"
                >
                  <Upload className="w-4 h-4" /> {tickerImage ? "Change image" : "Choose image"}
                </button>
                <span className="text-xs text-white/60 truncate">
                  {tickerImage ? `${tickerImage.name} (${Math.round(tickerImage.size / 1024)} KB)` : "PNG or JPG, ≤ 4MB"}
                </span>
              </div>
              {launchFieldErrors.tickerImage && (
                <div className="mt-1 text-xs text-red-400 font-mono">{launchFieldErrors.tickerImage}</div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Twitter (optional)</label>
                <input
                  value={twitterLink}
                  onChange={(e) => { setTwitterLink(e.target.value); invalidateValidation(); }}
                  placeholder="https://x.com/..."
                  className="w-full bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Telegram (optional)</label>
                <input
                  value={telegramLink}
                  onChange={(e) => { setTelegramLink(e.target.value); invalidateValidation(); }}
                  placeholder="https://t.me/..."
                  className="w-full bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            {launchResult?.validateOnly && (
              <div className="rounded-lg border border-green-400/40 bg-green-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-green-300">
                  <CheckCircle2 className="w-4 h-4" /> Validation successful — token is ready to launch.
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <div className="text-white/40 uppercase tracking-widest">Mint Address</div>
                    <div className="text-white break-all">{launchResult.mintAddress ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase tracking-widest">Request ID</div>
                    <div className="text-white break-all">{launchResult.requestId ?? "—"}</div>
                  </div>
                </div>
                {launchResult.anoncoin !== undefined && (
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-white/50 font-mono uppercase tracking-widest">
                      Raw API response
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-white/10 text-[11px] text-white/80 overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(launchResult.anoncoin, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {launchError && (
              <div className="text-xs text-red-400 font-mono">⚠ {launchError}</div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => submitLaunch(true)}
                disabled={launching}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-neon/50 bg-neon/10 text-neon font-semibold hover:bg-neon/20 disabled:opacity-40 transition-colors"
              >
                {launching && launchMode === "validate" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</>
                ) : validated ? (
                  <><CheckCircle2 className="w-4 h-4" /> Re-validate</>
                ) : (
                  <><ShieldAlert className="w-4 h-4" /> Validate Token (Test)</>
                )}
              </button>
              <button
                onClick={() => {
                  if (!validated) return;
                  const ok = window.confirm(
                    `Approve launch of ${proposal.tokenName} ($${proposal.ticker}) on Anoncoin?\n\nThis will mint the token and broadcast the signed transaction to Solana mainnet. This action cannot be undone.`,
                  );
                  if (ok) submitLaunch(false);
                }}
                disabled={launching || !validated}
                title={!validated ? "Validate the token first" : undefined}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {launching && launchMode === "launch" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Minting & broadcasting...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Approve & Launch to Anoncoin</>
                )}
              </button>
            </div>

            {!validated && (
              <p className="text-[11px] text-white/50 font-mono">
                Launch stays locked until validation passes. Test first — mint after.
              </p>
            )}

            <p className="text-[11px] text-white/40 font-mono leading-relaxed">
              Owner-triggered only. Bark Zero submits to Anoncoin with server-held credentials and broadcasts the returned signed transaction to Solana before the blockhash expires.
            </p>
          </div>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer text-white/50 font-mono uppercase tracking-widest">
            Marketing assets
          </summary>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <Section title="Tokenomics">{proposal.tokenomics}</Section>
            <Section title="Artwork Prompt">{proposal.artworkPrompt}</Section>
            <Section title="Website Copy">{proposal.websiteCopy}</Section>
            <Section title="Telegram Announcement">{proposal.telegramAnnouncement}</Section>
          </div>
          <div className="mt-3">
            <Section title="X Launch Thread">
              <ol className="list-decimal ml-5 space-y-2">
                {proposal.xThread.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </Section>
          </div>
        </details>
      </div>
    );
  }


  // ————— Rejected —————
  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-black/60 backdrop-blur-xl p-8 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="font-mono text-xl text-white mb-2">Proposal Rejected</h3>
        <p className="text-white/50 mb-6 max-w-md">
          Nothing launched. Nothing spent. Nothing signed. The pack keeps watching.
        </p>
        <button
          onClick={reset}
          className="px-5 py-3 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 transition-colors"
        >
          Draft another proposal
        </button>
      </div>
    );
  }

  // ————— Reviewing / editing —————
  const editing = status === "editing";
  const editableText = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    rows = 2,
  ) => (
    <div className="rounded-xl border border-neon/20 bg-white/[0.02] p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-2">{label}</div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
        />
      ) : (
        <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{value}</div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neon/25 bg-black/60 backdrop-blur-xl p-6 sm:p-8 min-h-[70vh] space-y-5"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-neon" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/70">Launch Proposal</div>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={proposal.tokenName}
                  onChange={(e) => updateField("tokenName", e.target.value)}
                  className="bg-black/60 border border-neon/30 rounded px-2 py-1 text-lg text-white font-mono"
                />
                <span className="text-white/40">·</span>
                <input
                  value={proposal.ticker}
                  onChange={(e) => updateField("ticker", e.target.value.toUpperCase())}
                  className="bg-black/60 border border-neon/30 rounded px-2 py-1 text-lg text-neon font-mono w-24"
                />
              </div>
            ) : (
              <h3 className="font-mono text-2xl text-white tracking-wide">
                {proposal.tokenName} <span className="text-neon">· ${proposal.ticker}</span>
              </h3>
            )}
          </div>
        </div>
      </div>



      {landscape && landscape.narratives.length > 0 && (
        <details open className="rounded-xl border border-neon/25 bg-white/[0.02] p-4">
          <summary className="cursor-pointer flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80">
            <Radar className="w-3.5 h-3.5" /> Landscape Scan · {landscape.narratives.length} narratives scored
          </summary>

          <div className="mt-4 rounded-lg border border-neon/40 bg-neon/5 p-3 flex items-start gap-2">
            <Trophy className="w-4 h-4 text-neon mt-0.5 shrink-0" />
            <div className="text-xs text-white/85 leading-relaxed">
              <div className="font-mono text-neon mb-1">
                Chosen: {landscape.narratives.find(n => n.id === landscape.chosenId)?.title ?? landscape.chosenId}
                {landscape.narratives.find(n => n.id === landscape.chosenId) && (
                  <span className="text-white/50 ml-2">
                    (composite {landscape.narratives.find(n => n.id === landscape.chosenId)?.composite})
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap">{landscape.rationale}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {[...landscape.narratives]
              .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
              .map((n) => {
                const isChosen = n.id === landscape.chosenId;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-lg border p-3",
                      isChosen
                        ? "border-neon/60 bg-neon/10"
                        : "border-white/10 bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-white/70 shrink-0">
                          {CATEGORY_LABEL[n.category] ?? n.category}
                        </span>
                        <span className="font-mono text-sm text-white truncate">{n.title}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono uppercase tracking-widest",
                        isChosen ? "text-neon" : "text-white/50",
                      )}>
                        composite {n.composite}
                      </span>
                    </div>
                    <div className="text-xs text-white/70 mb-2 leading-relaxed">{n.summary}</div>
                    <div className="grid grid-cols-5 gap-2 text-[9px] font-mono uppercase tracking-widest">
                      {[
                        ["Attn", n.scores?.attention],
                        ["Orig", n.scores?.originality],
                        ["Comp", n.scores?.competition],
                        ["Viral", n.scores?.viralPotential],
                        ["Comm", n.scores?.communityStrength],
                      ].map(([label, v]) => (
                        <div key={String(label)} className="text-center">
                          <div className="text-white/40">{label as string}</div>
                          <div className={cn("text-sm", isChosen ? "text-neon" : "text-white/80")}>
                            {Math.round((v as number) ?? 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-3 text-[10px] text-white/40 font-mono">
            Competition scored inversely — higher = less crowded space.
          </div>
        </details>
      )}

      <div className="flex items-center justify-end">
        <div className="text-xs font-mono uppercase tracking-widest text-white/40">brief: {brief}</div>
      </div>

      {proposal.barksAnalysis && (
        <div className="rounded-xl border-2 border-neon/50 bg-neon/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(74,222,128,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-neon">
              ▸ Bark's Analysis
            </div>
            <div className="h-px flex-1 bg-neon/20" />
          </div>
          {editing ? (
            <textarea
              value={proposal.barksAnalysis}
              onChange={(e) => updateField("barksAnalysis", e.target.value)}
              rows={6}
              className="w-full bg-black/40 border border-neon/20 rounded-lg p-3 text-sm text-white/90 font-mono leading-relaxed focus:outline-none focus:border-neon/60"
            />
          ) : (
            <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-mono">
              {proposal.barksAnalysis}
            </div>
          )}
        </div>
      )}



      <div className="grid sm:grid-cols-4 gap-3">
        <Score label="Meme" value={proposal.memeScore} />
        <Score label="Community" value={proposal.communityScore} />
        <Score label="Narrative" value={proposal.narrativeScore} />
        <Score label="Confidence" value={proposal.launchConfidence} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {editableText("Narrative", proposal.narrative, (v) => updateField("narrative", v))}
        {editableText("Why now?", proposal.whyNow, (v) => updateField("whyNow", v))}
        {editableText("Attention Analysis", proposal.attentionAnalysis, (v) => updateField("attentionAnalysis", v))}
        {editableText("Competition Analysis", proposal.competitionAnalysis, (v) => updateField("competitionAnalysis", v))}
        {editableText("Logo Concept", proposal.logoConcept, (v) => updateField("logoConcept", v))}
        {editableText("Artwork Prompt", proposal.artworkPrompt, (v) => updateField("artworkPrompt", v))}
        {editableText("Lore", proposal.lore, (v) => updateField("lore", v), 3)}
        {editableText("Description", proposal.description, (v) => updateField("description", v))}
        {editableText("Tokenomics", proposal.tokenomics, (v) => updateField("tokenomics", v))}
        {editableText("Suggested Liquidity", proposal.suggestedLiquidity, (v) => updateField("suggestedLiquidity", v))}
      </div>

      {editableText("Website Copy", proposal.websiteCopy, (v) => updateField("websiteCopy", v), 3)}
      {editableText("Telegram Announcement", proposal.telegramAnnouncement, (v) => updateField("telegramAnnouncement", v), 3)}

      <div className="rounded-xl border border-neon/20 bg-white/[0.02] p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-2">X Launch Thread</div>
        {editing ? (
          <textarea
            value={proposal.xThread.join("\n---\n")}
            onChange={(e) => updateField("xThread", e.target.value.split(/\n---\n/))}
            rows={proposal.xThread.length * 2 + 2}
            className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
          />
        ) : (
          <ol className="list-decimal ml-5 space-y-2 text-sm text-white/85">
            {proposal.xThread.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        )}
      </div>

      <div className="rounded-xl border border-neon/20 bg-white/[0.02] p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80 mb-2">Marketing Plan</div>
        {editing ? (
          <textarea
            value={proposal.marketingPlan.join("\n")}
            onChange={(e) => updateField("marketingPlan", e.target.value.split(/\n/).filter(Boolean))}
            rows={proposal.marketingPlan.length + 2}
            className="w-full resize-none bg-black/60 border border-neon/20 focus:border-neon/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
          />
        ) : (
          <ul className="list-disc ml-5 space-y-1 text-sm text-white/85">
            {proposal.marketingPlan.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-300 mb-2">Risk Assessment</div>
        {editing ? (
          <textarea
            value={proposal.risks.join("\n")}
            onChange={(e) => updateField("risks", e.target.value.split(/\n/).filter(Boolean))}
            rows={proposal.risks.length + 2}
            className="w-full resize-none bg-black/60 border border-red-500/30 focus:border-red-400 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
          />
        ) : (
          <ul className="list-disc ml-5 space-y-1 text-sm text-red-100/90">
            {proposal.risks.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
      </div>

      {/* ————— Auto-generated launch assets ————— */}
      <div className="rounded-xl border border-neon/25 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neon" />
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80">
              Launch Assets · auto-generated
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/40">
            Regenerate any asset individually before launch.
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {(["logo", "banner", "telegram"] as AssetKind[]).map((kind) => {
            const a = assets[kind];
            const meta = ASSET_META[kind];
            return (
              <div key={kind} className="rounded-lg border border-white/10 bg-black/40 overflow-hidden flex flex-col">
                <div className={cn("relative w-full bg-black/60", meta.aspect)}>
                  {a.dataUrl ? (
                    <img src={a.dataUrl} alt={meta.label} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs font-mono">
                      {a.loading ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> rendering...</span>
                      ) : a.error ? (
                        <span className="text-red-400 px-2 text-center">⚠ {a.error}</span>
                      ) : (
                        <span>queued</span>
                      )}
                    </div>
                  )}
                  {a.loading && a.dataUrl && (
                    <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1 text-[10px] text-neon font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> refresh
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div>
                    <div className="text-sm font-mono text-white">{meta.label}</div>
                    <div className="text-[10px] text-white/40 font-mono">{meta.hint}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => regenerateAsset(kind)}
                      disabled={a.loading}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded border border-neon/40 text-neon hover:bg-neon/10 disabled:opacity-40 font-mono"
                    >
                      <RefreshCw className={cn("w-3 h-3", a.loading && "animate-spin")} />
                      {a.dataUrl ? "Regenerate" : "Retry"}
                    </button>
                    {a.dataUrl && (
                      <a
                        href={a.dataUrl}
                        download={a.filename ?? `${kind}.png`}
                        className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded border border-white/20 text-white/70 hover:border-white/40 hover:text-white font-mono"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assets.logo.dataUrl && (
          <div className="mt-3 text-[10px] font-mono text-white/50">
            ✓ Logo auto-loaded as the Anoncoin launch ticker image. You can still upload a custom file below.
          </div>
        )}
      </div>



      {/* ————— Pre-flight checklist (gates Approve Launch) ————— */}
      {(() => {
        const logoReady = !!(assets.logo.dataUrl || tickerImage);
        const descriptionReady = (proposal.description ?? "").trim().length >= 20;
        const tickerReady = /^[A-Z0-9]{2,10}$/.test(proposal.ticker ?? "");
        const uniqueTicker = preflight.passed; // proven unique only after API validation
        const apiValidated = preflight.passed;
        const ownerReady = ownerConfirmed;
        const canApprove = logoReady && descriptionReady && tickerReady && uniqueTicker && apiValidated && ownerReady;

        const Check: FC<{ ok: boolean; label: string; hint?: string }> = ({ ok, label, hint }) => (
          <li className="flex items-start gap-2">
            {ok ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <div className={cn("text-sm font-mono", ok ? "text-green-300" : "text-white/70")}>{label}</div>
              {hint && <div className="text-[11px] text-white/50 leading-relaxed">{hint}</div>}
            </div>
          </li>
        );

        return (
          <div className="rounded-xl border border-neon/30 bg-white/[0.02] p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neon" />
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80">
                  Pre-flight Checks · required before Approve Launch
                </div>
              </div>
              <button
                onClick={runPreflight}
                disabled={preflight.loading || !(logoReady && descriptionReady && tickerReady)}
                className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded border border-neon/50 bg-neon/10 text-neon hover:bg-neon/20 disabled:opacity-40"
              >
                {preflight.loading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Validating...</>
                ) : preflight.passed ? (
                  <><RefreshCw className="w-3 h-3" /> Re-validate</>
                ) : (
                  <><ShieldAlert className="w-3 h-3" /> Run API Validation</>
                )}
              </button>
            </div>

            <ul className="space-y-2">
              <Check
                ok={tickerReady && uniqueTicker}
                label={`Unique ticker ($${proposal.ticker || "—"})`}
                hint={
                  !tickerReady
                    ? "Ticker must be 2–10 uppercase letters/digits."
                    : !uniqueTicker
                    ? "Uniqueness is proven only after API validation passes below."
                    : preflight.mintAddress
                    ? `Mint reserved: ${preflight.mintAddress.slice(0, 8)}…`
                    : undefined
                }
              />
              <Check
                ok={logoReady}
                label="Logo uploaded"
                hint={logoReady ? undefined : "Wait for the auto-generated logo, or upload one on the launch screen."}
              />
              <Check
                ok={descriptionReady}
                label="Description complete"
                hint={descriptionReady ? undefined : `Description too short (${(proposal.description ?? "").trim().length}/20 chars minimum).`}
              />
              <Check
                ok={apiValidated}
                label="API validation passed"
                hint={
                  preflight.error
                    ? `⚠ ${preflight.error}`
                    : apiValidated
                    ? `Request ID: ${preflight.requestId ?? "—"}`
                    : "Click Run API Validation to check with Anoncoin (no mint)."
                }
              />
              <Check
                ok={ownerReady}
                label="Owner approval received"
                hint="Tick the box below to confirm you personally reviewed this proposal."
              />
            </ul>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ownerConfirmed}
                onChange={(e) => setOwnerConfirmed(e.target.checked)}
                className="mt-1 accent-[hsl(var(--neon))]"
              />
              <span className="text-xs text-white/80 font-mono leading-relaxed">
                I have reviewed the proposal, assets, and risks. I approve this launch as the owner.
              </span>
            </label>

            {!canApprove && (
              <div className="text-[11px] text-yellow-200/90 font-mono bg-yellow-500/5 border border-yellow-500/25 rounded p-2">
                Approve Launch is disabled — resolve the unchecked items above.
              </div>
            )}
          </div>
        );
      })()}

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-100/90 font-mono leading-relaxed">
          Owner approval required. Bark Zero will not launch, spend, or sign anything without your explicit
          confirmation.
        </p>
      </div>

      {/* Owner action bar */}
      {(() => {
        const logoReady = !!(assets.logo.dataUrl || tickerImage);
        const descriptionReady = (proposal.description ?? "").trim().length >= 20;
        const tickerReady = /^[A-Z0-9]{2,10}$/.test(proposal.ticker ?? "");
        const canApprove = logoReady && descriptionReady && tickerReady && preflight.passed && ownerConfirmed;
        const blockers: string[] = [];
        if (!tickerReady) blockers.push("valid ticker");
        if (!logoReady) blockers.push("logo");
        if (!descriptionReady) blockers.push("description ≥ 20 chars");
        if (!preflight.passed) blockers.push("API validation");
        if (!ownerConfirmed) blockers.push("owner confirmation");
        return (
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => {
                if (!canApprove) return;
                // Carry validation over so the launch screen's step indicator reflects it
                setValidated(true);
                setStatus("approved");
              }}
              disabled={!canApprove}
              title={canApprove ? undefined : `Blocked — needs: ${blockers.join(", ")}`}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all",
                canApprove
                  ? "bg-green-500/15 border border-green-400/50 text-green-300 hover:bg-green-500/25"
                  : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed",
              )}
            >
              <CheckCircle2 className="w-4 h-4" /> 🟢 Approve Launch
            </button>
            <button
              onClick={() => setStatus(editing ? "reviewing" : "editing")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all",
                "bg-yellow-500/15 border border-yellow-400/50 text-yellow-200 hover:bg-yellow-500/25",
              )}
            >
              <PencilLine className="w-4 h-4" /> 🟡 {editing ? "Done Editing" : "Edit Proposal"}
            </button>
            <button
              onClick={() => setStatus("rejected")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all",
                "bg-red-500/15 border border-red-400/50 text-red-300 hover:bg-red-500/25",
              )}
            >
              <XCircle className="w-4 h-4" /> 🔴 Reject
            </button>
          </div>
        );
      })()}

      <button
        onClick={() => generate(brief)}
        className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-neon"
      >
        ↻ regenerate from same brief
      </button>
    </motion.div>
  );
};
