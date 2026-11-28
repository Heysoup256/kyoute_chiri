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
import type { MapDrillLegendItem, MapDrillSpec } from './MiniWorldMapDrillSvg';

export type DrillGenre =
  | 'all'
  | 'stat_table'
  | 'unseen_infer'
  | 'graph_analysis'
  | 'map_regional'
  | 'climate_coords'
  | 'visual_infer';

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
  /** true のとき抜粋項目のみ描画し、100%に対する実幅を残余グレー付きで表示する */
  isPartial?: boolean;
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
  /** 3枚並列の階級区分図比較問題用 */
  mapSpecs?: MapDrillSpec[];
  sharedMapLegend?: MapDrillLegendItem[];
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
  { id: 'stat_table', label: '統計表・両ブラインド' },
  { id: 'unseen_infer', label: '初見統計推論' },
  { id: 'graph_analysis', label: 'グラフ分析（散布・構成・推移）' },
  { id: 'map_regional', label: '地図統計・国内/日本' },
  { id: 'climate_coords', label: '雨温図・ハイサー・地図' },
  { id: 'visual_infer', label: '人口ピラミッド・景観写真' },
];
