import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
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

function MiniPopulationPyramidSvg({ bins }: { bins: AgePyramidBin[] }) {
  const maxPct = Math.max(
    8,
    ...bins.flatMap((b) => [b.malePct, b.femalePct]),
  );
  const rows = [...bins].reverse();
  const rowH = 11;
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
                  y={y + rowH - 2}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#0f172a"
                  fontWeight="bold"
                  stroke="#ffffff"
                  strokeWidth="2.2"
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
  const [drillStats, setDrillStats] = useState<{ total: number; correct: number }>({
    total: 0,
    correct: 0,
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

  const handleNextDrill = (overrideGenre?: DrillGenre) => {
    const targetGenre = overrideGenre ?? drillGenre;
    const nextSeed = drillSeed + 1;
    setDrillSeed(nextSeed);
    setDrillChoice(null);
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
    setDrillStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (idx === currentDrill.correctIndex ? 1 : 0),
    }));
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
                  今回正答: {bankStats.correct} / {bankStats.answered}問
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
                  ドリル今回正答: {drillStats.correct} / {drillStats.total}問
                </span>
                {drillStats.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setDrillStats({ total: 0, correct: 0 })}
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                          <ClipboardCheck className="h-3 w-3" />
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
                        <div className="mt-3 space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-800">
                            <MessageSquare className="h-3.5 w-3.5" />
                            会話メモ
                          </div>
                          {activeBankQ.dialogues.map((d, i) => (
                            <div key={i} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs">
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
                      <div className="mt-3 space-y-2">
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
                              ? '正解です！'
                              : `不正解（正解は ${CHOICE_LABELS[activeBankQ.correctIndex] ?? activeBankQ.correctIndex + 1}）`}
                          </div>

                          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs leading-relaxed text-slate-800">
                            <div className="mb-1 font-extrabold text-sky-900">詳しい解説</div>
                            {activeBankQ.explanation}
                          </div>

                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-slate-800">
                            <div className="mb-1 flex items-center gap-1 font-extrabold text-amber-900">
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
                                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                                >
                                  <MapPin className="h-3 w-3" />
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
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-800 hover:bg-indigo-100"
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Sparkles className="h-3 w-3" />
                    {currentDrill.genreLabel}（自動生成問題）
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
                            <th key={h} className="px-2.5 py-2 font-bold">
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

                {currentDrill.climateCity && (
                  <div className="mx-auto mt-3 max-w-xs rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <ClimateMiniChart
                      city={currentDrill.climateCity}
                      chartType="climograph"
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

                {currentDrill.pyramidBins && (
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
                    {currentDrill.visualClues && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
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

                {/* 選択肢 */}
                <div className="mt-4 space-y-2">
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
                        ? '正解です！'
                        : `不正解（正解は ${CHOICE_LABELS[currentDrill.correctIndex] ?? currentDrill.correctIndex + 1}）`}
                    </div>

                    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs leading-relaxed text-slate-800">
                      <div className="mb-1 font-extrabold text-sky-900">根拠・判別ポイント</div>
                      {currentDrill.explanation}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {currentDrill.relatedIso3s.map((iso) => (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => onSelectCountry(iso)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                          >
                            <MapPin className="h-3 w-3" />
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
