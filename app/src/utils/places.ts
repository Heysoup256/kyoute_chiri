import type { PlaceEntry } from '../types/schema_v1';

export interface PlaceMatcher {
  regex: RegExp;
  lookup: Map<string, PlaceEntry>;
}

const KATAKANA_RE = /[\u30A1-\u30FA\u30FC-\u30FF]/;
const KATAKANA_CLASS = '[\\u30A1-\\u30FA\\u30FC-\\u30FF]';

/**
 * 説明文中の登録地名・地形・農業帯等を高速検索するためのマッチャーを構築。
 * カタカナ語の部分一致誤爆（「オランダ」内の「オラン」、「カリブ」内の「カリ」等）を
 * 前後のカタカナ境界判定（Lookaround）で防止する。
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
  const patterns = sortedTerms.map((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefix = KATAKANA_RE.test(t[0]) ? `(?<!${KATAKANA_CLASS})` : '';
    const suffix = KATAKANA_RE.test(t[t.length - 1]) ? `(?!${KATAKANA_CLASS})` : '';
    return `${prefix}${escaped}${suffix}`;
  });
  return {
    regex: new RegExp(`(${patterns.join('|')})`, 'g'),
    lookup,
  };
}
