import {
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudSun,
  Compass,
  Factory,
  GitCompareArrows,
  Globe2,
  Home,
  Landmark,
  Layers,
  LocateFixed,
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
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CountryData,
  CountryRelation,
  DailyLifePhoto,
  KnowledgeItem,
  PastExamQuestion,
  PlaceEntry,
} from '../../types/schema_v1';
import { formatExamId, RANK_BADGE_CLASSES, RANK_LABELS } from '../../utils/constants';
import type { PlaceMatcher } from '../../utils/places';
import { ClimographChart } from '../charts/ClimographChart';
import { HighlightVisualCard } from '../charts/HighlightVisualCard';
import { HythergraphChart } from '../charts/HythergraphChart';
import { IndustryTernaryChart } from '../charts/IndustryTernaryChart';
import { PopulationPyramidChart } from '../charts/PopulationPyramidChart';
import { RichGeoText } from '../study/RichGeoText';
import { CountryCompareModal } from './CountryCompareModal';
import { SubnationalRegionTab } from './SubnationalRegionTab';

const NOOP = () => {};

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
  isMarked: boolean;
  placeMatcher?: PlaceMatcher | null;
  mobileSheetVh: number;
  onChangeMobileSheetVh: (vh: number) => void;
  onFocusPlace: (place: PlaceEntry) => void;
  onClearSubnationalOverlay?: () => void;
  onToggleMark: (iso3: string) => void;
  onSelectCountry: (iso3: string) => void;
  onFlyToCountry?: (iso3: string) => void;
  onClose: () => void;
  onOpenExamModal?: (initialQuestionId?: string) => void;
  onPracticeCountry?: (iso3: string, label: string) => void;
}

type DetailTab = 'overview' | 'regions' | 'nature' | 'climate' | 'industry' | 'population' | 'culture';
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
  placeMatcher,
  allCountries,
  onFocusPlace,
  onOpenQuestion,
  onSelectCountry,
}: {
  item: KnowledgeItem;
  placeMatcher?: PlaceMatcher | null;
  allCountries?: Record<string, CountryData>;
  onFocusPlace: (place: PlaceEntry) => void;
  onOpenQuestion?: (questionId?: string) => void;
  onSelectCountry?: (iso3: string) => void;
}) {
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);

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
            placeMatcher={placeMatcher}
            onFocusPlace={onFocusPlace}
          />
        </p>
      )}

      {item.detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 md:text-[13px]">
          <RichGeoText
            text={item.detail}
            placeMatcher={placeMatcher}
            onFocusPlace={onFocusPlace}
          />
        </p>
      )}

      {item.deepDive && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setDeepDiveOpen((prev) => !prev)}
            className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11.5px] font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-800"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
              詳細解説（成因・時代変化・比較の視点）
            </span>
            {deepDiveOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>

          {deepDiveOpen && (
            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-xs">
              {item.deepDive.mechanism && (
                <div className="rounded-md border border-slate-200 border-l-2 border-l-sky-500 bg-white px-2.5 py-2">
                  <div className="font-bold text-slate-900">成因・メカニズム</div>
                  <p className="mt-0.5 leading-relaxed text-slate-700">
                    <RichGeoText
                      text={item.deepDive.mechanism}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </div>
              )}
              {item.deepDive.historicalShift && (
                <div className="rounded-md border border-slate-200 border-l-2 border-l-amber-500 bg-white px-2.5 py-2">
                  <div className="font-bold text-slate-900">時代変化・最新動向</div>
                  <p className="mt-0.5 leading-relaxed text-slate-700">
                    <RichGeoText
                      text={item.deepDive.historicalShift}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </div>
              )}
              {item.deepDive.examTrap && (
                <div className="rounded-md border border-slate-200 border-l-2 border-l-rose-400 bg-white px-2.5 py-2">
                  <div className="font-bold text-slate-900">出題上の注意点・判別ポイント</div>
                  <p className="mt-0.5 leading-relaxed text-slate-700">
                    <RichGeoText
                      text={item.deepDive.examTrap}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </div>
              )}
              {item.deepDive.compareNote && (
                <div className="rounded-md border border-slate-200 border-l-2 border-l-emerald-500 bg-white px-2.5 py-2">
                  <div className="font-bold text-slate-900">他国比較の視点</div>
                  <p className="mt-0.5 leading-relaxed text-slate-700">
                    <RichGeoText
                      text={item.deepDive.compareNote}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </div>
              )}
              {item.deepDive.relatedIso3s &&
                item.deepDive.relatedIso3s.length > 0 &&
                onSelectCountry && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-500">関連国へジャンプ:</span>
                    {item.deepDive.relatedIso3s.map((relIso) => (
                      <button
                        key={relIso}
                        type="button"
                        onClick={() => onSelectCountry(relIso)}
                        className="inline-flex items-center gap-0.5 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        {allCountries?.[relIso]?.nameJa ?? relIso}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* タグと出題履歴 */}
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
            {item.examMeta.pastExamRefs.map((ref, idx) =>
              onOpenQuestion ? (
                <button
                  key={`${ref.examId}-${idx}`}
                  type="button"
                  onClick={() => onOpenQuestion(ref.questionId)}
                  className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <BookOpen className="h-3 w-3" />
                  {formatExamId(ref.examId)} {ref.questionLabel}
                </button>
              ) : (
                <span
                  key={`${ref.examId}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  <BookOpen className="h-3 w-3 text-slate-400" />
                  {formatExamId(ref.examId)} {ref.questionLabel}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 選択した国の詳細ビュー
 * - PC (md以上): 右サイドパネル
 * - スマホ (md未満): 下からスライド出現し、ドラッグで高さを自由に調節して地図と同時に見られるボトムシート
 */
export function CountryDetailPanel({
  iso3,
  fallbackNameEn,
  country,
  allCountries,
  relatedQuestions,
  isMarked,
  placeMatcher,
  mobileSheetVh,
  onChangeMobileSheetVh,
  onFocusPlace,
  onClearSubnationalOverlay,
  onToggleMark,
  onSelectCountry,
  onFlyToCountry,
  onClose,
  onOpenExamModal,
  onPracticeCountry,
}: CountryDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedCityId, setSelectedCityId] = useState<string>(
    () => country?.climate.cities[0]?.cityId ?? '',
  );
  const [selectedKoppenCode, setSelectedKoppenCode] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<ChartViewMode>('both');
  const [zoomPhoto, setZoomPhoto] = useState<DailyLifePhoto | null>(null);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, boolean>>({});
  const [showAllExamYears, setShowAllExamYears] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparePartnerIso3, setComparePartnerIso3] = useState<string | null>(null);

  // スマホ用ボトムシートのスライドイン＆ドラッグ状態
  const [sheetEntered, setSheetEntered] = useState(false);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStateRef = useRef<{
    startY: number;
    startVh: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setSheetEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const hasSubnational = Boolean(country?.subnational);
  const effectiveTab: DetailTab =
    activeTab === 'regions' && !hasSubnational ? 'overview' : activeTab;

  const activeCity =
    country?.climate.cities.find((c) => c.cityId === selectedCityId) ??
    country?.climate.cities[0];

  const handlePlaceClick = useCallback(
    (place: PlaceEntry) => {
      onFocusPlace(place);
      if (
        !place.skipCameraMove &&
        typeof window !== 'undefined' &&
        window.innerWidth < 768 &&
        mobileSheetVh > 45
      ) {
        onChangeMobileSheetVh(40);
      }
    },
    [onFocusPlace, mobileSheetVh, onChangeMobileSheetVh],
  );

  // 気候タブ表示中は現在選択中の気候都市（または代表地点）をカメラ移動なしで自動ハイライト
  useEffect(() => {
    if (effectiveTab !== 'climate' || !country) return;
    if (activeCity) {
      onFocusPlace({
        id: `clim-city-${activeCity.cityId}`,
        name: `${activeCity.nameJa}（${activeCity.koppenCode}）`,
        aliases: [],
        category: `気候区分 ${activeCity.koppenCode}`,
        summary: `${country.nameJa}の${activeCity.nameJa}（${activeCity.koppenCode}${activeCity.koppenNameJa ? ` / ${activeCity.koppenNameJa}` : ''}）`,
        lng: activeCity.lng,
        lat: activeCity.lat,
        zoom: 6.5,
        iso3: country.iso3,
        skipCameraMove: true,
      });
      return;
    }
    const fallbackCity = country.topCities?.[0];
    if (fallbackCity) {
      const kCode = selectedKoppenCode ?? country.climate.koppenCodes[0] ?? '';
      onFocusPlace({
        id: `clim-country-${country.iso3}-${kCode}`,
        name: `${country.nameJa}（${kCode}）`,
        aliases: [],
        category: `気候区分 ${kCode}`,
        summary: `${country.nameJa}の代表気候区分（${kCode}）`,
        lng: fallbackCity.lng,
        lat: fallbackCity.lat,
        zoom: 5.5,
        iso3: country.iso3,
        skipCameraMove: true,
      });
    }
  }, [effectiveTab, activeCity, country, selectedKoppenCode, onFocusPlace]);

  if (!iso3) {
    return null;
  }

  const handleKoppenBadgeClick = (code: string) => {
    setSelectedKoppenCode(code);
    if (!country) return;
    const matchedCity = country.climate.cities.find((c) => c.koppenCode === code);
    if (matchedCity) {
      setSelectedCityId(matchedCity.cityId);
      onFocusPlace({
        id: `clim-city-${matchedCity.cityId}`,
        name: `${matchedCity.nameJa}（${matchedCity.koppenCode}）`,
        aliases: [],
        category: `気候区分 ${matchedCity.koppenCode}`,
        summary: `${country.nameJa}の${matchedCity.nameJa}（${matchedCity.koppenCode}${matchedCity.koppenNameJa ? ` / ${matchedCity.koppenNameJa}` : ''}）`,
        lng: matchedCity.lng,
        lat: matchedCity.lat,
        zoom: 6.5,
        iso3: country.iso3,
        skipCameraMove: true,
      });
      return;
    }
    const fallbackCity = activeCity ?? country.topCities?.[0];
    if (fallbackCity) {
      onFocusPlace({
        id: `clim-code-${country.iso3}-${code}`,
        name: `${country.nameJa}（${code}）`,
        aliases: [],
        category: `気候区分 ${code}`,
        summary: `${country.nameJa}に分布する気候区分 ${code}`,
        lng: fallbackCity.lng,
        lat: fallbackCity.lat,
        zoom: 5.5,
        iso3: country.iso3,
        skipCameraMove: true,
      });
    }
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (typeof window !== 'undefined' && window.innerWidth >= 768) ||
      (e.target as HTMLElement).closest('button')
    ) {
      return;
    }
    dragStateRef.current = {
      startY: e.clientY,
      startVh: mobileSheetVh,
      moved: false,
    };
    setIsDraggingSheet(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st || typeof window === 'undefined') return;
    const dy = st.startY - e.clientY;
    if (Math.abs(dy) > 4) {
      st.moved = true;
    }
    const deltaVh = (dy / Math.max(320, window.innerHeight)) * 100;
    const nextVh = Math.round(Math.min(86, Math.max(22, st.startVh + deltaVh)));
    onChangeMobileSheetVh(nextVh);
  };

  const handleSheetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    dragStateRef.current = null;
    setIsDraggingSheet(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (st && !st.moved) {
      // タップ時は「半分(52%) → 大きく(82%) → 低め(28%)」をサイクル切替
      if (mobileSheetVh < 40) onChangeMobileSheetVh(52);
      else if (mobileSheetVh < 70) onChangeMobileSheetVh(82);
      else onChangeMobileSheetVh(28);
    }
  };

  const tabs: { id: DetailTab; shortLabel: string; label: string; icon: typeof Mountain }[] = [
    { id: 'overview', shortLabel: '概要', label: '概要・生活', icon: Sparkles },
    ...(hasSubnational
      ? [{ id: 'regions' as const, shortLabel: '地域', label: '国内地域', icon: Layers }]
      : []),
    { id: 'nature', shortLabel: '自然', label: '自然・地形', icon: Mountain },
    { id: 'climate', shortLabel: '気候', label: '気候・雨温図', icon: CloudSun },
    { id: 'industry', shortLabel: '産業', label: '産業・経済', icon: Factory },
    { id: 'population', shortLabel: '人口', label: '人口・都市', icon: Users },
    { id: 'culture', shortLabel: '文化', label: '文化・歴史', icon: Landmark },
  ];

  return (
    <aside
      style={{ '--sheet-h': `${mobileSheetVh}vh` } as React.CSSProperties}
      className={`fixed inset-x-0 bottom-0 z-30 flex h-[var(--sheet-h)] flex-col rounded-t-2xl border-t border-slate-300 bg-slate-50 shadow-2xl ${
        isDraggingSheet ? '' : 'transition-transform duration-300 ease-out'
      } ${sheetEntered ? 'translate-y-0' : 'translate-y-full'} md:static md:inset-auto md:z-20 md:h-full md:w-[470px] md:shrink-0 md:translate-y-0 md:rounded-none md:border-l md:border-t-0 md:border-slate-200 lg:w-[540px]`}
      aria-label="国別詳細パネル"
    >
      {/* パネルヘッダー（スマホ時はドラッグバー＋1行国名のみの極薄固定ヘッダー） */}
      <div
        onPointerDown={handleSheetPointerDown}
        onPointerMove={handleSheetPointerMove}
        onPointerUp={handleSheetPointerUp}
        onPointerCancel={handleSheetPointerUp}
        className="touch-none select-none rounded-t-2xl border-b border-slate-200 bg-white px-2.5 pb-1 pt-1 md:touch-auto md:select-text md:rounded-none md:px-4 md:py-3"
      >
        <div
          className="mb-1 flex justify-center md:hidden"
          aria-label="上下にドラッグしてパネルの高さを調整"
        >
          <div className="h-1 w-9 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between gap-1.5 md:items-start md:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-nowrap items-center gap-1.5 md:flex-wrap md:gap-2">
              <h2 className="truncate text-sm font-extrabold text-slate-900 md:text-xl">
                {country ? country.nameJa : (fallbackNameEn ?? iso3)}
              </h2>
              <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 md:inline-block">
                {iso3}
              </span>
              {country && !country.isBasicEntry && (
                <>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0 text-[10px] font-extrabold md:hidden ${RANK_BADGE_CLASSES[country.examSummary.rank]}`}
                  >
                    {country.examSummary.rank}
                  </span>
                  <span
                    className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-bold md:inline-block ${RANK_BADGE_CLASSES[country.examSummary.rank]}`}
                  >
                    重要度 {RANK_LABELS[country.examSummary.rank]}
                  </span>
                </>
              )}
              {country?.isBasicEntry && (
                <span className="hidden rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 md:inline-block">
                  基礎データ収録
                </span>
              )}
            </div>

            {country ? (
              <p className="mt-0.5 hidden text-xs text-slate-500 md:block">
                {country.nameEn} ／ {country.region}（{country.subRegion}） ／ 首都：
                <strong className="text-slate-700">{country.capital}</strong>
              </p>
            ) : (
              <p className="mt-0.5 hidden text-xs text-slate-500 md:block">
                {fallbackNameEn ?? ''}（詳細データ未登録）
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
            {iso3 && onFlyToCountry && (
              <button
                type="button"
                onClick={() => onFlyToCountry(iso3)}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-1.5 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-100 md:px-2.5"
                title="地図上でこの国の位置へ移動する"
                aria-label="地図上でこの国の位置へ移動"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                <span className="hidden md:inline">場所へ</span>
              </button>
            )}
            {country && !country.isBasicEntry && onPracticeCountry && (
              <button
                type="button"
                onClick={() => onPracticeCountry(country.iso3, country.nameJa.split('（')[0])}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 md:px-2.5"
                title="この国に関連する実戦問題を解く"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden md:inline">演習</span>
              </button>
            )}
            {country && allCountries && (
              <button
                type="button"
                onClick={() => {
                  setComparePartnerIso3(null);
                  setIsCompareOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-1.5 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 md:px-2.5"
                title="他国と統計・特徴を並べて比較する"
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                <span className="hidden md:inline">比較</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleMark(iso3)}
              className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-xs font-bold transition md:px-2.5 ${
                isMarked
                  ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="地図上で★マークとして記録する"
            >
              <Star className={`h-3.5 w-3.5 ${isMarked ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span className="hidden md:inline">{isMarked ? 'マーク済' : 'マーク'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:p-1.5"
              aria-label="パネルを閉じる"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>

        {/* 出題履歴タグ・過去問ボタン（PCのみ固定ヘッダー表示・スマホはスクロール領域へ移動） */}
        {country &&
          (!country.isBasicEntry ||
            country.examSummary.years.length > 0 ||
            relatedQuestions.length > 0) && (
            <div className="mt-2 hidden space-y-2 md:block">
              <div className="flex flex-wrap items-center gap-1">
                {country.examSummary.years.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-500">出題履歴</span>
                )}
                {(showAllExamYears
                  ? [...country.examSummary.years].reverse()
                  : [...country.examSummary.years].reverse().slice(0, 6)
                ).map((yr) => (
                  <span
                    key={yr}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    {formatExamId(yr)}
                  </span>
                ))}
                {country.examSummary.years.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllExamYears((v) => !v)}
                    className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-300"
                    title={country.examSummary.years.map(formatExamId).join('、')}
                  >
                    {showAllExamYears
                      ? '折りたたむ'
                      : `+${country.examSummary.years.length - 6}回`}
                  </button>
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

              {onOpenExamModal && relatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenExamModal()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-indigo-700"
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
            選択した地域の個別統計は未登録です。地図上の各国をタップするか、上部の検索バーから対象国・地域を選択してください。
          </p>
        </div>
      ) : (
        <>
          {/* 6〜7カテゴリタブ */}
          <div
            className={`grid border-b border-slate-200 bg-white ${
              tabs.length === 7 ? 'grid-cols-7' : 'grid-cols-6'
            }`}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 border-b-2 px-0.5 py-1.5 text-[11px] font-bold transition md:gap-1 md:py-2.5 ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="hidden h-4 w-4 shrink-0 md:block" />
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden truncate sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ領域 */}
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            {/* スマホ専用：基礎情報・出題履歴・過去問ボタンをスクロール内最上部に収納 */}
            <div className="mb-2.5 space-y-1.5 rounded-lg border border-slate-200 bg-white p-2 text-[11px] md:hidden">
              <div className="text-slate-600">
                <span className="font-mono text-[10px] text-slate-400">{iso3}</span>{' '}
                {country.nameEn} ／ {country.region} ／ 首都：
                <strong className="text-slate-800">{country.capital}</strong>
              </div>

              {country.examSummary.years.length > 0 && (
                <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-0.5">
                  <span className="shrink-0 whitespace-nowrap text-[9.5px] font-bold text-slate-500">
                    出題履歴
                  </span>
                  {(showAllExamYears
                    ? [...country.examSummary.years].reverse()
                    : [...country.examSummary.years].reverse().slice(0, 6)
                  ).map((yr) => (
                    <span
                      key={yr}
                      className="shrink-0 whitespace-nowrap rounded bg-slate-100 px-1 py-0.5 text-[9.5px] font-medium text-slate-700"
                    >
                      {formatExamId(yr)}
                    </span>
                  ))}
                  {country.examSummary.years.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllExamYears((v) => !v)}
                      className="shrink-0 whitespace-nowrap rounded bg-slate-200 px-1 py-0.5 text-[9.5px] font-bold text-slate-700"
                    >
                      {showAllExamYears
                        ? '折りたたむ'
                        : `+${country.examSummary.years.length - 6}回`}
                    </button>
                  )}
                </div>
              )}

              {onOpenExamModal && relatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenExamModal()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11.5px] font-bold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  関連する過去問を見る・解く
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                    {relatedQuestions.length}問
                  </span>
                </button>
              )}
            </div>

            {/* 0. 概要・生活（初期表示タブ） */}
            {effectiveTab === 'overview' && (
              <div className="space-y-3 md:space-y-4">
                {(country.quickOverview || country.examCheatSheet) && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="text-xs font-bold text-indigo-700">
                      国の概要・重要ポイント
                    </div>

                    <h3 className="text-sm font-extrabold leading-snug text-slate-900 md:text-base">
                      {country.quickOverview?.headline ?? country.examCheatSheet?.oneLineKey}
                    </h3>

                    {country.quickOverview?.summary ? (
                      <p className="text-xs leading-relaxed text-slate-700 md:text-[13px]">
                        <RichGeoText
                          text={country.quickOverview.summary}
                          placeMatcher={placeMatcher}
                          onFocusPlace={handlePlaceClick}
                        />
                      </p>
                    ) : null}

                    {country.examCheatSheet?.mustMemorizeStats &&
                      country.examCheatSheet.mustMemorizeStats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {country.examCheatSheet.mustMemorizeStats.map((statText) => (
                            <span
                              key={statText}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                            >
                              {statText}
                            </span>
                          ))}
                        </div>
                      )}

                    {country.quickOverview?.keyPoints && country.quickOverview.keyPoints.length > 0 && (
                      <ul className="space-y-1.5 border-t border-slate-100 pt-2.5">
                        {country.quickOverview.keyPoints.map((pt) => (
                          <li
                            key={pt}
                            className="flex items-start gap-1.5 text-xs font-medium text-slate-800"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                            <span>
                              <RichGeoText
                                text={pt}
                                placeMatcher={placeMatcher}
                                onFocusPlace={handlePlaceClick}
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {!country.isBasicEntry && country.examSummary.frequentTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1 md:hidden">
                    {country.examSummary.frequentTopics.slice(0, 2).map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md bg-red-50 px-2 py-0.5 text-[10.5px] font-semibold leading-snug text-red-700"
                      >
                        ★ {topic}
                      </span>
                    ))}
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

                {country.examCheatSheet?.commonConfusions &&
                  country.examCheatSheet.commonConfusions.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="text-xs font-extrabold text-slate-800">
                        類似国・比較対象との相違点
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {country.examCheatSheet.commonConfusions.map((pair) => (
                          <div
                            key={pair.partnerIso3}
                            className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-extrabold text-slate-900">
                                vs {pair.partnerNameJa}（{pair.title}）
                              </span>
                              <div className="flex items-center gap-1">
                                {allCountries && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setComparePartnerIso3(pair.partnerIso3);
                                      setIsCompareOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-0.5 text-[10.5px] font-bold text-white hover:bg-indigo-700"
                                  >
                                    <GitCompareArrows className="h-3 w-3" />
                                    並べて比較
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSelectCountry(pair.partnerIso3)}
                                  className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  詳細
                                  <ArrowUpRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                              {pair.diffPoint}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {country.highlightVisuals
                  ?.filter((v) => v.placement === 'overview')
                  .map((v) => (
                    <HighlightVisualCard key={v.id} visual={v} />
                  ))}

                {country.specialRegions && country.specialRegions.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                      <Compass className="h-3.5 w-3.5 text-indigo-600" />
                      注目地域・飛び地・特異地形（タップで地図表示）
                    </div>
                    <div className="space-y-2">
                      {country.specialRegions.map((sr) => (
                        <button
                          key={sr.name}
                          type="button"
                          onClick={() =>
                            handlePlaceClick({
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
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {sr.name}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
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
                        placeMatcher={placeMatcher}
                        onFocusPlace={handlePlaceClick}
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
                              placeMatcher={placeMatcher}
                              onFocusPlace={handlePlaceClick}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 0.5. 国内地域差・境界線マップ（対象20カ国） */}
            {effectiveTab === 'regions' && country.subnational && (
              <SubnationalRegionTab
                iso3={country.iso3}
                countryNameJa={country.nameJa}
                subnational={country.subnational}
                onAutoFocusPlace={onFocusPlace}
                onFocusPlace={handlePlaceClick}
                onClearSubnationalOverlay={onClearSubnationalOverlay ?? NOOP}
              />
            )}

            {/* 1. 自然環境・地形 */}
            {effectiveTab === 'nature' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="text-xs font-bold text-slate-500">属する造山帯・大地形</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {country.nature.orogenicBelts.map((belt) => (
                      <span
                        key={belt}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
                      >
                        {belt}
                      </span>
                    ))}
                  </div>
                  {country.nature.summary && (
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={country.nature.summary}
                        placeMatcher={placeMatcher}
                        onFocusPlace={handlePlaceClick}
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
                      placeMatcher={placeMatcher}
                      allCountries={allCountries}
                      onFocusPlace={handlePlaceClick}
                      onOpenQuestion={onOpenExamModal}
                      onSelectCountry={onSelectCountry}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. 気候・グラフ動的描画 */}
            {effectiveTab === 'climate' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-500">
                      ケッペンの気候区分（タップで該当都市を地図ハイライト）
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {country.climate.koppenCodes.map((code) => {
                        const isCodeActive =
                          (activeCity && activeCity.koppenCode === code) ||
                          selectedKoppenCode === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleKoppenBadgeClick(code)}
                            className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold transition ${
                              isCodeActive
                                ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                                : 'border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200'
                            }`}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                    <RichGeoText
                      text={country.climate.summary}
                      placeMatcher={placeMatcher}
                      onFocusPlace={handlePlaceClick}
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
                          {`${city.nameJa} (${city.koppenCode})`}
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
                    この国・地域の代表都市別の月別気温・降水量（雨温図）は未収録です。地図左上の主題図「気候区分」で地域の気候帯分布を直接確認できます。
                  </div>
                )}

                {activeCity && (
                  <>
                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 font-semibold text-slate-800">
                        <span>
                          {`${activeCity.nameJa}（${activeCity.koppenNameJa ?? activeCity.koppenCode}）`}
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                          <MapPin className="h-3 w-3 text-amber-700" />
                          地図上で位置をハイライト中
                        </span>
                      </div>
                    </div>

                    {(chartMode === 'both' || chartMode === 'climograph') && (
                      <ClimographChart city={activeCity} height={250} />
                    )}
                    {(chartMode === 'both' || chartMode === 'hythergraph') && (
                      <HythergraphChart city={activeCity} height={260} />
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
            {effectiveTab === 'industry' && (
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
                        {type}
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
                      placeMatcher={placeMatcher}
                      allCountries={allCountries}
                      onFocusPlace={handlePlaceClick}
                      onOpenQuestion={onOpenExamModal}
                      onSelectCountry={onSelectCountry}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">鉱産資源・エネルギー</h3>
                  {country.industry.resourcesAndEnergy.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      placeMatcher={placeMatcher}
                      allCountries={allCountries}
                      onFocusPlace={handlePlaceClick}
                      onOpenQuestion={onOpenExamModal}
                      onSelectCountry={onSelectCountry}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500">主要工業地域・産業構造</h3>
                  {country.industry.industrialRegions.map((item) => (
                    <KnowledgeItemCard
                      key={item.id}
                      item={item}
                      placeMatcher={placeMatcher}
                      allCountries={allCountries}
                      onFocusPlace={handlePlaceClick}
                      onOpenQuestion={onOpenExamModal}
                      onSelectCountry={onSelectCountry}
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
            {effectiveTab === 'population' && (
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
                            handlePlaceClick({
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
                                {city.nameJa}
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
            {effectiveTab === 'culture' && (
              <div className="space-y-4">
                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <div>
                    <div className="font-bold text-slate-500">言語系統・公用語</div>
                    <p className="mt-1 font-medium text-slate-800">
                      {country.cultureAndHistory.languageFamily}
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
                          {org}
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
                      placeMatcher={placeMatcher}
                      allCountries={allCountries}
                      onFocusPlace={handlePlaceClick}
                      onOpenQuestion={onOpenExamModal}
                      onSelectCountry={onSelectCountry}
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
              className="max-h-[75vh] w-full bg-slate-900 object-contain"
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

      {isCompareOpen && country && allCountries && (
        <CountryCompareModal
          key={`${country.iso3}-${comparePartnerIso3 ?? 'default'}`}
          initialLeftIso3={country.iso3}
          initialRightIso3={comparePartnerIso3 ?? undefined}
          allCountries={allCountries}
          onClose={() => setIsCompareOpen(false)}
          onJumpToCountry={(targetIso) => {
            setIsCompareOpen(false);
            onSelectCountry(targetIso);
          }}
        />
      )}
    </aside>
  );
}
