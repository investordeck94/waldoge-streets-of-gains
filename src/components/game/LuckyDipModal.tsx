import { useEffect, useRef, useState } from "react";
import { getCoins, subscribeCoins } from "@/game/collectibles/coinWallet";
import { ITEM_DEFS, type ItemId } from "@/game/inventory/inventory";
import { LUCKY_DIP_COST, purchaseLuckyDip } from "@/game/inventory/luckyDip";
import { ITEM_ICONS } from "@/game/presentation/render2d/luckyDipSprites";

export function LuckyDipModal({ onClose, onOpenChange, onReward }: { onClose: () => void; onOpenChange: (open: boolean) => void; onReward?: (r: ItemId) => void }) {
  const [coins, setCoins] = useState(getCoins());
  const [reward, setReward] = useState<ItemId | null>(null);
  const done = useRef(false);
  useEffect(() => subscribeCoins((d) => setCoins(d.coins)), []);
  useEffect(() => { onOpenChange(true); return () => onOpenChange(false); }, [onOpenChange]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  const confirm = () => {
    if (done.current) return;
    done.current = true;
    const r = purchaseLuckyDip();
    setReward(r);
    if (r) onReward?.(r);
  };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const btn = "border-2 px-3 py-1 tracking-wider";
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 p-2 font-mono font-bold"
      onPointerDown={stop} onTouchStart={stop} onMouseDown={stop} role="dialog" aria-label="Doxx Lucky Dip">
      <div className="w-[min(18rem,100%)] bg-background/95 border-2 border-primary rounded p-3 text-center text-xs sm:text-sm">
        <div className="tracking-widest text-primary">DOXX LUCKY DIP</div>
        <div className="mt-1 text-muted-foreground text-[10px]">YOUR COINS: <span className="text-primary" data-testid="dip-coins">{coins}</span></div>
        {reward ? (
          <>
            <img src={ITEM_ICONS[reward]} alt="" className="mx-auto mt-2 h-12 w-auto object-contain object-left" style={{ imageRendering: "pixelated" }} />
            <div className="mt-1 text-foreground" data-testid="dip-reward">YOU GOT: {ITEM_DEFS[reward].name}</div>
            <div className="text-[10px] text-muted-foreground">ADDED TO YOUR BACKPACK</div>
            <button type="button" onClick={onClose} className={`${btn} mt-3 border-primary text-primary`}>CLOSE</button>
          </>
        ) : done.current ? (
          <>
            <div className="mt-2 text-destructive">PURCHASE FAILED — NO COINS TAKEN</div>
            <button type="button" onClick={onClose} className={`${btn} mt-3 border-primary text-primary`}>CLOSE</button>
          </>
        ) : coins < LUCKY_DIP_COST ? (
          <>
            <div className="mt-2 text-destructive">NOT ENOUGH COINS</div>
            <div className="text-[10px] text-muted-foreground">COST: {LUCKY_DIP_COST} COINS</div>
            <button type="button" onClick={onClose} className={`${btn} mt-3 border-primary text-primary`}>CLOSE</button>
          </>
        ) : (
          <>
            <div className="mt-2 text-foreground">LUCKY DIP</div>
            <div className="text-primary">COST: {LUCKY_DIP_COST} COINS</div>
            <div className="mt-3 flex justify-center gap-2">
              <button type="button" onClick={confirm} data-testid="dip-confirm" className={`${btn} border-primary bg-primary text-primary-foreground`}>CONFIRM</button>
              <button type="button" onClick={onClose} className={`${btn} border-muted-foreground text-muted-foreground`}>CANCEL</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
