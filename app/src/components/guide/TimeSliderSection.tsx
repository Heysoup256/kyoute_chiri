import {
  ArrowDownRight,
  ArrowUpRight,
  Globe2,
  History,
  MapPin,
  Pause,
  Play,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  CountryData,
  TimeSeriesSliderItem,
  TimeSliderCategory,
} from '../../types/schema_v1';

interface TimeSliderSectionProps {
  sliders: TimeSeriesSliderItem[];
  countriesData?: Record<string, CountryData>;
  onSelectCountry: (iso3: string) => void;
}

type CatFilter = 'all' | TimeSliderCategory;

const CAT_CHIPS: { id: CatFilter; label: string; badge: string }[] = [
  { id: 'all', label: 'すべて', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'trade', label: '貿易・輸出品', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'energy', label: '電源・エネルギー', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'agriculture', label: '農林・水産・資源', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'industry', label: '鉄鋼・自動車・半導体', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'population', label: '人口・都市・日本統計', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
];

function getCatMeta(cat: TimeSliderCategory) {
  return CAT_CHIPS.find((c) => c.id === cat) ?? CAT_CHIPS[1];
}

/**
 * 時代変化スライダーセクション（26テーマの時系列ランキング・構成比推移を自動再生・手動操作で可視化）
 */
export function TimeSliderSection({
  sliders,
  countriesData,
  onSelectCountry,
}: TimeSliderSectionProps) {
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [activeState, setActiveState] = useState<{ sliderId: string; frameIdx: number }>(() => ({
    sliderId: sliders[0]?.id ?? '',
    frameIdx: 0,
  }));
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredSliders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return sliders.filter((s) => {
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (!kw) return true;
      const hay = `${s.title} ${s.subtitle} ${s.shiftSummary} ${s.frames.map((f) => f.items.map((i) => i.label).join(' ')).join(' ')}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [sliders, catFilter, keyword]);

  const activeSlider =
    filteredSliders.find((s) => s.id === activeState.sliderId) ??
    filteredSliders[0] ??
    sliders[0];

  const maxFrameIdx = activeSlider ? Math.max(0, activeSlider.frames.length - 1) : 0;
  const safeFrameIdx =
    activeSlider && activeSlider.id === activeState.sliderId
      ? Math.min(maxFrameIdx, Math.max(0, activeState.frameIdx))
      : 0;

  useEffect(() => {
    if (!isPlaying || !activeSlider || maxFrameIdx <= 0) return;
    const timer = window.setInterval(() => {
      setActiveState((prev) => {
        const curIdx = prev.sliderId === activeSlider.id ? prev.frameIdx : 0;
        const nextIdx = curIdx >= maxFrameIdx ? 0 : curIdx + 1;
        return { sliderId: activeSlider.id, frameIdx: nextIdx };
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeSlider, maxFrameIdx]);

  const globalMaxValue = useMemo(() => {
    if (!activeSlider) return 100;
    const vals = activeSlider.frames.flatMap((f) => f.items.map((it) => Math.abs(it.value)));
    return Math.max(1, ...vals);
  }, [activeSlider]);

  if (!sliders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
        時代変化スライダーデータを読み込み中です...
      </div>
    );
  }

  const currentFrame = activeSlider?.frames[safeFrameIdx];
  const prevFrame = safeFrameIdx > 0 ? activeSlider?.frames[safeFrameIdx - 1] : null;
  const catMeta = activeSlider ? getCatMeta(activeSlider.category) : CAT_CHIPS[0];

  const handleSelectSlider = (sid: string) => {
    setIsPlaying(false);
    setActiveState({ sliderId: sid, frameIdx: 0 });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー・カテゴリ＆検索 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 md:text-sm">
                時代変化スライダー（全{sliders.length}テーマ）
              </h2>
              <p className="text-[11px] text-slate-500">
                スライダーや自動再生で年代を動かし、順位交代や構成比の構造変化を視覚的に確認できます
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setIsPlaying(false);
                setKeyword(e.target.value);
              }}
              placeholder="テーマ・品目・国名で検索（例: 半導体, 原発）"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CAT_CHIPS.map((ch) => {
            const count =
              ch.id === 'all' ? sliders.length : sliders.filter((s) => s.category === ch.id).length;
            const active = catFilter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCatFilter(ch.id);
                }}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {ch.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2ペイン本体：テーマ一覧＋スライダービュー */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[310px_1fr]">
        {/* 左：テーマ一覧 */}
        <div className="max-h-[300px] space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs lg:max-h-[680px]">
          {filteredSliders.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">一致するテーマがありません。</p>
          ) : (
            filteredSliders.map((s) => {
              const isSel = s.id === activeSlider?.id;
              const cm = getCatMeta(s.category);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSlider(s.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isSel
                      ? 'border-indigo-500 bg-indigo-50/90 ring-1 ring-indigo-300'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`rounded-full border px-1.5 py-0.2 text-[9.5px] font-bold ${cm.badge}`}>
                      {cm.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {s.frames[0]?.yearLabel} → {s.frames[s.frames.length - 1]?.yearLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-extrabold leading-snug text-slate-900">
                    {s.title}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 右：選択中スライダーのチャートと操作 */}
        {activeSlider && currentFrame && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${catMeta.badge}`}>
                  {catMeta.label}
                </span>
                <span className="text-[11px] text-slate-400">出典: {activeSlider.source}</span>
              </div>
              <h3 className="mt-1.5 text-base font-black text-slate-900 md:text-lg">
                {activeSlider.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">{activeSlider.subtitle}</p>
            </div>

            {/* スライダー操作バー */}
            <div className="space-y-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white shadow-2xs transition ${
                      isPlaying
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isPlaying ? '停止' : '自動再生'}
                  </button>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-indigo-900 shadow-2xs">
                    表示中: {currentFrame.yearLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {activeSlider.frames.map((frItem, idx) => (
                    <button
                      key={frItem.yearLabel}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveState({ sliderId: activeSlider.id, frameIdx: idx });
                      }}
                      className={`rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                        idx === safeFrameIdx
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50'
                      }`}
                    >
                      {frItem.yearLabel}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={maxFrameIdx}
                step={1}
                value={safeFrameIdx}
                onChange={(e) => {
                  setIsPlaying(false);
                  setActiveState({
                    sliderId: activeSlider.id,
                    frameIdx: Number(e.target.value),
                  });
                }}
                aria-label="表示年代スライダー"
                className="h-2 w-full cursor-pointer accent-indigo-600"
              />

              <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-slate-800">
                {currentFrame.periodNote}
              </p>
            </div>

            {/* 帯グラフ (stacked_share時) */}
            {activeSlider.displayMode === 'stacked_share' && (
              <div className="space-y-1.5">
                <div className="flex h-6 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {currentFrame.items.map((it) => {
                    const total =
                      currentFrame.items.reduce((acc, x) => acc + Math.max(0, x.value), 0) || 100;
                    const pct = Math.max(0, (it.value / total) * 100);
                    return (
                      <div
                        key={it.label}
                        className="flex h-full items-center justify-center overflow-hidden text-[10px] font-extrabold text-white transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: it.color ?? '#4f46e5',
                        }}
                        title={`${it.label}: ${it.value}${activeSlider.unit}`}
                      >
                        {pct >= 11 ? `${Math.round(it.value)}%` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 各項目バー＋前期比較差分 */}
            <div className="space-y-2.5">
              {currentFrame.items.map((it, idx) => {
                const barWidth = Math.max(
                  4,
                  Math.min(100, (Math.abs(it.value) / globalMaxValue) * 100),
                );
                const prevMatch = prevFrame?.items.find((p) =>
                  it.iso3 && p.iso3 ? p.iso3 === it.iso3 : p.label === it.label,
                );
                const diff = prevMatch != null ? Number((it.value - prevMatch.value).toFixed(2)) : null;

                return (
                  <div key={`${it.label}-${idx}`} className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10.5px] font-bold text-slate-700">
                          {idx + 1}
                        </span>
                        {it.iso3 ? (
                          <button
                            type="button"
                            onClick={() => onSelectCountry(it.iso3!)}
                            className="inline-flex items-center gap-0.5 truncate font-extrabold text-indigo-800 hover:underline"
                          >
                            {it.label}
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="truncate font-extrabold text-slate-900">{it.label}</span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 font-mono text-xs font-extrabold text-slate-800">
                        {diff !== null && diff !== 0 && (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              diff > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {diff > 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                        <span>
                          {it.value.toLocaleString('ja-JP')} {activeSlider.unit}
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: it.color ?? '#4f46e5',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 構造変化のまとめ＆関連国 */}
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-[11px] font-extrabold text-slate-700">
                歴史的推移・地理的背景の整理
              </div>
              <p className="text-xs leading-relaxed text-slate-700">{activeSlider.shiftSummary}</p>

              {activeSlider.relatedIso3s.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Globe2 className="h-3.5 w-3.5 text-indigo-600" />
                    関連国を地図で確認:
                  </span>
                  {activeSlider.relatedIso3s.map((iso) => {
                    const label = countriesData?.[iso]?.nameJa.split('（')[0] ?? iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => onSelectCountry(iso)}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        <MapPin className="h-3 w-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

