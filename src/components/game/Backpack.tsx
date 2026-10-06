import { useEffect, useRef, useState } from "react";
import { ITEM_DEFS, equipItem, getInventory, subscribeInventory, useItem, type ItemId } from "@/game/inventory/inventory";

/** Move the backpack by changing this one value. */
export const INVENTORY_HUD_POSITION: "top-right" | "top-left" | "bottom-right" | "bottom-left" = "top-right";
const POS: Record<typeof INVENTORY_HUD_POSITION, string> = {
  "top-right": "right-1 top-7 sm:top-10",
  "top-left": "left-1 top-14 sm:top-20",
  "bottom-right": "right-1 bottom-1",
  "bottom-left": "left-1 bottom-1",
};

function BagIcon() {
  // Original pixel-art backpack, drawn with theme colours.
  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5 sm:h-6 sm:w-6" style={{ imageRendering: "pixelated" }} shapeRendering="crispEdges" aria-hidden>
      <rect x="5" y="1" width="6" height="2" className="fill-muted-foreground" />
      <rect x="4" y="3" width="8" height="1" className="fill-muted-foreground" />
      <rect x="3" y="4" width="10" height="11" className="fill-primary" />
      <rect x="3" y="7" width="10" height="1" className="fill-primary-foreground/60" />
      <rect x="5" y="9" width="6" height="4" className="fill-background/70" />
      <rect x="7" y="10" width="2" height="1" className="fill-accent" />
    </svg>
  );
}

export function Backpack({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [inv, setInv] = useState(getInventory());
  const busy = useRef(false);
  useEffect(() => subscribeInventory(setInv), []);
  useEffect(() => { onOpenChange(open); }, [open, onOpenChange]);
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
    if (ITEM_DEFS[id].action === "EQUIP") equipItem(id); else useItem(id);
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
            <span className="truncate text-foreground">{ITEM_DEFS[id].name}{(inv.items[id] ?? 0) > 1 ? ` x${inv.items[id]}` : ""}</span>
            <button type="button" onClick={() => act(id)}
              className="shrink-0 border border-primary px-1.5 py-0.5 text-[9px] sm:text-[10px] text-primary hover:bg-primary hover:text-primary-foreground">
              {ITEM_DEFS[id].action === "EQUIP" && inv.equipped === id ? "EQUIPPED" : ITEM_DEFS[id].action}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`absolute ${POS[INVENTORY_HUD_POSITION]} z-40 font-mono font-bold`}
      onPointerDown={stop} onTouchStart={stop} onMouseDown={stop} onKeyDown={stop}>
      <button type="button" aria-label="Inventory" aria-expanded={open} data-testid="backpack-button"
        onClick={() => setOpen((o) => !o)}
        className="block bg-background/80 border border-primary/60 rounded p-0.5 touch-manipulation">
        <BagIcon />
      </button>
      {open && (
        <div role="dialog" aria-label="Inventory" data-testid="inventory-panel"
          className={`absolute ${INVENTORY_HUD_POSITION.endsWith("right") ? "right-0" : "left-0"} ${INVENTORY_HUD_POSITION.startsWith("top") ? "top-full mt-1" : "bottom-full mb-1"} w-[min(13rem,calc(100vw-1rem))] max-h-[60svh] overflow-y-auto bg-background/95 border-2 border-primary rounded p-2 text-[10px] sm:text-xs shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="tracking-widest text-foreground">INVENTORY</span>
            <button type="button" aria-label="Close inventory" onClick={() => setOpen(false)}
              className="border border-muted-foreground px-1 text-muted-foreground hover:text-foreground">X</button>
          </div>
          {owned.length === 0
            ? <div className="mt-2 text-muted-foreground tracking-wider">INVENTORY EMPTY</div>
            : <>{section("weapon", "WEAPONS")}{section("consumable", "CONSUMABLES")}</>}
        </div>
      )}
    </div>
  );
}
