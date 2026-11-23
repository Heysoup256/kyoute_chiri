import type {
  GeoLayerType,
  ImportanceRank,
  LayerVisibilityState,
  MapColorMode,
} from '../types/schema_v1';

/** 重要度ランク別の地図ポリゴン塗り色（ヒートマップ用） */
export const RANK_FILL_COLORS: Record<ImportanceRank | 'NONE', string> = {
  S: '#ef4444', // 赤: 最頻出
  A: '#f97316', // オレンジ: 頻出
  B: '#eab308', // 黄・アンバー: 重要
  C: '#14b8a6', // ティール: 基礎・標準
  NONE: '#cbd5e1', // 未収録
};

/** 重要度ランクの日本語ラベル */
export const RANK_LABELS: Record<ImportanceRank, string> = {
  S: 'S（最頻出）',
  A: 'A（頻出）',
  B: 'B（標準重要）',
  C: 'C（基礎）',
};

/** 重要度ランクのバッジスタイル */
export const RANK_BADGE_CLASSES: Record<ImportanceRank, string> = {
  S: 'bg-red-100 text-red-800 border-red-300',
  A: 'bg-orange-100 text-orange-800 border-orange-300',
  B: 'bg-amber-100 text-amber-800 border-amber-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
};

/** 自然・地形レイヤーの表示名と凡例カラー */
export const GEO_LAYER_META: Record<
  GeoLayerType,
  { label: string; color: string; description: string }
> = {
  mountain_range: {
    label: '大山脈（造山帯）',
    color: '#9a3412',
    description: '新期造山帯（実線）・古期造山帯（破線）',
  },
  river: {
    label: '大河川',
    color: '#0284c7',
    description: '国際河川・外来河川・大流域',
  },
  ocean_current: {
    label: '海流（暖流・寒流）',
    color: '#e11d48',
    description: '暖流（赤）・寒流（青）',
  },
  plate_boundary: {
    label: 'プレート境界',
    color: '#dc2626',
    description: '狭まる（赤）・広がる（青）・ずれる（橙）',
  },
  landform_point: {
    label: '特徴的地形ポイント',
    color: '#059669',
    description: '沈水地形・カルスト・三角州・サンゴ礁',
  },
  strait_canal: {
    label: '重要海峡・運河',
    color: '#d97706',
    description: '海上交通の要衝・主要運河',
  },
  capitals: {
    label: '各国の首都',
    color: '#4f46e5',
    description: '世界の首都（★）・計画首都',
  },
  volcanoes: {
    label: '主な火山・ホットスポット',
    color: '#e11d48',
    description: '沈み込み(赤)・海嶺/地溝帯(青)・ホットスポット(紫)',
  },
};

export const DEFAULT_LAYER_VISIBILITY: LayerVisibilityState = {
  mountain_range: true,
  river: true,
  ocean_current: false,
  plate_boundary: true,
  landform_point: true,
  strait_canal: true,
  capitals: true,
  volcanoes: true,
};

/** 試験IDの日本語表示名マッピング */
export const EXAM_ID_LABELS: Record<string, string> = {
  '2024_main': '2024本試',
  '2024_makeup': '2024追試',
  '2025_main': '2025本試',
  '2025_makeup': '2025追試',
  '2026_main': '2026本試',
  '2026_makeup': '2026追試',
};

export function formatExamId(examId: string): string {
  if (EXAM_ID_LABELS[examId]) return EXAM_ID_LABELS[examId];
  const m = /^(\d{4})_(main|makeup)$/.exec(examId);
  if (!m) return examId;
  const yr = Number(m[1]);
  const sess = m[2];
  if (yr === 2021) {
    return sess === 'main' ? '2021第1日程' : '2021第2日程';
  }
  if (yr <= 2020) {
    return `${yr}センター${sess === 'main' ? '本試' : '追試'}`;
  }
  return `${yr}${sess === 'main' ? '本試' : '追試'}`;
}

/** 地図の主題図・塗り分けモード定義 */
export interface LegendItem {
  label: string;
  color: string;
}

export interface MapModeMeta {
  id: MapColorMode;
  label: string;
  shortLabel: string;
  subtitle: string;
  legend: LegendItem[];
}

export const KOPPEN_GROUP_COLORS: Record<string, string> = {
  A: '#ff4d48',
  B: '#d3b173',
  C: '#18cc55',
  D: '#9c61b0',
  E: '#31c0ec',
};

export const KOPPEN_13_COLORS: Record<string, string> = {
  Af: '#ff4d48',
  Am: '#f68e89',
  Aw: '#ffcbcc',
  BW: '#d3b173',
  BS: '#fdfb7c',
  Cs: '#f9a820',
  Cw: '#d9ed48',
  Cfa: '#a2fa06',
  Cfb: '#18cc55',
  Df: '#e1b6d8',
  Dw: '#9c61b0',
  ET: '#89e4e0',
  EF: '#31c0ec',
};

export function normalizeKoppen13(code: string): string {
  const c = code.trim();
  if (c.startsWith('BW')) return 'BW';
  if (c.startsWith('BS')) return 'BS';
  if (c.startsWith('Cs')) return 'Cs';
  if (c.startsWith('Cw')) return 'Cw';
  if (c === 'Cfc') return 'Cfb';
  if (c.startsWith('Dw')) return 'Dw';
  if (c.startsWith('D')) return 'Df';
  if (KOPPEN_13_COLORS[c]) return c;
  return c;
}

export const SOIL_COLORS: Record<string, string> = {
  ラトソル: '#dc2626',
  砂漠土: '#facc15',
  栗色土: '#d97706',
  チェルノーゼム: '#18181b',
  プレーリー土: '#78350f',
  褐色森林土: '#65a30d',
  ポドゾル: '#cbd5e1',
  ツンドラ土: '#64748b',
  テラローシャ: '#9d174d',
  レグール: '#334155',
  テラロッサ: '#ea580c',
  '黄土（レス）': '#fef08a',
  '黒ボク土（火山灰土）': '#7c3aed',
  沖積土: '#06b6d4',
};

export const AGRICULTURE_COLORS: Record<string, string> = {
  アジア式稲作農業: '#16a34a',
  アジア式畑作農業: '#65a30d',
  プランテーション農業: '#ea580c',
  '焼畑農業・自給的農業': '#d97706',
  オアシス農業: '#ca8a04',
  遊牧: '#a16207',
  地中海式農業: '#9333ea',
  混合農業: '#2563eb',
  酪農: '#0891b2',
  園芸農業: '#db2777',
  企業的穀物農業: '#eab308',
  企業的牧畜: '#78350f',
  '林業・非農業（寒冷・都市）': '#64748b',
};

export const RELIGION_COLORS: Record<string, string> = {
  'キリスト教（カトリック）': '#eab308',
  'キリスト教（プロテスタント）': '#2563eb',
  'キリスト教（正教）': '#7c3aed',
  'イスラム教（スンニ派）': '#16a34a',
  'イスラム教（シーア派）': '#0d9488',
  仏教: '#f97316',
  ヒンドゥー教: '#dc2626',
  ユダヤ教: '#06b6d4',
  東アジア伝統信仰・無宗教: '#db2777',
  '伝統信仰・無宗教（欧米等）': '#64748b',
};

export const LANGUAGE_COLORS: Record<string, string> = {
  '印欧語族（ゲルマン語派）': '#3b82f6',
  '印欧語族（ロマンス語派）': '#eab308',
  '印欧語族（スラブ語派）': '#8b5cf6',
  '印欧語族（インド・イラン・他）': '#ef4444',
  'アフロ・アジア語族': '#16a34a',
  'ニジェール・コンゴ語族': '#a16207',
  'シナ・チベット語族': '#f97316',
  '東南アジア・太平洋諸語族': '#06b6d4',
  'テュルク・モンゴル・ウラル語族': '#0d9488',
  '日本語・朝鮮語・固有語族': '#ec4899',
};

export const MAP_COLOR_MODES: MapModeMeta[] = [
  {
    id: 'heatmap',
    label: '共テ頻出度（重要ランク）',
    shortLabel: '頻出度',
    subtitle: '共通テストでの出題頻度による重要度ランク',
    legend: [
      { label: 'S（最頻出）', color: RANK_FILL_COLORS.S },
      { label: 'A（頻出）', color: RANK_FILL_COLORS.A },
      { label: 'B（重要）', color: RANK_FILL_COLORS.B },
      { label: 'C（基礎）', color: RANK_FILL_COLORS.C },
    ],
  },
  {
    id: 'koppen',
    label: 'ケッペンの気候区分',
    shortLabel: '気候区分',
    subtitle: '教科書準拠13区分・WorldClim実測気温降水量分布＋代表都市点',
    legend: [
      { label: 'Af 熱帯雨林', color: KOPPEN_13_COLORS.Af },
      { label: 'Am 熱帯モンスーン', color: KOPPEN_13_COLORS.Am },
      { label: 'Aw サバナ', color: KOPPEN_13_COLORS.Aw },
      { label: 'BW 砂漠', color: KOPPEN_13_COLORS.BW },
      { label: 'BS ステップ', color: KOPPEN_13_COLORS.BS },
      { label: 'Cs 地中海性', color: KOPPEN_13_COLORS.Cs },
      { label: 'Cw 温帯冬季少雨', color: KOPPEN_13_COLORS.Cw },
      { label: 'Cfa 温暖湿潤', color: KOPPEN_13_COLORS.Cfa },
      { label: 'Cfb 西岸海洋性', color: KOPPEN_13_COLORS.Cfb },
      { label: 'Df 亜寒帯湿潤', color: KOPPEN_13_COLORS.Df },
      { label: 'Dw 亜寒帯冬季少雨', color: KOPPEN_13_COLORS.Dw },
      { label: 'ET ツンドラ', color: KOPPEN_13_COLORS.ET },
      { label: 'EF 氷雪', color: KOPPEN_13_COLORS.EF },
    ],
  },
  {
    id: 'soil',
    label: '世界の土壌分布',
    shortLabel: '土壌',
    subtitle: '気候植生と対応する成帯土壌＋岩石・地形由来の間帯土壌',
    legend: Object.entries(SOIL_COLORS).map(([label, color]) => ({
      label,
      color,
    })),
  },
  {
    id: 'precipitation',
    label: '年間降水量',
    shortLabel: '降水量',
    subtitle: 'WorldClim実測データによる地域別年間降水量（mm）',
    legend: [
      { label: '〜250mm（極少雨）', color: '#fef3c7' },
      { label: '250〜500mm（少雨）', color: '#d9f99d' },
      { label: '500〜1000mm（中程度）', color: '#67e8f9' },
      { label: '1000〜1500mm（やや多雨）', color: '#38bdf8' },
      { label: '1500〜2000mm（多雨）', color: '#2563eb' },
      { label: '2000mm〜（極多雨）', color: '#1e3a8a' },
    ],
  },
  {
    id: 'agriculture',
    label: '農業の種類（ホイットルセー）',
    shortLabel: '農業',
    subtitle: '国境を超えた地域単位の農業区分分布',
    legend: Object.entries(AGRICULTURE_COLORS).map(([label, color]) => ({
      label,
      color,
    })),
  },
  {
    id: 'elevation',
    label: '標高・地形起伏',
    shortLabel: '標高',
    subtitle: 'WorldClim実標高データに基づく地域別地形段彩（m）',
    legend: [
      { label: '〜200m（平野・低地）', color: '#86efac' },
      { label: '200〜500m（台地・丘陵）', color: '#bef264' },
      { label: '500〜1000m（高原）', color: '#fde047' },
      { label: '1000〜1500m（山地）', color: '#fdba74' },
      { label: '1500〜2500m（高山）', color: '#d97706' },
      { label: '2500m〜（ヒマラヤ・チベット等）', color: '#7c2d12' },
    ],
  },
  {
    id: 'religion',
    label: '宗教分布',
    shortLabel: '宗教',
    subtitle: '地域・文化圏単位の主要宗教分布（国内地域差反映）',
    legend: Object.entries(RELIGION_COLORS).map(([label, color]) => ({
      label,
      color,
    })),
  },
  {
    id: 'language',
    label: '言語系統',
    shortLabel: '言語',
    subtitle: '地域・民族分布に基づく語族・語派マップ',
    legend: Object.entries(LANGUAGE_COLORS).map(([label, color]) => ({
      label,
      color,
    })),
  },
  {
    id: 'marked',
    label: 'マークした国',
    shortLabel: 'マーク済み',
    subtitle: '自分が★マークを付けた国のみ強調表示',
    legend: [
      { label: '★ マーク済み', color: '#f59e0b' },
      { label: '未マーク', color: '#e2e8f0' },
    ],
  },
  {
    id: 'plain',
    label: '通常地図（単色）',
    shortLabel: '通常',
    subtitle: '色分けなしの標準白地図表示',
    legend: [],
  },
];
