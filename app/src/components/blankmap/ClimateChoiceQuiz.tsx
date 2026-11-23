import type { FeatureCollection, Geometry } from 'geojson';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  Lightbulb,
  Play,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type {
  CountryData,
  GeoCountryProperties,
  GeoLayerProperties,
} from '../../types/schema_v1';
import { BlankMapQuizCanvas, type FlyTargetData } from './BlankMapQuizCanvas';
import { ClimateMiniChart } from './ClimateMiniChart';
import {
  buildSmartClimateQuestion,
  extractClimateCities,
  type QuizClimateCity,
  type SmartClimateQuestion,
} from './blankMapUtils';

type ChartStyleMode = 'climograph' | 'hythergraph' | 'mixed';

interface ClimateChoiceQuizProps {
  countriesData: Record<string, CountryData>;
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  layersGeoJson: FeatureCollection<Geometry, GeoLayerProperties>;
  capitalsGeoJson: FeatureCollection<Geometry>;
  volcanoesGeoJson: FeatureCollection<Geometry>;
  climateTotalStats: { total: number; correct: number; bestStreak: number };
  onRecordResult: (isCorrect: boolean, streak: number) => void;
  onOpenCountryInMap: (iso3: string) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function ClimateChoiceQuiz({
  countriesData,
  countriesGeoJson,
  layersGeoJson,
  capitalsGeoJson,
  volcanoesGeoJson,
  climateTotalStats,
  onRecordResult,
  onOpenCountryInMap,
}: ClimateChoiceQuizProps) {
  const allCities = useMemo(() => extractClimateCities(countriesData), [countriesData]);

  const [chartMode, setChartMode] = useState<ChartStyleMode>('climograph');
  const [limit, setLimit] = useState<number>(10);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [queue, setQueue] = useState<QuizClimateCity[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [currentChartType, setCurrentChartType] = useState<'climograph' | 'hythergraph'>('climograph');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [flyTarget, setFlyTarget] = useState<FlyTargetData | null>(null);

  const pickChartType = useCallback((mode: ChartStyleMode): 'climograph' | 'hythergraph' => {
    if (mode === 'mixed') return Math.random() < 0.5 ? 'climograph' : 'hythergraph';
    return mode;
  }, []);

  const startQuiz = useCallback(() => {
    const copy = [...allCities];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const picked = copy.slice(0, Math.min(limit, copy.length));
    if (picked.length === 0) return;

    setQueue(picked);
    setQIndex(0);
    setSelectedIdx(null);
    setCorrectCount(0);
    setStreak(0);
    setCurrentChartType(pickChartType(chartMode));
    setPhase('playing');
    setFlyTarget({
      lng: picked[0].city.lng,
      lat: picked[0].city.lat,
      zoom: 2.2,
      nonce: Date.now(),
    });
  }, [allCities, limit, chartMode, pickChartType]);

  const currentTarget = phase === 'playing' ? queue[qIndex] : undefined;

  const question: SmartClimateQuestion | null = useMemo(() => {
    if (!currentTarget || allCities.length < 4) return null;
    return buildSmartClimateQuestion(allCities, currentTarget);
  }, [allCities, currentTarget]);

  const handleChoose = (optIdx: number) => {
    if (!question || selectedIdx !== null) return;
    setSelectedIdx(optIdx);
    const ok = question.options[optIdx]?.isCorrect ?? false;
    const nextStreak = ok ? streak + 1 : 0;
    if (ok) setCorrectCount((c) => c + 1);
    setStreak(nextStreak);
    onRecordResult(ok, nextStreak);
  };

  const handleNext = () => {
    if (qIndex + 1 >= queue.length) {
      setPhase('finished');
      return;
    }
    const nextIdx = qIndex + 1;
    const nextCity = queue[nextIdx];
    setQIndex(nextIdx);
    setSelectedIdx(null);
    setCurrentChartType(pickChartType(chartMode));
    setFlyTarget({
      lng: nextCity.city.lng,
      lat: nextCity.city.lat,
      zoom: 2.2,
      nonce: Date.now(),
    });
  };

  if (phase === 'setup') {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-slate-50 p-4">
        <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
              気候グラフ特定トレーニング（全{allCities.length}都市）
            </span>
            <h2 className="mt-2 text-lg font-extrabold text-slate-900">
              この場所の雨温図・ハイサーグラフはどれ？
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              白地図上のピン位置（緯度・大陸西岸/東岸・標高ヒント）を手がかりに、似た気候の4択から統一スケール上で値域と季節配分を比較して特定します。
            </p>
          </div>

          <div>
            <div className="mb-1 text-xs font-bold text-slate-700">グラフ形式</div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(
                [
                  { id: 'climograph', label: '雨温図' },
                  { id: 'hythergraph', label: 'ハイサーグラフ' },
                  { id: 'mixed', label: 'ミックス' },
                ] as { id: ChartStyleMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMode(m.id)}
                  className={`rounded-xl border py-2 font-bold transition ${
                    chartMode === m.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-bold text-slate-700">問題数</div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLimit(n)}
                  className={`rounded-xl border py-2 font-bold transition ${
                    limit === n
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {n}問
                </button>
              ))}
            </div>
          </div>

          {climateTotalStats.total > 0 && (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              通算成績：<b>{climateTotalStats.correct}</b> / {climateTotalStats.total} 問正解（最高連続{' '}
              <b>{climateTotalStats.bestStreak}</b>回）
            </div>
          )}

          <button
            type="button"
            onClick={startQuiz}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700"
          >
            <Play className="h-4 w-4 fill-current" />
            演習スタート
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-extrabold text-slate-900">気候グラフ演習完了！</h2>
          <div className="text-3xl font-black text-indigo-700">
            {correctCount} / {queue.length} 正解
          </div>
          <p className="text-xs text-slate-500">
            正答率：{Math.round((correctCount / Math.max(1, queue.length)) * 100)}%
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startQuiz}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700"
            >
              もう1セット
            </button>
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              設定へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;
  const answered = selectedIdx !== null;
  const isUserCorrect = answered && question.options[selectedIdx]?.isCorrect;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 lg:flex-row">
      {/* 左（スマホ上）：無文字白地図で出題地点＋緯線ガイド提示 */}
      <div className="relative h-[34vh] min-h-[210px] shrink-0 border-b border-slate-200 lg:h-full lg:w-[44%] lg:border-b-0 lg:border-r">
        <BlankMapQuizCanvas
          countriesGeoJson={countriesGeoJson}
          layersGeoJson={layersGeoJson}
          capitalsGeoJson={capitalsGeoJson}
          volcanoesGeoJson={volcanoesGeoJson}
          mode="climate_spot"
          spotMarker={{ lng: question.target.city.lng, lat: question.target.city.lat }}
          flyTarget={flyTarget}
          showGraticule={true}
        />

        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg border border-slate-300 bg-white/95 px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-xs">
            第 {qIndex + 1} / {queue.length} 問
          </span>
          <span className="rounded-lg border border-indigo-200 bg-indigo-50/95 px-2.5 py-1 text-xs font-bold text-indigo-800 shadow-xs">
            {currentChartType === 'climograph' ? '雨温図' : 'ハイサーグラフ'}（4択統一軸）
          </span>
          {question.target.elevM >= 800 && (
            <span className="rounded-lg border border-amber-300 bg-amber-50/95 px-2 py-1 text-xs font-bold text-amber-900 shadow-xs">
              標高 約{question.target.elevM.toLocaleString()}m
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-2">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-xs">
            正解 {correctCount}
          </span>
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-100/95 px-2 py-0.5 text-[11px] font-bold text-orange-800 shadow-xs">
              <Flame className="h-3 w-3" /> {streak}連続
            </span>
          )}
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="rounded-md border border-slate-300 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-xs hover:bg-white"
          >
            設定へ
          </button>
        </div>
      </div>

      {/* 右（スマホ下）：4択統一スケールグラフ＋根拠解説 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="font-extrabold text-slate-800">
            赤いピン地点の{currentChartType === 'climograph' ? '雨温図' : 'ハイサーグラフ'}を1つ選択
            <span className="ml-1.5 text-[11px] font-normal text-slate-500">
              （気温 {question.sharedTempRange[0]}〜{question.sharedTempRange[1]}℃ / 降水 0〜{question.sharedPrecipMax}mm 統一）
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {question.options.map((opt, idx) => {
            const isPicked = selectedIdx === idx;
            let borderCls = 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs';
            if (answered) {
              if (opt.isCorrect) {
                borderCls = 'border-2 border-emerald-500 bg-emerald-50/40 shadow-sm';
              } else if (isPicked) {
                borderCls = 'border-2 border-rose-500 bg-rose-50/40';
              } else {
                borderCls = 'border-slate-200 bg-white/80 opacity-90';
              }
            }

            return (
              <button
                key={opt.item.city.cityId}
                type="button"
                disabled={answered}
                onClick={() => handleChoose(idx)}
                className={`flex flex-col rounded-xl border p-2.5 text-left transition ${borderCls}`}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold ${
                      answered && opt.isCorrect
                        ? 'bg-emerald-600 text-white'
                        : answered && isPicked
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-white'
                    }`}
                  >
                    選択肢 {OPTION_LABELS[idx]}
                  </span>
                  {answered && (
                    <span className="truncate text-[11px] font-bold text-slate-800">
                      {opt.item.city.nameJa}（{opt.item.countryNameJa} / {opt.item.koppen}）
                    </span>
                  )}
                </div>

                <ClimateMiniChart
                  city={opt.item.city}
                  chartType={currentChartType}
                  tempRange={question.sharedTempRange}
                  precipMax={question.sharedPrecipMax}
                />

                {answered && !opt.isCorrect && (
                  <p className="mt-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[10.5px] leading-snug text-slate-700">
                    ❌ {opt.exclusionReason}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-extrabold">
                {isUserCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-800">
                      正解！ {question.target.city.nameJa}（{question.target.countryNameJa}・{question.target.koppen}）
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span className="text-rose-800">
                      残念！ 正解は【{OPTION_LABELS[question.options.findIndex((o) => o.isCorrect)]}】
                      {question.target.city.nameJa}（{question.target.countryNameJa}・{question.target.koppen}）
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCountryInMap(question.target.iso3)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />
                  国の詳細を見る
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-indigo-700"
                >
                  {qIndex + 1 >= queue.length ? '結果を見る' : '次の問題へ'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-slate-800">
              <div className="mb-1 flex items-center gap-1 font-extrabold text-amber-900">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                特定できる根拠・着眼点
              </div>
              <ul className="list-disc space-y-0.5 pl-4 text-[11.5px] leading-relaxed">
                {question.winningReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                {question.target.city.factors.map((f) => (
                  <li key={f} className="text-slate-600">
                    要因：{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
