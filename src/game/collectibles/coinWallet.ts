/**
 * Persistent coin wallet + collected-glass ledger. Completely separate from
 * score/high score. Future inventory: `spendCoins(cost)` → add item.
 */
export const GLASS_COIN_VALUE = 10;
const KEY = "sogCoinWallet_v1";

interface WalletData { coins: number; collected: string[] }
type Listener = (s: Readonly<WalletData>) => void;

let data: WalletData = load();
const collectedSet = new Set(data.collected);
const listeners = new Set<Listener>();

function load(): WalletData {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      const collected = Array.isArray(p.collected) ? [...new Set<string>(p.collected.filter((x: unknown) => typeof x === "string"))] : [];
      const coins = Number.isFinite(p.coins) && p.coins >= 0 ? Math.floor(p.coins) : collected.length * GLASS_COIN_VALUE;
      return { coins, collected };
    }
  } catch { /* corrupted save → fresh wallet */ }
  return { coins: 0, collected: [] };
}

function commit(): void {
  data = { coins: data.coins, collected: [...collectedSet] };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l(data));
}

export function getCoins(): number { return data.coins; }
export function isGlassCollected(id: string): boolean { return collectedSet.has(id); }
export function collectedCount(ids: readonly string[]): number { return ids.filter((id) => collectedSet.has(id)).length; }

/** Atomic + idempotent: returns true only the first time an id is claimed. */
export function claimGlass(id: string): boolean {
  if (collectedSet.has(id)) return false;
  collectedSet.add(id);
  data.coins += GLASS_COIN_VALUE;
  commit();
  return true;
}

/** For the upcoming inventory shop. Returns false (no change) if unaffordable. */
export function spendCoins(cost: number): boolean {
  if (!Number.isFinite(cost) || cost <= 0 || cost > data.coins) return false;
  data.coins -= Math.floor(cost);
  commit();
  return true;
}

export function subscribeCoins(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
