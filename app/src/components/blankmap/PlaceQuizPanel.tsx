import type { FeatureCollection, Geometry } from 'geojson';
import {
  ArrowRight,
  Compass,
  Crosshair,
  Eye,
  Flame,
  HelpCircle,
  MapPin,
  MousePointerClick,
  Play,
  RotateCcw,
  Timer,
  Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CountryData,
  GeoCountryProperties,
  GeoLayerProperties,
} from '../../types/schema_v1';
import type { QuizStatsState } from '../../hooks/useQuizStats';
import {
  BlankMapQuizCanvas,
  type BlankFeatureCategory,
  type BoundsFitData,
  type FlyTargetData,
  type PinOverlayData,
} from './BlankMapQuizCanvas';
import {
  computePinScore,
  distanceToGeometryKm,
  getGeometryCenter,
} from './blankMapUtils';

export interface FeatureQuizItem {
  id: string;
  nameJa: string;
  category: BlankFeatureCategory;
  categoryLabel: string;
  subLabel?: string;
  summary: string;
  geometry: Geometry;
  relatedCountries: string[];
  isLinear: boolean;
}

type CountryRankFilter = 'S' | 'SA' | 'detailed' | 'all' | 'weak';
type RegionFilter =
  | 'all'
  | 'asia'
  | 'europe'
  | 'africa'
  | 'north_america'
  | 'south_america'
  | 'oceania';
type QuestionLimitOption = 10 | 20 | 999 | 'timed60';
type FeatureInputMode = 'select' | 'pin';

interface PlaceQuizPanelProps {
  quizKind: 'country' | 'feature';
  countriesData: Record<string, CountryData>;
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  layersGeoJson: FeatureCollection<Geometry, GeoLayerProperties>;
  capitalsGeoJson: FeatureCollection<Geometry>;
  volcanoesGeoJson: FeatureCollection<Geometry>;
  quizStats: QuizStatsState;
  weakCountryIso3s: string[];
  weakFeatureIds: string[];
  onRecordCountry: (iso3: string, ok: boolean) => void;
  onRecordFeature: (featureId: string, ok: boolean) => void;
  onOpenCountryInMap: (iso3: string) => void;
}

const REGION_BOUNDS: Record<RegionFilter, [number, number, number, number]> = {
  all: [-165, -52, 175, 74],
  asia: [34, -10, 150, 72],
  europe: [-14, 34, 44, 71],
  africa: [-20, -36, 54, 38],
  north_america: [-168, 7, -52, 73],
  south_america: [-84, -56, -34, 14],
  oceania: [110, -48, 180, 0],
};

const REGION_OPTIONS: { id: RegionFilter; label: string }[] = [
  { id: 'all', label: '全世界' },
  { id: 'asia', label: 'アジア' },
  { id: 'europe', label: 'ヨーロッパ' },
  { id: 'africa', label: 'アフリカ' },
  { id: 'north_america', label: '北・中米' },
  { id: 'south_america', label: '南アメリカ' },
  { id: 'oceania', label: 'オセアニア' },
];

const FEATURE_CAT_OPTIONS: { id: BlankFeatureCategory | 'weak'; label: string }[] = [
  { id: 'mixed', label: '重要ミックス（山川海峡地形）' },
  { id: 'mountain_range', label: '大山脈（15）' },
  { id: 'river', label: '大河川（14）' },
  { id: 'strait_canal', label: '重要海峡・運河（7）' },
  { id: 'landform_point', label: '特徴的地形（35）' },
  { id: 'ocean_current', label: '海流（24）' },
  { id: 'volcanoes', label: '主な火山（26）' },
  { id: 'capitals_60', label: '主要首都（102）' },
  { id: 'capitals_all', label: '全首都（198）' },
  { id: 'weak', label: '苦手のみ復習' },
];

function matchesRegion(country: CountryData, rf: RegionFilter): boolean {
  if (rf === 'all') return true;
  const reg = country.region || '';
  if (rf === 'asia') return reg.includes('アジア');
  if (rf === 'europe') return reg.includes('ヨーロッパ');
  if (rf === 'africa') return reg.includes('アフリカ');
  if (rf === 'north_america') return reg.includes('北アメリカ');
  if (rf === 'south_america') return reg.includes('南アメリカ');
  if (rf === 'oceania') return reg.includes('オセアニア') || reg.includes('海洋');
  return true;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function findCountryFlySpot(
  iso3: string,
  countriesData: Record<string, CountryData>,
  capitalsGeoJson: FeatureCollection<Geometry>,
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>,
): { lng: number; lat: number; zoom: number } {
  const c = countriesData[iso3];
  const area = c?.stats?.areaKm2 ?? 0;
  const zoom = area >= 5_000_000 ? 2.8 : area >= 1_500_000 ? 3.5 : area >= 400_000 ? 4.2 : 5.0;

  if (c?.topCities?.[0]) return { lng: c.topCities[0].lng, lat: c.topCities[0].lat, zoom };
  if (c?.climate.cities?.[0]) return { lng: c.climate.cities[0].lng, lat: c.climate.cities[0].lat, zoom };

  const cap = capitalsGeoJson.features.find(
    (f) => (f.properties as { iso3?: string } | null)?.iso3 === iso3 && f.geometry.type === 'Point',
  );
  if (cap && cap.geometry.type === 'Point') {
    return { lng: cap.geometry.coordinates[0], lat: cap.geometry.coordinates[1], zoom };
  }

  const cf = countriesGeoJson.features.find((f) => f.properties?.iso3 === iso3);
  if (cf) {
    const [lng, lat] = getGeometryCenter(cf.geometry);
    return { lng, lat, zoom };
  }
  return { lng: 20, lat: 20, zoom: 2 };
}

interface CountryAnswerFeedback {
  status: 'correct' | 'wrong_retry' | 'revealed';
  clickedName?: string;
  targetCountry: CountryData;
}

interface FeatureAnswerFeedback {
  status: 'correct' | 'wrong_retry' | 'revealed' | 'pin_scored';
  clickedName?: string;
  distKm?: number;
  pinScore?: number;
  pinGrade?: string;
  targetFeature: FeatureQuizItem;
}

export function PlaceQuizPanel({
  quizKind,
  countriesData,
  countriesGeoJson,
  layersGeoJson,
  capitalsGeoJson,
  volcanoesGeoJson,
  quizStats,
  weakCountryIso3s,
  weakFeatureIds,
  onRecordCountry,
  onRecordFeature,
  onOpenCountryInMap,
}: PlaceQuizPanelProps) {
  // 国当て設定
  const [rankFilter, setRankFilter] = useState<CountryRankFilter>('SA');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [questionLimit, setQuestionLimit] = useState<QuestionLimitOption>(10);
  const [showWeakHeatmap, setShowWeakHeatmap] = useState<boolean>(false);

  // 地形当て設定
  const [featureCategoryChoice, setFeatureCategoryChoice] = useState<BlankFeatureCategory | 'weak'>('mixed');
  const [featureInputMode, setFeatureInputMode] = useState<FeatureInputMode>('select');
  const [featureLimit, setFeatureLimit] = useState<number>(10);

  // 共通UI状態
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [hintStep, setHintStep] = useState<number>(0);

  // 出題キュー（国当て）
  const [countryQueue, setCountryQueue] = useState<string[]>([]);
  const [countryIndex, setCountryIndex] = useState<number>(0);
  const [countrySolvedMap, setCountrySolvedMap] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [countryRetryIso, setCountryRetryIso] = useState<string | null>(null);
  const [countryAttemptsOnCurrent, setCountryAttemptsOnCurrent] = useState<number>(0);
  const [countryFeedback, setCountryFeedback] = useState<CountryAnswerFeedback | null>(null);
  const [missedCountries, setMissedCountries] = useState<string[]>([]);

  // タイムアタック
  const [timeLeftSec, setTimeLeftSec] = useState<number>(60);

  // 出題キュー（地形当て）
  const [featureQueue, setFeatureQueue] = useState<FeatureQuizItem[]>([]);
  const [featureIndex, setFeatureIndex] = useState<number>(0);
  const [featureSolvedMap, setFeatureSolvedMap] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [featureRetryId, setFeatureRetryId] = useState<string | null>(null);
  const [featureAttempts, setFeatureAttempts] = useState<number>(0);
  const [featureFeedback, setFeatureFeedback] = useState<FeatureAnswerFeedback | null>(null);
  const [missedFeatures, setMissedFeatures] = useState<FeatureQuizItem[]>([]);
  const [pinOverlay, setPinOverlay] = useState<PinOverlayData | null>(null);
  const [pinScoreSum, setPinScoreSum] = useState<number>(0);

  // 共通スコア＆カメラ
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [flyTarget, setFlyTarget] = useState<FlyTargetData | null>(null);
  const [fitBoundsTarget, setFitBoundsTarget] = useState<BoundsFitData | null>(null);

  const autoNextTimerRef = useRef<number | null>(null);
  const clearAutoTimer = useCallback(() => {
    if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAutoTimer(), [clearAutoTimer]);

  // 地形アイテム一覧構築
  const allFeatureItems = useMemo<FeatureQuizItem[]>(() => {
    const out: FeatureQuizItem[] = [];
    for (const f of layersGeoJson.features) {
      const p = f.properties;
      const ltype = p.layerType;
      const catLabel =
        ltype === 'mountain_range'
          ? '大山脈'
          : ltype === 'river'
            ? '大河川'
            : ltype === 'strait_canal'
              ? '海峡・運河'
              : ltype === 'ocean_current'
                ? '海流'
                : '特徴的地形';
      out.push({
        id: p.id,
        nameJa: p.nameJa,
        category: ltype as BlankFeatureCategory,
        categoryLabel: catLabel,
        subLabel: p.subTypeJa,
        summary: p.summary,
        geometry: f.geometry,
        relatedCountries: p.relatedCountries ?? [],
        isLinear: f.geometry.type !== 'Point',
      });
    }
    for (const f of volcanoesGeoJson.features) {
      const p = (f.properties ?? {}) as {
        id?: string;
        nameJa?: string;
        volcanoTypeJa?: string;
        description?: string;
        iso3?: string;
      };
      if (!p.id || !p.nameJa) continue;
      out.push({
        id: p.id,
        nameJa: p.nameJa,
        category: 'volcanoes',
        categoryLabel: '火山',
        subLabel: p.volcanoTypeJa,
        summary: p.description ?? '',
        geometry: f.geometry,
        relatedCountries: p.iso3 ? [p.iso3] : [],
        isLinear: false,
      });
    }
    for (const f of capitalsGeoJson.features) {
      const p = (f.properties ?? {}) as {
        id?: string;
        nameJa?: string;
        countryNameJa?: string;
        iso3?: string;
        note?: string;
        isPrimary60?: boolean;
      };
      if (!p.id || !p.nameJa) continue;
      out.push({
        id: p.id,
        nameJa: p.countryNameJa ? `${p.nameJa}（${p.countryNameJa}）` : p.nameJa,
        category: p.isPrimary60 ? 'capitals_60' : 'capitals_all',
        categoryLabel: '首都',
        subLabel: p.countryNameJa,
        summary: p.note ?? `${p.countryNameJa ?? ''}の首都`,
        geometry: f.geometry,
        relatedCountries: p.iso3 ? [p.iso3] : [],
        isLinear: false,
      });
    }
    return out;
  }, [layersGeoJson, volcanoesGeoJson, capitalsGeoJson]);

  const geoIsoSet = useMemo(
    () => new Set(countriesGeoJson.features.map((f) => f.properties?.iso3).filter(Boolean) as string[]),
    [countriesGeoJson],
  );

  // 国当て候補プール
  const countryPool = useMemo(() => {
    const weakSet = new Set(weakCountryIso3s);
    return Object.values(countriesData)
      .filter((c) => c.iso3 !== 'ATA' && geoIsoSet.has(c.iso3) && Boolean(c.nameJa))
      .filter((c) => matchesRegion(c, regionFilter))
      .filter((c) => {
        if (rankFilter === 'S') return !c.isBasicEntry && c.examSummary.rank === 'S';
        if (rankFilter === 'SA') {
          return !c.isBasicEntry && (c.examSummary.rank === 'S' || c.examSummary.rank === 'A');
        }
        if (rankFilter === 'detailed') return !c.isBasicEntry;
        if (rankFilter === 'weak') return weakSet.has(c.iso3);
        return true;
      })
      .map((c) => c.iso3);
  }, [countriesData, geoIsoSet, regionFilter, rankFilter, weakCountryIso3s]);

  // 地形当て候補プール
  const featurePool = useMemo(() => {
    const weakSet = new Set(weakFeatureIds);
    return allFeatureItems.filter((item) => {
      if (featureCategoryChoice === 'weak') return weakSet.has(item.id);
      if (featureCategoryChoice === 'mixed') {
        return ['mountain_range', 'river', 'strait_canal', 'landform_point'].includes(item.category);
      }
      if (featureCategoryChoice === 'capitals_60') return item.category === 'capitals_60';
      if (featureCategoryChoice === 'capitals_all') {
        return item.category === 'capitals_60' || item.category === 'capitals_all';
      }
      return item.category === featureCategoryChoice;
    });
  }, [allFeatureItems, featureCategoryChoice, weakFeatureIds]);

  // タイムアタック用カウントダウン
  useEffect(() => {
    if (quizKind !== 'country' || questionLimit !== 'timed60' || phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quizKind, questionLimit, phase]);

  // クイズ種別（国 vs 地形）切替時は親の key={subMode} により再マウントされる
  const startCountryQuiz = useCallback(
    (overridePool?: string[]) => {
      clearAutoTimer();
      const basePool = overridePool && overridePool.length > 0 ? overridePool : countryPool;
      if (basePool.length === 0) return;
      const shuffled = shuffleArray(basePool);
      const limit = questionLimit === 'timed60' ? shuffled.length : Math.min(questionLimit, shuffled.length);
      setCountryQueue(shuffled.slice(0, limit));
      setCountryIndex(0);
      setCountrySolvedMap({});
      setCountryRetryIso(null);
      setCountryAttemptsOnCurrent(0);
      setCountryFeedback(null);
      setMissedCountries([]);
      setCorrectCount(0);
      setAnsweredCount(0);
      setStreak(0);
      setHintStep(0);
      setTimeLeftSec(60);
      setPhase('playing');
      setFitBoundsTarget({
        bounds: REGION_BOUNDS[regionFilter],
        nonce: Date.now(),
      });
    },
    [clearAutoTimer, countryPool, questionLimit, regionFilter],
  );

  const startFeatureQuiz = useCallback(
    (overridePool?: FeatureQuizItem[]) => {
      clearAutoTimer();
      const basePool = overridePool && overridePool.length > 0 ? overridePool : featurePool;
      if (basePool.length === 0) return;
      const shuffled = shuffleArray(basePool);
      const limit = Math.min(featureLimit, shuffled.length);
      setFeatureQueue(shuffled.slice(0, limit));
      setFeatureIndex(0);
      setFeatureSolvedMap({});
      setFeatureRetryId(null);
      setFeatureAttempts(0);
      setFeatureFeedback(null);
      setMissedFeatures([]);
      setPinOverlay(null);
      setPinScoreSum(0);
      setCorrectCount(0);
      setAnsweredCount(0);
      setStreak(0);
      setHintStep(0);
      setPhase('playing');
      setFitBoundsTarget({ bounds: REGION_BOUNDS.all, nonce: Date.now() });
    },
    [clearAutoTimer, featurePool, featureLimit],
  );

  const advanceCountryNext = useCallback(() => {
    clearAutoTimer();
    setCountryRetryIso(null);
    setCountryAttemptsOnCurrent(0);
    setCountryFeedback(null);
    setHintStep(0);
    if (countryIndex + 1 >= countryQueue.length) {
      if (questionLimit === 'timed60' && timeLeftSec > 0) {
        // タイムアタック中に1周したら再シャッフル継続
        setCountryQueue(shuffleArray(countryPool));
        setCountryIndex(0);
      } else {
        setPhase('finished');
      }
      return;
    }
    setCountryIndex((i) => i + 1);
  }, [clearAutoTimer, countryIndex, countryQueue.length, questionLimit, timeLeftSec, countryPool]);

  const advanceFeatureNext = useCallback(() => {
    clearAutoTimer();
    setFeatureRetryId(null);
    setFeatureAttempts(0);
    setFeatureFeedback(null);
    setPinOverlay(null);
    setHintStep(0);
    if (featureIndex + 1 >= featureQueue.length) {
      setPhase('finished');
      return;
    }
    setFeatureIndex((i) => i + 1);
  }, [clearAutoTimer, featureIndex, featureQueue.length]);

  const currentTargetIso = phase === 'playing' && quizKind === 'country' ? countryQueue[countryIndex] : undefined;
  const currentTargetCountry = currentTargetIso ? countriesData[currentTargetIso] : undefined;
  const currentTargetFeature =
    phase === 'playing' && quizKind === 'feature' ? featureQueue[featureIndex] : undefined;

  const handleCountryClick = useCallback(
    (clickedIso: string) => {
      if (phase !== 'playing' || quizKind !== 'country' || !currentTargetIso || !currentTargetCountry) return;
      if (countryFeedback && countryFeedback.status !== 'wrong_retry') return;

      if (clickedIso === currentTargetIso) {
        const cleanHit = countryAttemptsOnCurrent === 0;
        setCountrySolvedMap((prev) => ({ ...prev, [currentTargetIso]: 'correct' }));
        setCountryRetryIso(null);
        setAnsweredCount((n) => n + 1);
        setCorrectCount((n) => n + 1);
        setStreak((s) => s + 1);
        onRecordCountry(currentTargetIso, cleanHit);
        if (!cleanHit) {
          setMissedCountries((prev) => (prev.includes(currentTargetIso) ? prev : [...prev, currentTargetIso]));
        }
        setCountryFeedback({ status: 'correct', targetCountry: currentTargetCountry });
        const delay = questionLimit === 'timed60' ? 420 : 950;
        autoNextTimerRef.current = window.setTimeout(() => {
          advanceCountryNext();
        }, delay);
        return;
      }

      // 誤タップ
      const clickedName = countriesData[clickedIso]?.nameJa ?? clickedIso;
      setCountryRetryIso(clickedIso);
      setStreak(0);
      if (questionLimit !== 'timed60' && countryAttemptsOnCurrent === 0) {
        setCountryAttemptsOnCurrent(1);
        setCountryFeedback({
          status: 'wrong_retry',
          clickedName,
          targetCountry: currentTargetCountry,
        });
        return;
      }

      // 2回目失敗 or タイムアタック時は解答を開示
      setCountrySolvedMap((prev) => ({ ...prev, [currentTargetIso]: 'wrong' }));
      setAnsweredCount((n) => n + 1);
      setMissedCountries((prev) => (prev.includes(currentTargetIso) ? prev : [...prev, currentTargetIso]));
      onRecordCountry(currentTargetIso, false);
      setCountryFeedback({
        status: 'revealed',
        clickedName,
        targetCountry: currentTargetCountry,
      });
      const spot = findCountryFlySpot(currentTargetIso, countriesData, capitalsGeoJson, countriesGeoJson);
      setFlyTarget({ ...spot, nonce: Date.now() });
    },
    [
      phase,
      quizKind,
      currentTargetIso,
      currentTargetCountry,
      countryFeedback,
      countryAttemptsOnCurrent,
      questionLimit,
      countriesData,
      capitalsGeoJson,
      countriesGeoJson,
      onRecordCountry,
      advanceCountryNext,
    ],
  );

  const handleCountryGiveUp = useCallback(() => {
    if (!currentTargetIso || !currentTargetCountry) return;
    setCountrySolvedMap((prev) => ({ ...prev, [currentTargetIso]: 'wrong' }));
    setAnsweredCount((n) => n + 1);
    setStreak(0);
    setMissedCountries((prev) => (prev.includes(currentTargetIso) ? prev : [...prev, currentTargetIso]));
    onRecordCountry(currentTargetIso, false);
    setCountryFeedback({ status: 'revealed', targetCountry: currentTargetCountry });
    const spot = findCountryFlySpot(currentTargetIso, countriesData, capitalsGeoJson, countriesGeoJson);
    setFlyTarget({ ...spot, nonce: Date.now() });
  }, [currentTargetIso, currentTargetCountry, countriesData, capitalsGeoJson, countriesGeoJson, onRecordCountry]);

  const handleFeatureSelectClick = useCallback(
    (clickedId: string) => {
      if (phase !== 'playing' || quizKind !== 'feature' || featureInputMode !== 'select') return;
      if (!currentTargetFeature) return;
      if (featureFeedback && featureFeedback.status !== 'wrong_retry') return;

      if (clickedId === currentTargetFeature.id) {
        const cleanHit = featureAttempts === 0;
        setFeatureSolvedMap((prev) => ({ ...prev, [currentTargetFeature.id]: 'correct' }));
        setFeatureRetryId(null);
        setAnsweredCount((n) => n + 1);
        setCorrectCount((n) => n + 1);
        setStreak((s) => s + 1);
        onRecordFeature(currentTargetFeature.id, cleanHit);
        if (!cleanHit) {
          setMissedFeatures((prev) =>
            prev.some((x) => x.id === currentTargetFeature.id) ? prev : [...prev, currentTargetFeature],
          );
        }
        setFeatureFeedback({ status: 'correct', targetFeature: currentTargetFeature });
        autoNextTimerRef.current = window.setTimeout(() => {
          advanceFeatureNext();
        }, 1050);
        return;
      }

      const clickedItem = allFeatureItems.find((x) => x.id === clickedId);
      setFeatureRetryId(clickedId);
      setStreak(0);
      if (featureAttempts === 0) {
        setFeatureAttempts(1);
        setFeatureFeedback({
          status: 'wrong_retry',
          clickedName: clickedItem?.nameJa ?? '別の地点',
          targetFeature: currentTargetFeature,
        });
        return;
      }

      setFeatureSolvedMap((prev) => ({ ...prev, [currentTargetFeature.id]: 'wrong' }));
      setAnsweredCount((n) => n + 1);
      setMissedFeatures((prev) =>
        prev.some((x) => x.id === currentTargetFeature.id) ? prev : [...prev, currentTargetFeature],
      );
      onRecordFeature(currentTargetFeature.id, false);
      setFeatureFeedback({
        status: 'revealed',
        clickedName: clickedItem?.nameJa ?? '別の地点',
        targetFeature: currentTargetFeature,
      });
      const [lng, lat] = getGeometryCenter(currentTargetFeature.geometry);
      setFlyTarget({ lng, lat, zoom: currentTargetFeature.isLinear ? 3.4 : 4.6, nonce: Date.now() });
    },
    [
      phase,
      quizKind,
      featureInputMode,
      currentTargetFeature,
      featureFeedback,
      featureAttempts,
      allFeatureItems,
      onRecordFeature,
      advanceFeatureNext,
    ],
  );

  const handleFeaturePinClick = useCallback(
    (lng: number, lat: number) => {
      if (phase !== 'playing' || quizKind !== 'feature' || featureInputMode !== 'pin') return;
      if (!currentTargetFeature || featureFeedback) return;

      const { distKm, nearestLng, nearestLat } = distanceToGeometryKm(lng, lat, currentTargetFeature.geometry);
      const { score, grade } = computePinScore(distKm, currentTargetFeature.isLinear);
      const ok = score >= 60;

      setPinOverlay({
        userLng: lng,
        userLat: lat,
        targetLng: nearestLng,
        targetLat: nearestLat,
      });
      setPinScoreSum((s) => s + score);
      setAnsweredCount((n) => n + 1);
      if (ok) {
        setCorrectCount((n) => n + 1);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
        setMissedFeatures((prev) =>
          prev.some((x) => x.id === currentTargetFeature.id) ? prev : [...prev, currentTargetFeature],
        );
      }
      onRecordFeature(currentTargetFeature.id, ok);
      setFeatureFeedback({
        status: 'pin_scored',
        distKm: Math.round(distKm),
        pinScore: score,
        pinGrade: grade,
        targetFeature: currentTargetFeature,
      });
      setFlyTarget({
        lng: nearestLng,
        lat: nearestLat,
        zoom: currentTargetFeature.isLinear ? 3.2 : 4.2,
        nonce: Date.now(),
      });
    },
    [phase, quizKind, featureInputMode, currentTargetFeature, featureFeedback, onRecordFeature],
  );

  const handleFeatureGiveUp = useCallback(() => {
    if (!currentTargetFeature) return;
    setFeatureSolvedMap((prev) => ({ ...prev, [currentTargetFeature.id]: 'wrong' }));
    setAnsweredCount((n) => n + 1);
    setStreak(0);
    setMissedFeatures((prev) =>
      prev.some((x) => x.id === currentTargetFeature.id) ? prev : [...prev, currentTargetFeature],
    );
    onRecordFeature(currentTargetFeature.id, false);
    setFeatureFeedback({ status: 'revealed', targetFeature: currentTargetFeature });
    const [lng, lat] = getGeometryCenter(currentTargetFeature.geometry);
    setFlyTarget({ lng, lat, zoom: currentTargetFeature.isLinear ? 3.4 : 4.6, nonce: Date.now() });
  }, [currentTargetFeature, onRecordFeature]);

  // 地図上の国カラー合成（弱点ヒートマップ or クイズ状態）
  const countryColors = useMemo<Record<string, string>>(() => {
    if (phase === 'setup' && showWeakHeatmap && quizKind === 'country') {
      const m: Record<string, string> = {};
      for (const [iso, cnt] of Object.entries(quizStats.countryStats)) {
        const total = cnt.correct + cnt.wrong;
        if (total === 0) continue;
        const rate = cnt.correct / total;
        m[iso] = rate >= 0.8 ? '#86efac' : rate >= 0.5 ? '#fde047' : '#f87171';
      }
      return m;
    }
    const colors: Record<string, string> = {};
    for (const [iso, st] of Object.entries(countrySolvedMap)) {
      colors[iso] = st === 'correct' ? '#22c55e' : '#f59e0b';
    }
    if (countryRetryIso) colors[countryRetryIso] = '#ef4444';
    if (countryFeedback?.status === 'revealed') {
      colors[countryFeedback.targetCountry.iso3] = '#f59e0b';
    }
    return colors;
  }, [
    phase,
    showWeakHeatmap,
    quizKind,
    quizStats.countryStats,
    countrySolvedMap,
    countryRetryIso,
    countryFeedback,
  ]);

  const featureColors = useMemo<Record<string, string>>(() => {
    const colors: Record<string, string> = {};
    for (const [fid, st] of Object.entries(featureSolvedMap)) {
      colors[fid] = st === 'correct' ? '#16a34a' : '#d97706';
    }
    if (featureRetryId) colors[featureRetryId] = '#ef4444';
    if (featureFeedback?.status === 'revealed') {
      colors[featureFeedback.targetFeature.id] = '#f59e0b';
    }
    return colors;
  }, [featureSolvedMap, featureRetryId, featureFeedback]);

  const allowedFeatureIds = useMemo<Set<string> | null>(() => {
    if (quizKind !== 'feature') return null;
    if (featureCategoryChoice === 'weak') {
      return new Set(featurePool.map((x) => x.id));
    }
    return null;
  }, [quizKind, featureCategoryChoice, featurePool]);

  const effectiveFeatureCategory: BlankFeatureCategory =
    featureCategoryChoice === 'weak' ? 'mixed' : featureCategoryChoice;

  const canvasMode =
    quizKind === 'country'
      ? 'country'
      : featureInputMode === 'pin'
        ? 'feature_pin'
        : 'feature_select';

  const revealedFeatureId =
    quizKind === 'feature' && featureFeedback && (featureFeedback.status === 'pin_scored' || featureFeedback.status === 'revealed')
      ? featureFeedback.targetFeature.id
      : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-50 md:flex-row">
      {/* 左／上側コントロールパネル */}
      <div className="z-10 shrink-0 border-b border-slate-200 bg-white p-3 md:w-[350px] md:overflow-y-auto md:border-b-0 md:border-r md:p-4 lg:w-[390px]">
        {phase === 'setup' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 md:text-base">
                {quizKind === 'country'
                  ? '国名 → 場所当てクイズ'
                  : '山・川・海峡・地形 場所当てクイズ'}
              </h2>
              {quizKind === 'country' && (
                <button
                  type="button"
                  onClick={() => setShowWeakHeatmap((v) => !v)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
                    showWeakHeatmap
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {showWeakHeatmap ? '弱点表示中' : '弱点ヒートマップ'}
                </button>
              )}
            </div>

            {quizKind === 'country' ? (
              <>
                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">出題範囲（重要度）</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {(
                      [
                        { id: 'S', label: 'Sランク最頻出 (22)' },
                        { id: 'SA', label: 'S+A頻出 (86)' },
                        { id: 'detailed', label: '詳細収録 (100)' },
                        { id: 'all', label: '世界全240国 (上級)' },
                        { id: 'weak', label: `苦手のみ復習 (${weakCountryIso3s.length})` },
                      ] as { id: CountryRankFilter; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRankFilter(opt.id)}
                        className={`rounded-lg border px-2 py-1.5 text-left font-bold transition ${
                          rankFilter === opt.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">地域フィルター</div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {REGION_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRegionFilter(r.id);
                          setFitBoundsTarget({ bounds: REGION_BOUNDS[r.id], nonce: Date.now() });
                        }}
                        className={`rounded-full border px-2.5 py-1 font-bold transition ${
                          regionFilter === r.id
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">問題数・ルール</div>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {(
                      [
                        { id: 10, label: '10問' },
                        { id: 20, label: '20問' },
                        { id: 999, label: '全問' },
                        { id: 'timed60', label: '60秒TA' },
                      ] as { id: QuestionLimitOption; label: string }[]
                    ).map((q) => (
                      <button
                        key={String(q.id)}
                        type="button"
                        onClick={() => setQuestionLimit(q.id)}
                        className={`rounded-lg border py-1.5 font-bold transition ${
                          questionLimit === q.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={countryPool.length === 0}
                  onClick={() => startCountryQuiz()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Play className="h-4 w-4 fill-current" />
                  クイズ開始（対象 {countryPool.length}カ国）
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">カテゴリ選択</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {FEATURE_CAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFeatureCategoryChoice(opt.id)}
                        className={`rounded-lg border px-2 py-1.5 text-left font-bold transition ${
                          featureCategoryChoice === opt.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.id === 'weak' ? `${opt.label} (${weakFeatureIds.length})` : opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">回答方式</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setFeatureInputMode('select')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 font-bold transition ${
                        featureInputMode === 'select'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <MousePointerClick className="h-3.5 w-3.5" />
                      シルエット選択
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeatureInputMode('pin')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 font-bold transition ${
                        featureInputMode === 'pin'
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      完全白地図ピン打ち
                    </button>
                  </div>
                  <p className="mt-1 text-[10.5px] text-slate-500">
                    {featureInputMode === 'select'
                      ? '標準：地図上に無記名の線やピンを表示し、正しいものをタップします。'
                      : '上級：ヒント線・ピンなしで地図を直接タップし、正解までの距離(km)で採点します。'}
                  </p>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold text-slate-500">出題数</div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[10, 15, 999].map((lim) => (
                      <button
                        key={lim}
                        type="button"
                        onClick={() => setFeatureLimit(lim)}
                        className={`rounded-lg border py-1.5 font-bold transition ${
                          featureLimit === lim
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {lim === 999 ? '全問' : `${lim}問`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={featurePool.length === 0}
                  onClick={() => startFeatureQuiz()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Play className="h-4 w-4 fill-current" />
                  クイズ開始（対象 {featurePool.length}件）
                </button>
              </>
            )}
          </div>
        )}

        {/* 出題中 UI */}
        {phase === 'playing' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-extrabold text-slate-700">
                  {quizKind === 'country'
                    ? questionLimit === 'timed60'
                      ? `回答数 ${answeredCount}`
                      : `第 ${countryIndex + 1} / ${countryQueue.length} 問`
                    : `第 ${featureIndex + 1} / ${featureQueue.length} 問`}
                </span>
                {questionLimit === 'timed60' && quizKind === 'country' && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold ${
                      timeLeftSec <= 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    {timeLeftSec}秒
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-bold">
                <span className="text-emerald-700">正解 {correctCount}</span>
                {streak >= 2 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700">
                    <Flame className="h-3 w-3" />
                    {streak}連続
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPhase('setup')}
                  className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100"
                >
                  中断
                </button>
              </div>
            </div>

            {quizKind === 'country' && currentTargetCountry && (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3">
                <div className="text-[11px] font-bold text-indigo-700">
                  次の国を白地図上でタップしてください
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-extrabold text-slate-900 md:text-2xl">
                    {currentTargetCountry.nameJa}
                  </div>
                  <span className="font-mono text-xs text-slate-500">{currentTargetCountry.nameEn}</span>
                </div>

                {hintStep > 0 && (
                  <div className="mt-2 space-y-0.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-700">
                    <div>
                      地域：<b>{currentTargetCountry.region}</b>（{currentTargetCountry.subRegion}）
                    </div>
                    {hintStep >= 2 && (
                      <div>
                        首都：<b>{currentTargetCountry.capital}</b>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHintStep((s) => Math.min(2, s + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    ヒント ({hintStep}/2)
                  </button>
                  <button
                    type="button"
                    onClick={handleCountryGiveUp}
                    disabled={Boolean(countryFeedback && countryFeedback.status !== 'wrong_retry')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    答えを見る
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGraticule((v) => !v)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${
                      showGraticule
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    経緯線 {showGraticule ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {quizKind === 'feature' && currentTargetFeature && (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700">
                  <span>
                    {featureInputMode === 'select'
                      ? '該当する無記名の線・ピンをタップ'
                      : '地図上で正しい場所を直接タップ（ピン打ち）'}
                  </span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-700">
                    {currentTargetFeature.categoryLabel}
                  </span>
                </div>
                <div className="mt-1 text-lg font-extrabold text-slate-900 md:text-xl">
                  {currentTargetFeature.nameJa}
                </div>

                {hintStep > 0 && (
                  <div className="mt-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-700">
                    関連国コード：<b>{currentTargetFeature.relatedCountries.join(', ') || '広域・海域'}</b>
                    {currentTargetFeature.subLabel && ` ／ 分類：${currentTargetFeature.subLabel}`}
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHintStep((s) => Math.min(1, s + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    ヒント
                  </button>
                  <button
                    type="button"
                    onClick={handleFeatureGiveUp}
                    disabled={Boolean(featureFeedback && featureFeedback.status !== 'wrong_retry')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    答えを見る
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGraticule((v) => !v)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${
                      showGraticule
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    経緯線 {showGraticule ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* フィードバック表示（国当て） */}
            {quizKind === 'country' && countryFeedback && (
              <div
                className={`rounded-xl border p-2.5 text-xs ${
                  countryFeedback.status === 'correct'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : countryFeedback.status === 'wrong_retry'
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-amber-300 bg-amber-50 text-amber-950'
                }`}
              >
                {countryFeedback.status === 'correct' && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">⭕ 正解！ {countryFeedback.targetCountry.nameJa}</span>
                    <button
                      type="button"
                      onClick={advanceCountryNext}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white"
                    >
                      次へ <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {countryFeedback.status === 'wrong_retry' && (
                  <div>
                    ❌ タップしたのは <b>{countryFeedback.clickedName}</b> です。もう一度探してみましょう！
                  </div>
                )}
                {countryFeedback.status === 'revealed' && (
                  <div className="space-y-2">
                    <div>
                      {countryFeedback.clickedName && (
                        <div className="text-rose-700">タップ：{countryFeedback.clickedName}</div>
                      )}
                      <div className="font-extrabold text-amber-900">
                        📍 正解：{countryFeedback.targetCountry.nameJa}（{countryFeedback.targetCountry.capital}）
                      </div>
                      {countryFeedback.targetCountry.quickOverview?.headline && (
                        <p className="mt-1 text-[11px] leading-snug text-slate-700">
                          {countryFeedback.targetCountry.quickOverview.headline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={advanceCountryNext}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 font-bold text-white hover:bg-indigo-700"
                      >
                        次の問題へ <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCountryInMap(countryFeedback.targetCountry.iso3)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
                      >
                        詳細を見る
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* フィードバック表示（地形当て） */}
            {quizKind === 'feature' && featureFeedback && (
              <div
                className={`rounded-xl border p-2.5 text-xs ${
                  featureFeedback.status === 'correct'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : featureFeedback.status === 'wrong_retry'
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : featureFeedback.status === 'pin_scored'
                        ? (featureFeedback.pinScore ?? 0) >= 60
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-amber-300 bg-amber-50 text-amber-950'
                        : 'border-amber-300 bg-amber-50 text-amber-950'
                }`}
              >
                {featureFeedback.status === 'correct' && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">⭕ 正解！ {featureFeedback.targetFeature.nameJa}</span>
                    <button
                      type="button"
                      onClick={advanceFeatureNext}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white"
                    >
                      次へ <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {featureFeedback.status === 'wrong_retry' && (
                  <div>
                    ❌ 選んだのは <b>{featureFeedback.clickedName}</b> です。もう1回挑戦できます！
                  </div>
                )}
                {(featureFeedback.status === 'revealed' || featureFeedback.status === 'pin_scored') && (
                  <div className="space-y-1.5">
                    {featureFeedback.status === 'pin_scored' ? (
                      <div className="flex items-center justify-between font-extrabold">
                        <span>
                          🎯 正解まで約 {featureFeedback.distKm?.toLocaleString()} km
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs shadow-2xs">
                          {featureFeedback.pinScore}点（{featureFeedback.pinGrade}ランク）
                        </span>
                      </div>
                    ) : (
                      <div className="font-extrabold text-amber-900">
                        📍 正解位置：{featureFeedback.targetFeature.nameJa}
                      </div>
                    )}
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {featureFeedback.targetFeature.summary}
                    </p>
                    <button
                      type="button"
                      onClick={advanceFeatureNext}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 font-bold text-white hover:bg-indigo-700"
                    >
                      次の問題へ <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* リザルト画面 */}
        {phase === 'finished' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3.5 text-center">
              <Trophy className="mx-auto h-7 w-7 text-amber-500" />
              <div className="mt-1 text-base font-extrabold text-slate-900">クイズ完了！</div>
              <div className="mt-1 text-2xl font-black text-indigo-700">
                {correctCount} / {answeredCount} 正解
                <span className="ml-2 text-sm font-bold text-slate-600">
                  （{answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%）
                </span>
              </div>
              {quizKind === 'feature' && featureInputMode === 'pin' && answeredCount > 0 && (
                <div className="mt-1 text-xs font-bold text-amber-700">
                  ピン打ち平均スコア：{Math.round(pinScoreSum / answeredCount)} / 100点
                </div>
              )}
            </div>

            {quizKind === 'country' && missedCountries.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-bold text-slate-700">
                  間違えた・復習したい国 ({missedCountries.length})
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {missedCountries.map((iso) => (
                    <div
                      key={iso}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-bold text-slate-800">{countriesData[iso]?.nameJa ?? iso}</span>
                      <button
                        type="button"
                        onClick={() => onOpenCountryInMap(iso)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        <Compass className="h-3 w-3" /> 地図で復習
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizKind === 'feature' && missedFeatures.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-bold text-slate-700">
                  間違えた地形・都市 ({missedFeatures.length})
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {missedFeatures.map((mf) => (
                    <div
                      key={mf.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-bold text-slate-800">{mf.nameJa}</span>
                      <span className="text-[10px] text-slate-500">{mf.categoryLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {quizKind === 'country' && missedCountries.length > 0 && (
                <button
                  type="button"
                  onClick={() => startCountryQuiz(missedCountries)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  間違えた {missedCountries.length}カ国だけ再挑戦
                </button>
              )}
              {quizKind === 'feature' && missedFeatures.length > 0 && (
                <button
                  type="button"
                  onClick={() => startFeatureQuiz(missedFeatures)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  間違えた {missedFeatures.length}件だけ再挑戦
                </button>
              )}
              <button
                type="button"
                onClick={() => (quizKind === 'country' ? startCountryQuiz() : startFeatureQuiz())}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <MapPin className="h-3.5 w-3.5" />
                同じ設定でもう一度
              </button>
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                設定に戻る
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 右／下側 無文字白地図キャンバス */}
      <div className="min-h-0 flex-1">
        <BlankMapQuizCanvas
          countriesGeoJson={countriesGeoJson}
          layersGeoJson={layersGeoJson}
          capitalsGeoJson={capitalsGeoJson}
          volcanoesGeoJson={volcanoesGeoJson}
          mode={canvasMode}
          featureCategory={effectiveFeatureCategory}
          allowedFeatureIds={allowedFeatureIds}
          countryColors={countryColors}
          featureColors={featureColors}
          revealedFeatureId={revealedFeatureId}
          pinOverlay={pinOverlay}
          flyTarget={flyTarget}
          fitBoundsTarget={fitBoundsTarget}
          showGraticule={showGraticule}
          onClickCountry={handleCountryClick}
          onClickFeature={handleFeatureSelectClick}
          onClickMapCoord={handleFeaturePinClick}
        />
      </div>
    </div>
  );
}
