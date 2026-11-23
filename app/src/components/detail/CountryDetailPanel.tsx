import {
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  CloudSun,
  Compass,
  Eye,
  EyeOff,
  Factory,
  Globe2,
  Home,
  Landmark,
  MapPin,
  Maximize2,
  Mountain,
  Navigation,
  Sparkles,
  Star,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type {
  CountryData,
  CountryRelation,
  DailyLifePhoto,
  KnowledgeItem,
  PastExamQuestion,
  PlaceEntry,
} from '../../types/schema_v1';
import { formatExamId, RANK_BADGE_CLASSES, RANK_LABELS } from '../../utils/constants';
import { ClimographChart } from '../charts/ClimographChart';
import { HighlightVisualCard } from '../charts/HighlightVisualCard';
import { HythergraphChart } from '../charts/HythergraphChart';
import { IndustryTernaryChart } from '../charts/IndustryTernaryChart';
import { PopulationPyramidChart } from '../charts/PopulationPyramidChart';
import { ClozeTermButton } from '../study/ClozeText';
import { RichGeoText } from '../study/RichGeoText';
import type { PlaceMatcher } from '../../utils/places';

const RELATION_CATEGORY_STYLE: Record<
  CountryRelation['category'],
  { label: string; badgeClass: string }
> = {
  trade: { label: '貿易・資源', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' },
  migration: { label: '移民・送金・難民', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  history: { label: '歴史・国際河川', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  tourism: { label: '観光・交流', badgeClass: 'bg-violet-100 text-violet-800 border-violet-200' },
};

interface CountryDetailPanelProps {
  iso3: string | null;
  fallbackNameEn?: string;
  country?: CountryData;
  allCountries?: Record<string, CountryData>;
  relatedQuestions: PastExamQuestion[];
  blindMode: boolean;
  isMarked: boolean;
  placeMatcher?: PlaceMatcher | null;
  onFocusPlace: (place: PlaceEntry) => void;
  onToggleMark: (iso3: string) => void;
  onCompareCity: (cityId: string) => void;
  onSelectCountry: (iso3: string) => void;
  onClose: () => void;
  onOpenExamModal: (initialQuestionId?: string) => void;
}

type DetailTab = 'overview' | 'nature' | 'climate' | 'industry' | 'population' | 'culture';
type ChartViewMode = 'both' | 'climograph' | 'hythergraph';

function formatJapanesePopulation(pop: number): string {
  if (pop < 10_000) {
    return `${pop.toLocaleString()}人`;
  }
  if (pop >= 100_000_000) {
    const oku = Math.floor(pop / 100_000_000);
    const man = Math.round((pop % 100_000_000) / 10_000);
    return man > 0 ? `${oku}億${man.toLocaleString()}万人` : `${oku}億人`;
  }
  return `${Math.round(pop / 10_000).toLocaleString()}万人`;
}

function formatJapaneseGdp(gdpBillion: number): string {
  if (gdpBillion >= 1000) {
    const cho = (gdpBillion / 1000).toFixed(2);
    return `約${cho}兆ドル`;
  }
  if (gdpBillion >= 0.1) {
    return `約${Math.round(gdpBillion * 10).toLocaleString()}億ドル`;
  }
  if (gdpBillion > 0) {
    return `約${Math.max(1, Math.round(gdpBillion * 100_000)).toLocaleString()}万ドル`;
  }
  return '-';
}

function KnowledgeItemCard({
  item,
  blindMode,
  forceReveal,
  placeMatcher,
  onFocusPlace,
  onOpenQuestion,
}: {
  item: KnowledgeItem;
  blindMode: boolean;
  forceReveal: boolean;
  placeMatcher?: PlaceMatcher | null;
  onFocusPlace: (place: PlaceEntry) => void;
  onOpenQuestion: (questionId?: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.examMeta.isFrequent && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <Star className="h-3 w-3 fill-amber-500 text-amber-600" />
                共テ頻出
              </span>
            )}
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${RANK_BADGE_CLASSES[item.examMeta.importance]}`}
            >
              重要度 {item.examMeta.importance}
            </span>
            {item.worldRank && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                <Award className="h-3 w-3" />
                世界{item.worldRank}位
              </span>
            )}
          </div>
          <h4 className="mt-1.5 text-sm font-bold text-slate-900">
            <RichGeoText
              text={item.label}
              clozeTerms={item.clozeTerms}
              blindMode={blindMode}
              forceReveal={forceReveal}
              placeMatcher={placeMatcher}
              onFocusPlace={onFocusPlace}
            />
          </h4>
        </div>
      </div>

      {item.worldRankNote && (
        <p className="mt-1 text-xs font-medium text-indigo-700">
          <RichGeoText
            text={item.worldRankNote}
            clozeTerms={item.clozeTerms}
            blindMode={blindMode}
            forceReveal={forceReveal}
            placeMatcher={placeMatcher}
            onFocusPlace={onFocusPlace}
          />
        </p>
      )}

      {item.detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 md:text-[13px]">
          <RichGeoText
            text={item.detail}
            clozeTerms={item.clozeTerms}
            blindMode={blindMode}
            forceReveal={forceReveal}
            placeMatcher={placeMatcher}
            onFocusPlace={onFocusPlace}
          />
        </p>
      )}

      {/* タグと過去問リンク */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        {item.examMeta.pastExamRefs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.examMeta.pastExamRefs.map((ref, idx) => (
              <button
                key={`${ref.examId}-${idx}`}
                type="button"
                onClick={() => onOpenQuestion(ref.questionId)}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <BookOpen className="h-3 w-3" />
                {formatExamId(ref.examId)} {ref.questionLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 選択した国の詳細ビュー（PC: 右サイドパネル / スマホ: 全画面ボトムオーバーレイ）
 */
export function CountryDetailPanel({
  iso3,
  fallbackNameEn,
  country,
  allCountries,
  relatedQuestions,
  blindMode,
  isMarked,
  placeMatcher,
  onFocusPlace,
  onToggleMark,
  onCompareCity,
  onSelectCountry,
  onClose,
  onOpenExamModal,
}: CountryDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedCityId, setSelectedCityId] = useState<string>(
    () => country?.climate.cities[0]?.cityId ?? '',
  );
  const [chartMode, setChartMode] = useState<ChartViewMode>('both');
  const [forceReveal, setForceReveal] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<DailyLifePhoto | null>(null);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, boolean>>({});

  if (!iso3) {
    return null;
  }

  const activeCity =
    country?.climate.cities.find((c) => c.cityId === selectedCityId) ??
    country?.climate.cities[0];

  const tabs: { id: DetailTab; shortLabel: string; label: string; icon: typeof Mountain }[] = [
    { id: 'overview', shortLabel: '概要', label: '概要・生活', icon: Sparkles },
    { id: 'nature', shortLabel: '自然', label: '自然・地形', icon: Mountain },
    { id: 'climate', shortLabel: '気候', label: '気候・雨温図', icon: CloudSun },
    { id: 'industry', shortLabel: '産業', label: '産業・経済', icon: Factory },
    { id: 'population', shortLabel: '人口', label: '人口・都市', icon: Users },
    { id: 'culture', shortLabel: '文化', label: '文化・歴史', icon: Landmark },
  ];

  return (
    <aside
      className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-slate-50 shadow-2xl md:static md:inset-auto md:z-20 md:h-full md:w-[470px] md:shrink-0 md:border-l md:border-slate-200 lg:w-[540px]"
      aria-label="国別詳細パネル"
    >
      {/* パネルヘッダー */}
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-extrabold text-slate-900 md:text-xl">
                {country ? (
                  blindMode && !forceReveal ? (
                    <ClozeTermButton term={country.nameJa} forceReveal={forceReveal} />
                  ) : (
                    country.nameJa
                  )
                ) : (
                  fallbackNameEn ?? iso3
                )}
              </h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                {iso3}
              </span>
              {country && !country.isBasicEntry && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${RANK_BADGE_CLASSES[country.examSummary.rank]}`}
                >
                  重要度 {RANK_LABELS[country.examSummary.rank]}
                </span>
              )}
              {country?.isBasicEntry && (
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  基礎データ収録
                </span>
              )}
            </div>

            {country ? (
              <p className="mt-1 text-xs text-slate-500">
                {country.nameEn} ／ {country.region}（{country.subRegion}） ／ 首都：
                <strong className="text-slate-700">
                  {blindMode ? (
                    <ClozeTermButton term={country.capital} forceReveal={forceReveal} />
                  ) : (
                    country.capital
                  )}
                </strong>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                {fallbackNameEn ?? ''}（詳細データ未登録）
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleMark(iso3)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                isMarked
                  ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="地図上で★マークとして記録する"
            >
              <Star className={`h-3.5 w-3.5 ${isMarked ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>{isMarked ? 'マーク済' : 'マーク'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="パネルを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 暗記確認操作・過去問タグ・過去問ボタン */}
        {country && (!country.isBasicEntry || relatedQuestions.length > 0) && (
          <div className="mt-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {[...country.examSummary.years]
                  .reverse()
                  .slice(0, 6)
                  .map((yr) => (
                    <span
                      key={yr}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {formatExamId(yr)}
                    </span>
                  ))}
                {country.examSummary.years.length > 6 && (
                  <span
                    className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600"
                    title={country.examSummary.years.map(formatExamId).join('、')}
                  >
                    +{country.examSummary.years.length - 6}回
                  </span>
                )}
                {!country.isBasicEntry &&
                  country.examSummary.frequentTopics.slice(0, 2).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700"
                    >
                      ★ {topic}
                    </span>
                  ))}
              </div>

              {blindMode && (
                <button
                  type="button"
                  onClick={() => setForceReveal((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                >
                  {forceReveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {forceReveal ? '隠す' : '全開示'}
                </button>
              )}
            </div>

            {relatedQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenExamModal()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 md:text-sm"
              >
                <BookOpen className="h-4 w-4" />
                関連する過去問を見る・解く
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {relatedQuestions.length}問
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* データ未収録地域の表示 */}
      {!country ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Globe2 className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            地域データ未登録
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            選択した地域の個別統計は未登録です。地図上の各国をクリックするか、ヘッダーの一覧・逆引き検索から対象国・地域を選択してください。
          </p>
        </div>
      ) : (
        <>
          {/* 6カテゴリタブ */}
          <div className="grid grid-cols-6 border-b border-slate-200 bg-white">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 border-b-2 px-0.5 py-2 text-[10.5px] font-bold transition md:gap-1 md:py-2.5 md:text-[11px] ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden truncate sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ領域 */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* 0. 概要・生活（初期表示タブ） */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {country.quickOverview && (
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 p-4 shadow-2xs">
                    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                      <Sparkles className="h-3 w-3" />
                      これだけは押さえたい要点
                    </div>
                    <h3 className="mt-2 text-sm font-extrabold leading-snug text-slate-900 md:text-base">
                      {country.quickOverview.headline}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={country.quickOverview.summary}
                        clozeTerms={country.examSummary.frequentTopics}
                        blindMode={blindMode}
                        forceReveal={forceReveal}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                    <ul className="mt-3 space-y-1.5 border-t border-indigo-100 pt-2.5">
                      {country.quickOverview.keyPoints.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-1.5 text-xs font-medium text-slate-800"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                          <span>
                            <RichGeoText
                              text={pt}
                              blindMode={blindMode}
                              forceReveal={forceReveal}
                              placeMatcher={placeMatcher}
                              onFocusPlace={onFocusPlace}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {country.stats && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">基礎データ（最新統計）</span>
                      <span className="text-[10px] text-slate-400">
                        出典: World Bank 等（{country.stats.dataYear}年）
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">総人口</div>
                        <div className="font-extrabold text-slate-900">
                          {formatJapanesePopulation(country.stats.population)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">人口密度</div>
                        <div className="font-extrabold text-slate-900">
                          {country.stats.populationDensity.toLocaleString()} 人/km²
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">国土面積</div>
                        <div className="font-extrabold text-slate-900">
                          {country.stats.areaKm2.toLocaleString()} km²
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">名目GDP</div>
                        <div className="font-extrabold text-slate-900">
                          {formatJapaneseGdp(country.stats.gdpBillionUsd)}
                          {country.stats.gdpWorldRank && (
                            <span className="ml-1 text-[10px] text-indigo-700">
                              （世界{country.stats.gdpWorldRank}位）
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">1人当たりGDP</div>
                        <div className="font-extrabold text-slate-900">
                          ${country.stats.gdpPerCapitaUsd.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <div className="text-[10px] text-slate-500">都市人口率</div>
                        <div className="font-extrabold text-slate-900">
                          {country.stats.urbanPopRatePct}%
                        </div>
                      </div>
                    </div>
                    {(country.stats.fertilityRate != null ||
                      country.stats.femaleLaborPct != null ||
                      (country.stats.remittanceGdpPct != null &&
                        country.stats.remittanceGdpPct >= 2.0)) && (
                      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2 text-[10.5px]">
                        {country.stats.fertilityRate != null && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-800">
                            合計特殊出生率: {country.stats.fertilityRate.toFixed(2)}
                          </span>
                        )}
                        {country.stats.femaleLaborPct != null && (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800">
                            女性労働力率: {country.stats.femaleLaborPct}%
                          </span>
                        )}
                        {country.stats.remittanceGdpPct != null &&
                          country.stats.remittanceGdpPct >= 2.0 && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                              出稼ぎ個人送金: GDP比 {country.stats.remittanceGdpPct}%
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {country.highlightVisuals
                  ?.filter((v) => v.placement === 'overview')
                  .map((v) => (
                    <HighlightVisualCard key={v.id} visual={v} />
                  ))}

                {country.specialRegions && country.specialRegions.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-violet-900">
                      <Compass className="h-3.5 w-3.5 text-violet-600" />
                      注目地域・飛び地・特異地形（タップで地図移動）
                    </div>
                    <div className="space-y-2">
                      {country.specialRegions.map((sr) => (
                        <button
                          key={sr.name}
                          type="button"
                          onClick={() =>
                            onFocusPlace({
                              id: `sr-${country.iso3}-${sr.name}`,
                              name: sr.name,
                              aliases: [],
                              category: sr.tag,
                              summary: sr.description,
                              lng: sr.lng,
                              lat: sr.lat,
                              zoom: sr.zoom,
                              iso3: country.iso3,
                            })
                          }
                          className="w-full rounded-lg border border-violet-200 bg-white p-2.5 text-left transition hover:border-violet-400 hover:bg-violet-50/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-violet-900">
                              {sr.name}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                              <Navigation className="h-2.5 w-2.5" />
                              {sr.tag}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-slate-600">
                            {sr.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {country.thematic && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 text-xs font-bold text-slate-500">
                      基礎指標（主題図対応）
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[10px] text-slate-500">代表気候区分</div>
                        <div className="font-bold text-slate-800">
                          {country.thematic.koppenMain}（{country.thematic.koppenGroup}）
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[10px] text-slate-500">年降水量・平均標高</div>
                        <div className="font-bold text-slate-800">
                          約{country.thematic.annualPrecipMm}mm / {country.thematic.meanElevationM}m
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[10px] text-slate-500">主要農業</div>
                        <div className="truncate font-bold text-slate-800">
                          {country.thematic.agricultureMain}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[10px] text-slate-500">多数派宗教</div>
                        <div className="truncate font-bold text-slate-800">
                          {country.thematic.religionMain}
                        </div>
                      </div>
                      <div className="col-span-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <div className="text-[10px] text-slate-500">言語系統</div>
                        <div className="font-bold text-slate-800">
                          {country.thematic.languageFamilyMain}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {country.relations && country.relations.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-slate-900">
                        他国・主要パートナーとの関係
                      </h3>
                      <span className="text-[10px] text-slate-400">タップで相手国へ移動</span>
                    </div>
                    <div className="space-y-2">
                      {country.relations.map((rel) => {
                        const catStyle = RELATION_CATEGORY_STYLE[rel.category];
                        const hasTarget = Boolean(allCountries?.[rel.partnerIso3]);
                        return (
                          <div
                            key={`${rel.partnerIso3}-${rel.category}-${rel.direction}`}
                            className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${catStyle.badgeClass}`}
                                >
                                  {catStyle.label}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {rel.partnerNameJa}
                                </span>
                              </div>
                              {hasTarget && (
                                <button
                                  type="button"
                                  onClick={() => onSelectCountry(rel.partnerIso3)}
                                  className="inline-flex items-center gap-0.5 rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[10.5px] font-bold text-indigo-700 hover:bg-indigo-50"
                                >
                                  <span>{rel.partnerNameJa}を見る</span>
                                  <ArrowUpRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                              {rel.summary}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {country.dailyLife && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        生活
                      </h3>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        衣食住・街の様子
                      </span>
                    </div>

                    {country.dailyLife.photos.filter((p) => !failedPhotoUrls[p.url]).length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {country.dailyLife.photos
                          .filter((p) => !failedPhotoUrls[p.url])
                          .map((photo) => (
                            <figure
                              key={photo.url}
                              className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <button
                                type="button"
                                onClick={() => setZoomPhoto(photo)}
                                className="relative block w-full overflow-hidden text-left"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={() =>
                                    setFailedPhotoUrls((prev) => ({ ...prev, [photo.url]: true }))
                                  }
                                  className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  <Maximize2 className="h-2.5 w-2.5" />
                                  拡大
                                </span>
                              </button>
                              <figcaption className="p-2 text-[11px] leading-snug text-slate-700">
                                <div className="font-semibold">{photo.caption}</div>
                                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                  {photo.credit}
                                </div>
                              </figcaption>
                            </figure>
                          ))}
                      </div>
                    )}

                    <p className="text-xs leading-relaxed text-slate-700">
                      <RichGeoText
                        text={country.dailyLife.summary}
                        blindMode={blindMode}
                        forceReveal={forceReveal}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>

                    <div className="space-y-2 border-t border-slate-100 pt-2.5 text-xs">
                      <div className="flex items-start gap-2">
                        <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                        <div>
                          <span className="font-bold text-slate-800">日々の食事：</span>
                          <span className="text-slate-700">{country.dailyLife.food}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Home className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        <div>
                          <span className="font-bold text-slate-800">住まいと気候適応：</span>
                          <span className="text-slate-700">{country.dailyLife.housing}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-800">街角の風景：</span>
                          <span className="text-slate-700">
                            <RichGeoText
                              text={country.dailyLife.streetNote}
                              blindMode={blindMode}
                              forceReveal={forceReveal}
                              placeMatcher={placeMatcher}
                              onFocusPlace={onFocusPlace}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. 自然環境・地形 */}
            {activeTab === 'nature' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="text-xs font-bold text-slate-500">属する造山帯・大地形</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {country.nature.orogenicBelts.map((belt) => (
                      <span
                        key={belt}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
                      >
                        {blindMode ? (
                          <ClozeTermButton term={belt} forceReveal={forceReveal} />
                        ) : (
                          belt
                        )}
                      </span>
                    ))}
                  </div>
                  {country.nature.summary && (
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={country.nature.summary}
                        blindMode={blindMode}
                        forceReveal={forceReveal}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                    重要地形・自然環境ポイント
                  </h3>
                  {country.nature.items.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                      onOpenQuestion={onOpenExamModal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. 気候・グラフ動的描画 */}
            {activeTab === 'climate' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-500">ケッペンの気候区分</div>
                    <div className="flex flex-wrap gap-1">
                      {country.climate.koppenCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded-md bg-sky-100 px-2 py-0.5 font-mono text-xs font-bold text-sky-800"
                        >
                          {blindMode ? (
                            <ClozeTermButton term={code} forceReveal={forceReveal} />
                          ) : (
                            code
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                    <RichGeoText
                      text={country.climate.summary}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </div>

                {/* 都市切替＆グラフ表示切替 */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {country.climate.cities.map((city) => {
                      const active = city.cityId === activeCity?.cityId;
                      return (
                        <button
                          key={city.cityId}
                          type="button"
                          onClick={() => setSelectedCityId(city.cityId)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition ${
                            active
                              ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <MapPin className="h-3 w-3" />
                          {blindMode && !forceReveal
                            ? `都市 ${country.climate.cities.indexOf(city) + 1}`
                            : `${city.nameJa} (${city.koppenCode})`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
                    {(
                      [
                        { id: 'both', label: '両方' },
                        { id: 'climograph', label: '雨温図' },
                        { id: 'hythergraph', label: 'ハイサー' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setChartMode(opt.id)}
                        className={`rounded-md px-2 py-1 font-semibold ${
                          chartMode === opt.id
                            ? 'bg-sky-100 text-sky-800'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!activeCity && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
                    この国・地域の代表都市別の月別気温・降水量（雨温図）は未収録です。地図左上の主題図「気候区分」で地域の気候帯分布を直接確認できるほか、ヘッダーの「2都市グラフ比較」から主要87都市の雨温図を比較できます。
                  </div>
                )}

                {activeCity && (
                  <>
                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 font-semibold text-slate-800">
                        <span>
                          {blindMode && !forceReveal
                            ? '暗記モード中（下のグラフ内で都市名を確認できます）'
                            : `${activeCity.nameJa}（${activeCity.koppenNameJa ?? activeCity.koppenCode}）`}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          緯度 {activeCity.lat.toFixed(1)}° / 経度 {activeCity.lng.toFixed(1)}°
                          {activeCity.elevationM != null ? ` / 標高 ${activeCity.elevationM}m` : ''}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {activeCity.factors.map((f) => (
                            <span
                              key={f}
                              className="rounded bg-white px-2 py-0.5 text-[11px] text-sky-900 shadow-2xs"
                            >
                              成因: {f}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(!blindMode || forceReveal) && (
                            <button
                              type="button"
                              onClick={() =>
                                onFocusPlace({
                                  id: `clim-city-${activeCity.cityId}`,
                                  name: activeCity.nameJa,
                                  aliases: [],
                                  category: `気候都市（${activeCity.koppenCode}）`,
                                  summary: `${country.nameJa}の${activeCity.nameJa}（${activeCity.koppenCode} / ${activeCity.koppenNameJa ?? ''}）`,
                                  lng: activeCity.lng,
                                  lat: activeCity.lat,
                                  zoom: 6.5,
                                  iso3: country.iso3,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                            >
                              <Navigation className="h-3 w-3" />
                              地図で位置を見る
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onCompareCity(activeCity.cityId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-50"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            他都市とグラフ比較
                          </button>
                        </div>
                      </div>
                    </div>

                    {(chartMode === 'both' || chartMode === 'climograph') && (
                      <ClimographChart
                        city={activeCity}
                        height={250}
                        blindMode={blindMode && !forceReveal}
                      />
                    )}
                    {(chartMode === 'both' || chartMode === 'hythergraph') && (
                      <HythergraphChart
                        city={activeCity}
                        height={260}
                        blindMode={blindMode && !forceReveal}
                      />
                    )}
                    {activeCity.dataSource && (
                      <p className="text-right text-[11px] text-slate-400">
                        出典目安: {activeCity.dataSource}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 3. 産業・経済 */}
            {activeTab === 'industry' && (
              <div className="space-y-4">
                {country.stats && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs">
                      <div>
                        <div className="text-[10px] text-slate-500">名目GDP（世界順位）</div>
                        <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                          {formatJapaneseGdp(country.stats.gdpBillionUsd)}
                          {country.stats.gdpWorldRank && (
                            <span className="ml-1 text-xs text-indigo-700">
                              （{country.stats.gdpWorldRank}位）
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">1人当たりGDP</div>
                        <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                          ${country.stats.gdpPerCapitaUsd.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <IndustryTernaryChart
                      countryName={country.nameJa.split('（')[0]}
                      sectorShare={country.stats.sectorShare}
                      allCountries={allCountries}
                      currentIso3={country.iso3}
                    />
                  </div>
                )}

                {country.highlightVisuals
                  ?.filter((v) => v.placement === 'industry')
                  .map((v) => (
                    <HighlightVisualCard key={v.id} visual={v} />
                  ))}

                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="text-xs font-bold text-slate-500">ホイットルセー農牧業区分</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {country.industry.whittleseyTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                      >
                        {blindMode ? (
                          <ClozeTermButton term={type} forceReveal={forceReveal} />
                        ) : (
                          type
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">農産物・特産品</h3>
                  {country.industry.agriculture.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                      onOpenQuestion={onOpenExamModal}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">鉱産資源・エネルギー</h3>
                  {country.industry.resourcesAndEnergy.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                      onOpenQuestion={onOpenExamModal}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">主要工業地域・産業構造</h3>
                  {country.industry.industrialRegions.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                      onOpenQuestion={onOpenExamModal}
                    />
                  ))}
                </div>

                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <h3 className="font-bold text-slate-800">貿易構造・主要相手国</h3>
                  <div>
                    <span className="font-semibold text-slate-500">主要輸出品目：</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {country.industry.trade.majorExports.map((ex) => (
                        <span key={ex} className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                  {country.industry.trade.majorImports && (
                    <div>
                      <span className="font-semibold text-slate-500">主要輸入品目：</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {country.industry.trade.majorImports.map((im) => (
                          <span key={im} className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                            {im}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-500">主要貿易相手：</span>
                    <span className="text-slate-800">
                      {country.industry.trade.majorPartners.join('、')}
                    </span>
                  </div>
                  {country.industry.trade.note && (
                    <p className="text-slate-600">{country.industry.trade.note}</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. 人口・都市 */}
            {activeTab === 'population' && (
              <div className="space-y-4">
                {country.stats && (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[10px] text-slate-500">総人口</div>
                          <div className="font-extrabold text-slate-900">
                            {formatJapanesePopulation(country.stats.population)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">人口密度</div>
                          <div className="font-extrabold text-slate-900">
                            {country.stats.populationDensity.toLocaleString()} 人/km²
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">国土面積</div>
                          <div className="font-extrabold text-slate-900">
                            {country.stats.areaKm2.toLocaleString()} km²
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">都市人口率</span>
                          <span className="font-extrabold text-indigo-700">
                            {country.stats.urbanPopRatePct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(100, Math.max(2, country.stats.urbanPopRatePct))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <PopulationPyramidChart
                      countryName={country.nameJa.split('（')[0]}
                      bins={country.stats.agePyramid}
                      pyramidType={country.stats.pyramidType}
                    />
                  </>
                )}

                {country.highlightVisuals
                  ?.filter((v) => v.placement === 'population')
                  .map((v) => (
                    <HighlightVisualCard key={v.id} visual={v} />
                  ))}

                {country.topCities && country.topCities.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900">
                        国内の主な人口上位都市（タップで地図移動）
                      </h4>
                      <span className="text-[10px] text-slate-400">市域/都市圏目安</span>
                    </div>
                    <div className="space-y-2">
                      {country.topCities.map((city, idx) => (
                        <button
                          key={city.nameJa}
                          type="button"
                          onClick={() =>
                            onFocusPlace({
                              id: `tc-${country.iso3}-${idx}`,
                              name: city.nameJa,
                              aliases: [],
                              category: city.isCapital ? '首都・主要都市' : '主要都市',
                              summary: `${country.nameJa}第${idx + 1}位（約${city.popMan.toLocaleString()}万人）。${city.note}`,
                              lng: city.lng,
                              lat: city.lat,
                              zoom: 6.5,
                              iso3: country.iso3,
                            })
                          }
                          className="flex w-full items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-extrabold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900">
                                {blindMode && !forceReveal ? `都市 ${idx + 1}` : city.nameJa}
                                {city.isCapital && (
                                  <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    首都
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-indigo-700">
                                約{city.popMan.toLocaleString()}万人
                                {city.metroPopMan ? `（都市圏${city.metroPopMan.toLocaleString()}万）` : ''}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                              {city.note}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. 生活文化・歴史・国際関係 */}
            {activeTab === 'culture' && (
              <div className="space-y-4">
                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <div>
                    <div className="font-bold text-slate-500">言語系統・公用語</div>
                    <p className="mt-1 font-medium text-slate-800">
                      {blindMode ? (
                        <ClozeTermButton
                          term={country.cultureAndHistory.languageFamily}
                          forceReveal={forceReveal}
                        />
                      ) : (
                        country.cultureAndHistory.languageFamily
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {country.cultureAndHistory.officialLanguages.map((lang) => (
                        <span key={lang} className="rounded bg-violet-50 px-2 py-0.5 font-semibold text-violet-800">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <div className="font-bold text-slate-500">宗教構成（目安）</div>
                    <div className="mt-1.5 space-y-1.5">
                      {country.cultureAndHistory.religions.map((rel) => (
                        <div key={rel.name}>
                          <div className="flex justify-between text-slate-700">
                            <span>{rel.name}</span>
                            {rel.percent != null && <span className="font-bold">{rel.percent}%</span>}
                          </div>
                          {rel.percent != null && (
                            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.min(100, Math.max(2, rel.percent))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <div className="font-bold text-slate-500">民族構成</div>
                    <p className="mt-1 text-slate-700">
                      {country.cultureAndHistory.ethnicGroups.join(' ／ ')}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <div className="font-bold text-slate-500">加盟している主な地域統合・国際枠組み</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {country.cultureAndHistory.regionalIntegrations.map((org) => (
                        <span
                          key={org}
                          className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 font-semibold text-teal-800"
                        >
                          {blindMode ? (
                            <ClozeTermButton term={org} forceReveal={forceReveal} />
                          ) : (
                            org
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {country.highlightVisuals
                  ?.filter((v) => v.placement === 'culture')
                  .map((v) => (
                    <HighlightVisualCard key={v.id} visual={v} />
                  ))}

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">歴史的経緯・国際関係・課題</h3>
                  {country.cultureAndHistory.historicalContext.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      blindMode={blindMode}
                      forceReveal={forceReveal}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                      onOpenQuestion={onOpenExamModal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomPhoto.url}
              alt={zoomPhoto.caption}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-full object-contain bg-slate-900"
            />
            <div className="flex items-center justify-between gap-3 p-3 text-xs">
              <div>
                <div className="font-bold text-slate-900">{zoomPhoto.caption}</div>
                <div className="text-[11px] text-slate-500">{zoomPhoto.credit}</div>
              </div>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
