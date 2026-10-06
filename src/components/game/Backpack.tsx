import { useEffect, useRef, useState } from "react";
import { ITEM_DEFS, equipItem, getInventory, subscribeInventory, weaponHitsLeft, type ItemId } from "@/game/inventory/inventory";
import rucksack from "@/assets/rucksack.png";
import { ITEM_ICONS } from "@/game/presentation/render2d/luckyDipSprites";

/** Move the backpack by changing this one value. */
export type HudCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left";
/** "hud" = in the lower HUD (Player HP header row), outside the game screen; corners = over the game screen. */
export type BackpackPlacement = HudCorner | "hud";
export const INVENTORY_HUD_POSITION = "hud" as BackpackPlacement;
const POS: Record<BackpackPlacement, string> = {
  hud: "",
  "top-right": "right-1 top-7 sm:top-10",
  "top-left": "left-1 top-14 sm:top-20",
  "bottom-right": "right-1 bottom-1",
  "bottom-left": "left-1 bottom-1",
};

function BagIcon() {
  // Supplied red-white rucksack artwork (canonical inventory icon).
  return <img src={rucksack} alt="" draggable={false} className="h-12 w-12 sm:h-14 sm:w-14 object-contain" style={{ imageRendering: "pixelated" }} />;
}

export function Backpack({ onOpenChange, onUse, slot }: { onOpenChange: (open: boolean) => void; onUse: (id: ItemId) => string | null; slot: "overlay" | "hud" }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [inv, setInv] = useState(getInventory());
  const busy = useRef(false);
  useEffect(() => subscribeInventory(setInv), []);
  useEffect(() => { onOpenChange(open); if (!open) setMsg(null); }, [open, onOpenChange]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [open]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const act = (id: ItemId) => {
    if (busy.current) return;
    busy.current = true;
    if (ITEM_DEFS[id].action === "EQUIP") { equipItem(id); setMsg(null); } else setMsg(onUse(id));
    setTimeout(() => { busy.current = false; }, 250);
  };
  const owned = (Object.keys(inv.items) as ItemId[]).filter((id) => (inv.items[id] ?? 0) > 0);
  const section = (kind: "weapon" | "consumable", title: string) => {
    const list = owned.filter((id) => ITEM_DEFS[id].kind === kind);
    if (!list.length) return null;
    return (
      <div className="mt-1.5">
        <div className="text-[9px] sm:text-[10px] text-primary tracking-widest">{title}</div>
        {list.map((id) => (
          <div key={id} className="flex items-center justify-between gap-2 py-0.5">
            <img src={ITEM_ICONS[id]} alt="" className="h-5 w-6 shrink-0 object-contain object-left" style={{ imageRendering: "pixelated" }} />
            <span className="flex-1 truncate text-foreground">{ITEM_DEFS[id].name}{(inv.items[id] ?? 0) > 1 ? ` x${inv.items[id]}` : ""}{ITEM_DEFS[id].action === "EQUIP" ? <span className="text-muted-foreground"> · {weaponHitsLeft(id)} HITS</span> : null}</span>
            <button type="button" onClick={() => act(id)}
              className="shrink-0 border border-primary px-1.5 py-0.5 text-[9px] sm:text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
              {ITEM_DEFS[id].action === "EQUIP" && inv.equipped === id ? "EQUIPPED" : ITEM_DEFS[id].action}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const inHud = INVENTORY_HUD_POSITION === "hud";
  if ((slot === "hud") !== inHud) return null;
  const right = inHud || INVENTORY_HUD_POSITION.endsWith("right");
  const below = !inHud && INVENTORY_HUD_POSITION.startsWith("top");
  return (
    <div className={`${inHud ? "relative shrink-0" : `absolute ${POS[INVENTORY_HUD_POSITION]}`} z-40 font-mono font-bold`}
      onPointerDown={stop} onTouchStart={stop} onMouseDown={stop} onKeyDown={stop}>
      <button type="button" aria-label="Inventory" aria-expanded={open} data-testid="backpack-button"
        onClick={() => setOpen((o) => !o)}
        className="block touch-manipulation transition-transform hover:scale-105 active:scale-95">
        <BagIcon />
      </button>
      {open && (
        <div role="dialog" aria-label="Inventory" data-testid="inventory-panel"
          className={`absolute ${right ? "right-0" : "left-0"} ${below ? "top-full mt-1" : "bottom-full mb-1"} w-[min(13rem,calc(100vw-1rem))] max-h-[60svh] overflow-y-auto bg-background/95 border-2 border-primary rounded p-2 text-[10px] sm:text-xs shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="tracking-widest text-foreground">INVENTORY</span>
            <button type="button" aria-label="Close inventory" onClick={() => setOpen(false)}
              className="border border-muted-foreground px-1 text-muted-foreground hover:text-foreground">X</button>
          </div>
          {owned.length === 0
            ? <div className="mt-2 text-muted-foreground tracking-wider">INVENTORY EMPTY</div>
            : <>{section("weapon", "EQUIPMENT")}{section("consumable", "CONSUMABLES")}</>}
          {msg && <div className="mt-1.5 text-primary tracking-wider" data-testid="inventory-msg">{msg}</div>}
        </div>
      )}
    </div>
  );
}
