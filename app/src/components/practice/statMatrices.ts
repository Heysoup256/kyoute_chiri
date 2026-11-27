import type { CountryData, WorldRankingsDataset } from '../../types/schema_v1';

export interface StatMatrixRow {
  iso3?: string;
  countryName: string;
  values: number[];
}

export interface StatMatrixSpec {
  id: string;
  title: string;
  unit: string;
  sameUnitAcrossCols: boolean;
  colLabels: string[];
  rows: StatMatrixRow[];
  examPoint: string;
  // 散布図での y=x 等値線対応用（同一単位で直接比較する2列がある場合）
  diagonalCols?: { xCol: number; yCol: number; label: string };
}

/**
 * 共通テスト頻出の標準68カ国（ソマリランドやプエルトリコ等マイナー地域を除外するためのホワイトリスト）
 */
export const EXAM_STANDARD_ISO3_SET = new Set<string>([
  'JPN', 'CHN', 'KOR', 'TWN', 'SGP', 'IDN', 'THA', 'VNM', 'PHL', 'MYS', 'IND', 'BGD', 'PAK', 'LKA', 'NPL', 'KHM',
  'DEU', 'FRA', 'GBR', 'ITA', 'ESP', 'NLD', 'BEL', 'CHE', 'AUT', 'PRT', 'GRC', 'IRL',
  'SWE', 'NOR', 'FIN', 'DNK', 'ISL', 'POL', 'CZE', 'HUN', 'ROU', 'SVK', 'UKR', 'RUS',
  'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'CHL', 'PER', 'COL', 'BOL', 'URY', 'PRY', 'ECU', 'GTM', 'CUB',
  'EGY', 'TUR', 'IRN', 'SAU', 'ARE', 'QAT', 'KWT', 'MAR', 'DZA', 'ISR', 'JOR', 'KAZ',
  'ZAF', 'NGA', 'ETH', 'KEN', 'COD', 'GHA', 'CIV', 'TZA', 'SDN', 'GIN', 'BWA', 'NER',
  'AUS', 'NZL',
]);

/**
 * 国ごとの経済・人口構造類型タグ（同類国の根拠薄弱な競合を防止）
 */
export const COUNTRY_ARCHETYPE_MAP: Record<string, string> = {
  JPN: 'east_asia_aging',
  KOR: 'east_asia_aging',
  TWN: 'east_asia_aging',
  CHN: 'east_asia_giant',
  SGP: 'city_trade_hub',
  DEU: 'west_eu_ind',
  GBR: 'west_eu_svc',
  FRA: 'west_eu_svc',
  ITA: 'south_eu',
  ESP: 'south_eu',
  NLD: 'west_eu_ind',
  BEL: 'west_eu_ind',
  CHE: 'alpine_high_inc',
  AUT: 'west_eu_ind',
  PRT: 'south_eu',
  GRC: 'south_eu',
  IRL: 'west_eu_svc',
  SWE: 'nordic_welfare',
  NOR: 'nordic_oil',
  FIN: 'nordic_welfare',
  DNK: 'nordic_welfare',
  ISL: 'nordic_welfare',
  POL: 'east_eu',
  CZE: 'east_eu',
  HUN: 'east_eu',
  ROU: 'east_eu',
  SVK: 'east_eu',
  UKR: 'east_eu_agr',
  RUS: 'rus_resource',
  USA: 'settler_giant',
  CAN: 'settler_resource',
  AUS: 'settler_resource',
  NZL: 'settler_agr',
  MEX: 'latin_ind',
  BRA: 'latin_giant',
  ARG: 'latin_urban_agr',
  CHL: 'latin_urban_res',
  URY: 'latin_urban_agr',
  PER: 'latin_andies',
  COL: 'latin_andies',
  BOL: 'latin_andies_low',
  PRY: 'latin_agr',
  ECU: 'latin_andies',
  GTM: 'central_am_low',
  CUB: 'caribbean_low',
  ARE: 'gulf_oil',
  QAT: 'gulf_oil',
  SAU: 'gulf_oil_mid',
  KWT: 'gulf_oil',
  TUR: 'mena_ind',
  IRN: 'mena_oil_ind',
  EGY: 'mena_populous',
  MAR: 'mena_maghreb',
  DZA: 'mena_oil_ind',
  ISR: 'mena_high_tech',
  JOR: 'mena_remit',
  KAZ: 'central_asia_res',
  IDN: 'asean_archipelago',
  THA: 'asean_upper_mid',
  MYS: 'asean_upper_mid',
  VNM: 'asean_mfg',
  PHL: 'asean_remit',
  KHM: 'asean_agr',
  IND: 'south_asia_giant',
  BGD: 'south_asia_garment',
  PAK: 'south_asia_agr',
  LKA: 'south_asia_island',
  NPL: 'south_asia_remit',
  ZAF: 'africa_mid_ind',
  BWA: 'africa_mid_res',
  NGA: 'africa_oil_pop',
  ETH: 'africa_highland_agr',
  KEN: 'africa_east_mix',
  COD: 'africa_mineral_poor',
  GHA: 'africa_west_cacao',
  CIV: 'africa_west_cacao',
  TZA: 'africa_east_mix',
  SDN: 'africa_sahel',
  GIN: 'africa_mineral_poor',
  NER: 'africa_sahel',
};

/**
 * 共通テストの大問（地誌・テーマ）に即した比較国コホート
 */
export const REGIONAL_COUNTRY_COHORTS: { label: string; iso3s: string[] }[] = [
  { label: '東・東南アジア諸国', iso3s: ['JPN', 'CHN', 'KOR', 'SGP', 'THA', 'IDN', 'VNM', 'PHL', 'KHM'] },
  { label: 'アジア・大洋州諸国', iso3s: ['JPN', 'IND', 'IDN', 'BGD', 'PAK', 'AUS', 'SGP', 'ARE'] },
  { label: 'ヨーロッパ・ロシア周辺', iso3s: ['DEU', 'FRA', 'NOR', 'POL', 'UKR', 'ROU', 'ESP', 'RUS'] },
  { label: '南北アメリカ諸国', iso3s: ['USA', 'MEX', 'BRA', 'ARG', 'PER', 'BOL', 'GTM', 'CHL'] },
  { label: '西アジア・北アフリカ諸国', iso3s: ['TUR', 'EGY', 'ARE', 'SAU', 'MAR', 'ISR', 'IRN', 'JOR'] },
  { label: 'アフリカ諸国', iso3s: ['ZAF', 'BWA', 'EGY', 'MAR', 'NGA', 'KEN', 'ETH', 'NER'] },
  { label: '国際移動・労働構造の対比', iso3s: ['ARE', 'SGP', 'JPN', 'DEU', 'PHL', 'PAK', 'MEX', 'ETH'] },
  { label: '環太平洋の主要国', iso3s: ['USA', 'JPN', 'CHN', 'AUS', 'CHL', 'IDN', 'VNM', 'PER'] },
];

/**
 * 新課程共通テスト型の実数値マトリクス（28表）
 * スパース行を整理し、常に複数列で識別可能な構造を保証
 */
export const CURATED_STAT_MATRICES: StatMatrixSpec[] = [
  {
    id: 'mat_grains_prod',
    title: '主要国の穀物生産量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['小麦の生産量', '米（籾換算）の生産量', 'トウモロコシの生産量'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [137, 208, 289] },
      { iso3: 'IND', countryName: 'インド', values: [110, 206, 36] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [49, 10, 389] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [8, 10, 132] },
      { iso3: 'RUS', countryName: 'ロシア', values: [92, 1, 16] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [0, 54, 20] },
      { iso3: 'FRA', countryName: 'フランス', values: [35, 0, 12] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [13, 1, 41] },
      { iso3: 'EGY', countryName: 'エジプト', values: [10, 6, 7] },
    ],
    examPoint:
      '米はモンスーンアジアに極端偏在（米国・南米・欧州は極少）、小麦は中国・インド・ロシア・フランス等、トウモロコシは米国・中国・ブラジル・アルゼンチンが大きい。',
  },
  {
    id: 'mat_grains_exp',
    title: '主要国の穀物・大豆輸出量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['小麦の輸出量', '米（精米換算）の輸出量', 'トウモロコシの輸出量', '大豆の輸出量'],
    rows: [
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [19, 3, 53, 49] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [3, 1, 55, 101] },
      { iso3: 'RUS', countryName: 'ロシア', values: [50, 0, 5, 1] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [28, 0, 0, 0] },
      { iso3: 'IND', countryName: 'インド', values: [1, 18, 3, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [0, 9, 0, 0] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [0, 8, 0, 0] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [11, 0, 36, 5] },
      { iso3: 'CAN', countryName: 'カナダ', values: [24, 0, 2, 5] },
    ],
    examPoint:
      '生産首位の中国は輸出上位に現れず、米はインド・タイ・ベトナムが輸出上位、大豆・トウモロコシはブラジル・米国が突出し、小麦はロシア・豪・加・米が中心。',
  },
  {
    id: 'mat_wheat_balance',
    title: '主要国の小麦需給比較',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['小麦の生産量', '小麦の輸出量', '小麦の輸入量'],
    diagonalCols: { xCol: 0, yCol: 1, label: '生産＝輸出' },
    rows: [
      { iso3: 'RUS', countryName: 'ロシア', values: [9200, 5000, 20] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [4900, 1900, 350] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [3600, 2800, 2] },
      { iso3: 'FRA', countryName: 'フランス', values: [3500, 1700, 50] },
      { iso3: 'CHN', countryName: '中国', values: [13700, 20, 1200] },
      { iso3: 'IND', countryName: 'インド', values: [11000, 100, 10] },
      { iso3: 'EGY', countryName: 'エジプト', values: [950, 5, 1150] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [0, 0, 1080] },
      { iso3: 'JPN', countryName: '日本', values: [110, 0, 530] },
      { iso3: 'TUR', countryName: 'トルコ', values: [2100, 600, 1050] },
    ],
    examPoint:
      '中国・インドは生産世界1・2位だが内需が大きく輸出はわずか（中国は大輸入国）。ロシア・豪州・フランス・米国が主要輸出国、エジプト・インドネシア・日本が大輸入国。',
  },
  {
    id: 'mat_soy_maize_trade',
    title: '主要国の大豆・トウモロコシ輸出入量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['大豆の輸出量', '大豆の輸入量', 'トウモロコシの輸出量', 'トウモロコシの輸入量'],
    rows: [
      { iso3: 'BRA', countryName: 'ブラジル', values: [101, 0, 55, 2] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [49, 1, 53, 1] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [5, 7, 36, 0] },
      { iso3: 'CHN', countryName: '中国', values: [0, 99, 0, 24] },
      { iso3: 'JPN', countryName: '日本', values: [0, 3, 0, 15] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [0, 6, 0, 21] },
      { iso3: 'EGY', countryName: 'エジプト', values: [0, 3, 0, 7] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [0, 2, 0, 11] },
    ],
    examPoint:
      '大豆輸入は中国が世界の約6割を占め突出（ブラジル・米国から輸入）。メキシコ・日本・ベトナム等はトウモロコシの飼料・食用輸入が大きい。',
  },
  {
    id: 'mat_tubers_prod',
    title: '主要国のイモ類生産量比較',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['じゃがいもの生産量', 'キャッサバの生産量', 'さつまいもの生産量'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [93, 5, 51] },
      { iso3: 'IND', countryName: 'インド', values: [60, 7, 1] },
      { iso3: 'NGA', countryName: 'ナイジェリア', values: [1, 63, 4] },
      { iso3: 'COD', countryName: 'コンゴ民主共和国', values: [0, 49, 0] },
      { iso3: 'UKR', countryName: 'ウクライナ', values: [21, 0, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [0, 31, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [4, 18, 1] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [12, 0, 0] },
      { iso3: 'RUS', countryName: 'ロシア', values: [20, 0, 0] },
    ],
    examPoint:
      'じゃがいもは温帯・冷涼気候（中国・インド・東欧/ロシア・ドイツ）、キャッサバは熱帯低緯度（ナイジェリア・コンゴ民・タイ・ブラジル）、さつまいもは中国・熱帯アフリカに多い。',
  },
  {
    id: 'mat_sugar_cotton',
    title: '主要国の糖料作物・綿花生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['さとうきびの生産量', 'てんさいの生産量', '綿花の生産量'],
    rows: [
      { iso3: 'BRA', countryName: 'ブラジル', values: [72400, 0, 310] },
      { iso3: 'IND', countryName: 'インド', values: [49000, 0, 560] },
      { iso3: 'CHN', countryName: '中国', values: [10400, 900, 590] },
      { iso3: 'THA', countryName: 'タイ', values: [9300, 0, 0] },
      { iso3: 'RUS', countryName: 'ロシア', values: [0, 4900, 0] },
      { iso3: 'FRA', countryName: 'フランス', values: [0, 3200, 0] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [0, 2900, 0] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [3000, 2900, 290] },
      { iso3: 'PAK', countryName: 'パキスタン', values: [8800, 4, 140] },
    ],
    examPoint:
      'さとうきびは熱帯〜亜熱帯（ブラジル・インド・タイ・パキスタン）、てんさいは冷涼温帯（ロシア・フランス・ドイツ・米国北部）、中国と米国は広い緯度帯により両方を産する。',
  },
  {
    id: 'mat_barley_oilseeds',
    title: '温帯〜冷涼気候の麦類・油料種子生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['大麦の生産量', 'ライ麦の生産量', '菜種（ナタネ）の生産量', 'ひまわり種子の生産量'],
    rows: [
      { iso3: 'RUS', countryName: 'ロシア', values: [2100, 200, 420, 1650] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [1100, 310, 420, 10] },
      { iso3: 'POL', countryName: 'ポーランド', values: [300, 250, 360, 5] },
      { iso3: 'CAN', countryName: 'カナダ', values: [890, 40, 1830, 8] },
      { iso3: 'UKR', countryName: 'ウクライナ', values: [580, 30, 420, 1280] },
      { iso3: 'FRA', countryName: 'フランス', values: [1220, 15, 430, 200] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [1150, 3, 570, 5] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [470, 5, 5, 390] },
    ],
    examPoint:
      'ライ麦はバルト海・北ドイツ〜ロシアの氷食痩せ土地帯（ドイツ・ポーランド・ロシア）、菜種はカナダ・欧州・豪州、ひまわり種子はチェルノーゼム帯のロシア・ウクライナ・アルゼンチンに多い。',
  },
  {
    id: 'mat_beverage_percap',
    title: '主要国の嗜好飲料・主食 1人当たり年間消費量',
    unit: 'kg/人・年',
    sameUnitAcrossCols: true,
    colLabels: ['1人当たりコーヒー消費量', '1人当たり茶消費量', '1人当たり米消費量'],
    rows: [
      { iso3: 'FIN', countryName: 'フィンランド', values: [12.0, 0.2, 5] },
      { iso3: 'GBR', countryName: 'イギリス', values: [3.2, 1.9, 6] },
      { iso3: 'ITA', countryName: 'イタリア', values: [5.9, 0.1, 6] },
      { iso3: 'TUR', countryName: 'トルコ', values: [1.3, 3.2, 10] },
      { iso3: 'JPN', countryName: '日本', values: [3.4, 0.9, 51] },
      { iso3: 'CHN', countryName: '中国', values: [0.2, 1.8, 76] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [1.3, 0.4, 128] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [6.4, 0.1, 32] },
      { iso3: 'IND', countryName: 'インド', values: [0.1, 0.8, 70] },
    ],
    examPoint:
      '1人当たりコーヒー消費は北欧（フィンランド約12kg）が突出、茶はトルコ（世界1位級）・イギリスが多い。米はインドネシア・中国・インド・日本が高く、欧米は極めて少ない。',
  },
  {
    id: 'mat_fruits_oils',
    title: '主要国の果樹・植物油脂生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['パーム油の生産量', 'オリーブの生産量', 'オレンジの生産量', 'りんごの生産量'],
    rows: [
      { iso3: 'IDN', countryName: 'インドネシア', values: [4700, 0, 260, 0] },
      { iso3: 'MYS', countryName: 'マレーシア', values: [1900, 0, 2, 0] },
      { iso3: 'ESP', countryName: 'スペイン', values: [0, 620, 300, 55] },
      { iso3: 'ITA', countryName: 'イタリア', values: [0, 220, 175, 220] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [55, 0, 1650, 120] },
      { iso3: 'CHN', countryName: '中国', values: [0, 3, 760, 4760] },
      { iso3: 'IND', countryName: 'インド', values: [35, 0, 1020, 250] },
      { iso3: 'TUR', countryName: 'トルコ', values: [0, 290, 130, 480] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [0, 15, 250, 450] },
    ],
    examPoint:
      'パーム油は熱帯雨林（インドネシア・マレーシアで8割超）、オリーブは地中海性気候Cs（スペイン・イタリア・トルコ）、りんごは冷涼〜温帯（中国・米国・トルコ・欧州）、オレンジはブラジル・中国・インド。',
  },
  {
    id: 'mat_plantation_crops',
    title: '熱帯・亜熱帯 商品作物生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['コーヒー豆の生産量', 'カカオ豆の生産量', '茶の生産量', '天然ゴムの生産量'],
    rows: [
      { iso3: 'BRA', countryName: 'ブラジル', values: [317, 27, 0, 25] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [195, 0, 19, 130] },
      { iso3: 'CIV', countryName: 'コートジボワール', values: [10, 224, 0, 145] },
      { iso3: 'GHA', countryName: 'ガーナ', values: [0, 75, 0, 4] },
      { iso3: 'CHN', countryName: '中国', values: [11, 0, 330, 86] },
      { iso3: 'IND', countryName: 'インド', values: [35, 3, 137, 84] },
      { iso3: 'KEN', countryName: 'ケニア', values: [5, 0, 57, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [2, 0, 6, 480] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [79, 67, 13, 315] },
      { iso3: 'ETH', countryName: 'エチオピア', values: [50, 0, 1, 0] },
    ],
    examPoint:
      'カカオは西アフリカ（コートジボワール・ガーナ）、天然ゴムは東南アジア（タイ・インドネシア・ベトナム＋コートジボワール急増）、茶は中国・インド・ケニア、コーヒーはブラジル・ベトナムが中心。',
  },
  {
    id: 'mat_livestock_heads',
    title: '主要国の主要家畜飼育頭数',
    unit: '万頭',
    sameUnitAcrossCols: true,
    colLabels: ['牛の飼育頭数', '豚の飼育頭数', '羊の飼育頭数'],
    rows: [
      { iso3: 'IND', countryName: 'インド', values: [19300, 900, 7500] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [23400, 4400, 2100] },
      { iso3: 'CHN', countryName: '中国', values: [6300, 45200, 19400] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [8900, 7400, 520] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [2600, 250, 7800] },
      { iso3: 'NZL', countryName: 'ニュージーランド', values: [1000, 25, 2500] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [1860, 780, 1750] },
      { iso3: 'IRN', countryName: 'イラン', values: [550, 0, 4700] },
      { iso3: 'NGA', countryName: 'ナイジェリア', values: [2100, 800, 4900] },
      { iso3: 'ESP', countryName: 'スペイン', values: [640, 3400, 1450] },
    ],
    examPoint:
      'イスラム圏（イラン等）では豚飼育がゼロ、ヒンドゥー文化圏のインドは牛飼育世界有数だが牛肉輸出は主に水牛肉。中国は豚飼育が世界の約半分を占め、豪州・NZ・中国・イランは羊が多い。',
  },
  {
    id: 'mat_meat_export',
    title: '主要国の食肉輸出量比較',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['牛肉・水牛肉の輸出量', '豚肉の輸出量', '鶏肉の輸出量'],
    rows: [
      { iso3: 'BRA', countryName: 'ブラジル', values: [290, 120, 490] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [150, 5, 5] },
      { iso3: 'IND', countryName: 'インド', values: [145, 0, 2] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [135, 300, 330] },
      { iso3: 'ESP', countryName: 'スペイン', values: [25, 290, 25] },
      { iso3: 'DNK', countryName: 'デンマーク', values: [15, 140, 15] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [40, 190, 60] },
      { iso3: 'THA', countryName: 'タイ', values: [1, 3, 110] },
      { iso3: 'POL', countryName: 'ポーランド', values: [40, 65, 170] },
    ],
    examPoint:
      '鶏肉は宗教タブーがなくブラジル・米国・タイ・ポーランドから広く輸出される。豚肉輸出はEU（スペイン・ドイツ・デンマーク）と米国が大きい。牛肉・水牛肉輸出上位はブラジル・豪州・インド・米国。',
  },
  {
    id: 'mat_fishery_aqua',
    title: '主要国の海面天然漁獲量と水産養殖生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['海面天然漁獲量', '水産養殖の生産量'],
    diagonalCols: { xCol: 0, yCol: 1, label: '漁獲＝養殖' },
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [1180, 5280] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [690, 550] },
      { iso3: 'IND', countryName: 'インド', values: [370, 1020] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [360, 510] },
      { iso3: 'PER', countryName: 'ペルー', values: [540, 15] },
      { iso3: 'RUS', countryName: 'ロシア', values: [510, 35] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [420, 48] },
      { iso3: 'JPN', countryName: '日本', values: [290, 58] },
      { iso3: 'NOR', countryName: 'ノルウェー', values: [250, 165] },
      { iso3: 'CHL', countryName: 'チリ', values: [220, 150] },
    ],
    examPoint:
      '中国・インド・インドネシア・ベトナムのアジア諸国は水産養殖の比率が極めて高い。一方、ペルー（アンチョビ湧昇漁業）やロシア・米国・日本は天然漁獲が中心。ノルウェーとチリはサーモン養殖が突出。',
  },
  {
    id: 'mat_forestry_paper',
    title: '主要国の木材パルプ輸出量と紙・板紙生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['木材パルプの輸出量', '紙・板紙の生産量'],
    rows: [
      { iso3: 'BRA', countryName: 'ブラジル', values: [1880, 1080] },
      { iso3: 'CAN', countryName: 'カナダ', values: [940, 880] },
      { iso3: 'SWE', countryName: 'スウェーデン', values: [460, 860] },
      { iso3: 'FIN', countryName: 'フィンランド', values: [420, 740] },
      { iso3: 'CHL', countryName: 'チリ', values: [460, 130] },
      { iso3: 'CHN', countryName: '中国', values: [15, 12900] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [720, 6200] },
      { iso3: 'JPN', countryName: '日本', values: [30, 2240] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [85, 1950] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [530, 1320] },
    ],
    examPoint:
      'パルプ輸出は広大な森林を持つブラジル（ユーカリ早生樹）・カナダ・北欧・チリ・インドネシアが大きい。紙・板紙生産は大量需要市場を持つ中国・米国・日本・ドイツが上位。',
  },
  {
    id: 'mat_bauxite_al',
    title: 'アルミニウム原料と精錬生産の地域ギャップ',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['ボーキサイトの産出量', 'アルミナの生産量', 'アルミニウム新地金の精錬量'],
    rows: [
      { iso3: 'AUS', countryName: 'オーストラリア', values: [10000, 1900, 156] },
      { iso3: 'GIN', countryName: 'ギニア', values: [9700, 30, 0] },
      { iso3: 'CHN', countryName: '中国', values: [9300, 8200, 4100] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [3100, 1100, 100] },
      { iso3: 'IND', countryName: 'インド', values: [2300, 740, 410] },
      { iso3: 'RUS', countryName: 'ロシア', values: [550, 310, 370] },
      { iso3: 'CAN', countryName: 'カナダ', values: [0, 150, 300] },
      { iso3: 'NOR', countryName: 'ノルウェー', values: [0, 0, 140] },
      { iso3: 'ARE', countryName: 'アラブ首長国連邦', values: [0, 230, 260] },
    ],
    examPoint:
      '熱帯〜亜熱帯（ギニア・豪州）でボーキサイトを掘り、電力コストの安い水力国（カナダ・ノルウェー・ロシア）や産油ガス火力国（UAE）や中国がアルミ新地金を精錬する「電気の缶詰」構造。',
  },
  {
    id: 'mat_fossil_prod',
    title: '主要国の一次化石燃料 生産量（熱量換算）',
    unit: 'Mtoe（石油換算百万t）',
    sameUnitAcrossCols: true,
    colLabels: ['原油・NGLの産出量', '石炭の産出量', '天然ガスの産出量'],
    rows: [
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [860, 290, 910] },
      { iso3: 'RUS', countryName: 'ロシア', values: [540, 220, 530] },
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [530, 0, 110] },
      { iso3: 'CHN', countryName: '中国', values: [210, 2330, 205] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [17, 290, 130] },
      { iso3: 'IND', countryName: 'インド', values: [32, 430, 30] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [31, 460, 58] },
      { iso3: 'IRN', countryName: 'イラン', values: [210, 1, 225] },
      { iso3: 'QAT', countryName: 'カタール', values: [78, 0, 155] },
      { iso3: 'NOR', countryName: 'ノルウェー', values: [95, 0, 105] },
    ],
    examPoint:
      '中国は石炭生産が突出（世界の約半分）、米国はシェール革命で原油・ガスとも世界1位、中東（サウジ・イラン・カタール）やノルウェーは石炭ゼロで原油・天然ガス主体。',
  },
  {
    id: 'mat_energy_trade',
    title: '主要国の化石燃料輸出・輸入量（熱量換算）',
    unit: 'Mtoe（石油換算百万t）',
    sameUnitAcrossCols: true,
    colLabels: ['原油の輸出量', '原油の輸入量', '石炭の輸出量', 'LNGの輸出量'],
    diagonalCols: { xCol: 0, yCol: 1, label: '原油 輸出＝輸入' },
    rows: [
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [340, 0, 0, 0] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [200, 320, 58, 115] },
      { iso3: 'RUS', countryName: 'ロシア', values: [240, 0, 135, 42] },
      { iso3: 'CHN', countryName: '中国', values: [1, 560, 3, 0] },
      { iso3: 'IND', countryName: 'インド', values: [0, 235, 1, 0] },
      { iso3: 'JPN', countryName: '日本', values: [0, 125, 0, 0] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [12, 10, 225, 105] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [4, 15, 295, 18] },
      { iso3: 'QAT', countryName: 'カタール', values: [25, 0, 0, 103] },
    ],
    examPoint:
      '中国・インド・日本は原油輸出ゼロで巨額の原油輸入国、豪州・インドネシアは世界最大の石炭輸出国、LNG輸出3強は米国・豪州・カタール。米国は輸出も輸入も巨額な点に注意。',
  },
  {
    id: 'mat_steel_chain',
    title: '鉄鋼原料・粗鋼生産・貿易量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['鉄鉱石の産出量', '粗鋼の生産量', '鉄鋼製品の輸出量', '鉄鋼製品の輸入量'],
    diagonalCols: { xCol: 2, yCol: 3, label: '鉄鋼 輸出＝輸入' },
    rows: [
      { iso3: 'AUS', countryName: 'オーストラリア', values: [960, 5, 1, 2] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [440, 32, 12, 5] },
      { iso3: 'CHN', countryName: '中国', values: [280, 1019, 94, 8] },
      { iso3: 'IND', countryName: 'インド', values: [270, 140, 10, 8] },
      { iso3: 'JPN', countryName: '日本', values: [0, 87, 32, 5] },
      { iso3: 'KOR', countryName: '韓国', values: [0, 67, 27, 15] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [0, 35, 22, 19] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [44, 81, 9, 26] },
      { iso3: 'RUS', countryName: 'ロシア', values: [88, 76, 20, 4] },
    ],
    examPoint:
      '豪州・ブラジルは鉄鉱石産出が極大だが国内粗鋼生産は小さい原料輸出型。中国は粗鋼世界5割超・鉄鋼輸出首位。日本・韓国は鉄鉱石ゼロから臨海製鉄所で粗鋼・製品輸出を行う。米国は鉄鋼純輸入国。',
  },
  {
    id: 'mat_critical_minerals',
    title: '非鉄・先端鉱物資源の世界生産シェア',
    unit: '世界生産シェア (%)',
    sameUnitAcrossCols: true,
    colLabels: ['銅鉱石の産出シェア', 'ニッケル鉱の産出シェア', 'リチウムの産出シェア', 'コバルトの産出シェア'],
    rows: [
      { iso3: 'CHL', countryName: 'チリ', values: [24, 0, 24, 0] },
      { iso3: 'PER', countryName: 'ペルー', values: [12, 0, 0, 0] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [4, 52, 0, 8] },
      { iso3: 'PHL', countryName: 'フィリピン', values: [0, 11, 0, 1] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [4, 4, 47, 2] },
      { iso3: 'COD', countryName: 'コンゴ民主共和国', values: [11, 0, 0, 74] },
      { iso3: 'CHN', countryName: '中国', values: [8, 3, 18, 1] },
      { iso3: 'RUS', countryName: 'ロシア', values: [4, 6, 0, 4] },
    ],
    examPoint:
      '銅＝チリ・ペルー・コンゴ民、ニッケル＝インドネシア過半＋フィリピン、リチウム＝豪州＋チリ＋中国、コバルト＝コンゴ民主共和国が世界7割超を独占。',
  },
  {
    id: 'mat_gold_silver',
    title: '主要国の金・銀産出量比較',
    unit: 't/年',
    sameUnitAcrossCols: true,
    colLabels: ['金の産出量', '銀の産出量'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [370, 3400] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [310, 1200] },
      { iso3: 'RUS', countryName: 'ロシア', values: [310, 1200] },
      { iso3: 'CAN', countryName: 'カナダ', values: [200, 300] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [170, 1000] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [120, 6400] },
      { iso3: 'PER', countryName: 'ペルー', values: [100, 3100] },
      { iso3: 'GHA', countryName: 'ガーナ', values: [130, 10] },
      { iso3: 'ZAF', countryName: '南アフリカ', values: [100, 35] },
    ],
    examPoint:
      '金産出の上位は中国・豪州・ロシア・カナダ・ガーナ・南アフリカ（かつての首位南アは順位低下）。銀産出はメキシコ（1位）・中国・ペルーが多い。',
  },
  {
    id: 'mat_power_clean_ratios',
    title: '非化石電源の総発電電力量比（%）',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['水力の発電割合', '風力の発電割合', '原子力の発電割合'],
    rows: [
      { iso3: 'NOR', countryName: 'ノルウェー', values: [88, 10, 0] },
      { iso3: 'PRY', countryName: 'パラグアイ', values: [99, 0, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [60, 13, 2] },
      { iso3: 'DNK', countryName: 'デンマーク', values: [0, 56, 0] },
      { iso3: 'GBR', countryName: 'イギリス', values: [2, 29, 14] },
      { iso3: 'URY', countryName: 'ウルグアイ', values: [39, 36, 0] },
      { iso3: 'FRA', countryName: 'フランス', values: [11, 9, 65] },
      { iso3: 'SWE', countryName: 'スウェーデン', values: [40, 21, 29] },
      { iso3: 'SVK', countryName: 'スロバキア', values: [15, 0, 61] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [4, 27, 1] },
    ],
    examPoint:
      'パラグアイ・ノルウェーは水力9割前後、デンマークは風力過半、フランス・スロバキアは原子力6割超、イギリス・ドイツ・ウルグアイは風力比率が高くドイツは脱原発完了済み。',
  },
  {
    id: 'mat_cement_steel',
    title: '主要国の基礎工業素材生産量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['セメントの生産量', '粗鋼の生産量'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [2100, 1019] },
      { iso3: 'IND', countryName: 'インド', values: [410, 140] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [110, 20] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [91, 81] },
      { iso3: 'TUR', countryName: 'トルコ', values: [79, 34] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [62, 16] },
      { iso3: 'JPN', countryName: '日本', values: [49, 87] },
      { iso3: 'KOR', countryName: '韓国', values: [48, 67] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [29, 35] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [63, 32] },
    ],
    examPoint:
      'セメントは重量当たりの輸送費が高く石灰石原料も各地で採れるため、建設需要が大きい新興国（中国・インド・ベトナム・トルコ・インドネシア）の生産が大きい。日本・韓国・ドイツは粗鋼生産がセメントを上回る。',
  },
  {
    id: 'mat_land_use',
    title: '主要国の国土利用割合',
    unit: '国土面積比 (%)',
    sameUnitAcrossCols: true,
    colLabels: ['森林面積の割合', '耕地・永年作物地の割合', '永久牧草・放牧地の割合'],
    rows: [
      { iso3: 'JPN', countryName: '日本', values: [68, 12, 2] },
      { iso3: 'FIN', countryName: 'フィンランド', values: [74, 7, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [59, 8, 21] },
      { iso3: 'IND', countryName: 'インド', values: [24, 57, 3] },
      { iso3: 'GBR', countryName: 'イギリス', values: [13, 25, 46] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [17, 4, 44] },
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [0, 2, 81] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [10, 12, 40] },
      { iso3: 'UKR', countryName: 'ウクライナ', values: [17, 57, 13] },
    ],
    examPoint:
      '森林率高＝日本・フィンランド（約7割）・ブラジル（熱帯林6割）、耕地率高＝インド・ウクライナ（約6割）、牧草地率高＝豪州・英国・アルゼンチン・サウジ。',
  },
  {
    id: 'mat_tourism_balance',
    title: '主要国の国際観光収入と支出',
    unit: '十億USD',
    sameUnitAcrossCols: true,
    colLabels: ['国際観光収入（受入額）', '国際観光支出（海外旅行支払額）'],
    diagonalCols: { xCol: 0, yCol: 1, label: '収入＝支出' },
    rows: [
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [176, 151] },
      { iso3: 'ESP', countryName: 'スペイン', values: [92, 25] },
      { iso3: 'FRA', countryName: 'フランス', values: [69, 49] },
      { iso3: 'ITA', countryName: 'イタリア', values: [56, 32] },
      { iso3: 'THA', countryName: 'タイ', values: [48, 13] },
      { iso3: 'TUR', countryName: 'トルコ', values: [50, 7] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [37, 112] },
      { iso3: 'CHN', countryName: '中国', values: [25, 197] },
      { iso3: 'GBR', countryName: 'イギリス', values: [74, 110] },
      { iso3: 'JPN', countryName: '日本', values: [39, 17] },
    ],
    examPoint:
      '南欧（スペイン・イタリア）やタイ・トルコ・日本は観光収入が支出を大きく上回る大幅黒字。一方、寒冷・高所得で海外旅行熱の高いドイツ・英国・中国は大幅赤字（支出＞収入）。',
  },
  {
    id: 'mat_remit_tourism',
    title: '主要国の観光収入と出稼ぎ個人送金受取',
    unit: '十億USD',
    sameUnitAcrossCols: true,
    colLabels: ['国際観光収入（受入額）', '出稼ぎ個人送金の受取総額'],
    diagonalCols: { xCol: 0, yCol: 1, label: '観光収入＝送金受取' },
    rows: [
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [176, 7] },
      { iso3: 'ESP', countryName: 'スペイン', values: [92, 9] },
      { iso3: 'THA', countryName: 'タイ', values: [48, 10] },
      { iso3: 'JPN', countryName: '日本', values: [39, 5] },
      { iso3: 'IND', countryName: 'インド', values: [32, 125] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [31, 66] },
      { iso3: 'PHL', countryName: 'フィリピン', values: [9, 39] },
      { iso3: 'EGY', countryName: 'エジプト', values: [14, 24] },
      { iso3: 'PAK', countryName: 'パキスタン', values: [1, 27] },
      { iso3: 'TUR', countryName: 'トルコ', values: [50, 1] },
    ],
    examPoint:
      'インド（世界1位約1250億ドル）・メキシコ・フィリピン・パキスタン・エジプトは海外就労者からの個人送金受取が観光収入を上回る。先進観光国・タイ・トルコは観光収入が大きい。',
  },
  {
    id: 'mat_gender_labor',
    title: '主要国の女性労働力率・産業構成・議会参画指標',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['15歳以上女性労働力率', '第3次産業就業率', '女性国会議員比率'],
    rows: [
      { iso3: 'SWE', countryName: 'スウェーデン', values: [63, 81, 47] },
      { iso3: 'NOR', countryName: 'ノルウェー', values: [62, 79, 46] },
      { iso3: 'KHM', countryName: 'カンボジア', values: [73, 28, 13] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [69, 39, 31] },
      { iso3: 'JPN', countryName: '日本', values: [55, 73, 16] },
      { iso3: 'KOR', countryName: '韓国', values: [56, 71, 20] },
      { iso3: 'EGY', countryName: 'エジプト', values: [16, 51, 28] },
      { iso3: 'PAK', countryName: 'パキスタン', values: [25, 38, 17] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [57, 79, 29] },
    ],
    examPoint:
      '女性労働力率は東南アジアでも農村・軽工業労働を反映して高く（7割前後）、3次産業率は低め。北欧は3次産業率8割かつ議員比率も約半分と高い。イスラム圏（エジプト・パキスタン）は労働力率が低い。',
  },
  {
    id: 'mat_migration_remit',
    title: '国際人口移動・送金・都市人口率の対比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['外国人・移民の居住割合', '出稼ぎ個人送金受取の対GDP比', '都市人口率'],
    rows: [
      { iso3: 'ARE', countryName: 'アラブ首長国連邦', values: [88, 0, 88] },
      { iso3: 'SGP', countryName: 'シンガポール', values: [43, 0, 100] },
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [39, 0, 85] },
      { iso3: 'EGY', countryName: 'エジプト', values: [1, 11, 43] },
      { iso3: 'PAK', countryName: 'パキスタン', values: [1, 10, 40] },
      { iso3: 'PHL', countryName: 'フィリピン', values: [0, 9, 56] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [1, 4, 80] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [19, 0, 82] },
      { iso3: 'JPN', countryName: '日本', values: [3, 0, 92] },
    ],
    examPoint:
      '中東産油国（UAE・サウジ）や都市国家（シンガポール）は外国人比率が4〜9割と極めて高く送金は送出側。パキスタン・エジプト・フィリピンは都市率4〜6割で海外出稼ぎ送金がGDPの1割前後を支える。',
  },
  {
    id: 'mat_auto_ship_mfg',
    title: '主要国の自動車生産台数と二輪車生産・新造船割合',
    unit: '世界生産シェア (%)',
    sameUnitAcrossCols: true,
    colLabels: ['四輪自動車の世界生産シェア', '二輪車の世界生産・販売シェア', '新造船の世界竣工量シェア'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [32, 26, 50] },
      { iso3: 'IND', countryName: 'インド', values: [6, 30, 0] },
      { iso3: 'JPN', countryName: '日本', values: [10, 1, 14] },
      { iso3: 'KOR', countryName: '韓国', values: [4, 0, 29] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [11, 1, 0] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [2, 10, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [2, 3, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [3, 3, 0] },
    ],
    examPoint:
      '新造船は中国(5割)・韓国(3割)・日本(1.4割)の日中韓3国で9割超を寡占。二輪車はインド・中国・インドネシア等アジア中心。四輪車は中国・米国・日本・インドが大きい。',
  },
];

interface ManualComparisonChartConfig {
  title: string;
  unit: string;
  sameUnitAcrossCols: boolean;
  colLabels: string[];
  diagonalCols?: { xCol: number; yCol: number; label: string };
}

const MANUAL_COMPARISON_CHART_MAP: Record<string, ManualComparisonChartConfig> = {
  cmp_power_mix: {
    title: '主要国の発電電力量構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: [
      '石炭火力の発電割合',
      '石油・ガス火力の割合',
      '原子力の発電割合',
      '水力の発電割合',
      '太陽光・風力等の割合',
    ],
  },
  cmp_sector_share: {
    title: '主要国の産業別就業人口構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['第1次産業の就業率', '第2次産業の就業率', '第3次産業の就業率'],
  },
  cmp_export_mix: {
    title: '主要国の輸出品目構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: [
      '機械・輸送機等の輸出割合',
      'その他工業品の輸出割合',
      '燃料・鉱産資源の輸出割合',
      '農林水産・食料品の輸出割合',
    ],
  },
  cmp_age_structure: {
    title: '主要国の年齢3区分別人口構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['年少人口(0〜14歳)割合', '生産年齢人口(15〜64歳)割合', '老年人口(65歳以上)割合'],
  },
  cmp_meat_mix: {
    title: '主要国の食肉消費構成割合',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['牛肉・水牛肉の消費割合', '豚肉の消費割合', '鶏肉等家禽類の消費割合', '羊・山羊肉の消費割合'],
  },
  cmp_water_use_sector: {
    title: '主要国の用途別淡水取水割合',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['農業用水の取水割合', '工業用水の取水割合', '生活用水の取水割合'],
  },
  cmp_renewable_breakdown: {
    title: '再生可能エネルギー発電の内訳構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['水力の発電内訳割合', '風力の発電内訳割合', '太陽光の発電内訳割合', '地熱・バイオ等の割合'],
  },
  cmp_trade_balance_major: {
    title: '主要国の商品輸出額・輸入額',
    unit: '十億USD',
    sameUnitAcrossCols: true,
    colLabels: ['商品輸出額', '商品輸入額'],
    diagonalCols: { xCol: 0, yCol: 1, label: '輸出＝輸入' },
  },
  cmp_grain_export_import: {
    title: '主要国の小麦・トウモロコシ純輸出入量',
    unit: '百万t（＋輸出超 / －輸入超）',
    sameUnitAcrossCols: true,
    colLabels: ['小麦の純輸出入量', 'トウモロコシの純輸出入量'],
  },
  cmp_religion_livestock: {
    title: '主要国の家畜種別頭数構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['牛・水牛の頭数割合', '豚の頭数割合', '羊の頭数割合', 'ヤギの頭数割合'],
  },
  cmp_primate_vs_polycentric: {
    title: '第1位都市圏と第2位都市圏の人口規模',
    unit: '万人',
    sameUnitAcrossCols: true,
    colLabels: ['第1位都市圏の人口', '第2位都市圏の人口'],
  },
  cmp_asian_nie_shift: {
    title: 'アジア諸国等の輸出品目構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: [
      '機械・電子・輸送機の輸出割合',
      '衣類・繊維・軽工業品の輸出割合',
      '鉱産・燃料・金属資源の輸出割合',
      '農林水産・化学等の輸出割合',
    ],
  },
  cmp_energy_special_nations: {
    title: '特徴的な発電電力量構成比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: [
      '水力の発電割合',
      '地熱・風力・太陽光等の割合',
      '原子力の発電割合',
      '石炭・石油火力の割合',
      '天然ガス火力の割合',
    ],
  },
};

export interface ManualRankingLabelSpec {
  label: string;
  unit: string;
}

/**
 * world_rankings_v1.json 用の100%手動定義ラベル辞書
 */
export const MANUAL_RANKING_METRIC_LABELS: Record<
  string,
  { primary?: ManualRankingLabelSpec; secondary?: ManualRankingLabelSpec }
> = {
  ag_wheat: {
    primary: { label: '小麦の生産量', unit: '万t' },
    secondary: { label: '小麦の輸出量', unit: '万t' },
  },
  ag_rice: {
    primary: { label: '米（籾換算）の生産量', unit: '万t' },
    secondary: { label: '米（精米換算）の輸出量', unit: '万t' },
  },
  ag_maize: {
    primary: { label: 'トウモロコシの生産量', unit: '万t' },
    secondary: { label: 'トウモロコシの輸出量', unit: '万t' },
  },
  ag_soybean: {
    primary: { label: '大豆の生産量', unit: '万t' },
    secondary: { label: '大豆の輸出量', unit: '万t' },
  },
  ag_potato_cassava: {
    primary: { label: 'じゃがいもの生産量', unit: '万t' },
    secondary: { label: 'キャッサバの生産量', unit: '万t' },
  },
  ag_coffee: {
    primary: { label: 'コーヒー豆の生産量', unit: '万t' },
  },
  ag_cacao: {
    primary: { label: 'カカオ豆の生産量', unit: '万t' },
  },
  ag_tea: {
    primary: { label: '茶の生産量', unit: '万t' },
    secondary: { label: '茶の輸出量', unit: '万t' },
  },
  ag_cotton: {
    primary: { label: '綿花の生産量', unit: '万t' },
    secondary: { label: '綿花の輸出量', unit: '万t' },
  },
  ag_rubber: {
    primary: { label: '天然ゴムの生産量', unit: '万t' },
  },
  ag_palmoil: {
    primary: { label: 'パーム油の生産量', unit: '万t' },
  },
  ag_olive_grape: {
    primary: { label: 'オリーブの生産量', unit: '万t' },
    secondary: { label: 'ワインの生産量', unit: '万hL' },
  },
  ag_livestock: {
    primary: { label: '牛肉の生産量', unit: '万t' },
    secondary: { label: '豚肉の生産量', unit: '万t' },
  },
  ag_fishery_forestry: {
    primary: { label: '海面天然漁獲量', unit: '万t' },
    secondary: { label: '水産養殖の生産量', unit: '万t' },
  },
  res_oil: {
    primary: { label: '原油の産出量', unit: '万バレル/日' },
  },
  res_gas: {
    primary: { label: '天然ガスの産出量', unit: '億m³' },
    secondary: { label: 'LNGの世界輸出シェア', unit: '%' },
  },
  res_coal: {
    primary: { label: '石炭の産出量', unit: '億t' },
    secondary: { label: '石炭の世界輸出シェア', unit: '%' },
  },
  res_iron: {
    primary: { label: '鉄鉱石（粗鉱）の産出量', unit: '万t' },
  },
  res_copper: {
    primary: { label: '銅鉱（銅含有量）の産出量', unit: '万t' },
  },
  res_bauxite_al: {
    primary: { label: 'ボーキサイトの産出量', unit: '万t' },
    secondary: { label: 'アルミニウム新地金の精錬量', unit: '万t' },
  },
  res_precious: {
    primary: { label: '金の産出量', unit: 't' },
    secondary: { label: 'ダイヤモンドの世界産出シェア', unit: '%' },
  },
  res_energy_per_cap: {
    primary: { label: '1人当たり一次エネルギー消費量', unit: 'GJ/人' },
  },
  res_renewable_growth: {
    primary: { label: '風力・太陽光の発電量', unit: 'TWh' },
  },
  res_water: {
    primary: { label: '再生可能水資源総量', unit: '千km³/年' },
  },
  ind_auto: {
    primary: { label: '自動車の生産台数', unit: '万台' },
  },
  ind_steel: {
    primary: { label: '粗鋼の生産量', unit: '万t' },
  },
  ind_textile: {
    primary: { label: '衣料品の輸出額', unit: '億USD' },
  },
  ind_ship_plane: {
    primary: { label: '新造船竣工量の世界シェア', unit: '%' },
  },
  ind_tourism: {
    primary: { label: '外国人観光客の到着数', unit: '万人/年' },
  },
  ind_migration: {
    primary: { label: '外国人・移民の居住割合', unit: '%' },
    secondary: { label: '出稼ぎ個人送金受取の対GDP比', unit: '%' },
  },
  ind_refugee: {
    primary: { label: '難民・避難民の受入人数', unit: '万人' },
  },
  ind_fertility: {
    primary: { label: '合計特殊出生率', unit: '人/女性1人' },
  },
  ind_aging: {
    primary: { label: '老年人口（65歳以上）割合', unit: '%' },
  },
  ag_sugar: {
    primary: { label: 'さとうきびの生産量', unit: '万t' },
    secondary: { label: 'てんさいの生産量', unit: '万t' },
  },
  ag_fruits: {
    primary: { label: 'バナナの輸出量', unit: '万t' },
    secondary: { label: 'ぶどうの生産量', unit: '万t' },
  },
  ag_sheep_beef: {
    primary: { label: '羊の飼育頭数', unit: '万頭' },
    secondary: { label: '牛肉・水牛肉の輸出量', unit: '万t' },
  },
  ag_timber_pulp: {
    primary: { label: '丸太の総生産量', unit: '百万m³' },
    secondary: { label: '木材パルプの輸出量', unit: '万t' },
  },
  res_uranium_nuclear: {
    primary: { label: 'ウランの産出量', unit: 'tU' },
    secondary: { label: '原子力の発電量', unit: '億kWh' },
  },
  res_lithium_cobalt: {
    primary: { label: 'リチウムの生産量', unit: '千t' },
    secondary: { label: 'コバルトの生産量', unit: '千t' },
  },
  res_renewable_ratio: {
    primary: { label: '再生可能エネルギーの発電割合', unit: '%' },
  },
  res_oil_reserves: {
    primary: { label: '原油の確認埋蔵量', unit: '億バレル' },
  },
  ind_robotics_machine: {
    primary: { label: '産業用ロボットの年間新規導入台数', unit: '万台' },
  },
  ind_ports_ships: {
    primary: { label: 'コンテナ港湾の取扱量', unit: '百万TEU' },
    secondary: { label: '商船の登録船腹量', unit: '百万総トン' },
  },
  ind_ict_service: {
    primary: { label: 'ICT・デジタルサービスの輸出額', unit: '十億USD' },
  },
  soc_urban_rate: {
    primary: { label: '都市人口率', unit: '%' },
  },
  soc_gdp_per_capita: {
    primary: { label: '1人当たり名目GDP', unit: '千USD/人' },
  },
  soc_meat_fish: {
    primary: { label: '1人当たり年間食肉供給量', unit: 'kg/人・年' },
    secondary: { label: '1人当たり年間魚介類供給量', unit: 'kg/人・年' },
  },
  soc_gender_literacy: {
    primary: { label: '15歳以上女性労働力率', unit: '%' },
  },
  soc_internet_mobile: {
    primary: { label: 'インターネット人口普及率', unit: '%' },
  },
  ag_barley_rye: {
    primary: { label: '大麦の生産量', unit: '万t' },
    secondary: { label: 'ライ麦の生産量', unit: '万t' },
  },
  ag_rapeseed_sunflower: {
    primary: { label: '菜種（ナタネ）の生産量', unit: '万t' },
    secondary: { label: 'ひまわり種子の生産量', unit: '万t' },
  },
  ag_potato_sweet: {
    secondary: { label: 'さつまいもの生産量', unit: '万t' },
  },
  ag_citrus_apple: {
    primary: { label: 'オレンジの生産量', unit: '万t' },
    secondary: { label: 'りんごの生産量', unit: '万t' },
  },
  ag_milk_dairy: {
    primary: { label: '生乳（牛・水牛）の生産量', unit: '万t' },
    secondary: { label: '乳製品（チーズ・全粉乳等）の輸出量', unit: '万t' },
  },
  ag_poultry_egg: {
    primary: { label: '鶏肉の輸出量', unit: '万t' },
    secondary: { label: '鶏肉の生産量', unit: '万t' },
  },
  ag_food_self_suff: {
    primary: { label: 'カロリーベース食料自給率', unit: '%' },
  },
  res_nickel_tin: {
    primary: { label: 'ニッケル鉱の産出量', unit: '万t' },
    secondary: { label: 'すず鉱の産出量', unit: '千t' },
  },
  res_zinc_lead: {
    primary: { label: '亜鉛鉱の産出量', unit: '万t' },
  },
  res_platinum_chrome: {
    primary: { label: 'プラチナの世界産出シェア', unit: '%' },
    secondary: { label: 'クロム鉱の世界産出シェア', unit: '%' },
  },
  res_silver_phosphate: {
    primary: { label: '銀の産出量', unit: 't' },
    secondary: { label: 'リン鉱石の産出量', unit: '万t' },
  },
  res_rare_earth: {
    primary: { label: '希土類（レアアース）の産出量', unit: '万t' },
  },
  res_energy_self_suff: {
    primary: { label: '一次エネルギー自給率', unit: '%' },
  },
  res_hydro_geothermal: {
    primary: { label: '水力の発電量', unit: '億kWh' },
    secondary: { label: '地熱発電の設備容量', unit: '万kW' },
  },
  res_nuclear_share: {
    primary: { label: '原子力の発電割合', unit: '%' },
  },
  ind_cement_chem: {
    primary: { label: 'セメントの生産量', unit: '百万t' },
  },
  ind_paper_pulp: {
    primary: { label: '紙・板紙の生産量', unit: '万t' },
  },
  ind_ev_battery: {
    primary: { label: 'EVの世界生産シェア', unit: '%' },
    secondary: { label: '国内新車販売におけるEV比率', unit: '%' },
  },
  ind_solar_wind_mfg: {
    primary: { label: '太陽光パネルの世界製造能力シェア', unit: '%' },
  },
  ind_pharma_watch: {
    primary: { label: '医薬品の輸出額', unit: '十億USD' },
  },
  ind_gdp_nominal_ppp: {
    primary: { label: '名目GDP総額', unit: '兆USD' },
    secondary: { label: '購買力平価（PPP）GDP総額', unit: '兆国際$' },
  },
  ind_aviation_rail: {
    primary: { label: '高速鉄道の営業延長距離', unit: '千km' },
  },
  soc_higher_edu: {
    primary: { label: '研究開発費（R&D）の対GDP比', unit: '%' },
  },
  soc_forest_ratio: {
    primary: { label: '国土面積に占める森林面積率', unit: '%' },
  },
  soc_forest_change: {
    primary: { label: '年間森林面積の増加量', unit: '万ha/年' },
    secondary: { label: '年間森林面積の減少量', unit: '万ha/年' },
  },
  soc_oda_donors: {
    primary: { label: 'ODA（政府開発援助）の拠出総額', unit: '十億USD' },
    secondary: { label: 'ODA拠出額の対GNI比', unit: '%' },
  },
  soc_tourism_revenue: {
    primary: { label: '国際観光収入（受入額）', unit: '十億USD' },
    secondary: { label: '観光関連産業の対GDP寄与率', unit: '%' },
  },
  soc_waste_water_stress: {
    primary: { label: '年間淡水取水率（水ストレス）', unit: '%' },
  },
  ag_wheat_exports: {
    secondary: { label: '小麦の輸入量', unit: '万t' },
  },
  ag_maize_exports: {
    secondary: { label: 'トウモロコシの輸入量', unit: '万t' },
  },
  ag_rice_exports: {
    secondary: { label: '米（精米換算）の輸入量', unit: '万t' },
  },
  ag_soybean_trade: {
    primary: { label: '大豆の輸入量', unit: '万t' },
  },
  ag_banana_prod_vs_exp: {
    primary: { label: 'バナナの生産量', unit: '万t' },
  },
  ag_tomato: {
    primary: { label: 'トマトの生産量', unit: '万t' },
    secondary: { label: '生鮮トマトの輸出量', unit: '万t' },
  },
  ag_peanut: {
    primary: { label: '落花生の生産量', unit: '万t' },
  },
  ag_cattle_head: {
    primary: { label: '牛の飼育頭数', unit: '万頭' },
  },
  ag_pig_head: {
    primary: { label: '豚の飼育頭数', unit: '万頭' },
  },
  ag_sheep_goat_buffalo: {
    secondary: { label: '水牛の飼育頭数', unit: '万頭' },
  },
  ag_wool_prod: {
    primary: { label: '羊毛（原毛）の生産量', unit: '万t' },
  },
  ag_salmon_shrimp_aquaculture: {
    primary: { label: 'サケ・マス類の養殖生産量', unit: '万t' },
    secondary: { label: 'エビ類の養殖輸出量', unit: '万t' },
  },
  res_oil_exports_imports: {
    primary: { label: '原油の輸出量', unit: '百万t/年' },
    secondary: { label: '原油の輸入量', unit: '百万t/年' },
  },
  res_coal_exports_imports: {
    primary: { label: '石炭の輸出量', unit: '百万t/年' },
    secondary: { label: '石炭の輸入量', unit: '百万t/年' },
  },
  res_lng_pipeline_exports: {
    primary: { label: 'LNG（液化天然ガス）の輸出量', unit: '百万t' },
  },
  res_diamond_prod: {
    primary: { label: 'ダイヤモンドの産出量', unit: '万カラット/年' },
  },
  res_manganese_chrome: {
    primary: { label: 'マンガン鉱の産出量', unit: '万t' },
    secondary: { label: 'クロム鉱の産出量', unit: '万t' },
  },
  res_tungsten_tin: {
    secondary: { label: 'タングステン鉱の産出量', unit: '万t' },
  },
  res_wind_power_share: {
    primary: { label: '風力の発電割合', unit: '%' },
  },
  res_hydro_power_share: {
    primary: { label: '水力の発電割合', unit: '%' },
  },
  ind_synthetic_fiber: {
    primary: { label: '合成繊維の生産量', unit: '万t' },
  },
  ind_motorcycle_prod: {
    primary: { label: '二輪車の生産・販売台数', unit: '万台/年' },
  },
  ind_wine_prod: {
    primary: { label: 'ワインの生産量', unit: '百万L' },
  },
  ind_beer_prod: {
    primary: { label: 'ビールの総生産量', unit: '万kL' },
    secondary: { label: '1人当たり年間ビール消費量', unit: 'L/人・年' },
  },
  ind_hub_airports_passenger: {
    primary: { label: '国際線の旅客数', unit: '万人/年' },
  },
  ind_air_cargo_hub: {
    primary: { label: '国際航空貨物の取扱量', unit: '万t/年' },
  },
  ind_steel_exports_ratio: {
    primary: { label: '鉄鋼製品の輸出量', unit: '万t/年' },
    secondary: { label: '鉄鋼製品の輸入量', unit: '万t/年' },
  },
  soc_primate_city_ratio: {
    primary: { label: '第1位都市圏の人口集中率', unit: '%' },
  },
  soc_remittances: {
    primary: { label: '出稼ぎ個人送金の受取総額', unit: '億USD' },
  },
  soc_female_parliament: {
    primary: { label: '女性国会議員比率', unit: '%' },
  },
  soc_physicians_per1k: {
    primary: { label: '人口1,000人当たり医師数', unit: '人/1,000人' },
  },
  soc_co2_total_vs_percap: {
    primary: { label: 'CO₂の総排出量', unit: '億t' },
    secondary: { label: '1人当たり年間CO₂排出量', unit: 't/人・年' },
  },
  soc_hdi_extreme: {
    primary: { label: '人間開発指数（HDI）', unit: '指数' },
  },
  soc_world_heritage: {
    primary: { label: '世界遺産の登録件数', unit: '件' },
  },
};

/**
 * 項目当て「上位実績3指標比較」用の同テーマ・紛らわしい3指標セット（22組）
 */
export const CURATED_ITEM_TRIOS: [string, string, string][] = [
  ['小麦の生産量', '小麦の輸出量', '小麦の輸入量'],
  ['米（籾換算）の生産量', '米（精米換算）の輸出量', '米（精米換算）の輸入量'],
  ['小麦の輸出量', '米（精米換算）の輸出量', 'トウモロコシの輸出量'],
  ['小麦の生産量', 'トウモロコシの生産量', '大豆の生産量'],
  ['大豆の生産量', '大豆の輸出量', '大豆の輸入量'],
  ['じゃがいもの生産量', 'キャッサバの生産量', 'さつまいもの生産量'],
  ['さとうきびの生産量', 'てんさいの生産量', '綿花の生産量'],
  ['コーヒー豆の生産量', 'カカオ豆の生産量', '茶の生産量'],
  ['茶の生産量', '茶の輸出量', '天然ゴムの生産量'],
  ['パーム油の生産量', 'オリーブの生産量', '菜種（ナタネ）の生産量'],
  ['牛の飼育頭数', '豚の飼育頭数', '羊の飼育頭数'],
  ['牛肉・水牛肉の輸出量', '鶏肉の輸出量', '生乳（牛・水牛）の生産量'],
  ['海面天然漁獲量', '水産養殖の生産量', 'サケ・マス類の養殖生産量'],
  ['丸太の総生産量', '木材パルプの輸出量', '紙・板紙の生産量'],
  ['ボーキサイトの産出量', 'アルミニウム新地金の精錬量', '鉄鉱石（粗鉱）の産出量'],
  ['銅鉱（銅含有量）の産出量', 'ニッケル鉱の産出量', 'リチウムの生産量'],
  ['金の産出量', '銀の産出量', 'ダイヤモンドの産出量'],
  ['原油の輸出量', '石炭の輸出量', 'LNG（液化天然ガス）の輸出量'],
  ['原油の産出量', '天然ガスの産出量', '石炭の産出量'],
  ['水力の発電割合', '風力の発電割合', '原子力の発電割合'],
  ['自動車の生産台数', '粗鋼の生産量', '二輪車の生産・販売台数'],
  ['外国人・移民の居住割合', '出稼ぎ個人送金受取の対GDP比', '合計特殊出生率'],
];

/**
 * 共通テスト形式「気候比較コホート」（16組：同一国・同緯度・南北対比・高地対比）
 */
export interface ClimateCohortSpec {
  theme: string;
  cityIds: [string, string, string, string];
  examPoint: string;
}

export const CLIMATE_COHORT_SPECS: ClimateCohortSpec[] = [
  {
    theme: 'オーストラリアの異なる気候帯（北部・中部・南西部・南東部）',
    cityIds: ['AUS_DARWIN', 'AUS_ALICE', 'AUS_PERTH', 'AUS_SYDNEY'],
    examPoint:
      'サバナ気候Aw（ダーウィン＝1月夏に極端な雨季）、砂漠BW（アリススプリングス＝年間極少雨）、地中海性Cs（パース＝夏1月少雨・冬7月多雨）、温暖湿潤Cfa（シドニー＝通年降水・夏高温）。',
  },
  {
    theme: 'アメリカ合衆国の東西・南北気候対比',
    cityIds: ['USA_SF', 'USA_PHOENIX', 'USA_CHICAGO', 'USA_NYC'],
    examPoint:
      '地中海性Cs（サンフランシスコ＝夏少雨・寒流で夏涼しい）、砂漠BW（フェニックス＝極めて高温少雨）、冷帯Df（シカゴ＝冬氷点下で年較差大）、温暖湿潤Cfa（ニューヨーク＝通年適度な降水量）。',
  },
  {
    theme: '中国の沿岸〜内陸〜高地の気候対比',
    cityIds: ['CHN_GUANGZHOU', 'CHN_SHANGHAI', 'CHN_BEIJING', 'CHN_URUMQI'],
    examPoint:
      '温帯冬季少雨Cw（広州＝最寒月13℃前後・夏多雨）、温暖湿潤Cfa（上海＝夏多雨・冬温和）、冷帯冬季少雨Dw（北京＝冬0℃以下・夏集中豪雨）、ステップBS（ウルムチ＝極端な大陸性較差・年降水300mm未満）。',
  },
  {
    theme: 'ヨーロッパ東西〜南北の海洋性・大陸性・地中海性比較',
    cityIds: ['NOR_BERGEN', 'GBR_LONDON', 'ITA_ROME', 'UKR_KYIV'],
    examPoint:
      '西岸海洋性Cfb多雨（ベルゲン＝年2,000mm超・暖流効果）、西岸海洋性Cfb標準（ロンドン＝年600mm均等）、地中海性Cs（ローマ＝夏極乾燥・冬雨）、冷帯Df（キーウ＝1月-5℃・夏やや多雨）。',
  },
  {
    theme: '同緯度・大洋東岸（西岸）と西岸（東岸）や高緯度寒暖比較',
    cityIds: ['NOR_BERGEN', 'SWE_STOCKHOLM', 'RUS_YAKUTSK', 'ESP_MADRID'],
    examPoint:
      'ノルウェー西岸（ベルゲン＝冬不凍・多雨）、バルト海沿岸（ストックホルム＝やや冬寒冷）、内陸シベリア（ヤクーツク＝1月-38℃・年較差60℃近く）、イベリア半島内陸（マドリード＝夏乾燥・冬やや寒冷）。',
  },
  {
    theme: '南半球の中低緯度比較（西岸砂漠・東岸湿潤・Cs・高原）',
    cityIds: ['NAM_WALVIS', 'ZAF_CAPETOWN', 'ZAF_JHB', 'ARG_BA'],
    examPoint:
      'ナミビア海岸砂漠BW（ワルビスベイ＝年降水極少・冷涼）、ケープタウンCs（南半球のため6〜8月多雨・1月乾燥）、高原Cw（ヨハネスブルグ＝夏多雨・冬乾季・標高1750mで涼しい）、パンパCfa（ブエノスアイレス＝通年降水・温和）。',
  },
  {
    theme: '南アメリカの低地熱帯・寒流海岸砂漠・高地・温帯比較',
    cityIds: ['BRA_MANAUS', 'PER_LIMA', 'BOL_LAPAZ', 'CHL_SANTIAGO'],
    examPoint:
      'アマゾン熱帯雨林Af（マナウス＝年中26〜28℃・年降水2000mm超）、寒流海岸砂漠BW（リマ＝年降水10mm台）、アンデス高山ET/CW（ラパス＝年中気温10℃前後・夏雨冬乾）、南米西岸Cs（サンティアゴ＝南半球の冬6〜8月多雨）。',
  },
  {
    theme: '赤道〜低緯度付近の低地・高山・モンスーン対比',
    cityIds: ['SGP_SINGAPORE', 'KEN_NAIROBI', 'COL_BOGOTA', 'EGY_CAIRO'],
    examPoint:
      'シンガポールAf（年中27℃・通年多雨）、ケニア高原Cw（ナイロビ＝赤道直下だが標高1660mで年平均18℃・乾季あり）、アンデス常春Cfb（ボゴタ＝標高2550mで年中13〜14℃）、サハラ北縁BW（カイロ＝夏季30℃超・年間極少雨）。',
  },
  {
    theme: '日本・東アジアの季節風と日本海側・太平洋側・亜寒帯比較',
    cityIds: ['JPN_NAHA', 'JPN_TOKYO', 'JPN_KANAZAWA', 'JPN_SAPPORO'],
    examPoint:
      '那覇（冬季も17℃前後・年降水2000mm超）、東京（太平洋側＝冬少雨・夏〜秋多雨）、金沢（日本海側＝12〜1月冬季降水量ピーク）、札幌（冷帯Df＝1月氷点下）。',
  },
  {
    theme: 'ユーラシアの熱帯モンスーン〜乾燥ステップ〜地中海対比',
    cityIds: ['IND_MUMBAI', 'IND_DELHI', 'PAK_KARACHI', 'TUR_ISTANBUL'],
    examPoint:
      'ムンバイAw/Am（6〜8月に1ヶ月600mm以上の極端な南西モンスーン集中雨季）、デリーBS〜Cw（内陸で年較差拡大・夏雨）、カラチBW（インダス河口で年200mm前後の乾燥）、イスタンブールCs（冬多雨・夏乾燥・温和）。',
  },
  {
    theme: '東南アジア〜南アジア〜西アジアの乾湿コントラスト',
    cityIds: ['MYS_KL', 'THA_BANGKOK', 'SAU_RIYADH', 'VNM_HANOI'],
    examPoint:
      'クアラルンプールAf（赤道近く年中多雨27℃）、バンコクAw（夏雨季・12〜2月明確な乾季）、リヤドBW（夏35℃超・年間極乾燥）、ハノイCw（冬16℃前後まで下がり明確な季節差＋夏多雨）。',
  },
  {
    theme: '北米・中南米の高地都市・砂漠・温帯・冷帯比較',
    cityIds: ['CAN_TORONTO', 'MEX_CITY', 'USA_MIAMI', 'BRA_BRASILIA'],
    examPoint:
      'トロントDf（1月氷点下・年較差大）、メキシコシティCw（標高2240mで夏20℃未満の常春・夏雨冬乾）、マイアミAm（年中温暖〜暑熱・夏秋極多雨）、ブラジリアAw（南半球の1月夏雨季・7月冬乾季）。',
  },
];

/**
 * 人口ピラミッド判別用の5大類型・厳選32カ国
 */
export const PYRAMID_COHORT_ARCHETYPES: { groupLabel: string; iso3s: string[] }[] = [
  {
    groupLabel: '富士山型（多産・若年人口極めて厚い）',
    iso3s: ['NGA', 'KEN', 'ETH', 'COD', 'TZA', 'AFG', 'CIV'],
  },
  {
    groupLabel: '釣鐘〜人口ボーナス期（出生率低下途上・生産年齢拡大）',
    iso3s: ['MAR', 'DZA', 'KHM', 'NPL', 'MEX', 'BRA', 'PER'],
  },
  {
    groupLabel: '先進国・緩やか移行型（出生率1.4〜1.6台・高齢層厚い）',
    iso3s: ['USA', 'FRA', 'GBR', 'AUS', 'NZL', 'SWE', 'NOR'],
  },
  {
    groupLabel: '超少子高齢・つぼ型（少子化顕著・65歳以上高割合）',
    iso3s: ['JPN', 'KOR', 'DEU', 'ITA', 'ESP', 'POL', 'UKR'],
  },
  {
    groupLabel: '湾岸産油国型（20〜40代男性の極端な超過）',
    iso3s: ['QAT', 'ARE', 'SAU', 'KWT', 'OMN'],
  },
];

export interface ManualSliderQuizSpec {
  id: string;
  mode: 'country' | 'metric';
  promptSubject: string;
  answerLabel: string;
  choicesPool: string[];
}

export const MANUAL_SLIDER_QUIZ_SPECS: Record<string, ManualSliderQuizSpec> = {
  ts_kor_export_mix: {
    id: 'ts_kor_export_mix',
    mode: 'country',
    promptSubject: '輸出品目構成比の推移（%）',
    answerLabel: '韓国',
    choicesPool: ['韓国', 'マレーシア', '中国', 'ブラジル', '日本', 'ベトナム'],
  },
  ts_mys_export_shift: {
    id: 'ts_mys_export_shift',
    mode: 'country',
    promptSubject: '輸出品目構成比の推移（%）',
    answerLabel: 'マレーシア',
    choicesPool: ['マレーシア', '韓国', '中国', 'ブラジル', 'タイ', 'インドネシア'],
  },
  ts_chn_export_upgrade: {
    id: 'ts_chn_export_upgrade',
    mode: 'country',
    promptSubject: '輸出品目構成比の推移（%）',
    answerLabel: '中国',
    choicesPool: ['中国', '韓国', 'マレーシア', 'ブラジル', 'タイ', 'インド'],
  },
  ts_bra_export_shift: {
    id: 'ts_bra_export_shift',
    mode: 'country',
    promptSubject: '輸出品目構成比の推移（%）',
    answerLabel: 'ブラジル',
    choicesPool: ['ブラジル', 'オーストラリア', 'マレーシア', '韓国', '中国', 'アルゼンチン'],
  },
  ts_jpn_power_mix: {
    id: 'ts_jpn_power_mix',
    mode: 'country',
    promptSubject: '発電電力量構成比の推移（%）',
    answerLabel: '日本',
    choicesPool: ['日本', 'ドイツ', 'フランス', 'イギリス', 'アメリカ合衆国', '韓国'],
  },
  ts_deu_power_mix: {
    id: 'ts_deu_power_mix',
    mode: 'country',
    promptSubject: '発電電力量構成比の推移（%）',
    answerLabel: 'ドイツ',
    choicesPool: ['ドイツ', 'フランス', 'イギリス', '日本', 'アメリカ合衆国', 'ポーランド'],
  },
  ts_fra_power_mix: {
    id: 'ts_fra_power_mix',
    mode: 'country',
    promptSubject: '発電電力量構成比の推移（%）',
    answerLabel: 'フランス',
    choicesPool: ['フランス', 'ドイツ', 'イギリス', '日本', 'アメリカ合衆国', 'ノルウェー'],
  },
  ts_gbr_power_mix: {
    id: 'ts_gbr_power_mix',
    mode: 'country',
    promptSubject: '発電電力量構成比の推移（%）',
    answerLabel: 'イギリス',
    choicesPool: ['イギリス', 'ドイツ', 'フランス', '日本', 'アメリカ合衆国', 'デンマーク'],
  },
  ts_usa_power_mix: {
    id: 'ts_usa_power_mix',
    mode: 'country',
    promptSubject: '発電電力量構成比の推移（%）',
    answerLabel: 'アメリカ合衆国',
    choicesPool: ['アメリカ合衆国', 'ドイツ', 'フランス', 'イギリス', '日本', 'ロシア'],
  },
  ts_coffee_producers: {
    id: 'ts_coffee_producers',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: 'コーヒー豆の生産量',
    choicesPool: ['コーヒー豆の生産量', 'カカオ豆の生産量', '天然ゴムの生産量', '大豆の生産量', '茶の生産量'],
  },
  ts_soybean_producers: {
    id: 'ts_soybean_producers',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '大豆の生産量',
    choicesPool: ['大豆の生産量', '小麦の生産量', 'コーヒー豆の生産量', 'トウモロコシの生産量', 'さとうきびの生産量'],
  },
  ts_fishery_shift: {
    id: 'ts_fishery_shift',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '漁業・水産養殖の生産量',
    choicesPool: ['漁業・水産養殖の生産量', '米（籾換算）の生産量', '丸太の総生産量', '粗鋼の生産量', '豚肉の生産量'],
  },
  ts_oil_production_shift: {
    id: 'ts_oil_production_shift',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '原油の産出量',
    choicesPool: ['原油の産出量', '石炭の産出量', '天然ガスの産出量', '鉄鉱石の産出量', '銅鉱の産出量'],
  },
  ts_crude_steel_shift: {
    id: 'ts_crude_steel_shift',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '粗鋼の生産量',
    choicesPool: ['粗鋼の生産量', 'アルミニウム新地金の精錬量', '自動車の生産台数', '石炭の産出量', 'セメントの生産量'],
  },
  ts_auto_production: {
    id: 'ts_auto_production',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '自動車の生産台数',
    choicesPool: ['自動車の生産台数', '粗鋼の生産量', '新造船の竣工量', '二輪車の生産台数', '衣料品の輸出額'],
  },
  ts_world_top_population: {
    id: 'ts_world_top_population',
    mode: 'metric',
    promptSubject: '上位国の数値推移',
    answerLabel: '総人口',
    choicesPool: ['総人口', '都市人口', 'CO₂の総排出量', '名目GDP総額', '再生可能水資源総量'],
  },
  ts_tfr_transition: {
    id: 'ts_tfr_transition',
    mode: 'metric',
    promptSubject: '主要国の数値推移',
    answerLabel: '合計特殊出生率',
    choicesPool: ['合計特殊出生率', '1人当たり名目GDP（千USD）', '老年人口割合（%）', '乳児死亡率（‰）', '女性労働力率（%）'],
  },
  ts_urban_rate_regions: {
    id: 'ts_urban_rate_regions',
    mode: 'metric',
    promptSubject: '世界地域別の数値推移',
    answerLabel: '都市人口率',
    choicesPool: ['都市人口率', '第3次産業就業率', '15歳以上識字率', 'インターネット普及率', '合計特殊出生率（×10）'],
  },
  ts_apparel_flying_geese: {
    id: 'ts_apparel_flying_geese',
    mode: 'metric',
    promptSubject: '主要国・地域別の世界シェア推移',
    answerLabel: '衣料品・繊維製品の世界輸出シェア',
    choicesPool: [
      '衣料品・繊維製品の世界輸出シェア',
      '自動車の世界生産シェア',
      '半導体の世界製造シェア',
      '粗鋼の世界生産シェア',
      '原油の世界輸出シェア',
    ],
  },
  ts_semiconductor_shift: {
    id: 'ts_semiconductor_shift',
    mode: 'metric',
    promptSubject: '国・地域別の世界シェア推移',
    answerLabel: '半導体の世界製造能力シェア',
    choicesPool: [
      '半導体の世界製造能力シェア',
      '衣料品の世界輸出シェア',
      '粗鋼の世界生産シェア',
      '太陽光発電量の世界シェア',
      'LNGの世界輸出シェア',
    ],
  },
};

function cleanName(name: string): string {
  return name.split('（')[0].trim();
}

export function extractComparisonMatrices(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
): StatMatrixSpec[] {
  if (!worldRankings?.comparisonCharts) return [];
  const nameToIso = new Map<string, string>();
  for (const c of Object.values(countries)) {
    nameToIso.set(cleanName(c.nameJa), c.iso3);
  }

  const out: StatMatrixSpec[] = [];
  for (const ch of worldRankings.comparisonCharts) {
    const manual = MANUAL_COMPARISON_CHART_MAP[ch.id];
    if (!manual) continue;
    const cats = ch.categories;
    if (!cats || cats.length < 4 || ch.series.length !== manual.colLabels.length) continue;

    out.push({
      id: `cmp_${ch.id}`,
      title: manual.title,
      unit: manual.unit,
      sameUnitAcrossCols: manual.sameUnitAcrossCols,
      colLabels: manual.colLabels,
      diagonalCols: manual.diagonalCols,
      rows: cats.map((cat, ri) => {
        const cn = cleanName(cat);
        return {
          iso3: nameToIso.get(cn),
          countryName: cn,
          values: ch.series.map((s) => s.values[ri] ?? 0),
        };
      }),
      examPoint: ch.examPoint ?? ch.note ?? `${manual.title}の比較から国別特徴を読み取る。`,
    });
  }
  return out;
}

export function getAge60PlusPct(c: CountryData): number | null {
  const bins = c.stats?.agePyramid;
  if (!bins || bins.length < 6) return null;
  let sum = 0;
  for (const b of bins) {
    if (b.ageGroup.startsWith('60') || b.ageGroup.startsWith('70') || b.ageGroup.startsWith('80')) {
      sum += b.malePct + b.femalePct;
    }
  }
  return Number(sum.toFixed(1));
}

export function buildDynamicPercentCountryMatrix(
  countries: Record<string, CountryData>,
  scope: 'standard' | 'regional',
): StatMatrixSpec | null {
  const pool = Object.values(countries).filter((c) => {
    if (!EXAM_STANDARD_ISO3_SET.has(c.iso3) || c.isBasicEntry) return false;
    const st = c.stats;
    if (!st || st.population < 1_000_000) return false;
    if (st.femaleLaborPct == null || st.remittanceGdpPct == null) return false;
    if (getAge60PlusPct(c) == null) return false;
    return true;
  });

  if (pool.length < 6) return null;

  let chosenPool = pool;
  let title = '主要国の社会・産業・年齢構造指標（%）';

  if (scope === 'regional') {
    const cohorts = [...REGIONAL_COUNTRY_COHORTS].sort(() => Math.random() - 0.5);
    for (const coh of cohorts) {
      const sub = pool.filter((c) => coh.iso3s.includes(c.iso3));
      if (sub.length >= 4) {
        chosenPool = sub;
        title = `${coh.label}の社会・産業・年齢指標（%）`;
        break;
      }
    }
  }

  return {
    id: `dyn_pct_${scope}`,
    title,
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: [
      '都市人口率',
      '第1次産業就業率',
      '第3次産業就業率',
      '60歳以上人口割合',
      '15歳以上女性労働力率',
      '出稼ぎ個人送金受取の対GDP比',
    ],
    rows: chosenPool.map((c) => {
      const st = c.stats!;
      const age60 = getAge60PlusPct(c) ?? 0;
      return {
        iso3: c.iso3,
        countryName: cleanName(c.nameJa),
        values: [
          Number(st.urbanPopRatePct.toFixed(1)),
          Number(st.sectorShare.primaryPct.toFixed(1)),
          Number(st.sectorShare.tertiaryPct.toFixed(1)),
          age60,
          Number(st.femaleLaborPct!.toFixed(1)),
          Number(st.remittanceGdpPct!.toFixed(1)),
        ],
      };
    }),
    examPoint:
      '第1次産業就業率（農村主体か都市サービス主体か）、60歳以上人口割合（高齢化段階）、女性労働力率、個人送金対GDP比の組み合わせから発展段階と地域特徴を論理的に特定する。',
  };
}
