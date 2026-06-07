import { FC } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Sparkles, Rocket, Users, ShieldCheck, Gamepad2, MessageSquare, Image as ImageIcon, Coins, Swords } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import waldogeLogoAsset from "@/assets/waldoge-logo.png.asset.json";

interface HomePageProps {
  onLaunchTool: (tab: string) => void;
}

const navLinks = [
  { id: "about", label: "About" },
  { id: "vision", label: "Vision" },
  { id: "tools", label: "Terminal" },
  { id: "community", label: "Community" },
  { id: "buy", label: "Buy" },
];

const stats = [
  { label: "Ticker", value: "$WALDOGE" },
  { label: "Network", value: "Solana" },
  { label: "Vibe", value: "Hidden" },
  { label: "Upside", value: "∞" },
];

const tools = [
  { id: "chat", label: "AI Chat", desc: "Talk to Waldoge himself.", icon: MessageSquare },
  { id: "brawler", label: "Street Brawler", desc: "Beat-em-up arcade mode.", icon: Swords },
  { id: "raid", label: "Raid Generator", desc: "Viral raid posts on demand.", icon: Rocket },
  { id: "meme", label: "Meme Generator", desc: "AI memes in seconds.", icon: ImageIcon },
  { id: "game", label: "Find Waldoge", desc: "Hidden object game.", icon: Gamepad2 },
  { id: "tokens", label: "Token Listings", desc: "Anoncoin ecosystem.", icon: Coins },
];

const visionPoints = [
  { n: "01", title: "Hidden in plain sight.", body: "The doge everyone scrolls past — until they don't. Waldoge is the overlooked play with the biggest punchline." },
  { n: "02", title: "Pure meme. Pure signal.", body: "No VCs, no insiders, no roadmap-fluff. Just a striped beanie, pixel shades, and a community that sees what others miss." },
  { n: "03", title: "Built for the chase.", body: "Games, AI tools, raids — every feature turns 'spot the doge' into a movement. Find him early. Stay early." },
];

export const HomePage: FC<HomePageProps> = ({ onLaunchTool }) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("top")} className="flex items-center gap-2">
            <img src={waldogeLogoAsset.url} alt="WALDOGE" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-base tracking-wide">
              $<span className="text-waldoge-red">WALDOGE</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <button
                key={l.id}
                onClick={() => l.id === "tools" ? onLaunchTool("chat") : scrollTo(l.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => onLaunchTool("chat")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-waldoge-red text-waldoge-cream font-semibold text-sm hover:bg-waldoge-red-glow transition-colors shadow-[0_0_24px_hsl(var(--waldoge-red)/0.35)]"
          >
            Launch Terminal <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--waldoge-red)/0.18),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--waldoge-cream)/0.05),_transparent_55%)]" />
          {/* subtle stripe overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, hsl(var(--waldoge-cream)) 0 8px, transparent 8px 22px)",
            }}
          />
        </div>

        <div className="container mx-auto px-4 pt-12 pb-24 md:pt-20 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-waldoge-red/40 bg-waldoge-red/10 text-xs uppercase tracking-[0.2em] text-waldoge-red font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-waldoge-red animate-pulse" />
              Hidden in plain sight · Solana
            </span>
          </motion.div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8 md:gap-12">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-black text-right text-5xl sm:text-7xl md:text-8xl leading-[0.85] tracking-tight"
            >
              <span className="block text-waldoge-cream">SPOT</span>
              <span className="block text-waldoge-red drop-shadow-[0_4px_24px_hsl(var(--waldoge-red)/0.4)]">THE</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative mx-auto"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute inset-0 -z-10 blur-3xl bg-waldoge-red/40 rounded-full" />
                <img
                  src={waldogeLogoAsset.url}
                  alt="WALDOGE Logo"
                  className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-black text-left text-5xl sm:text-7xl md:text-8xl leading-[0.85] tracking-tight"
            >
              <span className="block text-waldoge-red drop-shadow-[0_4px_24px_hsl(var(--waldoge-red)/0.4)]">DOGE</span>
              <span className="block text-waldoge-cream">EARLY</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 max-w-2xl mx-auto text-center text-base sm:text-lg text-muted-foreground"
          >
            <span className="text-foreground font-semibold">Waldoge</span> is the meme coin everyone overlooks — and that's exactly the point.
            One striped beanie. A million scrolls past. The next time you spot him, he's already gone parabolic.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => scrollTo("buy")}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-waldoge-red text-waldoge-cream font-bold uppercase tracking-wider hover:bg-waldoge-red-glow transition-all shadow-[0_0_40px_hsl(var(--waldoge-red)/0.45)]"
            >
              Buy $WALDOGE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onLaunchTool("chat")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card/60 backdrop-blur hover:border-waldoge-red/50 hover:text-waldoge-red transition-colors font-semibold uppercase tracking-wider"
            >
              Enter Terminal
            </button>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 border border-border/60 rounded-2xl bg-card/40 backdrop-blur overflow-hidden"
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`p-5 text-center ${i !== stats.length - 1 ? "sm:border-r border-border/40" : ""} ${i < 2 ? "border-b sm:border-b-0 border-border/40" : ""}`}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display font-bold text-xl text-waldoge-red">{s.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About / WTF Section */}
      <section id="about" className="relative py-24 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex px-3 py-1 rounded-full bg-waldoge-red/10 border border-waldoge-red/30 text-waldoge-red text-xs uppercase tracking-[0.2em] font-semibold">
              // The Coin
            </span>
            <h2 className="mt-4 font-display font-black text-4xl sm:text-6xl">
              WTF is <span className="text-waldoge-red">$WALDOGE</span>?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              The crypto answer to "Where's Waldo?" — a striped-beanie shiba hiding in every chart, every feed, every wallet. Easy to miss. Impossible to forget.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {visionPoints.map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-7 rounded-2xl border border-border/60 bg-card/40 backdrop-blur hover:border-waldoge-red/50 transition-colors"
              >
                <div className="text-waldoge-red/30 font-display font-black text-5xl mb-3 group-hover:text-waldoge-red transition-colors">{p.n}</div>
                <h3 className="font-display font-bold text-2xl mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                <div className="mt-5 text-[10px] font-mono text-muted-foreground/60">./hidden_{p.n}.waldoge</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="relative py-24 border-t border-border/40 bg-gradient-to-b from-transparent via-waldoge-red/[0.04] to-transparent">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex px-3 py-1 rounded-full bg-waldoge-red/10 border border-waldoge-red/30 text-waldoge-red text-xs uppercase tracking-[0.2em] font-semibold">
              // The Vision
            </span>
            <h2 className="mt-4 font-display font-black text-4xl sm:text-5xl leading-tight">
              The doge that <span className="text-waldoge-red">refuses</span> to be found.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every cycle has one. The unbranded ticker. The "boring" chart. The one your friend ignored because it didn't pump that week.
              <br /><br />
              Waldoge isn't here to scream. He's here to <span className="text-foreground font-semibold">wait</span> — patient, painted in red and white stripes, blending into every feed until the herd finally notices. By then, he's already on the next page.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => scrollTo("buy")} className="px-5 py-2.5 rounded-full bg-waldoge-red text-waldoge-cream font-semibold text-sm hover:bg-waldoge-red-glow transition-colors">
                Get $WALDOGE
              </button>
              <button onClick={() => onLaunchTool("game")} className="px-5 py-2.5 rounded-full border border-border bg-card/60 font-semibold text-sm hover:border-waldoge-red/50 transition-colors">
                Play Find Waldoge
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-3xl bg-waldoge-red/30 rounded-full" />
            <motion.img
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
              src={waldogeLogoAsset.url}
              alt="WALDOGE"
              className="w-full max-w-md mx-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Terminal / Tools */}
      <section id="tools" className="relative py-24 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-waldoge-red/10 border border-waldoge-red/30 text-waldoge-red text-xs uppercase tracking-[0.2em] font-semibold">
                // The Terminal
              </span>
              <h2 className="mt-4 font-display font-black text-4xl sm:text-5xl">
                Tools for <span className="text-waldoge-red">spotters</span>.
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Chat, raid, meme, brawl, and hunt — the full Waldoge arcade lives one click away.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ y: -4 }}
                onClick={() => onLaunchTool(t.id)}
                className="group text-left p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur hover:border-waldoge-red/50 hover:bg-card/70 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-waldoge-red/15 border border-waldoge-red/30 flex items-center justify-center text-waldoge-red">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-waldoge-red group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-display font-bold text-lg">{t.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="relative py-24 border-t border-border/40">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex px-3 py-1 rounded-full bg-waldoge-red/10 border border-waldoge-red/30 text-waldoge-red text-xs uppercase tracking-[0.2em] font-semibold">
            // The Pack
          </span>
          <h2 className="mt-4 font-display font-black text-4xl sm:text-6xl">
            The ones who <span className="text-waldoge-red">noticed</span>.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Waldoge is built by the spotters — degens with sharp eyes and sharper memes. Connect your wallet, jump in the terminal, and stake your striped flag.
          </p>

          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Users, label: "Community-first", body: "No VCs. No suits. Pure meme energy." },
              { icon: Eye, label: "Hidden in plain sight", body: "If you see him, you're early." },
              { icon: ShieldCheck, label: "On-chain & open", body: "Solana speed, transparent moves." },
            ].map((b) => (
              <div key={b.label} className="p-5 rounded-2xl border border-border/60 bg-card/40">
                <b.icon className="w-5 h-5 text-waldoge-red mx-auto mb-2" />
                <p className="font-display font-bold">{b.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buy / CTA */}
      <section id="buy" className="relative py-24 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-3xl border border-waldoge-red/40 bg-gradient-to-br from-waldoge-red/15 via-card/40 to-background p-10 md:p-14 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, hsl(var(--waldoge-cream)) 0 10px, transparent 10px 24px)",
              }}
            />
            <span className="relative inline-flex px-3 py-1 rounded-full bg-waldoge-red text-waldoge-cream text-xs uppercase tracking-[0.2em] font-semibold">
              Find Him First
            </span>
            <h2 className="relative mt-4 font-display font-black text-4xl sm:text-6xl">
              Ready to <span className="text-waldoge-red">spot the doge?</span>
            </h2>
            <p className="relative mt-4 max-w-xl mx-auto text-muted-foreground">
              Connect your wallet, grab some $WALDOGE, and join the few who noticed before everyone else did.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="wallet-button-wrapper">
                <WalletMultiButton className="!h-12 !px-7 !rounded-full !bg-waldoge-red hover:!bg-waldoge-red-glow !text-waldoge-cream !font-bold !uppercase !tracking-wider" />
              </div>
              <button
                onClick={() => onLaunchTool("tokens")}
                className="h-12 px-7 rounded-full border border-border bg-card/60 font-bold uppercase tracking-wider text-sm hover:border-waldoge-red/50 transition-colors"
              >
                See Listings
              </button>
            </div>
            <p className="relative mt-6 text-xs text-muted-foreground">
              🐕 For fun. No financial advice. Always DYOR.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} WALDOGE · Hidden in plain sight.
      </footer>
    </div>
  );
};
