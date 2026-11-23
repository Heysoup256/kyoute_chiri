import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'kyoute_chiri_marked_v1';

function loadMarkedIso3s(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length === 3);
  } catch {
    return [];
  }
}

export function useMarkedCountries() {
  const [markedIso3s, setMarkedIso3s] = useState<string[]>(() => loadMarkedIso3s());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(markedIso3s));
    } catch {
      // localStorage が利用不可の環境では無視する
    }
  }, [markedIso3s]);

  const markedSet = useMemo(() => new Set(markedIso3s), [markedIso3s]);

  const isMarked = useCallback(
    (iso3: string) => markedSet.has(iso3),
    [markedSet]
  );

  const toggleMark = useCallback((iso3: string) => {
    setMarkedIso3s((prev) =>
      prev.includes(iso3) ? prev.filter((id) => id !== iso3) : [...prev, iso3]
    );
  }, []);

  return {
    markedIso3s,
    markedSet,
    markedCount: markedIso3s.length,
    isMarked,
    toggleMark,
  };
}
