import { FC, useState } from "react";
import { KeyRound, Lock, Unlock } from "lucide-react";
import {
  clearOwnerSecret,
  hasOwnerSecret,
  setOwnerSecret,
} from "@/lib/ownerSecret";

/**
 * Small owner-secret unlock control. Bark Zero's privileged edge functions
 * (chat, launch, publish, memory, etc.) require the `x-owner-secret` header;
 * this lets the site owner paste that shared secret once and stores it in
 * localStorage. Without it every owner-gated call returns 401.
 */
export const OwnerSecretGate: FC = () => {
  const [unlocked, setUnlocked] = useState(hasOwnerSecret());
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(!hasOwnerSecret());

  const save = () => {
    const v = value.trim();
    if (!v) return;
    setOwnerSecret(v);
    setValue("");
    setUnlocked(true);
    setOpen(false);
  };

  const clear = () => {
    clearOwnerSecret();
    setUnlocked(false);
    setOpen(true);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-neon/70 hover:text-neon border border-neon/25 rounded-md px-2 py-1"
        title="Owner secret unlocked — click to change or clear"
      >
        <Unlock className="w-3 h-3" /> owner unlocked
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-neon/25 bg-black/70 backdrop-blur-xl p-3 font-mono text-xs">
      <div className="flex items-center gap-2 mb-2 text-neon/90">
        <KeyRound className="w-3.5 h-3.5" />
        <span className="uppercase tracking-[0.2em]">Owner secret required</span>
      </div>
      <p className="text-white/60 mb-2 leading-relaxed">
        Bark Zero's privileged endpoints (chat, launch, publish, memory) require the shared owner
        secret. Paste it once — stored locally in this browser only.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="paste BARK_ZERO_OWNER_SECRET"
          className="flex-1 bg-black/60 border border-neon/25 rounded-md px-2 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-neon"
        />
        <button
          onClick={save}
          disabled={!value.trim()}
          className="px-3 py-1.5 rounded-md bg-neon/20 border border-neon/40 text-neon hover:bg-neon/30 disabled:opacity-40"
        >
          unlock
        </button>
        {unlocked && (
          <button
            onClick={clear}
            className="px-2 py-1.5 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10"
            title="Clear stored owner secret"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
