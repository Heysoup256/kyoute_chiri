import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  BookOpen,
  Compass,
  Filter,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { CountryDetailPanel } from './components/detail/CountryDetailPanel';
import { PastExamModal } from './components/exam/PastExamModal';
import { WorldMap, type ThematicGridData } from './components/map/WorldMap';
import { ReverseSearchDrawer } from './components/study/ReverseSearchDrawer';
import { useMarkedCountries } from './hooks/useMarkedCountries';
import type {
  ClimateOverlayState,
  CountriesDataset,
  GeoCountryProperties,
  GeoLayerProperties,
  GeoLayerType,
  LayerVisibilityState,
  MapColorMode,
  PastExamsDataset,
  PlaceEntry,
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

export function App() {
  const [countriesData, setCountriesData] = useState<CountriesDataset | null>(null);
  const [pastExamsData, setPastExamsData] = useState<PastExamsDataset | null>(null);
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

  // 検索・フィルターパネル＆過去問モーダル状態
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilterCriteria>(EMPTY_FILTERS);
  const [examModalMode, setExamModalMode] = useState<'closed' | 'country' | 'archive'>('closed');
  const [examModalInitialId, setExamModalInitialId] = useState<string | undefined>(undefined);

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
  }, []);

  const handleFocusPlace = useCallback((place: PlaceEntry) => {
    setFocusedPlace(place);
  }, []);

  const handleClearFocusedPlace = useCallback(() => {
    setFocusedPlace(null);
  }, []);

  const placeMatcher = useMemo(() => buildPlaceMatcher(placesData), [placesData]);

  const selectedCountry = selectedIso3 ? countriesData?.countries[selectedIso3] : undefined;

  const relatedQuestions = useMemo(() => {
    if (!selectedIso3 || !pastExamsData) return [];
    return pastExamsData.questions.filter((q) => q.relatedCountries.includes(selectedIso3));
  }, [selectedIso3, pastExamsData]);

  // 87気候都市ポイント GeoJSON（ケッペン気候区分モードで重ねて表示）
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

  const highlightedIso3s = useMemo(() => {
    if (!hasActiveFilters(filters)) return null;
    return searchHits.map((h) => h.country.iso3);
  }, [filters, searchHits]);

  const activeFilterCount =
    Number(Boolean(filters.koppenCode)) +
    Number(Boolean(filters.rank)) +
    Number(Boolean(filters.integration)) +
    Number(Boolean(filters.examYear));

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
      {/* トップヘッダー（スマホ: サイト名とすぐ入力できる検索バーのみ / PC: サイト名＋検索バー＋検索ボタン等） */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white shadow-2xs">
        <div className="flex h-13 items-center justify-between gap-2.5 px-3 md:px-5">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white md:h-8 md:w-8">
              <Compass className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 md:text-base">
                共テ地理ナビ
              </h1>
              <p className="hidden text-[11px] text-slate-500 xl:block">
                {IS_PUBLIC_MODE
                  ? `地理総合・地理探究 対策マップ（全${totalCountriesCount}カ国・${countriesData.examCoverage.length}回出題分析）`
                  : `地理総合・地理探究 対策マップ（${totalCountriesCount}カ国・${pastExamsData.questions.length}問連動）`}
              </p>
            </div>
          </div>

          {/* すぐ入力できる検索バー（タップで入力開始と同時にフィルター＆候補パネルを展開） */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="relative min-w-0 flex-1 md:max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="国名・地名・特産品・気候を検索"
                value={filters.query}
                onFocus={() => setSearchOpen(true)}
                onClick={() => setSearchOpen(true)}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, query: e.target.value }));
                  setSearchOpen(true);
                }}
                placeholder="国名・地名・気候・特産品を検索..."
                className={`w-full rounded-full border py-1.5 pl-8 pr-14 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                  searchOpen || highlightedIso3s
                    ? 'border-cyan-500 bg-cyan-50/40'
                    : 'border-slate-300 bg-slate-50'
                }`}
              />
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
                {filters.query && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    aria-label="検索語句をクリア"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* PC表示用ボタン群（「検索」ボタン等） */}
            <div className="hidden items-center gap-1.5 md:flex">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                  searchOpen || highlightedIso3s
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                検索
                {highlightedIso3s && (
                  <span className="rounded-full bg-cyan-600 px-1.5 py-0.2 text-[10px] text-white">
                    {highlightedIso3s.length}
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  過去問演習 ({pastExamsData.questions.length})
                </button>
              )}

              {markedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setMapColorMode((prev) => (prev === 'marked' ? 'heatmap' : 'marked'))
                  }
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                    mapColorMode === 'marked'
                      ? 'border-amber-400 bg-amber-100 text-amber-900'
                      : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                  title="★マークを付けた国を地図上で強調表示切替"
                >
                  ★ マーク ({markedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインワークスペース：左(検索・フィルターパネル) ＋ 中央(地図) ＋ 右/下(国別詳細パネル) */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <ReverseSearchDrawer
          isOpen={searchOpen}
          filters={filters}
          hits={searchHits}
          totalCountries={totalCountriesCount}
          examCoverage={countriesData.examCoverage}
          markedCount={markedCount}
          isMarkedMode={mapColorMode === 'marked'}
          onToggleMarkedMode={() =>
            setMapColorMode((prev) => (prev === 'marked' ? 'heatmap' : 'marked'))
          }
          onChangeFilters={setFilters}
          onSelectCountry={(iso) => {
            handleSelectCountry(iso);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setSearchOpen(false);
            }
          }}
          onClose={() => setSearchOpen(false)}
        />

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
            markedIso3s={markedIso3s}
            layerVisibility={layerVisibility}
            onToggleLayer={handleToggleLayer}
            climateOverlay={climateOverlay}
            onChangeClimateOverlay={setClimateOverlay}
            focusedPlace={focusedPlace}
            mobileBottomOffsetVh={selectedIso3 ? mobileSheetVh : 0}
            onClearFocusedPlace={handleClearFocusedPlace}
            onClearSearchHighlight={() => setFilters(EMPTY_FILTERS)}
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
