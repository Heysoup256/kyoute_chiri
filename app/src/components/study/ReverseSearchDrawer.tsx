import { Filter, RotateCcw, Search, X } from 'lucide-react';
import type { ImportanceRank } from '../../types/schema_v1';
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
  onChangeFilters: (next: SearchFilterCriteria) => void;
  onSelectCountry: (iso3: string) => void;
  onClose: () => void;
}

const KOPPEN_CHIPS = ['Af', 'Am', 'Aw', 'BW', 'BS', 'Cs', 'Cw', 'Cfa', 'Cfb', 'Df', 'Dw', 'ET', 'EF'];
const INTEGRATION_CHIPS = ['EU', 'ASEAN', 'USMCA', 'メルコスール', 'BRICS', 'OPEC', 'EFTA', 'AU'];
const KEYWORD_CHIPS = ['フィヨルド', 'エスチュアリー', '三角州', 'ケスタ', '鉄鉱石', '銅鉱石', 'シェール', 'レアメタル', 'シーア派', '難民', '少子高齢化'];

/**
 * 逆引き検索・複合フィルタリングドロワー（該当国を世界地図上にハイライト）
 */
export function ReverseSearchDrawer({
  isOpen,
  filters,
  hits,
  totalCountries,
  examCoverage,
  onChangeFilters,
  onSelectCountry,
  onClose,
}: ReverseSearchDrawerProps) {
  if (!isOpen) return null;

  const isFiltering = hasActiveFilters(filters);

  return (
    <aside
      className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-white shadow-2xl md:static md:inset-auto md:z-20 md:h-full md:w-[360px] md:shrink-0 md:border-r md:border-slate-200"
      aria-label="逆引き検索・フィルタパネル"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-cyan-600" />
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">逆引き検索・絞り込み</h2>
            <p className="text-[11px] text-slate-500">
              {isFiltering
                ? `一致: ${hits.length} / ${totalCountries}カ国（地図上でハイライト中）`
                : `全${totalCountries}カ国を条件でハイライト`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            aria-label="検索パネルを閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 検索条件エリア */}
      <div className="space-y-3 border-b border-slate-200 p-3.5 text-xs">
        {/* キーワード入力 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
            placeholder="例: フィヨルド, シーア派, シェール, セラード..."
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

        {/* 頻出キーワードチップ */}
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

        {/* ケッペン・重要度・地域統合・出題年度 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-500">
              ケッペン記号
            </label>
            <select
              value={filters.koppenCode}
              onChange={(e) => onChangeFilters({ ...filters, koppenCode: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
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
            <label className="mb-1 block text-[11px] font-bold text-slate-500">
              重要度ランク
            </label>
            <select
              value={filters.rank}
              onChange={(e) =>
                onChangeFilters({ ...filters, rank: e.target.value as ImportanceRank | '' })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="">すべて</option>
              <option value="S">S（最頻出）</option>
              <option value="A">A（頻出）</option>
              <option value="B">B（重要）</option>
              <option value="C">C（基礎）</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-500">
              地域統合・枠組み
            </label>
            <select
              value={filters.integration}
              onChange={(e) => onChangeFilters({ ...filters, integration: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
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
            <label className="mb-1 block text-[11px] font-bold text-slate-500">
              出題された試験回
            </label>
            <select
              value={filters.examYear}
              onChange={(e) => onChangeFilters({ ...filters, examYear: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
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

      {/* ヒット国一覧 */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
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
              className="flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-cyan-50/50"
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
                過去問 {country.examSummary.appearanceCount}回
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
