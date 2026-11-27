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
}

/**
 * 新課程共通テスト型の「統計数値→国」「統計数値→項目」「二重ブラインド」用の実数値マトリクス16表
 * 全16表は同一単位 (sameUnitAcrossCols: true) かつ上位国〜中堅国まで幅広く収録
 */
export const CURATED_STAT_MATRICES: StatMatrixSpec[] = [
  {
    id: 'mat_grains_prod',
    title: '主要国の主要穀物生産量',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['小麦', '米（籾）', 'トウモロコシ'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [137, 208, 289] },
      { iso3: 'IND', countryName: 'インド', values: [110, 206, 36] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [49, 10, 389] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [8, 10, 132] },
      { iso3: 'RUS', countryName: 'ロシア', values: [92, 1, 16] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [0, 54, 20] },
      { iso3: 'THA', countryName: 'タイ', values: [0, 33, 5] },
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
    colLabels: ['小麦輸出', '米輸出（精米）', 'トウモロコシ輸出', '大豆輸出'],
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
      '生産首位の中国は輸出リストにほぼ現れず（国内消費・純輸入）、米はインド・タイ・ベトナムが輸出上位、大豆・トウモロコシはブラジル・米国が突出し、小麦はロシア・豪・加・米が中心。',
  },
  {
    id: 'mat_tubers_prod',
    title: '主要国のイモ類生産量（気候帯・主食の違い）',
    unit: '百万t',
    sameUnitAcrossCols: true,
    colLabels: ['じゃがいも', 'キャッサバ', 'さつまいも'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [93, 5, 51] },
      { iso3: 'IND', countryName: 'インド', values: [60, 7, 1] },
      { iso3: 'NGA', countryName: 'ナイジェリア', values: [1, 63, 4] },
      { iso3: 'COD', countryName: 'コンゴ民主共和国', values: [0, 49, 0] },
      { iso3: 'UKR', countryName: 'ウクライナ', values: [21, 0, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [0, 31, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [4, 18, 1] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [12, 0, 0] },
    ],
    examPoint:
      'じゃがいもは温帯・冷涼気候（中国・インド・東欧/ロシア・ドイツ）、キャッサバは熱帯低緯度（ナイジェリア・コンゴ民・タイ・ブラジル）、さつまいもは温暖湿潤地域中心。',
  },
  {
    id: 'mat_beverage_percap',
    title: '主要国の嗜好飲料・主食 1人当たり年間消費量',
    unit: 'kg/人・年',
    sameUnitAcrossCols: true,
    colLabels: ['コーヒー', '茶', '米（精米換算）'],
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
      '1人あたりコーヒー消費は北欧（フィンランド約12kg）が突出、茶はトルコ（世界1位級）・イギリスが多い。米はインドネシア・中国・インド・日本が高く、欧米は極めて少ない。',
  },
  {
    id: 'mat_fruits_oils',
    title: '主要国の果樹・植物油脂生産量',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['パーム油', 'オリーブ生産', 'オレンジ', 'りんご'],
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
    colLabels: ['コーヒー豆', 'カカオ豆', '茶（製茶）', '天然ゴム'],
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
    id: 'mat_bauxite_al',
    title: 'アルミニウム原料と精錬生産の地域ギャップ',
    unit: '万t',
    sameUnitAcrossCols: true,
    colLabels: ['ボーキサイト産出', 'アルミナ（中間）', 'アルミニウム新地金'],
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
    colLabels: ['原油・NGL生産', '石炭生産', '天然ガス生産'],
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
    colLabels: ['原油輸出', '原油輸入', '石炭輸出', 'LNG輸出'],
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
    colLabels: ['鉄鉱石産出', '粗鋼生産', '鉄鋼製品輸出', '鉄鋼製品輸入'],
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
    colLabels: ['銅鉱石', 'ニッケル鉱', 'リチウム', 'コバルト'],
    rows: [
      { iso3: 'CHL', countryName: 'チリ', values: [24, 0, 24, 0] },
      { iso3: 'PER', countryName: 'ペルー', values: [12, 0, 0, 0] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [4, 52, 0, 8] },
      { iso3: 'PHL', countryName: 'フィリピン', values: [0, 11, 0, 1] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [4, 4, 47, 2] },
      { iso3: 'COD', countryName: 'コンゴ民主共和国', values: [11, 0, 0, 74] },
      { iso3: 'CHN', countryName: '中国', values: [8, 3, 18, 1] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [0, 0, 5, 0] },
    ],
    examPoint:
      '銅＝チリ・ペルー・コンゴ民、ニッケル＝インドネシア過半＋フィリピン、リチウム＝豪州＋リチウムトライアングル（チリ・アルゼンチン）＋中国、コバルト＝コンゴ民主共和国が世界7割超を独占。',
  },
  {
    id: 'mat_land_use',
    title: '主要国の国土利用割合',
    unit: '国土面積比 (%)',
    sameUnitAcrossCols: true,
    colLabels: ['森林面積率', '耕地・永年作物地率', '永久牧草・放牧地率'],
    rows: [
      { iso3: 'JPN', countryName: '日本', values: [68, 12, 2] },
      { iso3: 'FIN', countryName: 'フィンランド', values: [74, 7, 0] },
      { iso3: 'BRA', countryName: 'ブラジル', values: [59, 8, 21] },
      { iso3: 'IND', countryName: 'インド', values: [24, 57, 3] },
      { iso3: 'GBR', countryName: 'イギリス', values: [13, 25, 46] },
      { iso3: 'AUS', countryName: 'オーストラリア', values: [17, 4, 44] },
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [0, 2, 81] },
      { iso3: 'ARG', countryName: 'アルゼンチン', values: [10, 12, 40] },
      { iso3: 'EGY', countryName: 'エジプト', values: [0, 4, 0] },
      { iso3: 'UKR', countryName: 'ウクライナ', values: [17, 57, 13] },
    ],
    examPoint:
      '森林率高＝日本・フィンランド（約7割）・ブラジル（熱帯林6割）、耕地率高＝インド・ウクライナ（約6割）、牧草地率高＝豪州・英国・アルゼンチン・サウジ、エジプトはナイル川外はほぼ砂漠で農林計4%。',
  },
  {
    id: 'mat_tourism_balance',
    title: '主要国の国際観光収入と支出（国際観光収支）',
    unit: '十億USD',
    sameUnitAcrossCols: true,
    colLabels: ['国際観光収入（受入）', '国際観光支出（海外旅行）'],
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
      '南欧（スペイン・イタリア）やタイ・トルコ・近年の日本は観光収入が支出を大きく上回る大幅黒字。一方、寒冷・高所得で海外旅行熱の高いドイツ・英国・中国は大幅赤字（支出＞収入）。',
  },
  {
    id: 'mat_gender_labor',
    title: '各国の女性労働力率・産業構成・議会参画指標',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['女性労働力率（15歳+）', '第3次産業就業率', '女性国会議員比率'],
    rows: [
      { iso3: 'SWE', countryName: 'スウェーデン', values: [63, 81, 47] },
      { iso3: 'NOR', countryName: 'ノルウェー', values: [62, 79, 46] },
      { iso3: 'KHM', countryName: 'カンボジア', values: [73, 28, 13] },
      { iso3: 'VNM', countryName: 'ベトナム', values: [69, 39, 31] },
      { iso3: 'RWA', countryName: 'ルワンダ', values: [54, 34, 64] },
      { iso3: 'JPN', countryName: '日本', values: [55, 73, 16] },
      { iso3: 'KOR', countryName: '韓国', values: [56, 71, 20] },
      { iso3: 'EGY', countryName: 'エジプト', values: [16, 51, 28] },
      { iso3: 'PAK', countryName: 'パキスタン', values: [25, 38, 17] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [57, 79, 29] },
    ],
    examPoint:
      '女性労働力率は東南アジア・サハラ以南アフリカでも農村・軽工業労働を反映して高く（7割前後）、3次産業率は低め。北欧は3次産業率8割かつ議員比率も約半分と高い。イスラム圏（エジプト・パキスタン）は労働力率が低い。',
  },
  {
    id: 'mat_migration_remit',
    title: '国際人口移動・送金・都市人口率の対比',
    unit: '%',
    sameUnitAcrossCols: true,
    colLabels: ['外国人・移民比率', '個人送金受取（対GDP比）', '都市人口率'],
    rows: [
      { iso3: 'ARE', countryName: 'アラブ首長国連邦', values: [88, 0, 88] },
      { iso3: 'SGP', countryName: 'シンガポール', values: [43, 0, 100] },
      { iso3: 'SAU', countryName: 'サウジアラビア', values: [39, 0, 85] },
      { iso3: 'TJK', countryName: 'タジキスタン', values: [3, 48, 28] },
      { iso3: 'NPL', countryName: 'ネパール', values: [2, 27, 22] },
      { iso3: 'PHL', countryName: 'フィリピン', values: [0, 9, 48] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [1, 4, 82] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [19, 0, 78] },
      { iso3: 'JPN', countryName: '日本', values: [3, 0, 92] },
    ],
    examPoint:
      '中東産油国（UAE・サウジ）や都市国家（シンガポール）は外国人比率が4〜9割と極めて高く送金は送出側。タジキスタン・ネパールは都市率3割未満の農村国で海外出稼ぎ送金がGDPの3〜5割を支える。',
  },
  {
    id: 'mat_auto_ship_mfg',
    title: '輸送機械分野の世界生産シェア',
    unit: '世界生産シェア (%)',
    sameUnitAcrossCols: true,
    colLabels: ['四輪自動車生産', '二輪車生産・販売', '新造船竣工量'],
    rows: [
      { iso3: 'CHN', countryName: '中国', values: [32, 26, 50] },
      { iso3: 'IND', countryName: 'インド', values: [6, 30, 0] },
      { iso3: 'JPN', countryName: '日本', values: [10, 1, 14] },
      { iso3: 'KOR', countryName: '韓国', values: [4, 0, 29] },
      { iso3: 'USA', countryName: 'アメリカ合衆国', values: [11, 1, 0] },
      { iso3: 'DEU', countryName: 'ドイツ', values: [4, 0, 1] },
      { iso3: 'MEX', countryName: 'メキシコ', values: [4, 2, 0] },
      { iso3: 'THA', countryName: 'タイ', values: [2, 3, 0] },
      { iso3: 'IDN', countryName: 'インドネシア', values: [2, 10, 0] },
      { iso3: 'CZE', countryName: 'チェコ', values: [2, 0, 0] },
    ],
    examPoint:
      '新造船は中国(5割)・韓国(3割)・日本(1.4割)の日中韓3国で9割超を寡占。二輪車はインド・中国・インドネシア等アジア中心。四輪車は中国・米国・日本のほか、ニアショア基地メキシコや東欧（チェコ）も目立つ。',
  },
];

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
    if (ch.kind !== 'stacked_bar' && ch.kind !== 'grouped_bar') continue;
    const cats = ch.categories;
    if (!cats || cats.length < 4 || ch.series.length < 1) continue;
    if (cats.some((c) => /^\d{4}/.test(c) || c.includes('(粗鋼)'))) continue;

    // 1系列のみの grouped_bar (食料自給率・エネルギー自給率) も国→単数値比較には使えるが、列比較/二重ブラインドには2列以上が必要
    const sameUnitAcrossCols =
      ch.series.length >= 2 &&
      !ch.title.includes('歴史的変化') &&
      !ch.unit.includes(' / ');

    out.push({
      id: `cmp_${ch.id}`,
      title: ch.title.split('（')[0].trim(),
      unit: ch.unit,
      sameUnitAcrossCols,
      colLabels: ch.series.map((s) => s.name.split('（')[0].trim()),
      rows: cats.map((cat, ri) => {
        const cn = cleanName(cat);
        return {
          iso3: nameToIso.get(cn),
          countryName: cn,
          values: ch.series.map((s) => s.values[ri] ?? 0),
        };
      }),
      examPoint: ch.examPoint ?? ch.note ?? `${ch.title} の比較から国別特徴を読み取る。`,
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

function normalizeMacroRegion(region: string): string {
  if (region.includes('ヨーロッパ') || region.includes('ロシア')) return 'ヨーロッパ・旧ソ連圏';
  if (region.includes('アフリカ')) return 'アフリカ';
  if (region.includes('アメリカ') || region.includes('ラテン')) return '南北アメリカ';
  return 'アジア・大洋州';
}

/**
 * 全159カ国（詳細121＋基礎収録38、人口100万人以上）の同一単位（%）指標マトリクスを動的生成
 * 国当て・項目当て・二重ブラインドのいずれにも使用可能
 */
export function buildDynamicPercentCountryMatrix(
  countries: Record<string, CountryData>,
  scope: 'non_s' | 'regional',
): StatMatrixSpec | null {
  const pool = Object.values(countries).filter((c) => {
    const st = c.stats;
    if (!st || st.population < 1_000_000) return false;
    if (st.femaleLaborPct == null || st.remittanceGdpPct == null) return false;
    if (getAge60PlusPct(c) == null) return false;
    if (scope === 'non_s') return c.examSummary.rank !== 'S';
    return true;
  });

  if (pool.length < 6) return null;

  let chosenPool = pool;
  let title = '非上位・中堅国を含む人口・労働・送金指標（%）';

  if (scope === 'regional') {
    const byRegion = new Map<string, CountryData[]>();
    for (const c of pool) {
      const mr = normalizeMacroRegion(c.region);
      const list = byRegion.get(mr) ?? [];
      list.push(c);
      byRegion.set(mr, list);
    }
    const candidates = Array.from(byRegion.entries()).filter(([, list]) => list.length >= 6);
    if (candidates.length > 0) {
      const [mr, list] = candidates[Math.floor(Math.random() * candidates.length)];
      chosenPool = list;
      title = `${mr}諸国の社会・労働・年齢指標比較（%）`;
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
      '女性労働力率',
      '個人送金対GDP比',
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
      '1次産業率（農村主体か都市サービス主体か）、60歳以上割合（高齢化の進行度）、女性労働力率（文化・宗教圏と産業形態の差）、個人送金GDP比（出稼ぎ送出依存度）の組合せから識別する。',
  };
}
