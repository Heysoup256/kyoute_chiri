import type {
  AgePyramidBin,
  ClimateCity,
  CountryData,
  PhotoEncyclopediaEntry,
  TimeSeriesSliderItem,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import {
  buildStepByStepExplanation,
  makeClimateMapLinkedQuestion,
  makeCuratedStatTwistQuestion,
  makeMapChoroplethQuestion,
  makeSubnationalAndJapanQuestion,
  makeUnseenInferQuestion,
} from './advancedDrillBuilders';
import {
  DRILL_GENRE_OPTIONS,
  type DrillFocusFilter,
  type DrillGeneratorParams,
  type DrillGenre,
  type GeneratedDrillQuestion,
  type LineTrendDrillSpec,
  type ScatterDrillSpec,
  type StackedBarDrillSpec,
} from './drillTypes';
import {
  buildDynamicPercentCountryMatrix,
  CLIMATE_COHORT_SPECS,
  COUNTRY_ARCHETYPE_MAP,
  CURATED_ITEM_TRIOS,
  CURATED_STAT_MATRICES,
  EXAM_STANDARD_ISO3_SET,
  extractComparisonMatrices,
  getAge60PlusPct,
  MANUAL_RANKING_METRIC_LABELS,
  MANUAL_SLIDER_QUIZ_SPECS,
  PYRAMID_COHORT_ARCHETYPES,
  REGIONAL_COUNTRY_COHORTS,
  type StatMatrixRow,
  type StatMatrixSpec,
} from './statMatrices';

export { DRILL_GENRE_OPTIONS };
export type {
  DrillFocusFilter,
  DrillGeneratorParams,
  DrillGenre,
  GeneratedDrillQuestion,
  LineTrendDrillSpec,
  ScatterDrillSpec,
  StackedBarDrillSpec,
};

const ALL_WEIGHTED_GENRES: Exclude<DrillGenre, 'all'>[] = [
  'unseen_infer',
  'unseen_infer',
  'unseen_infer',
  'map_choropleth',
  'map_choropleth',
  'subnational_jpn',
  'subnational_jpn',
  'stat_country',
  'stat_country',
  'stat_double_blind',
  'stat_double_blind',
  'stat_item',
  'scatter_plot',
  'composition_bar',
  'time_shift',
  'climate_coords',
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

function getArchetype(iso3?: string): string {
  if (!iso3) return '';
  return COUNTRY_ARCHETYPE_MAP[iso3] ?? iso3;
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
 * 共通テスト級の部分行列健全性ゲート：
 * 1) 「ほぼ全0の列（非ゼロが1行以下）」や「全0列」を完全禁止
 * 2) 「全列とも数値が極小で特徴がない行（例:[2,0,0]）」を完全禁止
 * 3) 任意の2行間で少なくとも1列に明確な差があること（根拠不足を防止）
 */
function isSubmatrixHealthy(
  M: number[][],
  opts?: { strictZero?: boolean; requireColumnDistinct?: boolean },
): boolean {
  const R = M.length;
  const C = M[0]?.length ?? 0;
  if (R < 2 || C < 2) return false;

  const colAbsMax = Array.from({ length: C }, (_, c) =>
    Math.max(0, ...M.map((r) => Math.abs(r[c] ?? 0))),
  );
  if (colAbsMax.some((mx) => mx <= 0)) return false;

  // 1. ゼロ過多列の禁止：すべての列で少なくとも2行が列最大値の6%以上の値を持つこと
  const maxZeroPerCol = opts?.strictZero ? 1 : R <= 3 ? 1 : 2;
  for (let c = 0; c < C; c++) {
    let meaningfulCount = 0;
    let zeroCount = 0;
    for (let r = 0; r < R; r++) {
      const av = Math.abs(M[r][c]);
      if (av === 0 || av < colAbsMax[c] * 0.01) zeroCount++;
      if (av >= colAbsMax[c] * 0.06 && av > 0) meaningfulCount++;
    }
    if (meaningfulCount < 2 || zeroCount > maxZeroPerCol) return false;
  }

  // 2. 影が薄いゴミ行の禁止：すべての行がいずれか1列以上で列最大値の20%以上の値を持つこと
  for (let r = 0; r < R; r++) {
    const hasNotableCol = colAbsMax.some((mx, c) => Math.abs(M[r][c]) >= mx * 0.2);
    if (!hasNotableCol) return false;
  }

  // 3. 任意の2行間で、少なくとも1列で明確に区別できること
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      let maxNormDiff = 0;
      for (let c = 0; c < C; c++) {
        maxNormDiff = Math.max(maxNormDiff, Math.abs(M[i][c] - M[j][c]) / colAbsMax[c]);
      }
      if (maxNormDiff < 0.25) return false;
    }
  }

  // 4. 列同士の識別確認（必要な場合）
  if (opts?.requireColumnDistinct) {
    for (let a = 0; a < C; a++) {
      for (let b = a + 1; b < C; b++) {
        const pairScale = Math.max(colAbsMax[a], colAbsMax[b]);
        let maxColDiff = 0;
        for (let r = 0; r < R; r++) {
          maxColDiff = Math.max(maxColDiff, Math.abs(M[r][a] - M[r][b]) / pairScale);
        }
        if (maxColDiff < 0.22) return false;
      }
    }
  }

  return true;
}

/**
 * 二重ブラインド（行・列とも名称非表示）で、クロスオーバー・逆転を含み一意に解けるかを判定
 */
function isDoubleBlindUniquelySolvable(M: number[][]): boolean {
  const R = M.length;
  const C = M[0]?.length ?? 0;
  if (R < 2 || C < 2 || R > 3 || C > 3) return false;
  // 符号ヒントや0過多表を排除（すべて非負、かつ表全体の0は最大1個まで）
  if (M.some((row) => row.some((v) => v < 0))) return false;
  const totalZeros = M.flat().filter((v) => v === 0).length;
  if (totalZeros > 1) return false;

  if (!isSubmatrixHealthy(M, { strictZero: true, requireColumnDistinct: true })) return false;

  const scale = Math.max(1e-6, ...M.flat().map((v) => Math.abs(v)));
  const threshold = 0.26;

  // 行間の大小がすべて同じ向き（単調比例）だと推論根拠が弱いため、順位逆転または明確な役割分化を要求
  const hasReversalOrZeroContrast = (() => {
    for (let i = 0; i < R; i++) {
      for (let j = i + 1; j < R; j++) {
        let pos = false;
        let neg = false;
        for (let c = 0; c < C; c++) {
          if (M[i][c] > M[j][c] * 1.15 + 1e-6) pos = true;
          if (M[j][c] > M[i][c] * 1.15 + 1e-6) neg = true;
        }
        if (pos && neg) return true;
      }
    }
    return false;
  })();
  if (!hasReversalOrZeroContrast) return false;

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
// 手動辞書ベースランキング抽出
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

const BAD_ENTRY_NAME_RE = /^(その他|合計|世界|EU27合計|EU計|ASEANその他)$/;

export function extractCleanRankingMetrics(
  dataset: WorldRankingsDataset,
): CleanRankingMetric[] {
  const out: CleanRankingMetric[] = [];
  const seenLabels = new Set<string>();

  for (const it of dataset.items) {
    const manualSpec = MANUAL_RANKING_METRIC_LABELS[it.id];
    if (!manualSpec) continue;

    const sides: {
      side: 'primary' | 'secondary';
      spec?: { label: string; unit: string };
      list?: typeof it.primaryTop;
    }[] = [
        { side: 'primary', spec: manualSpec.primary, list: it.primaryTop },
        { side: 'secondary', spec: manualSpec.secondary, list: it.secondaryTop },
      ];

    for (const s of sides) {
      if (!s.spec || !s.list || s.list.length < 3) continue;
      if (seenLabels.has(s.spec.label)) continue;

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

      seenLabels.add(s.spec.label);
      out.push({
        parentId: it.id,
        side: s.side,
        category: it.category,
        metricLabel: s.spec.label,
        entries: cleanedEntries,
        unit: s.spec.unit,
        examTrap: it.examTrap,
      });
    }
  }
  return out;
}

// ============================================================================
// 1. 統計数値 → 国を当てる (必ず2列以上・共通テスト標準国・健全性ゲート通過)
// ============================================================================

function pickHealthyRowsForMatrix(
  rows: StatMatrixRow[],
  count: number,
): StatMatrixRow[] | null {
  if (rows.length < count) return null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const cand = shuffle(rows).slice(0, count);
    // 同類型（archetype）が重複しない組を優先
    const archs = cand.map((r) => getArchetype(r.iso3));
    if (attempt < 28 && new Set(archs).size < cand.length) continue;

    const M = cand.map((r) => r.values);
    if (isSubmatrixHealthy(M, { strictZero: attempt < 24 })) {
      return cand;
    }
  }
  return null;
}

interface ProfileMetricTrio {
  caption: string;
  cols: {
    label: string;
    extract: (c: CountryData) => number | null;
    fmt: (v: number) => string;
    minDiff: number;
  }[];
}

const PROFILE_METRIC_TRIOS: ProfileMetricTrio[] = [
  {
    caption: '第1次産業就業率・都市人口率・1人当たり名目GDP',
    cols: [
      {
        label: '第1次産業就業率(%)',
        extract: (c) => c.stats?.sectorShare?.primaryPct ?? null,
        fmt: (v) => `${v}%`,
        minDiff: 12,
      },
      {
        label: '都市人口率(%)',
        extract: (c) => (c.stats ? Number(c.stats.urbanPopRatePct.toFixed(1)) : null),
        fmt: (v) => `${v}%`,
        minDiff: 15,
      },
      {
        label: '1人当たりGDP(千USD)',
        extract: (c) => (c.stats ? Number((c.stats.gdpPerCapitaUsd / 1000).toFixed(1)) : null),
        fmt: (v) => `${v}`,
        minDiff: 8,
      },
    ],
  },
  {
    caption: '合計特殊出生率・60歳以上人口割合・人口規模',
    cols: [
      {
        label: '合計特殊出生率',
        extract: (c) => (c.stats?.fertilityRate != null ? Number(c.stats.fertilityRate.toFixed(2)) : null),
        fmt: (v) => v.toFixed(2),
        minDiff: 0.7,
      },
      {
        label: '60歳以上割合(%)',
        extract: (c) => getAge60PlusPct(c),
        fmt: (v) => `${v}%`,
        minDiff: 7,
      },
      {
        label: '総人口',
        extract: (c) => c.stats?.population ?? null,
        fmt: fmtPopShort,
        minDiff: 25_000_000,
      },
    ],
  },
  {
    caption: '15歳以上女性労働力率・第3次産業就業率・合計特殊出生率',
    cols: [
      {
        label: '女性労働力率(%)',
        extract: (c) => (c.stats?.femaleLaborPct != null ? Number(c.stats.femaleLaborPct.toFixed(1)) : null),
        fmt: (v) => `${v}%`,
        minDiff: 15,
      },
      {
        label: '第3次産業就業率(%)',
        extract: (c) => c.stats?.sectorShare?.tertiaryPct ?? null,
        fmt: (v) => `${v}%`,
        minDiff: 15,
      },
      {
        label: '合計特殊出生率',
        extract: (c) => (c.stats?.fertilityRate != null ? Number(c.stats.fertilityRate.toFixed(2)) : null),
        fmt: (v) => v.toFixed(2),
        minDiff: 0.7,
      },
    ],
  },
  {
    caption: '人口密度・都市人口率・1人当たりGDP',
    cols: [
      {
        label: '人口密度(人/km²)',
        extract: (c) => (c.stats ? Math.round(c.stats.populationDensity) : null),
        fmt: (v) => v.toLocaleString('ja-JP'),
        minDiff: 60,
      },
      {
        label: '都市人口率(%)',
        extract: (c) => (c.stats ? Number(c.stats.urbanPopRatePct.toFixed(1)) : null),
        fmt: (v) => `${v}%`,
        minDiff: 16,
      },
      {
        label: '1人当たりGDP(千USD)',
        extract: (c) => (c.stats ? Number((c.stats.gdpPerCapitaUsd / 1000).toFixed(1)) : null),
        fmt: (v) => `${v}`,
        minDiff: 8,
      },
    ],
  },
];

function makeExamCohortProfileCountryQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const stdPool = Object.values(countries).filter(
    (c) =>
      EXAM_STANDARD_ISO3_SET.has(c.iso3) &&
      !c.isBasicEntry &&
      c.stats &&
      c.stats.fertilityRate != null &&
      c.stats.femaleLaborPct != null &&
      getAge60PlusPct(c) != null,
  );
  if (stdPool.length < 8) return null;

  for (const trio of shuffle(PROFILE_METRIC_TRIOS)) {
    const cohorts = shuffle(REGIONAL_COUNTRY_COHORTS);
    for (const coh of cohorts) {
      const subPool = stdPool.filter((c) => coh.iso3s.includes(c.iso3));
      const picked: CountryData[] = [];
      for (const c of shuffle(subPool)) {
        const valsC = trio.cols.map((col) => col.extract(c));
        if (valsC.some((v) => v === null)) continue;
        const archC = getArchetype(c.iso3);
        const ok = picked.every((p) => {
          if (getArchetype(p.iso3) === archC) return false;
          let diffCols = 0;
          for (let i = 0; i < trio.cols.length; i++) {
            if (Math.abs(valsC[i]! - trio.cols[i].extract(p)!) >= trio.cols[i].minDiff) {
              diffCols++;
            }
          }
          return diffCols >= 2;
        });
        if (ok) {
          picked.push(c);
          if (picked.length === 4) break;
        }
      }
      if (picked.length < 3) continue;

      const use4 = picked.length === 4 && Math.random() < 0.5;
      if (use4) {
        const rowCodes = ['ア', 'イ', 'ウ', 'エ'];
        const targetIdx = Math.floor(Math.random() * 4);
        const targetName = cleanCountryName(picked[targetIdx].nameJa);
        const candStr = sortJa(picked.map((c) => cleanCountryName(c.nameJa))).join('、');

        return {
          id: `drill_scn_${nonce}`,
          genre: 'stat_country',
          genreLabel: '統計数値 → 国を当てる',
          promptTitle: `${coh.label}：経済・人口・社会指標の判別`,
          promptBody: `次の表中の ア〜エ は、${candStr}のいずれかを示したものである。「${targetName}」に該当するものを、以下の ①〜④ のうちから一つ選びなさい。`,
          table: {
            caption: `${coh.label}の比較（${trio.caption}）`,
            headers: ['記号', ...trio.cols.map((col) => col.label)],
            rows: picked.map((c, idx) => [
              rowCodes[idx],
              ...trio.cols.map((col) => col.fmt(col.extract(c)!)),
            ]),
          },
          choices: rowCodes.map((rc) => rc),
          correctIndex: targetIdx,
          explanation: `正解は ${rowCodes[targetIdx]}（${targetName}）。${coh.label}における発展段階・都市化・少子高齢化・労働参加の差を組み合わせて絞り込む。`,
          detailNotes: picked.map(
            (c, i) =>
              `${rowCodes[i]}＝${cleanCountryName(c.nameJa)}（${c.region}・代表気候 ${c.thematic?.koppenMain ?? '-'}・${trio.cols.map((col) => `${col.label.split('(')[0]} ${col.fmt(col.extract(c)!)}`).join(' / ')}）`,
          ),
          relatedIso3s: picked.map((c) => c.iso3),
        };
      }

      const sub3 = picked.slice(0, 3);
      const names3 = sub3.map((c) => cleanCountryName(c.nameJa)) as [string, string, string];
      const rowCodes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const { choices, correctIndex } = makeAll6Permutations(rowCodes, names3);

      return {
        id: `drill_scn_${nonce}`,
        genre: 'stat_country',
        genreLabel: '統計数値 → 国を当てる',
        promptTitle: `${coh.label}：3カ国の社会・産業構造比較`,
        promptBody: `次の表中の ア〜ウ は、${sortJa(names3).join('、')}のいずれかである。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${coh.label}の3カ国比較（${trio.caption}）`,
          headers: ['記号', ...trio.cols.map((col) => col.label)],
          rows: sub3.map((c, idx) => [
            rowCodes[idx],
            ...trio.cols.map((col) => col.fmt(col.extract(c)!)),
          ]),
        },
        choices,
        correctIndex,
        explanation: `${coh.label}における3カ国の経済水準・都市率・人口構成の違いに着目して組合せを特定する。`,
        detailNotes: sub3.map(
          (c, i) =>
            `${rowCodes[i]}＝${cleanCountryName(c.nameJa)}（${trio.cols.map((col) => `${col.label.split('(')[0]} ${col.fmt(col.extract(c)!)}`).join(' / ')}）`,
        ),
        relatedIso3s: sub3.map((c) => c.iso3),
      };
    }
  }
  return null;
}

function makeStatCountryQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  // 約25%: 共通テスト大問型「地域コホート・経済/人口構造3指標対比」（マイナー国ゼロ）
  if (Math.random() < 0.25) {
    const prof = makeExamCohortProfileCountryQuestion(countries, nonce);
    if (prof) return prof;
  }

  // 約75%: 必ず2列以上の高密度マトリクス（1列ランキング単独出題を完全廃止）
  const matrices: StatMatrixSpec[] = [
    ...CURATED_STAT_MATRICES,
    ...extractComparisonMatrices(worldRankings, countries),
  ].filter((m) => m.colLabels.length >= 2);
  const dynStd = buildDynamicPercentCountryMatrix(countries, 'standard');
  const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
  if (dynStd) matrices.push(dynStd);
  if (dynReg) matrices.push(dynReg);

  for (const mat of shuffle(matrices)) {
    const targetColCount = mat.colLabels.length >= 3 ? (Math.random() < 0.55 ? 3 : 2) : 2;
    const colIndices = shuffle(mat.colLabels.map((_, i) => i))
      .slice(0, targetColCount)
      .sort((a, b) => a - b);

    const projectedRows: StatMatrixRow[] = mat.rows
      .filter((r) => !r.iso3 || EXAM_STANDARD_ISO3_SET.has(r.iso3))
      .map((r) => ({
        ...r,
        values: colIndices.map((ci) => r.values[ci]),
      }));

    const useSinglePick = Math.random() < 0.5;
    const picked = pickHealthyRowsForMatrix(projectedRows, useSinglePick ? 4 : 3);
    if (!picked) continue;

    const colHeaders = colIndices.map((ci) => mat.colLabels[ci]);

    if (useSinglePick) {
      const rowCodes = ['ア', 'イ', 'ウ', 'エ'];
      const targetIdx = Math.floor(Math.random() * 4);
      const targetName = picked[targetIdx].countryName;
      const candStr = sortJa(picked.map((r) => r.countryName)).join('、');

      return {
        id: `drill_scn_${nonce}`,
        genre: 'stat_country',
        genreLabel: '統計数値 → 国を当てる',
        promptTitle: `${mat.title}に関する統計判別`,
        promptBody: `次の表中の ア〜エ は、${candStr}のいずれかにおける「${mat.title}」（単位：${mat.unit}）を示している。「${targetName}」に該当するものを、以下の ①〜④ のうちから一つ選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['国', ...colHeaders],
          rows: picked.map((r, i) => [rowCodes[i], ...r.values.map(formatNum)]),
        },
        choices: rowCodes.map((rc) => rc),
        correctIndex: targetIdx,
        explanation: `正解は ${rowCodes[targetIdx]}（${targetName}）。${mat.examPoint}`,
        detailNotes: picked.map(
          (r, i) =>
            `${rowCodes[i]}＝${r.countryName}：${colHeaders.map((h, ci) => `${h} ${formatNum(r.values[ci])}${mat.unit}`).join('／')}`,
        ),
        relatedIso3s: picked.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
      };
    }

    const rowCodes: [string, string, string] = ['ア', 'イ', 'ウ'];
    const names = picked.map((r) => r.countryName) as [string, string, string];
    const { choices, correctIndex } = makeAll6Permutations(rowCodes, names);

    return {
      id: `drill_scn_${nonce}`,
      genre: 'stat_country',
      genreLabel: '統計数値 → 国を当てる',
      promptTitle: `${mat.title}の3カ国比較`,
      promptBody: `次の表中の ア〜ウ は、${sortJa(names).join('、')}のいずれかである。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
      table: {
        caption: `${mat.title}（単位：${mat.unit}）`,
        headers: ['国', ...colHeaders],
        rows: picked.map((r, i) => [rowCodes[i], ...r.values.map(formatNum)]),
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

  return makeExamCohortProfileCountryQuestion(countries, nonce);
}

// ============================================================================
// 2. 国名×項目 両方ブラインド（クロスオーバー付き二重ブラインド表）
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

  const dynStd = buildDynamicPercentCountryMatrix(countries, 'standard');
  const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
  if (dynStd) pool.push(dynStd);
  if (dynReg) pool.push(dynReg);

  for (const mat of shuffle(pool)) {
    const validRows = mat.rows.filter((r) => !r.iso3 || EXAM_STANDARD_ISO3_SET.has(r.iso3));
    const colCnt = mat.colLabels.length;
    const rowCnt = validRows.length;
    const shapes: [number, number][] = shuffle([
      ...(colCnt >= 3 && rowCnt >= 2 ? ([[2, 3]] as [number, number][]) : []),
      ...(colCnt >= 2 && rowCnt >= 3 ? ([[3, 2]] as [number, number][]) : []),
      ...(colCnt >= 2 && rowCnt >= 2 ? ([[2, 2]] as [number, number][]) : []),
    ]);

    for (const [R, C] of shapes) {
      for (let attempt = 0; attempt < 35; attempt++) {
        const colIdx = shuffle(mat.colLabels.map((_, i) => i)).slice(0, C);
        const rowCand = shuffle(validRows).slice(0, R);
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

        return {
          id: `drill_db_${nonce}`,
          genre: 'stat_double_blind',
          genreLabel: '国名×項目 両方ブラインド',
          promptTitle: `${mat.title}（国名・項目ブラインド）`,
          promptBody: `次の表は、${countryCandStr} のいずれかの国（${rowCodes.join('・')}）における、${colCandStr} のいずれかの項目（${colCodes.join('・')}、単位：${mat.unit}）の数値を示したものである。「${targetCountry}」と「${targetCol}」の組合せとして正しいものを一つ選びなさい。`,
          table: {
            caption: `${mat.title}（国記号 ${rowCodes.join('/')} × 項目記号 ${colCodes.join('/')}、単位：${mat.unit}）`,
            headers: ['国 \\ 項目', ...colCodes],
            rows: rowCand.map((r, ri) => [
              rowCodes[ri],
              ...colIdx.map((ci) => formatNum(r.values[ci])),
            ]),
          },
          choices: pairs.map((p) => p.text),
          correctIndex: pairs.findIndex((p) => p.isAnswer),
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
// 3. 統計数値 → 項目を当てる (最大4行・健全表＋同分野CURATED_ITEM_TRIOS)
// ============================================================================

function makeStatItemQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  if (Math.random() < 0.72) {
    const matrices: StatMatrixSpec[] = [
      ...CURATED_STAT_MATRICES,
      ...extractComparisonMatrices(worldRankings, countries),
    ].filter((m) => m.sameUnitAcrossCols && m.colLabels.length >= 3 && m.rows.length >= 4);

    const dynStd = buildDynamicPercentCountryMatrix(countries, 'standard');
    const dynReg = buildDynamicPercentCountryMatrix(countries, 'regional');
    if (dynStd) matrices.push(dynStd);
    if (dynReg) matrices.push(dynReg);

    for (const mat of shuffle(matrices)) {
      const colIdx = shuffle(mat.colLabels.map((_, i) => i)).slice(0, 3);
      const selectedCols = colIdx.map((ci) => mat.colLabels[ci]) as [string, string, string];
      const validRows = mat.rows.filter((r) => !r.iso3 || EXAM_STANDARD_ISO3_SET.has(r.iso3));

      let pickedRows: StatMatrixRow[] | null = null;
      for (let attempt = 0; attempt < 35; attempt++) {
        const cand = shuffle(validRows).slice(0, 4);
        const subM = cand.map((r) => colIdx.map((ci) => r.values[ci]));
        if (!isSubmatrixHealthy(subM, { strictZero: attempt < 25, requireColumnDistinct: true })) {
          continue;
        }
        // 各列の最大値の国が異なる行になり、項目特定根拠が明確である組を優先
        const argMaxPerCol = [0, 1, 2].map((cpos) => {
          let bestR = 0;
          for (let r = 1; r < cand.length; r++) {
            if (subM[r][cpos] > subM[bestR][cpos]) bestR = r;
          }
          return bestR;
        });
        if (attempt < 22 && new Set(argMaxPerCol).size < 2) continue;
        pickedRows = cand;
        break;
      }
      if (!pickedRows) continue;

      const colCodes: [string, string, string] = ['カ', 'キ', 'ク'];
      const { choices, correctIndex } = makeAll6Permutations(colCodes, selectedCols);

      return {
        id: `drill_it_${nonce}`,
        genre: 'stat_item',
        genreLabel: '統計数値 → 項目を当てる',
        promptTitle: `${mat.title}の統計項目特定`,
        promptBody: `次の表中の カ〜ク は、${sortJa(selectedCols).join('、')}のいずれか（単位：${mat.unit}）を示している。項目名と カ〜ク との正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['国', ...colCodes],
          rows: pickedRows.map((r) => [
            r.countryName,
            ...colIdx.map((ci) => formatNum(r.values[ci])),
          ]),
        },
        choices,
        correctIndex,
        explanation: mat.examPoint,
        detailNotes: colCodes.map(
          (cc, i) =>
            `${cc}＝${selectedCols[i]}（${pickedRows!.map((r) => `${r.countryName}:${formatNum(r.values[colIdx[i]])}`).join('・')}）`,
        ),
        relatedIso3s: pickedRows.map((r) => r.iso3).filter((id): id is string => Boolean(id)),
      };
    }
  }

  // 単一ランキングからの3指標対比6択（同テーマ CURATED_ITEM_TRIOS のみに厳選）
  if (worldRankings) {
    const metrics = extractCleanRankingMetrics(worldRankings);
    const byLabel = new Map<string, CleanRankingMetric>(
      metrics.map((m) => [m.metricLabel, m]),
    );

    for (const trio of shuffle(CURATED_ITEM_TRIOS)) {
      const resolved = trio.map((lbl) => byLabel.get(lbl)).filter((m): m is CleanRankingMetric => Boolean(m));
      if (resolved.length !== 3) continue;

      // 3項目の上位3カ国の顔ぶれが全く同じにならないことを確認
      const sigs = resolved.map((m) =>
        m.entries
          .slice(0, 3)
          .map((e) => e.nameJa)
          .join('|'),
      );
      if (new Set(sigs).size < 3) continue;

      const shuffledMetrics = shuffle(resolved);
      const labels: [string, string, string] = ['カ', 'キ', 'ク'];
      const metricNames = shuffledMetrics.map((m) => m.metricLabel) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(labels, metricNames);

      const rows = shuffledMetrics.map((m, idx) => [
        labels[idx],
        m.entries
          .slice(0, 3)
          .map((e, ri) => `${ri + 1}. ${e.nameJa}(${formatNum(e.value)}${m.unit})`)
          .join(' ／ '),
      ]);

      return {
        id: `drill_it_${nonce}`,
        genre: 'stat_item',
        genreLabel: '統計数値 → 項目を当てる',
        promptTitle: '統計指標別の上位3カ国実績特定',
        promptBody: `次の表中の カ〜ク は、${sortJa(metricNames).join('、')}のいずれかの統計指標について上位3カ国と実績値を示したものである。項目名と カ〜ク との正しい組合せを一つ選びなさい。`,
        table: {
          caption: '統計指標別の上位3カ国と実績値',
          headers: ['記号', '第1位〜第3位の実数値'],
          rows,
        },
        choices,
        correctIndex,
        explanation:
          '同一分野・同一品目でも「生産（消費規模含む） vs 輸出 vs 輸入」「原料産地 vs 精錬・加工国」「自然・宗教規定による偏在」で上位国が大きく入れ替わる点から見分ける。',
        detailNotes: shuffledMetrics.map((m, idx) => `${labels[idx]}＝${m.metricLabel}：${m.examTrap}`),
        relatedIso3s: Array.from(
          new Set(
            shuffledMetrics
              .flatMap((m) => m.entries.slice(0, 2).map((e) => e.iso3))
              .filter((id) => id.length === 3),
          ),
        ).slice(0, 5),
      };
    }
  }

  return null;
}

// ============================================================================
// 4. 散布図・2指標分析（背景36灰色点を撤廃・対象3〜4カ国集中＋y=x等値線）
// ============================================================================

interface DynamicScatterDef {
  title: string;
  xLabel: string;
  yLabel: string;
  showDiagonal?: boolean;
  diagonalLabel?: string;
  extract: (c: CountryData) => { x: number; y: number } | null;
  noteOf: (c: CountryData, x: number, y: number) => string;
}

const DYNAMIC_SCATTERS: DynamicScatterDef[] = [
  {
    title: '1人当たり名目GDP × 合計特殊出生率',
    xLabel: '1人当たり名目GDP（千USD）',
    yLabel: '合計特殊出生率（人）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.gdpPerCapitaUsd <= 0 || st.gdpPerCapitaUsd > 95_000 || st.fertilityRate == null)
        return null;
      return { x: Number((st.gdpPerCapitaUsd / 1000).toFixed(1)), y: Number(st.fertilityRate.toFixed(2)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}：1人GDP ${x}千USD / 出生率 ${y}`,
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
      `${cleanCountryName(c.nameJa)}：第1次産業 ${x}% / 都市率 ${y}%`,
  },
  {
    title: '第1次産業就業率 × 第3次産業就業率',
    xLabel: '第1次産業就業率（%）',
    yLabel: '第3次産業就業率（%）',
    showDiagonal: true,
    diagonalLabel: '第1次＝第3次',
    extract: (c) => {
      const st = c.stats;
      if (!st || !st.sectorShare) return null;
      return {
        x: Number(st.sectorShare.primaryPct.toFixed(1)),
        y: Number(st.sectorShare.tertiaryPct.toFixed(1)),
      };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}：第1次 ${x}% / 第3次 ${y}%`,
  },
  {
    title: '15歳以上女性労働力率 × 合計特殊出生率',
    xLabel: '女性労働力率（%）',
    yLabel: '合計特殊出生率（人）',
    extract: (c) => {
      const st = c.stats;
      if (!st || st.femaleLaborPct == null || st.fertilityRate == null) return null;
      return { x: Number(st.femaleLaborPct.toFixed(1)), y: Number(st.fertilityRate.toFixed(2)) };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}：女性労働力率 ${x}% / 出生率 ${y}`,
  },
  {
    title: '1人当たり名目GDP × 60歳以上人口割合',
    xLabel: '1人当たり名目GDP（千USD）',
    yLabel: '60歳以上人口割合（%）',
    extract: (c) => {
      const st = c.stats;
      const age60 = getAge60PlusPct(c);
      if (!st || st.gdpPerCapitaUsd <= 0 || st.gdpPerCapitaUsd > 95_000 || age60 == null) return null;
      return { x: Number((st.gdpPerCapitaUsd / 1000).toFixed(1)), y: age60 };
    },
    noteOf: (c, x, y) =>
      `${cleanCountryName(c.nameJa)}：1人GDP ${x}千USD / 60歳以上 ${y}%`,
  },
];

function selectSpreadTargetsStandard<T extends { iso3: string; x: number; y: number }>(
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

  for (const minDist of [0.24, 0.16, 0.1]) {
    const picked: T[] = [];
    for (const cand of shuffle(items)) {
      const arch = getArchetype(cand.iso3);
      if (picked.some((p) => getArchetype(p.iso3) === arch)) continue;
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
  const roll = Math.random();

  // 約40%: 同一単位マトリクスから y=x 等値線付きの共テ風散布図を生成（例：観光収入×支出、漁獲×養殖、貿易収支）
  if (roll < 0.4) {
    const diagMats: StatMatrixSpec[] = [
      ...CURATED_STAT_MATRICES,
      ...extractComparisonMatrices(worldRankings, countries),
    ].filter((m) => Boolean(m.diagonalCols));

    for (const mat of shuffle(diagMats)) {
      const dc = mat.diagonalCols!;
      const pts = mat.rows
        .filter((r): r is StatMatrixRow & { iso3: string } =>
          Boolean(r.iso3 && EXAM_STANDARD_ISO3_SET.has(r.iso3)),
        )
        .map((r) => ({
          iso3: r.iso3,
          nameJa: r.countryName,
          x: r.values[dc.xCol],
          y: r.values[dc.yCol],
        }));

      const targets = selectSpreadTargetsStandard(pts, 4);
      if (!targets) continue;

      const codes = ['ア', 'イ', 'ウ', 'エ'];
      const targetIdx = Math.floor(Math.random() * 4);
      const target = targets[targetIdx];
      const candStr = sortJa(targets.map((t) => t.nameJa)).join('、');

      return {
        id: `drill_sc_${nonce}`,
        genre: 'scatter_plot',
        genreLabel: '散布図・2指標分析',
        promptTitle: `散布図「${mat.title}」からの国特定`,
        promptBody: `次の図中の ア〜エ は、${candStr}のいずれかを示したものである（破線は ${dc.label} を表す）。「${target.nameJa}」に該当する点を一つ選びなさい。`,
        scatterPlot: {
          title: `${mat.title}（単位：${mat.unit}）`,
          xLabel: `${mat.colLabels[dc.xCol]}（${mat.unit}）`,
          yLabel: `${mat.colLabels[dc.yCol]}（${mat.unit}）`,
          backgroundPoints: [],
          showDiagonal: true,
          diagonalLabel: dc.label,
          targetPoints: targets.map((t, i) => ({
            code: codes[i],
            x: t.x,
            y: t.y,
            color: POINT_COLORS[i],
          })),
        },
        choices: codes.map((c) => c),
        correctIndex: targetIdx,
        explanation: `正解は ${codes[targetIdx]}（${target.nameJa}）。${mat.examPoint}`,
        detailNotes: targets.map(
          (t, i) =>
            `${codes[i]}＝${t.nameJa}（${mat.colLabels[dc.xCol]} ${formatNum(t.x)} / ${mat.colLabels[dc.yCol]} ${formatNum(t.y)} ${mat.unit}）`,
        ),
        relatedIso3s: targets.map((t) => t.iso3),
      };
    }
  }

  // 約30%: world_rankings_v1.json の厳選テーマ散布図（農業生産性4象限・GDP×CO2等、背景ノイズ点なし）
  const scatters = worldRankings?.scatters ?? [];
  if (scatters.length > 0 && roll < 0.72) {
    const sc = shuffle(scatters)[0];
    const pts = sc.points
      .filter((pt) => EXAM_STANDARD_ISO3_SET.has(pt.iso3))
      .map((pt) => ({
        ...pt,
        nameJa: cleanCountryName(pt.nameJa),
      }));
    const targets = selectSpreadTargetsStandard(pts, 4);
    if (targets) {
      const codes = ['ア', 'イ', 'ウ', 'エ'];
      const targetIdx = Math.floor(Math.random() * 4);
      const target = targets[targetIdx];

      return {
        id: `drill_sc_${nonce}`,
        genre: 'scatter_plot',
        genreLabel: '散布図・2指標分析',
        promptTitle: `散布図「${sc.title.split('（')[0]}」の4カ国特定`,
        promptBody: `次の図中の ア〜エ は、${sortJa(targets.map((t) => t.nameJa)).join('、')}のいずれかである。「${target.nameJa}」に該当する点を一つ選びなさい。`,
        scatterPlot: {
          title: sc.title.split('（')[0],
          xLabel: sc.xLabel,
          yLabel: sc.yLabel,
          backgroundPoints: [],
          targetPoints: targets.map((t, i) => ({
            code: codes[i],
            x: t.x,
            y: t.y,
            color: POINT_COLORS[i],
          })),
        },
        choices: codes.map((c) => c),
        correctIndex: targetIdx,
        explanation: `正解は ${codes[targetIdx]}（${target.nameJa}）。${sc.examPoint}`,
        detailNotes: targets.map(
          (t, i) =>
            `${codes[i]}＝${t.nameJa}（${t.x} / ${t.y}${t.note ? `：${t.note}` : ''}）`,
        ),
        relatedIso3s: targets.map((t) => t.iso3),
      };
    }
  }

  // 約30%: 標準68カ国・異なる類型間での動的2指標散布図
  for (const def of shuffle(DYNAMIC_SCATTERS)) {
    const allPts: { iso3: string; nameJa: string; x: number; y: number; note: string }[] = [];
    for (const c of Object.values(countries)) {
      if (!EXAM_STANDARD_ISO3_SET.has(c.iso3) || c.isBasicEntry) continue;
      const xy = def.extract(c);
      if (!xy) continue;
      allPts.push({
        iso3: c.iso3,
        nameJa: cleanCountryName(c.nameJa),
        x: xy.x,
        y: xy.y,
        note: def.noteOf(c, xy.x, xy.y),
      });
    }

    const targets = selectSpreadTargetsStandard(allPts, 4);
    if (!targets) continue;

    const codes = ['ア', 'イ', 'ウ', 'エ'];
    const targetIdx = Math.floor(Math.random() * 4);
    const target = targets[targetIdx];

    return {
      id: `drill_sc_${nonce}`,
      genre: 'scatter_plot',
      genreLabel: '散布図・2指標分析',
      promptTitle: `散布図「${def.title}」の4カ国特定`,
      promptBody: `次の図中の ア〜エ は、${sortJa(targets.map((t) => t.nameJa)).join('、')}のいずれかである。「${target.nameJa}」に該当する点を一つ選びなさい。`,
      scatterPlot: {
        title: def.title,
        xLabel: def.xLabel,
        yLabel: def.yLabel,
        backgroundPoints: [],
        showDiagonal: def.showDiagonal,
        diagonalLabel: def.diagonalLabel,
        targetPoints: targets.map((t, i) => ({
          code: codes[i],
          x: t.x,
          y: t.y,
          color: POINT_COLORS[i],
        })),
      },
      choices: codes.map((c) => c),
      correctIndex: targetIdx,
      explanation: `正解は ${codes[targetIdx]}（${target.nameJa}）。横軸（${def.xLabel}）と縦軸（${def.yLabel}）の相対位置から発展段階・地域構造を比較して特定する。`,
      detailNotes: targets.map((t, i) => `${codes[i]}：${t.note}`),
      relatedIso3s: targets.map((t) => t.iso3),
    };
  }

  return null;
}

// ============================================================================
// 5. 構成比グラフ読取（100%横帯グラフ・全行<1%の死んだ凡例を自動排除・標準国限定）
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

  if (charts.length > 0 && Math.random() < 0.6) {
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
          return vec.reduce((acc, v, si) => acc + Math.abs(v - pVec[si]), 0) >= 28;
        });
        if (distinct) {
          pickedIndices.push(idx);
          if (pickedIndices.length === 3) break;
        }
      }
      if (pickedIndices.length < 3) continue;

      // 選択した3カ国すべてで1%未満となる死んだ凡例項目を自動除外
      const activeSeriesIdx = ch.series
        .map((_, si) => si)
        .filter((si) => pickedIndices.some((ci) => (ch.series[si].values[ci] ?? 0) >= 1));
      if (activeSeriesIdx.length < 2) continue;

      const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
      const chosenNames = pickedIndices.map((idx) => cleanCountryName(cats[idx])) as [
        string,
        string,
        string,
      ];
      const { choices, correctIndex } = makeAll6Permutations(labels, chosenNames);
      const findIso = (n: string) =>
        Object.values(countries).find((c) => cleanCountryName(c.nameJa) === n)?.iso3;

      const cleanTitle = ch.title.replace(/^主要\d+カ国の/, '').split('（')[0].trim() || ch.title;

      return {
        id: `drill_cb_${nonce}`,
        genre: 'composition_bar',
        genreLabel: '構成比グラフ読取',
        promptTitle: `${cleanTitle}の構成比比較`,
        promptBody: `次の帯グラフ（ア〜ウ）は、${sortJa(chosenNames).join('、')}における「${cleanTitle}」の構成比を示している。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
        stackedBars: {
          caption: `${cleanTitle}（単位：${ch.unit}）`,
          unit: ch.unit,
          series: activeSeriesIdx.map((si, pos) => ({
            name: ch.series[si].name,
            color: ch.series[si].color ?? STACK_PALETTE[pos % STACK_PALETTE.length],
          })),
          rows: pickedIndices.map((ci, idx) => ({
            label: labels[idx],
            values: activeSeriesIdx.map((si) => ch.series[si].values[ci] ?? 0),
          })),
        },
        choices,
        correctIndex,
        explanation: ch.examPoint ?? ch.note ?? `${cleanTitle}の特徴から3カ国を識別する。`,
        detailNotes: pickedIndices.map((ci, idx) => {
          const vals = activeSeriesIdx
            .map((si) => `${ch.series[si].name}:${ch.series[si].values[ci] ?? 0}${ch.unit}`)
            .join('・');
          return `${labels[idx]}（${chosenNames[idx]}）：${vals}`;
        }),
        relatedIso3s: chosenNames.map(findIso).filter((id): id is string => Boolean(id)),
      };
    }
  }

  if (Math.random() < 0.45) {
    const relPool: { country: CountryData; vec: number[]; dominantIdx: number }[] = [];
    const buckets = ['キリスト教', 'イスラム教', 'ヒンドゥー教', '仏教', 'その他・無宗教等'];
    for (const c of Object.values(countries)) {
      if (!EXAM_STANDARD_ISO3_SET.has(c.iso3) || c.isBasicEntry || !c.stats) continue;
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
        const vec = buckets.map((bk) => Number(map[bk].toFixed(1)));
        let dom = 0;
        for (let bi = 1; bi < vec.length; bi++) {
          if (vec[bi] > vec[dom]) dom = bi;
        }
        relPool.push({ country: c, vec, dominantIdx: dom });
      }
    }

    const picked: typeof relPool = [];
    for (const item of shuffle(relPool)) {
      const distinct = picked.every(
        (p) =>
          p.dominantIdx !== item.dominantIdx &&
          item.vec.reduce((acc, v, i) => acc + Math.abs(v - p.vec[i]), 0) >= 45,
      );
      if (distinct) {
        picked.push(item);
        if (picked.length === 3) break;
      }
    }
    if (picked.length === 3) {
      const baseSeries = [
        { name: 'キリスト教', color: '#2563eb' },
        { name: 'イスラム教', color: '#10b981' },
        { name: 'ヒンドゥー教', color: '#f59e0b' },
        { name: '仏教', color: '#8b5cf6' },
        { name: 'その他・無宗教等', color: '#94a3b8' },
      ];
      // 3カ国すべてで1%未満となる宗教は凡例に表示しない
      const activeIdx = baseSeries
        .map((_, i) => i)
        .filter((i) => picked.some((p) => p.vec[i] >= 1));

      const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = picked.map((p) => cleanCountryName(p.country.nameJa)) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(labels, names);

      return {
        id: `drill_cb_${nonce}`,
        genre: 'composition_bar',
        genreLabel: '構成比グラフ読取',
        promptTitle: '宗教別人口構成比の国名判別',
        promptBody: `次の帯グラフ（ア〜ウ）は、${sortJa(names).join('、')}の主な宗教別人口割合（%）を示している。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
        stackedBars: {
          caption: '主要宗教別の人口構成割合（%）',
          unit: '%',
          series: activeIdx.map((i) => baseSeries[i]),
          rows: picked.map((p, i) => ({
            label: labels[i],
            values: activeIdx.map((bi) => p.vec[bi]),
          })),
        },
        choices,
        correctIndex,
        explanation:
          '各国の歴史的宗教伝播（欧州・中南米のキリスト教、西アジア・北アフリカ・尼/巴のイスラム教、南アジアのヒンドゥー教、東南アジア大陸部の仏教、東アジアの無宗教・諸宗教）を手がかりに判別する。',
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
    (c) => EXAM_STANDARD_ISO3_SET.has(c.iso3) && !c.isBasicEntry && c.stats?.sectorShare,
  );
  const pickedSec: CountryData[] = [];
  for (const c of shuffle(sectorPool)) {
    const s = c.stats!.sectorShare;
    const archC = getArchetype(c.iso3);
    const distinct = pickedSec.every((p) => {
      if (getArchetype(p.iso3) === archC) return false;
      const ps = p.stats!.sectorShare;
      return (
        Math.abs(s.primaryPct - ps.primaryPct) +
          Math.abs(s.secondaryPct - ps.secondaryPct) +
          Math.abs(s.tertiaryPct - ps.tertiaryPct) >=
        40
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
    promptTitle: '産業部門別就業人口構成比の判別',
    promptBody: `次の帯グラフ（ア〜ウ）は、${sortJa(names).join('、')}の産業部門別就業人口割合（%）を示している。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
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
      'ペティ＝クラークの法則に基づき、1人当たりGDPの上昇とともに就業重心は第1次→第2次→第3次産業へと移行する。',
    detailNotes: pickedSec.map((c, i) => {
      const sh = c.stats!.sectorShare;
      return `${labels[i]}（${cleanCountryName(c.nameJa)}）：1次 ${sh.primaryPct}% / 2次 ${sh.secondaryPct}% / 3次 ${sh.tertiaryPct}%（1人GDP $${c.stats!.gdpPerCapitaUsd.toLocaleString()}）`;
    }),
    relatedIso3s: pickedSec.map((c) => c.iso3),
  };
}

// ============================================================================
// 6. 時系列・推移グラフ読取（折れ線6択 ＋ 2時点3国表 ＋ 構造推移4択）
// ============================================================================

function makeTimeShiftQuestion(
  worldRankings: WorldRankingsDataset | null,
  countries: Record<string, CountryData>,
  sliders: TimeSeriesSliderItem[],
  nonce: number,
): GeneratedDrillQuestion | null {
  const lineCharts = (worldRankings?.comparisonCharts ?? []).filter(
    (ch) => ch.kind === 'line' && ch.categories && ch.categories.length >= 5 && ch.series.length >= 3,
  );
  const nameToIso = new Map<string, string>();
  for (const c of Object.values(countries)) {
    nameToIso.set(cleanCountryName(c.nameJa), c.iso3);
  }

  const roll = Math.random();

  // 約45%: 複数年推移折れ線グラフ（サ・シ・ス 6択）
  if (lineCharts.length > 0 && roll < 0.45) {
    for (const ch of shuffle(lineCharts)) {
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
          return maxD >= 0.16;
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
      const cleanTitle = ch.title.replace(/^主要\d+カ国の?\s*/, '').split('（')[0].trim();

      return {
        id: `drill_ts_${nonce}`,
        genre: 'time_shift',
        genreLabel: '時系列・推移グラフ読取',
        promptTitle: `推移グラフ「${cleanTitle}」の判別`,
        promptBody: `次のグラフ中の サ〜ス は、${sortJa(names).join('、')}のいずれかの${isRegionalChart ? '地域' : '国'}における「${cleanTitle}」（単位：${ch.unit}）の推移を示している。名称と サ〜ス との正しい組合せを一つ選びなさい。`,
        lineTrend: {
          title: cleanTitle,
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
        explanation: ch.examPoint ?? ch.note ?? `${cleanTitle}の変化傾向や逆転時期を手がかりに判別する。`,
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

  // 約22%: 3時点数値比較表（3カ国ア〜ウの長期変化を6択判別）
  if (lineCharts.length > 0 && roll >= 0.45 && roll < 0.67) {
    for (const ch of shuffle(lineCharts)) {
      const eligibleSeries = ch.series.filter(
        (s) => s.name !== 'EU27合計' && s.name !== '世界平均',
      );
      if (eligibleSeries.length < 3 || ch.categories!.length < 4) continue;
      const scale = Math.max(1e-6, ...eligibleSeries.flatMap((s) => s.values.map(Math.abs)));
      const picked: typeof eligibleSeries = [];
      for (const s of shuffle(eligibleSeries)) {
        const distinct = picked.every(
          (p) => Math.max(...s.values.map((v, i) => Math.abs(v - p.values[i]) / scale)) >= 0.16,
        );
        if (distinct) {
          picked.push(s);
          if (picked.length === 3) break;
        }
      }
      if (picked.length < 3) continue;

      const cats = ch.categories!;
      const yIdx = [0, Math.floor((cats.length - 1) / 2), cats.length - 1];
      const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = picked.map((s) => cleanCountryName(s.name)) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(codes, names);
      const cleanTitle = ch.title.replace(/^主要\d+カ国の?\s*/, '').split('（')[0].trim();

      return {
        id: `drill_ts_${nonce}`,
        genre: 'time_shift',
        genreLabel: '時系列・推移グラフ読取',
        promptTitle: `3時点変化「${cleanTitle}」の判別`,
        promptBody: `次の表中の ア〜ウ は、${sortJa(names).join('、')}のいずれかにおける「${cleanTitle}」（単位：${ch.unit}）の3時点の数値を示したものである。名称と ア〜ウ との正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${cleanTitle}（単位：${ch.unit}）`,
          headers: ['記号', ...yIdx.map((i) => cats[i])],
          rows: picked.map((s, ri) => [
            codes[ri],
            ...yIdx.map((yi) => formatNum(s.values[yi] ?? 0)),
          ]),
        },
        choices,
        correctIndex,
        explanation: ch.examPoint ?? ch.note ?? `${cleanTitle}の増加率や逆転関係から3カ国を特定する。`,
        detailNotes: picked.map(
          (s, i) =>
            `${codes[i]}＝${names[i]}：${yIdx.map((yi) => `${cats[yi]}(${formatNum(s.values[yi] ?? 0)})`).join(' → ')}`,
        ),
        relatedIso3s: names
          .map((n) => nameToIso.get(n))
          .filter((id): id is string => Boolean(id)),
      };
    }
  }

  // 約33%: 構造変化スライダー（背景解説なし・数値のみで国名または指標名を特定）
  const eligibleSliders = sliders.filter(
    (s) => MANUAL_SLIDER_QUIZ_SPECS[s.id] && s.frames.length >= 2 && s.frames[0].items.length >= 3,
  );
  if (eligibleSliders.length > 0) {
    const target = shuffle(eligibleSliders)[0];
    const spec = MANUAL_SLIDER_QUIZ_SPECS[target.id];
    const midIdx = Math.floor((target.frames.length - 1) / 2);
    const chosenFrames =
      target.frames.length >= 3
        ? [target.frames[0], target.frames[midIdx], target.frames[target.frames.length - 1]]
        : [target.frames[0], target.frames[target.frames.length - 1]];

    const rows = chosenFrames.map((fr) => [
      fr.yearLabel,
      fr.items
        .slice(0, 4)
        .map((it, idx) => `${idx + 1}. ${cleanCountryName(it.label)}(${formatNum(it.value)}${target.unit})`)
        .join(' ／ '),
    ]);

    const distractors = shuffle(spec.choicesPool.filter((c) => c !== spec.answerLabel)).slice(0, 3);
    const choices = shuffle([spec.answerLabel, ...distractors]);

    return {
      id: `drill_ts_${nonce}`,
      genre: 'time_shift',
      genreLabel: '時系列・推移グラフ読取',
      promptTitle:
        spec.mode === 'country'
          ? `時系列「${spec.promptSubject}」からの国名特定`
          : `時系列「${spec.promptSubject}」からの統計テーマ特定`,
      promptBody:
        spec.mode === 'country'
          ? `次の表は、ある国の「${spec.promptSubject}」を複数時点で示したものである。この推移に該当する国を、以下の ①〜④ のうちから一つ選びなさい。`
          : `次の表は、ある統計テーマにおける複数時点の「${spec.promptSubject}」（単位：${target.unit}）を示している。この表が示す統計項目として最も適当なものを一つ選びなさい。`,
      table: {
        caption: `${spec.promptSubject}（${chosenFrames[0].yearLabel} → ${chosenFrames[chosenFrames.length - 1].yearLabel}）`,
        headers: ['時点', '構成比・上位数値'],
        rows,
      },
      choices,
      correctIndex: choices.indexOf(spec.answerLabel),
      explanation: `正解は「${spec.answerLabel}」。背景：${target.shiftSummary}`,
      detailNotes: chosenFrames.map((fr) => `${fr.yearLabel}の背景：${fr.periodNote}`),
      relatedIso3s: target.relatedIso3s.slice(0, 4),
    };
  }

  return null;
}

// ============================================================================
// 7. 雨温図・ハイサーグラフ判別（共通テスト比較コホート12組中心・即答緯度廃止）
// ============================================================================

function makeClimateCoordsQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  // 約55%: 世界地図上の地点(A〜C)と3都市雨温図/ハイサーグラフ(ア〜ウ)を結び付ける共テ実戦問題
  if (Math.random() < 0.55) {
    const mapLinked = makeClimateMapLinkedQuestion(countries, nonce, focusIso3);
    if (mapLinked) return mapLinked;
  }

  const cityById = new Map<string, { country: CountryData; city: ClimateCity }>();
  for (const c of Object.values(countries)) {
    if (c.isBasicEntry) continue;
    for (const ct of c.climate.cities) {
      if (ct.monthlyTempC.length === 12 && ct.monthlyPrecipMm.length === 12) {
        cityById.set(ct.cityId, { country: c, city: ct });
      }
    }
  }

  const labelFor = (e: { country: CountryData; city: ClimateCity }) =>
    `${e.city.nameJa}（${cleanCountryName(e.country.nameJa)}）`;

  for (const coh of shuffle(CLIMATE_COHORT_SPECS)) {
    const resolved = coh.cityIds
      .map((id) => cityById.get(id))
      .filter((x): x is { country: CountryData; city: ClimateCity } => Boolean(x));
    if (resolved.length < 3) continue;

    const chartType: 'climograph' | 'hythergraph' = Math.random() < 0.35 ? 'hythergraph' : 'climograph';
    const roll = Math.random();

    // 約55%: 共通テスト最頻出「3地点（ア〜ウ）の雨温図／ハイサーグラフ比較6択」
    if (roll < 0.55) {
      const sub3 = shuffle(resolved).slice(0, 3);
      const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = sub3.map(labelFor) as [string, string, string];
      const { choices, correctIndex } = makeAll6Permutations(codes, names);

      return {
        id: `drill_cl_${nonce}`,
        genre: 'climate_coords',
        genreLabel: '雨温図・ハイサーグラフ',
        promptTitle: `3地点の${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}比較判別`,
        promptBody: `次の3つの${chartType === 'hythergraph' ? 'ハイサーグラフ（横軸:降水量・縦軸:気温）' : '雨温図'}（ア〜ウ、縦横軸は共通スケール）は、${coh.theme}に含まれる ${sortJa(names).join('、')} のいずれかである。都市名と ア〜ウ との正しい組合せを一つ選びなさい。`,
        climateChartType: chartType,
        climateCities: sub3.map((e, i) => ({
          label: `地点 ${codes[i]}`,
          city: e.city,
          metaText: '',
        })),
        choices,
        correctIndex,
        explanation: coh.examPoint,
        detailNotes: sub3.map(
          (p, i) =>
            `地点 ${codes[i]}＝${labelFor(p)}：${p.city.koppenCode}（北/南緯 ${p.city.lat.toFixed(1)}°・標高 ${p.city.elevationM ?? '-'}m）— ${p.city.factors.slice(0, 2).join('・')}`,
        ),
        relatedIso3s: sub3.map((p) => p.country.iso3),
      };
    }

    // 約45%: 同じ比較群4都市の中から、1つの雨温図／ハイサーグラフを見て都市を特定（4択・緯度ネタバレなし）
    const shuffled4 = shuffle(resolved);
    const target = shuffled4[0];
    const answer = labelFor(target);
    const choices = shuffle(shuffled4.map(labelFor));

    return {
      id: `drill_cl_${nonce}`,
      genre: 'climate_coords',
      genreLabel: '雨温図・ハイサーグラフ',
      promptTitle: `${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}からの都市特定`,
      promptBody: `次の${chartType === 'hythergraph' ? 'ハイサーグラフ（横軸:降水量・縦軸:気温）' : '雨温図'}は、「${coh.theme}」に含まれる4都市（選択肢①〜④）のうちの1地点を示したものである。該当する都市を一つ選びなさい。`,
      climateChartType: chartType,
      climateCity: target.city,
      choices,
      correctIndex: choices.indexOf(answer),
      explanation: `正解は ${answer}（気候区分 ${target.city.koppenCode}）。${coh.examPoint}`,
      detailNotes: shuffled4.map(
        (p) =>
          `${labelFor(p)}：${p.city.koppenCode}（緯度 ${p.city.lat.toFixed(1)}°・標高 ${p.city.elevationM ?? '-'}m）— ${p.city.factors[0] ?? ''}`,
      ),
      relatedIso3s: shuffled4.map((p) => p.country.iso3),
    };
  }

  return null;
}

// ============================================================================
// 8. 人口ピラミッド判別（5大類型・厳選32カ国、異なる類型からのみ出題）
// ============================================================================

function pyramidL1Distance(a: AgePyramidBin[], b: AgePyramidBin[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += Math.abs(a[i].malePct - b[i].malePct) + Math.abs(a[i].femalePct - b[i].femalePct);
  }
  return sum;
}

function makePyramidQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const chosenArchGroups = shuffle(PYRAMID_COHORT_ARCHETYPES).slice(0, 4);
  const picked: { groupLabel: string; country: CountryData }[] = [];

  for (const grp of chosenArchGroups) {
    const validInGrp = shuffle(
      grp.iso3s
        .map((iso) => countries[iso])
        .filter((c): c is CountryData => Boolean(c?.stats?.agePyramid && c.stats.agePyramid.length >= 6)),
    );
    const chosen = validInGrp.find((cand) =>
      picked.every((p) => pyramidL1Distance(cand.stats!.agePyramid, p.country.stats!.agePyramid) >= 14),
    );
    if (chosen) {
      picked.push({ groupLabel: grp.groupLabel, country: chosen });
    }
  }
  if (picked.length < 3) return null;

  const roll = Math.random();
  // 約55%: 3国比較（ア〜ウ）6択（必ず富士山・釣鐘/移行・つぼ・湾岸等の異なる類型から3国）
  if (roll < 0.55 || picked.length < 4) {
    const sub3 = picked.slice(0, 3);
    const labels: [string, string, string] = ['ア', 'イ', 'ウ'];
    const names = sub3.map((p) => cleanCountryName(p.country.nameJa)) as [string, string, string];
    const { choices, correctIndex } = makeAll6Permutations(labels, names);

    return {
      id: `drill_pyr_${nonce}`,
      genre: 'pyramid_match',
      genreLabel: '人口ピラミッド判別',
      promptTitle: '3カ国の人口ピラミッド比較（共通横軸スケール）',
      promptBody: `次の3つの人口ピラミッド（ア〜ウ、横軸スケール共通）は、${sortJa(names).join('、')}のいずれかを示している。国名と ア〜ウ との正しい組合せを一つ選びなさい。`,
      pyramidPair: sub3.map((p, i) => ({
        label: `国 ${labels[i]}`,
        bins: p.country.stats!.agePyramid,
      })),
      choices,
      correctIndex,
      explanation:
        '年少人口（底辺0〜14歳）の幅、生産年齢人口男女の不均衡（青色の男性が突出＝湾岸産油国の単身出稼ぎ受入）、高齢層（65歳以上）の厚みを見比べて判別する。',
      detailNotes: sub3.map(
        (p, i) =>
          `国 ${labels[i]}＝${cleanCountryName(p.country.nameJa)}：${p.groupLabel}（出生率 ${p.country.stats!.fertilityRate?.toFixed(2) ?? '-'}・1人GDP $${p.country.stats!.gdpPerCapitaUsd.toLocaleString()}）`,
      ),
      relatedIso3s: sub3.map((p) => p.country.iso3),
    };
  }

  // 約45%: 4類型4カ国からの単一ピラミッド特定
  const target = picked[0];
  const answer = cleanCountryName(target.country.nameJa);
  const choices = shuffle(picked.map((p) => cleanCountryName(p.country.nameJa)));

  return {
    id: `drill_pyr_${nonce}`,
    genre: 'pyramid_match',
    genreLabel: '人口ピラミッド判別',
    promptTitle: '人口ピラミッドからの国名特定',
    promptBody: '次の人口ピラミッドに当てはまる国を、以下の ①〜④ のうちから一つ選びなさい。',
    pyramidBins: target.country.stats!.agePyramid,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」（${target.groupLabel}・出生率 ${target.country.stats!.fertilityRate?.toFixed(2) ?? '-'}・1人GDP $${target.country.stats!.gdpPerCapitaUsd.toLocaleString()}）。`,
    detailNotes: picked.map(
      (p) =>
        `${cleanCountryName(p.country.nameJa)}：${p.groupLabel}（出生率 ${p.country.stats!.fertilityRate?.toFixed(2) ?? '-'}・都市率 ${p.country.stats!.urbanPopRatePct}%）`,
    ),
    relatedIso3s: picked.map((p) => p.country.iso3),
  };
}

// ============================================================================
// 9. 景観写真・地域推論（問題側ヒント完全ゼロ＋共テ形式の因果文選択も出題）
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
  const picked = [target, ...sameCat].slice(0, 4);
  if (picked.length < 4) return null;

  // 約55%: 共通テスト本試スタイル（景観に対応する自然・生活の因果説明文を4択から選ぶ）
  if (Math.random() < 0.55) {
    const answerText = target.inferenceSummary;
    const choices = shuffle(picked.map((e) => e.inferenceSummary));
    if (new Set(choices).size === 4) {
      return {
        id: `drill_ph_${nonce}`,
        genre: 'photo_infer',
        genreLabel: '景観写真・地域推論',
        promptTitle: '景観写真からの自然環境・人間生活推論',
        promptBody:
          '下の写真に見られる景観や地域の特徴について述べた文として最も適当なものを、以下の ①〜④ のうちから一つ選びなさい。',
        photoUrl: target.photoUrl,
        choices,
        correctIndex: choices.indexOf(answerText),
        explanation: `正解は「${target.title}（${target.locationLabel}、気候 ${target.koppenCodes.join('/')}）」。`,
        detailNotes: [
          `着眼点：${target.visualClues.join('／')}`,
          `試験での整理：${target.examPoint}`,
        ],
        relatedIso3s: target.relatedIso3s,
      };
    }
  }

  // 約45%: 簡潔な景観・地域名4択（二重括弧を整理）
  const formatChoice = (e: PhotoEncyclopediaEntry) =>
    `${e.title}（${cleanCountryName(e.locationLabel)}）`;
  const answer = formatChoice(target);
  const choices = shuffle(picked.map(formatChoice));

  return {
    id: `drill_ph_${nonce}`,
    genre: 'photo_infer',
    genreLabel: '景観写真・地域推論',
    promptTitle: '景観写真からの地域・土地利用推論',
    promptBody: '下の写真に見られる景観・土地利用・建築様式に該当するものを一つ選びなさい。',
    photoUrl: target.photoUrl,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」（代表気候 ${target.koppenCodes.join('/')}）。因果：${target.inferenceSummary}`,
    detailNotes: [
      `着眼点：${target.visualClues.join('／')}`,
      `試験での見分け方：${target.examPoint}`,
    ],
    relatedIso3s: target.relatedIso3s,
  };
}

const DOMAIN_BY_GENRE: Record<Exclude<DrillGenre, 'all'>, string> = {
  unseen_infer: '初見統計推論',
  map_choropleth: '地図統計読取',
  subnational_jpn: '地誌・国内統計',
  stat_country: '統計・経済貿易',
  stat_double_blind: '統計・経済貿易',
  stat_item: '農産・工業生産',
  scatter_plot: '経済・人口指標',
  composition_bar: '構成比・貿易',
  time_shift: '時系列変化',
  climate_coords: '自然・気候',
  pyramid_match: '人口構造',
  photo_infer: '景観・地誌',
};

const CATEGORY_TO_GENRES: Record<string, Exclude<DrillGenre, 'all'>[]> = {
  climate: ['climate_coords', 'map_choropleth', 'unseen_infer', 'photo_infer'],
  nature_climate: ['climate_coords', 'map_choropleth', 'unseen_infer', 'photo_infer'],
  climate_soil_env: ['climate_coords', 'map_choropleth', 'unseen_infer', 'photo_infer'],
  map_gis: ['map_choropleth', 'climate_coords', 'subnational_jpn'],
  landform_disaster: ['unseen_infer', 'photo_infer', 'map_choropleth', 'subnational_jpn'],
  agriculture: ['stat_item', 'unseen_infer', 'stat_double_blind', 'subnational_jpn'],
  agriculture_primary: ['stat_item', 'unseen_infer', 'stat_double_blind', 'subnational_jpn'],
  resource: ['unseen_infer', 'composition_bar', 'stat_country', 'time_shift', 'stat_item'],
  industry: ['unseen_infer', 'composition_bar', 'stat_country', 'time_shift', 'stat_item'],
  industry_economy: ['unseen_infer', 'composition_bar', 'stat_country', 'time_shift', 'stat_item'],
  resource_industry: ['unseen_infer', 'composition_bar', 'stat_country', 'time_shift'],
  society: ['pyramid_match', 'scatter_plot', 'unseen_infer', 'map_choropleth'],
  urban_population: ['pyramid_match', 'scatter_plot', 'unseen_infer', 'map_choropleth'],
  population_urban: ['pyramid_match', 'scatter_plot', 'unseen_infer', 'map_choropleth'],
  religion_culture: ['unseen_infer', 'subnational_jpn', 'photo_infer', 'map_choropleth'],
  culture_regional: ['unseen_infer', 'subnational_jpn', 'photo_infer', 'map_choropleth'],
  subnational: ['subnational_jpn'],
  japan: ['subnational_jpn'],
  map_disaster: ['map_choropleth', 'unseen_infer', 'climate_coords'],
};

function finalizeDrillQuestion(q: GeneratedDrillQuestion): GeneratedDrillQuestion {
  const sig =
    q.signature ??
    `${q.genre}:${q.promptTitle}:${[...q.relatedIso3s].sort().join(',')}:${q.choices[q.correctIndex] ?? ''}`;
  const steps = buildStepByStepExplanation(q);
  return {
    ...q,
    signature: sig,
    domainTag: q.domainTag ?? DOMAIN_BY_GENRE[q.genre] ?? q.genreLabel,
    steps,
  };
}

/**
 * 指定ジャンル（または全ジャンルおまかせ）の実戦問題をデータから自動生成する。
 * recentSignatures で直近25問の重複を抑制し、focusFilter による国・分野絞り込みにも対応する。
 */
export function generateDrillQuestion(
  genre: DrillGenre,
  params: DrillGeneratorParams,
  nonce: number,
): GeneratedDrillQuestion | null {
  const focusIso3 = params.focusFilter?.iso3;
  const recentSet = new Set(params.recentSignatures ?? []);

  const tryGenre = (g: Exclude<DrillGenre, 'all'>, seed: number): GeneratedDrillQuestion | null => {
    let raw: GeneratedDrillQuestion | null = null;
    if (g === 'unseen_infer') {
      raw = makeUnseenInferQuestion(seed, focusIso3);
    } else if (g === 'map_choropleth') {
      raw = makeMapChoroplethQuestion(params.countriesData, params.worldRankings, seed, focusIso3);
    } else if (g === 'subnational_jpn') {
      raw = makeSubnationalAndJapanQuestion(params.countriesData, params.japanData, seed, focusIso3);
    } else if (g === 'stat_country') {
      if (Math.random() < 0.34) {
        raw = makeCuratedStatTwistQuestion(params.countriesData, seed, focusIso3);
      }
      if (!raw) {
        raw = makeStatCountryQuestion(params.worldRankings, params.countriesData, seed);
      }
    } else if (g === 'stat_double_blind') {
      raw = makeStatDoubleBlindQuestion(params.worldRankings, params.countriesData, seed);
    } else if (g === 'stat_item') {
      raw = makeStatItemQuestion(params.worldRankings, params.countriesData, seed);
    } else if (g === 'scatter_plot') {
      raw = makeScatterPlotQuestion(params.worldRankings, params.countriesData, seed);
    } else if (g === 'composition_bar') {
      raw = makeCompositionBarQuestion(params.worldRankings, params.countriesData, seed);
    } else if (g === 'time_shift') {
      raw = makeTimeShiftQuestion(
        params.worldRankings,
        params.countriesData,
        params.timeSliders,
        seed,
      );
    } else if (g === 'climate_coords') {
      raw = makeClimateCoordsQuestion(params.countriesData, seed, focusIso3);
    } else if (g === 'pyramid_match') {
      raw = makePyramidQuestion(params.countriesData, seed);
    } else {
      raw = makePhotoInferQuestion(params.photoEncyclopedia, seed);
    }

    return raw ? finalizeDrillQuestion(raw) : null;
  };

  // focusFilter がある場合の優先ジャンル列
  const focusGenres =
    params.focusFilter?.category && CATEGORY_TO_GENRES[params.focusFilter.category]
      ? CATEGORY_TO_GENRES[params.focusFilter.category]
      : null;

  let fallbackBest: GeneratedDrillQuestion | null = null;

  if (genre !== 'all') {
    for (let attempt = 0; attempt < 24; attempt++) {
      const q = tryGenre(genre, nonce * 31 + attempt);
      if (!q) continue;
      const matchesIso = !focusIso3 || q.relatedIso3s.includes(focusIso3);
      const isFresh = !q.signature || !recentSet.has(q.signature);
      if (matchesIso && isFresh) return q;
      if (matchesIso && !fallbackBest) fallbackBest = q;
      if (!fallbackBest) fallbackBest = q;
    }
    if (fallbackBest) return fallbackBest;
  }

  // 'all' または対象ジャンルで再探索
  const baseGenres = focusGenres
    ? [...focusGenres, ...ALL_WEIGHTED_GENRES]
    : ALL_WEIGHTED_GENRES;

  for (let round = 0; round < 3; round++) {
    const order = focusGenres && round === 0 ? baseGenres : shuffle(baseGenres);
    for (let i = 0; i < order.length; i++) {
      const q = tryGenre(order[i], nonce * 97 + round * 37 + i);
      if (!q) continue;
      const matchesIso = !focusIso3 || q.relatedIso3s.includes(focusIso3);
      const isFresh = !q.signature || !recentSet.has(q.signature);
      if (matchesIso && isFresh) return q;
      if (matchesIso && !fallbackBest) fallbackBest = q;
      if (!fallbackBest) fallbackBest = q;
    }
  }
  return fallbackBest;
}

/**
 * 共通テスト本番形式（全10問バランス構成）の「実戦ミニ模試」セットを生成する。
 * 初見統計推論・地図統計・国内/日本地理・グラフ読取・気候・人口・景観を網羅。
 */
export function generateMiniMockSet(
  params: DrillGeneratorParams,
  nonceBase: number,
): GeneratedDrillQuestion[] {
  const blueprint: Exclude<DrillGenre, 'all'>[] = [
    'map_choropleth',
    'climate_coords',
    'unseen_infer',
    'unseen_infer',
    'subnational_jpn',
    'subnational_jpn',
    'stat_double_blind',
    'stat_country',
    'scatter_plot',
    'pyramid_match',
  ];

  // Q9, Q10 は出題バリエーションを持たせる（構成比・推移・景観写真も織り交ぜる）
  const altQ9: Exclude<DrillGenre, 'all'>[] = ['scatter_plot', 'composition_bar', 'time_shift'];
  const altQ10: Exclude<DrillGenre, 'all'>[] = ['pyramid_match', 'photo_infer'];
  blueprint[8] = altQ9[nonceBase % altQ9.length];
  blueprint[9] = altQ10[nonceBase % altQ10.length];

  const usedSigs: string[] = [...(params.recentSignatures ?? [])];
  const results: GeneratedDrillQuestion[] = [];

  for (let i = 0; i < blueprint.length; i++) {
    const targetGenre = blueprint[i];
    let q = generateDrillQuestion(
      targetGenre,
      { ...params, recentSignatures: usedSigs, focusFilter: null },
      nonceBase * 100 + i + 1,
    );
    if (!q || (q.signature && usedSigs.includes(q.signature))) {
      const alt = generateDrillQuestion(
        'all',
        { ...params, recentSignatures: usedSigs, focusFilter: null },
        nonceBase * 100 + 50 + i,
      );
      if (alt && !usedSigs.includes(alt.signature ?? '')) {
        q = alt;
      }
    }
    if (q) {
      results.push({
        ...q,
        id: `minimock_${nonceBase}_q${i + 1}_${q.genre}`,
      });
      if (q.signature) usedSigs.push(q.signature);
    }
  }

  return results;
}
