import { ArrowLeftRight, Eye, EyeOff, Scale, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ClimateCity, CountryData } from '../../types/schema_v1';
import { ClimographChart } from './ClimographChart';
import { HythergraphChart } from './HythergraphChart';

interface CityCompareModalProps {
  isOpen: boolean;
  countries: Record<string, CountryData>;
  initialCityA?: string;
  onClose: () => void;
}

interface CityEntry {
  city: ClimateCity;
  countryNameJa: string;
  iso3: string;
}

const COMPARE_PRESETS: { label: string; cityA: string; cityB: string; note: string }[] = [
  { label: '東京 vs ロンドン', cityA: 'JPN_TOKYO', cityB: 'GBR_LONDON', note: '東岸Cfa vs 西岸Cfb' },
  { label: 'ローマ vs サンティアゴ', cityA: 'ITA_ROME', cityB: 'CHL_SANTIAGO', note: '北半球Cs vs 南半球Cs' },
  { label: '北京 vs ベルリン', cityA: 'CHN_BEIJING', cityB: 'DEU_BERLIN', note: '冬の寒さと年較差' },
  { label: 'NY vs サンフランシスコ', cityA: 'USA_NYC', cityB: 'USA_SF', note: '北米東岸 vs 西岸寒流' },
  { label: 'マナウス vs ムンバイ', cityA: 'BRA_MANAUS', cityB: 'IND_MUMBAI', note: '熱帯雨林Af vs サバナAw' },
  { label: 'ヤクーツク vs ベルゲン', cityA: 'RUS_YAKUTSK', cityB: 'NOR_BERGEN', note: '同緯度・内陸Dw vs 暖流Cfb' },
];

/**
 * 任意の2都市を並べて雨温図・ハイサーグラフを軸スケール同期比較できるモーダル
 */
export function CityCompareModal({
  isOpen,
  countries,
  initialCityA,
  onClose,
}: CityCompareModalProps) {
  const allCities = useMemo<CityEntry[]>(() => {
    const list: CityEntry[] = [];
    for (const country of Object.values(countries)) {
      for (const city of country.climate.cities) {
        list.push({
          city,
          countryNameJa: country.nameJa,
          iso3: country.iso3,
        });
      }
    }
    return list.sort((a, b) => a.countryNameJa.localeCompare(b.countryNameJa, 'ja'));
  }, [countries]);

  const [cityIdA, setCityIdA] = useState<string>(
    () => initialCityA || 'JPN_TOKYO',
  );
  const [cityIdB, setCityIdB] = useState<string>('GBR_LONDON');
  const [syncScale, setSyncScale] = useState<boolean>(true);
  const [blindTest, setBlindTest] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'both' | 'climograph' | 'hythergraph'>('both');

  const entryA = allCities.find((e) => e.city.cityId === cityIdA) ?? allCities[0];
  const entryB = allCities.find((e) => e.city.cityId === cityIdB) ?? allCities[1] ?? allCities[0];

  // 2都市で軸スケールを完全同期させる範囲を計算
  const syncedBounds = useMemo(() => {
    if (!entryA || !entryB || !syncScale) {
      return { tempRange: undefined, precipMax: undefined };
    }
    const allTemps = [...entryA.city.monthlyTempC, ...entryB.city.monthlyTempC];
    const allPrecips = [...entryA.city.monthlyPrecipMm, ...entryB.city.monthlyPrecipMm];
    const minT = Math.min(...allTemps);
    const maxT = Math.max(...allTemps);
    const maxP = Math.max(...allPrecips, 100);

    const yMin = Math.floor(Math.min(0, minT - 4) / 5) * 5;
    const yMax = Math.ceil(Math.max(30, maxT + 4) / 5) * 5;
    const pMax = Math.ceil((maxP * 1.15) / 50) * 50;
    return {
      tempRange: [yMin, yMax] as [number, number],
      precipMax: pMax,
    };
  }, [entryA, entryB, syncScale]);

  if (!isOpen || !entryA || !entryB) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-[2px] md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="2都市気候グラフ比較モーダル"
    >
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl md:max-w-5xl md:rounded-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 md:text-base">
                2都市の気候グラフ比較（全{allCities.length}都市収録）
              </h3>
              <p className="text-[11px] text-slate-500">
                縦軸・横軸スケールを同期して雨温図とハイサーグラフを対比
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* プリセット・設定バー */}
        <div className="space-y-2.5 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">定番比較:</span>
            {COMPARE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setCityIdA(p.cityA);
                  setCityIdB(p.cityB);
                }}
                title={p.note}
                className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 hover:bg-sky-100"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                都市 A
              </span>
              <select
                value={entryA.city.cityId}
                onChange={(e) => setCityIdA(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {allCities.map((item) => (
                  <option key={item.city.cityId} value={item.city.cityId}>
                    {item.countryNameJa} - {item.city.nameJa} ({item.city.koppenCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                都市 B
              </span>
              <select
                value={entryB.city.cityId}
                onChange={(e) => setCityIdB(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                {allCities.map((item) => (
                  <option key={item.city.cityId} value={item.city.cityId}>
                    {item.countryNameJa} - {item.city.nameJa} ({item.city.koppenCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSyncScale((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                  syncScale
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                軸スケール同期: {syncScale ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setBlindTest((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                  blindTest
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {blindTest ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                グラフ判別テスト: {blindTest ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
              {(
                [
                  { id: 'both', label: '両方表示' },
                  { id: 'climograph', label: '雨温図のみ' },
                  { id: 'hythergraph', label: 'ハイサーのみ' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setChartType(opt.id)}
                  className={`rounded-md px-2.5 py-1 font-semibold ${
                    chartType === opt.id ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 比較グラフ本体 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {(chartType === 'both' || chartType === 'climograph') && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ClimographChart
                  city={entryA.city}
                  countryLabel={entryA.countryNameJa}
                  tempRange={syncedBounds.tempRange}
                  precipMax={syncedBounds.precipMax}
                  blindMode={blindTest}
                  height={260}
                />
                <ClimographChart
                  city={entryB.city}
                  countryLabel={entryB.countryNameJa}
                  tempRange={syncedBounds.tempRange}
                  precipMax={syncedBounds.precipMax}
                  blindMode={blindTest}
                  height={260}
                />
              </div>
            )}

            {(chartType === 'both' || chartType === 'hythergraph') && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <HythergraphChart
                  city={entryA.city}
                  countryLabel={entryA.countryNameJa}
                  tempRange={syncedBounds.tempRange}
                  precipMax={syncedBounds.precipMax}
                  blindMode={blindTest}
                  height={270}
                />
                <HythergraphChart
                  city={entryB.city}
                  countryLabel={entryB.countryNameJa}
                  tempRange={syncedBounds.tempRange}
                  precipMax={syncedBounds.precipMax}
                  blindMode={blindTest}
                  height={270}
                />
              </div>
            )}

            {!blindTest && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[entryA, entryB].map((entry) => (
                  <div
                    key={entry.city.cityId}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div className="font-bold text-slate-800">
                      {entry.countryNameJa}・{entry.city.nameJa}（{entry.city.koppenNameJa ?? entry.city.koppenCode}）
                    </div>
                    <div className="mt-1 text-slate-500">
                      緯度 {entry.city.lat.toFixed(1)}° / 経度 {entry.city.lng.toFixed(1)}°
                      {entry.city.elevationM != null ? ` / 標高 ${entry.city.elevationM}m` : ''}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {entry.city.factors.map((f) => (
                        <span key={f} className="rounded bg-sky-50 px-2 py-0.5 text-[11px] text-sky-900">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
