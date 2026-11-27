import type {
  AgePyramidBin,
  ClimateCity,
  CountryData,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import {
  buildDynamicPercentCountryMatrix,
  CURATED_STAT_MATRICES,
  extractComparisonMatrices,
  getAge60PlusPct,
  type StatMatrixRow,
  type StatMatrixSpec,
} from './statMatrices';

export type DrillGenre =
  | 'all'
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

export interface GeneratedDrillQuestion {
  id: string;
  genre: Exclude<DrillGenre, 'all'>;
  genreLabel: string;
  promptTitle: string;
  promptBody: string;
  table?: { caption?: string; headers: string[]; rows: string[][] };
  scatterPlot?: ScatterDrillSpec;
  stackedBars?: StackedBarDrillSpec;
  lineTrend?: LineTrendDrillSpec;
  climateCity?: ClimateCity;
  climateCities?: { label: string; city: ClimateCity; metaText: string }[];
  climateChartType?: 'climograph' | 'hythergraph';
  pyramidBins?: AgePyramidBin[];
  pyramidPair?: { label: string; bins: AgePyramidBin[] }[];
  photoUrl?: string;
  visualClues?: string[];
  choices: string[];
  correctIndex: number;
  explanation: string;
  detailNotes?: string[];
  relatedIso3s: string[];
}

export const DRILL_GENRE_OPTIONS: { id: DrillGenre; label: string }[] = [
  { id: 'all', label: '全ジャンルおまかせ' },
  { id: 'stat_country', label: '統計数値 → 国を当てる' },
  { id: 'stat_double_blind', label: '国名×項目 両方ブラインド' },
  { id: 'stat_item', label: '統計数値 → 項目を当てる' },
  { id: 'scatter_plot', label: '散布図・2指標分析' },
  { id: 'composition_bar', label: '構成比グラフ読取' },
  { id: 'time_shift', label: '時系列・推移グラフ読取' },
  { id: 'climate_coords', label: '雨温図・ハイサーグラフ' },
  { id: 'pyramid_match', label: '人口ピラミッド判別' },
  { id: 'photo_infer', label: '景観写真・地域推論' },
];

const ALL_WEIGHTED_GENRES: Exclude<DrillGenre, 'all'>[] = [
  'stat_country',
  'stat_country',
  'stat_double_blind',
  'stat_double_blind',
  'stat_item',
  'stat_item',
  'scatter_plot',
  'scatter_plot',
  'composition_bar',
  'time_shift',
  'climate_coords',
  'pyramid_match',
  'photo_infer',
];

const POINT_COLORS = ['#4f46e5', '#e11d48', '#059669', '#d97706'];
const LINE_COLORS = ['#2563eb', '#e11d48', '#059669'];
const STACK_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#64748b'];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cleanCountryName(name: string): string {
  return name.split('（')[0].trim();
}

function sortJa(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, 'ja'));
}

function formatNum(v: number): string {
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString('ja-JP');
  if (Number.isInteger(v)) return v.toString();
  return Number(v.toFixed(1)).toString();
}

function fmtPopShort(pop: number): string {
  if (pop >= 1e8) return `${(pop / 1e8).toFixed(2)}億人`;
  if (pop >= 1e4) return `${Math.round(pop / 1e4).toLocaleString('ja-JP')}万人`;
  return `${pop.toLocaleString('ja-JP')}人`;
}

function normalizeMacroRegion(region: string): string {
  if (region.includes('ヨーロッパ') || region.includes('ロシア')) return 'ヨーロッパ・旧ソ連圏';
  if (region.includes('アフリカ')) return 'アフリカ';
  if (region.includes('アメリカ') || region.includes('ラテン')) return '南北アメリカ';
  return 'アジア・大洋州';
}

function makeAll6Permutations(
  labels: [string, string, string],
  correctTuple: [string, string, string],
): { choices: string[]; correctIndex: number } {
  const [x, y, z] = correctTuple;
  const [l1, l2, l3] = labels;
  const tuples: [string, string, string][] = [
    [x, y, z],
    [x, z, y],
    [y, x, z],
    [y, z, x],
    [z, x, y],
    [z, y, x],
  ];
  const answerStr = `${l1}：${x} ／ ${l2}：${y} ／ ${l3}：${z}`;
  const choices = shuffle(
    Array.from(new Set(tuples.map(([a, b, c]) => `${l1}：${a} ／ ${l2}：${b} ／ ${l3}：${c}`))),
  );
  return { choices, correctIndex: choices.indexOf(answerStr) };
}

function generateIndexPermutations(n: number): number[][] {
  if (n === 1) return [[0]];
  if (n === 2) return [[0, 1], [1, 0]];
  if (n === 3) {
    return [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
  }
  return [];
}

/**
 * 二重ブラインド（行・列とも名称非表示）で、行入替・列入替のあらゆる別解を排除し一意に解けるかを数学的に判定
 */
function isDoubleBlindUniquelySolvable(M: number[][]): boolean {
  const R = M.length;
  const C = M[0]?.length ?? 0;
  if (R < 2 || C < 2 || R > 3 || C > 3) return false;

  const flat = M.flat();
  const scale = Math.max(1e-6, ...flat.map((v) => Math.abs(v)));
  const threshold = 0.22;

  // 各行ペアに十分明確な違いがあること
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      let maxDiff = 0;
      for (let k = 0; k < C; k++) {
        maxDiff = Math.max(maxDiff, Math.abs(M[i][k] - M[j][k]) / scale);
      }
      if (maxDiff < threshold) return false;
    }
  }
  // 各列ペアに十分明確な違いがあること
  for (let k = 0; k < C; k++) {
    for (let l = k + 1; l < C; l++) {
      let maxDiff = 0;
      for (let i = 0; i < R; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(M[i][k] - M[i][l]) / scale);
      }
      if (maxDiff < threshold) return false;
    }
  }

  // 全 (行置換 × 列置換) に対して恒等置換以外が一致・近似しないこと
  const rPerms = generateIndexPermutations(R);
  const cPerms = generateIndexPermutations(C);
  for (const rp of rPerms) {
    for (const cp of cPerms) {
      const isIdentity = rp.every((v, i) => v === i) && cp.every((v, i) => v === i);
      if (isIdentity) continue;
      let maxDiff = 0;
      for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
          maxDiff = Math.max(maxDiff, Math.abs(M[i][j] - M[rp[i]][cp[j]]) / scale);
        }
      }
      if (maxDiff < threshold) return false;
    }
  }
  return true;
}

// ============================================================================
// ランキング単一指標の完全クリーン抽出（「オレンジのりんご生産」バグ根治）
// ============================================================================

export interface CleanRankingMetric {
  parentId: string;
  side: 'primary' | 'secondary';
  category: string;
  metricLabel: string;
  entries: { iso3: string; nameJa: string; value: number; sharePct?: number }[];
  unit: string;
  examTrap: string;
}

const BAD_RANKING_LABEL_RE =
  /(偏在|代表国|コントラスト|対比|注目国|トップ層|特殊例|主役|比較|ポイント国|特徴国|vs)/i;
const BAD_ENTRY_NAME_RE = /^(その他|合計|世界|EU27合計|EU計|ASEANその他)$/;

// 完全一致で純粋に汎用指標語のみ（親テーマ名を補う対象）
const PURE_GENERIC_SUB_SET = new Set([
  '生産量',
  '輸出量',
  '輸入量',
  '産出量',
  '飼育頭数',
  '総生産量',
  '新地金生産',
  '受取金額',
  '対GDP比',
  '登録件数',
  '設備容量',
  '生産・新車販売',
  '年間新規導入台数',
  '登録船腹量',
  '1人当たり消費',
  '丸太総生産',
  '養殖生産量',
  '海面天然漁獲量',
  '生鮮輸出',
  '水牛',
  '貿易依存度',
  '国際線旅客数',
]);

function extractBaseTopic(itemTitle: string): string {
  const beforeParen = itemTitle.split('（')[0].trim();
  const splitVs = beforeParen
    .split(/\s+vs\s+|\s+輸出|\s+輸入|\s+産出|\s+生産|\s+設備|\s+発電|\s+上位|\s+飼育頭数/i)[0]
    .trim();
  if (splitVs === '原油・石油') return '原油';
  if (splitVs === 'パーム油・アブラヤシ') return 'パーム油';
  if (splitVs === '金・ダイヤモンド') return '金';
  if (splitVs === '世界遺産登録数') return '世界遺産';
  if (splitVs === '羊・ヤギ・水牛飼育頭数') return '水牛';
  if (splitVs === '豚飼育頭数') return '豚';
  if (splitVs === '1人当たりエネルギー消費・CO₂排出量') return '一次エネルギー';
  if (splitVs === '太陽光・風力発電量') return '風力・太陽光発電';
  return splitVs;
}

function buildCleanMetricLabel(itemTitle: string, rawLabel: string): string {
  const base = extractBaseTopic(itemTitle);
  const sub = rawLabel
    .replace(/（[^）]*）/g, '')
    .replace(/上位国$/u, '')
    .replace(/上位$/u, '')
    .trim();

  if (!sub) return base;

  // 完全一致する汎用指標名のみ親品目名を補う（りんご生産・オレンジ生産・さつまいも生産等を汚染しない）
  if (PURE_GENERIC_SUB_SET.has(sub)) {
    if (itemTitle.startsWith('ビール生産量')) {
      if (sub === '総生産量') return 'ビールの総生産量';
      if (sub === '1人当たり消費') return '1人当たりビール消費量';
    }
    if (itemTitle.startsWith('国際出稼ぎ個人送金')) {
      return `出稼ぎ個人送金（${sub}）`;
    }
    if (sub === '水牛') return '水牛の飼育頭数';
    if (sub === '貿易依存度') return '貿易依存度';
    if (sub === '登録件数') return '世界遺産の登録件数';
    if (sub === '国際線旅客数') return '国際線旅客数';
    if (sub === '設備容量') return `${base}の設備容量`;
    if (sub === '丸太総生産') return '丸太（木材）総生産';
    if (sub === '年間新規導入台数') return '産業用ロボットの年間新規導入台数';
    if (sub === '養殖生産量') return '水産養殖生産量';
    if (sub === '海面天然漁獲量') return '海面天然漁獲量';
    if (sub === '新地金生産') return 'アルミニウム新地金生産';
    if (itemTitle.startsWith('ワイン生産量') && sub === '生産量') return 'ワイン生産量';
    const cleanBase = base.split('・')[0].split('＆')[0].trim();
    if (sub.includes(cleanBase)) return sub;
    return `${cleanBase}の${sub}`;
  }

  if (sub.includes('高出生率')) return '合計特殊出生率（高位国）';
  if (sub.includes('低出生率')) return '合計特殊出生率（低位国）';
  if (sub === '老年人口') return '老年人口割合（高齢化率）';
  if (sub === 'ジニ係数 高') return '所得格差（ジニ係数高水準）';
  if (sub.startsWith('第1位都市圏')) return '首位都市圏の人口集中率';
  if (sub.includes('太陽光パネル')) return '太陽光パネル製造シェア';
  if (sub.includes('希土類')) return 'レアアース（希土類）生産';
  if (sub.includes('購買力平価')) return '購買力平価(PPP)GDP';
  if (sub.includes('菜種')) return '菜種（ナタネ）生産';
  if (sub.includes('石炭輸出')) return '石炭の輸出量';
  if (sub.includes('石炭産出量')) return '石炭の産出量';
  if (sub.includes('再生可能水資源総量')) return '再生可能水資源総量';
  if (sub === '銀生産') return '銀の産出量';

  return sub;
}

export function extractCleanRankingMetrics(
  dataset: WorldRankingsDataset,
): CleanRankingMetric[] {
  const out: CleanRankingMetric[] = [];
  for (const it of dataset.items) {
    const sides: { side: 'primary' | 'secondary'; label?: string; list?: typeof it.primaryTop }[] = [
      { side: 'primary', label: it.primaryLabel, list: it.primaryTop },
      { side: 'secondary', label: it.secondaryLabel, list: it.secondaryTop },
    ];
    for (const s of sides) {
      if (!s.label || !s.list || s.list.length < 3) continue;
      if (BAD_RANKING_LABEL_RE.test(s.label)) continue;

      const cleanedEntries = s.list
        .map((e) => ({
          iso3: e.iso3,
          nameJa: cleanCountryName(e.nameJa),
          value: e.value,
          sharePct: e.sharePct,
        }))
        .filter((e) => e.nameJa.length > 0 && !BAD_ENTRY_NAME_RE.test(e.nameJa));

      if (cleanedEntries.length < 3) continue;
      const rawTop3Invalid = s.list
        .slice(0, 3)
        .some((e) => BAD_ENTRY_NAME_RE.test(cleanCountryName(e.nameJa)));
      if (rawTop3Invalid) continue;

      const metricLabel = buildCleanMetricLabel(it.title, s.label);
      if (/\bvs\b/i.test(metricLabel)) continue;

      out.push({
        parentId: it.id,
        side: s.side,
        category: it.category,
        metricLabel,
        entries: cleanedEntries,
        unit: it.unit,
        examTrap: it.examTrap,
      });
    }
  }
  return out;
}

// ============================================================================
// 1. 統計数値 → 国を当てる (新課程中心：数値表から特定1国 / 3国組合せ6択)
// ============================================================================

function pickDistinctRows(rows: StatMatrixRow[], count: number): StatMatrixRow[] | null {
  if (rows.length < count) return null;
  const colCount = rows[0].values.length;
  const colScales = Array.from({ length: colCount }, (_, c) =>
    Math.max(1e-6, ...rows.map((r) => Math.abs(r.values[c] ?? 0))),
  );

  for (const minDiff of [0.18, 0.1, 0.04]) {
    const picked: StatMatrixRow[] = [];
    for (const r of shuffle(rows)) {
      const ok = picked.every((p) => {
        let maxD = 0;
        for (let c = 0; c < colCount; c++) {
          maxD = Math.max(maxD, Math.abs(r.values[c] - p.values[c]) / colScales[c]);
        }
        return maxD >= minDiff;
      });
      if (ok) {
        picked.push(r);
        if (picked.length === count) return picked;
      }
    }
  }
  return null;
}

function makeMixedProfileCountryQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const fullEligible = Object.values(countries).filter(
    (c) =>
      c.stats &&
      c.stats.population >= 1_000_000 &&
      c.stats.gdpPerCapitaUsd > 0 &&
      c.stats.fertilityRate != null &&
      getAge60PlusPct(c) != null,
  );
  if (fullEligible.length < 8) return null;

  let pool = fullEligible;
  let scopeLabel = '世界各国';
  if (Math.random() < 0.55) {
    const byReg = new Map<string, CountryData[]>();
    for (const c of fullEligible) {
      const mr = normalizeMacroRegion(c.region);
      const list = byReg.get(mr) ?? [];
      list.push(c);
      byReg.set(mr, list);
    }
    const candidates = Array.from(byReg.entries()).filter(([, list]) => list.length >= 6);
    if (candidates.length > 0) {
      const [mr, list] = shuffle(candidates)[0];
      pool = list;
      scopeLabel = mr;
    }
  } else {
    const nonS = fullEligible.filter((c) => c.examSummary.rank !== 'S');
    if (nonS.length >= 8) {
      pool = nonS;
      scopeLabel = '中堅・新興・途上国を含む比較';
    }
  }

  const picked: CountryData[] = [];
  for (const c of shuffle(pool)) {
    const ok = picked.every((p) => {
      const a = c.stats!;
      const b = p.stats!;
      const gdpR =
        Math.max(a.gdpPerCapitaUsd, b.gdpPerCapitaUsd) /
        Math.max(100, Math.min(a.gdpPerCapitaUsd, b.gdpPerCapitaUsd));
      return (
        gdpR >= 1.55 ||
        Math.abs(a.urbanPopRatePct - b.urbanPopRatePct) >= 16 ||
        Math.abs((a.fertilityRate ?? 2) - (b.fertilityRate ?? 2)) >= 0.8 ||
        Math.abs(a.sectorShare.primaryPct - b.sectorShare.primaryPct) >= 15
      );
    });
    if (ok) {
      picked.push(c);
      if (picked.length === 4) break;
    }
  }
  if (picked.length < 4) return null;

  const isSinglePick = Math.random() < 0.55;
  if (isSinglePick) {
    const rowCodes = ['ア', 'イ', 'ウ', 'エ'];
    const targetIdx = Math.floor(Math.random() * 4);
    const targetName = cleanCountryName(picked[targetIdx].nameJa);
    const candidatesSorted = sortJa(picked.map((c) => cleanCountryName(c.nameJa))).join('、');

    const rows = picked.map((c, idx) => {
      const st = c.stats!;
      const sh = st.sectorShare;
      return [
        rowCodes[idx],
        fmtPopShort(st.population),
        `${st.populationDensity.toFixed(0)}人/km²`,
        `$${st.gdpPerCapitaUsd.toLocaleString()}`,
        `${st.urbanPopRatePct}%`,
        st.fertilityRate!.toFixed(2),
        `${getAge60PlusPct(c)}%`,
        `${sh.primaryPct}/${sh.secondaryPct}/${sh.tertiaryPct}`,
      ];
    });

    const choices = rowCodes.map((rc) => `表中の ${rc}`);
    return {
      id: `drill_scn_${nonce}`,
      genre: 'stat_country',
      genreLabel: '統計数値 → 国を当てる',
      promptTitle: `人口・経済・産業数値表からの「${targetName}」特定`,
      promptBody: `下の表中の ア〜エ は、${candidatesSorted}のいずれか（${scopeLabel}）の基礎統計を示したものである。「${targetName}」に該当するものを一つ選びなさい。`,
      table: {
        caption: `4カ国の経済・人口・産業構造比較（${scopeLabel}）`,
        headers: ['記号', '人口', '密度', '1人GDP', '都市率', '出生率', '60歳+率', '1/2/3次(%)'],
        rows,
      },
      choices,
      correctIndex: targetIdx,
      explanation: `「${targetName}」は表中の ${rowCodes[targetIdx]}。1人あたりGDP・出生率・高齢化率（60歳以上割合）・第1次産業比率を組み合わせて他国と区別する。`,
      detailNotes: picked.map(
        (c, i) =>
          `${rowCodes[i]}＝${cleanCountryName(c.nameJa)}（${c.region}・代表気候 ${c.thematic?.koppenMain ?? '-'}・${c.thematic?.religionMain ?? '-'}）`,
      ),
      relatedIso3s: picked.map((c) => c.iso3),
    };
  }

  const sub3 = picked.slice(0, 3);
  const names3 = sub3.map((c) => cleanCountryName(c.nameJa)) as [string, string, string];
  const candidatesSorted = sortJa(names3).join('、');
  const rowCodes: [string, string, string] = ['ア', 'イ', 'ウ'];
  const { choices, correctIndex } = makeAll6Permutations(rowCodes, names3);

  const rows = sub3.map((c, idx) => {
    const st = c.stats!;
    const sh = st.sectorShare;
    return [
      rowCodes[idx],
      fmtPopShort(st.population),
      `$${st.gdpPerCapitaUsd.toLocaleString()}`,
      `${st.urbanPopRatePct}%`,
      st.fertilityRate!.toFixed(2),
      `${getAge60PlusPct(c)}%`,
      `${sh.primaryPct}/${sh.secondaryPct}/${sh.tertiaryPct}`,
      st.remittanceGdpPct != null ? `${st.remittanceGdpPct}%` : '-',
    ];
  });

  return {
    id: `drill_scn_${nonce}`,
    genre: 'stat_country',
    genreLabel: '統計数値 → 国を当てる',
    promptTitle: '統計数値表による3カ国の組合せ特定',
    promptBody: `下の表中の ア〜ウ は、${candidatesSorted}のいずれかである。国名と ア〜ウ との正しい組合せを選びなさい。`,
    table: {
      caption: `3カ国の経済・人口・送金指標比較（${scopeLabel}）`,
      headers: ['記号', '人口', '1人GDP', '都市率', '出生率', '60歳+率', '1/2/3次(%)', '個人送金/GDP'],
      rows,
    },
    choices,
    correctIndex,
    explanation: `1人あたりGDPの水準、出生率・高齢化率の人口転換段階、個人送金依存度・第1次産業割合を比較して3カ国を特定する。`,
    detailNotes: sub3.map(
      (c, i) =>
        `${rowCodes[i]}＝${cleanCountryName(c.nameJa)}（${c.region}・密度 ${c.stats!.populationDensity.toFixed(0)}人/km²・気候 ${c.thematic?.koppenMain ?? '-'}）`,
    ),
    relatedIso3s: sub3.map((c) => c.iso3),
  };
}

function makeStatCountryQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  // 約30%は全収録国（中堅・非上位含む）の総合統計プロフィール比較
  if (Math.random() < 0.3) {
    const mixed = makeMixedProfileCountryQuestion(countries, nonce);
    if (mixed) return mixed;
  }

  const matrices: StatMatrixSpec[] = [
    ...CURATED_STAT_MATRICES,
    ...extractComparisonMatrices(worldRankings, countries),
  ];
  const dynNonS = buildDynamicPercentCountryMatrix(countries, 'non_s');
  const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
  if (dynNonS) matrices.push(dynNonS);
  if (dynReg) matrices.push(dynReg);

  for (const mat of shuffle(matrices)) {
    const colIndices =
      mat.colLabels.length > 4
        ? shuffle(mat.colLabels.map((_, i) => i)).slice(0, 4).sort((a, b) => a - b)
        : mat.colLabels.map((_, i) => i);

    const projectedRows: StatMatrixRow[] = mat.rows.map((r) => ({
      ...r,
      values: colIndices.map((ci) => r.values[ci]),
    }));

    const useSinglePick = mat.colLabels.length === 1 || Math.random() < 0.55;
    const picked = pickDistinctRows(projectedRows, useSinglePick ? 4 : 3);
    if (!picked) continue;

    const colHeaders = colIndices.map((ci) => mat.colLabels[ci]);

    if (useSinglePick) {
      const rowCodes = ['ア', 'イ', 'ウ', 'エ'];
      const targetIdx = Math.floor(Math.random() * 4);
      const targetName = picked[targetIdx].countryName;
      const candidatesSorted = sortJa(picked.map((r) => r.countryName)).join('、');

      const rows = picked.map((r, i) => [rowCodes[i], ...r.values.map(formatNum)]);
      const choices = rowCodes.map((rc) => `表中の ${rc}`);

      return {
        id: `drill_scn_${nonce}`,
        genre: 'stat_country',
        genreLabel: '統計数値 → 国を当てる',
        promptTitle: `実数値表「${mat.title}」からの「${targetName}」特定`,
        promptBody: `次の表中の ア〜エ は、${candidatesSorted}のいずれかの国・地域における「${mat.title}」（単位：${mat.unit}）を示している。「${targetName}」に該当するものを一つ選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['国', ...colHeaders],
          rows,
        },
        choices,
        correctIndex: targetIdx,
        explanation: `「${targetName}」は表中の ${rowCodes[targetIdx]}。${mat.examPoint}`,
        detailNotes: picked.map(
          (r, i) =>
            `${rowCodes[i]}＝${r.countryName}：${colHeaders.map((h, ci) => `${h} ${formatNum(r.values[ci])}${mat.unit}`).join('／')}`,
        ),
        relatedIso3s: picked.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
      };
    }

    const rowCodes: [string, string, string] = ['ア', 'イ', 'ウ'];
    const names = picked.map((r) => r.countryName) as [string, string, string];
    const candidatesSorted = sortJa(names).join('、');
    const { choices, correctIndex } = makeAll6Permutations(rowCodes, names);
    const rows = picked.map((r, i) => [rowCodes[i], ...r.values.map(formatNum)]);

    return {
      id: `drill_scn_${nonce}`,
      genre: 'stat_country',
      genreLabel: '統計数値 → 国を当てる',
      promptTitle: `実数値表「${mat.title}」の3カ国判別`,
      promptBody: `次の表中の ア〜ウ は、${candidatesSorted}のいずれかである。国名と ア〜ウ との正しい組合せを選びなさい。`,
      table: {
        caption: `${mat.title}（単位：${mat.unit}）`,
        headers: ['国', ...colHeaders],
        rows,
      },
      choices,
      correctIndex,
      explanation: mat.examPoint,
      detailNotes: picked.map(
        (r, i) =>
          `${rowCodes[i]}＝${r.countryName}：${colHeaders.map((h, ci) => `${h} ${formatNum(r.values[ci])}${mat.unit}`).join('／')}`,
      ),
      relatedIso3s: picked.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
    };
  }

  return makeMixedProfileCountryQuestion(countries, nonce);
}

// ============================================================================
// 2. 国名×項目 両方ブラインド（新課程典型：二重ブラインドクロス表）
// ============================================================================

function makeStatDoubleBlindQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const pool: StatMatrixSpec[] = [
    ...CURATED_STAT_MATRICES,
    ...extractComparisonMatrices(worldRankings, countries),
  ].filter((m) => m.sameUnitAcrossCols && m.colLabels.length >= 2 && m.rows.length >= 2);

  const dynNonS = buildDynamicPercentCountryMatrix(countries, 'non_s');
  const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
  if (dynNonS) pool.push(dynNonS);
  if (dynReg) pool.push(dynReg);

  for (const mat of shuffle(pool)) {
    const colCnt = mat.colLabels.length;
    const rowCnt = mat.rows.length;

    // 優先順位: 2行×3列 (6択) または 3行×2列 (6択) または 2行×2列 (4択)
    const shapes: [number, number][] = shuffle([
      ...(colCnt >= 3 && rowCnt >= 2 ? ([[2, 3]] as [number, number][]) : []),
      ...(colCnt >= 2 && rowCnt >= 3 ? ([[3, 2]] as [number, number][]) : []),
      ...(colCnt >= 2 && rowCnt >= 2 ? ([[2, 2]] as [number, number][]) : []),
    ]);

    for (const [R, C] of shapes) {
      for (let attempt = 0; attempt < 25; attempt++) {
        const colIdx = shuffle(mat.colLabels.map((_, i) => i)).slice(0, C);
        const rowCand = shuffle(mat.rows).slice(0, R);
        const subM = rowCand.map((r) => colIdx.map((ci) => r.values[ci]));

        if (!isDoubleBlindUniquelySolvable(subM)) continue;

        const rowCodes = R === 2 ? ['P', 'Q'] : ['P', 'Q', 'R'];
        const colCodes = C === 2 ? ['カ', 'キ'] : ['カ', 'キ', 'ク'];

        const targetR = Math.floor(Math.random() * R);
        const targetC = Math.floor(Math.random() * C);
        const targetCountry = rowCand[targetR].countryName;
        const targetCol = mat.colLabels[colIdx[targetC]];

        const countryCandStr = sortJa(rowCand.map((r) => r.countryName)).join('、');
        const colCandStr = sortJa(colIdx.map((ci) => mat.colLabels[ci])).join('、');

        const pairs: { text: string; isAnswer: boolean }[] = [];
        for (let r = 0; r < R; r++) {
          for (let c = 0; c < C; c++) {
            pairs.push({
              text: `${rowCodes[r]} — ${colCodes[c]}`,
              isAnswer: r === targetR && c === targetC,
            });
          }
        }
        const choices = pairs.map((p) => p.text);
        const correctIndex = pairs.findIndex((p) => p.isAnswer);

        return {
          id: `drill_db_${nonce}`,
          genre: 'stat_double_blind',
          genreLabel: '国名×項目 両方ブラインド',
          promptTitle: `国名・項目ブラインド表「${mat.title}」の同時推論`,
          promptBody: `次の表は、${countryCandStr} のいずれかの国（${rowCodes.join('・')}）における、${colCandStr} のいずれかの項目（${colCodes.join('・')}、単位：${mat.unit}）の数値を示したものである。「${targetCountry}」と「${targetCol}」の組合せとして正しいものを一つ選びなさい。`,
          table: {
            caption: `${mat.title}（国記号 ${rowCodes.join('/')} × 項目記号 ${colCodes.join('/')}、単位：${mat.unit}）`,
            headers: ['国 \\ 項目', ...colCodes],
            rows: rowCand.map((r, ri) => [
              rowCodes[ri],
              ...colIdx.map((ci) => formatNum(r.values[ci])),
            ]),
          },
          choices,
          correctIndex,
          explanation: `正解は ${rowCodes[targetR]}（${targetCountry}）— ${colCodes[targetC]}（${targetCol}）。${mat.examPoint}`,
          detailNotes: [
            `【行（国）の正体】${rowCand.map((r, ri) => `${rowCodes[ri]}＝${r.countryName}`).join(' ／ ')}`,
            `【列（項目）の正体】${colIdx.map((ci, cpos) => `${colCodes[cpos]}＝${mat.colLabels[ci]}`).join(' ／ ')}`,
          ],
          relatedIso3s: rowCand.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
        };
      }
    }
  }

  return null;
}

// ============================================================================
// 3. 統計数値 → 項目を当てる (列ブラインド6択 / 実数値付き対比表)
// ============================================================================

function makeStatItemQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  // 約80%: 同一単位のマトリクスで国名を表側に出し、列（カ・キ・ク）の項目名を6択で当てる
  if (Math.random() < 0.8) {
    const matrices: StatMatrixSpec[] = [
      ...CURATED_STAT_MATRICES,
      ...extractComparisonMatrices(worldRankings, countries),
    ].filter((m) => m.sameUnitAcrossCols && m.colLabels.length >= 3 && m.rows.length >= 4);

    const dynNonS = buildDynamicPercentCountryMatrix(countries, 'non_s');
    const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
    if (dynNonS) matrices.push(dynNonS);
    if (dynReg) matrices.push(dynReg);

    for (const mat of shuffle(matrices)) {
      const colIdx = shuffle(mat.colLabels.map((_, i) => i)).slice(0, 3);
      const selectedCols = colIdx.map((ci) => mat.colLabels[ci]) as [string, string, string];

      const rowPool = shuffle(mat.rows).slice(0, Math.min(5, mat.rows.length));
      const flat = rowPool.flatMap((r) => colIdx.map((ci) => r.values[ci]));
      const scale = Math.max(1e-6, ...flat.map(Math.abs));

      // 3列同士が識別できる行セットか検査
      let colsDistinct = true;
      for (let a = 0; a < 3; a++) {
        for (let b = a + 1; b < 3; b++) {
          const maxD = Math.max(
            ...rowPool.map((r) => Math.abs(r.values[colIdx[a]] - r.values[colIdx[b]]) / scale),
          );
          if (maxD < 0.18) colsDistinct = false;
        }
      }
      if (!colsDistinct) continue;

      const colCodes: [string, string, string] = ['カ', 'キ', 'ク'];
      const colCandidatesSorted = sortJa(selectedCols).join('、');
      const { choices, correctIndex } = makeAll6Permutations(colCodes, selectedCols);

      return {
        id: `drill_it_${nonce}`,
        genre: 'stat_item',
        genreLabel: '統計数値 → 項目を当てる',
        promptTitle: `数値表「${mat.title}」の項目特定`,
        promptBody: `次の表中の カ〜ク は、${colCandidatesSorted}のいずれか（単位：${mat.unit}）を示している。項目名と カ〜ク との正しい組合せを選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['国', ...colCodes],
          rows: rowPool.map((r) => [
            r.countryName,
            ...colIdx.map((ci) => formatNum(r.values[ci])),
          ]),
        },
        choices,
        correctIndex,
        explanation: mat.examPoint,
        detailNotes: colCodes.map(
          (cc, i) =>
            `${cc}＝${selectedCols[i]}（${rowPool.slice(0, 4).map((r) => `${r.countryName}:${formatNum(r.values[colIdx[i]])}`).join('・')}）`,
        ),
        relatedIso3s: rowPool.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
      };
    }
  }

  // 約20%: クリーン化された単一指標ランキングから「必ず実数値・単位付き」の3指標対比6択
  if (worldRankings) {
    const metrics = extractCleanRankingMetrics(worldRankings);
    const byParent = new Map<string, CleanRankingMetric[]>();
    for (const m of metrics) {
      const list = byParent.get(m.parentId) ?? [];
      list.push(m);
      byParent.set(m.parentId, list);
    }
    const pairs: [CleanRankingMetric, CleanRankingMetric][] = [];
    for (const list of byParent.values()) {
      if (list.length === 2 && list[0].metricLabel !== list[1].metricLabel) {
        const s0 = list[0].entries
          .slice(0, 3)
          .map((e) => e.nameJa)
          .join('|');
        const s1 = list[1].entries
          .slice(0, 3)
          .map((e) => e.nameJa)
          .join('|');
        if (s0 !== s1) pairs.push([list[0], list[1]]);
      }
    }

    let picked: CleanRankingMetric[] | null = null;
    if (pairs.length > 0 && Math.random() < 0.65) {
      const [pA, pB] = shuffle(pairs)[0];
      const third = shuffle(
        metrics.filter((m) => m.parentId !== pA.parentId && m.category === pA.category),
      )[0];
      if (third) picked = shuffle([pA, pB, third]);
    }
    if (!picked) {
      const acc: CleanRankingMetric[] = [];
      const seenTop1 = new Set<string>();
      const seenLabels = new Set<string>();
      for (const m of shuffle(metrics)) {
        const top1 = m.entries[0]?.nameJa;
        if (!top1 || seenTop1.has(top1) || seenLabels.has(m.metricLabel)) continue;
        acc.push(m);
        seenTop1.add(top1);
        seenLabels.add(m.metricLabel);
        if (acc.length === 3) break;
      }
      if (acc.length === 3) picked = acc;
    }

    if (picked && picked.length === 3) {
      const labels: [string, string, string] = ['カ', 'キ', 'ク'];
      const metricNames = picked.map((m) => m.metricLabel) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(labels, metricNames);

      const rows = picked.map((m, idx) => [
        labels[idx],
        m.entries
          .slice(0, 3)
          .map((e, ri) => `${ri + 1}. ${e.nameJa}(${formatNum(e.value)}${m.unit ? m.unit : ''})`)
          .join(' ／ '),
      ]);

      return {
        id: `drill_it_${nonce}`,
        genre: 'stat_item',
        genreLabel: '統計数値 → 項目を当てる',
        promptTitle: '品目・指標別の上位実績（数値付き）特定',
        promptBody: `次の表中の カ〜ク は、${sortJa(metricNames).join('、')}のいずれかの統計指標について上位3カ国と実績値を示したものである。項目名と カ〜ク との正しい組合せを選びなさい。`,
        table: {
          caption: '統計指標別の上位3カ国と実数値',
          headers: ['記号', '第1位〜第3位の実績'],
          rows,
        },
        choices,
        correctIndex,
        explanation:
          '品目ごとの生産国・輸出国・消費国の違い（内需大国の有無、資源精錬と原料産地の分離など）を数値規模とともに確認する。',
        detailNotes: picked.map((m, idx) => `${labels[idx]}＝${m.metricLabel}：${m.examTrap}`),
        relatedIso3s: Array.from(
          new Set(
            picked.flatMap((m) => m.entries.slice(0, 2).map((e) => e.iso3)).filter((id) => id.length === 3),
          ),
        ).slice(0, 5),
      };
    }
  }

  return null;
}

// ============================================================================
// 4. 散布図・2指標分析（新課程形式：A〜Dが候補4国のどれか→対象国の点を選ぶ）
// ============================================================================

interface DynamicScatterDef {
  title: string;
  xLabel: string;
  yLabel: string;
  extract: (c: CountryData) => { x: number; y: number } | null;
  noteOf: (c: CountryData, x: number, y: number) => string;
}

const DYNAMIC_SCATTERS: DynamicScatterDef[] = [
  {
    title: '1人当たりGDP × 合計特殊出生率',
    xLabel: '1人当たり名目GDP（千USD）',
    yLabel: '合計特殊出生率（人）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.gdpPerCapitaUsd <= 0 || st.gdpPerCapitaUsd > 95_000 || st.fertilityRate == null)
        return null;
      return { x: Number((st.gdpPerCapitaUsd / 1000).toFixed(1)), y: Number(st.fertilityRate.toFixed(2)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.region}）：1人GDP ${x}千USD / 出生率 ${y}`,
  },
  {
    title: '第1次産業就業率 × 都市人口率',
    xLabel: '第1次産業就業率（%）',
    yLabel: '都市人口率（%）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.urbanPopRatePct == null || !st.sectorShare) return null;
      return { x: Number(st.sectorShare.primaryPct.toFixed(1)), y: Number(st.urbanPopRatePct.toFixed(1)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.region}）：1次産業 ${x}% / 都市率 ${y}%`,
  },
  {
    title: '1人当たりGDP × 個人送金受取（GDP比%）',
    xLabel: '1人当たり名目GDP（千USD）',
    yLabel: '個人送金受取（GDP比%）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.gdpPerCapitaUsd <= 0 || st.gdpPerCapitaUsd > 65_000 || st.remittanceGdpPct == null)
        return null;
      return { x: Number((st.gdpPerCapitaUsd / 1000).toFixed(1)), y: Number(st.remittanceGdpPct.toFixed(1)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.region}）：1人GDP ${x}千USD / 個人送金 GDP比${y}%`,
  },
  {
    title: '女性労働力率 × 合計特殊出生率',
    xLabel: '女性労働力率（%）',
    yLabel: '合計特殊出生率（人）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.femaleLaborPct == null || st.fertilityRate == null) return null;
      return { x: Number(st.femaleLaborPct.toFixed(1)), y: Number(st.fertilityRate.toFixed(2)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.region}）：女性労働力率 ${x}% / 出生率 ${y}`,
  },
  {
    title: '代表年降水量 × 平均標高',
    xLabel: '代表年降水量（mm）',
    yLabel: '平均標高（m）',
    extract: (c) => {
      const th = c.thematic;
      if (!th || th.annualPrecipMm <= 0 || th.meanElevationM < 0) return null;
      return { x: th.annualPrecipMm, y: th.meanElevationM };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.thematic?.koppenMain ?? ''}）：降水量 約${x}mm / 平均標高 ${y}m`,
  },
  {
    title: '人口密度 × 都市人口率',
    xLabel: '人口密度（人/km²）',
    yLabel: '都市人口率（%）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.populationDensity <= 0 || st.populationDensity > 1200) return null;
      return { x: Number(st.populationDensity.toFixed(1)), y: Number(st.urbanPopRatePct.toFixed(1)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}（${c.region}）：人口密度 ${x}人/km² / 都市率 ${y}%`,
  },
];

function selectSpreadTargets<T extends { x: number; y: number; rankWeight?: number }>(
  items: T[],
  count: number,
): T[] | null {
  if (items.length < count) return null;
  const xs = items.map((p) => p.x);
  const ys = items.map((p) => p.y);
  const xSpan = Math.max(1e-6, Math.max(...xs) - Math.min(...xs));
  const ySpan = Math.max(1e-6, Math.max(...ys) - Math.min(...ys));
  const xMin = Math.min(...xs);
  const yMin = Math.min(...ys);
  const normOf = (p: T) => [(p.x - xMin) / xSpan, (p.y - yMin) / ySpan] as const;

  const ordered = [...items].sort(
    (a, b) => Math.random() - (a.rankWeight ?? 0) * 0.25 - (Math.random() - (b.rankWeight ?? 0) * 0.25),
  );

  for (const minDist of [0.22, 0.14, 0.08]) {
    const picked: T[] = [];
    for (const cand of ordered) {
      const [nx, ny] = normOf(cand);
      const farEnough = picked.every((p) => {
        const [px, py] = normOf(p);
        return Math.hypot(nx - px, ny - py) >= minDist;
      });
      if (farEnough) {
        picked.push(cand);
        if (picked.length === count) return picked;
      }
    }
  }
  return null;
}

function makeScatterPlotQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const scatters = worldRankings?.scatters ?? [];
  if (scatters.length > 0 && Math.random() < 0.45) {
    const sc = shuffle(scatters)[0];
    const pts = sc.points.map((pt) => ({
      ...pt,
      nameJa: cleanCountryName(pt.nameJa),
      rankWeight: countries[pt.iso3]?.examSummary?.rank === 'S' ? 0 : 1,
    }));
    const targets = selectSpreadTargets(pts, 4);
    if (targets) {
      const codes = ['A', 'B', 'C', 'D'];
      const targetIdx = Math.floor(Math.random() * 4);
      const target = targets[targetIdx];
      const bgSet = new Set(targets.map((t) => t.nameJa));
      const backgroundPoints = pts
        .filter((p) => !bgSet.has(p.nameJa))
        .map((p) => ({ x: p.x, y: p.y }));
      const candidatesSorted = sortJa(targets.map((t) => t.nameJa)).join('、');

      return {
        id: `drill_sc_${nonce}`,
        genre: 'scatter_plot',
        genreLabel: '散布図・2指標分析',
        promptTitle: `散布図「${sc.title.split('（')[0]}」からの「${target.nameJa}」特定`,
        promptBody: `次の図中の A〜D は、${candidatesSorted}のいずれかである（灰色点は比較用の他国データ）。「${target.nameJa}」に該当する点を一つ選びなさい。`,
        scatterPlot: {
          title: sc.title.split('（')[0],
          xLabel: sc.xLabel,
          yLabel: sc.yLabel,
          backgroundPoints,
          targetPoints: targets.map((t, i) => ({
            code: codes[i],
            x: t.x,
            y: t.y,
            color: POINT_COLORS[i],
          })),
        },
        choices: codes.map((c) => `点 ${c}`),
        correctIndex: targetIdx,
        explanation: `「${target.nameJa}」は 点${codes[targetIdx]}。${sc.examPoint}`,
        detailNotes: targets.map(
          (t, i) =>
            `点${codes[i]}＝${t.nameJa}（${t.x} / ${t.y}${t.note ? `：${t.note}` : ''}）`,
        ),
        relatedIso3s: targets.map((t) => t.iso3).filter((id) => id.length === 3),
      };
    }
  }

  for (const def of shuffle(DYNAMIC_SCATTERS)) {
    const allPts: {
      iso3: string;
      nameJa: string;
      x: number;
      y: number;
      rankWeight: number;
      note: string;
    }[] = [];

    for (const c of Object.values(countries)) {
      if (!c.stats || c.stats.population < 1_000_000) continue;
      const xy = def.extract(c);
      if (!xy) continue;
      allPts.push({
        iso3: c.iso3,
        nameJa: cleanCountryName(c.nameJa),
        x: xy.x,
        y: xy.y,
        rankWeight: c.examSummary.rank === 'S' ? 0 : c.isBasicEntry ? 2 : 1,
        note: def.noteOf(c, xy.x, xy.y),
      });
    }

    if (allPts.length < 20) continue;
    const targets = selectSpreadTargets(allPts, 4);
    if (!targets) continue;

    const targetIsoSet = new Set(targets.map((t) => t.iso3));
    const maxTx = Math.max(...targets.map((t) => t.x));
    const maxTy = Math.max(...targets.map((t) => t.y));
    const bgPool = shuffle(
      allPts.filter(
        (p) => !targetIsoSet.has(p.iso3) && p.x <= maxTx * 1.15 && p.y <= maxTy * 1.15,
      ),
    ).slice(0, 36);

    const codes = ['A', 'B', 'C', 'D'];
    const targetIdx = Math.floor(Math.random() * 4);
    const target = targets[targetIdx];
    const candidatesSorted = sortJa(targets.map((t) => t.nameJa)).join('、');

    return {
      id: `drill_sc_${nonce}`,
      genre: 'scatter_plot',
      genreLabel: '散布図・2指標分析',
      promptTitle: `散布図「${def.title}」からの「${target.nameJa}」特定`,
      promptBody: `次の図中の A〜D は、${candidatesSorted}のいずれかである（灰色点は人口100万人以上の他国データ）。「${target.nameJa}」に該当する点を一つ選びなさい。`,
      scatterPlot: {
        title: def.title,
        xLabel: def.xLabel,
        yLabel: def.yLabel,
        backgroundPoints: bgPool.map((p) => ({ x: p.x, y: p.y })),
        targetPoints: targets.map((t, i) => ({
          code: codes[i],
          x: t.x,
          y: t.y,
          color: POINT_COLORS[i],
        })),
      },
      choices: codes.map((c) => `点 ${c}`),
      correctIndex: targetIdx,
      explanation: `「${target.nameJa}」は 点${codes[targetIdx]}。横軸（${def.xLabel}）と縦軸（${def.yLabel}）の相対位置を4カ国間で比較して特定する。`,
      detailNotes: targets.map((t, i) => `点${codes[i]}：${t.note}`),
      relatedIso3s: targets.map((t) => t.iso3),
    };
  }

  return null;
}

// ============================================================================
// 5. 構成比グラフ読取（100%横帯グラフ・6択組合せ）
// ============================================================================

function mapReligionBucket(name: string): string | null {
  const safeSameGroupMulti =
    name.includes('カトリック・プロテスタント') ||
    name.includes('プロテスタント・カトリック') ||
    name.startsWith('無宗教・他') ||
    name.startsWith('無宗教・その他');
  if (name.includes('・') && !safeSameGroupMulti) return null;
  if (
    name.includes('キリスト') ||
    name.includes('カトリック') ||
    name.includes('プロテスタント') ||
    name.includes('正教') ||
    name.includes('聖公会')
  ) {
    return 'キリスト教';
  }
  if (name.includes('イスラム')) return 'イスラム教';
  if (name.includes('ヒンドゥー')) return 'ヒンドゥー教';
  if (name.includes('仏教')) return '仏教';
  if (
    name.includes('無宗教') ||
    name.includes('その他') ||
    name.includes('伝統') ||
    name.includes('ユダヤ') ||
    name.includes('神道') ||
    name.includes('道教')
  ) {
    return 'その他・無宗教等';
  }
  return null;
}

function makeCompositionBarQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const charts = (worldRankings?.comparisonCharts ?? []).filter(
    (ch) =>
      ch.kind === 'stacked_bar' &&
      ch.categories &&
      ch.categories.length >= 4 &&
      !ch.categories.some((cat) => /^\d{4}/.test(cat)) &&
      ch.series.length >= 3,
  );

  if (charts.length > 0 && Math.random() < 0.55) {
    for (const ch of shuffle(charts)) {
      const cats = ch.categories!;
      const indices = shuffle(cats.map((_, idx) => idx));
      const pickedIndices: number[] = [];

      for (const idx of indices) {
        const vec = ch.series.map((s) => s.values[idx] ?? 0);
        const sum = vec.reduce((a, b) => a + b, 0);
        if (sum <= 0) continue;
        const distinct = pickedIndices.every((pi) => {
          const pVec = ch.series.map((s) => s.values[pi] ?? 0);
          return vec.reduce((acc, v, si) => acc + Math.abs(v - pVec[si]), 0) >= 25;
        });
        if (distinct) {
          pickedIndices.push(idx);
          if (pickedIndices.length === 3) break;
        }
      }
      if (pickedIndices.length < 3) continue;

      const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
      const chosenNames = pickedIndices.map((idx) => cleanCountryName(cats[idx])) as [
        string,
        string,
        string,
      ];
      const { choices, correctIndex } = makeAll6Permutations(labels, chosenNames);

      const findIso = (n: string) =>
        Object.values(countries).find((c) => cleanCountryName(c.nameJa) === n)?.iso3;

      return {
        id: `drill_cb_${nonce}`,
        genre: 'composition_bar',
        genreLabel: '構成比グラフ読取',
        promptTitle: `${ch.title.split('（')[0]}の国名判別`,
        promptBody: `下の帯グラフ（ア〜ウ）は、${sortJa(chosenNames).join('、')}における「${ch.title.split('（')[0]}」の構成比を示している。国名と ア〜ウ との正しい組合せを選びなさい。`,
        stackedBars: {
          caption: ch.title,
          unit: ch.unit,
          series: ch.series.map((s, si) => ({
            name: s.name,
            color: s.color ?? STACK_PALETTE[si % STACK_PALETTE.length],
          })),
          rows: pickedIndices.map((ci, idx) => ({
            label: labels[idx],
            values: ch.series.map((s) => s.values[ci] ?? 0),
          })),
        },
        choices,
        correctIndex,
        explanation: ch.examPoint ?? ch.note ?? `${ch.title}の特徴から3カ国を識別する。`,
        detailNotes: pickedIndices.map((ci, idx) => {
          const vals = ch.series.map((s) => `${s.name}:${s.values[ci] ?? 0}${ch.unit}`).join('・');
          return `${labels[idx]}（${chosenNames[idx]}）：${vals}`;
        }),
        relatedIso3s: chosenNames.map(findIso).filter((id): id is string => Boolean(id)),
      };
    }
  }

  // 全収録国の宗教構成比または産業別就業構成比
  if (Math.random() < 0.4) {
    const relPool: { country: CountryData; vec: number[] }[] = [];
    const buckets = ['キリスト教', 'イスラム教', 'ヒンドゥー教', '仏教', 'その他・無宗教等'];
    for (const c of Object.values(countries)) {
      if (!c.stats || c.stats.population < 1_000_000) continue;
      const map: Record<string, number> = {
        キリスト教: 0,
        イスラム教: 0,
        ヒンドゥー教: 0,
        仏教: 0,
        'その他・無宗教等': 0,
      };
      let total = 0;
      let bad = false;
      for (const r of c.cultureAndHistory.religions) {
        if (r.percent == null) continue;
        const b = mapReligionBucket(r.name);
        if (!b) {
          bad = true;
          break;
        }
        map[b] += r.percent;
        total += r.percent;
      }
      if (!bad && total >= 80) {
        if (total < 100) map['その他・無宗教等'] += Number((100 - total).toFixed(1));
        relPool.push({ country: c, vec: buckets.map((bk) => Number(map[bk].toFixed(1))) });
      }
    }

    const picked: typeof relPool = [];
    for (const item of shuffle(relPool)) {
      const distinct = picked.every(
        (p) => item.vec.reduce((acc, v, i) => acc + Math.abs(v - p.vec[i]), 0) >= 35,
      );
      if (distinct) {
        picked.push(item);
        if (picked.length === 3) break;
      }
    }
    if (picked.length === 3) {
      const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = picked.map((p) => cleanCountryName(p.country.nameJa)) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(labels, names);

      return {
        id: `drill_cb_${nonce}`,
        genre: 'composition_bar',
        genreLabel: '構成比グラフ読取',
        promptTitle: '宗教別人口構成比からの国名判別',
        promptBody: `下の帯グラフ（ア〜ウ）は、${sortJa(names).join('、')}の主な宗教構成比（%）を示している。国名と ア〜ウ との正しい組合せを選びなさい。`,
        stackedBars: {
          caption: '主要宗教別の構成割合（%）',
          unit: '%',
          series: [
            { name: 'キリスト教', color: '#2563eb' },
            { name: 'イスラム教', color: '#10b981' },
            { name: 'ヒンドゥー教', color: '#f59e0b' },
            { name: '仏教', color: '#8b5cf6' },
            { name: 'その他・無宗教等', color: '#94a3b8' },
          ],
          rows: picked.map((p, i) => ({ label: labels[i], values: p.vec })),
        },
        choices,
        correctIndex,
        explanation:
          '歴史的伝播（中南米・欧州のキリスト教、北アフリカ・西アジアのイスラム教、東・北欧の無宗教割合、混合国の割合）を手がかりに判別する。',
        detailNotes: picked.map((p, i) => {
          const raw = p.country.cultureAndHistory.religions
            .map((r) => `${r.name}${r.percent != null ? `${r.percent}%` : ''}`)
            .join('・');
          return `${labels[i]}（${cleanCountryName(p.country.nameJa)}）：${raw}`;
        }),
        relatedIso3s: picked.map((p) => p.country.iso3),
      };
    }
  }

  const sectorPool = Object.values(countries).filter(
    (c) => c.stats && c.stats.population >= 1_000_000 && c.stats.sectorShare,
  );
  const pickedSec: CountryData[] = [];
  for (const c of shuffle(sectorPool)) {
    const s = c.stats!.sectorShare;
    const distinct = pickedSec.every((p) => {
      const ps = p.stats!.sectorShare;
      return (
        Math.abs(s.primaryPct - ps.primaryPct) +
          Math.abs(s.secondaryPct - ps.secondaryPct) +
          Math.abs(s.tertiaryPct - ps.tertiaryPct) >=
        34
      );
    });
    if (distinct) {
      pickedSec.push(c);
      if (pickedSec.length === 3) break;
    }
  }
  if (pickedSec.length < 3) return null;

  const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
  const names = pickedSec.map((c) => cleanCountryName(c.nameJa)) as [string, string, string];
  const { choices, correctIndex } = makeAll6Permutations(labels, names);

  return {
    id: `drill_cb_${nonce}`,
    genre: 'composition_bar',
    genreLabel: '構成比グラフ読取',
    promptTitle: '産業別就業人口構成（1次・2次・3次）からの国名特定',
    promptBody: `下の帯グラフ（ア〜ウ）は、${sortJa(names).join('、')}の産業部門別就業人口割合（%）を示している。国名と ア〜ウ との正しい組合せを選びなさい。`,
    stackedBars: {
      caption: '第1次・第2次・第3次産業別 就業人口構成比（%）',
      unit: '%',
      series: [
        { name: '第1次産業（農林水産）', color: '#16a34a' },
        { name: '第2次産業（鉱工業・建設）', color: '#f59e0b' },
        { name: '第3次産業（商業・サービス等）', color: '#2563eb' },
      ],
      rows: pickedSec.map((c, i) => {
        const sh = c.stats!.sectorShare;
        return { label: labels[i], values: [sh.primaryPct, sh.secondaryPct, sh.tertiaryPct] };
      }),
    },
    choices,
    correctIndex,
    explanation:
      'ペティ＝クラークの法則に基づき、1人当たりGDPの上昇とともに就業重心は第1次→第2次→第3次産業へと移行する（途上国の都市サービス膨張にも留意）。',
    detailNotes: pickedSec.map((c, i) => {
      const sh = c.stats!.sectorShare;
      return `${labels[i]}（${cleanCountryName(c.nameJa)}）：1次 ${sh.primaryPct}% / 2次 ${sh.secondaryPct}% / 3次 ${sh.tertiaryPct}%（1人GDP $${c.stats!.gdpPerCapitaUsd.toLocaleString()}）`;
    }),
    relatedIso3s: pickedSec.map((c) => c.iso3),
  };
}

// ============================================================================
// 6. 時系列・推移グラフ読取（折れ線グラフ6択 ＋ 時系列3時点表）
// ============================================================================

function makeTimeShiftQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  sliders: TimeSeriesSliderItem[],
  nonce: number,
): GeneratedDrillQuestion | null {
  // 約55%: comparisonCharts の折れ線グラフ (line) から3系列（サ・シ・ス）を6択で判別
  const lineCharts = (worldRankings?.comparisonCharts ?? []).filter(
    (ch) => ch.kind === 'line' && ch.categories && ch.categories.length >= 5 && ch.series.length >= 3,
  );
  if (lineCharts.length > 0 && Math.random() < 0.55) {
    const nameToIso = new Map<string, string>();
    for (const c of Object.values(countries)) {
      nameToIso.set(cleanCountryName(c.nameJa), c.iso3);
    }

    for (const ch of shuffle(lineCharts)) {
      // 'EU27合計' のような集計と単独国が混ざらないよう判定
      const isRegionalChart = ch.series.some((s) => s.name === '世界平均' || s.name === '北アメリカ');
      const eligibleSeries = isRegionalChart
        ? ch.series.filter((s) => s.name !== '世界平均')
        : ch.series.filter((s) => s.name !== 'EU27合計' && s.name !== '世界平均');

      if (eligibleSeries.length < 3) continue;

      const scale = Math.max(1e-6, ...eligibleSeries.flatMap((s) => s.values.map(Math.abs)));
      const picked: typeof eligibleSeries = [];
      for (const s of shuffle(eligibleSeries)) {
        const distinct = picked.every((p) => {
          const maxD = Math.max(...s.values.map((v, i) => Math.abs(v - p.values[i]) / scale));
          return maxD >= 0.14;
        });
        if (distinct) {
          picked.push(s);
          if (picked.length === 3) break;
        }
      }
      if (picked.length < 3) continue;

      const codes: [string, string, string] = ['サ', 'シ', 'ス'];
      const names = picked.map((s) => cleanCountryName(s.name)) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(codes, names);

      return {
        id: `drill_ts_${nonce}`,
        genre: 'time_shift',
        genreLabel: '時系列・推移グラフ読取',
        promptTitle: `推移グラフ「${ch.title.split('（')[0]}」の判別`,
        promptBody: `次のグラフ中の サ〜ス は、${sortJa(names).join('、')}のいずれかの${isRegionalChart ? '地域' : '国'}における「${ch.title.split('（')[0]}」（単位：${ch.unit}）の推移を示している。名称と サ〜ス との正しい組合せを選びなさい。`,
        lineTrend: {
          title: ch.title.split('（')[0],
          unit: ch.unit,
          xLabels: ch.categories!,
          series: picked.map((s, i) => ({
            code: codes[i],
            values: s.values,
            color: LINE_COLORS[i],
          })),
        },
        choices,
        correctIndex,
        explanation: ch.examPoint ?? ch.note ?? `${ch.title} の変化傾向や逆転時期を手がかりに判別する。`,
        detailNotes: picked.map((s, i) => {
          const first = s.values[0];
          const last = s.values[s.values.length - 1];
          return `${codes[i]}＝${names[i]}：${ch.categories![0]}(${first}) → ${ch.categories![ch.categories!.length - 1]}(${last}${ch.unit})`;
        }),
        relatedIso3s: names
          .map((n) => nameToIso.get(n))
          .filter((id): id is string => Boolean(id)),
      };
    }
  }

  // フォールバック & 約45%: timeSliders の3時点数値表（periodNoteネタバレ除去）
  const valid = sliders.filter((s) => s.frames.length >= 2 && s.frames[0].items.length >= 3);
  if (valid.length < 4) return null;

  const target = shuffle(valid)[0];
  const sameCat = shuffle(valid.filter((s) => s.id !== target.id && s.category === target.category));
  const otherCat = shuffle(valid.filter((s) => s.id !== target.id && s.category !== target.category));
  const picked = [target, ...sameCat, ...otherCat].slice(0, 4);

  const midIdx = Math.floor((target.frames.length - 1) / 2);
  const chosenFrames =
    target.frames.length >= 3
      ? [target.frames[0], target.frames[midIdx], target.frames[target.frames.length - 1]]
      : [target.frames[0], target.frames[target.frames.length - 1]];

  const rows = chosenFrames.map((fr) => [
    fr.yearLabel,
    fr.items
      .slice(0, 4)
      .map((it, idx) => `${idx + 1}. ${cleanCountryName(it.label)}(${it.value}${target.unit})`)
      .join(' ／ '),
  ]);

  const cleanTitle = (s: TimeSeriesSliderItem) => s.title.split('（')[0].trim();
  const answer = cleanTitle(target);
  const choices = shuffle(picked.map(cleanTitle));

  return {
    id: `drill_ts_${nonce}`,
    genre: 'time_shift',
    genreLabel: '時系列・推移グラフ読取',
    promptTitle: '時系列統計の数値推移からのテーマ特定',
    promptBody:
      '下の表は、ある地理統計テーマにおける複数時点の上位・構成比推移（数値のみ）を示している。このデータが示す主題として最も適当なものを選びなさい。',
    table: {
      caption: `時系列データ推移（${chosenFrames[0].yearLabel} → ${chosenFrames[chosenFrames.length - 1].yearLabel}）`,
      headers: ['時点', '上位・構成比の推移'],
      rows,
    },
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」。要点：${target.shiftSummary}`,
    detailNotes: chosenFrames.map((fr) => `${fr.yearLabel}の背景：${fr.periodNote}`),
    relatedIso3s: target.relatedIso3s.slice(0, 4),
  };
}

// ============================================================================
// 7. 雨温図・ハイサーグラフ判別（共通スケール単一＆2都市比較）
// ============================================================================

function makeClimateCoordsQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const pool: { country: CountryData; city: ClimateCity }[] = [];
  for (const c of Object.values(countries)) {
    for (const ct of c.climate.cities) {
      if (ct.monthlyTempC.length === 12 && ct.monthlyPrecipMm.length === 12) {
        pool.push({ country: c, city: ct });
      }
    }
  }
  if (pool.length < 4) return null;

  const picked: typeof pool = [];
  const usedKoppen = new Set<string>();
  for (const entry of shuffle(pool)) {
    if (usedKoppen.has(entry.city.koppenCode)) continue;
    picked.push(entry);
    usedKoppen.add(entry.city.koppenCode);
    if (picked.length === 4) break;
  }
  if (picked.length < 4) return null;

  const chartType: 'climograph' | 'hythergraph' = Math.random() < 0.35 ? 'hythergraph' : 'climograph';
  const labelFor = (p: (typeof pool)[number]) =>
    `${p.city.nameJa}（${cleanCountryName(p.country.nameJa)}）`;
  const hemiLabel = (ct: ClimateCity) =>
    ct.lat >= 0 ? `北緯${Math.abs(ct.lat).toFixed(1)}°` : `南緯${Math.abs(ct.lat).toFixed(1)}°`;
  const elevText = (ct: ClimateCity) =>
    ct.elevationM != null ? `・標高約${ct.elevationM}m` : '';

  if (Math.random() < 0.45) {
    const [pA, pB, pC] = picked;
    const nA = labelFor(pA);
    const nB = labelFor(pB);
    const nC = labelFor(pC);
    const perms: [string, string][] = [
      [nA, nB],
      [nB, nA],
      [nA, nC],
      [nC, nB],
    ];
    const answer = `ア：${nA} ／ イ：${nB}`;
    const choices = shuffle(Array.from(new Set(perms.map(([x, y]) => `ア：${x} ／ イ：${y}`))));
    if (choices.length === 4) {
      return {
        id: `drill_cl_${nonce}`,
        genre: 'climate_coords',
        genreLabel: '雨温図・ハイサーグラフ',
        promptTitle: `2地点の${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}比較判別`,
        promptBody: `下の2つの${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}（ア・イ、縦横軸は共通スケール）と緯度・標高条件から、各地点の都市の正しい組合せを選びなさい。`,
        climateChartType: chartType,
        climateCities: [
          { label: '地点ア', city: pA.city, metaText: `${hemiLabel(pA.city)}${elevText(pA.city)}` },
          { label: '地点イ', city: pB.city, metaText: `${hemiLabel(pB.city)}${elevText(pB.city)}` },
        ],
        choices,
        correctIndex: choices.indexOf(answer),
        explanation:
          '気温の季節ピーク（7月高温＝北半球／1月高温＝南半球・赤道直下は年較差極小）と、降水が夏集中か冬集中か（地中海性Csは夏乾燥・冬多雨）を比較して判別する。',
        detailNotes: [pA, pB, pC].map(
          (p) =>
            `${labelFor(p)}：${p.city.koppenCode}（${p.city.koppenNameJa ?? ''}）— ${p.city.factors.slice(0, 2).join('・')}`,
        ),
        relatedIso3s: [pA, pB, pC].map((p) => p.country.iso3),
      };
    }
  }

  const target = picked[0];
  const { city } = target;
  const answer = labelFor(target);
  const choices = shuffle(picked.map(labelFor));

  return {
    id: `drill_cl_${nonce}`,
    genre: 'climate_coords',
    genreLabel: '雨温図・ハイサーグラフ',
    promptTitle: `${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}と緯度・標高からの都市特定`,
    promptBody: `下の${chartType === 'hythergraph' ? 'ハイサーグラフ（横軸:降水量・縦軸:気温）' : '雨温図'}に該当する都市（条件：${hemiLabel(city)}${elevText(city)}）として最も適当なものを選びなさい。`,
    climateChartType: chartType,
    climateCity: city,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は ${answer}（気候区分 ${city.koppenCode}：${city.koppenNameJa ?? ''}）。要因：${city.factors.slice(0, 2).join('／')}。`,
    detailNotes: picked.map(
      (p) => `${labelFor(p)}：${p.city.koppenCode}（${hemiLabel(p.city)}${elevText(p.city)}）`,
    ),
    relatedIso3s: picked.map((p) => p.country.iso3),
  };
}

// ============================================================================
// 8. 人口ピラミッド判別（全収録国9階級対応・2国並列比較付き）
// ============================================================================

function makePyramidQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const pool = Object.values(countries).filter(
    (c) =>
      c.stats &&
      c.stats.population >= 1_000_000 &&
      c.stats.agePyramid &&
      c.stats.agePyramid.length >= 8,
  );
  if (pool.length < 4) return null;

  const picked: CountryData[] = [];
  const usedTypes = new Set<string>();
  for (const c of shuffle(pool)) {
    const t = c.stats!.pyramidType || '標準';
    if (!usedTypes.has(t)) {
      picked.push(c);
      usedTypes.add(t);
    }
    if (picked.length === 4) break;
  }
  if (picked.length < 4) {
    for (const c of shuffle(pool)) {
      if (!picked.some((p) => p.iso3 === c.iso3)) picked.push(c);
      if (picked.length === 4) break;
    }
  }
  if (picked.length < 4) return null;

  if (Math.random() < 0.4) {
    const [pA, pB, pC] = picked;
    const nA = cleanCountryName(pA.nameJa);
    const nB = cleanCountryName(pB.nameJa);
    const nC = cleanCountryName(pC.nameJa);
    const perms: [string, string][] = [
      [nA, nB],
      [nB, nA],
      [nA, nC],
      [nC, nB],
    ];
    const answer = `ア：${nA} ／ イ：${nB}`;
    const choices = shuffle(Array.from(new Set(perms.map(([x, y]) => `ア：${x} ／ イ：${y}`))));
    if (choices.length === 4) {
      return {
        id: `drill_pyr_${nonce}`,
        genre: 'pyramid_match',
        genreLabel: '人口ピラミッド判別',
        promptTitle: '2カ国の人口ピラミッド形状比較による判別',
        promptBody: `下の2つの人口ピラミッド（ア・イ）は、${sortJa([nA, nB, nC]).join('、')}のうちのいずれか2カ国を示している。正しい組合せを選びなさい。`,
        pyramidPair: [
          { label: '国ア', bins: pA.stats!.agePyramid },
          { label: '国イ', bins: pB.stats!.agePyramid },
        ],
        choices,
        correctIndex: choices.indexOf(answer),
        explanation:
          '富士山形・釣鐘形・つぼ形・特定年齢層の男性突出（中東産油国等）など、出生率と男女別生産年齢層の突出・くびれを見比べて判別する。',
        detailNotes: picked.map(
          (c) =>
            `${cleanCountryName(c.nameJa)}：${c.stats!.pyramidType}（出生率 ${c.stats!.fertilityRate?.toFixed(2) ?? '-'}・都市率 ${c.stats!.urbanPopRatePct}%・1人GDP $${c.stats!.gdpPerCapitaUsd.toLocaleString()}）`,
        ),
        relatedIso3s: picked.map((c) => c.iso3),
      };
    }
  }

  const target = picked[0];
  const answer = cleanCountryName(target.nameJa);
  const choices = shuffle(picked.map((c) => cleanCountryName(c.nameJa)));

  return {
    id: `drill_pyr_${nonce}`,
    genre: 'pyramid_match',
    genreLabel: '人口ピラミッド判別',
    promptTitle: '年齢階層・男女別人口ピラミッドからの国名特定',
    promptBody: '下の人口ピラミッドに当てはまる国として最も適当なものを選びなさい。',
    pyramidBins: target.stats!.agePyramid,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」（形状類型：${target.stats!.pyramidType}、出生率 ${target.stats!.fertilityRate?.toFixed(2) ?? '-'}、1人GDP $${target.stats!.gdpPerCapitaUsd.toLocaleString()}）。`,
    detailNotes: picked.map(
      (c) =>
        `${cleanCountryName(c.nameJa)}：${c.stats!.pyramidType}（出生率 ${c.stats!.fertilityRate?.toFixed(2) ?? '-'}・都市率 ${c.stats!.urbanPopRatePct}%）`,
    ),
    relatedIso3s: picked.map((c) => c.iso3),
  };
}

// ============================================================================
// 9. 景観写真・地域推論
// ============================================================================

function makePhotoInferQuestion(
  entries: PhotoEncyclopediaEntry[],
  nonce: number,
): GeneratedDrillQuestion | null {
  if (entries.length < 4) return null;

  const target = shuffle(entries)[0];
  const sameCat = shuffle(
    entries.filter((e) => e.id !== target.id && e.category === target.category),
  );
  const otherCat = shuffle(
    entries.filter((e) => e.id !== target.id && e.category !== target.category),
  );
  const picked = [target, ...sameCat, ...otherCat].slice(0, 4);

  const formatChoice = (e: PhotoEncyclopediaEntry) => `${e.title}（${e.locationLabel}）`;
  const answer = formatChoice(target);
  const choices = shuffle(picked.map(formatChoice));

  return {
    id: `drill_ph_${nonce}`,
    genre: 'photo_infer',
    genreLabel: '景観写真・地域推論',
    promptTitle: '景観写真からの気候・農業・生活地域推論',
    promptBody:
      '下の景観写真に見られる地形・植生・土地利用・建築様式の手がかりから、最も適切に該当する景観・地域を選びなさい。',
    photoUrl: target.photoUrl,
    visualClues: target.visualClues,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」（気候 ${target.koppenCodes.join('/')}）。因果推論：${target.inferenceSummary}`,
    detailNotes: [`着眼点と試験での見分け方：${target.examPoint}`],
    relatedIso3s: target.relatedIso3s,
  };
}

/**
 * 指定ジャンル（または全ジャンルおまかせ）の実戦問題をデータから自動生成する
 */
export function generateDrillQuestion(
  genre: DrillGenre,
  params: {
    worldRankings: WorldRankingsDataset | null;
    countriesData: Record<string, CountryData>;
    timeSliders: TimeSeriesSliderItem[];
    photoEncyclopedia: PhotoEncyclopediaEntry[];
  },
  nonce: number,
): GeneratedDrillQuestion | null {
  const candidates: Exclude<DrillGenre, 'all'>[] =
    genre === 'all' ? shuffle(ALL_WEIGHTED_GENRES) : [genre];

  for (const g of candidates) {
    let q: GeneratedDrillQuestion | null = null;
    if (g === 'stat_country') {
      q = makeStatCountryQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'stat_double_blind') {
      q = makeStatDoubleBlindQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'stat_item') {
      q = makeStatItemQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'scatter_plot') {
      q = makeScatterPlotQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'composition_bar') {
      q = makeCompositionBarQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'time_shift') {
      q = makeTimeShiftQuestion(
        params.worldRankings,
        params.countriesData,
        params.timeSliders,
        nonce,
      );
    } else if (g === 'climate_coords') {
      q = makeClimateCoordsQuestion(params.countriesData, nonce);
    } else if (g === 'pyramid_match') {
      q = makePyramidQuestion(params.countriesData, nonce);
    } else if (g === 'photo_infer') {
      q = makePhotoInferQuestion(params.photoEncyclopedia, nonce);
    }
    if (q) return q;
  }
  return null;
}
