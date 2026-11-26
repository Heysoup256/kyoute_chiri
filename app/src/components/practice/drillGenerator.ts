import type {
  AgePyramidBin,
  ClimateCity,
  CountryData,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';

export type DrillGenre =
  | 'all'
  | 'ranking_matrix'
  | 'scatter_plot'
  | 'composition_bar'
  | 'regional_stats'
  | 'climate_coords'
  | 'pyramid_match'
  | 'time_shift'
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

export interface GeneratedDrillQuestion {
  id: string;
  genre: Exclude<DrillGenre, 'all'>;
  genreLabel: string;
  promptTitle: string;
  promptBody: string;
  table?: { caption?: string; headers: string[]; rows: string[][] };
  scatterPlot?: ScatterDrillSpec;
  stackedBars?: StackedBarDrillSpec;
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
  { id: 'ranking_matrix', label: '統計・生産vs輸出' },
  { id: 'scatter_plot', label: '散布図・2指標分析' },
  { id: 'composition_bar', label: '構成比グラフ読取' },
  { id: 'regional_stats', label: '地域内・中堅国統計' },
  { id: 'climate_coords', label: '雨温図・ハイサーグラフ' },
  { id: 'pyramid_match', label: '人口ピラミッド判別' },
  { id: 'time_shift', label: '時代変化データ読取' },
  { id: 'photo_infer', label: '景観写真・地域推論' },
];

const POINT_COLORS = ['#4f46e5', '#e11d48', '#059669', '#d97706'];
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

// ============================================================================
// 1. 統計ランキング（単一指標厳密抽出・生産vs輸出対比）
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
const GENERIC_METRIC_RE =
  /^(生産量|輸出量|輸入量|産出量|飼育頭数|総生産量|新地金生産|受取金額|対GDP比|登録件数|設備容量|生産・新車販売|年間新規導入台数|登録船腹量|1人当たり消費|丸太総生産|養殖生産量|海面天然漁獲量|高出生率|低出生率|ジニ係数|登録数|貿易依存度|第1位都市圏 人口集中率)$/;

const SELF_CONTAINED_TOPIC_TOKENS = [
  'じゃがいも',
  'キャッサバ',
  'オリーブ',
  'ワイン',
  '牛肉',
  '豚肉',
  '羊',
  '水牛',
  'さとうきび',
  'てんさい',
  'バナナ',
  'ぶどう',
  'ボーキサイト',
  'アルミニウム',
  '金鉱',
  '金産出',
  '銀産出',
  'ダイヤ',
  'マンガン',
  'クロム',
  'スズ',
  'タングステン',
  'リチウム',
  'コバルト',
  'ウラン',
  '原子力',
  'ニッケル',
  '風力',
  '水力',
  '太陽光',
  '地熱',
  'パルプ',
  '食肉',
  '魚介',
  'コーヒー',
  '米消費',
  '原油',
  '天然ガス',
  'LNG',
  '石炭',
  '鉄鉱石',
  '鉄鋼',
  '銅鉱',
  '新造船',
  '便宜置籍',
  '航空貨物',
  '国際線旅客',
  'コンテナ港',
  '移民',
  '外国人',
  '個人送金',
  '女性国会議員',
  '医師',
  'CO₂',
  'HDI',
  '電子政府',
  '水資源',
  '水ストレス',
  '半導体',
  'ロボット',
  '衣料品',
  '再エネ',
  '自動車',
  '粗鋼',
  '紙・板紙',
  'パーム油',
  '海面漁獲',
  '水産養殖',
  '老年人口',
  'ICT・デジタル',
  'インターネット',
  '女性労働力率',
  '難民',
];

function extractBaseTopic(itemTitle: string): string {
  const beforeParen = itemTitle.split('（')[0].trim();
  const splitVs = beforeParen
    .split(/\s+vs\s+|\s+輸出|\s+輸入|\s+産出|\s+生産|\s+設備|\s+発電/i)[0]
    .trim();
  if (splitVs === '原油・石油') return '原油';
  if (splitVs === 'パーム油・アブラヤシ') return 'パーム油';
  if (splitVs === '金・ダイヤモンド') return '金';
  if (splitVs === '世界遺産登録数') return '世界遺産';
  if (splitVs === '1人当たりエネルギー消費・CO₂排出量') return '一次エネルギー';
  if (splitVs === '太陽光・風力発電量') return '風力・太陽光発電';
  return splitVs;
}

function buildCleanMetricLabel(itemTitle: string, rawLabel: string): string {
  const base = extractBaseTopic(itemTitle);
  const sub = rawLabel
    .split('（')[0]
    .replace(/上位国$/u, '')
    .replace(/上位$/u, '')
    .trim();

  if (!sub) return base;

  const isGeneric =
    GENERIC_METRIC_RE.test(sub) ||
    sub.length <= 5 ||
    !SELF_CONTAINED_TOPIC_TOKENS.some((tok) => sub.includes(tok));

  if (!isGeneric) {
    return sub;
  }

  // 一部だけ話題名と被るケースを整形
  if (base === 'ビール生産量' || itemTitle.startsWith('ビール生産量')) {
    if (sub === '総生産量') return 'ビールの総生産量';
    if (sub === '1人当たり消費') return '1人当たりビール消費量';
  }
  if (itemTitle.startsWith('国際出稼ぎ個人送金')) {
    return `出稼ぎ個人送金（${sub}）`;
  }
  if (itemTitle.startsWith('第1位都市') || sub.startsWith('第1位都市圏')) {
    return '首位都市圏の人口集中率';
  }
  if (sub === '貿易依存度' || sub === '登録件数') {
    return sub === '貿易依存度' ? '貿易依存度' : '世界遺産の登録件数';
  }
  if (sub.includes('高出生率')) return '合計特殊出生率（高位国）';
  if (sub.includes('低出生率')) return '合計特殊出生率（低位国）';
  if (sub === '老年人口') return '老年人口割合（高齢化率）';
  if (sub === 'ジニ係数 高') return '所得格差（ジニ係数高水準）';

  const cleanBase = base.split('・')[0].split('＆')[0].trim();
  if (sub.includes(cleanBase)) return sub;
  return `${cleanBase}の${sub}`;
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
      // 元リストの上位3以内に除外語や地域総称が入っていたものを防ぐ
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

function makeRankingMatrixQuestion(
  dataset: WorldRankingsDataset,
  nonce: number,
): GeneratedDrillQuestion | null {
  const metrics = extractCleanRankingMetrics(dataset);
  if (metrics.length < 3) return null;

  // 同一親項目内の対比ペア（例：生産量 vs 輸出量、輸出量 vs 輸入量、ボーキサイト vs アルミ精錬）
  const byParent = new Map<string, CleanRankingMetric[]>();
  for (const m of metrics) {
    const list = byParent.get(m.parentId) ?? [];
    list.push(m);
    byParent.set(m.parentId, list);
  }
  const contrastPairs: [CleanRankingMetric, CleanRankingMetric][] = [];
  for (const list of byParent.values()) {
    if (list.length === 2) {
      const aTop = list[0].entries
        .slice(0, 3)
        .map((e) => e.nameJa)
        .join('|');
      const bTop = list[1].entries
        .slice(0, 3)
        .map((e) => e.nameJa)
        .join('|');
      if (aTop !== bTop && list[0].metricLabel !== list[1].metricLabel) {
        contrastPairs.push([list[0], list[1]]);
      }
    }
  }

  let picked: CleanRankingMetric[] | null = null;
  let isContrastMode = false;

  if (contrastPairs.length > 0 && Math.random() < 0.45) {
    const [pA, pB] = shuffle(contrastPairs)[0];
    const usedTopSignatures = new Set([
      pA.entries
        .slice(0, 3)
        .map((e) => e.nameJa)
        .join('|'),
      pB.entries
        .slice(0, 3)
        .map((e) => e.nameJa)
        .join('|'),
    ]);
    const thirdCandidates = shuffle(
      metrics.filter(
        (m) =>
          m.parentId !== pA.parentId &&
          m.category === pA.category &&
          !usedTopSignatures.has(
            m.entries
              .slice(0, 3)
              .map((e) => e.nameJa)
              .join('|'),
          ),
      ),
    );
    if (thirdCandidates.length > 0) {
      picked = shuffle([pA, pB, thirdCandidates[0]]);
      isContrastMode = true;
    }
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

  if (!picked || picked.length < 3) return null;

  const use4Cols = picked.every((m) => m.entries.length >= 4);
  const [a, b, c] = picked;
  const rows = [a, b, c].map((m, idx) => {
    const label = ['ア', 'イ', 'ウ'][idx];
    const cols = [m.entries[0].nameJa, m.entries[1].nameJa, m.entries[2].nameJa];
    if (use4Cols) cols.push(m.entries[3].nameJa);
    return [label, ...cols];
  });

  const lA = a.metricLabel;
  const lB = b.metricLabel;
  const lC = c.metricLabel;
  const perms: [string, string, string][] = isContrastMode
    ? [
        [lA, lB, lC],
        [lB, lA, lC],
        [lA, lC, lB],
        [lC, lA, lB],
      ]
    : [
        [lA, lB, lC],
        [lA, lC, lB],
        [lB, lA, lC],
        [lC, lB, lA],
      ];

  const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
  const choices = shuffle(
    Array.from(new Set(perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`))),
  );
  if (choices.length < 4) return null;

  const isos = Array.from(
    new Set(picked.flatMap((m) => m.entries.slice(0, 2).map((e) => e.iso3)).filter((id) => id.length === 3)),
  );

  return {
    id: `drill_rm_${nonce}`,
    genre: 'ranking_matrix',
    genreLabel: '統計・生産vs輸出',
    promptTitle: isContrastMode
      ? '生産・輸出・輸入の順位入れ替わり判別'
      : `統計上位${use4Cols ? 4 : 3}カ国の組合せ特定`,
    promptBody: isContrastMode
      ? '下の表のア〜ウは、生産量・輸出量・輸入量（または原料と精錬）など関連統計の上位国を示している。ア〜ウに該当する統計項目の正しい組合せを選びなさい。'
      : `下の表は農林水産・鉱工業・人口社会統計のいずれか3項目（ア〜ウ）について、世界上位${use4Cols ? 4 : 3}カ国を示したものである。ア〜ウに該当する項目の正しい組合せを選びなさい。`,
    table: {
      caption: `項目別の世界上位${use4Cols ? 4 : 3}カ国`,
      headers: use4Cols
        ? ['項目', '第1位', '第2位', '第3位', '第4位']
        : ['項目', '第1位', '第2位', '第3位'],
      rows,
    },
    choices,
    correctIndex: choices.indexOf(answerText),
    explanation: isContrastMode
      ? '「生産量上位国（内需大国を含む）」と「輸出量・輸入量・加工生産上位国」の違いに着目するのが統計問題の定石。'
      : '各項目の第1位だけでなく、2〜4位に並ぶ資源国・新興国・輸出特化国の顔ぶれを組み合わせて判別する。',
    detailNotes: [a, b, c].map((m, idx) => {
      const topVals = m.entries
        .slice(0, 4)
        .map((e) => `${e.nameJa}(${e.value}${m.unit ? m.unit : ''})`)
        .join('・');
      return `${['ア', 'イ', 'ウ'][idx]}：${m.metricLabel}［${topVals}］ — ${m.examTrap}`;
    }),
    relatedIso3s: isos.slice(0, 5),
  };
}

// ============================================================================
// 2. 散布図・2指標分析（収録9散布図 ＋ 全159カ国動的生成）
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
    title: '1人当たりGDP × 合計特殊出生率（全収録国比較）',
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
    title: '第1次産業就業率 × 都市人口率（全収録国比較）',
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
    title: '1人当たりGDP × 出稼ぎ個人送金受取（対GDP比）',
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
    title: '女性労働力率（15歳以上） × 合計特殊出生率',
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
    title: '年降水量目安 × 平均標高（自然環境比較）',
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
    title: '人口密度 × 都市人口率（土地利用・居住構造比較）',
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

  // 非Sランク重みが大きいものほど先頭に来やすくなるよう重み付きシャッフル
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
  const usePreset = scatters.length > 0 && Math.random() < 0.45;

  if (usePreset) {
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

      const targetPoints = targets.map((t, i) => ({
        code: codes[i],
        x: t.x,
        y: t.y,
        color: POINT_COLORS[i],
      }));

      const choices = shuffle(targets.map((t) => t.nameJa));
      return {
        id: `drill_sc_${nonce}`,
        genre: 'scatter_plot',
        genreLabel: '散布図・2指標分析',
        promptTitle: `散布図の特定点「${codes[targetIdx]}」の判別`,
        promptBody: `下の散布図（${sc.title.split('（')[0]}）において、図中の点「${codes[targetIdx]}」に該当する国として最も適当なものを選びなさい（灰色の点は比較用の他国データ）。`,
        scatterPlot: {
          title: sc.title.split('（')[0],
          xLabel: sc.xLabel,
          yLabel: sc.yLabel,
          backgroundPoints,
          targetPoints,
        },
        choices,
        correctIndex: choices.indexOf(target.nameJa),
        explanation: sc.examPoint,
        detailNotes: targets.map(
          (t, i) =>
            `点${codes[i]}＝${t.nameJa}（${t.x} / ${t.y}${t.note ? `：${t.note}` : ''}）`,
        ),
        relatedIso3s: targets.map((t) => t.iso3).filter((id) => id.length === 3),
      };
    }
  }

  // Pool B: 全159カ国実データから動的生成（非上位・中堅国を積極活用）
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

    // 出稼ぎ送金等、外れ値が強すぎる極端1点だけで軸が潰れないよう、背景点は上位95%範囲でクリップまたは通常利用
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
    const choices = shuffle(targets.map((t) => t.nameJa));

    return {
      id: `drill_sc_${nonce}`,
      genre: 'scatter_plot',
      genreLabel: '散布図・2指標分析',
      promptTitle: `散布図の特定点「${codes[targetIdx]}」に当てはまる国の特定`,
      promptBody: `下の散布図は人口100万人以上の各国データに基づく「${def.title}」である。図中の点「${codes[targetIdx]}」に該当する国を、地域の経済水準・人口・自然条件から選びなさい。`,
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
      choices,
      correctIndex: choices.indexOf(target.nameJa),
      explanation: `正解は「${target.nameJa}」。${target.note}。横軸（${def.xLabel}）と縦軸（${def.yLabel}）の相対位置を他の3点と対比して見極める。`,
      detailNotes: targets.map((t, i) => `点${codes[i]}：${t.note}`),
      relatedIso3s: targets.map((t) => t.iso3),
    };
  }

  return null;
}

// ============================================================================
// 3. 構成比グラフ読取（100%横帯：比較グラフ＋全収録国の産業・宗教構成）
// ============================================================================

function mapReligionBucket(name: string): string | null {
  const safeSameGroupMulti =
    name.includes('カトリック・プロテスタント') ||
    name.includes('プロテスタント・カトリック') ||
    name.startsWith('無宗教・他') ||
    name.startsWith('無宗教・その他');
  if (name.includes('・') && !safeSameGroupMulti) {
    return null;
  }
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

  // Pool A: comparisonCharts の積み上げ棒グラフ (約55%)
  if (charts.length > 0 && Math.random() < 0.55) {
    for (const ch of shuffle(charts)) {
      const cats = ch.categories!;
      const indices = shuffle(cats.map((_, idx) => idx));
      const pickedIndices: number[] = [];

      // 構成比パターンが十分異なる3カ国を選ぶ（L1差合計 >= 25）
      for (const idx of indices) {
        const vec = ch.series.map((s) => s.values[idx] ?? 0);
        const sum = vec.reduce((a, b) => a + b, 0);
        if (sum <= 0) continue;
        const distinct = pickedIndices.every((pi) => {
          const pVec = ch.series.map((s) => s.values[pi] ?? 0);
          const l1 = vec.reduce((acc, v, si) => acc + Math.abs(v - pVec[si]), 0);
          return l1 >= 25;
        });
        if (distinct) {
          pickedIndices.push(idx);
          if (pickedIndices.length === 3) break;
        }
      }
      if (pickedIndices.length < 3) continue;

      const labels = ['ア', 'イ', 'ウ'];
      const chosenNames = pickedIndices.map((idx) => cleanCountryName(cats[idx]));
      const [nA, nB, nC] = chosenNames;
      const perms: [string, string, string][] = [
        [nA, nB, nC],
        [nA, nC, nB],
        [nB, nA, nC],
        [nC, nB, nA],
      ];
      const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
      const choices = shuffle(
        Array.from(new Set(perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`))),
      );
      if (choices.length < 4) continue;

      const findIso = (n: string) =>
        Object.values(countries).find((c) => cleanCountryName(c.nameJa) === n)?.iso3;

      return {
        id: `drill_cb_${nonce}`,
        genre: 'composition_bar',
        genreLabel: '構成比グラフ読取',
        promptTitle: `${ch.title.split('（')[0]}の国名判別`,
        promptBody: `下の帯グラフ（ア〜ウ）は3カ国における「${ch.title.split('（')[0]}」の構成比を示している。ア〜ウに該当する国の正しい組合せを選びなさい。`,
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
        correctIndex: choices.indexOf(answerText),
        explanation: ch.examPoint ?? ch.note ?? `${ch.title}の特徴から3カ国を識別する。`,
        detailNotes: pickedIndices.map((ci, idx) => {
          const vals = ch.series.map((s) => `${s.name}:${s.values[ci] ?? 0}${ch.unit}`).join('・');
          return `${labels[idx]}（${chosenNames[idx]}）：${vals}`;
        }),
        relatedIso3s: chosenNames.map(findIso).filter((id): id is string => Boolean(id)),
      };
    }
  }

  // Pool B: 全収録国の実データ（産業別就業構成比 / 宗教構成比）
  const useReligion = Math.random() < 0.4;
  if (useReligion) {
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
      const distinct = picked.every((p) => {
        const l1 = item.vec.reduce((acc, v, i) => acc + Math.abs(v - p.vec[i]), 0);
        return l1 >= 35;
      });
      if (distinct) {
        picked.push(item);
        if (picked.length === 3) break;
      }
    }
    if (picked.length === 3) {
      const [nA, nB, nC] = picked.map((p) => cleanCountryName(p.country.nameJa));
      const perms: [string, string, string][] = [
        [nA, nB, nC],
        [nA, nC, nB],
        [nB, nA, nC],
        [nC, nB, nA],
      ];
      const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
      const choices = shuffle(
        Array.from(new Set(perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`))),
      );
      if (choices.length === 4) {
        return {
          id: `drill_cb_${nonce}`,
          genre: 'composition_bar',
          genreLabel: '構成比グラフ読取',
          promptTitle: '宗教別人口構成比からの国名判別',
          promptBody:
            '下の帯グラフ（ア〜ウ）は3カ国の主な宗教構成比（%）を示している。ア〜ウに該当する国の正しい組合せを選びなさい。',
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
            rows: picked.map((p, i) => ({
              label: ['ア', 'イ', 'ウ'][i],
              values: p.vec,
            })),
          },
          choices,
          correctIndex: choices.indexOf(answerText),
          explanation:
            '旧宗主国・歴史的伝播（中南米・欧州のキリスト教、北アフリカ・西アジアのイスラム教、東・北欧の無宗教割合、混合国の割合）を手がかりに判別する。',
          detailNotes: picked.map((p, i) => {
            const raw = p.country.cultureAndHistory.religions
              .map((r) => `${r.name}${r.percent != null ? `${r.percent}%` : ''}`)
              .join('・');
            return `${['ア', 'イ', 'ウ'][i]}（${cleanCountryName(p.country.nameJa)}）：${raw}`;
          }),
          relatedIso3s: picked.map((p) => p.country.iso3),
        };
      }
    }
  }

  // 産業3部門就業構成比（非上位国・基礎収録国含む全159カ国対象）
  const sectorPool = Object.values(countries).filter(
    (c) => c.stats && c.stats.population >= 1_000_000 && c.stats.sectorShare,
  );
  const pickedSec: CountryData[] = [];
  // 多様な段階（1次主体 / 2次厚め / 3次主体）を取りやすくする
  for (const c of shuffle(sectorPool)) {
    const s = c.stats!.sectorShare;
    const vec = [s.primaryPct, s.secondaryPct, s.tertiaryPct];
    const distinct = pickedSec.every((p) => {
      const ps = p.stats!.sectorShare;
      const l1 =
        Math.abs(vec[0] - ps.primaryPct) +
        Math.abs(vec[1] - ps.secondaryPct) +
        Math.abs(vec[2] - ps.tertiaryPct);
      return l1 >= 34;
    });
    if (distinct) {
      pickedSec.push(c);
      if (pickedSec.length === 3) break;
    }
  }
  if (pickedSec.length < 3) return null;

  const [sA, sB, sC] = pickedSec.map((c) => cleanCountryName(c.nameJa));
  const perms: [string, string, string][] = [
    [sA, sB, sC],
    [sA, sC, sB],
    [sB, sA, sC],
    [sC, sB, sA],
  ];
  const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
  const choices = shuffle(
    Array.from(new Set(perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`))),
  );
  if (choices.length < 4) return null;

  return {
    id: `drill_cb_${nonce}`,
    genre: 'composition_bar',
    genreLabel: '構成比グラフ読取',
    promptTitle: '産業別就業人口構成（1次・2次・3次）からの国名特定',
    promptBody:
      '下の帯グラフ（ア〜ウ）は3カ国の産業部門別就業人口割合（%）を示している。経済発展段階と地域特性から、ア〜ウに該当する国の正しい組合せを選びなさい。',
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
        return {
          label: ['ア', 'イ', 'ウ'][i],
          values: [sh.primaryPct, sh.secondaryPct, sh.tertiaryPct],
        };
      }),
    },
    choices,
    correctIndex: choices.indexOf(answerText),
    explanation:
      'ペティ＝クラークの法則に基づき、1人当たりGDPの上昇とともに就業重心は第1次→第2次→第3次産業へと移行する（途上国の都市サービス膨張にも留意）。',
    detailNotes: pickedSec.map((c, i) => {
      const sh = c.stats!.sectorShare;
      return `${['ア', 'イ', 'ウ'][i]}（${cleanCountryName(c.nameJa)}）：1次 ${sh.primaryPct}% / 2次 ${sh.secondaryPct}% / 3次 ${sh.tertiaryPct}%（1人GDP $${c.stats!.gdpPerCapitaUsd.toLocaleString()}）`;
    }),
    relatedIso3s: pickedSec.map((c) => c.iso3),
  };
}

// ============================================================================
// 4. 地域内・中堅国統計比較（全159カ国対象：Sランク以外の非上位国も活用）
// ============================================================================

function pickSpreadCountries(pool: CountryData[], count: number): CountryData[] | null {
  const picked: CountryData[] = [];
  for (const c of shuffle(pool)) {
    const distinct = picked.every((p) => {
      const a = c.stats!;
      const b = p.stats!;
      const gdpRatio =
        Math.max(a.gdpPerCapitaUsd, b.gdpPerCapitaUsd) /
        Math.max(100, Math.min(a.gdpPerCapitaUsd, b.gdpPerCapitaUsd));
      const urbDiff = Math.abs(a.urbanPopRatePct - b.urbanPopRatePct);
      const tfrDiff = Math.abs((a.fertilityRate ?? 2) - (b.fertilityRate ?? 2));
      const p1Diff = Math.abs(a.sectorShare.primaryPct - b.sectorShare.primaryPct);
      return gdpRatio >= 1.55 || urbDiff >= 15 || tfrDiff >= 0.8 || p1Diff >= 14;
    });
    if (distinct) {
      picked.push(c);
      if (picked.length === count) return picked;
    }
  }
  return null;
}

function makeRegionalStatsQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const fullEligible = Object.values(countries).filter(
    (c) =>
      c.stats &&
      c.stats.population >= 1_000_000 &&
      c.stats.gdpPerCapitaUsd > 0 &&
      c.stats.fertilityRate != null &&
      c.stats.sectorShare,
  );
  if (fullEligible.length < 10) return null;

  // モードB (約40%): あえて最上位Sランクを除いた中堅・基礎収録国3カ国の組合せ特定
  if (Math.random() < 0.4) {
    const midPool = fullEligible.filter((c) => c.examSummary.rank !== 'S');
    const picked = pickSpreadCountries(midPool, 3);
    if (picked) {
      const labels = ['ア', 'イ', 'ウ'];
      const rows = picked.map((c, idx) => {
        const st = c.stats!;
        const sh = st.sectorShare;
        return [
          labels[idx],
          fmtPopShort(st.population),
          `${st.populationDensity.toFixed(0)}人/km²`,
          `$${st.gdpPerCapitaUsd.toLocaleString()}`,
          `${st.urbanPopRatePct}%`,
          st.fertilityRate!.toFixed(2),
          `${sh.primaryPct}/${sh.secondaryPct}/${sh.tertiaryPct}`,
          st.remittanceGdpPct != null ? `${st.remittanceGdpPct}%` : '-',
        ];
      });

      const [nA, nB, nC] = picked.map((c) => cleanCountryName(c.nameJa));
      const perms: [string, string, string][] = [
        [nA, nB, nC],
        [nA, nC, nB],
        [nB, nA, nC],
        [nC, nB, nA],
      ];
      const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
      const choices = shuffle(
        Array.from(new Set(perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`))),
      );
      if (choices.length === 4) {
        return {
          id: `drill_ec_${nonce}`,
          genre: 'regional_stats',
          genreLabel: '地域内・中堅国統計',
          promptTitle: '統計指標に基づく3カ国（非上位・中堅国含む）の組合せ特定',
          promptBody:
            '下の表は人口100万人以上の3カ国（ア〜ウ）について人口・所得・産業構造・海外個人送金割合等を比較したものである。ア〜ウに該当する国の正しい組合せを選びなさい。',
          table: {
            caption: '3カ国の社会・経済基礎統計比較',
            headers: ['国', '人口', '人口密度', '1人GDP', '都市率', '出生率', '1/2/3次(%)', '送金GDP比'],
            rows,
          },
          choices,
          correctIndex: choices.indexOf(answerText),
          explanation:
            '1人あたりGDPの桁、都市人口率（高都市率な中進・資源国か農村型か）、第1次産業比率、個人送金依存度（出稼ぎ送金が大きい国）を組み合わせて絞り込む。',
          detailNotes: picked.map(
            (c, i) =>
              `${labels[i]}：${cleanCountryName(c.nameJa)}（${c.region}・気候 ${c.thematic?.koppenMain ?? '-'}・${c.thematic?.religionMain ?? '-'}）`,
          ),
          relatedIso3s: picked.map((c) => c.iso3),
        };
      }
    }
  }

  // モードA (約60%): 同一マクロ地域内の4カ国比較（中堅・基礎国も混在、客観指標のみで比較）
  const buckets = new Map<string, CountryData[]>();
  for (const c of fullEligible) {
    const mr = normalizeMacroRegion(c.region);
    const list = buckets.get(mr) ?? [];
    list.push(c);
    buckets.set(mr, list);
  }
  const regionNames = shuffle(Array.from(buckets.keys()));
  for (const mr of regionNames) {
    const regPool = buckets.get(mr) ?? [];
    if (regPool.length < 4) continue;
    const picked = pickSpreadCountries(regPool, 4);
    if (!picked) continue;

    const targetIdx = Math.floor(Math.random() * 4);
    const target = picked[targetIdx];
    const labels = ['国A', '国B', '国C', '国D'];

    const rows = picked.map((c, idx) => {
      const st = c.stats!;
      const sh = st.sectorShare;
      return [
        labels[idx],
        fmtPopShort(st.population),
        `${st.populationDensity.toFixed(0)}人/km²`,
        `$${st.gdpPerCapitaUsd.toLocaleString()}`,
        `${st.urbanPopRatePct}%`,
        st.fertilityRate!.toFixed(2),
        `${sh.primaryPct}/${sh.secondaryPct}/${sh.tertiaryPct}`,
        c.thematic?.koppenMain ?? '-',
      ];
    });

    const choices = shuffle(picked.map((c) => cleanCountryName(c.nameJa)));
    const answerName = cleanCountryName(target.nameJa);

    return {
      id: `drill_ec_${nonce}`,
      genre: 'regional_stats',
      genreLabel: '地域内・中堅国統計',
      promptTitle: `同地域内4カ国比較からの「${labels[targetIdx]}」特定`,
      promptBody: `下の表は「${mr}」に属する4カ国の基礎統計を示したものである。「${labels[targetIdx]}」に該当する国として最も適当なものを選びなさい。`,
      table: {
        caption: `${mr} 4カ国の統計指標・気候比較`,
        headers: ['国', '人口', '密度', '1人GDP', '都市率', '出生率', '1/2/3次(%)', '代表気候'],
        rows,
      },
      choices,
      correctIndex: choices.indexOf(answerName),
      explanation: `同じ「${mr}」の中でも、所得水準（1人GDP）・都市化・産業構造・人口密度・代表気候に明確な地域内格差がある。`,
      detailNotes: picked.map((c, idx) => {
        const st = c.stats!;
        return `${labels[idx]}：${cleanCountryName(c.nameJa)}（人口 ${fmtPopShort(st.population)}、1人GDP $${st.gdpPerCapitaUsd.toLocaleString()}、都市率 ${st.urbanPopRatePct}%、代表気候 ${c.thematic?.koppenMain ?? '-'}）`;
      }),
      relatedIso3s: picked.map((c) => c.iso3),
    };
  }

  return null;
}

// ============================================================================
// 5. 雨温図・ハイサーグラフ判別（単一＋2都市比較・共通スケール）
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

  // 45%の確率で2都市並列比較（共通テスト本番形式）
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
      (p) =>
        `${labelFor(p)}：${p.city.koppenCode}（${hemiLabel(p.city)}${elevText(p.city)}）`,
    ),
    relatedIso3s: picked.map((p) => p.country.iso3),
  };
}

// ============================================================================
// 6. 人口ピラミッド判別（単一＋2カ国比較）
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

  // 40%の確率で2カ国並列比較
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
        promptBody:
          '下の2つの人口ピラミッド（ア・イ）に該当する国の正しい組合せを選びなさい。男女の偏り（出稼ぎ労働者流入）や底辺の幅（出生率）に着目すること。',
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
// 7. 時代変化データ読取（periodNote ネタバレ除去・3時点数値のみ・同分野誤答優先）
// ============================================================================

function makeTimeShiftQuestion(
  sliders: TimeSeriesSliderItem[],
  nonce: number,
): GeneratedDrillQuestion | null {
  const valid = sliders.filter((s) => s.frames.length >= 2 && s.frames[0].items.length >= 3);
  if (valid.length < 4) return null;

  const target = shuffle(valid)[0];
  const sameCatDistractors = shuffle(
    valid.filter((s) => s.id !== target.id && s.category === target.category),
  );
  const otherDistractors = shuffle(
    valid.filter((s) => s.id !== target.id && s.category !== target.category),
  );
  const picked = [target, ...sameCatDistractors, ...otherDistractors].slice(0, 4);

  const midIdx = Math.floor((target.frames.length - 1) / 2);
  const chosenFrames =
    target.frames.length >= 3
      ? [target.frames[0], target.frames[midIdx], target.frames[target.frames.length - 1]]
      : [target.frames[0], target.frames[target.frames.length - 1]];

  const formatFrameData = (fr: (typeof chosenFrames)[number]) =>
    fr.items
      .slice(0, 4)
      .map((it, idx) => `${idx + 1}. ${cleanCountryName(it.label)}(${it.value}${target.unit})`)
      .join(' ／ ');

  const rows = chosenFrames.map((fr) => [fr.yearLabel, formatFrameData(fr)]);

  const cleanTitle = (s: TimeSeriesSliderItem) => s.title.split('（')[0].trim();
  const answer = cleanTitle(target);
  const choices = shuffle(picked.map(cleanTitle));

  return {
    id: `drill_ts_${nonce}`,
    genre: 'time_shift',
    genreLabel: '時代変化データ読取',
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
// 8. 景観写真・地域推論（同分野誤答優先・気候ネタバレ除去）
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
 * 指定ジャンル（または全ジャンルランダム）の実戦問題をデータから自動生成する
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
    genre === 'all'
      ? shuffle([
          'ranking_matrix',
          'scatter_plot',
          'composition_bar',
          'regional_stats',
          'climate_coords',
          'pyramid_match',
          'time_shift',
          'photo_infer',
        ])
      : [genre];

  for (const g of candidates) {
    let q: GeneratedDrillQuestion | null = null;
    if (g === 'ranking_matrix' && params.worldRankings) {
      q = makeRankingMatrixQuestion(params.worldRankings, nonce);
    } else if (g === 'scatter_plot') {
      q = makeScatterPlotQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'composition_bar') {
      q = makeCompositionBarQuestion(params.worldRankings, params.countriesData, nonce);
    } else if (g === 'regional_stats') {
      q = makeRegionalStatsQuestion(params.countriesData, nonce);
    } else if (g === 'climate_coords') {
      q = makeClimateCoordsQuestion(params.countriesData, nonce);
    } else if (g === 'pyramid_match') {
      q = makePyramidQuestion(params.countriesData, nonce);
    } else if (g === 'time_shift') {
      q = makeTimeShiftQuestion(params.timeSliders, nonce);
    } else if (g === 'photo_infer') {
      q = makePhotoInferQuestion(params.photoEncyclopedia, nonce);
    }
    if (q) return q;
  }
  return null;
}
