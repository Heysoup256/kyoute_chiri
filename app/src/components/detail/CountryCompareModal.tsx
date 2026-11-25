import { ArrowLeftRight, ExternalLink, GitCompareArrows, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CountryData } from '../../types/schema_v1';

interface CountryCompareModalProps {
  initialLeftIso3: string;
  initialRightIso3?: string;
  allCountries: Record<string, CountryData>;
  onClose: () => void;
  onJumpToCountry: (iso3: string) => void;
}

interface RivalPreset {
  left: string;
  right: string;
  label: string;
}

const RIVAL_PRESETS: RivalPreset[] = [
  { left: 'USA', right: 'CAN', label: 'アメリカ vs カナダ' },
  { left: 'CHN', right: 'IND', label: '中国 vs インド' },
  { left: 'DEU', right: 'FRA', label: 'ドイツ vs フランス' },
  { left: 'ITA', right: 'ESP', label: 'イタリア vs スペイン' },
  { left: 'BRA', right: 'ARG', label: 'ブラジル vs アルゼンチン' },
  { left: 'AUS', right: 'NZL', label: '豪州 vs NZ' },
  { left: 'SWE', right: 'NOR', label: 'スウェーデン vs ノルウェー' },
  { left: 'EST', right: 'LTU', label: 'エストニア vs リトアニア' },
  { left: 'HRV', right: 'SRB', label: 'クロアチア vs セルビア' },
  { left: 'THA', right: 'VNM', label: 'タイ vs ベトナム' },
  { left: 'MYS', right: 'IDN', label: 'マレーシア vs インドネシア' },
  { left: 'KOR', right: 'TWN', label: '韓国 vs 台湾' },
  { left: 'SAU', right: 'IRN', label: 'サウジ vs イラン' },
  { left: 'EGY', right: 'ETH', label: 'エジプト vs エチオピア' },
  { left: 'NGA', right: 'ZAF', label: 'ナイジェリア vs 南アフリカ' },
  { left: 'DOM', right: 'HTI', label: 'ドミニカ共和国 vs ハイチ' },
  { left: 'BOL', right: 'PRY', label: 'ボリビア vs パラグアイ' },
];

function fmtNumber(val: number | undefined | null, unit = ''): string {
  if (val === undefined || val === null || Number.isNaN(val)) return '—';
  return `${val.toLocaleString('ja-JP')}${unit}`;
}

function fmtPop(population: number | undefined | null): string {
  if (population === undefined || population === null || Number.isNaN(population)) return '—';
  if (population >= 1e8) {
    return `${(population / 1e8).toFixed(2)}億人`;
  }
  if (population >= 1e4) {
    return `${Math.round(population / 1e4).toLocaleString('ja-JP')}万人`;
  }
  return `${population.toLocaleString('ja-JP')}人`;
}

function fmtClimateSummary(c?: CountryData): string {
  if (!c) return '—';
  if (c.climate.cities.length > 0) {
    return c.climate.cities
      .slice(0, 3)
      .map((ct) => `${ct.nameJa}(${ct.koppenCode})`)
      .join(' / ');
  }
  return c.climate.koppenCodes.join('・') || c.thematic?.koppenMain || '—';
}

function fmtLangReligion(c?: CountryData): string {
  if (!c) return '—';
  const lang = c.cultureAndHistory.officialLanguages.join('・') || c.thematic?.languageFamilyMain;
  const rel =
    c.cultureAndHistory.religions
      .slice(0, 2)
      .map((r) => (r.percent != null ? `${r.name}(${r.percent}%)` : r.name))
      .join('・') || c.thematic?.religionMain;
  return [lang, rel].filter(Boolean).join(' ／ ') || '—';
}

function MetricBarRow({
  label,
  leftVal,
  rightVal,
  leftText,
  rightText,
  leftColor = 'bg-sky-500',
  rightColor = 'bg-amber-500',
}: {
  label: string;
  leftVal: number | undefined | null;
  rightVal: number | undefined | null;
  leftText: string;
  rightText: string;
  leftColor?: string;
  rightColor?: string;
}) {
  const l = Math.max(0, leftVal ?? 0);
  const r = Math.max(0, rightVal ?? 0);
  const maxVal = Math.max(l, r, 1e-6);
  const lPct = leftVal != null ? Math.min(100, Math.round((l / maxVal) * 100)) : 0;
  const rPct = rightVal != null ? Math.min(100, Math.round((r / maxVal) * 100)) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="mb-1.5 text-center text-[11px] font-bold tracking-wide text-slate-500">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex items-center justify-end text-xs font-extrabold text-sky-800">
            {leftText}
          </div>
          <div className="flex h-2 w-full justify-end overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${leftColor}`} style={{ width: `${lPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-start text-xs font-extrabold text-amber-800">
            {rightText}
          </div>
          <div className="flex h-2 w-full justify-start overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${rightColor}`} style={{ width: `${rPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2カ国の自然・統計・産業・文化・比較ポイントを並べて対照確認するモーダル
 */
export function CountryCompareModal({
  initialLeftIso3,
  initialRightIso3,
  allCountries,
  onClose,
  onJumpToCountry,
}: CountryCompareModalProps) {
  const defaultRight = useMemo(() => {
    if (initialRightIso3 && allCountries[initialRightIso3]) return initialRightIso3;
    const conf = allCountries[initialLeftIso3]?.examCheatSheet?.commonConfusions?.[0]?.partnerIso3;
    if (conf && allCountries[conf]) return conf;
    const rel = allCountries[initialLeftIso3]?.relations?.[0]?.partnerIso3;
    if (rel && allCountries[rel]) return rel;
    return initialLeftIso3 === 'JPN' ? 'USA' : 'JPN';
  }, [allCountries, initialLeftIso3, initialRightIso3]);

  const [leftIso3, setLeftIso3] = useState(initialLeftIso3);
  const [rightIso3, setRightIso3] = useState(defaultRight);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const sortedOptions = useMemo(() => {
    return Object.values(allCountries).sort((a, b) => {
      const aBasic = Boolean(a.isBasicEntry);
      const bBasic = Boolean(b.isBasicEntry);
      if (aBasic !== bBasic) return aBasic ? 1 : -1;
      return a.nameJa.localeCompare(b.nameJa, 'ja');
    });
  }, [allCountries]);

  const left = allCountries[leftIso3];
  const right = allCountries[rightIso3];

  const directMatchHint = useMemo(() => {
    const fromLeft = left?.examCheatSheet?.commonConfusions?.find(
      (c) => c.partnerIso3 === rightIso3,
    );
    if (fromLeft) return fromLeft;
    const fromRight = right?.examCheatSheet?.commonConfusions?.find(
      (c) => c.partnerIso3 === leftIso3,
    );
    return fromRight ?? null;
  }, [left, leftIso3, right, rightIso3]);

  const handleSwap = () => {
    setLeftIso3(rightIso3);
    setRightIso3(leftIso3);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-xs md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="2カ国比較ビュー"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <GitCompareArrows className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900 md:text-base">
                2カ国 徹底比較モード（全{Object.keys(allCountries).length}カ国・地域対応）
              </h2>
              <p className="text-[11px] text-slate-500">
                紛らわしい国どうしを並べて統計・気候・産業・判別の決め手を整理
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 頻出ライバルペアのプリセット帯 */}
        <div className="border-b border-slate-200 bg-indigo-50/50 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            <span className="shrink-0 font-bold text-indigo-700">頻出ペア:</span>
            {RIVAL_PRESETS.filter((p) => allCountries[p.left] && allCountries[p.right]).map(
              (preset) => {
                const active =
                  (leftIso3 === preset.left && rightIso3 === preset.right) ||
                  (leftIso3 === preset.right && rightIso3 === preset.left);
                return (
                  <button
                    key={`${preset.left}-${preset.right}`}
                    type="button"
                    onClick={() => {
                      setLeftIso3(preset.left);
                      setRightIso3(preset.right);
                    }}
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 font-semibold transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-200 bg-white text-indigo-800 hover:border-indigo-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* 国セレクター */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 md:px-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                国A（左）
              </span>
              {left && (
                <button
                  type="button"
                  onClick={() => {
                    onJumpToCountry(left.iso3);
                    onClose();
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-700 hover:underline"
                >
                  詳細へ
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
            <select
              value={leftIso3}
              onChange={(e) => setLeftIso3(e.target.value)}
              className="w-full rounded-lg border border-sky-200 bg-sky-50/40 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none md:text-sm"
            >
              {sortedOptions.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.nameJa} {c.isBasicEntry ? '(基本)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="mt-4 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="左右を入れ替え"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                国B（右）
              </span>
              {right && (
                <button
                  type="button"
                  onClick={() => {
                    onJumpToCountry(right.iso3);
                    onClose();
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 hover:underline"
                >
                  詳細へ
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
            <select
              value={rightIso3}
              onChange={(e) => setRightIso3(e.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none md:text-sm"
            >
              {sortedOptions.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.nameJa} {c.isBasicEntry ? '(基本)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 比較ボディ */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3 md:p-4">
          {directMatchHint && (
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 px-3.5 py-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-black text-indigo-900">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                比較判別の決定打：{directMatchHint.title}
              </div>
              <p className="text-xs leading-relaxed text-slate-700">{directMatchHint.diffPoint}</p>
            </div>
          )}

          {/* 一言キー */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {[
              { c: left, colorClass: 'border-sky-200', titleClass: 'text-sky-700' },
              { c: right, colorClass: 'border-amber-200', titleClass: 'text-amber-700' },
            ].map(({ c, colorClass, titleClass }, idx) => (
              <div
                key={`${c?.iso3 ?? idx}-${idx}`}
                className={`rounded-xl border ${colorClass} bg-white p-3`}
              >
                <div className={`mb-1 text-[10px] font-bold ${titleClass}`}>
                  {c?.nameJa ?? '—'} の核心
                </div>
                <p className="text-xs leading-relaxed text-slate-800">
                  {c?.examCheatSheet?.oneLineKey ??
                    c?.quickOverview?.headline ??
                    c?.quickOverview?.summary ??
                    '基礎データ収録'}
                </p>
                {c?.examCheatSheet?.mustMemorizeStats &&
                  c.examCheatSheet.mustMemorizeStats.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.examCheatSheet.mustMemorizeStats.slice(0, 3).map((st) => (
                        <span
                          key={st}
                          className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* 定量統計バー */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <MetricBarRow
              label="人口"
              leftVal={left?.stats?.population}
              rightVal={right?.stats?.population}
              leftText={fmtPop(left?.stats?.population)}
              rightText={fmtPop(right?.stats?.population)}
            />
            <MetricBarRow
              label="面積"
              leftVal={left?.stats?.areaKm2}
              rightVal={right?.stats?.areaKm2}
              leftText={fmtNumber(left?.stats?.areaKm2, ' km²')}
              rightText={fmtNumber(right?.stats?.areaKm2, ' km²')}
            />
            <MetricBarRow
              label="1人あたりGDP"
              leftVal={left?.stats?.gdpPerCapitaUsd}
              rightVal={right?.stats?.gdpPerCapitaUsd}
              leftText={
                left?.stats?.gdpPerCapitaUsd != null
                  ? `$${left.stats.gdpPerCapitaUsd.toLocaleString('ja-JP')}`
                  : '—'
              }
              rightText={
                right?.stats?.gdpPerCapitaUsd != null
                  ? `$${right.stats.gdpPerCapitaUsd.toLocaleString('ja-JP')}`
                  : '—'
              }
            />
            <MetricBarRow
              label="人口密度"
              leftVal={left?.stats?.populationDensity}
              rightVal={right?.stats?.populationDensity}
              leftText={
                left?.stats?.populationDensity != null
                  ? `${left.stats.populationDensity.toFixed(1)} 人/km²`
                  : '—'
              }
              rightText={
                right?.stats?.populationDensity != null
                  ? `${right.stats.populationDensity.toFixed(1)} 人/km²`
                  : '—'
              }
            />
            <MetricBarRow
              label="都市人口率"
              leftVal={left?.stats?.urbanPopRatePct}
              rightVal={right?.stats?.urbanPopRatePct}
              leftText={
                left?.stats?.urbanPopRatePct != null ? `${left.stats.urbanPopRatePct}%` : '—'
              }
              rightText={
                right?.stats?.urbanPopRatePct != null ? `${right.stats.urbanPopRatePct}%` : '—'
              }
            />
            <MetricBarRow
              label="合計特殊出生率 (TFR)"
              leftVal={left?.stats?.fertilityRate}
              rightVal={right?.stats?.fertilityRate}
              leftText={
                left?.stats?.fertilityRate != null ? left.stats.fertilityRate.toFixed(2) : '—'
              }
              rightText={
                right?.stats?.fertilityRate != null ? right.stats.fertilityRate.toFixed(2) : '—'
              }
            />
          </div>

          {/* 産業別就業割合 */}
          {(left?.stats?.sectorShare || right?.stats?.sectorShare) && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 text-center text-[11px] font-bold text-slate-600">
                産業別就業構成比（青=第1次 / 橙=第2次 / 緑=第3次）
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[left, right].map((c, idx) => {
                  const sh = c?.stats?.sectorShare;
                  return (
                    <div key={`${c?.iso3 ?? idx}-${idx}`}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{c?.nameJa ?? '—'}</span>
                        {sh ? (
                          <span className="text-[11px] font-medium text-slate-500">
                            {sh.primaryPct}% / {sh.secondaryPct}% / {sh.tertiaryPct}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">データなし</span>
                        )}
                      </div>
                      {sh && (
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-sky-500"
                            style={{ width: `${sh.primaryPct}%` }}
                            title={`第1次 ${sh.primaryPct}%`}
                          />
                          <div
                            className="bg-amber-500"
                            style={{ width: `${sh.secondaryPct}%` }}
                            title={`第2次 ${sh.secondaryPct}%`}
                          />
                          <div
                            className="bg-emerald-500"
                            style={{ width: `${sh.tertiaryPct}%` }}
                            title={`第3次 ${sh.tertiaryPct}%`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 属性比較テーブル */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full table-fixed text-xs">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="w-24 px-3 py-2 text-left font-bold md:w-32">項目</th>
                  <th className="border-l border-slate-200 px-3 py-2 text-left font-bold text-sky-900">
                    {left?.nameJa ?? leftIso3}
                  </th>
                  <th className="border-l border-slate-200 px-3 py-2 text-left font-bold text-amber-900">
                    {right?.nameJa ?? rightIso3}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">気候・都市</td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {fmtClimateSummary(left)}
                  </td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {fmtClimateSummary(right)}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">主要輸出</td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {left?.industry.trade.majorExports.join('、') || '—'}
                  </td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {right?.industry.trade.majorExports.join('、') || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">農牧産品</td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {left?.industry.agriculture.length
                      ? left.industry.agriculture
                          .slice(0, 3)
                          .map((it) => it.label)
                          .join(' ／ ')
                      : left?.thematic?.agricultureMain || '—'}
                  </td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {right?.industry.agriculture.length
                      ? right.industry.agriculture
                          .slice(0, 3)
                          .map((it) => it.label)
                          .join(' ／ ')
                      : right?.thematic?.agricultureMain || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">資源・エネルギー</td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {left?.industry.resourcesAndEnergy.length
                      ? left.industry.resourcesAndEnergy
                          .slice(0, 3)
                          .map((it) => it.label)
                          .join(' ／ ')
                      : '—'}
                  </td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {right?.industry.resourcesAndEnergy.length
                      ? right.industry.resourcesAndEnergy
                          .slice(0, 3)
                          .map((it) => it.label)
                          .join(' ／ ')
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">言語・宗教</td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {fmtLangReligion(left)}
                  </td>
                  <td className="border-l border-slate-100 px-3 py-2 text-slate-700">
                    {fmtLangReligion(right)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
