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
  | 'economy_profile'
  | 'climate_coords'
  | 'pyramid_match'
  | 'time_shift'
  | 'photo_infer';

export interface GeneratedDrillQuestion {
  id: string;
  genre: Exclude<DrillGenre, 'all'>;
  genreLabel: string;
  promptTitle: string;
  promptBody: string;
  table?: { caption?: string; headers: string[]; rows: string[][] };
  climateCity?: ClimateCity;
  pyramidBins?: AgePyramidBin[];
  photoUrl?: string;
  visualClues?: string[];
  choices: string[];
  correctIndex: number;
  explanation: string;
  relatedIso3s: string[];
}

export const DRILL_GENRE_OPTIONS: { id: DrillGenre; label: string }[] = [
  { id: 'all', label: '全ジャンルおまかせ' },
  { id: 'ranking_matrix', label: '統計上位マトリクス' },
  { id: 'economy_profile', label: '経済・人口指標特定' },
  { id: 'climate_coords', label: '雨温図・気候判別' },
  { id: 'pyramid_match', label: '人口ピラミッド判別' },
  { id: 'time_shift', label: '時代変化データ読取' },
  { id: 'photo_infer', label: '景観写真・地域推論' },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function fmtPopShort(pop: number): string {
  if (pop >= 1e8) return `${(pop / 1e8).toFixed(2)}億人`;
  if (pop >= 1e4) return `${Math.round(pop / 1e4).toLocaleString('ja-JP')}万人`;
  return `${pop.toLocaleString('ja-JP')}人`;
}

function makeRankingMatrixQuestion(
  dataset: WorldRankingsDataset,
  nonce: number,
): GeneratedDrillQuestion | null {
  const validItems = dataset.items.filter((it) => it.primaryTop.length >= 3);
  if (validItems.length < 3) return null;

  const picked: typeof validItems = [];
  const shuffled = shuffle(validItems);
  const seenTop1 = new Set<string>();
  for (const it of shuffled) {
    const top1 = it.primaryTop[0]?.iso3;
    if (!top1 || seenTop1.has(top1)) continue;
    picked.push(it);
    seenTop1.add(top1);
    if (picked.length === 3) break;
  }
  if (picked.length < 3) {
    return null;
  }

  const shortTitle = (t: string) => t.split('（')[0].trim();
  const [a, b, c] = picked;
  const rows = [
    ['ア', a.primaryTop[0].nameJa, a.primaryTop[1].nameJa, a.primaryTop[2].nameJa],
    ['イ', b.primaryTop[0].nameJa, b.primaryTop[1].nameJa, b.primaryTop[2].nameJa],
    ['ウ', c.primaryTop[0].nameJa, c.primaryTop[1].nameJa, c.primaryTop[2].nameJa],
  ];

  const perms: [string, string, string][] = [
    [shortTitle(a.title), shortTitle(b.title), shortTitle(c.title)],
    [shortTitle(a.title), shortTitle(c.title), shortTitle(b.title)],
    [shortTitle(b.title), shortTitle(a.title), shortTitle(c.title)],
    [shortTitle(c.title), shortTitle(b.title), shortTitle(a.title)],
  ];
  const answerText = `ア：${perms[0][0]} ／ イ：${perms[0][1]} ／ ウ：${perms[0][2]}`;
  const rawChoices = perms.map((p) => `ア：${p[0]} ／ イ：${p[1]} ／ ウ：${p[2]}`);
  const choices = shuffle(Array.from(new Set(rawChoices)));
  if (choices.length < 4) return null;

  const isos = Array.from(
    new Set(picked.flatMap((it) => it.primaryTop.slice(0, 2).map((e) => e.iso3))),
  );

  return {
    id: `drill_rm_${nonce}`,
    genre: 'ranking_matrix',
    genreLabel: '統計上位マトリクス',
    promptTitle: '統計上位3カ国の組合せ特定',
    promptBody:
      '下の表は世界の農林水産・鉱工業・人口統計のいずれか3項目（ア〜ウ）について、上位3カ国を示したものである。ア〜ウに該当する項目の正しい組合せを選びなさい。',
    table: {
      caption: '項目別の世界上位3カ国（データ出典：収録最新統計）',
      headers: ['項目', '第1位', '第2位', '第3位'],
      rows,
    },
    choices,
    correctIndex: choices.indexOf(answerText),
    explanation: [
      `ア（${shortTitle(a.title)}）：${a.examTrap}`,
      `イ（${shortTitle(b.title)}）：${b.examTrap}`,
      `ウ（${shortTitle(c.title)}）：${c.examTrap}`,
    ].join(' '),
    relatedIso3s: isos.slice(0, 5),
  };
}

function makeEconomyProfileQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const eligible = Object.values(countries).filter(
    (c) =>
      !c.isBasicEntry &&
      c.stats &&
      c.stats.population > 0 &&
      c.stats.gdpPerCapitaUsd > 0 &&
      c.stats.fertilityRate != null &&
      c.industry.trade.majorExports.length > 0,
  );
  if (eligible.length < 4) return null;

  const picked: CountryData[] = [];
  const usedRegions = new Set<string>();
  for (const c of shuffle(eligible)) {
    const regKey = `${c.region}-${c.examSummary.rank}`;
    if (!usedRegions.has(regKey) || picked.length < 4) {
      if (!picked.some((p) => p.iso3 === c.iso3)) {
        picked.push(c);
        usedRegions.add(regKey);
      }
    }
    if (picked.length === 4) break;
  }
  if (picked.length < 4) return null;

  const targetIdx = Math.floor(Math.random() * 4);
  const target = picked[targetIdx];
  const labels = ['国A', '国B', '国C', '国D'];

  const rows = picked.map((c, idx) => {
    const st = c.stats!;
    const sh = st.sectorShare;
    return [
      labels[idx],
      fmtPopShort(st.population),
      `$${st.gdpPerCapitaUsd.toLocaleString()}`,
      `${st.urbanPopRatePct}%`,
      st.fertilityRate!.toFixed(2),
      `${sh.primaryPct}/${sh.secondaryPct}/${sh.tertiaryPct}`,
      c.industry.trade.majorExports.slice(0, 2).join('・'),
    ];
  });

  const choices = shuffle(picked.map((c) => c.nameJa.split('（')[0]));
  const answerName = target.nameJa.split('（')[0];

  return {
    id: `drill_ec_${nonce}`,
    genre: 'economy_profile',
    genreLabel: '経済・人口指標特定',
    promptTitle: '統計指標比較表からの国名特定',
    promptBody: `次の統計表で「${labels[targetIdx]}」に該当する国として正しいものを選びなさい。`,
    table: {
      caption: '4カ国の基礎指標・産業構成・主要輸出比較',
      headers: ['国', '人口', '1人GDP', '都市率', '出生率', '1/2/3次(%)', '主な輸出品目'],
      rows,
    },
    choices,
    correctIndex: choices.indexOf(answerName),
    explanation: `${labels[targetIdx]}は「${answerName}」（${target.region}）。1人あたりGDP $${target.stats!.gdpPerCapitaUsd.toLocaleString()}、都市人口率 ${target.stats!.urbanPopRatePct}%、合計特殊出生率 ${target.stats!.fertilityRate!.toFixed(2)}、主要輸出品「${target.industry.trade.majorExports.slice(0, 3).join('・')}」が識別手がかり。`,
    relatedIso3s: picked.map((c) => c.iso3),
  };
}

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

  const target = picked[0];
  const { city } = target;
  const latLabel =
    city.lat >= 0
      ? `北緯約${Math.abs(city.lat).toFixed(1)}°`
      : `南緯約${Math.abs(city.lat).toFixed(1)}°`;
  const elevLabel = city.elevationM != null ? `・標高約${city.elevationM}m` : '';

  const labelFor = (p: (typeof pool)[number]) =>
    `${p.city.nameJa}（${p.country.nameJa.split('（')[0]}）`;
  const answer = labelFor(target);
  const choices = shuffle(picked.map(labelFor));

  const details = picked
    .map(
      (p) =>
        `${p.city.nameJa}(${p.city.koppenCode}・${p.city.lat >= 0 ? '北半球' : '南半球'})`,
    )
    .join('／');

  return {
    id: `drill_cl_${nonce}`,
    genre: 'climate_coords',
    genreLabel: '雨温図・気候判別',
    promptTitle: '雨温図と緯度・標高条件からの都市特定',
    promptBody: `下の雨温図に該当する都市（条件：${latLabel}${elevLabel}）として最も適当なものを選びなさい。`,
    climateCity: city,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は ${answer}（気候区分 ${city.koppenCode}：${city.koppenNameJa ?? ''}）。要因：${city.factors.slice(0, 2).join('／')}。［比較：${details}］`,
    relatedIso3s: picked.map((p) => p.country.iso3),
  };
}

function makePyramidQuestion(
  countries: Record<string, CountryData>,
  nonce: number,
): GeneratedDrillQuestion | null {
  const pool = Object.values(countries).filter(
    (c) => !c.isBasicEntry && c.stats && c.stats.agePyramid && c.stats.agePyramid.length >= 10,
  );
  if (pool.length < 4) return null;

  const picked: CountryData[] = [];
  const usedTypes = new Set<string>();
  for (const c of shuffle(pool)) {
    const t = c.stats!.pyramidType;
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

  const target = picked[0];
  const answer = target.nameJa.split('（')[0];
  const choices = shuffle(picked.map((c) => c.nameJa.split('（')[0]));

  const summaryOf = (c: CountryData) =>
    `${c.nameJa.split('（')[0]}(${c.stats!.pyramidType}, 出生率${c.stats!.fertilityRate?.toFixed(2) ?? '-'})`;

  return {
    id: `drill_pyr_${nonce}`,
    genre: 'pyramid_match',
    genreLabel: '人口ピラミッド判別',
    promptTitle: '年齢階層・男女別人口ピラミッドからの国名特定',
    promptBody: '下の人口ピラミッドに当てはまる国として最も適当なものを選びなさい。',
    pyramidBins: target.stats!.agePyramid,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」（形状類型：${target.stats!.pyramidType}、1人GDP $${target.stats!.gdpPerCapitaUsd.toLocaleString()}、都市人口率 ${target.stats!.urbanPopRatePct}%）。［選択肢比較：${picked.map(summaryOf).join('／')}］`,
    relatedIso3s: picked.map((c) => c.iso3),
  };
}

function makeTimeShiftQuestion(
  sliders: TimeSeriesSliderItem[],
  nonce: number,
): GeneratedDrillQuestion | null {
  const valid = sliders.filter((s) => s.frames.length >= 2 && s.frames[0].items.length >= 3);
  if (valid.length < 4) return null;

  const picked = shuffle(valid).slice(0, 4);
  const target = picked[0];
  const firstFrame = target.frames[0];
  const lastFrame = target.frames[target.frames.length - 1];

  // 最初は4つの時代変化テーマタイトル当て（必ず安定・良問）
  const rows = [
    [
      firstFrame.yearLabel,
      firstFrame.items
        .slice(0, 4)
        .map((it, idx) => `${idx + 1}. ${it.label}(${it.value}${target.unit})`)
        .join(' ／ '),
      firstFrame.periodNote,
    ],
    [
      lastFrame.yearLabel,
      lastFrame.items
        .slice(0, 4)
        .map((it, idx) => `${idx + 1}. ${it.label}(${it.value}${target.unit})`)
        .join(' ／ '),
      lastFrame.periodNote,
    ],
  ];

  const cleanTitle = (s: TimeSeriesSliderItem) => s.title.split('（')[0].trim();
  const answer = cleanTitle(target);
  const choices = shuffle(picked.map(cleanTitle));

  return {
    id: `drill_ts_${nonce}`,
    genre: 'time_shift',
    genreLabel: '時代変化データ読取',
    promptTitle: '時系列の統計推移からのテーマ・構造特定',
    promptBody:
      '下の表は、ある統計テーマの最初期と近年の上位・構成比の推移を比較したものである。このデータが示す主題として最も適当なものを選びなさい。',
    table: {
      caption: `時系列比較（${firstFrame.yearLabel} → ${lastFrame.yearLabel}）`,
      headers: ['時点', '上位・構成比データ', '時期の背景'],
      rows,
    },
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」。解説：${target.shiftSummary}`,
    relatedIso3s: target.relatedIso3s.slice(0, 4),
  };
}

function makePhotoInferQuestion(
  entries: PhotoEncyclopediaEntry[],
  nonce: number,
): GeneratedDrillQuestion | null {
  if (entries.length < 4) return null;

  const picked: PhotoEncyclopediaEntry[] = [];
  const usedCats = new Set<string>();
  for (const e of shuffle(entries)) {
    if (!usedCats.has(e.category) || picked.length < 4) {
      if (!picked.some((p) => p.id === e.id)) {
        picked.push(e);
        usedCats.add(e.category);
      }
    }
    if (picked.length === 4) break;
  }
  if (picked.length < 4) return null;

  const target = picked[0];
  const formatChoice = (e: PhotoEncyclopediaEntry) =>
    `${e.title}（${e.locationLabel}・気候 ${e.koppenCodes.join('/')}）`;

  const answer = formatChoice(target);
  const choices = shuffle(picked.map(formatChoice));

  return {
    id: `drill_ph_${nonce}`,
    genre: 'photo_infer',
    genreLabel: '景観写真・地域推論',
    promptTitle: '景観写真と着眼点からの気候・地域特定',
    promptBody:
      '下の景観写真および観察の着眼点に合致する地域・特徴として最も適当なものを選びなさい。',
    photoUrl: target.photoUrl,
    visualClues: target.visualClues,
    choices,
    correctIndex: choices.indexOf(answer),
    explanation: `正解は「${answer}」。因果推論：${target.inferenceSummary} ${target.examPoint}`,
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
          'economy_profile',
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
    } else if (g === 'economy_profile') {
      q = makeEconomyProfileQuestion(params.countriesData, nonce);
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
