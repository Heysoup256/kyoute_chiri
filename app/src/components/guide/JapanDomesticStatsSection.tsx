import { AlertTriangle, BarChart3, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { JapanDomesticStats } from '../../types/schema_v1';
import { GuideChartCard } from './GuideChartCard';

interface JapanDomesticStatsSectionProps {
  domesticStats: JapanDomesticStats | null | undefined;
}

/**
 * 日本国内統計（工業地帯構成・電源推移・食料自給率・都道府県別ランキング）セクション
 * 「統計」タブおよび「日本」タブの双方から共通表示する。
 */
export function JapanDomesticStatsSection({
  domesticStats,
}: JapanDomesticStatsSectionProps) {
  const [selectedCat, setSelectedCat] = useState<string>('すべて');
  const [filterKw, setFilterKw] = useState('');

  const categories = useMemo(() => {
    if (!domesticStats) return ['すべて'];
    const set = new Set<string>(['すべて']);
    for (const r of domesticStats.prefRankings) {
      set.add(r.category);
    }
    return Array.from(set);
  }, [domesticStats]);

  const filteredRankings = useMemo(() => {
    if (!domesticStats) return [];
    const kw = filterKw.trim().toLowerCase();
    return domesticStats.prefRankings.filter((item) => {
      if (selectedCat !== 'すべて' && item.category !== selectedCat) return false;
      if (!kw) return true;
      const hay = `${item.title} ${item.category} ${item.examTrap} ${item.entries
        .map((e) => `${e.pref} ${e.note ?? ''}`)
        .join(' ')}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [domesticStats, selectedCat, filterKw]);

  if (!domesticStats) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
        日本国内統計データを読み込み中です...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. 日本の構造比較グラフ群 */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-slate-600 uppercase">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            日本の産業・エネルギー・食料・貿易グラフ（{domesticStats.charts.length}本）
          </h2>
          <span className="text-[11px] text-slate-500">
            各グラフ項目にカーソル／タップで数値詳細表示
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {domesticStats.charts.map((ch) => (
            <GuideChartCard key={ch.id} spec={ch} />
          ))}
        </div>
      </section>

      {/* 2. 都道府県・主要港別ランキング */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold tracking-wide text-slate-600 uppercase">
            都道府県別・主要港別 頻出統計ランキング（{filteredRankings.length}項目）
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
                    selectedCat === cat
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-52">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterKw}
                onChange={(e) => setFilterKw(e.target.value)}
                placeholder="県名・品目で絞り込み"
                className="w-full rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRankings.map((item) => {
            const maxVal = Math.max(...item.entries.map((e) => e.value), 1);
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.source}（{item.dataYear}）
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-extrabold text-slate-900">{item.title}</h3>

                  <div className="mt-2.5 space-y-2">
                    {item.entries.map((ent, idx) => {
                      const pct = Math.max(7, Math.round((ent.value / maxVal) * 100));
                      return (
                        <div key={`${ent.pref}-${idx}`} className="text-xs">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-extrabold ${
                                  idx === 0
                                    ? 'bg-amber-400 text-amber-950'
                                    : idx <= 2
                                      ? 'bg-slate-700 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="truncate font-bold text-slate-900">{ent.pref}</span>
                            </div>
                            <span className="shrink-0 font-mono text-[11px] font-bold text-slate-700">
                              {ent.value.toLocaleString()} {item.unit}
                              {ent.sharePct != null && (
                                <span className="ml-1 text-[10px] font-semibold text-slate-500">
                                  ({ent.sharePct}%)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {ent.note && (
                            <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">
                              {ent.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/75 p-2.5 text-[11.5px] leading-relaxed text-amber-950">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-extrabold">共テ鉄則：</span>
                    {item.examTrap}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
