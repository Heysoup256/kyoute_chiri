import { useState } from 'react';
import type { CountryData, SectorShare } from '../../types/schema_v1';

interface IndustryTernaryChartProps {
  countryName: string;
  sectorShare: SectorShare;
  allCountries?: Record<string, CountryData>;
  currentIso3?: string;
}

const REFERENCE_ISOS = ['JPN', 'USA', 'DEU', 'CHN', 'IND', 'BRA', 'NGA', 'ETH'] as const;

// ユーザー指定：左上の辺＝第1次産業（左下0%→上100%）、右上の辺＝第2次産業（上0%→右下100%）、下の辺＝第3次産業（右下0%→左下100%）
// 頂点対応：上＝第1次 100%、右下＝第2次 100%、左下＝第3次 100%
const TOP = { x: 190, y: 36 };
const LEFT = { x: 64, y: 254 };
const RIGHT = { x: 316, y: 254 };

function ternaryToXY(p1: number, p2: number, p3: number): { x: number; y: number } {
  const sum = p1 + p2 + p3 || 100;
  const a = p1 / sum; // 第1次 -> 上頂点(100%)、底辺から左下-上辺に沿って読み上げ
  const b = p2 / sum; // 第2次 -> 右下頂点(100%)、右上辺に沿って上→右下へ読み上げ
  const c = p3 / sum; // 第3次 -> 左下頂点(100%)、下辺に沿って右→左へ読み上げ
  return {
    x: a * TOP.x + b * RIGHT.x + c * LEFT.x,
    y: a * TOP.y + b * RIGHT.y + c * LEFT.y,
  };
}

/**
 * 第1次（左上辺）・第2次（右上辺）・第3次（下辺）産業別就業人口構成を示す三角図表
 */
export function IndustryTernaryChart({
  countryName,
  sectorShare,
  allCountries,
  currentIso3,
}: IndustryTernaryChartProps) {
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const curPt = ternaryToXY(
    sectorShare.primaryPct,
    sectorShare.secondaryPct,
    sectorShare.tertiaryPct,
  );

  const refs = REFERENCE_ISOS.filter((iso) => iso !== currentIso3)
    .map((iso) => {
      const c = allCountries?.[iso];
      if (!c?.stats?.sectorShare) return null;
      const sh = c.stats.sectorShare;
      return {
        iso,
        name: c.nameJa.split('（')[0],
        sh,
        pt: ternaryToXY(sh.primaryPct, sh.secondaryPct, sh.tertiaryPct),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const gridLevels = [20, 40, 60, 80];
  const activeRef = refs.find((r) => r.iso === hoverIso);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-extrabold text-slate-900">
            産業別就業人口の三角図表
          </h4>
          <p className="text-[10.5px] text-slate-500">
            左上の辺：第1次（↗）／右上の辺：第2次（↘）／下の辺：第3次（←）
          </p>
        </div>
        <div className="flex gap-1.5 text-[11px] font-bold">
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
            1次 {sectorShare.primaryPct}%
          </span>
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">
            2次 {sectorShare.secondaryPct}%
          </span>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-800">
            3次 {sectorShare.tertiaryPct}%
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-center">
        <svg viewBox="0 0 380 295" className="w-full max-w-[380px] select-none">
          {/* 背景三角形 */}
          <polygon
            points={`${TOP.x},${TOP.y} ${RIGHT.x},${RIGHT.y} ${LEFT.x},${LEFT.y}`}
            fill="#f8fafc"
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* 20%刻みグリッド線と各辺目盛り */}
          {gridLevels.map((lvl) => {
            // 1次 = lvl%（底辺平行線：左辺のlvl位置 <-> 右辺の1次=lvl位置）
            const p1a = ternaryToXY(lvl, 0, 100 - lvl);
            const p1b = ternaryToXY(lvl, 100 - lvl, 0);
            // 2次 = lvl%（左辺平行線：右辺のlvl位置 <-> 下辺の2次=lvl位置）
            const p2a = ternaryToXY(100 - lvl, lvl, 0);
            const p2b = ternaryToXY(0, lvl, 100 - lvl);
            // 3次 = lvl%（右辺平行線：下辺のlvl位置 <-> 左辺の3次=lvl位置）
            const p3a = ternaryToXY(0, 100 - lvl, lvl);
            const p3b = ternaryToXY(100 - lvl, 0, lvl);

            return (
              <g key={lvl}>
                <line
                  x1={p1a.x}
                  y1={p1a.y}
                  x2={p1b.x}
                  y2={p1b.y}
                  stroke="#a7f3d0"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                />
                <line
                  x1={p2a.x}
                  y1={p2a.y}
                  x2={p2b.x}
                  y2={p2b.y}
                  stroke="#fde68a"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                />
                <line
                  x1={p3a.x}
                  y1={p3a.y}
                  x2={p3b.x}
                  y2={p3b.y}
                  stroke="#c7d2fe"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                />

                {/* 左上辺目盛り (第1次：下→上 20..80) */}
                <text
                  x={p1a.x - 7}
                  y={p1a.y + 3}
                  textAnchor="end"
                  className="fill-emerald-700 text-[8.5px] font-semibold"
                >
                  {lvl}
                </text>
                {/* 右上辺目盛り (第2次：上→右下 20..80) */}
                <text
                  x={p2a.x + 7}
                  y={p2a.y + 3}
                  textAnchor="start"
                  className="fill-amber-700 text-[8.5px] font-semibold"
                >
                  {lvl}
                </text>
                {/* 下辺目盛り (第3次：右→左 20..80) */}
                <text
                  x={p3a.x}
                  y={p3a.y + 12}
                  textAnchor="middle"
                  className="fill-indigo-700 text-[8.5px] font-semibold"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* 3辺に沿った軸タイトル（共通テスト標準配置） */}
          <g transform="translate(86, 134) rotate(-60)">
            <text
              x={0}
              y={0}
              textAnchor="middle"
              className="fill-emerald-700 text-[10px] font-extrabold"
            >
              第1次産業 (%) ──▶
            </text>
          </g>
          <g transform="translate(294, 134) rotate(60)">
            <text
              x={0}
              y={0}
              textAnchor="middle"
              className="fill-amber-700 text-[10px] font-extrabold"
            >
              第2次産業 (%) ──▶
            </text>
          </g>
          <text
            x={190}
            y={284}
            textAnchor="middle"
            className="fill-indigo-700 text-[10px] font-extrabold"
          >
            ◀── 第3次産業 (%)
          </text>

          {/* 頂点補助表記 (100%) */}
          <text x={TOP.x} y={24} textAnchor="middle" className="fill-emerald-800 text-[9px] font-bold">
            1次 100%
          </text>
          <text x={RIGHT.x + 4} y={RIGHT.y + 12} textAnchor="middle" className="fill-amber-800 text-[9px] font-bold">
            2次 100%
          </text>
          <text x={LEFT.x - 4} y={LEFT.y + 12} textAnchor="middle" className="fill-indigo-800 text-[9px] font-bold">
            3次 100%
          </text>

          {/* 比較参考国プロット */}
          {refs.map((r) => {
            const distToCurrent = Math.hypot(r.pt.x - curPt.x, r.pt.y - curPt.y);
            const showLabel = distToCurrent >= 22;
            return (
              <g
                key={r.iso}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIso(r.iso)}
                onMouseLeave={() => setHoverIso(null)}
              >
                <circle
                  cx={r.pt.x}
                  cy={r.pt.y}
                  r={hoverIso === r.iso ? 5 : 3.5}
                  fill="#94a3b8"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                {showLabel && (
                  <text
                    x={r.pt.x + 5}
                    y={r.pt.y + 3}
                    className="fill-slate-500 text-[8.5px] font-medium"
                  >
                    {r.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* 選択国の強調ポイント */}
          <circle
            cx={curPt.x}
            cy={curPt.y}
            r={7}
            fill="#dc2626"
            fillOpacity={0.22}
          />
          <circle
            cx={curPt.x}
            cy={curPt.y}
            r={4.5}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={curPt.x}
            y={curPt.y - 9}
            textAnchor="middle"
            className="fill-red-700 text-[10px] font-extrabold"
          >
            {countryName}
          </text>
        </svg>
      </div>

      {activeRef && (
        <div className="mt-1 rounded bg-slate-100 px-2.5 py-1 text-center text-[11px] text-slate-700">
          比較：{activeRef.name}（1次 {activeRef.sh.primaryPct}% / 2次 {activeRef.sh.secondaryPct}% / 3次 {activeRef.sh.tertiaryPct}%）
        </div>
      )}
    </div>
  );
}
