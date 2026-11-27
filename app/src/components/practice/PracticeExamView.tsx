import type { FeatureCollection, Geometry } from 'geojson';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Layers,
  ListChecks,
  MapPin,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import { useImperativeHandle, useMemo, useState, type Ref } from 'react';
import type {
  CountryData,
  GeoCountryProperties,
  JapanGeographyDataset,
  MockQuestion,
  MockQuestionCategory,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import { ClimateMiniChart } from '../blankmap/ClimateMiniChart';
import { EqualScalePyramidSvg } from '../charts/EqualScalePyramidSvg';
import { MiniWorldMapDrillSvg } from './MiniWorldMapDrillSvg';
import {
  DRILL_GENRE_OPTIONS,
  generateDrillQuestion,
  generateMiniMockSet,
  type DrillFocusFilter,
  type DrillGenre,
  type GeneratedDrillQuestion,
  type LineTrendDrillSpec,
  type ScatterDrillSpec,
  type StackedBarDrillSpec,
} from './drillGenerator';

export interface PracticeExamHandle {
  startFocusedDrill: (filter: DrillFocusFilter) => void;
}

interface PracticeExamViewProps {
  ref?: Ref<PracticeExamHandle>;
  mockQuestions: MockQuestion[];
  worldRankings: WorldRankingsDataset | null;
  countriesData: Record<string, CountryData>;
  countriesGeoJson?: FeatureCollection<Geometry, GeoCountryProperties> | null;
  japanData?: JapanGeographyDataset | null;
  timeSliders: TimeSeriesSliderItem[];
  photoEncyclopedia: PhotoEncyclopediaEntry[];
  onSelectCountry: (iso3: string) => void;
  onOpenRanking?: (rankingId: string) => void;
  onOpenSystematic?: (topicId: string) => void;
}

type PracticeMode = 'bank' | 'drill' | 'minimock';
type BankCategoryFilter = 'all' | MockQuestionCategory;

const BANK_CAT_OPTIONS: { id: BankCategoryFilter; label: string }[] = [
  { id: 'all', label: '全分野' },
  { id: 'nature_climate', label: '自然・気候' },
  { id: 'agriculture', label: '農林水産' },
  { id: 'resource_industry', label: '資源・工業' },
  { id: 'population_urban', label: '人口・都市' },
  { id: 'culture_regional', label: '文化・地誌' },
  { id: 'map_disaster', label: '地図・防災' },
];

const CHOICE_LABELS = ['①', '②', '③', '④', '⑤', '⑥'];

function formatAxisTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${Math.round(v).toLocaleString('ja-JP')}`;
  if (Math.abs(v) >= 10) return `${Math.round(v)}`;
  return `${Number(v.toFixed(1))}`;
}

function MiniScatterPlotSvg({ spec }: { spec: ScatterDrillSpec }) {
  const allPts = [...spec.backgroundPoints, ...spec.targetPoints];
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const rawXMin = Math.min(...xs);
  const rawXMax = Math.max(...xs);
  const rawYMin = Math.min(...ys);
  const rawYMax = Math.max(...ys);

  const xSpan = Math.max(1e-6, rawXMax - rawXMin);
  const ySpan = Math.max(1e-6, rawYMax - rawYMin);
  const baseXMin = rawXMin >= 0 ? Math.max(0, rawXMin - xSpan * 0.12) : rawXMin - xSpan * 0.1;
  const baseXMax = rawXMax + xSpan * 0.14;
  const baseYMin = rawYMin >= 0 ? Math.max(0, rawYMin - ySpan * 0.12) : rawYMin - ySpan * 0.1;
  const baseYMax = rawYMax + ySpan * 0.15;

  // 同一単位の y=x 等値線（収支均衡線等）を引くときは両軸スケールを揃える
  const sharedMin = spec.showDiagonal ? Math.min(baseXMin, baseYMin) : 0;
  const sharedMax = spec.showDiagonal ? Math.max(baseXMax, baseYMax) : 0;
  const xMin = spec.showDiagonal ? sharedMin : baseXMin;
  const xMax = spec.showDiagonal ? sharedMax : baseXMax;
  const yMin = spec.showDiagonal ? sharedMin : baseYMin;
  const yMax = spec.showDiagonal ? sharedMax : baseYMax;

  const W = 380;
  const H = 240;
  const padL = 44;
  const padR = 18;
  const padT = 24;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (v: number) => padL + ((v - xMin) / Math.max(1e-6, xMax - xMin)) * plotW;
  const toY = (v: number) => padT + ((yMax - v) / Math.max(1e-6, yMax - yMin)) * plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  // 重なり回避ラベル位置計算
  const placedLabels: { x: number; y: number }[] = [];
  const labelOffsets: [number, number][] = [
    [9, -5],
    [-9, -5],
    [9, 12],
    [-9, 12],
    [0, -11],
    [0, 14],
  ];

  const resolvedTargets = spec.targetPoints.map((pt) => {
    const cx = toX(pt.x);
    const cy = toY(pt.y);
    let bestDx = 9;
    let bestDy = -5;
    let bestScore = -Infinity;

    for (const [dx, dy] of labelOffsets) {
      const lx = cx + dx;
      const ly = cy + dy;
      if (lx < padL + 8 || lx > W - padR - 8 || ly < padT + 10 || ly > H - padB - 4) {
        continue;
      }
      let minDist = Infinity;
      for (const other of spec.targetPoints) {
        if (other.code === pt.code) continue;
        const ox = toX(other.x);
        const oy = toY(other.y);
        minDist = Math.min(minDist, Math.hypot(lx - ox, ly - oy));
      }
      for (const pl of placedLabels) {
        minDist = Math.min(minDist, Math.hypot(lx - pl.x, ly - pl.y));
      }
      if (minDist > bestScore) {
        bestScore = minDist;
        bestDx = dx;
        bestDy = dy;
      }
    }
    placedLabels.push({ x: cx + bestDx, y: cy + bestDy });
    const anchor: 'start' | 'middle' | 'end' =
      bestDx < 0 ? 'end' : bestDx === 0 ? 'middle' : 'start';
    return { ...pt, cx, cy, lx: cx + bestDx, ly: cy + bestDy, anchor };
  });

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-700">
        <span>{spec.title}</span>
        {spec.showDiagonal && spec.diagonalLabel ? (
          <span className="text-[10px] font-medium text-slate-500">破線：{spec.diagonalLabel}</span>
        ) : spec.backgroundPoints.length > 0 ? (
          <span className="text-[10px] font-medium text-slate-400">灰色点＝他国データ</span>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
        <text x={8} y={13} fontSize="9.5" fontWeight="700" fill="#475569">
          ↑ {spec.yLabel}
        </text>

        {ticks.map((ratio) => {
          const xVal = xMin + (xMax - xMin) * ratio;
          const yVal = yMin + (yMax - yMin) * ratio;
          const px = padL + plotW * ratio;
          const py = padT + plotH * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={padL}
                y1={py}
                x2={W - padR}
                y2={py}
                stroke={ratio === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={ratio === 0 ? 1 : 0.7}
                strokeDasharray={ratio === 0 ? undefined : '2 2'}
              />
              <line
                x1={px}
                y1={padT}
                x2={px}
                y2={padT + plotH}
                stroke={ratio === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={ratio === 0 ? 1 : 0.7}
                strokeDasharray={ratio === 0 ? undefined : '2 2'}
              />
              <text x={padL - 4} y={py + 3} textAnchor="end" fontSize="8" fill="#64748b">
                {formatAxisTick(yVal)}
              </text>
              <text x={px} y={padT + plotH + 11} textAnchor="middle" fontSize="8" fill="#64748b">
                {formatAxisTick(xVal)}
              </text>
            </g>
          );
        })}

        {spec.showDiagonal && (
          <line
            x1={padL}
            y1={padT + plotH}
            x2={W - padR}
            y2={padT}
            stroke="#94a3b8"
            strokeWidth={1.1}
            strokeDasharray="4 3"
          />
        )}

        {spec.backgroundPoints.map((bp, idx) => (
          <circle
            key={`bg-${idx}`}
            cx={toX(bp.x)}
            cy={toY(bp.y)}
            r={2.8}
            fill="#cbd5e1"
            stroke="#94a3b8"
            strokeWidth={0.6}
            opacity={0.78}
          />
        ))}

        {resolvedTargets.map((pt) => (
          <g key={pt.code}>
            <circle
              cx={pt.cx}
              cy={pt.cy}
              r={5.2}
              fill={pt.color}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <text
              x={pt.lx}
              y={pt.ly}
              textAnchor={pt.anchor}
              fontSize="11"
              fontWeight="900"
              fill={pt.color}
              stroke="#ffffff"
              strokeWidth={2.6}
              paintOrder="stroke"
            >
              {pt.code}
            </text>
          </g>
        ))}

        <text
          x={padL + plotW / 2}
          y={H - 5}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#475569"
        >
          {spec.xLabel} →
        </text>
      </svg>
    </div>
  );
}

function MiniStackedBarSvg({ spec }: { spec: StackedBarDrillSpec }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-800">{spec.caption}</span>
        <span className="text-[10.5px] text-slate-400">単位：{spec.unit}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {spec.series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-xs"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {spec.rows.map((row) => {
          const sum = Math.max(
            1e-6,
            row.values.reduce((a, b) => a + Math.max(0, b), 0),
          );
          return (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className="w-6 shrink-0 text-center text-xs font-black text-slate-900">
                {row.label}
              </span>
              <div className="flex h-7 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                {row.values.map((val, si) => {
                  const pct = (Math.max(0, val) / sum) * 100;
                  if (pct <= 0.3) return null;
                  const sMeta = spec.series[si];
                  return (
                    <div
                      key={sMeta?.name ?? si}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sMeta?.color ?? '#64748b',
                      }}
                      title={`${sMeta?.name ?? ''}: ${val}${spec.unit}`}
                      className="flex items-center justify-center overflow-hidden text-[10px] font-bold text-white"
                    >
                      {pct >= 11 ? `${Math.round(pct)}%` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniLineTrendSvg({ spec }: { spec: LineTrendDrillSpec }) {
  const allVals = spec.series.flatMap((s) => s.values);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = Math.max(1e-6, rawMax - rawMin);
  const yMin = rawMin >= 0 ? 0 : rawMin - span * 0.08;
  const yMax = rawMax + span * 0.12;

  const W = 390;
  const H = 225;
  const padL = 44;
  const padR = 36;
  const padT = 26;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = Math.max(2, spec.xLabels.length);

  const toX = (idx: number) => padL + (idx / (n - 1)) * plotW;
  const toY = (v: number) => padT + ((yMax - v) / Math.max(1e-6, yMax - yMin)) * plotH;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  // 右端ラベルの縦重なり回避
  const endSorted = spec.series
    .map((s) => ({
      code: s.code,
      color: s.color,
      rawY: toY(s.values[s.values.length - 1] ?? 0),
    }))
    .sort((a, b) => a.rawY - b.rawY);
  const placedY = new Map<string, number>();
  let prevY = -Infinity;
  for (const item of endSorted) {
    const adjusted = Math.max(padT + 8, Math.min(padT + plotH - 4, Math.max(item.rawY, prevY + 13)));
    placedY.set(item.code, adjusted);
    prevY = adjusted;
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-700">
        <span>{spec.title}</span>
        <span className="text-[10px] font-medium text-slate-400">単位：{spec.unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
        {yTicks.map((ratio) => {
          const val = yMin + (yMax - yMin) * ratio;
          const py = padT + plotH * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={padL}
                y1={py}
                x2={W - padR}
                y2={py}
                stroke={ratio === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={ratio === 0 ? 1 : 0.7}
                strokeDasharray={ratio === 0 ? undefined : '2 2'}
              />
              <text x={padL - 4} y={py + 3} textAnchor="end" fontSize="8" fill="#64748b">
                {formatAxisTick(val)}
              </text>
            </g>
          );
        })}

        {spec.xLabels.map((lbl, i) => {
          const show =
            n <= 7 || i === 0 || i === n - 1 || i % 2 === 0;
          if (!show) return null;
          return (
            <text
              key={`${lbl}-${i}`}
              x={toX(i)}
              y={padT + plotH + 13}
              textAnchor="middle"
              fontSize="8"
              fill="#64748b"
            >
              {lbl}
            </text>
          );
        })}

        {spec.series.map((s) => {
          const pts = s.values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
          const ly = placedY.get(s.code) ?? toY(s.values[s.values.length - 1] ?? 0);
          return (
            <g key={s.code}>
              <polyline fill="none" stroke={s.color} strokeWidth={2.2} points={pts} />
              {s.values.map((v, i) => (
                <circle
                  key={`${s.code}-${i}`}
                  cx={toX(i)}
                  cy={toY(v)}
                  r={2.5}
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth={0.8}
                />
              ))}
              <text
                x={W - padR + 6}
                y={ly + 3}
                fontSize="10.5"
                fontWeight="900"
                fill={s.color}
              >
                {s.code}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DrillQuestionVisuals({
  question,
  countriesGeoJson,
}: {
  question: GeneratedDrillQuestion;
  countriesGeoJson?: FeatureCollection<Geometry, GeoCountryProperties> | null;
}) {
  const sharedClimateScale = useMemo(() => {
    const list = question.climateCities;
    if (!list || list.length === 0) return null;
    const allTemps = list.flatMap((it) => it.city.monthlyTempC);
    const allPrecips = list.flatMap((it) => it.city.monthlyPrecipMm);
    return {
      tempRange: [
        Math.floor(Math.min(-10, ...allTemps) / 5) * 5,
        Math.ceil(Math.max(30, ...allTemps) / 5) * 5,
      ] as [number, number],
      precipMax: Math.ceil(Math.max(200, ...allPrecips) / 50) * 50,
    };
  }, [question.climateCities]);

  const sharedPyramidMaxPct = useMemo(() => {
    const pair = question.pyramidPair;
    if (!pair || pair.length === 0) return undefined;
    return Math.max(8, ...pair.flatMap((p) => p.bins.flatMap((b) => [b.malePct, b.femalePct])));
  }, [question.pyramidPair]);

  return (
    <>
      {question.dialogues && question.dialogues.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
            会話・考察メモ
          </div>
          {question.dialogues.map((d, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800"
            >
              <span className="mr-1.5 font-extrabold text-indigo-700">{d.speaker}:</span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      )}

      {question.mapSpec && (
        <div className="mt-3">
          <MiniWorldMapDrillSvg spec={question.mapSpec} countriesGeoJson={countriesGeoJson} />
        </div>
      )}

      {question.table && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          {question.table.caption && (
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700">
              {question.table.caption}
            </div>
          )}
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {question.table.headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-2.5 py-2 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {question.table.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-2.5 py-2 ${ci === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {question.scatterPlot && (
        <div className="mt-3">
          <MiniScatterPlotSvg spec={question.scatterPlot} />
        </div>
      )}

      {question.stackedBars && (
        <div className="mt-3">
          <MiniStackedBarSvg spec={question.stackedBars} />
        </div>
      )}

      {question.lineTrend && (
        <div className="mt-3">
          <MiniLineTrendSvg spec={question.lineTrend} />
        </div>
      )}

      {question.climateCities && sharedClimateScale && (
        <div
          className={`mt-3 grid grid-cols-1 gap-3 ${
            question.climateCities.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {question.climateCities.map((entry) => (
            <div key={entry.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold text-slate-800">
                <span>{entry.label}</span>
                {entry.metaText && (
                  <span className="font-mono text-[10.5px] font-semibold text-slate-500">
                    {entry.metaText}
                  </span>
                )}
              </div>
              <ClimateMiniChart
                city={entry.city}
                chartType={question.climateChartType ?? 'climograph'}
                tempRange={sharedClimateScale.tempRange}
                precipMax={sharedClimateScale.precipMax}
              />
            </div>
          ))}
        </div>
      )}

      {question.climateCity && !question.climateCities && (
        <div className="mx-auto mt-3 max-w-xs rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <ClimateMiniChart
            city={question.climateCity}
            chartType={question.climateChartType ?? 'climograph'}
            tempRange={[
              Math.floor(Math.min(-10, ...question.climateCity.monthlyTempC) / 5) * 5,
              Math.ceil(Math.max(30, ...question.climateCity.monthlyTempC) / 5) * 5,
            ]}
            precipMax={Math.ceil(Math.max(200, ...question.climateCity.monthlyPrecipMm) / 50) * 50}
          />
        </div>
      )}

      {question.pyramidPair && (
        <div
          className={`mt-3 grid grid-cols-1 gap-3 ${
            question.pyramidPair.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {question.pyramidPair.map((p) => (
            <div key={p.label} className="space-y-1">
              <div className="text-center text-xs font-extrabold text-slate-800">{p.label}</div>
              <EqualScalePyramidSvg bins={p.bins} fixedMaxPct={sharedPyramidMaxPct} />
            </div>
          ))}
        </div>
      )}

      {question.pyramidBins && !question.pyramidPair && (
        <div className="mt-3">
          <EqualScalePyramidSvg bins={question.pyramidBins} />
        </div>
      )}

      {question.photoUrl && (
        <div className="mt-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
            <img
              src={question.photoUrl}
              alt="地理推論対象景観写真"
              referrerPolicy="no-referrer"
              className="mx-auto max-h-64 w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 共テ風オリジナル実戦問題モード（厳選思考力バンク＋無限実戦ドリル＋実戦ミニ模試10問）
 */
export function PracticeExamView({
  ref,
  mockQuestions,
  worldRankings,
  countriesData,
  countriesGeoJson,
  japanData,
  timeSliders,
  photoEncyclopedia,
  onSelectCountry,
  onOpenRanking,
  onOpenSystematic,
}: PracticeExamViewProps) {
  const [mode, setMode] = useState<PracticeMode>('bank');

  // --- Mode 2: 厳選思考力問題バンク ---
  const [bankCategory, setBankCategory] = useState<BankCategoryFilter>('all');
  const [bankQuestionId, setBankQuestionId] = useState<string>(mockQuestions[0]?.id ?? '');
  const [bankAnswers, setBankAnswers] = useState<Record<string, number>>({});

  // --- Mode 1: 無限ランダム生成実戦図表ドリル ---
  const [drillGenre, setDrillGenre] = useState<DrillGenre>('all');
  const [drillSeed, setDrillSeed] = useState<number>(1);
  const [recentSignatures, setRecentSignatures] = useState<string[]>([]);
  const [missedDrills, setMissedDrills] = useState<GeneratedDrillQuestion[]>([]);
  const [isReviewQueueMode, setIsReviewQueueMode] = useState<boolean>(false);
  const [focusFilter, setFocusFilter] = useState<DrillFocusFilter | null>(null);
  const [currentDrill, setCurrentDrill] = useState<GeneratedDrillQuestion | null>(() =>
    generateDrillQuestion(
      'all',
      {
        worldRankings,
        countriesData,
        countriesGeoJson,
        japanData,
        timeSliders,
        photoEncyclopedia,
      },
      1,
    ),
  );
  const [drillChoice, setDrillChoice] = useState<number | null>(null);
  const [drillStats, setDrillStats] = useState<{
    total: number;
    correct: number;
    streak: number;
    bestStreak: number;
  }>({
    total: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
  });

  // --- Mode 3: 10問 実戦ミニ模試（セッション完結） ---
  const [mockNonce, setMockNonce] = useState<number>(1);
  const [mockSet, setMockSet] = useState<GeneratedDrillQuestion[]>([]);
  const [mockIndex, setMockIndex] = useState<number>(0);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockFlags, setMockFlags] = useState<Record<string, boolean>>({});
  const [mockSubmitted, setMockSubmitted] = useState<boolean>(false);

  const filteredBank = useMemo(() => {
    if (bankCategory === 'all') return mockQuestions;
    return mockQuestions.filter((q) => q.category === bankCategory);
  }, [mockQuestions, bankCategory]);

  const activeBankIndex = useMemo(() => {
    const idx = filteredBank.findIndex((q) => q.id === bankQuestionId);
    return idx >= 0 ? idx : 0;
  }, [filteredBank, bankQuestionId]);

  const activeBankQ = filteredBank[activeBankIndex] ?? null;

  const bankStats = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (const q of mockQuestions) {
      if (q.id in bankAnswers) {
        answered += 1;
        if (bankAnswers[q.id] === q.correctIndex) correct += 1;
      }
    }
    return { correct, answered };
  }, [mockQuestions, bankAnswers]);

  const generateWithHistory = (
    targetGenre: DrillGenre,
    seed: number,
    overrideFocus: DrillFocusFilter | null = focusFilter,
  ) => {
    const q = generateDrillQuestion(
      targetGenre,
      {
        worldRankings,
        countriesData,
        countriesGeoJson,
        japanData,
        timeSliders,
        photoEncyclopedia,
        recentSignatures,
        focusFilter: overrideFocus,
      },
      seed,
    );
    if (q?.signature) {
      setRecentSignatures((prev) => [...prev.slice(-24), q.signature!]);
    }
    return q;
  };

  const handleNextDrill = (
    overrideGenre?: DrillGenre,
    overrideFocus: DrillFocusFilter | null = focusFilter,
  ) => {
    const targetGenre = overrideGenre ?? drillGenre;
    const nextSeed = drillSeed + 1;
    setDrillSeed(nextSeed);
    setDrillChoice(null);

    if (isReviewQueueMode && missedDrills.length > 0 && overrideGenre === undefined) {
      setCurrentDrill(missedDrills[0]);
      return;
    }

    const nextQ = generateWithHistory(targetGenre, nextSeed, overrideFocus);
    if (nextQ) {
      setCurrentDrill(nextQ);
    }
  };

  useImperativeHandle(ref, () => ({
    startFocusedDrill: (filter: DrillFocusFilter) => {
      setMode('drill');
      setIsReviewQueueMode(false);
      setFocusFilter(filter);
      setDrillGenre('all');
      const nextSeed = drillSeed + 1;
      setDrillSeed(nextSeed);
      setDrillChoice(null);
      const q = generateWithHistory('all', nextSeed, filter);
      if (q) setCurrentDrill(q);
    },
  }));

  const handleAnswerDrill = (idx: number) => {
    if (!currentDrill || drillChoice !== null) return;
    setDrillChoice(idx);
    const ok = idx === currentDrill.correctIndex;
    setDrillStats((prev) => {
      const nextStreak = ok ? prev.streak + 1 : 0;
      return {
        total: prev.total + 1,
        correct: prev.correct + (ok ? 1 : 0),
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });

    if (ok) {
      if (isReviewQueueMode) {
        setMissedDrills((prev) => {
          const filtered = prev.filter((item) => item.id !== currentDrill.id);
          if (filtered.length === 0) setIsReviewQueueMode(false);
          return filtered;
        });
      }
    } else {
      setMissedDrills((prev) => {
        if (prev.some((item) => item.signature === currentDrill.signature)) return prev;
        return [...prev.slice(-29), currentDrill];
      });
    }
  };

  const handleStartMiniMock = () => {
    const nextNonce = mockNonce + 1;
    setMockNonce(nextNonce);
    const qs = generateMiniMockSet(
      {
        worldRankings,
        countriesData,
        countriesGeoJson,
        japanData,
        timeSliders,
        photoEncyclopedia,
        recentSignatures,
      },
      nextNonce,
    );
    setMockSet(qs);
    setMockIndex(0);
    setMockAnswers({});
    setMockFlags({});
    setMockSubmitted(false);
    const newSigs = qs.map((q) => q.signature).filter((s): s is string => Boolean(s));
    if (newSigs.length > 0) {
      setRecentSignatures((prev) => [...prev, ...newSigs].slice(-25));
    }
  };

  const mockSummary = useMemo(() => {
    if (mockSet.length === 0) return null;
    let totalCorrect = 0;
    const byDomain = new Map<string, { total: number; correct: number }>();
    for (const q of mockSet) {
      const dom = q.domainTag ?? q.genreLabel;
      const cur = byDomain.get(dom) ?? { total: 0, correct: 0 };
      cur.total += 1;
      if (mockAnswers[q.id] === q.correctIndex) {
        totalCorrect += 1;
        cur.correct += 1;
      }
      byDomain.set(dom, cur);
    }
    return {
      total: mockSet.length,
      answered: Object.keys(mockAnswers).length,
      correct: totalCorrect,
      domains: Array.from(byDomain.entries()).map(([label, stat]) => ({ label, ...stat })),
    };
  }, [mockSet, mockAnswers]);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 上部 モード切替バー */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="inline-flex flex-wrap items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode('bank')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-extrabold transition md:px-3 ${
                mode === 'bank'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              厳選・思考力問題（全{mockQuestions.length}問）
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('drill');
                if (!currentDrill) handleNextDrill();
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-extrabold transition md:px-3 ${
                mode === 'drill'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              データ連動・無限ドリル
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('minimock');
                if (mockSet.length === 0) handleStartMiniMock();
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-extrabold transition md:px-3 ${
                mode === 'minimock'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              実戦ミニ模試（10問）
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
            {mode === 'bank' && (
              <>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">
                  正答: {bankStats.correct} / {bankStats.answered}問
                </span>
                {bankStats.answered > 0 && (
                  <button
                    type="button"
                    onClick={() => setBankAnswers({})}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3 w-3" /> クリア
                  </button>
                )}
              </>
            )}
            {mode === 'drill' && (
              <>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                  正答: {drillStats.correct} / {drillStats.total}問
                </span>
                {drillStats.streak >= 2 && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                    連続 {drillStats.streak}問
                  </span>
                )}
                {missedDrills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = !isReviewQueueMode;
                      setIsReviewQueueMode(nextMode);
                      setDrillChoice(null);
                      if (nextMode && missedDrills[0]) {
                        setCurrentDrill(missedDrills[0]);
                      } else {
                        const q = generateWithHistory(drillGenre, drillSeed + 1);
                        if (q) setCurrentDrill(q);
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition ${
                      isReviewQueueMode
                        ? 'border-rose-500 bg-rose-600 text-white'
                        : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    ミス復習 ({missedDrills.length}問)
                  </button>
                )}
                {drillStats.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setDrillStats({ total: 0, correct: 0, streak: 0, bestStreak: 0 })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3 w-3" /> クリア
                  </button>
                )}
              </>
            )}
            {mode === 'minimock' && mockSummary && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">
                  {mockSubmitted
                    ? `得点: ${mockSummary.correct} / ${mockSummary.total}問（${Math.round(
                        (mockSummary.correct / Math.max(1, mockSummary.total)) * 100,
                      )}%）`
                    : `解答済: ${mockSummary.answered} / ${mockSummary.total}問`}
                </span>
                <button
                  type="button"
                  onClick={handleStartMiniMock}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <RefreshCw className="h-3 w-3" /> 新しい10問セット
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode 2: 厳選思考力バンク */}
      {mode === 'bank' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 分野チップバー */}
          <div className="shrink-0 border-b border-slate-200 bg-white/90 px-3 py-2 md:px-6">
            <div className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto pb-0.5">
              {BANK_CAT_OPTIONS.map((c) => {
                const cnt =
                  c.id === 'all'
                    ? mockQuestions.length
                    : mockQuestions.filter((q) => q.category === c.id).length;
                const active = bankCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setBankCategory(c.id);
                      const first =
                        c.id === 'all'
                          ? mockQuestions[0]
                          : mockQuestions.find((q) => q.category === c.id);
                      if (first) setBankQuestionId(first.id);
                    }}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {c.label} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
            <div className="mx-auto flex h-full max-w-6xl flex-col md:flex-row">
              {/* 問題リスト */}
              <nav className="shrink-0 border-b border-slate-200 bg-white p-2.5 md:h-full md:w-72 md:overflow-y-auto md:border-b-0 md:border-r md:p-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
                  {filteredBank.map((q, idx) => {
                    const isSel = q.id === activeBankQ?.id;
                    const chosen = bankAnswers[q.id];
                    const isCorrect = chosen != null && chosen === q.correctIndex;
                    const isWrong = chosen != null && chosen !== q.correctIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setBankQuestionId(q.id)}
                        className={`flex shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition md:w-full ${
                          isSel
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          Q{idx + 1}. {q.title}
                        </span>
                        {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                        {isWrong && <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* 問題本文 */}
              <div className="flex-1 overflow-y-auto p-3.5 md:p-6">
                {activeBankQ ? (
                  <div className="mx-auto max-w-3xl space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <ClipboardCheck className="h-3 w-3 text-indigo-600" />
                          問題 {activeBankIndex + 1} / {filteredBank.length}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {BANK_CAT_OPTIONS.find((c) => c.id === activeBankQ.category)?.label}
                        </span>
                      </div>

                      <h2 className="mt-2 text-base font-black text-slate-900 md:text-lg">
                        {activeBankQ.title}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 md:text-[13px]">
                        {activeBankQ.leadText}
                      </p>

                      {activeBankQ.dialogues && activeBankQ.dialogues.length > 0 && (
                        <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                            会話メモ
                          </div>
                          {activeBankQ.dialogues.map((d, i) => (
                            <div key={i} className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800">
                              <span className="mr-1.5 font-extrabold text-indigo-700">{d.speaker}:</span>
                              <span>{d.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeBankQ.table && (
                        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                          {activeBankQ.table.caption && (
                            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700">
                              {activeBankQ.table.caption}
                            </div>
                          )}
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                {activeBankQ.table.headers.map((h) => (
                                  <th key={h} className="px-3 py-2 font-bold">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {activeBankQ.table.rows.map((r, ri) => (
                                <tr key={ri}>
                                  {r.map((cell, ci) => (
                                    <td
                                      key={ci}
                                      className={`px-3 py-2 ${ci === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <p className="mt-4 text-xs font-extrabold leading-relaxed text-slate-900 md:text-sm">
                        {activeBankQ.questionText}
                      </p>

                      {/* 選択肢 */}
                      <div
                        className={
                          activeBankQ.choices.length >= 6 &&
                          activeBankQ.choices.every((c) => c.length <= 42)
                            ? 'mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2'
                            : 'mt-3 space-y-2'
                        }
                      >
                        {activeBankQ.choices.map((ch, idx) => {
                          const selectedIdx = bankAnswers[activeBankQ.id];
                          const isAnswered = selectedIdx != null;
                          const isTarget = idx === activeBankQ.correctIndex;
                          const isChosen = idx === selectedIdx;

                          let btnClass =
                            'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50';
                          if (isAnswered) {
                            if (isTarget) {
                              btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                            } else if (isChosen) {
                              btnClass = 'border-rose-400 bg-rose-50 text-rose-900';
                            } else {
                              btnClass = 'border-slate-200 bg-white text-slate-400';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isAnswered}
                              onClick={() =>
                                setBankAnswers((prev) => ({
                                  ...prev,
                                  [activeBankQ.id]: idx,
                                }))
                              }
                              className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition md:text-[13px] ${btnClass}`}
                            >
                              <span className="shrink-0 font-black">
                                {CHOICE_LABELS[idx] ?? `${idx + 1}.`}
                              </span>
                              <span className="flex-1">{ch}</span>
                              {isAnswered && isTarget && (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              )}
                              {isAnswered && isChosen && !isTarget && (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* 解答・解説 */}
                      {bankAnswers[activeBankQ.id] != null && (
                        <div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4">
                          <div
                            className={`flex items-center gap-1.5 text-xs font-black ${
                              bankAnswers[activeBankQ.id] === activeBankQ.correctIndex
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {bankAnswers[activeBankQ.id] === activeBankQ.correctIndex
                              ? '正解です'
                              : `不正解（正解は ${CHOICE_LABELS[activeBankQ.correctIndex] ?? activeBankQ.correctIndex + 1}）`}
                          </div>

                          <div className="rounded-xl border border-slate-200 border-l-2 border-l-sky-500 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-800">
                            <div className="mb-1 font-extrabold text-slate-900">詳しい解説</div>
                            {activeBankQ.explanation}
                          </div>

                          <div className="rounded-xl border border-slate-200 border-l-2 border-l-amber-500 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-800">
                            <div className="mb-1 flex items-center gap-1 font-extrabold text-slate-900">
                              <Award className="h-3.5 w-3.5 text-amber-600" />
                              整理ポイント
                            </div>
                            {activeBankQ.keyTakeaway}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex flex-wrap gap-1.5">
                              {activeBankQ.relatedIso3s.map((iso) => (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onSelectCountry(iso)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <MapPin className="h-3 w-3 text-indigo-600" />
                                  {countriesData[iso]?.nameJa.split('（')[0] ?? iso}
                                </button>
                              ))}
                            </div>

                            {activeBankIndex < filteredBank.length - 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setBankQuestionId(filteredBank[activeBankIndex + 1].id)
                                }
                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-indigo-700"
                              >
                                次の問題へ
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    問題を読み込み中です...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 1: データ連動無限ドリル */}
      {mode === 'drill' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white/90 px-3 py-2 md:px-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {DRILL_GENRE_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setIsReviewQueueMode(false);
                        setDrillGenre(g.id);
                        handleNextDrill(g.id, focusFilter);
                      }}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                        !isReviewQueueMode && drillGenre === g.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleNextDrill()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-800 hover:bg-indigo-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {isReviewQueueMode ? '次のミス問題へ' : '新しい問題を生成'}
                </button>
              </div>

              {(focusFilter || isReviewQueueMode) && (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {focusFilter && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-bold text-sky-900">
                      <Target className="h-3 w-3 text-sky-600" />
                      絞り込み出題中：{focusFilter.label ?? focusFilter.iso3 ?? focusFilter.category}
                      <button
                        type="button"
                        onClick={() => {
                          setFocusFilter(null);
                          handleNextDrill(drillGenre, null);
                        }}
                        className="ml-0.5 rounded-full bg-sky-200/70 p-0.5 text-sky-900 hover:bg-sky-300"
                        title="絞り込みを解除"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {isReviewQueueMode && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-bold text-rose-800">
                      ミス復習キュー（残り {missedDrills.length}問・正解するとキューから完了）
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 md:p-6">
            {currentDrill ? (
              <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    {currentDrill.genreLabel}
                  </span>
                  {currentDrill.domainTag && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700">
                      {currentDrill.domainTag}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-base font-black text-slate-900 md:text-lg">
                  {currentDrill.promptTitle}
                </h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 md:text-[13px]">
                  {currentDrill.promptBody}
                </p>

                <DrillQuestionVisuals question={currentDrill} countriesGeoJson={countriesGeoJson} />

                {/* 選択肢 */}
                <div
                  className={
                    currentDrill.choices.length >= 6 &&
                    currentDrill.choices.every((c) => c.length <= 42)
                      ? 'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'
                      : 'mt-4 space-y-2'
                  }
                >
                  {currentDrill.choices.map((ch, idx) => {
                    const isAnswered = drillChoice !== null;
                    const isTarget = idx === currentDrill.correctIndex;
                    const isChosen = idx === drillChoice;

                    let btnClass =
                      'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50';
                    if (isAnswered) {
                      if (isTarget) {
                        btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                      } else if (isChosen) {
                        btnClass = 'border-rose-400 bg-rose-50 text-rose-900';
                      } else {
                        btnClass = 'border-slate-200 bg-white text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleAnswerDrill(idx)}
                        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition md:text-[13px] ${btnClass}`}
                      >
                        <span className="shrink-0 font-black">
                          {CHOICE_LABELS[idx] ?? `${idx + 1}.`}
                        </span>
                        <span className="flex-1">{ch}</span>
                        {isAnswered && isTarget && (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                        {isAnswered && isChosen && !isTarget && (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {drillChoice !== null && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <div
                      className={`text-xs font-black ${
                        drillChoice === currentDrill.correctIndex
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {drillChoice === currentDrill.correctIndex
                        ? '正解です'
                        : `不正解（正解は ${CHOICE_LABELS[currentDrill.correctIndex] ?? currentDrill.correctIndex + 1}）`}
                    </div>

                    <div className="rounded-xl border border-slate-200 border-l-2 border-l-sky-500 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-800">
                      <div className="mb-1 font-extrabold text-slate-900">根拠・判別ポイント</div>
                      {currentDrill.explanation}
                    </div>

                    {currentDrill.steps && currentDrill.steps.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-800">
                        <div className="mb-1 font-extrabold text-emerald-950">
                          思考プロセス（消去法・段階的解法）
                        </div>
                        <ul className="space-y-1">
                          {currentDrill.steps.map((s, si) => (
                            <li key={si}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentDrill.detailNotes && currentDrill.detailNotes.length > 0 && (
                      <div className="rounded-xl border border-slate-200 border-l-2 border-l-indigo-500 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700">
                        <div className="mb-1 font-extrabold text-slate-900">各項目・選択肢の実データ</div>
                        <ul className="space-y-1">
                          {currentDrill.detailNotes.map((note) => (
                            <li key={note}>・{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {currentDrill.relatedIso3s.map((iso) => (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => onSelectCountry(iso)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <MapPin className="h-3 w-3 text-indigo-600" />
                            {countriesData[iso]?.nameJa.split('（')[0] ?? iso}
                          </button>
                        ))}
                        {currentDrill.relatedRankingId && onOpenRanking && (
                          <button
                            type="button"
                            onClick={() => onOpenRanking(currentDrill.relatedRankingId!)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100"
                          >
                            <BarChart3 className="h-3 w-3" />
                            世界統計で確認
                          </button>
                        )}
                        {currentDrill.relatedSystematicId && onOpenSystematic && (
                          <button
                            type="button"
                            onClick={() => onOpenSystematic(currentDrill.relatedSystematicId!)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                          >
                            <Layers className="h-3 w-3" />
                            系統・日本図鑑で確認
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNextDrill()}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {isReviewQueueMode ? '次のミス問題へ' : '次の問題へ（再生成）'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                データを読み込み中です...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: 10問 実戦ミニ模試 */}
      {mode === 'minimock' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mockSet.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <ListChecks className="h-10 w-10 text-indigo-600" />
              <h2 className="mt-3 text-base font-black text-slate-900">
                共通テスト形式 実戦ミニ模試（全10問）
              </h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                地図統計・雨温図×地点・初見統計推論・世界20カ国の国内地域/日本統計・グラフ読取・人口ピラミッドからバランス良く10問を出題します。全問回答後に一括採点と分野別診断を行います。
              </p>
              <button
                type="button"
                onClick={handleStartMiniMock}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                ミニ模試10問を作成する
              </button>
            </div>
          ) : (
            <>
              {/* 問題ナビゲーションバー */}
              <div className="shrink-0 border-b border-slate-200 bg-white/95 px-3 py-2 md:px-6">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {mockSet.map((q, idx) => {
                      const isCur = idx === mockIndex;
                      const chosen = mockAnswers[q.id];
                      const flagged = Boolean(mockFlags[q.id]);
                      let pillClass =
                        'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
                      if (mockSubmitted) {
                        pillClass =
                          chosen === q.correctIndex
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            : 'border-rose-400 bg-rose-50 text-rose-800';
                      } else if (chosen !== undefined) {
                        pillClass = 'border-indigo-300 bg-indigo-50 text-indigo-800';
                      }
                      if (isCur) {
                        pillClass += ' ring-2 ring-indigo-600 ring-offset-1';
                      }
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setMockIndex(idx)}
                          className={`relative inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition ${pillClass}`}
                        >
                          Q{idx + 1}
                          {flagged && <Flag className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />}
                        </button>
                      );
                    })}
                  </div>

                  {!mockSubmitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMockSubmitted(true);
                        const missedFromMock = mockSet.filter(
                          (q) => mockAnswers[q.id] !== q.correctIndex,
                        );
                        if (missedFromMock.length > 0) {
                          setMissedDrills((prev) => {
                            const sigs = new Set(prev.map((x) => x.signature));
                            const added = missedFromMock.filter((m) => !sigs.has(m.signature));
                            return [...prev, ...added].slice(-30);
                          });
                        }
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      採点して解説を見る（{mockSummary?.answered ?? 0}/{mockSet.length}問解答）
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReviewQueueMode(true);
                        setMode('drill');
                        if (missedDrills[0]) setCurrentDrill(missedDrills[0]);
                      }}
                      disabled={missedDrills.length === 0}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                    >
                      誤答問題を復習キューで解き直す ({missedDrills.length}問)
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 md:p-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  {/* 採点完了後の全体結果・分野別診断カード */}
                  {mockSubmitted && mockSummary && (
                    <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold text-indigo-700">
                            ミニ模試 採点結果サマリー
                          </div>
                          <div className="mt-0.5 text-xl font-black text-slate-900">
                            {mockSummary.correct} / {mockSummary.total} 問正解（正答率{' '}
                            {Math.round(
                              (mockSummary.correct / Math.max(1, mockSummary.total)) * 100,
                            )}
                            %）
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartMiniMock}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          新しい10問で再挑戦
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {mockSummary.domains.map((dom) => {
                          const rate = Math.round((dom.correct / Math.max(1, dom.total)) * 100);
                          return (
                            <div
                              key={dom.label}
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-[11px]"
                            >
                              <div className="truncate font-bold text-slate-700">{dom.label}</div>
                              <div className="mt-1 flex items-baseline justify-between font-black">
                                <span
                                  className={
                                    rate >= 70
                                      ? 'text-emerald-700'
                                      : rate >= 40
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                  }
                                >
                                  {dom.correct}/{dom.total}問
                                </span>
                                <span className="text-[10px] text-slate-500">{rate}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 現在選択中の問題カード */}
                  {(() => {
                    const curQ = mockSet[mockIndex];
                    if (!curQ) return null;
                    const curAns = mockAnswers[curQ.id];
                    const isFlag = Boolean(mockFlags[curQ.id]);
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-black text-indigo-800">
                              第 {mockIndex + 1} 問 / {mockSet.length}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                              {curQ.genreLabel}
                            </span>
                          </div>
                          {!mockSubmitted && (
                            <button
                              type="button"
                              onClick={() =>
                                setMockFlags((prev) => ({ ...prev, [curQ.id]: !prev[curQ.id] }))
                              }
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                isFlag
                                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Flag className="h-3 w-3" />
                              {isFlag ? '要確認済み' : 'あとで見直す'}
                            </button>
                          )}
                        </div>

                        <h2 className="mt-2 text-base font-black text-slate-900 md:text-lg">
                          {curQ.promptTitle}
                        </h2>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 md:text-[13px]">
                          {curQ.promptBody}
                        </p>

                        <DrillQuestionVisuals
                          question={curQ}
                          countriesGeoJson={countriesGeoJson}
                        />

                        {/* 選択肢（採点前は選び直し可） */}
                        <div
                          className={
                            curQ.choices.length >= 6 &&
                            curQ.choices.every((c) => c.length <= 42)
                              ? 'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'
                              : 'mt-4 space-y-2'
                          }
                        >
                          {curQ.choices.map((ch, idx) => {
                            const isTarget = idx === curQ.correctIndex;
                            const isChosen = idx === curAns;
                            let btnClass =
                              'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50';
                            if (mockSubmitted) {
                              if (isTarget) {
                                btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                              } else if (isChosen) {
                                btnClass = 'border-rose-400 bg-rose-50 text-rose-900';
                              } else {
                                btnClass = 'border-slate-200 bg-white text-slate-400';
                              }
                            } else if (isChosen) {
                              btnClass = 'border-indigo-500 bg-indigo-50 text-indigo-900';
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={mockSubmitted}
                                onClick={() =>
                                  setMockAnswers((prev) => ({ ...prev, [curQ.id]: idx }))
                                }
                                className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition md:text-[13px] ${btnClass}`}
                              >
                                <span className="shrink-0 font-black">
                                  {CHOICE_LABELS[idx] ?? `${idx + 1}.`}
                                </span>
                                <span className="flex-1">{ch}</span>
                                {mockSubmitted && isTarget && (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                )}
                                {mockSubmitted && isChosen && !isTarget && (
                                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* 採点後解説 */}
                        {mockSubmitted && (
                          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                            <div
                              className={`text-xs font-black ${
                                curAns === curQ.correctIndex ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {curAns === undefined
                                ? `未回答（正解は ${CHOICE_LABELS[curQ.correctIndex] ?? curQ.correctIndex + 1}）`
                                : curAns === curQ.correctIndex
                                  ? '正解です'
                                  : `不正解（正解は ${CHOICE_LABELS[curQ.correctIndex] ?? curQ.correctIndex + 1}）`}
                            </div>

                            <div className="rounded-xl border border-slate-200 border-l-2 border-l-sky-500 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-800">
                              <div className="mb-1 font-extrabold text-slate-900">根拠・判別ポイント</div>
                              {curQ.explanation}
                            </div>

                            {curQ.steps && curQ.steps.length > 0 && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-800">
                                <div className="mb-1 font-extrabold text-emerald-950">
                                  思考プロセス（消去法・段階的解法）
                                </div>
                                <ul className="space-y-1">
                                  {curQ.steps.map((s, si) => (
                                    <li key={si}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1.5">
                              {curQ.relatedIso3s.map((iso) => (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onSelectCountry(iso)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <MapPin className="h-3 w-3 text-indigo-600" />
                                  {countriesData[iso]?.nameJa.split('（')[0] ?? iso}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 前後送りフッター */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            disabled={mockIndex === 0}
                            onClick={() => setMockIndex((i) => Math.max(0, i - 1))}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" /> 前の問題
                          </button>
                          <button
                            type="button"
                            disabled={mockIndex >= mockSet.length - 1}
                            onClick={() =>
                              setMockIndex((i) => Math.min(mockSet.length - 1, i + 1))
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:opacity-40"
                          >
                            次の問題 <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
