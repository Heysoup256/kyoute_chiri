import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  BarChart3,
  BookOpen,
  Compass,
  Dices,
  Globe2,
  Loader2,
  MapPin,
  PenTool,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { BlankMapView } from './components/blankmap/BlankMapView';
import { CountryDetailPanel } from './components/detail/CountryDetailPanel';
import { PastExamModal } from './components/exam/PastExamModal';
import { JapanAndMapView } from './components/guide/JapanAndMapView';
import { SystematicGuideView } from './components/guide/SystematicGuideView';
import { WorldRankingsView } from './components/guide/WorldRankingsView';
import { WorldMap, type ThematicGridData } from './components/map/WorldMap';
import { ReverseSearchDrawer } from './components/study/ReverseSearchDrawer';
import { useMarkedCountries } from './hooks/useMarkedCountries';
import type {
  AppViewMode,
  ClimateOverlayState,
  CountriesDataset,
  GeoCountryProperties,
  GeoLayerProperties,
  GeoLayerType,
  JapanGeographyDataset,
  LayerVisibilityState,
  MapColorMode,
  PastExamsDataset,
  PlaceEntry,
  SystematicGuideDataset,
  WorldRankingsDataset,
} from './types/schema_v1';
import {
  DEFAULT_LAYER_VISIBILITY,
  IS_PUBLIC_MODE,
  normalizeKoppen13,
} from './utils/constants';
import { buildPlaceMatcher } from './utils/places';
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  searchCountries,
  type SearchFilterCriteria,
} from './utils/search';

const CountriesBasicSchema = z.object({
  schemaVersion: z.string(),
  countries: z.record(z.string(), z.any()),
});

const PastExamsBasicSchema = z.object({
  schemaVersion: z.string(),
  questions: z.array(z.any()),
});

const HEADER_VIEW_TABS: { id: AppViewMode; label: string; icon: typeof Globe2 }[] = [
  { id: 'map', label: '地図', icon: Globe2 },
  { id: 'blank', label: '白地図', icon: PenTool },
  { id: 'rankings', label: '統計', icon: BarChart3 },
  { id: 'systematic', label: '系統', icon: BookOpen },
  { id: 'japan', label: '日本', icon: MapPin },
];

export function App() {
  const [countriesData, setCountriesData] = useState<CountriesDataset | null>(null);
  const [pastExamsData, setPastExamsData] = useState<PastExamsDataset | null>(null);
  const [worldRankingsData, setWorldRankingsData] = useState<WorldRankingsDataset | null>(null);
  const [systematicData, setSystematicData] = useState<SystematicGuideDataset | null>(null);
  const [japanData, setJapanData] = useState<JapanGeographyDataset | null>(null);
  const [countriesGeoJson, setCountriesGeoJson] = useState<FeatureCollection<
    Geometry,
    GeoCountryProperties
  > | null>(null);
  const [layersGeoJson, setLayersGeoJson] = useState<FeatureCollection<
    Geometry,
    GeoLayerProperties
  > | null>(null);
  const [plateBoundariesGeoJson, setPlateBoundariesGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [capitalsGeoJson, setCapitalsGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [volcanoesGeoJson, setVolcanoesGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [climatePhenomenaGeoJson, setClimatePhenomenaGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [thematicRegionsGeoJson, setThematicRegionsGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [thematicGrid, setThematicGrid] = useState<ThematicGridData | null>(null);
  const [placesData, setPlacesData] = useState<PlaceEntry[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppViewMode>('map');
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [fallbackNameEn, setFallbackNameEn] = useState<string | undefined>(undefined);
  const [mobileSheetVh, setMobileSheetVh] = useState<number>(52);
  const [focusedPlace, setFocusedPlace] = useState<PlaceEntry | null>(null);
  const [mapColorMode, setMapColorMode] = useState<MapColorMode>('heatmap');
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>(
    DEFAULT_LAYER_VISIBILITY,
  );
  const [climateOverlay, setClimateOverlay] = useState<ClimateOverlayState>({
    pressureWind: false,
    season: 'avg',
    monsoon: false,
    enso: false,
    ensoPhase: 'normal',
    cyclone: false,
  });

  // 検索・統計連動ハイライト・過去問モーダル状態
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilterCriteria>(EMPTY_FILTERS);
  const [focusedRankingId, setFocusedRankingId] = useState<string | null>(null);
  const [focusedSystematicId, setFocusedSystematicId] = useState<string | null>(null);
  const [focusedJapanRegionId, setFocusedJapanRegionId] = useState<string | null>(null);
  const [rankingHighlight, setRankingHighlight] = useState<{
    label: string;
    iso3s: string[];
  } | null>(null);
  const [examModalMode, setExamModalMode] = useState<'closed' | 'country' | 'archive'>('closed');
  const [examModalInitialId, setExamModalInitialId] = useState<string | undefined>(undefined);
  const [flyToCountryRequest, setFlyToCountryRequest] = useState<{
    iso3: string;
    nonce: number;
  } | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState<boolean>(false);
  const recentRandomIso3sRef = useRef<string[]>([]);
  const diceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (diceTimerRef.current !== null) {
        window.clearTimeout(diceTimerRef.current);
      }
    };
  }, []);

  // '/' または Ctrl/Cmd+K で横断検索パネルをすばやく開閉
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.key === '/') {
        const el = document.activeElement as HTMLElement | null;
        const tag = el?.tagName ?? '';
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          el?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const { markedIso3s, markedCount, isMarked, toggleMark } = useMarkedCountries();

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const base = import.meta.env.BASE_URL;
        const emptyPastExams: PastExamsDataset = {
          schemaVersion: '1.0.0',
          generatedAt: '',
          questions: [],
        };
        const [
          cRes,
          geoRes,
          layersRes,
          platesRes,
          capsRes,
          volsRes,
          phenomRes,
          tRegRes,
          tGridRes,
          placesRes,
          rankingsRes,
          systematicRes,
          japanRes,
          examsRes,
        ] = await Promise.all([
          fetch(`${base}data/countries_v1.json`),
          fetch(`${base}data/geo_countries_v1.geojson`),
          fetch(`${base}data/geo_layers_v1.geojson`),
          fetch(`${base}data/plate_boundaries_v1.geojson`),
          fetch(`${base}data/capitals_v1.geojson`),
          fetch(`${base}data/volcanoes_v1.geojson`),
          fetch(`${base}data/climate_phenomena_v1.geojson`),
          fetch(`${base}data/thematic_regions_v1.geojson`),
          fetch(`${base}data/thematic_grid_v1.json`),
          fetch(`${base}data/places_v1.json`),
          fetch(`${base}data/world_rankings_v1.json`),
          fetch(`${base}data/systematic_geography_v1.json`),
          fetch(`${base}data/japan_geography_v1.json`),
          IS_PUBLIC_MODE ? Promise.resolve(null) : fetch(`${base}data/past_exams_v1.json`),
        ]);

        if (
          !cRes.ok ||
          !geoRes.ok ||
          !layersRes.ok ||
          !platesRes.ok ||
          !capsRes.ok ||
          !volsRes.ok ||
          !phenomRes.ok ||
          !tRegRes.ok ||
          !tGridRes.ok ||
          !placesRes.ok ||
          !rankingsRes.ok ||
          !systematicRes.ok ||
          !japanRes.ok ||
          (!IS_PUBLIC_MODE && (!examsRes || !examsRes.ok))
        ) {
          throw new Error('静的データファイルの読み込みに失敗しました。');
        }

        const [
          cJson,
          geoJson,
          layersJson,
          platesJson,
          capsJson,
          volsJson,
          phenomJson,
          tRegJson,
          tGridJson,
          placesJson,
          rankingsJson,
          systematicJson,
          japanJson,
          examsJson,
        ] = await Promise.all([
          cRes.json(),
          geoRes.json(),
          layersRes.json(),
          platesRes.json(),
          capsRes.json(),
          volsRes.json(),
          phenomRes.json(),
          tRegRes.json(),
          tGridRes.json(),
          placesRes.json(),
          rankingsRes.json(),
          systematicRes.json(),
          japanRes.json(),
          examsRes ? examsRes.json() : Promise.resolve(emptyPastExams),
        ]);

        CountriesBasicSchema.parse(cJson);
        PastExamsBasicSchema.parse(examsJson);

        if (cancelled) return;
        setCountriesData(cJson as CountriesDataset);
        setCountriesGeoJson(geoJson as FeatureCollection<Geometry, GeoCountryProperties>);
        setLayersGeoJson(layersJson as FeatureCollection<Geometry, GeoLayerProperties>);
        setPlateBoundariesGeoJson(platesJson as FeatureCollection<Geometry>);
        setPastExamsData(examsJson as PastExamsDataset);
        setCapitalsGeoJson(capsJson as FeatureCollection<Geometry>);
        setVolcanoesGeoJson(volsJson as FeatureCollection<Geometry>);
        setClimatePhenomenaGeoJson(phenomJson as FeatureCollection<Geometry>);
        setThematicRegionsGeoJson(tRegJson as FeatureCollection<Geometry>);
        setThematicGrid(tGridJson as ThematicGridData);
        setPlacesData((placesJson as { places?: PlaceEntry[] }).places ?? []);
        setWorldRankingsData(rankingsJson as WorldRankingsDataset);
        setSystematicData(systematicJson as SystematicGuideDataset);
        setJapanData(japanJson as JapanGeographyDataset);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'データ読込エラーが発生しました。');
        }
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // 地図タブに戻ったときに MapLibre コンテナの再計算を促す
  useEffect(() => {
    if (activeView === 'map') {
      const id = window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [activeView]);

  const handleToggleLayer = useCallback((layerType: GeoLayerType) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerType]: !prev[layerType],
    }));
  }, []);

  const handleSelectCountry = useCallback((iso3: string, nameEn?: string) => {
    setSelectedIso3(iso3);
    setFallbackNameEn(nameEn);
    setFocusedPlace(null);
    setActiveView('map');
  }, []);

  const handleRandomCountry = useCallback(() => {
    if (!countriesData) return;
    const allList = Object.values(countriesData.countries);
    const detailedList = allList.filter((c) => !c.isBasicEntry).map((c) => c.iso3);
    const pool = detailedList.length > 0 ? detailedList : allList.map((c) => c.iso3);
    if (pool.length === 0) return;

    const excludeSet = new Set<string>(recentRandomIso3sRef.current);
    if (selectedIso3) excludeSet.add(selectedIso3);
    let candidates = pool.filter((iso) => !excludeSet.has(iso));
    if (candidates.length === 0) {
      recentRandomIso3sRef.current = [];
      candidates = pool.filter((iso) => iso !== selectedIso3);
      if (candidates.length === 0) candidates = pool;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    recentRandomIso3sRef.current = [...recentRandomIso3sRef.current.slice(-11), picked];

    if (diceTimerRef.current !== null) {
      window.clearTimeout(diceTimerRef.current);
    }
    setIsDiceRolling(true);
    diceTimerRef.current = window.setTimeout(() => {
      setIsDiceRolling(false);
    }, 480);

    setSelectedIso3(picked);
    setFallbackNameEn(undefined);
    setFocusedPlace(null);
    setSearchOpen(false);
    setActiveView('map');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSheetVh((prev) => (prev > 46 ? 44 : prev));
    }
    setFlyToCountryRequest((prev) => ({
      iso3: picked,
      nonce: Math.max(Date.now(), (prev?.nonce ?? 0) + 1),
    }));
  }, [countriesData, selectedIso3]);

  const handleFocusPlace = useCallback((place: PlaceEntry) => {
    setFocusedPlace(place);
    if (!place.skipCameraMove) {
      setActiveView('map');
    }
  }, []);

  const handleSelectPlaceFromSearch = useCallback(
    (place: PlaceEntry) => {
      if (place.id.startsWith('pl_geo_') && layersGeoJson) {
        const layerId = place.id.slice('pl_geo_'.length);
        const feat = layersGeoJson.features.find((f) => f.properties.id === layerId);
        if (feat) {
          const lt = feat.properties.layerType;
          setLayerVisibility((prev) => (prev[lt] ? prev : { ...prev, [lt]: true }));
        }
      } else if (place.id.startsWith('vol_') || place.category.startsWith('火山')) {
        setLayerVisibility((prev) => (prev.volcanoes ? prev : { ...prev, volcanoes: true }));
      } else if (place.id.startsWith('cap_') || place.category.includes('首都')) {
        setLayerVisibility((prev) => (prev.capitals ? prev : { ...prev, capitals: true }));
      }
      handleFocusPlace(place);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSearchOpen(false);
      }
    },
    [layersGeoJson, handleFocusPlace],
  );

  const handleClearFocusedPlace = useCallback(() => {
    setFocusedPlace(null);
  }, []);

  const placeMatcher = useMemo(() => buildPlaceMatcher(placesData), [placesData]);

  const selectedCountry = selectedIso3 ? countriesData?.countries[selectedIso3] : undefined;

  const relatedQuestions = useMemo(() => {
    if (!selectedIso3 || !pastExamsData) return [];
    return pastExamsData.questions.filter((q) => q.relatedCountries.includes(selectedIso3));
  }, [selectedIso3, pastExamsData]);

  // 気候都市ポイント GeoJSON（ケッペン気候区分モードで重ねて表示）
  const citiesGeoJson = useMemo<FeatureCollection<Geometry>>(() => {
    if (!countriesData) return { type: 'FeatureCollection', features: [] };
    const features: Feature<Geometry>[] = [];
    for (const country of Object.values(countriesData.countries)) {
      for (const city of country.climate.cities) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [city.lng, city.lat],
          },
          properties: {
            cityId: city.cityId,
            nameJa: city.nameJa,
            koppenCode: city.koppenCode,
            koppen13: normalizeKoppen13(city.koppenCode),
            koppenGroup: city.koppenCode.charAt(0),
            iso3: country.iso3,
            countryNameJa: country.nameJa,
          },
        });
      }
    }
    return { type: 'FeatureCollection', features };
  }, [countriesData]);

  // 検索・フィルターの実行
  const searchHits = useMemo(() => {
    if (!countriesData) return [];
    return searchCountries(countriesData.countries, filters);
  }, [countriesData, filters]);

  const searchActive = hasActiveFilters(filters);
  const highlightedIso3s = useMemo(() => {
    if (searchActive) return searchHits.map((h) => h.country.iso3);
    if (rankingHighlight) return rankingHighlight.iso3s;
    return null;
  }, [searchActive, searchHits, rankingHighlight]);

  const highlightBannerLabel = searchActive
    ? null
    : (rankingHighlight?.label ?? null);

  const handleChangeFilters = useCallback((next: SearchFilterCriteria) => {
    setFilters(next);
    if (hasActiveFilters(next)) {
      setRankingHighlight(null);
    }
  }, []);

  const handleHighlightFromRanking = useCallback((label: string, iso3s: string[]) => {
    setFilters(EMPTY_FILTERS);
    setRankingHighlight({ label, iso3s });
    setSelectedIso3(null);
    setSearchOpen(false);
    setActiveView('map');
  }, []);

  const handleOpenCountryExamModal = useCallback((initialQuestionId?: string) => {
    setExamModalInitialId(initialQuestionId);
    setExamModalMode('country');
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-red-700">データの読み込みエラー</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (
    !countriesData ||
    !countriesGeoJson ||
    !layersGeoJson ||
    !plateBoundariesGeoJson ||
    !capitalsGeoJson ||
    !volcanoesGeoJson ||
    !climatePhenomenaGeoJson ||
    !thematicRegionsGeoJson ||
    !pastExamsData
  ) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">世界地図と全240カ国・地域の地理データを読み込み中...</p>
      </div>
    );
  }

  const totalCountriesCount = Object.keys(countriesData.countries).length;
  const examYearsList = pastExamsData.questions.map((q) => q.year);
  const minExamYear = examYearsList.length > 0 ? Math.min(...examYearsList) : 2024;
  const maxExamYear = examYearsList.length > 0 ? Math.max(...examYearsList) : 2026;
  const examModalQuestions =
    examModalMode === 'archive' ? pastExamsData.questions : relatedQuestions;
  const examModalTitle =
    examModalMode === 'archive'
      ? `共通テスト・センター過去問 全${pastExamsData.questions.length}問演習（${minExamYear}〜${maxExamYear}年）`
      : `${selectedCountry?.nameJa ?? fallbackNameEn ?? selectedIso3 ?? ''} に関連する過去問`;

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      {/* 1行ヘッダー：サイト名 ＋ 5ビュー切替（地図・白地図・統計・系統・日本） ＋ コンパクト検索ボタン */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white shadow-2xs">
        <div className="flex h-12 items-center justify-between gap-1 px-2 md:h-13 md:gap-3 md:px-5">
          {/* サイト名 */}
          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white md:h-8 md:w-8">
              <Compass className="h-3.5 w-3.5 md:h-5 md:w-5" />
            </div>
            <div>
              <h1 className="text-[12px] font-extrabold tracking-tight text-slate-900 md:text-base">
                <span className="hidden sm:inline">共テ</span>地理ナビ
              </h1>
              <p className="hidden text-[11px] text-slate-500 xl:block">
                {IS_PUBLIC_MODE
                  ? `地理総合・地理探究 対策マップ（全${totalCountriesCount}カ国・${countriesData.examCoverage.length}回出題分析）`
                  : `地理総合・地理探究 対策マップ（${totalCountriesCount}カ国・${pastExamsData.questions.length}問連動）`}
              </p>
            </div>
          </div>

          {/* 5ビュー切替セグメント（地図 / 白地図 / 統計 / 系統 / 日本） */}
          <nav
            aria-label="学習モード切替"
            className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5"
          >
            {HEADER_VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10.5px] font-extrabold transition sm:px-2 md:px-3 md:py-1.5 md:text-xs ${
                    active
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="hidden h-3.5 w-3.5 sm:block" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 右側ツール：サイコロ・検索ボタン等 */}
          <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
            <button
              type="button"
              onClick={handleRandomCountry}
              aria-label="ランダムな国へ飛ぶ"
              title="サイコロを振ってランダムな国へ飛ぶ"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95 md:px-2.5"
            >
              <Dices
                className={`h-3.5 w-3.5 transition-transform duration-500 ${
                  isDiceRolling ? 'rotate-[360deg] scale-110' : ''
                }`}
              />
              <span className="hidden md:inline">ランダム</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="検索"
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition md:px-2.5 ${
                searchOpen || searchActive
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">検索</span>
              {searchActive && (
                <span className="rounded-full bg-cyan-600 px-1.5 text-[10px] text-white">
                  {searchHits.length}
                </span>
              )}
            </button>

            {!IS_PUBLIC_MODE && (
              <button
                type="button"
                onClick={() => {
                  setExamModalInitialId(undefined);
                  setExamModalMode('archive');
                }}
                className="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 lg:inline-flex"
              >
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                過去問演習 ({pastExamsData.questions.length})
              </button>
            )}

            {markedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMapColorMode((prev) => (prev === 'marked' ? 'heatmap' : 'marked'));
                  setActiveView('map');
                }}
                className={`hidden items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition md:inline-flex ${
                  mapColorMode === 'marked'
                    ? 'border-amber-400 bg-amber-100 text-amber-900'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
                title="★マークを付けた国を地図上で強調表示切替"
              >
                ★ {markedCount}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインワークスペース */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <ReverseSearchDrawer
          isOpen={searchOpen}
          filters={filters}
          hits={searchHits}
          totalCountries={totalCountriesCount}
          examCoverage={countriesData.examCoverage}
          markedCount={markedCount}
          isMarkedMode={mapColorMode === 'marked'}
          places={placesData}
          countriesMap={countriesData.countries}
          rankingItems={worldRankingsData?.items}
          systematicTopics={systematicData?.topics}
          japanRegions={japanData?.regions}
          onToggleMarkedMode={() => {
            setMapColorMode((prev) => (prev === 'marked' ? 'heatmap' : 'marked'));
            setActiveView('map');
          }}
          onChangeFilters={handleChangeFilters}
          onSelectCountry={(iso) => {
            handleSelectCountry(iso);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setSearchOpen(false);
            }
          }}
          onSelectPlace={handleSelectPlaceFromSearch}
          onSelectRanking={(itemId) => {
            setFocusedRankingId(itemId);
            setActiveView('rankings');
            setSearchOpen(false);
          }}
          onSelectSystematic={(topicId) => {
            setFocusedSystematicId(topicId);
            setActiveView('systematic');
            setSearchOpen(false);
          }}
          onSelectJapanRegion={(regionId) => {
            setFocusedJapanRegionId(regionId);
            setActiveView('japan');
            setSearchOpen(false);
          }}
          onClose={() => setSearchOpen(false)}
        />

        {/* 1. 世界地図ビュー（タイル状態を保持するためアンマウントせず表示切替） */}
        <div
          className={
            activeView === 'map'
              ? 'relative flex h-full min-w-0 flex-1'
              : 'hidden'
          }
        >
          <div className="relative h-full min-w-0 flex-1">
            <WorldMap
              countriesGeoJson={countriesGeoJson}
              layersGeoJson={layersGeoJson}
              plateBoundariesGeoJson={plateBoundariesGeoJson}
              citiesGeoJson={citiesGeoJson}
              capitalsGeoJson={capitalsGeoJson}
              volcanoesGeoJson={volcanoesGeoJson}
              climatePhenomenaGeoJson={climatePhenomenaGeoJson}
              thematicRegionsGeoJson={thematicRegionsGeoJson}
              thematicGrid={thematicGrid}
              countriesData={countriesData.countries}
              selectedIso3={selectedIso3}
              mapColorMode={mapColorMode}
              onChangeMapColorMode={setMapColorMode}
              highlightedIso3s={highlightedIso3s}
              highlightBannerLabel={highlightBannerLabel}
              markedIso3s={markedIso3s}
              layerVisibility={layerVisibility}
              onToggleLayer={handleToggleLayer}
              climateOverlay={climateOverlay}
              onChangeClimateOverlay={setClimateOverlay}
              focusedPlace={focusedPlace}
              flyToCountryRequest={flyToCountryRequest}
              mobileBottomOffsetVh={selectedIso3 ? mobileSheetVh : 0}
              onClearFocusedPlace={handleClearFocusedPlace}
              onClearSearchHighlight={() => {
                setFilters(EMPTY_FILTERS);
                setRankingHighlight(null);
              }}
              onSelectCountry={handleSelectCountry}
            />
          </div>

          {selectedIso3 && (
            <CountryDetailPanel
              key={selectedIso3}
              iso3={selectedIso3}
              fallbackNameEn={fallbackNameEn}
              country={selectedCountry}
              allCountries={countriesData.countries}
              relatedQuestions={relatedQuestions}
              isMarked={isMarked(selectedIso3)}
              placeMatcher={placeMatcher}
              mobileSheetVh={mobileSheetVh}
              onChangeMobileSheetVh={setMobileSheetVh}
              onFocusPlace={handleFocusPlace}
              onToggleMark={toggleMark}
              onSelectCountry={(targetIso) => handleSelectCountry(targetIso)}
              onClose={() => {
                setSelectedIso3(null);
                setFocusedPlace(null);
              }}
              onOpenExamModal={IS_PUBLIC_MODE ? undefined : handleOpenCountryExamModal}
            />
          )}
        </div>

        {/* 2. 白地図クイズ＆ケッペン塗り絵ビュー */}
        {activeView === 'blank' && (
          <div className="h-full min-w-0 flex-1">
            <BlankMapView
              countriesData={countriesData}
              countriesGeoJson={countriesGeoJson}
              layersGeoJson={layersGeoJson}
              capitalsGeoJson={capitalsGeoJson}
              volcanoesGeoJson={volcanoesGeoJson}
              thematicGrid={thematicGrid}
              onOpenCountryInMap={(targetIso) => {
                handleSelectCountry(targetIso);
                setFlyToCountryRequest((prev) => ({
                  iso3: targetIso,
                  nonce: Math.max(Date.now(), (prev?.nonce ?? 0) + 1),
                }));
              }}
            />
          </div>
        )}

        {/* 3. 世界統計ランキング＆データブックビュー */}
        {activeView === 'rankings' && (
          <div className="h-full min-w-0 flex-1">
            <WorldRankingsView
              key={focusedRankingId ?? 'all'}
              dataset={worldRankingsData}
              countriesGeoJson={countriesGeoJson}
              japanDomesticStats={japanData?.domesticStats ?? null}
              focusedItemId={focusedRankingId}
              onSelectCountry={handleSelectCountry}
              onHighlightCountries={handleHighlightFromRanking}
            />
          </div>
        )}

        {/* 3. 系統地理・地図/GIS・防災マスター図鑑ビュー */}
        {activeView === 'systematic' && (
          <div className="h-full min-w-0 flex-1">
            <SystematicGuideView
              key={focusedSystematicId ?? 'sys-default'}
              dataset={systematicData}
              countriesData={countriesData.countries}
              placeMatcher={placeMatcher}
              focusedTopicId={focusedSystematicId}
              onFocusPlace={handleFocusPlace}
              onSelectCountry={handleSelectCountry}
            />
          </div>
        )}

        {/* 4. 日本地理・地域調査＆地形図マスタービュー */}
        {activeView === 'japan' && (
          <div className="h-full min-w-0 flex-1">
            <JapanAndMapView
              key={focusedJapanRegionId ?? 'jp-default'}
              dataset={japanData}
              placeMatcher={placeMatcher}
              focusedRegionId={focusedJapanRegionId}
              onFocusPlace={handleFocusPlace}
              onOpenJapanCountry={() => handleSelectCountry('JPN')}
            />
          </div>
        )}
      </main>

      {/* 過去問閲覧・4択演習モーダル（ローカルモードのみ） */}
      {!IS_PUBLIC_MODE && examModalMode !== 'closed' && (
        <PastExamModal
          isOpen={true}
          titleLabel={examModalTitle}
          questions={examModalQuestions}
          initialQuestionId={examModalInitialId}
          onClose={() => setExamModalMode('closed')}
        />
      )}
    </div>
  );
}

export default App;
