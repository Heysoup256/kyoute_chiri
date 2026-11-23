import type { Geometry } from 'geojson';
import type { ClimateCity, CountryData } from '../../types/schema_v1';
import {
  KOPPEN_13_COLORS,
  KOPPEN_GROUP_COLORS,
  normalizeKoppen13,
} from '../../utils/constants';

export type PaintGranularity = '5' | '13';

export interface PaintRegionDef {
  id: string;
  label: string;
  shortLabel: string;
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export const PAINT_REGIONS: PaintRegionDef[] = [
  { id: 'europe', label: 'ヨーロッパ・地中海', shortLabel: '欧州', minLng: -12, maxLng: 46, minLat: 33, maxLat: 72 },
  { id: 'africa', label: 'アフリカ', shortLabel: 'アフリカ', minLng: -20, maxLng: 54, minLat: -37, maxLat: 38 },
  { id: 'asia', label: 'アジア', shortLabel: 'アジア', minLng: 42, maxLng: 152, minLat: -12, maxLat: 76 },
  { id: 'north_america', label: '北・中アメリカ', shortLabel: '北米', minLng: -168, maxLng: -52, minLat: 7, maxLat: 74 },
  { id: 'south_america', label: '南アメリカ', shortLabel: '南米', minLng: -84, maxLng: -33, minLat: -57, maxLat: 15 },
  { id: 'oceania', label: 'オセアニア', shortLabel: '大洋州', minLng: 110, maxLng: 180, minLat: -48, maxLat: 0 },
  { id: 'world', label: '全世界（南極除く）', shortLabel: '全世界', minLng: -180, maxLng: 180, minLat: -58, maxLat: 82 },
];

export const KOPPEN_13_ORDER = [
  'Af', 'Am', 'Aw',
  'BW', 'BS',
  'Cs', 'Cw', 'Cfa', 'Cfb',
  'Df', 'Dw',
  'ET', 'EF',
] as const;

export const KOPPEN_5_ORDER = ['A', 'B', 'C', 'D', 'E'] as const;

export const KOPPEN_13_LABELS: Record<string, string> = {
  Af: '熱帯雨林',
  Am: '熱帯モンスーン',
  Aw: 'サバナ',
  BW: '砂漠',
  BS: 'ステップ',
  Cs: '地中海性',
  Cw: '温帯夏雨',
  Cfa: '温暖湿潤',
  Cfb: '西岸海洋性',
  Df: '冷帯湿潤',
  Dw: '冷帯冬季少雨',
  ET: 'ツンドラ',
  EF: '氷雪',
};

export const KOPPEN_5_LABELS: Record<string, string> = {
  A: '熱帯（最寒月18℃以上）',
  B: '乾燥帯（年降水<乾燥限界）',
  C: '温帯（最寒月-3〜18℃）',
  D: '冷帯（最寒月-3℃未満）',
  E: '寒帯（最暖月10℃未満）',
};

export interface GridBounds {
  colMin: number;
  colMax: number;
  rowMin: number;
  rowMax: number;
}

export function getRegionGridBounds(region: PaintRegionDef): GridBounds {
  const colMin = Math.max(0, Math.min(359, Math.floor(region.minLng + 180)));
  const colMax = Math.max(0, Math.min(359, Math.ceil(region.maxLng + 180) - 1));
  const rowMin = Math.max(0, Math.min(179, Math.floor(90 - region.maxLat)));
  const rowMax = Math.max(0, Math.min(179, Math.ceil(90 - region.minLat) - 1));
  return { colMin, colMax, rowMin, rowMax };
}

export function koppenCodeToValue(code: string, granularity: PaintGranularity): number {
  if (!code) return 0;
  const norm = normalizeKoppen13(code);
  if (granularity === '5') {
    const idx = KOPPEN_5_ORDER.indexOf(norm.charAt(0) as (typeof KOPPEN_5_ORDER)[number]);
    return idx >= 0 ? idx + 1 : 0;
  }
  const idx = KOPPEN_13_ORDER.indexOf(norm as (typeof KOPPEN_13_ORDER)[number]);
  return idx >= 0 ? idx + 1 : 0;
}

export function valueToKoppenCode(val: number, granularity: PaintGranularity): string {
  if (val <= 0) return '';
  if (granularity === '5') return KOPPEN_5_ORDER[val - 1] ?? '';
  return KOPPEN_13_ORDER[val - 1] ?? '';
}

export function valueToGroupIndex(val: number, granularity: PaintGranularity): number {
  if (val <= 0) return 0;
  if (granularity === '5') return val;
  const code = KOPPEN_13_ORDER[val - 1];
  if (!code) return 0;
  return KOPPEN_5_ORDER.indexOf(code.charAt(0) as (typeof KOPPEN_5_ORDER)[number]) + 1;
}

export function valueToHexColor(val: number, granularity: PaintGranularity): string {
  const code = valueToKoppenCode(val, granularity);
  if (!code) return '#f8fafc';
  return granularity === '5'
    ? (KOPPEN_GROUP_COLORS[code] ?? '#f8fafc')
    : (KOPPEN_13_COLORS[code] ?? '#f8fafc');
}

export interface KoppenCodeBreakdown {
  code: string;
  label: string;
  color: string;
  exactPct: number;
  areaPct: number;
}

export interface KoppenEvaluationResult {
  exactPct: number;
  groupPct: number;
  coveragePct: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  totalCells: number;
  paintedCells: number;
  byCode: KoppenCodeBreakdown[];
}

export function evaluateKoppenPaint(
  userGrid: Uint8Array,
  truthKoppen: string[][],
  region: PaintRegionDef,
  granularity: PaintGranularity,
): KoppenEvaluationResult {
  const { colMin, colMax, rowMin, rowMax } = getRegionGridBounds(region);
  let totalW = 0;
  let paintedW = 0;
  let exactW = 0;
  let groupW = 0;
  let totalCells = 0;
  let paintedCells = 0;

  const bucketTotal: Record<string, number> = {};
  const bucketExact: Record<string, number> = {};

  for (let r = rowMin; r <= rowMax; r++) {
    const latRad = ((89.5 - r) * Math.PI) / 180;
    const w = Math.max(0.05, Math.cos(latRad));
    const rowArr = truthKoppen[r];
    if (!rowArr) continue;

    for (let c = colMin; c <= colMax; c++) {
      const truthCode = rowArr[c];
      if (!truthCode) continue;
      const truthVal = koppenCodeToValue(truthCode, granularity);
      if (truthVal <= 0) continue;

      const tCode = valueToKoppenCode(truthVal, granularity);
      totalCells++;
      totalW += w;
      bucketTotal[tCode] = (bucketTotal[tCode] ?? 0) + w;

      const userVal = userGrid[r * 360 + c];
      if (userVal > 0) {
        paintedCells++;
        paintedW += w;
        if (userVal === truthVal) {
          exactW += w;
          bucketExact[tCode] = (bucketExact[tCode] ?? 0) + w;
        }
        if (valueToGroupIndex(userVal, granularity) === valueToGroupIndex(truthVal, granularity)) {
          groupW += w;
        }
      }
    }
  }

  const exactPct = totalW > 0 ? Math.round((exactW / totalW) * 1000) / 10 : 0;
  const groupPct = totalW > 0 ? Math.round((groupW / totalW) * 1000) / 10 : 0;
  const coveragePct = totalW > 0 ? Math.round((paintedW / totalW) * 1000) / 10 : 0;
  const rank: KoppenEvaluationResult['rank'] =
    exactPct >= 85 ? 'S' : exactPct >= 70 ? 'A' : exactPct >= 55 ? 'B' : exactPct >= 40 ? 'C' : 'D';

  const order = granularity === '5' ? KOPPEN_5_ORDER : KOPPEN_13_ORDER;
  const labels = granularity === '5' ? KOPPEN_5_LABELS : KOPPEN_13_LABELS;
  const byCode: KoppenCodeBreakdown[] = order
    .filter((code) => (bucketTotal[code] ?? 0) > 0)
    .map((code) => {
      const bw = bucketTotal[code] ?? 1;
      const ew = bucketExact[code] ?? 0;
      return {
        code,
        label: labels[code] ?? code,
        color: granularity === '5' ? KOPPEN_GROUP_COLORS[code] : KOPPEN_13_COLORS[code],
        exactPct: Math.round((ew / bw) * 1000) / 10,
        areaPct: totalW > 0 ? Math.round((bw / totalW) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => a.exactPct - b.exactPct);

  return {
    exactPct,
    groupPct,
    coveragePct,
    rank,
    totalCells,
    paintedCells,
    byCode,
  };
}

export function floodFillLand(
  userGrid: Uint8Array,
  truthKoppen: string[][],
  startCol: number,
  startRow: number,
  newVal: number,
  region: PaintRegionDef,
): Uint8Array | null {
  const { colMin, colMax, rowMin, rowMax } = getRegionGridBounds(region);
  if (
    startCol < colMin ||
    startCol > colMax ||
    startRow < rowMin ||
    startRow > rowMax ||
    !truthKoppen[startRow]?.[startCol]
  ) {
    return null;
  }

  const targetOld = userGrid[startRow * 360 + startCol];
  if (targetOld === newVal) return null;

  const next = new Uint8Array(userGrid);
  const stack: number[] = [startCol, startRow];

  while (stack.length > 0) {
    const r = stack.pop()!;
    const c = stack.pop()!;
    const idx = r * 360 + c;
    if (next[idx] !== targetOld) continue;
    if (!truthKoppen[r]?.[c]) continue;
    next[idx] = newVal;

    if (c - 1 >= colMin) stack.push(c - 1, r);
    if (c + 1 <= colMax) stack.push(c + 1, r);
    if (r - 1 >= rowMin) stack.push(c, r - 1);
    if (r + 1 <= rowMax) stack.push(c, r + 1);
  }
  return next;
}

/* ==================== 地理距離・ピン打ち採点 ==================== */

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

export function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (((lng2 - lng1 + 540) % 360) - 180) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

function closestPointOnSegment(
  pLng: number,
  pLat: number,
  aLng: number,
  aLat: number,
  bLng: number,
  bLat: number,
): { distKm: number; nearestLng: number; nearestLat: number } {
  const bRelLng = aLng + ((((bLng - aLng + 540) % 360) + 360) % 360 - 180);
  const pRelLng = aLng + ((((pLng - aLng + 540) % 360) + 360) % 360 - 180);
  const cosScale = Math.max(0.15, Math.cos(((aLat + bLat) * 0.5) * DEG_TO_RAD));

  const vx = (bRelLng - aLng) * cosScale;
  const vy = bLat - aLat;
  const wx = (pRelLng - aLng) * cosScale;
  const wy = pLat - aLat;
  const segLen2 = vx * vx + vy * vy;
  const t = segLen2 > 1e-10 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / segLen2)) : 0;

  const nearLng = aLng + (bRelLng - aLng) * t;
  const nearLat = aLat + (bLat - aLat) * t;
  const normLng = ((((nearLng + 180) % 360) + 360) % 360) - 180;
  return {
    distKm: haversineKm(pLng, pLat, normLng, nearLat),
    nearestLng: normLng,
    nearestLat: nearLat,
  };
}

export function distanceToGeometryKm(
  lng: number,
  lat: number,
  geom: Geometry,
): { distKm: number; nearestLng: number; nearestLat: number } {
  if (geom.type === 'Point') {
    const [gLng, gLat] = geom.coordinates;
    return { distKm: haversineKm(lng, lat, gLng, gLat), nearestLng: gLng, nearestLat: gLat };
  }
  const lines: number[][][] =
    geom.type === 'LineString'
      ? [geom.coordinates]
      : geom.type === 'MultiLineString'
        ? geom.coordinates
        : [];

  let best = { distKm: Infinity, nearestLng: lng, nearestLat: lat };
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const cand = closestPointOnSegment(
        lng,
        lat,
        line[i][0],
        line[i][1],
        line[i + 1][0],
        line[i + 1][1],
      );
      if (cand.distKm < best.distKm) best = cand;
    }
    if (line.length === 1) {
      const d = haversineKm(lng, lat, line[0][0], line[0][1]);
      if (d < best.distKm) best = { distKm: d, nearestLng: line[0][0], nearestLat: line[0][1] };
    }
  }
  return best;
}

export function getGeometryCenter(geom: Geometry): [number, number] {
  if (geom.type === 'Point') {
    return [geom.coordinates[0], geom.coordinates[1]];
  }
  const lines =
    geom.type === 'LineString'
      ? [geom.coordinates]
      : geom.type === 'MultiLineString'
        ? geom.coordinates
        : geom.type === 'Polygon'
          ? geom.coordinates
          : geom.type === 'MultiPolygon'
            ? geom.coordinates[0] ?? []
            : [];
  const mainLine = lines[0];
  if (!mainLine || mainLine.length === 0) return [0, 0];
  const mid = mainLine[Math.floor(mainLine.length / 2)];
  return [mid[0], mid[1]];
}

export function computePinScore(
  distKm: number,
  isLinearFeature: boolean,
): { score: number; grade: 'S' | 'A' | 'B' | 'C' | 'D' } {
  const freeRadius = isLinearFeature ? 120 : 80;
  const scaleKm = isLinearFeature ? 950 : 650;
  const effective = Math.max(0, distKm - freeRadius);
  const score = Math.round(100 * Math.exp(-effective / scaleKm));
  const grade =
    score >= 85 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D';
  return { score, grade };
}

/* ==================== 雨温図・ハイサーグラフ 4択出題エンジン ==================== */

export interface QuizClimateCity {
  city: ClimateCity;
  iso3: string;
  countryNameJa: string;
  koppen: string;
  group: string;
  meanT: number;
  minT: number;
  maxT: number;
  rangeT: number;
  totalP: number;
  /** 5〜9月(北夏)降水比率 0..1 */
  maySepRatio: number;
  /** 暖半期(北:5-9 / 南:11-3)降水比率 0..1 */
  warmSeasonRatio: number;
  hemi: 'N' | 'EQ' | 'S';
  elevM: number;
}

export interface ClimateOptionFeedback {
  item: QuizClimateCity;
  optionIndex: number;
  isCorrect: boolean;
  /** 不正解候補が正解グラフと異なる決定的根拠 */
  exclusionReason: string;
}

export interface SmartClimateQuestion {
  target: QuizClimateCity;
  options: ClimateOptionFeedback[];
  winningReasons: string[];
  sharedTempRange: [number, number];
  sharedPrecipMax: number;
}

export function extractClimateCities(countriesData: Record<string, CountryData>): QuizClimateCity[] {
  const out: QuizClimateCity[] = [];
  for (const country of Object.values(countriesData)) {
    for (const ct of country.climate.cities) {
      if (ct.monthlyTempC.length !== 12 || ct.monthlyPrecipMm.length !== 12) continue;
      const sumT = ct.monthlyTempC.reduce((a, b) => a + b, 0);
      const meanT = Math.round((sumT / 12) * 10) / 10;
      const minT = Math.min(...ct.monthlyTempC);
      const maxT = Math.max(...ct.monthlyTempC);
      const rangeT = Math.round((maxT - minT) * 10) / 10;
      const totalP = Math.max(1, ct.monthlyPrecipMm.reduce((a, b) => a + b, 0));

      const maySep = ct.monthlyPrecipMm.slice(4, 9).reduce((a, b) => a + b, 0);
      const novMar =
        ct.monthlyPrecipMm[10] +
        ct.monthlyPrecipMm[11] +
        ct.monthlyPrecipMm[0] +
        ct.monthlyPrecipMm[1] +
        ct.monthlyPrecipMm[2];
      const julTmp = (ct.monthlyTempC[5] + ct.monthlyTempC[6] + ct.monthlyTempC[7]) / 3;
      const janTmp = (ct.monthlyTempC[11] + ct.monthlyTempC[0] + ct.monthlyTempC[1]) / 3;

      const hemi: 'N' | 'EQ' | 'S' =
        ct.lat > 7 && julTmp - janTmp >= 1.5
          ? 'N'
          : ct.lat < -7 && janTmp - julTmp >= 1.5
            ? 'S'
            : 'EQ';

      const warmP = hemi === 'S' ? novMar : maySep;
      const koppen = normalizeKoppen13(ct.koppenCode);
      out.push({
        city: { ...ct, koppenCode: koppen },
        iso3: country.iso3,
        countryNameJa: country.nameJa,
        koppen,
        group: koppen.charAt(0),
        meanT,
        minT,
        maxT,
        rangeT,
        totalP,
        maySepRatio: maySep / totalP,
        warmSeasonRatio: warmP / totalP,
        hemi,
        elevM: ct.elevationM ?? 0,
      });
    }
  }
  return out;
}

function findDistinguishingReason(target: QuizClimateCity, other: QuizClimateCity): string | null {
  // 1. 南北半球逆転（気温の山の月が正反対）
  if (
    target.hemi !== 'EQ' &&
    other.hemi !== 'EQ' &&
    target.hemi !== other.hemi &&
    target.rangeT >= 4.0 &&
    other.rangeT >= 4.0
  ) {
    const tSeason = target.hemi === 'N' ? '7〜8月が最高・1月が最低（北半球）' : '1〜2月が最高・7月が最低（南半球）';
    const oSeason = other.hemi === 'N' ? '7〜8月高温（北半球）' : '1〜2月高温（南半球）';
    return `${oSeason}であり、出題地の${tSeason}と季節が真逆です`;
  }

  // 2. ケッペン温度境界線の決定的な違い（熱帯18℃ / 温帯-3℃ / 寒帯10℃）
  if (target.group === 'A' && other.minT < 16.5) {
    return `最寒月平均気温が ${other.minT.toFixed(1)}℃ まで下がり、熱帯（全月18℃以上）である出題地より低温です`;
  }
  if (target.group === 'C' && other.minT < -4.0) {
    return `最寒月が ${other.minT.toFixed(1)}℃（-3℃未満＝冷帯）まで下がり、温帯である出題地より冬の冷え込みが厳しすぎます`;
  }
  if (target.group === 'D' && other.minT >= 0.5) {
    return `最寒月が ${other.minT.toFixed(1)}℃ と温暖（温帯）であり、冬の氷点下（冷帯）になる出題地と異なります`;
  }
  if (target.koppen === 'ET' && other.maxT >= 11.5) {
    return `最暖月が ${other.maxT.toFixed(1)}℃ に達しており、最暖月10℃未満の寒帯(ET)である出題地とは異なります`;
  }

  // 3. 降水量・乾燥帯の違い
  const pRatio = Math.max(target.totalP, other.totalP) / Math.max(30, Math.min(target.totalP, other.totalP));
  if (pRatio >= 1.85 && Math.abs(target.totalP - other.totalP) >= 320) {
    return `年降水量が約 ${Math.round(other.totalP)}mm であり、出題地（約 ${Math.round(target.totalP)}mm）と降水量の規模が明確に異なります`;
  }

  // 4. 乾季・雨季パターンの明瞭な差（例：Cs vs Cw/Aw vs Cfa/Cfb）
  if (Math.abs(target.warmSeasonRatio - other.warmSeasonRatio) >= 0.25) {
    const tPat =
      target.warmSeasonRatio < 0.3
        ? '夏乾燥・冬雨型(Cs等)'
        : target.warmSeasonRatio > 0.62
          ? '夏雨集中型(Cw/Aw/Dw)'
          : '通年降水型';
    const oPat =
      other.warmSeasonRatio < 0.3
        ? '夏乾燥・冬雨型'
        : other.warmSeasonRatio > 0.62
          ? '夏雨集中型'
          : '通年ほぼ平均して降水';
    return `出題地が「${tPat}」なのに対し、このグラフは「${oPat}」の季節配分を示しています`;
  }

  // 5. 年較差または気温水準（大陸性 vs 海洋性・高地差）の明確な違い
  if (Math.abs(target.rangeT - other.rangeT) >= 7.5) {
    const rel = other.rangeT > target.rangeT ? '大きく（内陸性）' : '小さく（海洋性・低緯度）';
    return `気温年較差が ${other.rangeT.toFixed(1)}℃ と出題地（${target.rangeT.toFixed(1)}℃）より明確に${rel}なっています`;
  }
  if (Math.abs(target.meanT - other.meanT) >= 5.5) {
    const rel = other.meanT > target.meanT ? '高く' : '低く';
    return `年平均気温が ${other.meanT.toFixed(1)}℃ であり、出題地（${target.meanT.toFixed(1)}℃）より気温帯が明確に${rel}なっています`;
  }

  return null;
}

function similarityScore(target: QuizClimateCity, other: QuizClimateCity): number {
  let score = 0;
  // 同じ大区分内（または同区分逆半球）が最も入試らしく紛らわしく良いライバル
  if (target.koppen === other.koppen && target.hemi !== other.hemi) score += 60;
  else if (target.group === other.group) score += 45;
  else if (
    (target.group === 'C' && (other.group === 'D' || other.group === 'B')) ||
    (target.group === 'A' && other.group === 'B') ||
    (target.group === 'B' && (other.group === 'A' || other.group === 'C'))
  ) {
    score += 24;
  }

  // 平均気温や年降水量がほどよく近いほど「値域を比べさせる良い選択肢」になる
  const tempDiff = Math.abs(target.meanT - other.meanT);
  score += Math.max(0, 22 - tempDiff * 1.4);

  const pRatio = Math.max(target.totalP, other.totalP) / Math.max(40, Math.min(target.totalP, other.totalP));
  if (pRatio <= 2.4) score += 16;
  else if (pRatio <= 4.0) score += 8;

  // 高地都市同士や同じ乾燥系なども微加算
  if (target.elevM >= 900 && other.elevM >= 900) score += 10;

  return score + Math.random() * 6;
}

export function buildSmartClimateQuestion(
  cities: QuizClimateCity[],
  target: QuizClimateCity,
): SmartClimateQuestion {
  const candidates: { item: QuizClimateCity; reason: string; score: number }[] = [];

  for (const other of cities) {
    if (other.city.cityId === target.city.cityId || other.iso3 === target.iso3) continue;
    const reason = findDistinguishingReason(target, other);
    if (!reason) continue;
    candidates.push({
      item: other,
      reason,
      score: similarityScore(target, other),
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  // 多様性を確保：同じケッペン区分が誤答に2個以上偏らないように優先選択（まず同区分別国最大1〜2、残りは他区分）
  const picked: { item: QuizClimateCity; reason: string }[] = [];
  const usedIsos = new Set<string>([target.iso3]);
  const usedKoppen = new Map<string, number>();

  for (const cand of candidates) {
    if (picked.length >= 3) break;
    if (usedIsos.has(cand.item.iso3)) continue;
    const kc = usedKoppen.get(cand.item.koppen) ?? 0;
    if (kc >= 1 && candidates.length >= 12) continue;
    picked.push({ item: cand.item, reason: cand.reason });
    usedIsos.add(cand.item.iso3);
    usedKoppen.set(cand.item.koppen, kc + 1);
  }
  for (const cand of candidates) {
    if (picked.length >= 3) break;
    if (usedIsos.has(cand.item.iso3)) continue;
    picked.push({ item: cand.item, reason: cand.reason });
    usedIsos.add(cand.item.iso3);
  }

  // 全4択をシャッフル
  const rawOptions = [
    { item: target, isCorrect: true, exclusionReason: '出題地点の実測グラフです' },
    ...picked.map((p) => ({
      item: p.item,
      isCorrect: false,
      exclusionReason: p.reason,
    })),
  ];
  for (let i = rawOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
  }

  // 統一軸レンジ計算（4つ並べて縦軸の数字・スケール比較で根拠を持って絞れるようにする）
  let globalMinT = Infinity;
  let globalMaxT = -Infinity;
  let globalMaxP = 0;
  for (const opt of rawOptions) {
    globalMinT = Math.min(globalMinT, opt.item.minT);
    globalMaxT = Math.max(globalMaxT, opt.item.maxT);
    globalMaxP = Math.max(globalMaxP, ...opt.item.city.monthlyPrecipMm);
  }
  const tLow = Math.floor((Math.min(-5, globalMinT) - 3) / 5) * 5;
  const tHigh = Math.ceil((Math.max(28, globalMaxT) + 3) / 5) * 5;
  const pMax = Math.max(100, Math.ceil((globalMaxP * 1.12) / 50) * 50);

  // 正解の決め手サマリー構築
  const reasons: string[] = [];
  const hemiDesc =
    target.hemi === 'N'
      ? '気温の山が7〜8月にある「北半球」の気温変化'
      : target.hemi === 'S'
        ? '気温の谷が7月・山が1〜2月にある「南半球」の気温変化'
        : '年間を通じ気温較差が小さい「低緯度／熱帯高地」の水平に近い気温曲線';
  reasons.push(hemiDesc);
  reasons.push(
    `年平均気温 ${target.meanT.toFixed(1)}℃・年較差 ${target.rangeT.toFixed(1)}℃（最寒月 ${target.minT.toFixed(1)}℃〜最暖月 ${target.maxT.toFixed(1)}℃）`,
  );
  reasons.push(
    `年降水量 約 ${Math.round(target.totalP)}mm（${
      target.warmSeasonRatio < 0.3
        ? '夏乾燥・冬に降る地中海性型'
        : target.warmSeasonRatio > 0.62
          ? '夏に降水量が増える夏雨集中型'
          : '季節の偏りが比較的小さい型'
    }）`,
  );
  if (target.elevM >= 900) {
    reasons.push(`標高約 ${target.elevM.toLocaleString()}m の高地補正により低緯度でも気温が抑制`);
  }

  return {
    target,
    options: rawOptions.map((o, idx) => ({ ...o, optionIndex: idx })),
    winningReasons: reasons,
    sharedTempRange: [tLow, tHigh],
    sharedPrecipMax: pMax,
  };
}
