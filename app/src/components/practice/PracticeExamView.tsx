import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  MapPin,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  AgePyramidBin,
  CountryData,
  MockQuestion,
  MockQuestionCategory,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import { ClimateMiniChart } from '../blankmap/ClimateMiniChart';
import {
  DRILL_GENRE_OPTIONS,
  generateDrillQuestion,
  type DrillGenre,
  type GeneratedDrillQuestion,
  type LineTrendDrillSpec,
  type ScatterDrillSpec,
  type StackedBarDrillSpec,
} from './drillGenerator';

interface PracticeExamViewProps {
  mockQuestions: MockQuestion[];
  worldRankings: WorldRankingsDataset | null;
  countriesData: Record<string, CountryData>;
  timeSliders: TimeSeriesSliderItem[];
  photoEncyclopedia: PhotoEncyclopediaEntry[];
  onSelectCountry: (iso3: string) => void;
}

type PracticeMode = 'bank' | 'drill';
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
  const xMin = rawXMin >= 0 ? Math.max(0, rawXMin - xSpan * 0.08) : rawXMin - xSpan * 0.08;
  const xMax = rawXMax + xSpan * 0.1;
  const yMin = rawYMin >= 0 ? Math.max(0, rawYMin - ySpan * 0.08) : rawYMin - ySpan * 0.08;
  const yMax = rawYMax + ySpan * 0.12;

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
        <span className="text-[10px] font-medium text-slate-400">灰色点＝他国データ</span>
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

function MiniPopulationPyramidSvg({
  bins,
  fixedMaxPct,
}: {
  bins: AgePyramidBin[];
  fixedMaxPct?: number;
}) {
  const maxPct =
    fixedMaxPct ??
    Math.max(
      8,
      ...bins.flatMap((b) => [b.malePct, b.femalePct]),
    );
  const rows = [...bins].reverse();
  const rowH = 14;
  const H = rows.length * rowH + 22;
  const W = 280;
  const centerX = W / 2;
  const halfPlot = 104;

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between text-[10.5px] font-bold text-slate-600">
        <span className="text-sky-700">← 男性 (%)</span>
        <span className="text-slate-400">年齢階級</span>
        <span className="text-rose-700">女性 (%) →</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
        <line x1={centerX} y1={0} x2={centerX} y2={H - 16} stroke="#94a3b8" strokeWidth={1} />
        {rows.map((b, idx) => {
          const y = idx * rowH;
          const mW = (b.malePct / maxPct) * halfPlot;
          const fW = (b.femalePct / maxPct) * halfPlot;
          return (
            <g key={b.ageGroup}>
              <rect x={centerX - mW} y={y + 1} width={mW} height={rowH - 2} fill="#0284c7" rx={1} />
              <rect x={centerX} y={y + 1} width={fW} height={rowH - 2} fill="#e11d48" rx={1} />
              {idx % 2 === 0 && (
                <text
                  x={centerX}
                  y={y + rowH - 3}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#0f172a"
                  fontWeight="bold"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  paintOrder="stroke"
                >
                  {b.ageGroup}
                </text>
              )}
            </g>
          );
        })}
        <text x={centerX - halfPlot} y={H - 3} fontSize="8" fill="#64748b">
          {Math.round(maxPct)}%
        </text>
        <text x={centerX} y={H - 3} textAnchor="middle" fontSize="8" fill="#64748b">
          0
        </text>
        <text x={centerX + halfPlot} y={H - 3} textAnchor="end" fontSize="8" fill="#64748b">
          {Math.round(maxPct)}%
        </text>
      </svg>
    </div>
  );
}

/**
 * 共テ風オリジナル実戦問題モード（厳選思考力バンク＋データ連動無限ドリル）
 */
export function PracticeExamView({
  mockQuestions,
  worldRankings,
  countriesData,
  timeSliders,
  photoEncyclopedia,
  onSelectCountry,
}: PracticeExamViewProps) {
  const [mode, setMode] = useState<PracticeMode>('bank');

  // --- Mode 2: 厳選思考力問題バンク ---
  const [bankCategory, setBankCategory] = useState<BankCategoryFilter>('all');
  const [bankQuestionId, setBankQuestionId] = useState<string>(mockQuestions[0]?.id ?? '');
  const [bankAnswers, setBankAnswers] = useState<Record<string, number>>({});

  // --- Mode 1: 無限ランダム生成実戦図表ドリル ---
  const [drillGenre, setDrillGenre] = useState<DrillGenre>('all');
  const [drillSeed, setDrillSeed] = useState<number>(1);
  const [currentDrill, setCurrentDrill] = useState<GeneratedDrillQuestion | null>(() =>
    generateDrillQuestion(
      'all',
      { worldRankings, countriesData, timeSliders, photoEncyclopedia },
      1,
    ),
  );
  const [drillChoice, setDrillChoice] = useState<number | null>(null);
  const [showPhotoHint, setShowPhotoHint] = useState<boolean>(false);
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

  // 2都市比較用の共通スケール計算（雨温図／ハイサーグラフ）
  const sharedClimateScale = useMemo(() => {
    const list = currentDrill?.climateCities;
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
  }, [currentDrill]);

  // 2国並列人口ピラミッドの共通横軸最大値
  const sharedPyramidMaxPct = useMemo(() => {
    const pair = currentDrill?.pyramidPair;
    if (!pair || pair.length === 0) return undefined;
    return Math.max(
      8,
      ...pair.flatMap((p) => p.bins.flatMap((b) => [b.malePct, b.femalePct])),
    );
  }, [currentDrill]);

  const handleNextDrill = (overrideGenre?: DrillGenre) => {
    const targetGenre = overrideGenre ?? drillGenre;
    const nextSeed = drillSeed + 1;
    setDrillSeed(nextSeed);
    setDrillChoice(null);
    setShowPhotoHint(false);
    setCurrentDrill(
      generateDrillQuestion(
        targetGenre,
        { worldRankings, countriesData, timeSliders, photoEncyclopedia },
        nextSeed,
      ),
    );
  };

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
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 上部 モード切替バー */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode('bank')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-extrabold transition ${
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-extrabold transition ${
                mode === 'drill'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              データ連動・無限実戦ドリル
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            {mode === 'bank' ? (
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
            ) : (
              <>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                  正答: {drillStats.correct} / {drillStats.total}問
                </span>
                {drillStats.streak >= 2 && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                    連続 {drillStats.streak}問
                  </span>
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
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {DRILL_GENRE_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setDrillGenre(g.id);
                      handleNextDrill(g.id);
                    }}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      drillGenre === g.id
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
                新しい問題を生成
              </button>
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
                </div>

                <h2 className="mt-2 text-base font-black text-slate-900 md:text-lg">
                  {currentDrill.promptTitle}
                </h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 md:text-[13px]">
                  {currentDrill.promptBody}
                </p>

                {currentDrill.table && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    {currentDrill.table.caption && (
                      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700">
                        {currentDrill.table.caption}
                      </div>
                    )}
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          {currentDrill.table.headers.map((h) => (
                            <th key={h} className="whitespace-nowrap px-2.5 py-2 font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {currentDrill.table.rows.map((r, ri) => (
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

                {currentDrill.scatterPlot && (
                  <div className="mt-3">
                    <MiniScatterPlotSvg spec={currentDrill.scatterPlot} />
                  </div>
                )}

                {currentDrill.stackedBars && (
                  <div className="mt-3">
                    <MiniStackedBarSvg spec={currentDrill.stackedBars} />
                  </div>
                )}

                {currentDrill.lineTrend && (
                  <div className="mt-3">
                    <MiniLineTrendSvg spec={currentDrill.lineTrend} />
                  </div>
                )}

                {currentDrill.climateCities && sharedClimateScale && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {currentDrill.climateCities.map((entry) => (
                      <div
                        key={entry.label}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold text-slate-800">
                          <span>{entry.label}</span>
                          <span className="font-mono text-[10.5px] font-semibold text-slate-500">
                            {entry.metaText}
                          </span>
                        </div>
                        <ClimateMiniChart
                          city={entry.city}
                          chartType={currentDrill.climateChartType ?? 'climograph'}
                          tempRange={sharedClimateScale.tempRange}
                          precipMax={sharedClimateScale.precipMax}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {currentDrill.climateCity && !currentDrill.climateCities && (
                  <div className="mx-auto mt-3 max-w-xs rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <ClimateMiniChart
                      city={currentDrill.climateCity}
                      chartType={currentDrill.climateChartType ?? 'climograph'}
                      tempRange={[
                        Math.floor(Math.min(-10, ...currentDrill.climateCity.monthlyTempC) / 5) * 5,
                        Math.ceil(Math.max(30, ...currentDrill.climateCity.monthlyTempC) / 5) * 5,
                      ]}
                      precipMax={
                        Math.ceil(Math.max(200, ...currentDrill.climateCity.monthlyPrecipMm) / 50) *
                        50
                      }
                    />
                  </div>
                )}

                {currentDrill.pyramidPair && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {currentDrill.pyramidPair.map((p) => (
                      <div key={p.label} className="space-y-1">
                        <div className="text-center text-xs font-extrabold text-slate-800">
                          {p.label}
                        </div>
                        <MiniPopulationPyramidSvg
                          bins={p.bins}
                          fixedMaxPct={sharedPyramidMaxPct}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {currentDrill.pyramidBins && !currentDrill.pyramidPair && (
                  <div className="mt-3">
                    <MiniPopulationPyramidSvg bins={currentDrill.pyramidBins} />
                  </div>
                )}

                {currentDrill.photoUrl && (
                  <div className="mt-3 space-y-2">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                      <img
                        src={currentDrill.photoUrl}
                        alt="地理推論対象景観写真"
                        referrerPolicy="no-referrer"
                        className="mx-auto max-h-64 w-full object-contain"
                      />
                    </div>
                    {currentDrill.visualClues && currentDrill.visualClues.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowPhotoHint((v) => !v)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                        >
                          {showPhotoHint ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {showPhotoHint
                            ? '観察のヒントを隠す'
                            : `観察のヒントを見る（${currentDrill.visualClues.length}件）`}
                        </button>
                        {showPhotoHint && (
                          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
                            <div className="mb-1 font-bold text-slate-700">着眼点ヒント</div>
                            <ul className="space-y-0.5 text-slate-600">
                              {currentDrill.visualClues.map((cl) => (
                                <li key={cl}>・{cl}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNextDrill()}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        次の問題へ（再生成）
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
    </div>
  );
}
