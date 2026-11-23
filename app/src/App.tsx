import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  ArrowLeftRight,
  BookOpen,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { CityCompareModal } from './components/charts/CityCompareModal';
import { CountryDetailPanel } from './components/detail/CountryDetailPanel';
import { PastExamModal } from './components/exam/PastExamModal';
import { WorldMap, type ThematicGridData } from './components/map/WorldMap';
import { ReverseSearchDrawer } from './components/study/ReverseSearchDrawer';
import { buildPlaceMatcher } from './utils/places';
import { useMarkedCountries } from './hooks/useMarkedCountries';
import type {
  ClimateOverlayState,
  CountriesDataset,
  CountryData,
  GeoCountryProperties,
  GeoLayerProperties,
  GeoLayerType,
  LayerVisibilityState,
  MapColorMode,
  PastExamsDataset,
  PlaceEntry,
} from './types/schema_v1';
import { DEFAULT_LAYER_VISIBILITY, normalizeKoppen13 } from './utils/constants';
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
  const [panelMinimized, setPanelMinimized] = useState<boolean>(false);
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
  const [blindMode, setBlindMode] = useState<boolean>(false);

  // 学習ツール（検索・比較・過去問演習）のモーダル/ドロワー状態
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilterCriteria>(EMPTY_FILTERS);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [compareInitialCityId, setCompareInitialCityId] = useState<string | undefined>(undefined);
  const [examModalMode, setExamModalMode] = useState<'closed' | 'country' | 'archive'>('closed');
  const [examModalInitialId, setExamModalInitialId] = useState<string | undefined>(undefined);

  const { markedIso3s, markedCount, isMarked, toggleMark } = useMarkedCountries();

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const base = import.meta.env.BASE_URL;
        const [
          cRes,
          geoRes,
          layersRes,
          platesRes,
          examsRes,
          capsRes,
          volsRes,
          phenomRes,
          tRegRes,
          tGridRes,
          placesRes,
        ] = await Promise.all([
          fetch(`${base}data/countries_v1.json`),
          fetch(`${base}data/geo_countries_v1.geojson`),
          fetch(`${base}data/geo_layers_v1.geojson`),
          fetch(`${base}data/plate_boundaries_v1.geojson`),
          fetch(`${base}data/past_exams_v1.json`),
          fetch(`${base}data/capitals_v1.geojson`),
          fetch(`${base}data/volcanoes_v1.geojson`),
          fetch(`${base}data/climate_phenomena_v1.geojson`),
          fetch(`${base}data/thematic_regions_v1.geojson`),
          fetch(`${base}data/thematic_grid_v1.json`),
          fetch(`${base}data/places_v1.json`),
        ]);

        if (
          !cRes.ok ||
          !geoRes.ok ||
          !layersRes.ok ||
          !platesRes.ok ||
          !examsRes.ok ||
          !capsRes.ok ||
          !volsRes.ok ||
          !phenomRes.ok ||
          !tRegRes.ok ||
          !tGridRes.ok ||
          !placesRes.ok
        ) {
          throw new Error('静的データファイルの読み込みに失敗しました。');
        }

        const [
          cJson,
          geoJson,
          layersJson,
          platesJson,
          examsJson,
          capsJson,
          volsJson,
          phenomJson,
          tRegJson,
          tGridJson,
          placesJson,
        ] = await Promise.all([
          cRes.json(),
          geoRes.json(),
          layersRes.json(),
          platesRes.json(),
          examsRes.json(),
          capsRes.json(),
          volsRes.json(),
          phenomRes.json(),
          tRegRes.json(),
          tGridRes.json(),
          placesRes.json(),
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
    setPanelMinimized(false);
    setFocusedPlace(null);
  }, []);

  const handleFocusPlace = useCallback((place: PlaceEntry) => {
    setFocusedPlace(place);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setPanelMinimized(true);
    }
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

  // 地域別に整理された国リスト（クイック選択用）
  const groupedCountries = useMemo(() => {
    if (!countriesData) return [];
    const groups = new Map<string, CountryData[]>();
    for (const c of Object.values(countriesData.countries)) {
      const reg = c.region;
      if (!groups.has(reg)) groups.set(reg, []);
      groups.get(reg)!.push(c);
    }
    return Array.from(groups.entries()).map(([region, list]) => ({
      region,
      list: list.sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja')),
    }));
  }, [countriesData]);

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

  // 逆引き検索の実行
  const searchHits = useMemo(() => {
    if (!countriesData) return [];
    return searchCountries(countriesData.countries, filters);
  }, [countriesData, filters]);

  const highlightedIso3s = useMemo(() => {
    if (!hasActiveFilters(filters)) return null;
    return searchHits.map((h) => h.country.iso3);
  }, [filters, searchHits]);

  const handleOpenCountryExamModal = useCallback((initialQuestionId?: string) => {
    setExamModalInitialId(initialQuestionId);
    setExamModalMode('country');
  }, []);

  const handleOpenCompareWithCity = useCallback((cityId: string) => {
    setCompareInitialCityId(cityId);
    setCompareModalOpen(true);
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
      {/* トップヘッダー（PC: 全機能1行 / スマホ: 上段ブランド＋クイック選択、下段ツールバー） */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white shadow-2xs">
        <div className="flex h-14 items-center justify-between gap-2 px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Compass className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold text-slate-900 md:text-base">
                共テ地理ナビ
              </h1>
              <p className="hidden text-[11px] text-slate-500 xl:block">
                地理総合・地理探究 対策マップ（{totalCountriesCount}カ国・{pastExamsData.questions.length}問連動）
              </p>
            </div>
          </div>

          {/* ツールボタン群（PC表示） */}
          <div className="hidden items-center gap-1.5 lg:flex">
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
              逆引き検索
              {highlightedIso3s && (
                <span className="rounded-full bg-cyan-600 px-1.5 py-0.2 text-[10px] text-white">
                  {highlightedIso3s.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCompareInitialCityId(undefined);
                setCompareModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-sky-600" />
              2都市グラフ比較
            </button>

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

            <button
              type="button"
              onClick={() => setBlindMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                blindMode
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {blindMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              暗記モード {blindMode ? 'ON' : 'OFF'}
            </button>

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

          {/* 収録国ジャンプ（全デバイス共通） */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="収録国を直接選択"
              value={selectedIso3 && countriesData.countries[selectedIso3] ? selectedIso3 : ''}
              onChange={(e) => {
                if (e.target.value) handleSelectCountry(e.target.value);
              }}
              className="max-w-[155px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none md:max-w-[200px]"
            >
              <option value="">全{totalCountriesCount}カ国から選択...</option>
              {groupedCountries.map((grp) => (
                <optgroup key={grp.region} label={grp.region}>
                  {grp.list.map((c) => (
                    <option key={c.iso3} value={c.iso3}>
                      {isMarked(c.iso3) ? '★ ' : ''}
                      {c.isBasicEntry ? `[基礎] ` : `[${c.examSummary.rank}] `}
                      {c.nameJa}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setBlindMode((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold lg:hidden ${
                blindMode
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
              aria-label="暗記モード切替"
            >
              {blindMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">暗記</span>
            </button>
          </div>
        </div>

        {/* モバイル・タブレット用サブツールバー */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50 px-3 py-1.5 lg:hidden">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              searchOpen || highlightedIso3s
                ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Filter className="h-3 w-3" />
            検索{highlightedIso3s ? `(${highlightedIso3s.length})` : ''}
          </button>

          <button
            type="button"
            onClick={() => {
              setCompareInitialCityId(undefined);
              setCompareModalOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700"
          >
            <ArrowLeftRight className="h-3 w-3 text-sky-600" />
            都市比較
          </button>

          <button
            type="button"
            onClick={() => {
              setExamModalInitialId(undefined);
              setExamModalMode('archive');
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700"
          >
            <BookOpen className="h-3 w-3 text-indigo-600" />
            過去問{pastExamsData.questions.length}問
          </button>

          {markedCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setMapColorMode((prev) => (prev === 'marked' ? 'heatmap' : 'marked'))
              }
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                mapColorMode === 'marked'
                  ? 'border-amber-400 bg-amber-100 text-amber-900'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              ★ {markedCount}
            </button>
          )}
        </div>
      </header>

      {/* メインワークスペース：左(検索ドロワー) ＋ 中央(地図) ＋ 右(国別詳細パネル) */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <ReverseSearchDrawer
          isOpen={searchOpen}
          filters={filters}
          hits={searchHits}
          totalCountries={totalCountriesCount}
          examCoverage={countriesData.examCoverage}
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
            blindMode={blindMode}
            layerVisibility={layerVisibility}
            onToggleLayer={handleToggleLayer}
            climateOverlay={climateOverlay}
            onChangeClimateOverlay={setClimateOverlay}
            focusedPlace={focusedPlace}
            onClearFocusedPlace={handleClearFocusedPlace}
            onClearSearchHighlight={() => setFilters(EMPTY_FILTERS)}
            onSelectCountry={handleSelectCountry}
          />

          {selectedIso3 && panelMinimized && (
            <div className="fixed inset-x-0 bottom-5 z-25 flex justify-center px-3 md:hidden">
              <button
                type="button"
                onClick={() => setPanelMinimized(false)}
                className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg ring-2 ring-white hover:bg-indigo-700"
              >
                {selectedCountry?.nameJa ?? fallbackNameEn ?? selectedIso3} の詳細に戻る
              </button>
            </div>
          )}

          {!selectedIso3 && !searchOpen && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center px-3 sm:bottom-5">
              <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-1.5 text-center text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur-xs md:text-xs">
                地図上の国・地形・首都・火山をタップして詳細・雨温図・過去問切り抜きを表示
              </div>
            </div>
          )}
        </div>

        {selectedIso3 && (
          <div className={panelMinimized ? 'hidden md:contents' : 'contents'}>
            <CountryDetailPanel
              key={selectedIso3}
              iso3={selectedIso3}
              fallbackNameEn={fallbackNameEn}
              country={selectedCountry}
              allCountries={countriesData.countries}
              relatedQuestions={relatedQuestions}
              blindMode={blindMode}
              isMarked={isMarked(selectedIso3)}
              placeMatcher={placeMatcher}
              onFocusPlace={handleFocusPlace}
              onToggleMark={toggleMark}
              onCompareCity={handleOpenCompareWithCity}
              onSelectCountry={(targetIso) => handleSelectCountry(targetIso)}
              onClose={() => {
                setSelectedIso3(null);
                setPanelMinimized(false);
                setFocusedPlace(null);
              }}
              onOpenExamModal={handleOpenCountryExamModal}
            />
          </div>
        )}
      </main>

      {/* 過去問閲覧・4択演習モーダル */}
      {examModalMode !== 'closed' && (
        <PastExamModal
          isOpen={true}
          titleLabel={examModalTitle}
          questions={examModalQuestions}
          initialQuestionId={examModalInitialId}
          onClose={() => setExamModalMode('closed')}
        />
      )}

      {/* 2都市気候グラフ比較モーダル */}
      {compareModalOpen && (
        <CityCompareModal
          key={compareInitialCityId ?? 'default'}
          isOpen={true}
          countries={countriesData.countries}
          initialCityA={compareInitialCityId}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
