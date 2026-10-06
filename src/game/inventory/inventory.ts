/**
 * Persistent player inventory (separate from score). Items are added by the
 * future Doxx Lucky Dip; the backpack UI only reads/calls these functions.
 */
export type ItemId = "sidearm" | "gauntlets" | "dobermann" | "health";
export type ItemKind = "weapon" | "consumable";

export const ITEM_DEFS: Record<ItemId, { name: string; kind: ItemKind; action: "EQUIP" | "USE" }> = {
  sidearm: { name: "RED-WHITE SIDEARM", kind: "weapon", action: "EQUIP" },
  gauntlets: { name: "SPIKED COMBAT GAUNTLETS", kind: "weapon", action: "EQUIP" },
  dobermann: { name: "DOBERMANN SUPPORT", kind: "weapon", action: "USE" },
  health: { name: "HEALTH RESTORE ITEM", kind: "consumable", action: "USE" },
};

const KEY = "sogInventory_v2";
interface InvData { items: Partial<Record<ItemId, number>>; equipped: ItemId | null }
type Listener = (d: Readonly<InvData>) => void;

function load(): InvData {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    if (p && typeof p === "object") {
      const items: InvData["items"] = {};
      for (const id of Object.keys(ITEM_DEFS) as ItemId[]) {
        const n = Number(p.items?.[id]);
        if (Number.isFinite(n) && n > 0) items[id] = Math.floor(n);
      }
      const equipped = p.equipped && items[p.equipped as ItemId] ? (p.equipped as ItemId) : null;
      return { items, equipped };
    }
  } catch { /* fresh */ }
  return { items: {}, equipped: null };
}

let data: InvData = typeof localStorage !== "undefined" ? load() : { items: {}, equipped: null };
const listeners = new Set<Listener>();
function commit() {
  data = { items: { ...data.items }, equipped: data.equipped };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* unavailable */ }
  listeners.forEach((l) => l(data));
}

export function getInventory(): Readonly<InvData> { return data; }
export function addItem(id: ItemId, qty = 1): void { data.items[id] = (data.items[id] ?? 0) + qty; commit(); }
export function equipItem(id: ItemId): boolean {
  if (!data.items[id] || ITEM_DEFS[id].action !== "EQUIP") return false;
  data.equipped = data.equipped === id ? null : id; commit(); return true;
}
/** Consumes exactly one; returns false if none owned (idempotent guard). */
export function useItem(id: ItemId): boolean {
  const n = data.items[id] ?? 0;
  if (n <= 0 || ITEM_DEFS[id].action !== "USE") return false;
  if (n === 1) delete data.items[id]; else data.items[id] = n - 1;
  commit(); return true;
}
export function subscribeInventory(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
