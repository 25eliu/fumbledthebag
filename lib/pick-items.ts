import type { Item, PickedItem, Scale } from "@/lib/types";
import { ITEMS } from "@/data/items";

const SCALES: Scale[] = ["everyday", "aspirational", "flex", "absurd"];

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickItems(
  amount: number,
  seed: string,
  exclude: string[] = [],
  count = 3
): PickedItem[] {
  const rng = mulberry32(hashSeed(seed));
  const affordable = ITEMS.filter(
    (it) => !exclude.includes(it.name) && Math.floor(amount / it.price) >= 1
  );
  if (affordable.length === 0) return [];

  const picked: Item[] = [];
  // Prefer one item per scale (in a seeded-random scale order).
  for (const scale of shuffle(SCALES, rng)) {
    if (picked.length >= count) break;
    const candidates = shuffle(affordable.filter((it) => it.scale === scale && !picked.includes(it)), rng);
    if (candidates.length) picked.push(candidates[0]);
  }
  // Fill any remaining slots from whatever's left.
  for (const it of shuffle(affordable.filter((it) => !picked.includes(it)), rng)) {
    if (picked.length >= count) break;
    picked.push(it);
  }

  return picked.slice(0, count).map((it) => ({ ...it, qty: Math.floor(amount / it.price) }));
}
