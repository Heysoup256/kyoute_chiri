import type { PlaceEntry } from '../types/schema_v1';

export interface PlaceMatcher {
  regex: RegExp;
  lookup: Map<string, PlaceEntry>;
}

/**
 * 説明文中の登録地名・地形・農業帯等を高速検索するためのマッチャーを構築
 */
export function buildPlaceMatcher(places: PlaceEntry[]): PlaceMatcher | null {
  const lookup = new Map<string, PlaceEntry>();
  for (const p of places) {
    const candidates = [p.name, ...(p.aliases ?? [])];
    for (const raw of candidates) {
      const term = raw.trim();
      if (term.length < 2) continue;
      if (!lookup.has(term)) {
        lookup.set(term, p);
      }
    }
  }
  const sortedTerms = [...lookup.keys()].sort((a, b) => b.length - a.length);
  if (sortedTerms.length === 0) return null;
  const escaped = sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return {
    regex: new RegExp(`(${escaped.join('|')})`, 'g'),
    lookup,
  };
}
