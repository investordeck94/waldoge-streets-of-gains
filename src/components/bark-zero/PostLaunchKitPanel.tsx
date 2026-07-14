import { FC, useEffect, useRef, useState } from "react";
import { Loader2, Copy, CheckCircle2, RefreshCw, Megaphone, MessageSquare, Twitter, Send, Globe, Sparkles, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LaunchProposal } from "./LaunchLabPanel";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bark-zero-post-launch-kit`;

export type PostLaunchKit = {
  xAnnouncement: string;
  xThread: string[];
  telegramAnnouncement: string;
  discordAnnouncement: string;
  landingPage: {
    headline: string;
    subheadline: string;
    features: string[];
    cta: string;
  };
  memeIdeas: { format: string; caption: string }[];
  replies: string[];
};

type Props = {
  proposal: LaunchProposal;
  mintAddress: string | null;
  signature: string | null;
};

const CopyBtn: FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border border-white/15 text-white/60 hover:text-neon hover:border-neon/50"
    >
      {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "copied" : "copy"}
    </button>
  );
};

const Panel: FC<{ icon: React.ReactNode; title: string; hint?: string; copyText?: string; children: React.ReactNode }> = ({ icon, title, hint, copyText, children }) => (
  <div className="rounded-xl border border-neon/25 bg-white/[0.02] p-4">
    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-neon/80">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {hint && <span className="text-[10px] text-white/40 font-mono">{hint}</span>}
        {copyText && <CopyBtn text={copyText} />}
      </div>
    </div>
    <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words">{children}</div>
  </div>
);

export const PostLaunchKitPanel: FC<Props> = ({ proposal, mintAddress, signature }) => {
  const [kit, setKit] = useState<PostLaunchKit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firedRef = useRef<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          tokenName: proposal.tokenName,
          ticker: proposal.ticker,
          narrative: proposal.narrative,
          description: proposal.description,
          lore: proposal.lore,
          mintAddress,
          signature,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
      } else {
        setKit(data.kit as PostLaunchKit);
      }
    } catch (e) {
      setError((e as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fire once per launch signature
  useEffect(() => {
    const sig = `${proposal.ticker}::${signature ?? mintAddress ?? "pending"}`;
    if (firedRef.current === sig) return;
    firedRef.current = sig;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, mintAddress]);

  return (
    <div className="rounded-2xl border border-neon/30 bg-black/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon" />
          <div>
            <div className="font-mono text-white">Post-Launch Content Kit</div>
            <div className="text-[11px] text-white/50 font-mono">Auto-generated the moment $${proposal.ticker} went live.</div>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-neon/40 text-neon hover:bg-neon/10 disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          {kit ? "Regenerate all" : "Retry"}
        </button>
      </div>

      {loading && !kit && (
        <div className="flex items-center gap-2 text-sm text-white/60 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-neon" /> Bark Zero is drafting the launch kit...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 font-mono">⚠ {error}</div>
      )}

      {kit && (
        <div className="grid gap-3">
          <Panel icon={<Twitter className="w-3.5 h-3.5" />} title="X Announcement" hint={`${kit.xAnnouncement.length} chars`} copyText={kit.xAnnouncement}>
            {kit.xAnnouncement}
          </Panel>

          <Panel
            icon={<Twitter className="w-3.5 h-3.5" />}
            title={`X Thread · ${kit.xThread.length} posts`}
            copyText={kit.xThread.map((p, i) => `${i + 1}/ ${p}`).join("\n\n")}
          >
            <ol className="list-decimal ml-5 space-y-2">
              {kit.xThread.map((p, i) => (
                <li key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">{p}</div>
                    <span className="text-[10px] text-white/40 font-mono shrink-0">{p.length}c</span>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel icon={<Send className="w-3.5 h-3.5" />} title="Telegram Announcement" copyText={kit.telegramAnnouncement}>
            {kit.telegramAnnouncement}
          </Panel>

          <Panel icon={<MessageSquare className="w-3.5 h-3.5" />} title="Discord Announcement" copyText={kit.discordAnnouncement}>
            {kit.discordAnnouncement}
          </Panel>

          <Panel
            icon={<Globe className="w-3.5 h-3.5" />}
            title="Landing Page Copy"
            copyText={[
              kit.landingPage.headline,
              kit.landingPage.subheadline,
              "",
              ...kit.landingPage.features.map((f) => `• ${f}`),
              "",
              `CTA: ${kit.landingPage.cta}`,
            ].join("\n")}
          >
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Headline</div>
                <div className="text-lg text-white">{kit.landingPage.headline}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Sub-headline</div>
                <div className="text-white/80">{kit.landingPage.subheadline}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Features</div>
                <ul className="list-disc ml-5 space-y-1">
                  {kit.landingPage.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">CTA</div>
                <div className="text-neon font-mono">{kit.landingPage.cta}</div>
              </div>
            </div>
          </Panel>

          <Panel icon={<Megaphone className="w-3.5 h-3.5" />} title={`Meme Ideas · ${kit.memeIdeas.length}`}>
            <div className="grid sm:grid-cols-2 gap-2">
              {kit.memeIdeas.map((m, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neon/70 mb-1">{m.format}</div>
                  <div className="text-sm text-white/85">{m.caption}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            icon={<Reply className="w-3.5 h-3.5" />}
            title={`Launch Replies · ${kit.replies.length}`}
            hint="paste under launch posts"
            copyText={kit.replies.map((r, i) => `${i + 1}. ${r}`).join("\n")}
          >
            <ol className="list-decimal ml-5 space-y-1.5 text-sm">
              {kit.replies.map((r, i) => (
                <li key={i} className="group flex items-start justify-between gap-2">
                  <span className="flex-1">{r}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyBtn text={r} />
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
    </div>
  );
};
