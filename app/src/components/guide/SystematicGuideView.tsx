import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Layers,
  MapPin,
  Search,
  Sparkles,
  Table2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  CountryData,
  PhotoEncyclopediaEntry,
  PlaceEntry,
  SystematicGuideDataset,
} from '../../types/schema_v1';
import type { PlaceMatcher } from '../../utils/places';
import { RichGeoText } from '../study/RichGeoText';
import { GeoDiagramRenderer } from './GeoDiagrams';
import { GuideChartCard } from './GuideChartCard';
import { PhotoInferenceGallery } from './PhotoInferenceGallery';

interface SystematicGuideViewProps {
  dataset: SystematicGuideDataset | null;
  photoEncyclopedia?: PhotoEncyclopediaEntry[];
  countriesData: Record<string, CountryData>;
  placeMatcher: PlaceMatcher | null;
  focusedTopicId?: string | null;
  onFocusPlace: (place: PlaceEntry) => void;
  onSelectCountry: (iso3: string) => void;
  onPracticeTopic?: (opts: { category: string; label: string }) => void;
}

/**
 * 系統地理・地図/GIS・防災・農林水・工業・宗教文化マスター図鑑 ＋ 景観写真推論図鑑ビュー
 */
export function SystematicGuideView({
  dataset,
  photoEncyclopedia = [],
  countriesData,
  placeMatcher,
  focusedTopicId,
  onFocusPlace,
  onSelectCountry,
  onPracticeTopic,
}: SystematicGuideViewProps) {
  const [subView, setSubView] = useState<'topics' | 'photos'>('topics');
  const initialCat = useMemo(() => {
    if (!dataset) return 'map_gis';
    if (focusedTopicId) {
      const hit = dataset.topics.find((t) => t.id === focusedTopicId);
      if (hit) return hit.categoryId;
    }
    return dataset.categories[0]?.id ?? 'map_gis';
  }, [dataset, focusedTopicId]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(focusedTopicId ?? '');
  const [keyword, setKeyword] = useState('');

  const filteredTopics = useMemo(() => {
    if (!dataset) return [];
    const kw = keyword.trim().toLowerCase();
    return dataset.topics.filter((t) => {
      if (kw) {
        const deepTxt = (t.deepDive ?? []).map((d) => `${d.heading} ${d.body}`).join(' ');
        const hay = `${t.title} ${t.summary} ${(t.keyPoints ?? []).join(' ')} ${(t.examTraps ?? []).join(' ')} ${deepTxt} ${(t.tags ?? []).join(' ')}`.toLowerCase();
        return hay.includes(kw);
      }
      return t.categoryId === selectedCategory;
    });
  }, [dataset, selectedCategory, keyword]);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
        系統地理マスター図鑑を読み込み中...
      </div>
    );
  }

  const activeTopic =
    filteredTopics.find((t) => t.id === selectedTopicId) ??
    filteredTopics[0] ??
    dataset.topics[0];

  const activeCatMeta = dataset.categories.find((c) => c.id === activeTopic?.categoryId);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 上部 系統解説 ⇄ 景観写真推論図鑑 切替バー */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSubView('topics')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-extrabold transition ${
                subView === 'topics'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              系統テーマ解説（{dataset.topics.length}）
            </button>
            <button
              type="button"
              onClick={() => setSubView('photos')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-extrabold transition ${
                subView === 'photos'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              写真・景観推論図鑑（{photoEncyclopedia.length}）
            </button>
          </div>
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            {subView === 'topics'
              ? '自然・産業・文化の因果を模式図と統計で体系整理'
              : '伝統住居・農牧・地形・都市写真から地理的背景を読み解く'}
          </span>
        </div>
      </div>

      {subView === 'photos' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <PhotoInferenceGallery
            entries={photoEncyclopedia}
            countriesData={countriesData}
            onFocusPlace={onFocusPlace}
            onSelectCountry={onSelectCountry}
          />
        </div>
      ) : (
        <>
          {/* 上部カテゴリ＆検索バー */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
            {dataset.categories.map((cat) => {
              const active = !keyword.trim() && selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setKeyword('');
                    setSelectedCategory(cat.id);
                    const first = dataset.topics.find((t) => t.categoryId === cat.id);
                    if (first) setSelectedTopicId(first.id);
                  }}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition ${
                    active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="系統用語を検索（例: カトリック, 半導体, ケスタ）"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* メイン2ペイン（左/上: トピック一覧 / 右: 記事＋SVG図解＋グラフ＋深掘り＋表） */}
      <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl flex-col md:flex-row">
          {/* トピック一覧 */}
          <nav
            aria-label="系統トピック選択"
            className="shrink-0 border-b border-slate-200 bg-white p-2.5 md:h-full md:w-76 md:overflow-y-auto md:border-b-0 md:border-r md:p-3"
          >
            {activeCatMeta && !keyword.trim() && (
              <p className="mb-2 hidden text-[11px] leading-snug text-slate-500 md:block">
                {activeCatMeta.description}
              </p>
            )}
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
              {filteredTopics.map((topic) => {
                const isSel = topic.id === activeTopic?.id;
                const hasDiag = Boolean(topic.diagramId);
                const hasCharts = Boolean(topic.charts && topic.charts.length > 0);
                const hasTables = Boolean(topic.tables && topic.tables.length > 0);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`flex shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition md:w-full ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-2">{topic.title}</span>
                      {(hasDiag || hasCharts || hasTables) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {hasDiag && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-800">
                              <Layers className="h-2.5 w-2.5" />
                              図解
                            </span>
                          )}
                          {hasCharts && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-800">
                              <BarChart3 className="h-2.5 w-2.5" />
                              グラフ
                            </span>
                          )}
                          {hasTables && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[9.5px] font-bold text-violet-800">
                              <Table2 className="h-2.5 w-2.5" />
                              表
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 md:block" />
                  </button>
                );
              })}
              {filteredTopics.length === 0 && (
                <div className="p-3 text-xs text-slate-500">
                  該当する系統トピックがありません。
                </div>
              )}
            </div>
          </nav>

          {/* 記事詳細 */}
          <div className="flex-1 overflow-y-auto p-3.5 md:p-6">
            {activeTopic ? (
              <article className="space-y-4">
                <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10.5px] font-bold text-indigo-800">
                      <BookOpen className="h-3 w-3" />
                      {activeCatMeta?.label ?? '系統地理'}
                    </span>
                    {(activeTopic.tags ?? []).map((tg) => (
                      <span
                        key={tg}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-2 text-base font-extrabold text-slate-900 md:text-lg">
                    {activeTopic.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                    <RichGeoText
                      text={activeTopic.summary}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </header>

                {/* SVG図解 */}
                {activeTopic.diagramId && (
                  <GeoDiagramRenderer diagramId={activeTopic.diagramId} />
                )}

                {/* 埋め込みECharts統計グラフ */}
                {activeTopic.charts && activeTopic.charts.length > 0 && (
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      activeTopic.charts.length > 1 ? 'xl:grid-cols-2' : ''
                    }`}
                  >
                    {activeTopic.charts.map((ch) => (
                      <GuideChartCard key={ch.id} spec={ch} />
                    ))}
                  </div>
                )}

                {/* 核心メカニズム・箇条書き */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <h3 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                    共テで100%押さえるべき仕組みと分類
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {(activeTopic.keyPoints ?? []).map((pt, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-800 md:text-[13px]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <span>
                          <RichGeoText
                            text={pt}
                            placeMatcher={placeMatcher}
                            onFocusPlace={onFocusPlace}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 深掘りメカニズム・詳細背景解説 */}
                {activeTopic.deepDive && activeTopic.deepDive.length > 0 && (
                  <section className="rounded-2xl border border-indigo-200/80 bg-indigo-50/35 p-4 shadow-2xs">
                    <div className="mb-2.5 flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      深掘り背景知識・原理の整理
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                      {activeTopic.deepDive.map((dd, dIdx) => (
                        <div
                          key={dIdx}
                          className="rounded-xl border border-indigo-100 bg-white p-3"
                        >
                          <h4 className="text-xs font-extrabold text-indigo-950">{dd.heading}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">
                            <RichGeoText
                              text={dd.body}
                              placeMatcher={placeMatcher}
                              onFocusPlace={onFocusPlace}
                            />
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 比較表 */}
                {activeTopic.tables?.map((tbl, tIdx) => (
                  <section
                    key={tIdx}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                  >
                    {tbl.caption && (
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800">
                        {tbl.caption}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-600">
                          <tr>
                            {tbl.headers.map((h) => (
                              <th key={h} className="border-b border-slate-200 px-3 py-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tbl.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/70">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-3 py-2 align-top leading-snug ${
                                    cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-700'
                                  }`}
                                >
                                  <RichGeoText
                                    text={cell}
                                    placeMatcher={placeMatcher}
                                    onFocusPlace={onFocusPlace}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}

                {/* 共テ引っ掛け・鉄則 */}
                {(activeTopic.examTraps ?? []).length > 0 && (
                  <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      共通テストのひっかけ・出題鉄則
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {(activeTopic.examTraps ?? []).map((tr, idx) => (
                        <li
                          key={idx}
                          className="text-xs leading-relaxed text-amber-950 md:text-[13px]"
                        >
                          •{' '}
                          <RichGeoText
                            text={tr}
                            placeMatcher={placeMatcher}
                            onFocusPlace={onFocusPlace}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {onPracticeTopic && (
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 shadow-2xs">
                    <div className="text-xs font-bold text-indigo-950">
                      この分野（{activeTopic.title}）の理解度を演習問題で確認する
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onPracticeTopic({
                          category: activeTopic.categoryId,
                          label: activeTopic.title,
                        })
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-indigo-700"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      この分野を演習
                    </button>
                  </div>
                )}

                {/* 代表国ショートカット */}
                {activeTopic.relatedCountries && activeTopic.relatedCountries.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Globe2 className="h-3.5 w-3.5 text-indigo-600" />
                      関連する代表国・地域（タップで地図・国詳細へ）
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTopic.relatedCountries.map((iso) => {
                        const c = countriesData[iso];
                        if (!c) return null;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => onSelectCountry(iso)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                          >
                            <MapPin className="h-3 w-3" />
                            {c.nameJa.split('（')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </article>
            ) : null}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
