import { BarChart3, BookOpen, Compass, Filter, RotateCcw, Search, Star, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type {
  ImportanceRank,
  JapanRegionEntry,
  SystematicTopic,
  WorldRankingItem,
} from '../../types/schema_v1';
import { formatExamId, RANK_BADGE_CLASSES } from '../../utils/constants';
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type SearchFilterCriteria,
  type SearchHit,
} from '../../utils/search';

interface ReverseSearchDrawerProps {
  isOpen: boolean;
  filters: SearchFilterCriteria;
  hits: SearchHit[];
  totalCountries: number;
  examCoverage: string[];
  markedCount: number;
  isMarkedMode: boolean;
  rankingItems?: WorldRankingItem[];
  systematicTopics?: SystematicTopic[];
  japanRegions?: JapanRegionEntry[];
  onToggleMarkedMode: () => void;
  onChangeFilters: (next: SearchFilterCriteria) => void;
  onSelectCountry: (iso3: string) => void;
  onSelectRanking?: (itemId: string) => void;
  onSelectSystematic?: (topicId: string) => void;
  onSelectJapanRegion?: (regionId: string) => void;
  onClose: () => void;
}

const KOPPEN_CHIPS = ['Af', 'Am', 'Aw', 'BW', 'BS', 'Cs', 'Cw', 'Cfa', 'Cfb', 'Df', 'Dw', 'ET', 'EF'];
const INTEGRATION_CHIPS = ['EU', 'ASEAN', 'USMCA', 'メルコスール', 'BRICS', 'OPEC', 'EFTA', 'AU'];
const KEYWORD_CHIPS = ['フィヨルド', 'エスチュアリー', '三角州', '小麦', '自動車', 'アルミニウム', '鉄鉱石', 'シェール', 'レアメタル', '難民', '少子高齢化'];

/**
 * 横断検索・複合フィルターパネル（ヘッダー検索ボタンから開閉）
 * 240カ国だけでなく、世界統計ランキング・系統地理トピック・日本地域も横断検索可能
 */
export function ReverseSearchDrawer({
  isOpen,
  filters,
  hits,
  totalCountries,
  examCoverage,
  markedCount,
  isMarkedMode,
  rankingItems = [],
  systematicTopics = [],
  japanRegions = [],
  onToggleMarkedMode,
  onChangeFilters,
  onSelectCountry,
  onSelectRanking,
  onSelectSystematic,
  onSelectJapanRegion,
  onClose,
}: ReverseSearchDrawerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFiltering = hasActiveFilters(filters);
  const qNorm = filters.query.trim().toLowerCase();

  const matchedRankings = qNorm
    ? rankingItems
        .filter((it) =>
          `${it.title} ${it.examTrap} ${it.tags.join(' ')}`.toLowerCase().includes(qNorm),
        )
        .slice(0, 6)
    : [];

  const matchedSystematic = qNorm
    ? systematicTopics
        .filter((tp) =>
          `${tp.title} ${tp.summary} ${tp.tags.join(' ')}`.toLowerCase().includes(qNorm),
        )
        .slice(0, 5)
    : [];

  const matchedJapan = qNorm
    ? japanRegions
        .filter((reg) =>
          `${reg.name} ${reg.prefectures} ${reg.climateNote} ${reg.agricultureNote} ${reg.industryNote}`
            .toLowerCase()
            .includes(qNorm),
        )
        .slice(0, 4)
    : [];

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 top-12 z-25 bg-slate-900/25 md:hidden"
        onClick={onClose}
      />
      <aside
        className="fixed inset-x-0 top-12 z-30 flex max-h-[82vh] flex-col rounded-b-2xl border-b border-slate-200 bg-white shadow-2xl md:static md:inset-auto md:z-20 md:h-full md:max-h-none md:w-[360px] md:shrink-0 md:rounded-none md:border-b-0 md:border-r md:border-slate-200"
        aria-label="検索・フィルターパネル"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-600" />
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 md:text-sm">
                横断検索・フィルター絞り込み
              </h2>
              <p className="text-[11px] text-slate-500">
                {isFiltering
                  ? `国一致: ${hits.length} / ${totalCountries}カ国`
                  : `国・統計品目・系統用語・日本地方を一括検索`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {markedCount > 0 && (
              <button
                type="button"
                onClick={onToggleMarkedMode}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                  isMarkedMode
                    ? 'border-amber-400 bg-amber-100 text-amber-900'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {markedCount}
              </button>
            )}
            {isFiltering && (
              <button
                type="button"
                onClick={() => onChangeFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw className="h-3 w-3" />
                リセット
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              aria-label="検索パネルを閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 検索バー＆フィルター条件 */}
        <div className="space-y-2.5 border-b border-slate-200 p-3 text-xs">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              aria-label="検索キーワード入力"
              value={filters.query}
              onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
              placeholder="例: 小麦, 扇状地, チェルノーゼム, オランダ..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, query: '' })}
                className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                aria-label="キーワードをクリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <div className="mb-1 text-[11px] font-bold text-slate-500">頻出テーマ（ワンタップ）</div>
            <div className="flex flex-wrap gap-1">
              {KEYWORD_CHIPS.map((kw) => {
                const active = filters.query.trim() === kw;
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() =>
                      onChangeFilters({ ...filters, query: active ? '' : kw })
                    }
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                      active
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10.5px] font-bold text-slate-500">
                ケッペン記号
              </label>
              <select
                value={filters.koppenCode}
                onChange={(e) => onChangeFilters({ ...filters, koppenCode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
              >
                <option value="">すべて</option>
                {KOPPEN_CHIPS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-0.5 block text-[10.5px] font-bold text-slate-500">
                重要度ランク
              </label>
              <select
                value={filters.rank}
                onChange={(e) =>
                  onChangeFilters({ ...filters, rank: e.target.value as ImportanceRank | '' })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
              >
                <option value="">すべて</option>
                <option value="S">S（最頻出）</option>
                <option value="A">A（頻出）</option>
                <option value="B">B（重要）</option>
                <option value="C">C（基礎）</option>
              </select>
            </div>

            <div>
              <label className="mb-0.5 block text-[10.5px] font-bold text-slate-500">
                地域統合・枠組み
              </label>
              <select
                value={filters.integration}
                onChange={(e) => onChangeFilters({ ...filters, integration: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
              >
                <option value="">すべて</option>
                {INTEGRATION_CHIPS.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-0.5 block text-[10.5px] font-bold text-slate-500">
                出題された試験回
              </label>
              <select
                value={filters.examYear}
                onChange={(e) => onChangeFilters({ ...filters, examYear: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
              >
                <option value="">すべて</option>
                {examCoverage.map((eid) => (
                  <option key={eid} value={eid}>
                    {formatExamId(eid)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 横断ヒット結果一覧 */}
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {(matchedRankings.length > 0 || matchedSystematic.length > 0 || matchedJapan.length > 0) && (
            <div className="space-y-1.5 bg-indigo-50/50 p-3">
              <div className="text-[10.5px] font-extrabold text-indigo-800">
                統計・系統・日本ガイドの一致（タップで移動）
              </div>
              <div className="space-y-1">
                {matchedRankings.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onSelectRanking?.(it.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-left text-xs hover:bg-indigo-50"
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
                      {it.title}
                    </span>
                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      統計
                    </span>
                  </button>
                ))}
                {matchedSystematic.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => onSelectSystematic?.(tp.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-left text-xs hover:bg-indigo-50"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                    <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
                      {tp.title}
                    </span>
                    <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                      系統
                    </span>
                  </button>
                ))}
                {matchedJapan.map((rg) => (
                  <button
                    key={rg.id}
                    type="button"
                    onClick={() => onSelectJapanRegion?.(rg.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-left text-xs hover:bg-indigo-50"
                  >
                    <Compass className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
                      {rg.name}（{rg.prefectures}）
                    </span>
                    <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      日本
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hits.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              条件に一致する国がありません。キーワードや絞り込みを緩めてください。
            </div>
          ) : (
            hits.map(({ country, matchedReasons }) => (
              <button
                key={country.iso3}
                type="button"
                onClick={() => onSelectCountry(country.iso3)}
                className="flex w-full items-start justify-between gap-2 px-4 py-2 text-left transition hover:bg-cyan-50/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${RANK_BADGE_CLASSES[country.examSummary.rank]}`}
                    >
                      {country.examSummary.rank}
                    </span>
                    <span className="truncate text-xs font-bold text-slate-900">
                      {country.nameJa}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {country.region}
                    </span>
                  </div>
                  {matchedReasons.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {matchedReasons.map((r) => (
                        <span
                          key={r}
                          className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800"
                        >
                          一致: {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                  出題 {country.examSummary.appearanceCount}回
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
