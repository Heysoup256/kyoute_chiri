import type { FeatureCollection, Geometry } from 'geojson';
import type {
  AgePyramidBin,
  ClimateCity,
  CountryData,
  GeoCountryProperties,
  JapanGeographyDataset,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import type { MapDrillSpec } from './MiniWorldMapDrillSvg';

export type DrillGenre =
  | 'all'
  | 'unseen_infer'
  | 'map_choropleth'
  | 'subnational_jpn'
  | 'stat_country'
  | 'stat_double_blind'
  | 'stat_item'
  | 'scatter_plot'
  | 'composition_bar'
  | 'time_shift'
  | 'climate_coords'
  | 'pyramid_match'
  | 'photo_infer';

export interface ScatterDrillSpec {
  title: string;
  xLabel: string;
  yLabel: string;
  backgroundPoints: { x: number; y: number }[];
  targetPoints: { code: string; x: number; y: number; color: string }[];
  showDiagonal?: boolean;
  diagonalLabel?: string;
}

export interface StackedBarDrillSpec {
  caption: string;
  unit: string;
  series: { name: string; color: string }[];
  rows: { label: string; values: number[] }[];
}

export interface LineTrendDrillSpec {
  title: string;
  unit: string;
  xLabels: string[];
  series: { code: string; values: number[]; color: string }[];
}

export interface DrillDialogueLine {
  speaker: string;
  text: string;
}

export interface GeneratedDrillQuestion {
  id: string;
  genre: Exclude<DrillGenre, 'all'>;
  genreLabel: string;
  /** 重複生成を防ぐための識別シグネチャ */
  signature?: string;
  /** 学習連携やミニ模試集計用の大分野ラベル */
  domainTag?: string;
  promptTitle: string;
  promptBody: string;
  dialogues?: DrillDialogueLine[];
  table?: { caption?: string; headers: string[]; rows: string[][] };
  mapSpec?: MapDrillSpec;
  scatterPlot?: ScatterDrillSpec;
  stackedBars?: StackedBarDrillSpec;
  lineTrend?: LineTrendDrillSpec;
  climateCity?: ClimateCity;
  climateCities?: { label: string; city: ClimateCity; metaText: string }[];
  climateChartType?: 'climograph' | 'hythergraph';
  pyramidBins?: AgePyramidBin[];
  pyramidPair?: { label: string; bins: AgePyramidBin[] }[];
  photoUrl?: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** 思考プロセスを順を追って示すステップ解説 */
  steps?: string[];
  detailNotes?: string[];
  relatedIso3s: string[];
  relatedRankingId?: string;
  relatedSystematicId?: string;
}

export interface DrillFocusFilter {
  iso3?: string;
  category?: string;
  label?: string;
}

export interface DrillGeneratorParams {
  worldRankings: WorldRankingsDataset | null;
  countriesData: Record<string, CountryData>;
  countriesGeoJson?: FeatureCollection<Geometry, GeoCountryProperties> | null;
  japanData?: JapanGeographyDataset | null;
  timeSliders: TimeSeriesSliderItem[];
  photoEncyclopedia: PhotoEncyclopediaEntry[];
  recentSignatures?: string[];
  focusFilter?: DrillFocusFilter | null;
}

export const DRILL_GENRE_OPTIONS: { id: DrillGenre; label: string }[] = [
  { id: 'all', label: '全ジャンルおまかせ' },
  { id: 'unseen_infer', label: '初見統計・論理推論' },
  { id: 'map_choropleth', label: '地図統計・階級区分' },
  { id: 'subnational_jpn', label: '国内地域・日本統計' },
  { id: 'stat_country', label: '統計数値 → 国を当てる' },
  { id: 'stat_double_blind', label: '国名×項目 両方ブラインド' },
  { id: 'stat_item', label: '統計数値 → 項目を当てる' },
  { id: 'scatter_plot', label: '散布図・2指標分析' },
  { id: 'composition_bar', label: '構成比グラフ読取' },
  { id: 'time_shift', label: '時系列・推移グラフ読取' },
  { id: 'climate_coords', label: '雨温図・ハイサー・地図' },
  { id: 'pyramid_match', label: '人口ピラミッド判別' },
  { id: 'photo_infer', label: '景観写真・地域推論' },
];
