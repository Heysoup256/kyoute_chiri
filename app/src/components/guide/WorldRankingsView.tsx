import * as echarts from 'echarts';
import type { FeatureCollection, Geometry } from 'geojson';
import {
  AlertTriangle,
  BarChart3,
  Factory,
  Fuel,
  LineChart,
  Map as MapIcon,
  MapPin,
  Route,
  Search,
  Users,
  Wheat,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  GeoCountryProperties,
  JapanDomesticStats,
  RankingCategory,
  RankingEntry,
  WorldRankingItem,
  WorldRankingsDataset,
  WorldScatterChart,
} from '../../types/schema_v1';
import { GuideChartCard } from './GuideChartCard';
import { JapanDomesticStatsSection } from './JapanDomesticStatsSection';
import { WorldFlowMapCard } from './WorldFlowMapCard';

interface WorldRankingsViewProps {
  dataset: WorldRankingsDataset | null;
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  japanDomesticStats?: JapanDomesticStats | null;
  focusedItemId?: string | null;
  onSelectCountry: (iso3: string) => void;
  onHighlightCountries: (label: string, iso3s: string[]) => void;
}

type RankingsMainTab = 'rankings' | 'charts' | 'flows' | 'japan_stats';
type CategoryFilter = 'all' | RankingCategory;

const MAIN_TABS: { id: RankingsMainTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'rankings', label: '品目ランキング', icon: BarChart3 },
  { id: 'charts', label: '比較グラフ＆散布図', icon: LineChart },
  { id: 'flows', label: '国際移動フロー地図', icon: Route },
  { id: 'japan_stats', label: '日本国内統計', icon: MapIcon },
];

const CATEGORY_CHIPS: { id: CategoryFilter; label: string; icon: typeof BarChart3 }[] = [
  { id: 'all', label: 'すべて', icon: BarChart3 },
  { id: 'agriculture', label: '農林水産', icon: Wheat },
  { id: 'resource', label: '資源・発電', icon: Fuel },
  { id: 'industry', label: '工業・貿易', icon: Factory },
  { id: 'society', label: '人口・生活・観光', icon: Users },
];

const CATEGORY_META: Record<
  RankingCategory,
  { label: string; badgeClass: string; barColor: string }
> = {
  agriculture: {
    label: '農林水産',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  resource: {
    label: '資源・発電',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    barColor: 'bg-amber-500',
  },
  industry: {
    label: '工業・貿易',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    barColor: 'bg-indigo-500',
  },
  society: {
    label: '人口・生活・観光',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    barColor: 'bg-rose-500',
  },
};

function ScatterPlotCard({
  chart,
  onSelectCountry,
  onHighlightAll,
}: {
  chart: WorldScatterChart;
  onSelectCountry: (iso3: string) => void;
  onHighlightAll: (label: string, iso3s: string[]) => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const instance = echarts.init(el);

    const groups = new Map<string, typeof chart.points>();
    for (const pt of chart.points) {
      if (!groups.has(pt.group)) groups.set(pt.group, []);
      groups.get(pt.group)!.push(pt);
    }

    const xs = chart.points.map((p) => p.x);
    const ys = chart.points.map((p) => p.y);
    const minX = Math.min(0, Math.floor(Math.min(...xs) * 1.1));
    const maxX = Math.ceil(Math.max(...xs) * 1.14);
    const minY = Math.min(0, Math.floor(Math.min(...ys) * 1.1));
    const maxY = Math.ceil(Math.max(...ys) * 1.16);

    const option: echarts.EChartsOption = {
      animationDuration: 300,
      // 凡例と縦軸ラベル・横軸ラベルの重なりを防止するため十分な余白を確保
      grid: { left: 64, right: 24, top: 48, bottom: 52 },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data?: { raw?: (typeof chart.points)[number] } };
          const raw = p.data?.raw;
          if (!raw) return '';
          return `
            <div style="max-width:220px;white-space:normal;font-size:12px;">
              <b>${raw.nameJa}</b>（${raw.group}）<br/>
              値: (${raw.x}, ${raw.y})<br/>
              <span style="color:#475569">${raw.note ?? ''}</span>
            </div>
          `;
        },
      },
      legend: {
        top: 2,
        left: 'center',
        type: 'scroll',
        pageIconSize: 10,
        textStyle: { fontSize: 10.5, color: '#334155' },
        itemWidth: 10,
        itemHeight: 10,
      },
      xAxis: {
        type: 'value',
        name: chart.xLabel,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { fontSize: 10.5, fontWeight: 'bold', color: '#475569' },
        min: minX,
        max: maxX,
        axisLabel: { fontSize: 10, color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        name: chart.yLabel,
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 48,
        nameTextStyle: { fontSize: 10.5, fontWeight: 'bold', color: '#475569' },
        min: minY,
        max: maxY,
        axisLabel: { fontSize: 10, color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      series: Array.from(groups.entries()).map(([grp, pts]) => ({
        name: grp,
        type: 'scatter' as const,
        symbolSize: 11,
        itemStyle: {
          color: pts[0]?.color ?? '#4f46e5',
          borderColor: '#ffffff',
          borderWidth: 1.5,
        },
        label: {
          show: true,
          position: 'top' as const,
          formatter: (par: unknown) => {
            const d = par as { data?: { raw?: { nameJa?: string } } };
            return d.data?.raw?.nameJa ?? '';
          },
          fontSize: 10,
          fontWeight: 'bold',
          color: '#1e293b',
        },
        labelLayout: {
          hideOverlap: true,
        },
        data: pts.map((pt) => ({
          value: [pt.x, pt.y],
          raw: pt,
        })),
      })),
    };

    instance.setOption(option);
    instance.on('click', (params: unknown) => {
      const p = params as { data?: { raw?: (typeof chart.points)[number] } };
      if (p.data?.raw?.iso3) {
        setSelectedIso(p.data.raw.iso3);
      }
    });

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
    };
  }, [chart]);

  const activePoint = chart.points.find((p) => p.iso3 === selectedIso);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 md:text-base">{chart.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{chart.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onHighlightAll(
              chart.title,
              chart.points.map((p) => p.iso3),
            )
          }
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
        >
          <MapPin className="h-3.5 w-3.5" />
          登場国を地図でハイライト
        </button>
      </div>

      <div ref={elRef} className="mt-3 h-[330px] w-full md:h-[370px]" />

      {activePoint && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs">
          <div>
            <span className="font-extrabold text-indigo-900">{activePoint.nameJa}</span>
            <span className="ml-2 text-slate-600">{activePoint.note}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCountry(activePoint.iso3)}
            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
          >
            この国の詳細を見る
          </button>
        </div>
      )}

      {/* 4象限解説 */}
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        {chart.quadrants.map((qText, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700"
          >
            {qText}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-extrabold">共テ判別の鉄則：</span>
          {chart.examPoint}
        </div>
      </div>
    </section>
  );
}

function RankingBars({
  entries,
  unit,
  barColor,
  onSelectCountry,
}: {
  entries: RankingEntry[];
  unit: string;
  barColor: string;
  onSelectCountry: (iso3: string) => void;
}) {
  const maxVal = Math.max(...entries.map((e) => e.value), 1);
  return (
    <div className="space-y-1.5">
      {entries.map((ent, idx) => {
        const widthPct = Math.max(6, Math.round((ent.value / maxVal) * 100));
        return (
          <button
            key={`${ent.iso3}-${ent.nameJa}-${idx}`}
            type="button"
            onClick={() => onSelectCountry(ent.iso3)}
            className="group block w-full rounded-lg border border-transparent p-1.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex items-baseline justify-between gap-2 text-xs">
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
                <span className="truncate font-bold text-slate-900 group-hover:text-indigo-700">
                  {ent.nameJa}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-bold text-slate-700">
                {ent.value.toLocaleString()} {unit}
                {ent.sharePct != null && (
                  <span className="ml-1 text-[10px] font-semibold text-slate-500">
                    ({ent.sharePct}%)
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            {ent.note && (
              <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">{ent.note}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RankingCard({
  item,
  isFocused,
  onSelectCountry,
  onHighlightCountries,
}: {
  item: WorldRankingItem;
  isFocused: boolean;
  onSelectCountry: (iso3: string) => void;
  onHighlightCountries: (label: string, iso3s: string[]) => void;
}) {
  const [viewSet, setViewSet] = useState<'primary' | 'secondary'>('primary');
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.industry;
  const hasSecondary = Boolean(item.secondaryTop && item.secondaryTop.length > 0);
  const currentEntries =
    viewSet === 'secondary' && item.secondaryTop ? item.secondaryTop : item.primaryTop;
  const currentLabel =
    viewSet === 'secondary' && item.secondaryLabel ? item.secondaryLabel : item.primaryLabel;

  return (
    <article
      id={`ranking-${item.id}`}
      className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition ${
        isFocused ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
              <span className="text-[10px] text-slate-400">
                {item.source}（{item.dataYear}）
              </span>
            </div>
            <h3 className="mt-1 text-sm font-extrabold text-slate-900 md:text-[15px]">
              {item.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              onHighlightCountries(
                `${item.title.split('（')[0]}：${currentLabel}`,
                Array.from(new Set(currentEntries.map((e) => e.iso3))),
              )
            }
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100"
            title="上位国を世界地図上でハイライト表示"
          >
            <MapPin className="h-3 w-3" />
            地図で分布
          </button>
        </div>

        {/* 生産 vs 輸出 等の切替 */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewSet('primary')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
              viewSet === 'primary'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.primaryLabel}
          </button>
          {hasSecondary && item.secondaryLabel && (
            <button
              type="button"
              onClick={() => setViewSet('secondary')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                viewSet === 'secondary'
                  ? 'bg-cyan-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.secondaryLabel}
            </button>
          )}
        </div>

        <div className="mt-2.5">
          <RankingBars
            entries={currentEntries}
            unit={item.unit}
            barColor={viewSet === 'secondary' ? 'bg-cyan-600' : meta.barColor}
            onSelectCountry={onSelectCountry}
          />
        </div>
      </div>

      {/* 共テ引っ掛け・判別ポイント */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/75 p-2.5 text-[11.5px] leading-relaxed text-amber-950">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
        <div>
          <span className="font-extrabold">共テ鉄則：</span>
          {item.examTrap}
        </div>
      </div>
    </article>
  );
}

/**
 * 共通テスト統計データブック＆ランキングビュー
 * （52品目ランキング・主要国比較グラフ＆4象限散布図・太さ可変矢印の国際移動フロー地図・日本国内統計）
 */
export function WorldRankingsView({
  dataset,
  countriesGeoJson,
  japanDomesticStats,
  focusedItemId,
  onSelectCountry,
  onHighlightCountries,
}: WorldRankingsViewProps) {
  const [mainTab, setMainTab] = useState<RankingsMainTab>('rankings');
  const [catFilter, setCatFilter] = useState<CategoryFilter>('all');
  const [filterText, setFilterText] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');

  useEffect(() => {
    if (!focusedItemId) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`ranking-${focusedItemId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focusedItemId]);

  const filteredItems = useMemo(() => {
    if (!dataset) return [];
    const kw = filterText.trim().toLowerCase();
    return dataset.items.filter((item) => {
      if (catFilter !== 'all' && item.category !== catFilter) {
        return false;
      }
      if (!kw) return true;
      const hay = [
        item.title,
        item.examTrap,
        item.tags.join(' '),
        item.primaryTop.map((e) => e.nameJa).join(' '),
        (item.secondaryTop ?? []).map((e) => e.nameJa).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [dataset, catFilter, filterText]);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
        統計データブックを読み込み中...
      </div>
    );
  }

  const comparisonCharts = dataset.comparisonCharts ?? [];
  const flowMaps = dataset.flowMaps ?? [];
  const activeFlowMap =
    flowMaps.find((fm) => fm.id === selectedFlowId) ?? flowMaps[0] ?? null;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* サブナビ＆絞り込みバー */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {MAIN_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = mainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMainTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {mainTab === 'rankings' && (
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="品目・国名で絞り込み（例: 小麦, 銅）"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* ランキング時のカテゴリ切替チップ */}
          {mainTab === 'rankings' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {CATEGORY_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const active = catFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCatFilter(chip.id)}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold transition ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {mainTab === 'rankings' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                  品目・指標別 ランキング＆共テ判別ポイント（{filteredItems.length}項目）
                </h2>
                <span className="text-[11px] text-slate-500">
                  国名タップで詳細へ /「地図で分布」で上位国を一括ハイライト
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                  一致する統計項目がありません。別のキーワードでお試しください。
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredItems.map((item) => (
                    <RankingCard
                      key={item.id}
                      item={item}
                      isFocused={focusedItemId === item.id}
                      onSelectCountry={onSelectCountry}
                      onHighlightCountries={onHighlightCountries}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mainTab === 'charts' && (
            <div className="space-y-6">
              {comparisonCharts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                      主要国・世界地域 構成比＆時系列比較グラフ（{comparisonCharts.length}本）
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      棒グラフ・折れ線にカーソル／タップで詳細値表示
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {comparisonCharts.map((ch) => (
                      <GuideChartCard key={ch.id} spec={ch} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                    共テ必須・4象限散布図分析（{dataset.scatters.length}本）
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    点をクリックすると該当国の詳細が開きます
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {dataset.scatters.map((sc) => (
                    <ScatterPlotCard
                      key={sc.id}
                      chart={sc}
                      onSelectCountry={onSelectCountry}
                      onHighlightAll={onHighlightCountries}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {mainTab === 'flows' && (
            <div className="space-y-4">
              {flowMaps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                  国際移動フロー地図データを読み込み中です...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {flowMaps.map((fm) => {
                      const active = activeFlowMap?.id === fm.id;
                      return (
                        <button
                          key={fm.id}
                          type="button"
                          onClick={() => setSelectedFlowId(fm.id)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {fm.title.split('（')[0]}
                        </button>
                      );
                    })}
                  </div>

                  {activeFlowMap && (
                    <WorldFlowMapCard
                      key={activeFlowMap.id}
                      flowMap={activeFlowMap}
                      countriesGeoJson={countriesGeoJson}
                      onSelectCountry={onSelectCountry}
                      onHighlightCountries={onHighlightCountries}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {mainTab === 'japan_stats' && (
            <JapanDomesticStatsSection domesticStats={japanDomesticStats} />
          )}
        </div>
      </div>
    </div>
  );
}
