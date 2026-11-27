import type { AgePyramidBin } from '../../types/schema_v1';

interface EqualScalePyramidSvgProps {
  bins: AgePyramidBin[];
  fixedMaxPct?: number;
  title?: string;
}

/**
 * 複数国並列比較・演習問題用に共通横軸スケール（fixedMaxPct）で描画できる軽量SVG人口ピラミッド
 */
export function EqualScalePyramidSvg({
  bins,
  fixedMaxPct,
  title,
}: EqualScalePyramidSvgProps) {
  if (bins.length === 0) return null;
  const maxPct =
    fixedMaxPct ??
    Math.max(
      8,
      ...bins.flatMap((b) => [b.malePct, b.femalePct]),
    );
  const rows = [...bins].reverse();
  const rowH = 14;
  const H = rows.length * rowH + 22;
  const W = 280;
  const centerX = W / 2;
  const halfPlot = 104;

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-3">
      {title && (
        <div className="mb-1 text-center text-[11px] font-extrabold text-slate-800">{title}</div>
      )}
      <div className="mb-1 flex items-center justify-between text-[10.5px] font-bold text-slate-600">
        <span className="text-sky-700">← 男性 (%)</span>
        <span className="text-slate-400">年齢階級（基準±{maxPct.toFixed(0)}%）</span>
        <span className="text-rose-700">女性 (%) →</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
        <line x1={centerX} y1={0} x2={centerX} y2={H - 16} stroke="#94a3b8" strokeWidth={1} />
        {rows.map((b, idx) => {
          const y = idx * rowH;
          const mW = (b.malePct / maxPct) * halfPlot;
          const fW = (b.femalePct / maxPct) * halfPlot;
          return (
            <g key={b.ageGroup}>
              <rect
                x={centerX - mW}
                y={y + 1}
                width={Math.max(0.5, mW)}
                height={rowH - 2}
                fill="#0284c7"
                rx={1}
              />
              <rect
                x={centerX}
                y={y + 1}
                width={Math.max(0.5, fW)}
                height={rowH - 2}
                fill="#e11d48"
                rx={1}
              />
              {idx % 2 === 0 && (
                <text
                  x={centerX}
                  y={y + rowH - 3}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#0f172a"
                  fontWeight="bold"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  paintOrder="stroke"
                >
                  {b.ageGroup}
                </text>
              )}
            </g>
          );
        })}
        <text x={centerX - halfPlot} y={H - 4} textAnchor="start" fontSize="8" fill="#64748b">
          {maxPct.toFixed(0)}%
        </text>
        <text x={centerX} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b">
          0%
        </text>
        <text x={centerX + halfPlot} y={H - 4} textAnchor="end" fontSize="8" fill="#64748b">
          {maxPct.toFixed(0)}%
        </text>
      </svg>
    </div>
  );
}
