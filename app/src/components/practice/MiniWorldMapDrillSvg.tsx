import type { FeatureCollection, Geometry } from 'geojson';
import { useId, useMemo } from 'react';
import type { GeoCountryProperties } from '../../types/schema_v1';

export interface MapDrillMarker {
  label: string;
  lng: number;
  lat: number;
  color: string;
}

export interface MapDrillZone {
  label: string;
  color: string;
  lng: number;
  lat: number;
  polygon?: [number, number][];
}

export interface MapDrillBoundaryLine {
  label?: string;
  color: string;
  coordinates: [number, number][];
}

export interface MapDrillLegendItem {
  color: string;
  label: string;
}

export interface MapDrillSpec {
  mode: 'choropleth' | 'point_markers' | 'subnational';
  title?: string;
  centerMode?: 'atlantic' | 'pacific';
  targetIso3?: string;
  /** choropleth: iso3 -> hex fill color */
  fillByIso3?: Record<string, string>;
  /** 対象国ハイライト枠（必要時） */
  highlightIso3s?: string[];
  legend?: MapDrillLegendItem[];
  /** point_markers: 世界または地域上の地点ア〜エ */
  markers?: MapDrillMarker[];
  /** subnational: 国内地域区分ポリゴン・境界線 */
  zones?: MapDrillZone[];
  boundaryLines?: MapDrillBoundaryLine[];
  showEquatorAndTropics?: boolean;
}

const WORLD_W = 800;
const WORLD_H = 380;
const LAT_MAX = 80;
const LAT_MIN = -56;

function normalizeLng(lng: number, centerMode: 'atlantic' | 'pacific'): number {
  if (centerMode === 'pacific') {
    let x = lng;
    while (x < -30) x += 360;
    while (x >= 330) x -= 360;
    return x;
  }
  let x = lng;
  while (x < -180) x += 360;
  while (x >= 180) x -= 360;
  return x;
}

function projectWorld(
  lng: number,
  lat: number,
  centerMode: 'atlantic' | 'pacific',
  alreadyNormalized = false,
): [number, number] {
  const minLng = centerMode === 'pacific' ? -30 : -180;
  const nLng = alreadyNormalized ? lng : normalizeLng(lng, centerMode);
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const x = ((nLng - minLng) / 360) * WORLD_W;
  const y = ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * WORLD_H;
  return [x, y];
}

function ringToWorldPath(ring: number[][], centerMode: 'atlantic' | 'pacific'): string {
  if (ring.length < 3) return '';
  const firstNorm = normalizeLng(ring[0][0], centerMode);
  const pts: [number, number][] = [];
  let prevLng = firstNorm;
  let lastPx: [number, number] | null = null;

  for (let i = 0; i < ring.length; i++) {
    let cand = normalizeLng(ring[i][0], centerMode);
    if (cand - prevLng > 180) cand -= 360;
    if (cand - prevLng < -180) cand += 360;
    prevLng = cand;
    const [px, py] = projectWorld(cand, ring[i][1], centerMode, true);
    if (
      lastPx &&
      i < ring.length - 1 &&
      Math.abs(px - lastPx[0]) < 1.2 &&
      Math.abs(py - lastPx[1]) < 1.2
    ) {
      continue;
    }
    pts.push([px, py]);
    lastPx = [px, py];
  }
  if (pts.length < 3) return '';

  const cmds: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i === 0) {
      cmds.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    } else if (Math.abs(x - pts[i - 1][0]) > WORLD_W * 0.42) {
      cmds.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      cmds.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }
  if (Math.abs(pts[0][0] - pts[pts.length - 1][0]) < WORLD_W * 0.42) {
    cmds.push('Z');
  }
  return cmds.join('');
}

function geomToWorldPath(geom: Geometry, centerMode: 'atlantic' | 'pacific'): string {
  const parts: string[] = [];
  if (geom.type === 'Polygon') {
    const d = ringToWorldPath(geom.coordinates[0] ?? [], centerMode);
    if (d) parts.push(d);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      const d = ringToWorldPath(poly[0] ?? [], centerMode);
      if (d) parts.push(d);
    }
  }
  return parts.join(' ');
}

function unwrapRingAroundCenter(ring: number[][], centerLng: number): [number, number][] {
  const pts: [number, number][] = [];
  let prev = centerLng;
  for (const coord of ring) {
    let x = coord[0];
    while (x - prev > 180) x -= 360;
    while (x - prev < -180) x += 360;
    prev = x;
    pts.push([x, coord[1]]);
  }
  return pts;
}

interface MiniWorldMapDrillSvgProps {
  spec: MapDrillSpec;
  countriesGeoJson?: FeatureCollection<Geometry, GeoCountryProperties> | null;
  compact?: boolean;
  hideLegend?: boolean;
}

/**
 * 共通テスト実戦問題・無限演習用の軽量 SVG 地図レンダラー。
 * 1) choropleth: 世界の階級区分図（単色濃淡・低位〜高位、並列比較対応）
 * 2) point_markers: 世界の各地点（A〜C / ア〜エ）と緯線（赤道・回帰線）
 * 3) subnational: 世界主要カ国の国内地域区分ポリゴン・境界線のズーム表示
 */
export function MiniWorldMapDrillSvg({
  spec,
  countriesGeoJson,
  compact = false,
  hideLegend = false,
}: MiniWorldMapDrillSvgProps) {
  const reactClipId = useId();
  const centerMode = spec.centerMode ?? 'pacific';

  // --- subnational ズーム計算 ---
  const subnationalRender = useMemo(() => {
    if (spec.mode !== 'subnational') return null;
    const zones = spec.zones ?? [];
    const lines = spec.boundaryLines ?? [];

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    // 外れ点除去のため、ゾーン重心の中央近辺基準でアンラップ
    const refLng = zones[0]?.lng ?? 0;

    for (const z of zones) {
      const pts = z.polygon && z.polygon.length > 0 ? z.polygon : [[z.lng, z.lat]];
      for (const p of pts) {
        let x = p[0];
        while (x - refLng > 180) x -= 360;
        while (x - refLng < -180) x += 360;
        minLng = Math.min(minLng, x);
        maxLng = Math.max(maxLng, x);
        minLat = Math.min(minLat, p[1]);
        maxLat = Math.max(maxLat, p[1]);
      }
    }
    for (const ln of lines) {
      for (const p of ln.coordinates) {
        let x = p[0];
        while (x - refLng > 180) x -= 360;
        while (x - refLng < -180) x += 360;
        minLng = Math.min(minLng, x);
        maxLng = Math.max(maxLng, x);
        minLat = Math.min(minLat, p[1]);
        maxLat = Math.max(maxLat, p[1]);
      }
    }

    if (!Number.isFinite(minLng)) {
      return null;
    }

    const spanLng = Math.max(6, maxLng - minLng);
    const spanLat = Math.max(4, maxLat - minLat);
    const padLng = spanLng * 0.18;
    const padLat = spanLat * 0.18;
    const bMinLng = minLng - padLng;
    const bMaxLng = maxLng + padLng;
    const bMinLat = Math.max(-75, minLat - padLat);
    const bMaxLat = Math.min(82, maxLat + padLat);
    const centerLng = (bMinLng + bMaxLng) / 2;
    const centerLat = (bMinLat + bMaxLat) / 2;
    const cosLat = Math.max(0.35, Math.cos((centerLat * Math.PI) / 180));

    const W = 620;
    const H = 340;
    const boxPad = 14;
    const drawW = W - boxPad * 2;
    const drawH = H - boxPad * 2;

    const geoW = (bMaxLng - bMinLng) * cosLat;
    const geoH = bMaxLat - bMinLat;
    const scale = Math.min(drawW / geoW, drawH / geoH);
    const offsetX = boxPad + (drawW - geoW * scale) / 2;
    const offsetY = boxPad + (drawH - geoH * scale) / 2;

    const proj = (lng: number, lat: number): [number, number] => {
      let x = lng;
      while (x - centerLng > 180) x -= 360;
      while (x - centerLng < -180) x += 360;
      return [
        offsetX + (x - bMinLng) * cosLat * scale,
        offsetY + (bMaxLat - lat) * scale,
      ];
    };

    const targetCountryPaths: string[] = [];
    const contextCountryPaths: string[] = [];

    if (countriesGeoJson) {
      for (const feat of countriesGeoJson.features) {
        if (feat.properties?.iso3 === 'ATA') continue;
        const isTarget = feat.properties?.iso3 === spec.targetIso3;
        const geom = feat.geometry;
        if (!geom) continue;
        const rings: number[][][] =
          geom.type === 'Polygon'
            ? [geom.coordinates[0] ?? []]
            : geom.type === 'MultiPolygon'
              ? geom.coordinates.map((p) => p[0] ?? [])
              : [];

        for (const ring of rings) {
          if (ring.length < 3) continue;
          const unwrapped = unwrapRingAroundCenter(ring, centerLng);
          // バウンディングボックス外の飛び地（海外県やアラスカ・チュコトカ等）をスキップしてズーム歪みを防止
          let rMinX = Infinity;
          let rMaxX = -Infinity;
          let rMinY = Infinity;
          let rMaxY = -Infinity;
          for (const [x, y] of unwrapped) {
            if (x < rMinX) rMinX = x;
            if (x > rMaxX) rMaxX = x;
            if (y < rMinY) rMinY = y;
            if (y > rMaxY) rMaxY = y;
          }
          if (
            rMaxX < bMinLng - 4 ||
            rMinX > bMaxLng + 4 ||
            rMaxY < bMinLat - 4 ||
            rMinY > bMaxLat + 4
          ) {
            continue;
          }
          const cmds = unwrapped
            .map(([x, y], idx) => {
              const [sx, sy] = proj(x, y);
              return `${idx === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
            })
            .join('');
          if (cmds) {
            if (isTarget) {
              targetCountryPaths.push(`${cmds}Z`);
            } else {
              contextCountryPaths.push(`${cmds}Z`);
            }
          }
        }
      }
    }

    const zoneShapes = zones.map((z) => {
      const [cx, cy] = proj(z.lng, z.lat);
      const polyPath =
        z.polygon && z.polygon.length >= 3
          ? z.polygon
              .map(([lng, lat], idx) => {
                const [sx, sy] = proj(lng, lat);
                return `${idx === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
              })
              .join('') + 'Z'
          : '';
      return { ...z, cx, cy, polyPath };
    });

    const lineShapes = lines.map((ln) => {
      const d = ln.coordinates
        .map(([lng, lat], idx) => {
          const [sx, sy] = proj(lng, lat);
          return `${idx === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
        })
        .join('');
      return { ...ln, d };
    });

    return {
      W,
      H,
      targetCountryPaths,
      contextCountryPaths,
      zoneShapes,
      lineShapes,
    };
  }, [spec, countriesGeoJson]);

  // --- world choropleth / point_markers 計算 ---
  const worldFeatures = useMemo(() => {
    if (spec.mode === 'subnational' || !countriesGeoJson) return [];
    const fillMap = spec.fillByIso3 ?? {};
    const hlSet = new Set(spec.highlightIso3s ?? []);
    return countriesGeoJson.features
      .filter((f) => f.properties?.iso3 && f.properties.iso3 !== 'ATA' && f.geometry)
      .map((f) => {
        const iso3 = f.properties.iso3;
        const d = geomToWorldPath(f.geometry, centerMode);
        return {
          iso3,
          d,
          fill: fillMap[iso3] ?? '#e2e8f0',
          isHighlight: hlSet.has(iso3),
        };
      })
      .filter((item) => item.d.length > 0);
  }, [spec.mode, spec.fillByIso3, spec.highlightIso3s, countriesGeoJson, centerMode]);

  if (spec.mode === 'subnational' && subnationalRender) {
    const clipId = `subnat-clip-${reactClipId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    return (
      <div
        className={
          compact
            ? 'rounded-xl border border-slate-200 bg-sky-50/35 p-2'
            : 'mb-3 rounded-xl border border-slate-200 bg-sky-50/35 p-3'
        }
      >
        {spec.title && (
          <div className="mb-1.5 text-center text-xs font-black text-slate-800">{spec.title}</div>
        )}
        <svg
          viewBox={`0 0 ${subnationalRender.W} ${subnationalRender.H}`}
          className="mx-auto block h-auto w-full max-w-[540px] select-none rounded-lg border border-slate-200 bg-[#eff6ff]"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={subnationalRender.W} height={subnationalRender.H} rx={6} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {/* 周辺国背景 */}
            {subnationalRender.contextCountryPaths.map((d, i) => (
              <path
                key={`ctx-${i}`}
                d={d}
                fill="#e2e8f0"
                stroke="#cbd5e1"
                strokeWidth={0.7}
              />
            ))}
            {/* 対象国ベース */}
            {subnationalRender.targetCountryPaths.map((d, i) => (
              <path
                key={`tgt-${i}`}
                d={d}
                fill="#ffffff"
                stroke="#475569"
                strokeWidth={1.3}
              />
            ))}
            {/* 国内地域区分ポリゴン（ラベル伏せ） */}
            {subnationalRender.zoneShapes.map((z) =>
              z.polyPath ? (
                <path
                  key={`zp-${z.label}`}
                  d={z.polyPath}
                  fill={z.color}
                  fillOpacity={0.34}
                  stroke={z.color}
                  strokeWidth={1.8}
                />
              ) : null,
            )}
            {/* 農業・自然境界線 */}
            {subnationalRender.lineShapes.map((ln, idx) => (
              <path
                key={`bl-${idx}`}
                d={ln.d}
                fill="none"
                stroke={ln.color || '#dc2626'}
                strokeWidth={2.5}
                strokeDasharray="6 4"
              />
            ))}
            {/* 記号バッジ（A・B・C） */}
            {subnationalRender.zoneShapes.map((z) => (
              <g key={`zl-${z.label}`} transform={`translate(${z.cx},${z.cy})`}>
                <circle r={12.5} fill={z.color} stroke="#ffffff" strokeWidth={2} />
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="900"
                  fill="#ffffff"
                >
                  {z.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {!hideLegend && spec.legend && spec.legend.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10.5px] font-bold text-slate-700">
            {spec.legend.map((lg) => (
              <span key={lg.label} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-4 rounded-sm"
                  style={{ backgroundColor: lg.color }}
                />
                {lg.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const eqY = projectWorld(0, 0, centerMode)[1];
  const tropicNY = projectWorld(0, 23.43, centerMode)[1];
  const tropicSY = projectWorld(0, -23.43, centerMode)[1];

  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-slate-200 bg-sky-50/35 p-2'
          : 'mb-3 rounded-xl border border-slate-200 bg-sky-50/35 p-3'
      }
    >
      {spec.title && (
        <div className="mb-1.5 text-center text-xs font-black text-slate-800">{spec.title}</div>
      )}
      <svg
        viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
        className="mx-auto block h-auto w-full max-w-[660px] select-none rounded-lg border border-slate-200 bg-[#eff6ff]"
      >
        {/* 緯線（赤道・回帰線） */}
        {(spec.showEquatorAndTropics ?? true) && (
          <g>
            <line
              x1={0}
              y1={tropicNY}
              x2={WORLD_W}
              y2={tropicNY}
              stroke="#94a3b8"
              strokeWidth={0.7}
              strokeDasharray="4 4"
            />
            <line
              x1={0}
              y1={eqY}
              x2={WORLD_W}
              y2={eqY}
              stroke="#64748b"
              strokeWidth={0.9}
              strokeDasharray="6 3"
            />
            <line
              x1={0}
              y1={tropicSY}
              x2={WORLD_W}
              y2={tropicSY}
              stroke="#94a3b8"
              strokeWidth={0.7}
              strokeDasharray="4 4"
            />
            <text x={8} y={eqY - 3} fontSize="9" fill="#475569" fontWeight="700">
              赤道 0°
            </text>
            <text x={8} y={tropicNY - 3} fontSize="8" fill="#64748b">
              23.4°N
            </text>
            <text x={8} y={tropicSY - 3} fontSize="8" fill="#64748b">
              23.4°S
            </text>
          </g>
        )}

        {/* 国ポリゴン */}
        {worldFeatures.map((feat) => (
          <path
            key={feat.iso3}
            d={feat.d}
            fill={feat.fill}
            stroke={feat.isHighlight ? '#0f172a' : '#ffffff'}
            strokeWidth={feat.isHighlight ? 1.5 : 0.45}
          />
        ))}

        {/* 注目地点マーカー（A〜C / ア〜エ） */}
        {(spec.markers ?? []).map((m) => {
          const [mx, my] = projectWorld(m.lng, m.lat, centerMode);
          return (
            <g key={m.label} transform={`translate(${mx.toFixed(1)},${my.toFixed(1)})`}>
              <circle r={11} fill={m.color} stroke="#ffffff" strokeWidth={2} />
              <text
                y={3.8}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="900"
                fill="#ffffff"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 凡例 */}
      {!hideLegend && spec.legend && spec.legend.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10.5px] font-bold text-slate-700">
          {spec.legend.map((lg) => (
            <span key={lg.label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-4 rounded-sm border border-slate-300"
                style={{ backgroundColor: lg.color }}
              />
              {lg.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
