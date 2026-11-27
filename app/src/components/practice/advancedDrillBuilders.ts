import type {
  ClimateCity,
  CountryData,
  JapanGeographyDataset,
  JapanPrefRankingItem,
  SubnationalProfile,
  WorldRankingsDataset,
} from '../../types/schema_v1';
import type { DrillDialogueLine, GeneratedDrillQuestion } from './drillTypes';
import {
  CLIMATE_COHORT_SPECS,
  COUNTRY_ARCHETYPE_MAP,
  CURATED_STAT_MATRICES,
  EXAM_STANDARD_ISO3_SET,
  type StatMatrixSpec,
} from './statMatrices';
import {
  CHOROPLETH_MAP_INDICATORS,
  UNSEEN_DEDUCTION_MATRICES,
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
function hasHealthyVariance(rows: { iso3?: string; values: number[] }[]): boolean {
  if (rows.length < 3) return false;
  const nCols = rows[0]?.values.length ?? 0;
  for (let c = 0; c < nCols; c++) {
    const colVals = rows.map((r) => r.values[c]);
    const maxV = Math.max(...colVals);
    if (maxV <= 0) return false;
    const positive = colVals.filter((v) => v > 0).length;
    if (positive < Math.ceil(rows.length * 0.6)) return false;
  }
  // 全行がどの2行も完全に同じ傾向にならないよう差を検査
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      let maxDiff = 0;
      for (let c = 0; c < nCols; c++) {
        const span = Math.max(1, Math.max(...rows.map((r) => r.values[c])));
        maxDiff = Math.max(maxDiff, Math.abs(rows[i].values[c] - rows[j].values[c]) / span);
      }
      if (maxDiff < 0.14) return false;
    }
  }
  return true;
}

/**
 * 既存の統計解説に対して、共通テスト式の「3段階消去法」思考プロセスを生成する
 */
export function buildStepByStepExplanation(q: GeneratedDrillQuestion): string[] {
  if (q.steps && q.steps.length >= 2) return q.steps;
  const steps: string[] = [];

  if (q.genre === 'unseen_infer') {
    steps.push('Step 1（未見統計のルール化）：列の見出しと単位から「この指標を高くする自然条件・社会条件は何か」を仮説立てする。');
    steps.push('Step 2（極値での一点確定）：最も極端な値（最小または最大）を示す記号に、条件が最も尖った国・項目を割り当てる。');
    steps.push('Step 3（残余の対比）：残る選択肢は気候帯（高緯度・乾燥・熱帯）や所得・インフラ発達段階の差で確定する。');
  } else if (q.genre === 'map_choropleth') {
    steps.push('Step 1（極値地域の地理的把握）：階級区分で最も濃い地域と最も薄い地域がどの大陸・経済圏に集中しているかを見る。');
    steps.push('Step 2（例外地域の判定）：南米や湾岸諸国・東アジアなど、発展段階や自然条件によって特徴的な色が出る地域で最終判断する。');
    steps.push('Step 3（単位と割合の確認）：絶対量（人口や総面積）か割合・1人当たり値（%、ドル）かの整合性を確認する。');
  } else if (q.genre === 'subnational_jpn') {
    steps.push('Step 1（空間位置の確認）：記号の位置（北/南、内陸/沿岸、大都市圏/周辺）を自然条件（気温・降水量・地形）と結びつける。');
    steps.push('Step 2（産業・作物の対応）：気候条件や交通・歴史的背景から各区分に特化する主力産業・農産物を割り当てる。');
    steps.push('Step 3（境界と選択肢照合）：引っかけとなる隣接地域との逆転がないか各選択肢を検証する。');
  } else if (q.genre === 'stat_country' || q.genre === 'stat_double_blind' || q.genre === 'stat_item') {
    steps.push('Step 1（基準列の確定）：数値差や特産性が最もはっきりしている列で1〜2個を先に確定させる。');
    steps.push('Step 2（同系統の識別）：規模（人口・総量）と1人当たり／割合の違いに注意して紛らわしい国・品目を切り分ける。');
    steps.push('Step 3（消去法の適用）：確定した組合せを含む選択肢だけを残し、最後に逆転肢がないか点検する。');
  } else if (q.genre === 'climate_coords') {
    steps.push('Step 1（気温曲線と緯度）：最暖月が7月なら北半球・1月なら南半球、年較差の大小で赤道・低緯度と高緯度・内陸を分ける。');
    steps.push('Step 2（乾季の季節判定）：夏少雨（Cs）・冬少雨（Aw/Cw）・年中多雨（Af/Cfa）・少雨乾燥（BW/BS）のいずれかに絞る。');
    steps.push('Step 3（標高と海流の補正）：低緯度なのに年間冷涼なら高地（H/高山）、西岸が冬季温暖・夏季冷涼なら寒流・偏西風を考慮する。');
  } else if (q.genre === 'pyramid_match') {
    steps.push('Step 1（底辺の幅を確認）：0〜14歳階級の幅が広ければ多産多子型（ピラミッド形）、極端に狭ければ少子高齢型（つぼ形）。');
    steps.push('Step 2（生産年齢層の突出）：20〜40歳代の突出がある場合は労働移民流入（湾岸産油国など）や人口ボーナス期を疑う。');
    steps.push('Step 3（65歳以上の厚み）：高齢層の裾野と男女差（戦争・平均寿命差）から最終判断する。');
  } else if (q.genre === 'scatter_plot' || q.genre === 'composition_bar' || q.genre === 'time_shift') {
    steps.push('Step 1（軸と傾きの確認）：縦軸・横軸の単位（割合か実数か、線形か対数か）および y=x 基準線の上下を先に確認する。');
    steps.push('Step 2（4象限・時系列変化）：右上に位置する国や急増・逆転している系列から特異な国を1つ確定する。');
    steps.push('Step 3（残りの相対位置）：残る2点の相対的な高低・推移差から誤答肢を消去する。');
  } else if (q.genre === 'photo_infer') {
    steps.push('Step 1（自然景観の観察）：植生（森林・草原・乾燥荒地）、地形の起伏、空や気候の乾燥度・積雪などを確認する。');
    steps.push('Step 2（生活・農業・建築）：屋根の勾配・建材（日干し煉瓦・石造・高床）、農作物や土地利用（段々畑・プランテーション・大区画）を読む。');
    steps.push('Step 3（地域・気候との整合）：確認した要素に矛盾しない気候帯・歴史背景・経済圏を選択肢から確定する。');
  }

  return steps;
}

// ============================================================================
// A. 初見統計データ推論（12テーマ × 多彩な設問形式：6択・2空欄会話・4文正誤）
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

    // 形式1（約40%）：3カ国の記号（ア〜ウ）を論理推論で一致させる6択
    if (roll < 0.42) {
      const candidates = focusIso3 && spec.rows.some((r) => r.iso3 === focusIso3)
        ? [
            spec.rows.find((r) => r.iso3 === focusIso3)!,
            ...shuffle(spec.rows.filter((r) => r.iso3 !== focusIso3)),
          ].slice(0, 3)
        : shuffle(spec.rows).slice(0, 3);

      const ordered = shuffle(candidates);
      if (!hasHealthyVariance(ordered)) continue;

      const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = ordered.map((r) => cleanCountryName(r.countryName)) as [string, string, string];
      const { choices, correctIndex } = make6Permutations(codes, names);

      const steps = [
        `Step 1（指標の性質を掴む）：着眼点は「${spec.inferenceAxis}」である。`,
        ...ordered.map(
          (r, i) =>
            `Step ${i + 2}（${codes[i]}＝${cleanCountryName(r.countryName)}）：${spec.cueByIso3[r.iso3 ?? ''] ?? spec.examPoint}`,
        ),
      ];

      return {
        id: `drill_unseen_${nonce}`,
        genre: 'unseen_infer',
        genreLabel: '初見統計・論理推論',
        domainTag: '初見統計推論',
        signature: `unseen6:${spec.id}:${ordered.map((r) => r.iso3).sort().join(',')}`,
        promptTitle: `【初見データ推論】${spec.title}`,
        promptBody: `${spec.leadContext}表中の ア〜ウ は ${sortJa(names).join('、')} のいずれかである。国名と記号の正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${spec.title}（単位：${spec.unit}）`,
          headers: ['記号', ...spec.colLabels.map((c) => `${c}(${spec.unit})`)],
          rows: ordered.map((r, i) => [codes[i], ...r.values.map((v) => fmtNum(v))]),
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

    // 形式2（約32%）：2空欄（[ P ] × [ Q ]）会話・メモ完成 4択
    if (roll < 0.74 && spec.rows.length >= 4) {
      const picked4 = shuffle(spec.rows).slice(0, 4);
      if (!hasHealthyVariance(picked4)) continue;

      const codes = ['ア', 'イ', 'ウ', 'エ'];
      // 最も特徴差が大きい2つの国を P, Q の正解対象にする（たとえば col[0] 最大 vs col[2] 最大、または col 差最大ペア）
      let bestPair: [number, number] = [0, 1];
      let bestScore = -1;
      for (let i = 0; i < picked4.length; i++) {
        for (let j = 0; j < picked4.length; j++) {
          if (i === j) continue;
          const score =
            Math.abs(picked4[i].values[0] - picked4[j].values[0]) +
            Math.abs(picked4[i].values[picked4[i].values.length - 1] - picked4[j].values[picked4[j].values.length - 1]);
          if (score > bestScore) {
            bestScore = score;
            bestPair = [i, j];
          }
        }
      }
      const pIdx = bestPair[0];
      const qIdx = bestPair[1];
      const pCountry = cleanCountryName(picked4[pIdx].countryName);
      const qCountry = cleanCountryName(picked4[qIdx].countryName);
      const pCue = spec.cueByIso3[picked4[pIdx].iso3 ?? ''] ?? `${spec.colLabels[0]}に特徴がある`;
      const qCue = spec.cueByIso3[picked4[qIdx].iso3 ?? ''] ?? `${spec.colLabels[spec.colLabels.length - 1]}に特徴がある`;
      // 国名が文面に出ないようマスキングして説明文を作成
      const maskCountry = (txt: string) => {
        let out = txt;
        for (const row of spec.rows) {
          const nm = cleanCountryName(row.countryName);
          out = out.replaceAll(nm, 'その国');
        }
        return out;
      };

      const dialogues: DrillDialogueLine[] = [
        {
          speaker: '生徒A',
          text: `${spec.title}のデータを見たことがないけれど、「${spec.inferenceAxis}」の知識だけで読み解けそうだよ。`,
        },
        {
          speaker: '生徒B',
          text: `なるほど！だとすると、${maskCountry(pCue).replace(/^その国[はの]/, '')}という特徴から、${pCountry}に該当するのは [ P ] だね。そしてもう一方の、${maskCountry(qCue).replace(/^その国[はの]/, '')}という特徴を示す [ Q ] が${qCountry}だ！`,
        },
      ];

      const allNames = picked4.map((r) => cleanCountryName(r.countryName));
      const ansText = `P：${codes[pIdx]}　／　Q：${codes[qIdx]}`;
      const distractorPairs: [number, number][] = [
        [qIdx, pIdx],
        [pIdx, (qIdx + 1) % 4 === pIdx ? (qIdx + 2) % 4 : (qIdx + 1) % 4],
        [(pIdx + 1) % 4 === qIdx ? (pIdx + 2) % 4 : (pIdx + 1) % 4, qIdx],
      ];
      const choiceSet = Array.from(
        new Set([ansText, ...distractorPairs.map(([a, b]) => `P：${codes[a]}　／　Q：${codes[b]}`)]),
      );
      if (choiceSet.length < 4) continue;
      const choices = shuffle(choiceSet.slice(0, 4));

      return {
        id: `drill_unseen_${nonce}`,
        genre: 'unseen_infer',
        genreLabel: '初見統計・会話空欄',
        domainTag: '初見統計推論',
        signature: `unseen2b:${spec.id}:${picked4.map((r) => r.iso3).sort().join(',')}`,
        promptTitle: `【初見データ×会話推論】${spec.title}`,
        promptBody: `次の表の ア〜エ は ${sortJa(allNames).join('、')} のいずれかである。下の会話文中の空欄 [ P ] と [ Q ] に入る記号の組合せとして正しいものを一つ選びなさい。`,
        dialogues,
        table: {
          caption: `${spec.title}（単位：${spec.unit}）`,
          headers: ['記号', ...spec.colLabels.map((c) => `${c}(${spec.unit})`)],
          rows: picked4.map((r, i) => [codes[i], ...r.values.map((v) => fmtNum(v))]),
        },
        choices,
        correctIndex: choices.indexOf(ansText),
        explanation: `${pCountry}が ${codes[pIdx]}（${pCue}）、${qCountry}が ${codes[qIdx]}（${qCue}）となる。${spec.examPoint}`,
        steps: [
          `Step 1（Pの手がかり）：会話から P＝${pCountry} と分かる。${spec.colLabels[0]}などの値から ${codes[pIdx]} が該当する。`,
          `Step 2（Qの手がかり）：会話から Q＝${qCountry} と分かる。条件を満たす記号は ${codes[qIdx]} である。`,
          `Step 3（組合せ確定）：PとQを入れ替えた誤答肢に注意し、「${ansText}」を選ぶ。`,
        ],
        detailNotes: picked4.map((r, i) => `${codes[i]}：${r.countryName} — ${spec.cueByIso3[r.iso3 ?? ''] ?? ''}`),
        relatedIso3s: picked4.map((r) => r.iso3).filter((x): x is string => Boolean(x)),
      };
    }

    // 形式3（残り約26%）：4文正誤判定トラップ（割合と実数／因果関係の逆転）
    const sub4 = shuffle(spec.rows).slice(0, 4);
    if (!hasHealthyVariance(sub4)) continue;
    const col0 = spec.colLabels[0];
    const colLast = spec.colLabels[spec.colLabels.length - 1];
    // col0 が最大の国と最小の国を見つける
    const sortedByCol0 = [...sub4].sort((a, b) => b.values[0] - a.values[0]);
    const sortedByLast = [...sub4].sort(
      (a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1],
    );
    const top0 = sortedByCol0[0];
    const low0 = sortedByCol0[sortedByCol0.length - 1];
    const topLast = sortedByLast[0];
    if (top0.iso3 === low0.iso3 || top0.iso3 === topLast.iso3) continue;

    const top0Cue = spec.cueByIso3[top0.iso3 ?? ''] ?? spec.examPoint;
    const isPct = spec.unit === '%';

    const trueStmt = `${cleanCountryName(top0.countryName)}では「${col0}」の数値が4カ国中最も高く（${fmtNum(top0.values[0])}${spec.unit}）、これは${top0Cue.replace(/。$/, '')}ためである。`;
    const trapAbs = isPct
      ? `${cleanCountryName(top0.countryName)}は「${col0}」の割合が4カ国中で最も高いため、世界全体の絶対量（合計数量）においても必ず4カ国中最大である。`
      : `${cleanCountryName(top0.countryName)}は「${col0}」だけでなく「${colLast}」についても4カ国中最大である。`;
    const trapReverse = `${cleanCountryName(low0.countryName)}は「${col0}」が最も高水準であるのに対し、${cleanCountryName(top0.countryName)}は「${col0}」が4カ国中最小となっている。`;
    const trapCause = `${cleanCountryName(topLast.countryName)}で「${colLast}」が最も高い（${fmtNum(topLast.values[topLast.values.length - 1])}${spec.unit}）主な理由は、同じ地域条件が${cleanCountryName(top0.countryName)}より弱いためではなく、${col0}の指標定義が逆になっているためである。`;

    const all4Stmts = [trueStmt, trapAbs, trapReverse, trapCause];
    if (new Set(all4Stmts).size < 4) continue;
    const choices = shuffle(all4Stmts);

    return {
      id: `drill_unseen_${nonce}`,
      genre: 'unseen_infer',
      genreLabel: '初見統計・正誤判定',
      domainTag: '初見統計推論',
      signature: `unseen_tf:${spec.id}:${sub4.map((r) => r.iso3).sort().join(',')}`,
      promptTitle: `【初見データ×正誤判定】${spec.title}`,
      promptBody: `${spec.leadContext}この表から読み取れる地理的考察として「正しいもの」を、次の①〜④のうちから1つ選びなさい。`,
      table: {
        caption: `${spec.title}（単位：${spec.unit}）`,
        headers: ['国・地域', ...spec.colLabels.map((c) => `${c}(${spec.unit})`)],
        rows: sub4.map((r) => [cleanCountryName(r.countryName), ...r.values.map((v) => fmtNum(v))]),
      },
      choices,
      correctIndex: choices.indexOf(trueStmt),
      explanation: `${spec.examPoint} なお割合（%）の大小と絶対数量の大小は別であり、また数値の上下を逆転させた誤答肢に注意する。`,
      steps: [
        `Step 1（数値の事実確認）：表から「${col0}」の最大国が${cleanCountryName(top0.countryName)}であることを即確認し、逆転記述を消去する。`,
        isPct
          ? 'Step 2（割合と絶対量の罠）：単位が「%（構成比）」であるため、割合が最大でも国の人口・経済規模しだいで総量は最大にならない。'
          : 'Step 2（列間の対応確認）：他列の値を取り違えている選択肢を表の実数値と照合して消去する。',
        'Step 3（因果の検証）：自然・社会背景とデータ数値が論理的に一致する正文を確定する。',
      ],
      relatedIso3s: sub4.map((r) => r.iso3).filter((x): x is string => Boolean(x)),
    };
  }

  return null;
}

// ============================================================================
// B. 地図統計・階級区分図（コロプレス図読取）
// ============================================================================

export function makeMapChoroplethQuestion(
  countriesData: Record<string, CountryData>,
  worldRankings: WorldRankingsDataset | null,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const allCountries = Object.values(countriesData).filter((c) => !c.isBasicEntry);
  const indicators = shuffle(CHOROPLETH_MAP_INDICATORS);

  // 70%: 世界全土コロプレスを見て「どの統計指標か」を当てる（または該当国の比較4文正誤）
  if (Math.random() < 0.72) {
    const targetSpec = indicators[0];
    const distractors = indicators.slice(1, 4);
    if (distractors.length === 3) {
      const excl = new Set(targetSpec.excludeIso3 ?? []);
      const fillByIso3: Record<string, string> = {};
      for (const c of allCountries) {
        if (excl.has(c.iso3)) continue;
        const val = targetSpec.extractValue(c);
        if (val == null || !Number.isFinite(val)) continue;
        const [b1, b2, b3] = targetSpec.breaks;
        const tier = val < b1 ? 0 : val < b2 ? 1 : val < b3 ? 2 : 3;
        fillByIso3[c.iso3] = targetSpec.palette[tier];
      }

      const choices = shuffle([targetSpec, ...distractors].map((d) => d.label));
      const highlightIso3s = focusIso3 && fillByIso3[focusIso3] ? [focusIso3] : undefined;

      return {
        id: `drill_choro_${nonce}`,
        genre: 'map_choropleth',
        genreLabel: '地図統計・階級区分',
        domainTag: '地図統計読取',
        signature: `choro_ind:${targetSpec.id}`,
        promptTitle: '世界地図の階級区分図（コロプレス図）の指標判別',
        promptBody: `${targetSpec.questionStem}（濃い色ほど数値が大きい階級、薄いグレーはデータ対象外）`,
        mapSpec: {
          mode: 'choropleth',
          centerMode: 'pacific',
          fillByIso3,
          highlightIso3s,
          legend: targetSpec.palette.map((color, idx) => ({
            color,
            label: `${targetSpec.legendLabels[idx]}（${targetSpec.unit}）`,
          })),
        },
        choices,
        correctIndex: choices.indexOf(targetSpec.label),
        explanation: targetSpec.explanation,
        steps: [
          'Step 1（大陸ごとの色の対比）：北米・西欧・日本とサハラ以南アフリカの色が「同じ階級か、真逆か、同程度か」を確認する。',
          'Step 2（南米や内陸・乾燥帯の特徴）：ブラジル・アルゼンチン（高い都市率）、エジプト・湾岸（少雨・高所得）、ネパール・ボリビア（高標高）など決定的特徴を確認する。',
          'Step 3（単位の手がかり）：凡例の数値レンジと単位（ドル／人／%／mm／m）を候補指標と照合して確定する。',
        ],
        relatedIso3s: ['USA', 'DEU', 'BRA', 'IND', 'NGA', 'AUS'].filter((iso) =>
          Boolean(countriesData[iso]),
        ),
      };
    }
  }

  // 30%: 地図ハイライト国（worldRankings 等実データ）× 4文正誤判定（割合と絶対量の違い等）
  const metricsWithRichData = (worldRankings?.items ?? []).filter(
    (it) =>
      it.primaryTop.filter((e) => EXAM_STANDARD_ISO3_SET.has(e.iso3)).length >= 4 &&
      it.secondaryTop &&
      it.secondaryTop.filter((e) => EXAM_STANDARD_ISO3_SET.has(e.iso3)).length >= 4,
  );
  if (metricsWithRichData.length > 0) {
    const item = shuffle(metricsWithRichData)[0];
    const pEntries = item.primaryTop.filter((e) => EXAM_STANDARD_ISO3_SET.has(e.iso3)).slice(0, 5);
    const sEntries = (item.secondaryTop ?? [])
      .filter((e) => EXAM_STANDARD_ISO3_SET.has(e.iso3))
      .slice(0, 5);

    const fillByIso3: Record<string, string> = {};
    const topIsoSet = new Set(pEntries.map((e) => e.iso3));
    for (const c of allCountries) {
      fillByIso3[c.iso3] = topIsoSet.has(c.iso3) ? '#2563eb' : '#e2e8f0';
    }
    const p1 = pEntries[0];
    const p2 = pEntries[1];
    const s1 = sEntries[0];
    if (p1 && p2 && s1) {
      const tStmt = `${item.title.split('（')[0]}において、${item.primaryLabel}の上位国には ${pEntries
        .slice(0, 3)
        .map((e) => cleanCountryName(e.nameJa))
        .join('・')} が含まれ、${item.examTrap}`;
      const f1 = `${cleanCountryName(p1.nameJa)}は${item.primaryLabel}で高い順位にあるが、${item.secondaryLabel}の上位国構成は${item.primaryLabel}とあらゆる国で完全に一致している。`;
      const f2 = `色分けされた${item.primaryLabel}上位5カ国だけで、世界の全陸地面積と総人口の過半を常に占めている。`;
      const f3 = `${cleanCountryName(p2.nameJa)}は${item.primaryLabel}で上位に入っておらず、この地図の濃色対象外である。`;
      const choices = shuffle([tStmt, f1, f2, f3]);

      return {
        id: `drill_choro_rank_${nonce}`,
        genre: 'map_choropleth',
        genreLabel: '地図分布・統計正誤',
        domainTag: '地図統計読取',
        signature: `choro_rank:${item.id}`,
        promptTitle: `世界分布図の読取：${item.title.split('（')[0]}`,
        promptBody: `図1の青色で示した国は、${item.title.split('（')[0]}（${item.primaryLabel}）の世界上位5カ国である。この統計と地理的背景に関する記述として最も適当なものを一つ選びなさい。`,
        mapSpec: {
          mode: 'choropleth',
          centerMode: 'pacific',
          fillByIso3,
          highlightIso3s: pEntries.map((e) => e.iso3),
          legend: [
            { color: '#2563eb', label: `${item.primaryLabel} 上位5カ国` },
            { color: '#e2e8f0', label: 'その他の国・地域' },
          ],
        },
        choices,
        correctIndex: choices.indexOf(tStmt),
        explanation: `${item.examTrap}（上位：${pEntries.map((e) => `${cleanCountryName(e.nameJa)}(${e.value}${item.unit})`).join('・')} ／ ${item.secondaryLabel}1位：${cleanCountryName(s1.nameJa)}）`,
        relatedIso3s: pEntries.map((e) => e.iso3),
        relatedRankingId: item.id,
      };
    }
  }

  return null;
}

// ============================================================================
// C. 国内地域区分・日本国内統計（Subnational 20カ国地図 ＋ 日本地理実データ）
// ============================================================================

function makeSubnationalMapQuestion(
  countriesData: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  const candidates = Object.values(countriesData).filter(
    (c): c is CountryData & { subnational: SubnationalProfile } =>
      Boolean(c.subnational && c.subnational.zones && c.subnational.zones.length >= 3),
  );
  if (candidates.length === 0) return null;

  const pool = shuffle(candidates);
  const pickedCountry =
    focusIso3 && candidates.some((c) => c.iso3 === focusIso3)
      ? candidates.find((c) => c.iso3 === focusIso3)!
      : pool[0];

  const sub = pickedCountry.subnational;
  const zones3 = shuffle(sub.zones).slice(0, 3);
  const codes: [string, string, string] = ['ア', 'イ', 'ウ'];

  // パターン1（75%）：地図上の3地域（ア〜ウ）と地域特徴文（または地域名）の対応6択
  const useFeatureMatch = Math.random() < 0.6;
  const names = zones3.map((z) => z.name.split('（')[0].trim()) as [string, string, string];
  const { choices, correctIndex } = make6Permutations(codes, names);

  // ネタバレ防止：説明用の地域特徴リストでは地域名・固有名詞のヒント出しすぎに注意して「農業・産業・気候の客観的特徴」を箇条書き提示
  const sanitizeZoneHint = (txt: string, zoneName: string) => {
    const cleanZ = zoneName.split('（')[0].trim();
    return txt.replaceAll(cleanZ, 'この地域');
  };

  const hintTableRows = zones3.map((z, idx) => [
    codes[idx],
    sanitizeZoneHint(z.climateAndSoil, z.name).slice(0, 48),
    sanitizeZoneHint(`${z.agriculture}／${z.industryAndResources}`, z.name).slice(0, 62),
  ]);

  const cName = cleanCountryName(pickedCountry.nameJa);
  return {
    id: `drill_subnat_${nonce}`,
    genre: 'subnational_jpn',
    genreLabel: '世界20カ国・国内地域区分',
    domainTag: '地誌・国内統計',
    signature: `subnat:${pickedCountry.iso3}:${zones3.map((z) => z.id).sort().join(',')}`,
    promptTitle: `【国内地域区分マップ】${cName}の地域配置と自然・産業`,
    promptBody: useFeatureMatch
      ? `下の図は、${cName}の国内地域区分（記号 ア〜ウ）と主要な自然・農業境界線を示したものである。地域名と記号 ア〜ウ との正しい組合せを一つ選びなさい。`
      : `下の図は${cName}における主要3地域（ア〜ウ）の位置を示したものである。下の整理メモも手がかりに、記号 ア〜ウ に該当する地域名の組合せを選びなさい。`,
    mapSpec: {
      mode: 'subnational',
      targetIso3: pickedCountry.iso3,
      zones: zones3.map((z, idx) => ({
        label: codes[idx],
        color: ZONE_COLORS[idx % ZONE_COLORS.length],
        lng: z.lng,
        lat: z.lat,
        polygon: z.polygon,
      })),
      boundaryLines: sub.boundaryLines.slice(0, 2).map((b) => ({
        label: b.criterion,
        color: b.color || '#dc2626',
        coordinates: b.coordinates,
      })),
      legend: sub.boundaryLines.slice(0, 1).map((b) => ({
        color: b.color || '#dc2626',
        label: `破線：${b.criterion}`,
      })),
    },
    table: useFeatureMatch
      ? undefined
      : {
          caption: '図中 ア〜ウ 各地域の自然・産業メモ（地域名非表示）',
          headers: ['図中記号', '気候・土壌条件', '主な農業・資源・工業'],
          rows: hintTableRows,
        },
    choices,
    correctIndex,
    explanation: `${cName}の国内地域区分：${zones3.map((z, i) => `${codes[i]}＝${z.name}（${z.tag}）`).join('／')}。${sub.boundaryLines[0]?.examPoint ?? sub.summary}`,
    steps: [
      `Step 1（位置と自然帯）：${cName}の中で、緯度・海岸からの距離・地形によって${codes.join('・')}の位置関係を確認する。`,
      `Step 2（気候境界線の意味）：${sub.boundaryLines[0]?.criterion ?? '気候・地形境界'}を挟んで降水量や気温・産業構造がどう変化するかを対応させる。`,
      'Step 3（組合せ確定）：1地域でも確実に位置が分かれば6択を2択まで絞れるため、最も位置関係が明確な記号から確定する。',
    ],
    detailNotes: zones3.map((z, i) => `${codes[i]}：${z.name} — ${z.examTrap}`),
    relatedIso3s: [pickedCountry.iso3],
  };
}

function makeJapanDomesticDrillQuestion(
  japanData: JapanGeographyDataset | null | undefined,
  nonce: number,
): GeneratedDrillQuestion | null {
  if (!japanData) return null;
  const matrices: StatMatrixSpec[] = extractJapanDomesticMatrices(japanData);
  const prefRankings: JapanPrefRankingItem[] = japanData.domesticStats?.prefRankings ?? [];

  // 65%: 日本国内比較チャート（工業地帯構成、電源推移、輸入相手国、都道府県産業構造など）から3項目（ア〜ウ）判別
  if (matrices.length > 0 && Math.random() < 0.68) {
    const mat = shuffle(matrices)[0];
    const selectedRows = shuffle(mat.rows).slice(0, 3);
    if (selectedRows.length === 3 && hasHealthyVariance(selectedRows)) {
      const codes: [string, string, string] = ['ア', 'イ', 'ウ'];
      const names = selectedRows.map((r) => cleanCountryName(r.countryName)) as [
        string,
        string,
        string,
      ];
      const { choices, correctIndex } = make6Permutations(codes, names);

      return {
        id: `drill_jpn_mat_${nonce}`,
        genre: 'subnational_jpn',
        genreLabel: '日本地理・統計推論',
        domainTag: '地誌・国内統計',
        signature: `jpn_mat:${mat.id}:${names.slice().sort().join(',')}`,
        promptTitle: `【日本統計】${mat.title}`,
        promptBody: `下の表中の ア〜ウ は、${mat.title}における ${sortJa(names).join('、')} のいずれかを示したものである。正しい組合せを一つ選びなさい。`,
        table: {
          caption: `${mat.title}（単位：${mat.unit}）`,
          headers: ['記号', ...mat.colLabels],
          rows: selectedRows.map((r, i) => [codes[i], ...r.values.map((v) => fmtNum(v))]),
        },
        choices,
        correctIndex,
        explanation: mat.examPoint,
        steps: [
          `Step 1（最大の特色を読む）：最も突出した項目の数値に注目する。`,
          `Step 2（地域の立地・背景）：工業集積、発電政策、農畜産地の貿易構造など日本の空間的特性と照合する。`,
          `Step 3（組合せ確定）：1つ確定させて残る2つを比較する。`,
        ],
        relatedIso3s: ['JPN'],
        relatedSystematicId: mat.id.includes('power')
          ? 'sys_energy_mix_criteria'
          : mat.id.includes('industry')
            ? 'sys_weber_location'
            : undefined,
      };
    }
  }

  // 35%: 都道府県ランキング（農産・出荷額・高齢化・人口密度・再エネ等）4文正誤判定
  if (prefRankings.length > 0) {
    const item = shuffle(prefRankings)[0];
    if (item.entries.length >= 4) {
      const top4 = item.entries.slice(0, 4);
      const e1 = top4[0];
      const e2 = top4[1];
      const e3 = top4[2];
      const e4 = top4[3];
      const trueStmt = `${item.title.split('（')[0]}において、${e1.pref}（${fmtNum(e1.value)}${item.unit}）や${e2.pref}が上位に位置し、${item.examTrap}`;
      const f1 = `${e4.pref}がこの統計項目で全国1位であり、${e1.pref}の数値は${e4.pref}を下回っている。`;
      const f2 = `${e2.pref}と${e3.pref}の数値は同一であり、日本のどの都道府県間にもこの指標の地域差はみられない。`;
      const f3 = `${e1.pref}の数値をそのまま2倍すると全国合計になり、${e2.pref}以外の残りの県はすべて0である。`;
      const choices = shuffle([trueStmt, f1, f2, f3]);

      return {
        id: `drill_jpn_pref_${nonce}`,
        genre: 'subnational_jpn',
        genreLabel: '日本地理・都道府県統計',
        domainTag: '地誌・国内統計',
        signature: `jpn_pref:${item.id}`,
        promptTitle: `【日本統計・都道府県比較】${item.title.split('（')[0]}`,
        promptBody: `表は「${item.title}」の上位4都道府県（または代表地域）を示したものである。地理的特徴に関する説明として最も適当なものを一つ選びなさい。`,
        table: {
          caption: `${item.title}（${item.source} / ${item.dataYear}）`,
          headers: ['順位', '都道府県・地域', `数値 (${item.unit})`, '特徴メモ'],
          rows: top4.map((e, i) => [`${i + 1}`, e.pref, fmtNum(e.value), e.note ?? '上位']),
        },
        choices,
        correctIndex: choices.indexOf(trueStmt),
        explanation: item.examTrap,
        relatedIso3s: ['JPN'],
      };
    }
  }

  return null;
}

export function makeSubnationalAndJapanQuestion(
  countriesData: Record<string, CountryData>,
  japanData: JapanGeographyDataset | null | undefined,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  if (focusIso3 === 'JPN' && japanData) {
    return makeJapanDomesticDrillQuestion(japanData, nonce);
  }
  if (focusIso3 && countriesData[focusIso3]?.subnational) {
    return makeSubnationalMapQuestion(countriesData, nonce, focusIso3);
  }
  if (japanData && Math.random() < 0.45) {
    const jpnQ = makeJapanDomesticDrillQuestion(japanData, nonce);
    if (jpnQ) return jpnQ;
  }
  return makeSubnationalMapQuestion(countriesData, nonce, focusIso3);
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

    // 地図上のマーカーは A, B, C、雨温図ラベルは ア, イ, ウ（または地点地図付き都市特定）
    const mapCodes: [string, string, string] = ['A', 'B', 'C'];
    const graphCodes: [string, string, string] = ['ア', 'イ', 'ウ'];

    // 地図地点とグラフの対応を問う：正解順に sub3[0]=ア->A(shuffled index) だと分かりにくいため、
    // mapOrder をランダムに並べ、A,B,C の各点がどの都市に対応するかの表記にする
    const mapEntries = shuffle(sub3);
    // mapEntries[mIdx] が地点 mapCodes[mIdx] の都市。
    // 正解グラフ sub3[0]=ア は mapEntries の何番目にあるか：
    const graphToMapCode = sub3.map((gCity) => {
      const mIdx = mapEntries.findIndex((m) => m.city.cityId === gCity.city.cityId);
      return `${mapCodes[mIdx]}：${labelFor(gCity)}`;
    }) as [string, string, string];

    const { choices, correctIndex } = make6Permutations(graphCodes, graphToMapCode);

    return {
      id: `drill_cl_map_${nonce}`,
      genre: 'climate_coords',
      genreLabel: '地図地点×雨温図・ハイサー',
      domainTag: '自然・気候',
      signature: `cl_map:${coh.theme}:${sub3.map((s) => s.city.cityId).sort().join(',')}:${chartType}`,
      promptTitle: `世界地図の3地点（A〜C）× ${chartType === 'hythergraph' ? 'ハイサーグラフ' : '雨温図'}（ア〜ウ）判別`,
      promptBody: `下の世界地図上の地点 A〜C と、3つの${
        chartType === 'hythergraph' ? 'ハイサーグラフ（横軸:降水量・縦軸:気温）' : '雨温図'
      }（ア〜ウ、共通スケール）は、${coh.theme}に含まれる3都市を示したものである。ア〜ウ に該当する地点と都市の正しい組合せを一つ選びなさい。`,
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
      steps: [
        'Step 1（緯度と赤道の位置確認）：世界地図の赤道（0°）と回帰線（23.4°N/S）を基準に、A〜Cの北半球/南半球・低/中/高緯度を確認する。',
        'Step 2（気温の季節変化照合）：7月最高（北半球）か1月最高（南半球）か、年較差が大きいか小さいかでまず1〜2地点を切り分ける。',
        'Step 3（降水パターン照合）：夏季多雨・冬季多雨（地中海性・偏西風）・年中少雨を気温と合わせて地図上の海岸/内陸配置と確定させる。',
      ],
      detailNotes: sub3.map((p, i) => {
        const mIdx = mapEntries.findIndex((m) => m.city.cityId === p.city.cityId);
        return `図表 ${graphCodes[i]} ＝ 地点 ${mapCodes[mIdx]}（${labelFor(p)}）：${p.city.koppenCode}・標高 ${p.city.elevationM ?? '-'}m（${p.city.factors.slice(0, 2).join('・')}）`;
      }),
      relatedIso3s: sub3.map((p) => p.country.iso3),
    };
  }

  return null;
}

// ============================================================================
// E. 既存主要統計マトリックスに対する「4文正誤トラップ・2空欄会話」追加生成器
// ============================================================================

export function makeCuratedStatTwistQuestion(
  countriesData: Record<string, CountryData>,
  nonce: number,
  focusIso3?: string,
): GeneratedDrillQuestion | null {
  // 約45%: 実データ（総人口・GDP総額・1人当たりGDP・第1次産業割合）の割合/絶対値トラップ4択
  if (Math.random() < 0.45) {
    const stdPool = shuffle(
      Object.values(countriesData).filter(
        (c) =>
          !c.isBasicEntry &&
          EXAM_STANDARD_ISO3_SET.has(c.iso3) &&
          c.stats &&
          c.stats.population > 0 &&
          c.stats.gdpBillionUsd > 0 &&
          c.stats.gdpPerCapitaUsd > 0 &&
          c.iso3 !== 'NPL',
      ),
    );
    const orderedPool =
      focusIso3 && stdPool.some((c) => c.iso3 === focusIso3)
        ? [stdPool.find((c) => c.iso3 === focusIso3)!, ...stdPool.filter((c) => c.iso3 !== focusIso3)]
        : stdPool;

    // 類型が異なる4カ国を抽出（1人当たりGDP最大国とGDP総額最大国が異なる組合せを探す）
    const pick4: CountryData[] = [];
    const usedArch = new Set<string>();
    for (const c of orderedPool) {
      const arch = COUNTRY_ARCHETYPE_MAP[c.iso3] ?? c.iso3;
      if (pick4.length === 0 || !usedArch.has(arch)) {
        pick4.push(c);
        usedArch.add(arch);
      }
      if (pick4.length === 4) break;
    }

    if (pick4.length === 4) {
      const maxGdpTotal = [...pick4].sort(
        (a, b) => (b.stats?.gdpBillionUsd ?? 0) - (a.stats?.gdpBillionUsd ?? 0),
      )[0];
      const maxPerCapita = [...pick4].sort(
        (a, b) => (b.stats?.gdpPerCapitaUsd ?? 0) - (a.stats?.gdpPerCapitaUsd ?? 0),
      )[0];
      const maxPrimary = [...pick4].sort(
        (a, b) => (b.stats?.sectorShare.primaryPct ?? 0) - (a.stats?.sectorShare.primaryPct ?? 0),
      )[0];
      const maxPop = [...pick4].sort(
        (a, b) => (b.stats?.population ?? 0) - (a.stats?.population ?? 0),
      )[0];
      const minPop = [...pick4].sort(
        (a, b) => (a.stats?.population ?? 0) - (b.stats?.population ?? 0),
      )[0];

      if (
        maxGdpTotal.iso3 !== maxPerCapita.iso3 &&
        maxPrimary.iso3 !== maxPerCapita.iso3 &&
        minPop.iso3 !== maxPop.iso3
      ) {
        const nTotal = cleanCountryName(maxGdpTotal.nameJa);
        const nPer = cleanCountryName(maxPerCapita.nameJa);
        const nPrim = cleanCountryName(maxPrimary.nameJa);
        const nPop = cleanCountryName(maxPop.nameJa);

        const trueStmt = `${nPer}は1人当たりGDPが4カ国中で最も高い（${Math.round(
          maxPerCapita.stats!.gdpPerCapitaUsd,
        ).toLocaleString('ja-JP')}ドル）が、総人口の規模の違いによりGDP総額は${nTotal}（${Math.round(
          maxGdpTotal.stats!.gdpBillionUsd,
        ).toLocaleString('ja-JP')}億ドル）を下回っている。`;
        const fPerVsTotal = `${nPer}は1人当たりGDPが4カ国中で最大であるため、国の経済規模（GDP総額）についても表の4カ国中で最大である。`;
        const fShareVsTotal = `${nPrim}は第1次産業就業者割合が最も高いため、第1次産業の総生産額だけで${nTotal}の全GDPを上回っている。`;
        const fUrbanPop = `総人口が最大の${nPop}は、都市人口率（全人口に対する都市居住者の割合 %）においても必ず4カ国中で最小（または最大）というように人口総数と常に1対1で連動している。`;

        const stmts = [trueStmt, fPerVsTotal, fShareVsTotal, fUrbanPop];
        if (new Set(stmts).size === 4) {
          const choices = shuffle(stmts);
          return {
            id: `drill_real_trap_${nonce}`,
            genre: 'stat_country',
            genreLabel: '統計読取・割合/総数トラップ',
            domainTag: '統計・経済貿易',
            signature: `real_trap:${pick4.map((c) => c.iso3).sort().join(',')}`,
            promptTitle: '【割合・1人当たりと総額の識別】主要4カ国の経済・社会統計',
            promptBody:
              '表は4カ国の人口・GDP・産業別就業者構成を示した実データである。この表から読み取れる記述として「正しいもの」を次の①〜④のうちから1つ選びなさい。',
            table: {
              caption: '4カ国の経済規模・1人当たり指標・就業構造',
              headers: [
                '国名',
                '総人口(万人)',
                'GDP総額(億ドル)',
                '1人当たりGDP(ドル)',
                '第1次産業割合(%)',
                '都市人口率(%)',
              ],
              rows: pick4.map((c) => [
                cleanCountryName(c.nameJa),
                Math.round(c.stats!.population / 10000).toLocaleString('ja-JP'),
                Math.round(c.stats!.gdpBillionUsd).toLocaleString('ja-JP'),
                Math.round(c.stats!.gdpPerCapitaUsd).toLocaleString('ja-JP'),
                `${c.stats!.sectorShare.primaryPct.toFixed(1)}`,
                `${c.stats!.urbanPopRatePct.toFixed(1)}`,
              ]),
            },
            choices,
            correctIndex: choices.indexOf(trueStmt),
            explanation: `「1人当たりGDPが高い国＝GDP総額最大」ではなく、総人口×1人当たり水準＝経済規模となる。また就業割合（%）と生産額や総数の大小を取り違えないことが共通テストの最重要チェック項目である。`,
            steps: [
              `Step 1（1人当たり vs 総額の照合）：1人当たりGDPトップは${nPer}だが、GDP総額トップは人口・規模の大きい${nTotal}である点を確認する。`,
              'Step 2（割合 % の落とし穴）：第1次産業の就業者「割合」の高さと総生産額の絶対値は別指標であるため混同肢を消去する。',
              'Step 3（実数値との突合）：残る記述が表の数値関係と矛盾なく一致することを確認する。',
            ],
            relatedIso3s: pick4.map((c) => c.iso3),
          };
        }
      }
    }
  }

  const usable = CURATED_STAT_MATRICES.filter((m) => m.rows.length >= 4);
  if (usable.length === 0) return null;

  const prioritized = focusIso3
    ? [
        ...usable.filter((m) => m.rows.some((r) => r.iso3 === focusIso3)),
        ...usable.filter((m) => !m.rows.some((r) => r.iso3 === focusIso3)),
      ]
    : shuffle(usable);

  for (const mat of prioritized) {
    // 同じ経済類型ばかりにならないよう3-4国を選ぶ
    const picked: typeof mat.rows = [];
    const seenArch = new Set<string>();
    for (const r of shuffle(mat.rows)) {
      const arch = r.iso3 ? COUNTRY_ARCHETYPE_MAP[r.iso3] ?? r.iso3 : r.countryName;
      if (picked.length < 3 || !seenArch.has(arch)) {
        picked.push(r);
        seenArch.add(arch);
      }
      if (picked.length === 4) break;
    }
    if (picked.length < 4 || !hasHealthyVariance(picked)) continue;

    // 4文正誤判定（「割合(%)」や「生産 vs 輸出」の誤解トラップ）
    const c0Label = mat.colLabels[0];
    const sorted0 = [...picked].sort((a, b) => b.values[0] - a.values[0]);
    const top = sorted0[0];
    const low = sorted0[sorted0.length - 1];
    const second = sorted0[1];
    const isPct = mat.unit.includes('%');

    const tStmt = `表中の「${c0Label}」では ${cleanCountryName(top.countryName)}（${fmtNum(top.values[0])}${mat.unit}）が4カ国中最大であり、${mat.examPoint.split('。')[0]}。`;
    const f1 = isPct
      ? `${cleanCountryName(top.countryName)}は「${c0Label}」の割合が最大であるため、国の人口規模に関わらず絶対数量でも世界最大であると断定できる。`
      : `${cleanCountryName(low.countryName)}は「${c0Label}」が4カ国中で最大であり、${cleanCountryName(top.countryName)}を大きく上回っている。`;
    const f2 = `${cleanCountryName(top.countryName)}と${cleanCountryName(low.countryName)}を比較すると、「${c0Label}」の数値は両国でほぼ等しい。`;
    const f3 = `${cleanCountryName(second.countryName)}の「${c0Label}」の値は、同じ表の4カ国中で最小である。`;

    const all4 = [tStmt, f1, f2, f3];
    if (new Set(all4).size < 4) continue;
    const choices = shuffle(all4);
    const validIsos = picked
      .map((r) => r.iso3)
      .filter((x): x is string => Boolean(x && countriesData[x] && !countriesData[x].isBasicEntry));

    return {
      id: `drill_twist_${nonce}`,
      genre: 'stat_country',
      genreLabel: '統計読取・正誤判定',
      domainTag: '統計・経済貿易',
      signature: `twist_tf:${mat.id}:${picked.map((r) => r.iso3 ?? r.countryName).sort().join(',')}`,
      promptTitle: `【統計正誤判定】${mat.title}`,
      promptBody: `表は「${mat.title}」に関する4カ国の統計データである。この統計と各国の地理的背景に関する記述として「正しいもの」を一つ選びなさい。`,
      table: {
        caption: `${mat.title}（単位：${mat.unit}）`,
        headers: ['国名', ...mat.colLabels],
        rows: picked.map((r) => [cleanCountryName(r.countryName), ...r.values.map((v) => fmtNum(v))]),
      },
      choices,
      correctIndex: choices.indexOf(tStmt),
      explanation: mat.examPoint,
      steps: buildStepByStepExplanation({
        id: '',
        genre: 'stat_country',
        genreLabel: '',
        promptTitle: '',
        promptBody: '',
        choices,
        correctIndex: 0,
        explanation: mat.examPoint,
        relatedIso3s: validIsos,
      }),
      relatedIso3s: validIsos,
    };
  }

  return null;
}
