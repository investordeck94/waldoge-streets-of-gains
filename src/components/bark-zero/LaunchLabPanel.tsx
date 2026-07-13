import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, FlaskConical, CheckCircle2, PencilLine, XCircle, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-launch-proposal`;

export type LaunchProposal = {
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

export const LaunchLabPanel: FC = () => {
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [proposal, setProposal] = useState<LaunchProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (text?: string) => {
    const b = (text ?? brief).trim();
    if (!b || status === "generating") return;
    setBrief(b);
    setError(null);
    setStatus("generating");
    setProposal(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ brief: b }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        setStatus("idle");
        return;
      }
      setProposal(data.proposal as LaunchProposal);
      setStatus("reviewing");
    } catch (e) {
      setError((e as Error).message || "Connection lost");
      setStatus("idle");
    }
  };

  const reset = () => {
    setProposal(null);
    setStatus("idle");
    setError(null);
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
          <div className="mt-4 text-xs text-red-400 font-mono">⚠ {error}</div>
        )}

        <button
          onClick={() => generate()}
          disabled={status === "generating" || !brief.trim()}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-neon text-black font-semibold hover:bg-neon/80 disabled:opacity-40 transition-colors"
        >
          {status === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Drafting proposal...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Launch Proposal
            </>
          )}
        </button>
      </div>
    );
  }

  if (!proposal) return null;

  const updateField = <K extends keyof LaunchProposal>(k: K, v: LaunchProposal[K]) =>
    setProposal({ ...proposal, [k]: v });

  // ————— Approved: manual launch checklist —————
  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-neon/40 bg-black/60 backdrop-blur-xl p-6 sm:p-8 min-h-[70vh] space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-neon" />
          <div>
            <h3 className="font-mono text-2xl text-white">Launch Approved</h3>
            <p className="text-xs text-white/50">
              No launch API is configured. Bark Zero has prepared everything you need to launch manually.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Section title="Token">
            <div className="text-lg text-neon font-mono">{proposal.tokenName} · ${proposal.ticker}</div>
            <div className="mt-1">{proposal.description}</div>
          </Section>
          <Section title="Suggested Liquidity">{proposal.suggestedLiquidity}</Section>
          <Section title="Tokenomics">{proposal.tokenomics}</Section>
          <Section title="Artwork Prompt">{proposal.artworkPrompt}</Section>
          <Section title="Website Copy">{proposal.websiteCopy}</Section>
          <Section title="Telegram Announcement">{proposal.telegramAnnouncement}</Section>
        </div>

        <Section title="X Launch Thread">
          <ol className="list-decimal ml-5 space-y-2">
            {proposal.xThread.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Section>

        <Section title="Marketing Plan">
          <ul className="list-disc ml-5 space-y-1">
            {proposal.marketingPlan.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Section>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-100/90 font-mono leading-relaxed">
            Bark Zero has not signed anything, spent any funds, or created any on-chain transaction.
            Use the assets above to launch on your platform of choice.
          </p>
        </div>

        <button
          onClick={reset}
          className="text-xs font-mono uppercase tracking-widest text-neon hover:underline"
        >
          ← draft another proposal
        </button>
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
        <div className="text-xs font-mono uppercase tracking-widest text-white/40">brief: {brief}</div>
      </div>

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

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-100/90 font-mono leading-relaxed">
          Owner approval required. Bark Zero will not launch, spend, or sign anything without your explicit
          confirmation.
        </p>
      </div>

      {/* Owner action bar */}
      <div className="grid sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={() => setStatus("approved")}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all",
            "bg-green-500/15 border border-green-400/50 text-green-300 hover:bg-green-500/25",
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

      <button
        onClick={() => generate(brief)}
        className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-neon"
      >
        ↻ regenerate from same brief
      </button>
    </motion.div>
  );
};
