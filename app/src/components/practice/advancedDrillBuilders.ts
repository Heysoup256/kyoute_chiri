import type {
  ClimateCity,
  CountryData,
  JapanGeographyDataset,
  SubnationalProfile,
} from '../../types/schema_v1';
import type { GeneratedDrillQuestion } from './drillTypes';
import { CLIMATE_COHORT_SPECS, type StatMatrixSpec } from './statMatrices';
import {
  CHOROPLETH_MAP_INDICATORS,
  CHOROPLETH_SHARED_LEGEND,
  JAPAN_PREF_STAT_MATRICES,
  SUBNATIONAL_STAT_MATRICES,
  UNSEEN_DEDUCTION_MATRICES,
  buildQuartileFillMap,
  extractJapanDomesticMatrices,
} from './unseenDeductionData';

const ZONE_COLORS = ['#2563eb', '#059669', '#d97706', '#e11d48'];
const POINT_COLORS = ['#2563eb', '#e11d48', '#059669', '#d97706'];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sortJa(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, 'ja'));
}

function cleanCountryName(name: string): string {
  return name.split('（')[0].trim();
}

function fmtNum(v: number): string {
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString('ja-JP');
  if (Number.isInteger(v)) return v.toString();
  return Number(v.toFixed(1)).toString();
}

function make6Permutations(
  codes: [string, string, string],
  targets: [string, string, string],
): { choices: string[]; correctIndex: number } {
  const perms: [number, number, number][] = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  const entries = perms.map((p, idx) => ({
    text: `${codes[0]}：${targets[p[0]]} ／ ${codes[1]}：${targets[p[1]]} ／ ${codes[2]}：${targets[p[2]]}`,
    isCorrect: idx === 0,
  }));
  const mixed = shuffle(entries);
  return {
    choices: mixed.map((e) => e.text),
    correctIndex: mixed.findIndex((e) => e.isCorrect),
  };
}

/**
 * マトリックス内の数値が識別可能か（極端に酷似・全ゼロ列でないか）を確認する
 */
function hasHealthyVariance(rows: { values: number[] }[]): boolean {
  if (rows.length < 3) return false;
  const nCols = rows[0]?.values.length ?? 0;
  if (nCols === 0) return false;

  for (let c = 0; c < nCols; c++) {
    const colVals = rows.map((r) => r.values[c]);
    const span = Math.max(...colVals) - Math.min(...colVals);
    if (span <= 0) return false;
    const positive = colVals.filter((v) => v > 0).length;
    const negative = colVals.filter((v) => v < 0).length;
    if (positive + negative < Math.ceil(rows.length * 0.6)) return false;
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      let maxDiff = 0;
      for (let c = 0; c < nCols; c++) {
        const colVals = rows.map((r) => r.values[c]);
        const colSpan = Math.max(1, Math.max(...colVals) - Math.min(...colVals));
        maxDiff = Math.max(maxDiff, Math.abs(rows[i].values[c] - rows[j].values[c]) / colSpan);
      }
      if (maxDiff < 0.16) return false;
    }
  }
  return true;
}

/**
 * 2×2 / 3×3 両ブラインド表で、行と列を一意に識別できるか検証する
 */
function isBlindMatrixUnique(matrix: number[][]): boolean {
  const R = matrix.length;
  const C = matrix[0]?.length ?? 0;
  if (R < 2 || C < 2) return false;

  const colAllZero = Array.from({ length: C }, (_, c) =>
    matrix.every((row) => Math.abs(row[c]) < 1e-6),
  );
  if (colAllZero.some(Boolean)) return false;

  const rowSigs = matrix.map((r) => r.map((v) => Math.round(v)).join(','));
  if (new Set(rowSigs).size < R) return false;

  const colSigs = Array.from({ length: C }, (_, c) =>
    matrix.map((r) => Math.round(r[c])).join(','),
  );
  if (new Set(colSigs).size < C) return false;

  // 行と列を同時に入れ替えても同じになる対称行列を排除
  const rowSums = matrix.map((r) => r.reduce((a, b) => a + b, 0));
  if (Math.max(...rowSums) === 0) return false;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      const diff = matrix[i].reduce((acc, v, c) => acc + Math.abs(v - matrix[j][c]), 0);
      if (diff < 12) return false;
    }
  }
  for (let c1 = 0; c1 < C; c1++) {
    for (let c2 = c1 + 1; c2 < C; c2++) {
      const diff = matrix.reduce((acc, r) => acc + Math.abs(r[c1] - r[c2]), 0);
      if (diff < 12) return false;
    }
  }
  return true;
}

/**
 * 共通テスト式の「3段階消去法」思考プロセスを生成する
 */
export function buildStepByStepExplanation(q: GeneratedDrillQuestion): string[] {
  if (q.steps && q.steps.length >= 2) return q.steps;
  const steps: string[] = [];

  if (q.genre === 'unseen_infer') {
    steps.push('Step 1（未見指標の仕組みを仮定）：列見出し・単位から、どの自然条件や経済条件が値を押し上げるかを仮説立てする。');
    steps.push('Step 2（極端な数値からの切り分け）：最大値・最小値を示す行/列に、最も極端な背景を持つ国・指標を割り当てる。');
    steps.push('Step 3（残余の対比）：残る組合せを気候帯・宗教・流通・技術発達段階の違いで確定する。');
  } else if (q.genre === 'map_regional') {
    steps.push('Step 1（極値分布の把握）：濃色（高位）と薄色（低位）が、先進国・途上国・乾燥帯・高地・島嶼部のどこに集中しているかを確認する。');
    steps.push('Step 2（決定的対照地域の比較）：ラテンアメリカ・東アジア・アフリカ内陸など、指標ごとに色分けが逆転する地域で切り分ける。');
    steps.push('Step 3（残る地域の照合）：地域ごとの自然条件と経済・人口数値の整合性から最終確定する。');
  } else if (q.genre === 'stat_table') {
    steps.push('Step 1（基準項目の確定）：数値の差や特産地域性が最も明確な列（または行）から1〜2個を先に確定させる。');
    steps.push('Step 2（規模と割合の区別）：生産量・輸出量、あるいは総数と1人当たり／構成比の違いに注意して紛らわしい国・項目を分ける。');
    steps.push('Step 3（消去法）：確定した組合せと矛盾しない選択肢だけを残して最終決定する。');
  } else if (q.genre === 'climate_coords') {
    steps.push('Step 1（緯度と南北半球）：最暖月が7月なら北半球・1月なら南半球、年較差の大小で低緯度・海洋性と高緯度・内陸を分ける。');
    steps.push('Step 2（降水季節性）：夏少雨（Cs）・冬少雨（Aw/Cw）・年中多雨・年中乾燥のいずれかを地図上の位置と対応させる。');
    steps.push('Step 3（海流・標高の補正）：低緯度なのに冷涼なら高地、中緯度西岸で年較差が極小なら暖流と偏西風の影響を加味する。');
  } else if (q.genre === 'visual_infer') {
    steps.push('Step 1（構造の特徴抽出）：人口ピラミッドでは年少人口底辺と労働年齢・高齢層の幅を、景観写真では植生・建材・屋根・耕地形状を見る。');
    steps.push('Step 2（背景の因果特定）：少子高齢化・労働移民流入・モンスーン多雨・乾燥帯など形成要因を言語化する。');
    steps.push('Step 3（地域・国の確定）：特徴と完全に一致する国・地域だけを残す。');
  } else if (q.genre === 'graph_analysis') {
    steps.push('Step 1（軸・スケール・傾き確認）：縦横軸の指標、y=x基準線の上下、または部分構成比の絶対値と直近順位を把握する。');
    steps.push('Step 2（外れ点・急変系列）：最も右上の点、突出する割合、または逆転・急増した系列を先に特定する。');
    steps.push('Step 3（残りの相対位置）：残る項目・国の相対的な大小や推移差で確定する。');
  }

  return steps;
}

// ============================================================================
// A. 初見統計データ推論（正誤文なし・一部列隠し/両ブラインド/項目名当て）
// ============================================================================

export function makeUnseenInferQuestion(
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const pool = shuffle(UNSEEN_DEDUCTION_MATRICES);
  const prioritized = focusIso3
    ? [
        ...pool.filter((m) => m.rows.some((r) => r.iso3 === focusIso3)),
        ...pool.filter((m) => !m.rows.some((r) => r.iso3 === focusIso3)),
      ]
    : pool;

  for (const spec of prioritized) {
    const roll = Math.random();

    // 形式1（約40%）：3カ国（ア〜ウ）判別6択（約半数は3列からあえて1列を隠した2列版で難易度アップ）
    if (roll < 0.4) {
      const candidates =
        focusIso3 && spec.rows.some((r) => r.iso3 === focusIso3)
          ? [
              spec.rows.find((r) => r.iso3 === focusIso3)!,
              ...shuffle(spec.rows.filter((r) => r.iso3 !== focusIso3)),
            ].slice(0, 3)
          : shuffle(spec.rows).slice(0, 3);

      const ordered = shuffle(candidates);
      const useSubsetCols = Math.random() < 0.5 && spec.colLabels.length >= 3;
      const colIndices = useSubsetCols
        ? shuffle([0, 1, 2]).slice(0, 2).sort((a, b) => a - b)
        : spec.colLabels.map((_, i) => i);

      const projectedRows = ordered.map((r) => ({
        ...r,
        values: colIndices.map((ci) => r.values[ci]),
      }));
      if (!hasHealthyVariance(projectedRows)) continue;

      const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = ordered.map((r) => cleanCountryName(r.countryName)) as [string, string, string];
      const { choices, correctIndex } = make6Permutations(codes, names);
      const shownCols = colIndices.map((ci) => spec.colLabels[ci]);

      const steps = [
        `Step 1（着眼点）：指標の性質（${spec.inferenceAxis}）から、極端な値をとる国を先に見つける。`,
        ...ordered.map(
          (r, i) =>
            `Step ${i + 2}（${codes[i]}＝${cleanCountryName(r.countryName)}）：${spec.cueByIso3[r.iso3 ?? ''] ?? spec.examPoint}`,
        ),
      ];

      return {
        id: `drill_unseen_${nonce}`,
        genre: 'unseen_infer',
        genreLabel: '初見統計推論',
        domainTag: '初見統計推論',
        signature: `unseen6:${spec.id}:${colIndices.join('')}:${ordered.map((r) => r.iso3).sort().join(',')}`,
        promptTitle: `【初見データ推論】${spec.title}`,
        promptBody: `${spec.leadContext}表中の ア〜ウ は ${sortJa(names).join('、')} のいずれかである。国名と記号との正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${spec.title}（${useSubsetCols ? '抜粋2指標・' : ''}単位：${spec.unit}）`,
          headers: ['記号', ...shownCols.map((c) => `${c}(${spec.unit})`)],
          rows: projectedRows.map((r, i) => [codes[i], ...r.values.map((v) => fmtNum(v))]),
        },
        choices,
        correctIndex,
        explanation: spec.examPoint,
        steps,
        detailNotes: ordered.map(
          (r, i) => `${codes[i]}：${r.countryName} — ${spec.cueByIso3[r.iso3 ?? ''] ?? ''}`,
        ),
        relatedIso3s: ordered.map((r) => r.iso3).filter((x): x is string => Boolean(x)),
      };
    }

    // 形式2（約35%）：国名×項目 両方ブラインド（P・Q・R × カ・キ・ク）
    if (roll < 0.75) {
      const candRows = shuffle(spec.rows).slice(0, 3);
      const subM = candRows.map((r) => r.values);
      if (!isBlindMatrixUnique(subM)) continue;

      const rowCodes = ['P', 'Q', 'R'];
      const colCodes = ['カ', 'キ', 'ク'];
      const colOrder = shuffle([0, 1, 2]);
      const targetR = Math.floor(Math.random() * 3);
      const targetC = Math.floor(Math.random() * 3);
      const targetCountry = cleanCountryName(candRows[targetR].countryName);
      const targetCol = spec.colLabels[colOrder[targetC]];

      const countryStr = sortJa(candRows.map((r) => cleanCountryName(r.countryName))).join('、');
      const colStr = sortJa(colOrder.map((ci) => spec.colLabels[ci])).join('、');

      // 正解＋紛らわしい行/列誤りを含む6択（全9マスのうちターゲット含む6組合せ）
      const allCombos: { text: string; isAns: boolean }[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          allCombos.push({
            text: `${rowCodes[r]} — ${colCodes[c]}`,
            isAns: r === targetR && c === targetC,
          });
        }
      }
      const distractors = shuffle(allCombos.filter((x) => !x.isAns)).slice(0, 3);
      const choicesObjs = shuffle([allCombos.find((x) => x.isAns)!, ...distractors]);

      return {
        id: `drill_unseen_${nonce}`,
        genre: 'unseen_infer',
        genreLabel: '初見統計・両ブラインド',
        domainTag: '初見統計推論',
        signature: `unseen_db:${spec.id}:${candRows.map((r) => r.iso3).sort().join(',')}`,
        promptTitle: `【初見×両ブラインド】${spec.title}`,
        promptBody: `${spec.leadContext}表中の P〜R は ${countryStr} のいずれか、カ〜ク は ${colStr} のいずれか（単位：${spec.unit}）を示している。「${targetCountry}」と「${targetCol}」の組合せとして正しいものを一つ選びなさい。`,
        table: {
          caption: `${spec.title}（国・項目ともに記号表示、単位：${spec.unit}）`,
          headers: ['国 \\ 項目', ...colCodes],
          rows: candRows.map((r, ri) => [
            rowCodes[ri],
            ...colOrder.map((ci) => fmtNum(r.values[ci])),
          ]),
        },
        choices: choicesObjs.map((x) => x.text),
        correctIndex: choicesObjs.findIndex((x) => x.isAns),
        explanation: `正解は ${rowCodes[targetR]}（${targetCountry}）— ${colCodes[targetC]}（${targetCol}）。${spec.examPoint}`,
        steps: [
          `Step 1（項目軸 カ〜ク の見抜き方）：合計や国間の大小パターンから、各列が「${spec.colLabels.join('／')}」のどれに当たるか推定する。`,
          `Step 2（国軸 P〜R の特定）：${spec.cueByIso3[candRows[targetR].iso3 ?? ''] ?? spec.examPoint}`,
          `Step 3（交点の選択）：確定した ${rowCodes[targetR]} と ${colCodes[targetC]} の組合せを選ぶ。`,
        ],
        detailNotes: [
          `【国（行）】${candRows.map((r, ri) => `${rowCodes[ri]}＝${cleanCountryName(r.countryName)}`).join(' ／ ')}`,
          `【項目（列）】${colOrder.map((ci, cpos) => `${colCodes[cpos]}＝${spec.colLabels[ci]}`).join(' ／ ')}`,
        ],
        relatedIso3s: candRows.map((r) => r.iso3).filter((x): x is string => Boolean(x)),
      };
    }

    // 形式3（約25%）：項目名当て（国名を開示し、表の列 カ〜ク を6択で当てる）
    const rowsForItem = shuffle(spec.rows).slice(0, 4);
    if (!hasHealthyVariance(rowsForItem)) continue;

    const colOrder = shuffle([0, 1, 2]);
    const colCodes: [string, string, string] = ['カ', 'キ', 'ク'];
    const colNames = colOrder.map((ci) => spec.colLabels[ci]) as [string, string, string];
    const { choices, correctIndex } = make6Permutations(colCodes, colNames);

    return {
      id: `drill_unseen_${nonce}`,
      genre: 'unseen_infer',
      genreLabel: '初見統計・項目判別',
      domainTag: '初見統計推論',
      signature: `unseen_item:${spec.id}:${rowsForItem.map((r) => r.iso3).sort().join(',')}`,
      promptTitle: `【初見データ×項目特定】${spec.title}`,
      promptBody: `${spec.leadContext}表中の カ〜ク は、${sortJa(colNames).join('、')} のいずれか（単位：${spec.unit}）である。項目名と カ〜ク との正しい組合せを一つ選びなさい。`,
      table: {
        caption: `${spec.title}（単位：${spec.unit}）`,
        headers: ['国名', ...colCodes],
        rows: rowsForItem.map((r) => [
          cleanCountryName(r.countryName),
          ...colOrder.map((ci) => fmtNum(r.values[ci])),
        ]),
      },
      choices,
      correctIndex,
      explanation: spec.examPoint,
      detailNotes: colOrder.map(
        (ci, idx) =>
          `${colCodes[idx]}＝${spec.colLabels[ci]}（${rowsForItem.map((r) => `${cleanCountryName(r.countryName)}:${fmtNum(r.values[ci])}`).join('・')}）`,
      ),
      relatedIso3s: rowsForItem.map((r) => r.iso3).filter((x): x is string => Boolean(x)),
    };
  }

  return null;
}

// ============================================================================
// B. 地図統計・階級区分図（単色濃淡・低位〜高位・3枚比較／単図）
// ============================================================================

export function makeMapChoroplethQuestion(
  countriesData: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const allCountries = Object.values(countriesData).filter((c) => !c.isBasicEntry);

  // 75%: 共通テスト定番「3枚の階級区分図（図 ア〜ウ、すべて低位〜高位・単位なし）を見て指標を当て分ける6択」
  if (Math.random() < 0.75 && CHOROPLETH_MAP_INDICATORS.length >= 3) {
    // 同じ超類似グループ（1人GDP・3次産業・都市率）ばかり3つ選ばないよう調整
    const simGroupA = new Set([
      'choro_gdp_per_capita',
      'choro_tertiary_sector',
      'choro_urban_rate',
    ]);
    let picked3 = shuffle(CHOROPLETH_MAP_INDICATORS).slice(0, 3);
    for (let attempt = 0; attempt < 15; attempt++) {
      const cand = shuffle(CHOROPLETH_MAP_INDICATORS).slice(0, 3);
      const countA = cand.filter((x) => simGroupA.has(x.id)).length;
      if (countA <= 2) {
        picked3 = cand;
        break;
      }
    }

    const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
    const labels = picked3.map((p) => p.label) as [string, string, string];
    const { choices, correctIndex } = make6Permutations(codes, labels);

    const mapSpecs = picked3.map((spec, idx) => ({
      mode: 'choropleth' as const,
      title: `図 ${codes[idx]}`,
      centerMode: 'pacific' as const,
      fillByIso3: buildQuartileFillMap(allCountries, spec),
      highlightIso3s: focusIso3 ? [focusIso3] : undefined,
      showEquatorAndTropics: false,
    }));

    return {
      id: `drill_choro3_${nonce}`,
      genre: 'map_regional',
      genreLabel: '世界地図・階級区分図比較',
      domainTag: '地図統計読取',
      signature: `choro3:${picked3.map((p) => p.id).sort().join(',')}`,
      promptTitle: '3枚の階級区分図（低位〜高位）の統計指標判別',
      promptBody: `図 ア〜図 ウ は、いずれも国別の統計指標を4段階（低位〜高位）で示した階級区分図である。これらは ${sortJa(labels).join('、')} のいずれかである。指標名と 図 ア〜ウ との正しい組合せを一つ選びなさい。`,
      mapSpecs,
      sharedMapLegend: CHOROPLETH_SHARED_LEGEND,
      choices,
      correctIndex,
      explanation: picked3
        .map((p, i) => `図 ${codes[i]}（${p.label}）：${p.explanation}`)
        .join(' '),
      steps: [
        'Step 1（濃色・薄色の対照地域を探す）：アフリカ・アジア・中南米・北米/西欧・豪州のどこで「高位（濃青）」と「低位（薄灰）」が反転しているかを確認する。',
        'Step 2（地域特例の切り分け）：南米が高位なら都市人口率や第3次割合、アフリカのみ突出高位なら出生率、内陸山岳国が高位なら標高など、決定的な違いで1枚を先に確定する。',
        'Step 3（残る2枚の比較）：先進国・新興工業国（中国・東欧等）・資源国の塗られ方の違いから残りを確定する。',
      ],
      relatedIso3s: ['USA', 'DEU', 'CHN', 'BRA', 'IND', 'NGA', 'AUS'].filter((iso) =>
        Boolean(countriesData[iso]),
      ),
    };
  }

  // 25%: 1枚の階級区分図（低位〜高位・単位一切なし）から4指標を当てる4択
  const indicators = shuffle(CHOROPLETH_MAP_INDICATORS);
  const targetSpec = indicators[0];
  const distractors = indicators.slice(1, 4);
  if (distractors.length < 3) return null;

  const choices = shuffle([targetSpec, ...distractors].map((d) => d.label));
  return {
    id: `drill_choro1_${nonce}`,
    genre: 'map_regional',
    genreLabel: '世界地図・階級区分図',
    domainTag: '地図統計読取',
    signature: `choro1:${targetSpec.id}`,
    promptTitle: '世界階級区分図（低位〜高位）の指標特定',
    promptBody:
      '図1は、世界各国の統計指標を四分位により4段階（低位〜高位）に階級区分したものである。この地図が表す指標として最も適当なものを一つ選びなさい。',
    mapSpec: {
      mode: 'choropleth',
      centerMode: 'pacific',
      fillByIso3: buildQuartileFillMap(allCountries, targetSpec),
      highlightIso3s: focusIso3 ? [focusIso3] : undefined,
      legend: CHOROPLETH_SHARED_LEGEND,
    },
    choices,
    correctIndex: choices.indexOf(targetSpec.label),
    explanation: targetSpec.explanation,
    relatedIso3s: ['USA', 'DEU', 'BRA', 'IND', 'NGA', 'AUS'].filter((iso) =>
      Boolean(countriesData[iso]),
    ),
  };
}

// ============================================================================
// C. 国内地域統計連動マップ（世界12カ国） ＋ 日本国内統計（純粋に県名・項目名当て）
// ============================================================================

function makeSubnationalStatMapQuestion(
  countriesData: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const pool = shuffle(SUBNATIONAL_STAT_MATRICES);
  const prioritized = focusIso3
    ? [
        ...pool.filter((m) => m.iso3 === focusIso3),
        ...pool.filter((m) => m.iso3 !== focusIso3),
      ]
    : pool;

  for (const statMat of prioritized) {
    const country = countriesData[statMat.iso3];
    const sub: SubnationalProfile | undefined = country?.subnational;
    if (!country || !sub) continue;

    const zoneById = new Map(sub.zones.map((z) => [z.id, z]));
    const validPairs = statMat.rows
      .map((sr) => ({ sr, zone: zoneById.get(sr.zoneId) }))
      .filter((p): p is { sr: (typeof statMat.rows)[number]; zone: NonNullable<typeof p.zone> } =>
        Boolean(p.zone),
      );
    if (validPairs.length < 3) continue;

    // 3地域を選んでシャッフル：地図記号は A, B, C、統計表行は ア, イ, ウ に独立シャッフル！
    const chosen3 = shuffle(validPairs).slice(0, 3);
    if (!hasHealthyVariance(chosen3.map((p) => ({ values: p.sr.values })))) continue;

    const mapOrdered = shuffle(chosen3); // A, B, C の順序
    const tableOrdered = shuffle(chosen3); // ア, イ, ウ の順序

    const mapCodes: [string, string, string] = ['A', 'B', 'C'];
    const tableCodes: [string, string, string] = ['ア', 'イ', 'ウ'];

    // Aがどの表記号に対応するかの正解タプル
    const expectedTableForMap = mapOrdered.map((mp) => {
      const tIdx = tableOrdered.findIndex((tp) => tp.sr.zoneId === mp.sr.zoneId);
      return tableCodes[tIdx];
    }) as [string, string, string];

    const { choices, correctIndex } = make6Permutations(mapCodes, expectedTableForMap);
    const cName = cleanCountryName(country.nameJa);

    return {
      id: `drill_substat_${nonce}`,
      genre: 'map_regional',
      genreLabel: '世界・国内地域×統計推論',
      domainTag: '地誌・国内統計',
      signature: `substat:${country.iso3}:${chosen3.map((c) => c.sr.zoneId).sort().join(',')}`,
      promptTitle: `【国内地域×統計】${cName}の地域区分と地域別統計`,
      promptBody: `下の図は、${cName}における3つの地域（A〜C）の位置を示し、表はそれらの地域に関する統計（ア〜ウ）をまとめたものである。図中の地域 A〜C と 表中の ア〜ウ との正しい組合せを一つ選びなさい。`,
      mapSpec: {
        mode: 'subnational',
        targetIso3: country.iso3,
        zones: mapOrdered.map((mp, idx) => ({
          label: mapCodes[idx],
          color: ZONE_COLORS[idx % ZONE_COLORS.length],
          lng: mp.zone.lng,
          lat: mp.zone.lat,
          polygon: mp.zone.polygon,
        })),
        boundaryLines: sub.boundaryLines.slice(0, 2).map((b) => ({
          color: b.color || '#dc2626',
          coordinates: b.coordinates,
        })),
      },
      table: {
        caption: `${statMat.title}（${statMat.unitNote}）`,
        headers: ['統計記号', ...statMat.colLabels],
        rows: tableOrdered.map((tp, i) => [
          tableCodes[i],
          ...tp.sr.values.map((v) => fmtNum(v)),
        ]),
      },
      choices,
      correctIndex,
      explanation: `${statMat.examPoint}`,
      detailNotes: mapOrdered.map((mp, idx) => {
        const tIdx = tableOrdered.findIndex((tp) => tp.sr.zoneId === mp.sr.zoneId);
        return `地図 ${mapCodes[idx]} ＝ 統計 ${tableCodes[tIdx]}（${mp.zone.name.split('（')[0]}：${statMat.colLabels
          .map((lbl, ci) => `${lbl.split('(')[0]} ${fmtNum(mp.sr.values[ci])}`)
          .join('／')}）`;
      }),
      relatedIso3s: [country.iso3],
    };
  }

  return null;
}

function makeJapanDomesticDrillQuestion(
  japanData: JapanGeographyDataset | null | undefined,
  nonce: number,
): GeneratedDrillQuestion | null {
  const allJapanMatrices: StatMatrixSpec[] = [
    ...JAPAN_PREF_STAT_MATRICES,
    ...extractJapanDomesticMatrices(japanData),
  ];
  if (allJapanMatrices.length === 0) return null;

  for (const mat of shuffle(allJapanMatrices)) {
    const canAskCols = mat.sameUnitAcrossCols && mat.colLabels.length >= 3;
    const askCols = canAskCols && Math.random() < 0.45;

    if (askCols) {
      // 項目名・品目名（カ・キ・ク）を当てる6択（一部列のみ抜粋）
      const colIdx = shuffle(mat.colLabels.map((_, i) => i)).slice(0, 3);
      const pickedRows = shuffle(mat.rows).slice(0, Math.min(5, mat.rows.length));
      const projected = pickedRows.map((r) => ({
        ...r,
        values: colIdx.map((ci) => r.values[ci]),
      }));
      if (!hasHealthyVariance(projected)) continue;

      const colCodes: [string, string, string] = ['カ', 'キ', 'ク'];
      const colNames = colIdx.map((ci) => mat.colLabels[ci]) as [string, string, string];
      const { choices, correctIndex } = make6Permutations(colCodes, colNames);

      return {
        id: `drill_jpn_col_${nonce}`,
        genre: 'map_regional',
        genreLabel: '日本国内統計（項目当て）',
        domainTag: '地誌・国内統計',
        signature: `jpn_col:${mat.id}:${colNames.slice().sort().join(',')}`,
        promptTitle: `【日本統計・項目判別】${mat.title}`,
        promptBody: `下の表中の カ〜ク は、${sortJa(colNames).join('、')} のいずれか（単位：${mat.unit}）を示している。項目名と カ〜ク との正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['都道府県・地域', ...colCodes],
          rows: projected.map((r) => [cleanCountryName(r.countryName), ...r.values.map(fmtNum)]),
        },
        choices,
        correctIndex,
        explanation: mat.examPoint,
        detailNotes: colNames.map(
          (nm, i) =>
            `${colCodes[i]}＝${nm}（${projected.map((r) => `${cleanCountryName(r.countryName)}:${fmtNum(r.values[i])}`).join('・')}）`,
        ),
        relatedIso3s: ['JPN'],
        relatedSystematicId: mat.id.includes('power')
          ? 'sys_energy_mix_criteria'
          : mat.id.includes('industry')
            ? 'sys_weber_location'
            : undefined,
      };
    }

    // 都道府県名・工業地帯・年次（ア〜ウ）を当てる6択（必要なら列も3列前後に絞る）
    const selectedColsIdx =
      mat.colLabels.length > 4
        ? shuffle(mat.colLabels.map((_, i) => i))
            .slice(0, 3)
            .sort((a, b) => a - b)
        : mat.colLabels.map((_, i) => i);

    let chosenRows: typeof mat.rows | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const cand = shuffle(mat.rows)
        .slice(0, 3)
        .map((r) => ({ ...r, values: selectedColsIdx.map((ci) => r.values[ci]) }));
      if (hasHealthyVariance(cand)) {
        chosenRows = cand;
        break;
      }
    }
    if (!chosenRows) continue;

    const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
    const names = chosenRows.map((r) => cleanCountryName(r.countryName)) as [string, string, string];
    const { choices, correctIndex } = make6Permutations(codes, names);
    const headerCols = selectedColsIdx.map((ci) => mat.colLabels[ci]);

    return {
      id: `drill_jpn_row_${nonce}`,
      genre: 'map_regional',
      genreLabel: '日本国内統計（県・地域当て）',
      domainTag: '地誌・国内統計',
      signature: `jpn_row:${mat.id}:${names.slice().sort().join(',')}`,
      promptTitle: `【日本統計・地域判別】${mat.title}`,
      promptBody: `下の表中の ア〜ウ は、${sortJa(names).join('、')} のいずれかを示したものである。名称と ア〜ウ との正しい組合せを一つ選びなさい。`,
      table: {
        caption: `${mat.title}（単位：${mat.unit}）`,
        headers: ['記号', ...headerCols],
        rows: chosenRows.map((r, i) => [codes[i], ...r.values.map(fmtNum)]),
      },
      choices,
      correctIndex,
      explanation: mat.examPoint,
      detailNotes: chosenRows.map(
        (r, i) =>
          `${codes[i]}＝${cleanCountryName(r.countryName)}（${headerCols
            .map((h, ci) => `${h.split('(')[0]} ${fmtNum(r.values[ci])}`)
            .join('／')}）`,
      ),
      relatedIso3s: ['JPN'],
      relatedSystematicId: mat.id.includes('power')
        ? 'sys_energy_mix_criteria'
        : mat.id.includes('industry')
          ? 'sys_weber_location'
          : undefined,
    };
  }

  return null;
}

export function makeSubnationalAndJapanQuestion(
  countriesData: Record<string, CountryData>,
  japanData: JapanGeographyDataset | null | undefined,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  if (focusIso3 === 'JPN') {
    return makeJapanDomesticDrillQuestion(japanData, nonce);
  }
  if (focusIso3 && SUBNATIONAL_STAT_MATRICES.some((m) => m.iso3 === focusIso3)) {
    return makeSubnationalStatMapQuestion(countriesData, nonce, focusIso3);
  }
  if (Math.random() < 0.52) {
    const jpnQ = makeJapanDomesticDrillQuestion(japanData, nonce);
    if (jpnQ) return jpnQ;
  }
  return makeSubnationalStatMapQuestion(countriesData, nonce, focusIso3);
}

// ============================================================================
// D. 地図地点連携 × 3都市雨温図／ハイサーグラフ比較（共テ最頻出形式）
// ============================================================================

export function makeClimateMapLinkedQuestion(
  countriesData: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const cityById = new Map<string, { country: CountryData; city: ClimateCity }>();
  for (const c of Object.values(countriesData)) {
    if (c.isBasicEntry) continue;
    for (const ct of c.climate.cities) {
      if (ct.monthlyTempC.length === 12 && ct.monthlyPrecipMm.length === 12) {
        cityById.set(ct.cityId, { country: c, city: ct });
      }
    }
  }

  const labelFor = (e: { country: CountryData; city: ClimateCity }) =>
    `${e.city.nameJa}（${cleanCountryName(e.country.nameJa)}）`;

  const cohorts = shuffle(CLIMATE_COHORT_SPECS);
  const prioritized = focusIso3
    ? [
        ...cohorts.filter((c) =>
          c.cityIds.some((id) => cityById.get(id)?.country.iso3 === focusIso3),
        ),
        ...cohorts.filter(
          (c) => !c.cityIds.some((id) => cityById.get(id)?.country.iso3 === focusIso3),
        ),
      ]
    : cohorts;

  for (const coh of prioritized) {
    const resolved = coh.cityIds
      .map((id) => cityById.get(id))
      .filter((x): x is { country: CountryData; city: ClimateCity } => Boolean(x));
    if (resolved.length < 3) continue;

    const sub3 = shuffle(resolved).slice(0, 3);
    const chartType: 'climograph' | 'hythergraph' =
      Math.random() < 0.35 ? 'hythergraph' : 'climograph';

    const mapCodes: [string, string, string] = ['A', 'B', 'C'];
    const graphCodes: [string, string, string] = ['ア', 'イ', 'ウ'];

    const mapEntries = shuffle(sub3);
    const graphToMapCode = sub3.map((gCity) => {
      const mIdx = mapEntries.findIndex((m) => m.city.cityId === gCity.city.cityId);
      return `${mapCodes[mIdx]}：${labelFor(gCity)}`;
    }) as [string, string, string];

    const { choices, correctIndex } = make6Permutations(graphCodes, graphToMapCode);

    return {
      id: `drill_cl_map_${nonce}`,
      genre: 'climate_coords',
      genreLabel: '雨温図・ハイサー・地図',
      domainTag: '自然・気候',
      signature: `cl_map:${coh.theme}:${sub3.map((s) => s.city.cityId).sort().join(',')}:${chartType}`,
      promptTitle: `世界地図の3地点（A〜C）× ${
        chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'
      }（ア〜ウ）判別`,
      promptBody: `下の世界地図上の地点 A〜C と、3つの${
        chartType === 'hythergraph' ? 'ハイサーグラフ（横軸:降水量・縦軸:気温）' : '雨温図'
      }（ア〜ウ、共通スケール）は、${coh.theme}に含まれる3都市を示したものである。図表 ア〜ウ に該当する地点と都市の正しい組合せを一つ選びなさい。`,
      mapSpec: {
        mode: 'point_markers',
        centerMode: 'pacific',
        showEquatorAndTropics: true,
        markers: mapEntries.map((ent, idx) => ({
          label: mapCodes[idx],
          lng: ent.city.lng,
          lat: ent.city.lat,
          color: POINT_COLORS[idx % POINT_COLORS.length],
        })),
      },
      climateChartType: chartType,
      climateCities: sub3.map((e, i) => ({
        label: `図表 ${graphCodes[i]}`,
        city: e.city,
        metaText: '',
      })),
      choices,
      correctIndex,
      explanation: coh.examPoint,
      detailNotes: sub3.map((p, i) => {
        const mIdx = mapEntries.findIndex((m) => m.city.cityId === p.city.cityId);
        return `図表 ${graphCodes[i]} ＝ 地点 ${mapCodes[mIdx]}（${labelFor(p)}）：${p.city.koppenCode}・標高 ${p.city.elevationM ?? '-'}m（${p.city.factors.slice(0, 2).join('・')}）`;
      }),
      relatedIso3s: sub3.map((p) => p.country.iso3),
    };
  }

  return null;
}
