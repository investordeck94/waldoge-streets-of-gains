import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, TrendingUp, Calendar, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import anoncoinLogo from "@/assets/anoncoin-logo.png";
import woofLogo from "@/assets/woof-logo.jpeg";
import woofCommunity1 from "@/assets/woof-community-1.jpeg";
import woofCommunity2 from "@/assets/woof-community-2.jpeg";
import woofCommunity3 from "@/assets/woof-community-3.jpeg";
import woofCommunity4 from "@/assets/woof-community-4.jpeg";
import woofCommunity5 from "@/assets/woof-community-5.jpeg";
import woofCommunity6 from "@/assets/woof-community-6.jpeg";
import woofCommunity7 from "@/assets/woof-community-7.jpeg";
import anoncoinCommunity1 from "@/assets/anoncoin-community-1.jpeg";
import anoncoinCommunity2 from "@/assets/anoncoin-community-2.jpeg";
import vibecoinLogo from "@/assets/vibecoin-logo.jpeg";
import vibecoinCommunity1 from "@/assets/vibecoin-community-1.jpeg";
import vibecoinCommunity2 from "@/assets/vibecoin-community-2.jpeg";
import vibecoinCommunity3 from "@/assets/vibecoin-community-3.jpeg";
import vibecoinCommunity4 from "@/assets/vibecoin-community-4.jpeg";
import vibecoinCommunity5 from "@/assets/vibecoin-community-5.jpeg";
import monkoLogo from "@/assets/monko-logo.png";

const TokenListings = () => {
  return (
    <div className="min-h-screen bg-background space-bg">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to WALDOGE</span>
        </Link>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
            Verified Meme Tokens Listing & Lore
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            Curated listings of verified meme tokens and their stories.
          </p>
        </motion.div>

        {/* Anoncoin Ecosystem Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="text-gradient-cosmic">Anoncoin Ecosystem</span>
          </h2>

          {/* Anoncoin Card */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <img
                src={anoncoinLogo}
                alt="Anoncoin logo"
                className="w-24 h-24 rounded-full object-cover shadow-lg flex-shrink-0"
              />
              <div>
                <h3 className="text-2xl font-bold text-primary mb-1">Anoncoin</h3>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 mb-3">
                  Ecosystem Token
                </span>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed mb-6">
              This coin is the official token for the Anoncoin ecosystem. Originally, it was known as Dub Dub TV. People like Nikita Bier and many others hold the Anoncoin token. They work closely with Solana & Doge. It was launched in June 2025 — we suspect some really big people are behind this token.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              Some have even said the owners of Coinbase, Juno & Jupiter Swap are involved — all multi-billion-dollar companies. However, this has not yet been verified.
            </p>

            <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-medium">CA (Contract Address):</p>
              <p className="text-sm text-primary font-mono break-all select-all">D25bi7oHQjqkVrzbfuM6k2gzVNHTSpBLhtakDCzCCDUB</p>
            </div>

            {/* Community Art Gallery */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Community Art</h4>
              <div className="grid grid-cols-2 gap-3">
                {[anoncoinCommunity1, anoncoinCommunity2].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Anoncoin community art ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-border/50 hover:border-primary/50 transition-colors hover:scale-105 transition-transform duration-200"
                  />
                ))}
              </div>
            </div>

            <p className="text-sm font-semibold text-accent mb-6">
              ⚠️ Always DYOR (Do Your Own Research)
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  All-Time High
                </div>
                <p className="text-lg font-bold text-primary">$22.4M</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Launched
                </div>
                <p className="text-lg font-bold text-foreground">June 2025</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Ecosystem
                </div>
                <p className="text-lg font-bold text-foreground">Solana / DogeOS</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://t.me/AnoncoinIt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://t.me/AnoncoinIt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Join Chat
                </a>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://x.com/anoncoinit?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://x.com/anoncoinit?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Follow
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 italic">
              Disclaimer: The information above is community-sourced. Always do your own research before investing.
            </p>
          </div>
        </motion.div>

        {/* WooF! - Part of Anoncoin Ecosystem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <img
                src={woofLogo}
                alt="WooF! logo"
                className="w-24 h-24 rounded-full object-cover shadow-lg flex-shrink-0"
              />
              <div>
                <h3 className="text-2xl font-bold text-primary mb-1">WooF!</h3>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 mb-3">
                  Anoncoin Ecosystem
                </span>
                <p className="text-sm text-muted-foreground italic">"Everyone will WooF!"</p>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed mb-4">
              This token is believed to have been launched by a Doge or DogeOS insider — no one knows who they are, but the saying "WooF!" is believed to come from people involved in Doge. It could even be the cofounders of DogeOS, though that's just speculation for now.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              It was once said on a Space by Doge Takeover that "there were a bunch of Doge insiders in a room together who WooF'd!" — which he thought could have been one of the people who launched the coin, in hindsight.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              Even Hoff, one of the co-founders of DogeOS, said on Spaces that "WooF! is a genius idea."
            </p>

            <p className="text-foreground/90 leading-relaxed mb-6">
              The anonymous dev who launched WooF! believes in the DOGE motto: <span className="font-semibold text-primary">"Do Only Good Every Day"</span>.
            </p>

            {/* Community Art Gallery */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Community Art</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[woofCommunity1, woofCommunity2, woofCommunity3, woofCommunity4, woofCommunity5, woofCommunity6, woofCommunity7].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`WooF! community art ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-border/50 hover:border-primary/50 transition-colors hover:scale-105 transition-transform duration-200"
                  />
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-medium">CA (Contract Address):</p>
              <p className="text-sm text-primary font-mono break-all select-all">8F6zYQQfiacjyJZjw1J8aP7MbgAewHHKnvLD18xDdoge</p>
            </div>

            <p className="text-sm font-semibold text-accent mb-6">
              ⚠️ Always DYOR (Do Your Own Research)
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  All-Time High
                </div>
                <p className="text-lg font-bold text-primary">$542.4K</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Launched
                </div>
                <p className="text-lg font-bold text-foreground">Sep–Oct 2025</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Ecosystem
                </div>
                <p className="text-lg font-bold text-foreground">Solana / DogeOS</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://t.me/anonwoof"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://t.me/anonwoof"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Join Chat
                </a>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://x.com/woofcoin69?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://x.com/woofcoin69?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Follow
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 italic">
              Disclaimer: The information above is community-sourced. Always do your own research before investing.
            </p>
          </div>
        </motion.div>

        {/* Vibecoin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-12"
        >
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <img src={vibecoinLogo} alt="Vibecoin logo" className="w-24 h-24 rounded-full shadow-lg flex-shrink-0 object-cover" />
              <div>
                <h3 className="text-2xl font-bold text-primary mb-1">Vibecoin</h3>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 mb-3">
                  Anoncoin Ecosystem
                </span>
                <p className="text-sm text-muted-foreground italic">"Don't Doubt Your Vibe" 💫🐱🎧</p>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed mb-4">
              VIBECOIN ($VIBECOIN) is a Solana-based meme coin centered around the legendary "Vibing Cat" — an orange, chill, headphone-wearing feline that perfectly captures pure, effortless internet vibes and degen energy. Launched anonymously via @anoncoinit by a high-follower KOL, it exploded as the go-to orange cat meme on the chain.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              Its legendary lore draws from mysterious origins — nobody knows the exact launcher, fueling endless speculation. There are parallels to Dogecoin legends like Dogememegirl, with exchanges mimicking iconic shills and ginger cat vibes. Massive dev buybacks from creator fees (over $120K reported), surprise follows from figures like Elon Musk and DogeOfficialCEO, and a narrative of rising from underdog status to cultural force.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-6">
              It's less about utility and more about riding the ultimate good-energy wave in Solana's meme jungle — heading toward "DogeOS" dominance, Mars-level ambitions, and turning raw community belief into unstoppable momentum.
            </p>

            <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 font-medium">CA (Contract Address):</p>
              <p className="text-sm text-primary font-mono break-all select-all">AZbem4s8iLJE5eniDZJ7c8q1ahbfMwWgCA8TxVW2tDUB</p>
            </div>

            {/* Community Art Gallery */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Community Art</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[vibecoinCommunity1, vibecoinCommunity2, vibecoinCommunity3, vibecoinCommunity4, vibecoinCommunity5].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Vibecoin community art ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-border/50 hover:border-primary/50 transition-colors hover:scale-105 transition-transform duration-200"
                  />
                ))}
              </div>
            </div>

            <p className="text-sm font-semibold text-accent mb-6">
              ⚠️ Always DYOR (Do Your Own Research)
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  All-Time High
                </div>
                <p className="text-lg font-bold text-primary">$5.5M</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Launched
                </div>
                <p className="text-lg font-bold text-foreground">Aug–Sep 2025</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Ecosystem
                </div>
                <p className="text-lg font-bold text-foreground">Solana / DogeOS</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://t.me/VIBECOINCAT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://t.me/VIBECOINCAT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Join Chat
                </a>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://x.com/vibecoinonanon?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://x.com/vibecoinonanon?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Follow
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 italic">
              Disclaimer: The information above is community-sourced. Always do your own research before investing.
            </p>
          </div>
        </motion.div>

        {/* Monko */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <img src={monkoLogo} alt="Monko logo" className="w-24 h-24 rounded-full shadow-lg flex-shrink-0 object-cover" />
              <div>
                <h3 className="text-2xl font-bold text-primary mb-1">Monko</h3>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 mb-3">
                  Anoncoin Ecosystem
                </span>
                <p className="text-sm text-muted-foreground italic">"Monko your bananas until zillions" 🐒🍌</p>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed mb-4">
              Monko is a community token which recently got CTO'd, as they deserved. It was launched around October and embodies the true meaning of community. Day in and day out, they post all over X, do meme competitions, hold regular Spaces on X, and have even created a Monko game most recently — a cross between Super Mario and Jungle Run.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              The community continues to grow with more and more ideas for future games waiting to be unveiled. Even the most recent game was played by people all across the globe. The meme itself is a fun, lovable, cheeky monkey.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-6">
              Each member in the Monko community has a different role, and each of them pitches in in their own way. For example, they have multiple people creating the artwork, one person making the Monko music, and a few people who speak on the X Spaces.
            </p>

            <p className="text-sm font-semibold text-accent mb-6">
              ⚠️ Always DYOR (Do Your Own Research)
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  ATH
                </div>
                <p className="text-lg font-bold text-foreground">$435K</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Launched
                </div>
                <p className="text-lg font-bold text-foreground">Oct 2025</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Ecosystem
                </div>
                <p className="text-lg font-bold text-foreground">Solana / DogeOS</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://t.me/+cpgDNu_OGGs5YWFh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://t.me/+cpgDNu_OGGs5YWFh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Join Chat
                </a>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <a
                  href="https://x.com/monkocoin?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-xs mb-1 hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://x.com/monkocoin?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  Follow
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 italic">
              Disclaimer: The information above is community-sourced. Always do your own research before investing.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TokenListings;
