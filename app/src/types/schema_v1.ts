import type { Geometry } from 'geojson';

/**
 * schema_v1.json に対応するフロントエンド用 TypeScript 型定義
 */

export type ImportanceRank = 'S' | 'A' | 'B' | 'C';

export interface PastExamRef {
  examId: string;
  questionId?: string;
  questionLabel: string;
  note?: string;
}

export interface ExamMeta {
  isFrequent: boolean;
  importance: ImportanceRank;
  pastExamRefs: PastExamRef[];
}

export interface KnowledgeItem {
  id: string;
  category?: string;
  label: string;
  detail?: string;
  worldRank?: number | null;
  worldRankNote?: string;
  clozeTerms?: string[];
  tags?: string[];
  examMeta: ExamMeta;
}

export interface ClimateCity {
  cityId: string;
  nameJa: string;
  nameEn?: string;
  lat: number;
  lng: number;
  elevationM?: number | null;
  koppenCode: string;
  koppenNameJa?: string;
  factors: string[];
  monthlyTempC: number[];
  monthlyPrecipMm: number[];
  dataSource?: string;
  examMeta: ExamMeta;
}

export interface ReligionShare {
  name: string;
  percent?: number | null;
}

export interface QuickOverview {
  headline: string;
  summary: string;
  keyPoints: string[];
}

export interface DailyLifePhoto {
  url: string;
  caption: string;
  credit: string;
}

export interface DailyLifeInfo {
  summary: string;
  food: string;
  housing: string;
  streetNote: string;
  photos: DailyLifePhoto[];
}

export type KoppenGroup = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ThematicAttributes {
  koppenGroup: KoppenGroup;
  koppenMain: string;
  annualPrecipMm: number;
  agricultureMain: string;
  meanElevationM: number;
  religionMain: string;
  languageFamilyMain: string;
}

export interface SectorShare {
  primaryPct: number;
  secondaryPct: number;
  tertiaryPct: number;
}

export interface AgePyramidBin {
  ageGroup: string;
  malePct: number;
  femalePct: number;
}

export interface PopHistoryPoint {
  year: string;
  popMan: number;
}

export interface CountryStats {
  population: number;
  areaKm2: number;
  populationDensity: number;
  gdpBillionUsd: number;
  gdpPerCapitaUsd: number;
  gdpWorldRank?: number | null;
  urbanPopRatePct: number;
  sectorShare: SectorShare;
  agePyramid: AgePyramidBin[];
  pyramidType: string;
  fertilityRate?: number | null;
  femaleLaborPct?: number | null;
  remittanceGdpPct?: number | null;
  popHistory?: PopHistoryPoint[];
  dataYear: string;
}

export interface CountryRelation {
  partnerIso3: string;
  partnerNameJa: string;
  category: 'trade' | 'migration' | 'history' | 'tourism';
  direction: 'outgoing' | 'incoming' | 'mutual';
  summary: string;
}

export type HighlightPlacement = 'overview' | 'industry' | 'population' | 'culture';

export interface HighlightVisualBase {
  id: string;
  placement: HighlightPlacement;
  title: string;
  subtitle?: string;
  note?: string;
  source?: string;
}

export interface HighlightDonutVisual extends HighlightVisualBase {
  kind: 'donut';
  slices: { label: string; value: number; color: string }[];
  unit?: string;
}

export interface HighlightLineVisual extends HighlightVisualBase {
  kind: 'line';
  series: { label: string; value: number }[];
  unit: string;
}

export interface HighlightBarVisual extends HighlightVisualBase {
  kind: 'bar';
  bars: { label: string; value: number; isTarget?: boolean; color?: string }[];
  unit: string;
  maxValue?: number;
}

export interface HighlightTableVisual extends HighlightVisualBase {
  kind: 'table';
  headers: string[];
  rows: string[][];
}

export type HighlightVisual =
  | HighlightDonutVisual
  | HighlightLineVisual
  | HighlightBarVisual
  | HighlightTableVisual;

export interface TopCity {
  nameJa: string;
  popMan: number;
  metroPopMan?: number;
  lng: number;
  lat: number;
  isCapital: boolean;
  note: string;
}

export interface SpecialRegion {
  name: string;
  tag: string;
  lng: number;
  lat: number;
  zoom: number;
  description: string;
}

export interface PlaceSubFeature {
  label: string;
  fillColor: string;
  geometry: Geometry;
}

export interface PlaceEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  summary: string;
  lng: number;
  lat: number;
  zoom: number;
  iso3?: string;
  bounds?: [number, number, number, number];
  geometry?: Geometry;
  subFeatures?: PlaceSubFeature[];
  photoUrl?: string;
  photoCaption?: string;
  photoCredit?: string;
}

export interface CountryData {
  iso3: string;
  nameJa: string;
  nameEn: string;
  region: string;
  subRegion: string;
  capital: string;
  isBasicEntry?: boolean;
  quickOverview?: QuickOverview;
  dailyLife?: DailyLifeInfo;
  thematic?: ThematicAttributes;
  stats?: CountryStats;
  topCities?: TopCity[];
  specialRegions?: SpecialRegion[];
  relations?: CountryRelation[];
  highlightVisuals?: HighlightVisual[];
  examSummary: {
    rank: ImportanceRank;
    manualRankOverride?: ImportanceRank | null;
    appearanceCount: number;
    years: string[];
    frequentTopics: string[];
  };
  nature: {
    orogenicBelts: string[];
    summary?: string;
    items: KnowledgeItem[];
  };
  climate: {
    koppenCodes: string[];
    summary: string;
    cities: ClimateCity[];
  };
  industry: {
    whittleseyTypes: string[];
    agriculture: KnowledgeItem[];
    resourcesAndEnergy: KnowledgeItem[];
    industrialRegions: KnowledgeItem[];
    trade: {
      majorExports: string[];
      majorImports?: string[];
      majorPartners: string[];
      note?: string;
    };
  };
  cultureAndHistory: {
    languageFamily: string;
    officialLanguages: string[];
    religions: ReligionShare[];
    ethnicGroups: string[];
    regionalIntegrations: string[];
    historicalContext: KnowledgeItem[];
  };
}

export interface CountriesDataset {
  schemaVersion: string;
  generatedAt: string;
  examCoverage: string[];
  countries: Record<string, CountryData>;
}

export type GeoLayerType =
  | 'mountain_range'
  | 'river'
  | 'ocean_current'
  | 'plate_boundary'
  | 'landform_point'
  | 'strait_canal'
  | 'capitals'
  | 'volcanoes';

export interface GeoLayerProperties {
  id: string;
  layerType: GeoLayerType;
  subType?: string;
  subTypeJa?: string;
  flowDirection?: string;
  nameJa: string;
  relatedCountries: string[];
  summary: string;
  importance: ImportanceRank;
  pastExamYears?: string[];
  photoUrl?: string;
  photoCaption?: string;
  photoCredit?: string;
}

export interface GeoCountryProperties {
  iso3: string;
  nameEn: string;
  nameJaNe?: string;
  continent?: string;
  koppenGroup?: KoppenGroup;
  koppenMain?: string;
  annualPrecipMm?: number;
  agricultureMain?: string;
  meanElevationM?: number;
  religionMain?: string;
  languageFamilyMain?: string;
}

export interface PastExamQuestion {
  questionId: string;
  examId: string;
  year: number;
  session: 'main' | 'makeup';
  sessionLabel?: string;
  daimon?: number;
  toi?: number;
  answerNo?: number;
  points?: number;
  questionLabel: string;
  title: string;
  promptSummary?: string;
  relatedCountries: string[];
  relatedLayerIds?: string[];
  topicTags: string[];
  clipImagePath: string | null;
  clipPdfPath: string | null;
  choicesCount: number;
  choiceLabels?: string[];
  correctAnswer: number;
  explanation?: string;
  isPrototypeSample?: boolean;
}

export interface PastExamsDataset {
  schemaVersion: string;
  generatedAt: string;
  questions: PastExamQuestion[];
}

export interface LayerVisibilityState {
  mountain_range: boolean;
  river: boolean;
  ocean_current: boolean;
  plate_boundary: boolean;
  landform_point: boolean;
  strait_canal: boolean;
  capitals: boolean;
  volcanoes: boolean;
}

export type SeasonalPhase = 'jan' | 'avg' | 'jul';
export type EnsoPhase = 'normal' | 'elnino' | 'lanina';

export interface ClimateOverlayState {
  pressureWind: boolean;
  season: SeasonalPhase;
  monsoon: boolean;
  enso: boolean;
  ensoPhase: EnsoPhase;
  cyclone: boolean;
}

export type MapColorMode =
  | 'heatmap'
  | 'koppen'
  | 'precipitation'
  | 'soil'
  | 'agriculture'
  | 'elevation'
  | 'religion'
  | 'language'
  | 'marked'
  | 'plain';
