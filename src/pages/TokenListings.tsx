import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, TrendingUp, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import anoncoinLogo from "@/assets/anoncoin-logo.jpeg";

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
            <span className="text-gradient-cosmic">Anoncoin Listing</span>
          </h2>

          {/* Anoncoin Card */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <img
                src={anoncoinLogo}
                alt="Anoncoin logo"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/30 shadow-lg flex-shrink-0"
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

            <p className="text-sm font-semibold text-accent mb-6">
              ⚠️ Always DYOR (Do Your Own Research)
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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
                <p className="text-lg font-bold text-foreground">Solana & Doge</p>
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
