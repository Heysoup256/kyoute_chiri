import type { FeatureCollection, Geometry } from 'geojson';
import { AlertTriangle, ArrowRight, Globe2, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { GeoCountryProperties, WorldFlowArc, WorldFlowMap } from '../../types/schema_v1';

interface WorldFlowMapCardProps {
  flowMap: WorldFlowMap;
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  onSelectCountry: (iso3: string) => void;
  onHighlightCountries: (label: string, iso3s: string[]) => void;
}

const SVG_W = 960;
const SVG_H = 445;
const LAT_MAX = 82;
const LAT_MIN = -58;

function normalizeLngForCenter(lng: number, centerMode: 'atlantic' | 'pacific'): number {
  if (centerMode === 'atlantic') {
    let x = lng;
    while (x < -180) x += 360;
    while (x > 180) x -= 360;
    return x;
  }
  // 太平洋中心：切断経度を大西洋中央の -28°（332°）に置き、南北アメリカとユーラシア/日本を一繋がりに保つ
  let x = lng;
  while (x < -28) x += 360;
  while (x >= 332) x -= 360;
  return x;
}

function projectPoint(
  lng: number,
  lat: number,
  centerMode: 'atlantic' | 'pacific',
  useDirectLng = false,
): [number, number] {
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const minLng = centerMode === 'atlantic' ? -180 : -28;
  const effLng = useDirectLng ? lng : normalizeLngForCenter(lng, centerMode);
  const x = ((effLng - minLng) / 360) * SVG_W;
  const y = ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * SVG_H;
  return [x, y];
}

function ringToSvgSubpath(
  ring: number[][],
  centerMode: 'atlantic' | 'pacific',
): string {
  if (ring.length < 3) return '';

  // 先頭点を基準にして、リング内の小またぎ（例: ±180°を跨ぐ単一島嶼やグリーンランド）を連続アンラップ
  const firstNorm = normalizeLngForCenter(ring[0][0], centerMode);
  const pts: [number, number][] = [];
  let prevUnwrappedLng = firstNorm;
  let lastPx: [number, number] | null = null;

  for (let i = 0; i < ring.length; i++) {
    const rawLng = ring[i][0];
    const lat = ring[i][1];
    // 南極の極端な低緯度は省略範囲に合わせて丸める
    if (lat < -65 && ring.length > 20) {
      // keep ring continuous at bottom boundary
    }
    let candidate = normalizeLngForCenter(rawLng, centerMode);
    if (candidate - prevUnwrappedLng > 180) candidate -= 360;
    if (candidate - prevUnwrappedLng < -180) candidate += 360;
    prevUnwrappedLng = candidate;

    const [px, py] = projectPoint(candidate, lat, centerMode, true);
    if (
      lastPx &&
      i < ring.length - 1 &&
      Math.abs(px - lastPx[0]) < 1.1 &&
      Math.abs(py - lastPx[1]) < 1.1
    ) {
      continue;
    }
    pts.push([px, py]);
    lastPx = [px, py];
  }

  if (pts.length < 3) return '';

  // 万一投影座標が画面幅の42%以上ジャンプする線分があれば M で切ってアーティファクトを防ぐ
  const cmds: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i === 0) {
      cmds.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      const [px] = pts[i - 1];
      if (Math.abs(x - px) > SVG_W * 0.42) {
        cmds.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
      } else {
        cmds.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
      }
    }
  }
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  if (Math.abs(firstPt[0] - lastPt[0]) < SVG_W * 0.42) {
    cmds.push('Z');
  }
  return cmds.join('');
}

function buildWorldBasemapPath(
  geojson: FeatureCollection<Geometry, GeoCountryProperties>,
  centerMode: 'atlantic' | 'pacific',
): string {
  const parts: string[] = [];
  for (const feat of geojson.features) {
    if (feat.properties?.iso3 === 'ATA') continue;
    const geom = feat.geometry;
    if (!geom) continue;
    if (geom.type === 'Polygon') {
      const d = ringToSvgSubpath(geom.coordinates[0] ?? [], centerMode);
      if (d) parts.push(d);
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        const d = ringToSvgSubpath(poly[0] ?? [], centerMode);
        if (d) parts.push(d);
      }
    }
  }
  return parts.join(' ');
}

interface ComputedArcGeom {
  arc: WorldFlowArc;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  ex: number;
  ey: number;
  mx: number;
  my: number;
  strokeWidth: number;
  arrowPoints: string;
  color: string;
}

function computeArcGeometry(
  arc: WorldFlowArc,
  idx: number,
  maxVal: number,
  centerMode: 'atlantic' | 'pacific',
): ComputedArcGeom {
  const [sxRaw, sy] = projectPoint(arc.fromCoords[0], arc.fromCoords[1], centerMode);
  let [exRaw, ey] = projectPoint(arc.toCoords[0], arc.toCoords[1], centerMode);

  // 太平洋/大西洋いずれか短い経路・または投影幅内の自然な経路を選択
  if (exRaw - sxRaw > SVG_W * 0.68) exRaw -= SVG_W;
  else if (sxRaw - exRaw > SVG_W * 0.68) exRaw += SVG_W;

  const dx = exRaw - sxRaw;
  const dy = ey - sy;
  const dist = Math.max(24, Math.hypot(dx, dy));

  const ratio = Math.max(0.05, arc.value / Math.max(maxVal, 1));
  const strokeWidth = 2.4 + Math.pow(ratio, 0.72) * 10.0;

  // 曲率（見やすく上向き〜法線方向へ膨らませる）
  const nx = -dy / dist;
  const ny = dx / dist;
  const sign = ny <= 0 ? 1 : -1;
  const bend = Math.min(82, dist * 0.22) * sign * (idx % 2 === 0 ? 1 : 0.78);
  const cx = (sxRaw + exRaw) / 2 + nx * bend;
  const cy = Math.max(18, Math.min(SVG_H - 18, (sy + ey) / 2 + ny * bend));

  // 終端方向 (cx,cy -> exRaw,ey) に沿って矢じりを少し手前に配置し線がはみ出さないようにする
  const tx = exRaw - cx;
  const ty = ey - cy;
  const tLen = Math.max(1, Math.hypot(tx, ty));
  const ux = tx / tLen;
  const uy = ty / tLen;
  const px = -uy;
  const py = ux;

  const headLen = Math.max(9, strokeWidth * 1.45);
  const headHalfW = Math.max(5.2, strokeWidth * 0.92);
  const lineEndX = exRaw - ux * (headLen * 0.65);
  const lineEndY = ey - uy * (headLen * 0.65);

  const tipX = exRaw;
  const tipY = ey;
  const baseLx = exRaw - ux * headLen + px * headHalfW;
  const baseLy = ey - uy * headLen + py * headHalfW;
  const baseRx = exRaw - ux * headLen - px * headHalfW;
  const baseRy = ey - uy * headLen - py * headHalfW;

  // 2次ベジェ曲線の中点 t=0.5
  const mx = 0.25 * sxRaw + 0.5 * cx + 0.25 * lineEndX;
  const my = 0.25 * sy + 0.5 * cy + 0.25 * lineEndY;

  return {
    arc,
    sx: sxRaw,
    sy,
    cx,
    cy,
    ex: lineEndX,
    ey: lineEndY,
    mx,
    my,
    strokeWidth,
    arrowPoints: `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLx.toFixed(1)},${baseLy.toFixed(1)} ${baseRx.toFixed(1)},${baseRy.toFixed(1)}`,
    color: arc.color ?? '#2563eb',
  };
}

/**
 * 世界の国際移動・貿易フローを「世界白地図＋太さ可変の曲線矢印」で直感的に表示するコンポーネント
 */
export function WorldFlowMapCard({
  flowMap,
  countriesGeoJson,
  onSelectCountry,
  onHighlightCountries,
}: WorldFlowMapCardProps) {
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);

  const basemapPath = useMemo(
    () => buildWorldBasemapPath(countriesGeoJson, flowMap.centerMode),
    [countriesGeoJson, flowMap.centerMode],
  );

  const arcGeoms = useMemo(() => {
    const maxVal = Math.max(...flowMap.arcs.map((a) => a.value), 1);
    return flowMap.arcs.map((arc, idx) =>
      computeArcGeometry(arc, idx, maxVal, flowMap.centerMode),
    );
  }, [flowMap]);

  const equatorY = projectPoint(0, 0, flowMap.centerMode)[1];
  const activeArc =
    flowMap.arcs.find((a) => a.id === selectedArcId) ?? flowMap.arcs[0] ?? null;

  const allIso3s = useMemo(() => {
    const s = new Set<string>();
    for (const a of flowMap.arcs) {
      if (a.fromIso3) s.add(a.fromIso3);
      if (a.toIso3) s.add(a.toIso3);
    }
    return Array.from(s);
  }, [flowMap]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800">
              流線図（太さ＝移動量）
            </span>
            <span className="text-[10.5px] text-slate-500">
              {flowMap.source}（{flowMap.dataYear}） / 単位：{flowMap.unit}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-extrabold text-slate-900 md:text-base">
            {flowMap.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">{flowMap.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => onHighlightCountries(flowMap.title, allIso3s)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
        >
          <MapPin className="h-3.5 w-3.5" />
          発着国を地図でハイライト
        </button>
      </div>

      {/* SVG 世界地図 ＋ 太さ可変曲線矢印 */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-sky-50/70">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block w-full select-none">
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#e0f2fe" />
          {/* 赤道ライン */}
          <line
            x1="0"
            y1={equatorY}
            x2={SVG_W}
            y2={equatorY}
            stroke="#94a3b8"
            strokeWidth="0.9"
            strokeDasharray="4 4"
            opacity="0.7"
          />
          <text x="8" y={equatorY - 4} fontSize="9.5" fontWeight="bold" fill="#64748b">
            赤道 0°
          </text>

          {/* 世界陸地白地図 */}
          <path
            d={basemapPath}
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="0.7"
            fillRule="evenodd"
          />

          {/* 曲線矢印群 */}
          {arcGeoms.map((g) => {
            const isSel = activeArc?.id === g.arc.id;
            const d = `M${g.sx.toFixed(1)},${g.sy.toFixed(1)} Q${g.cx.toFixed(1)},${g.cy.toFixed(1)} ${g.ex.toFixed(1)},${g.ey.toFixed(1)}`;
            return (
              <g
                key={g.arc.id}
                onClick={() => setSelectedArcId(g.arc.id)}
                className="cursor-pointer"
                opacity={selectedArcId && !isSel ? 0.45 : 0.94}
              >
                {/* 白フチ */}
                <path
                  d={d}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={g.strokeWidth + 2.4}
                  strokeLinecap="round"
                />
                {/* メイン矢印線 */}
                <path
                  d={d}
                  fill="none"
                  stroke={g.color}
                  strokeWidth={isSel ? g.strokeWidth + 1.2 : g.strokeWidth}
                  strokeLinecap="round"
                />
                {/* 矢じり */}
                <polygon
                  points={g.arrowPoints}
                  fill={g.color}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                {/* 出発点丸 */}
                <circle
                  cx={g.sx}
                  cy={g.sy}
                  r={Math.max(3.2, g.strokeWidth * 0.48)}
                  fill="#ffffff"
                  stroke={g.color}
                  strokeWidth="2"
                />
                {/* 数量ピル */}
                <g transform={`translate(${g.mx.toFixed(1)}, ${g.my.toFixed(1)})`}>
                  <rect
                    x="-28"
                    y="-9"
                    width="56"
                    height="17"
                    rx="8"
                    fill="#ffffff"
                    fillOpacity="0.93"
                    stroke={g.color}
                    strokeWidth={isSel ? 1.6 : 1}
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#0f172a"
                  >
                    {g.arc.displayValue}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 選択中ルート解説 + 一覧ボタン */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {flowMap.arcs.map((arc) => {
          const isSel = activeArc?.id === arc.id;
          return (
            <div
              key={arc.id}
              onClick={() => setSelectedArcId(arc.id)}
              className={`cursor-pointer rounded-xl border p-2.5 transition ${
                isSel
                  ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1 text-xs font-extrabold text-slate-900">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: arc.color ?? '#2563eb' }}
                  />
                  <span className="truncate">{arc.fromName}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{arc.toName}</span>
                </div>
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-indigo-700 shadow-2xs">
                  {arc.displayValue}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{arc.note}</p>
              {(arc.fromIso3 || arc.toIso3) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {arc.fromIso3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(arc.fromIso3!);
                      }}
                      className="inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Globe2 className="h-2.5 w-2.5" />
                      {arc.fromName}詳細
                    </button>
                  )}
                  {arc.toIso3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(arc.toIso3!);
                      }}
                      className="inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Globe2 className="h-2.5 w-2.5" />
                      {arc.toName}詳細
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-extrabold">共テ鉄則：</span>
          {flowMap.examPoint}
        </div>
      </div>
    </section>
  );
}
