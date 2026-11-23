import type { ClimateCity } from '../../types/schema_v1';

interface ClimateMiniChartProps {
  city: ClimateCity;
  chartType: 'climograph' | 'hythergraph';
  tempRange: [number, number];
  precipMax: number;
}

const MONTH_COLORS = [
  '#2563eb', '#3b82f6', '#06b6d4', '#10b981',
  '#84cc16', '#eab308', '#ef4444', '#f97316',
  '#ec4899', '#a855f7', '#6366f1', '#1d4ed8',
];

/**
 * 4択クイズ用に全選択肢で共通スケール（tempRange, precipMax）で描画する軽量SVGチャート。
 * 都市名・気候区分名は回答前ネタバレ防止のため描画しない。
 */
export function ClimateMiniChart({
  city,
  chartType,
  tempRange,
  precipMax,
}: ClimateMiniChartProps) {
  const temps = city.monthlyTempC;
  const precips = city.monthlyPrecipMm;
  const avgTemp = (temps.reduce((a, b) => a + b, 0) / Math.max(1, temps.length)).toFixed(1);
  const totalPrecip = Math.round(precips.reduce((a, b) => a + b, 0));

  const [tMin, tMax] = tempRange;
  const tSpan = Math.max(10, tMax - tMin);
  const pMax = Math.max(100, precipMax);

  const W = 280;
  const H = 175;

  if (chartType === 'climograph') {
    const padL = 30;
    const padR = 32;
    const padT = 22;
    const padB = 20;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const barSlot = plotW / 12;
    const barW = Math.max(6, barSlot * 0.62);

    const yForT = (t: number) => padT + ((tMax - t) / tSpan) * plotH;
    const yForP = (p: number) => padT + plotH - (Math.min(pMax, Math.max(0, p)) / pMax) * plotH;

    const linePts = temps
      .map((t, i) => `${(padL + (i + 0.5) * barSlot).toFixed(1)},${yForT(t).toFixed(1)}`)
      .join(' ');

    const tTicks = [tMin, Math.round((tMin + tMax) / 2), tMax];
    if (!tTicks.includes(0) && tMin < 0 && tMax > 0) tTicks.push(0);
    const pTicks = [0, Math.round(pMax / 2), pMax];

    return (
      <div className="w-full">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-600">
          <span>年平均 {avgTemp}℃</span>
          <span>年降水 {totalPrecip.toLocaleString()}mm</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none overflow-visible">
          {tTicks.map((t) => {
            const y = yForT(t);
            return (
              <g key={`t-${t}`}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke={t === 0 ? '#dc2626' : '#e2e8f0'}
                  strokeWidth={t === 0 ? 1 : 0.7}
                  strokeDasharray={t === 0 ? '3 2' : '2 2'}
                  opacity={t === 0 ? 0.55 : 0.9}
                />
                <text x={padL - 3} y={y + 3} textAnchor="end" fontSize="8.5" fill="#dc2626">
                  {t}°
                </text>
              </g>
            );
          })}

          {pTicks.map((p) => {
            const y = yForP(p);
            return (
              <text key={`p-${p}`} x={W - padR + 3} y={y + 3} textAnchor="start" fontSize="8.5" fill="#2563eb">
                {p}
              </text>
            );
          })}

          {/* 降水量棒 */}
          {precips.map((p, i) => {
            const yTop = yForP(p);
            const hBar = Math.max(0.5, padT + plotH - yTop);
            const x = padL + i * barSlot + (barSlot - barW) / 2;
            return (
              <rect
                key={`b-${i}`}
                x={x}
                y={yTop}
                width={barW}
                height={hBar}
                rx={1.5}
                fill="#3b82f6"
                opacity={0.76}
              />
            );
          })}

          {/* 気温折れ線 */}
          <polyline fill="none" stroke="#dc2626" strokeWidth={2} points={linePts} />
          {temps.map((t, i) => (
            <circle
              key={`c-${i}`}
              cx={padL + (i + 0.5) * barSlot}
              cy={yForT(t)}
              r={2.2}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={0.7}
            />
          ))}

          {/* X軸月ラベル */}
          {Array.from({ length: 12 }, (_, i) => (
            <text
              key={`m-${i}`}
              x={padL + (i + 0.5) * barSlot}
              y={H - 5}
              textAnchor="middle"
              fontSize="8.5"
              fill={i === 0 || i === 6 ? '#0f172a' : '#64748b'}
              fontWeight={i === 0 || i === 6 ? '700' : '400'}
            >
              {i + 1}
            </text>
          ))}
        </svg>
      </div>
    );
  }

  // ハイサーグラフ (横軸=降水量 mm, 縦軸=気温 ℃)
  const padL = 30;
  const padR = 12;
  const padT = 16;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xForP = (p: number) => padL + (Math.min(pMax, Math.max(0, p)) / pMax) * plotW;
  const yForT = (t: number) => padT + ((tMax - t) / tSpan) * plotH;

  const loopPts = [...temps.map((t, i) => [xForP(precips[i]), yForT(t)]), [xForP(precips[0]), yForT(temps[0])]]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  const tTicks = [tMin, Math.round((tMin + tMax) / 2), tMax];
  if (!tTicks.includes(0) && tMin < 0 && tMax > 0) tTicks.push(0);
  const pTicks = [0, Math.round(pMax / 2), pMax];

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-600">
        <span>年平均 {avgTemp}℃</span>
        <span>年降水 {totalPrecip.toLocaleString()}mm</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none overflow-visible">
        {tTicks.map((t) => {
          const y = yForT(t);
          return (
            <g key={`ht-${t}`}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke={t === 0 ? '#dc2626' : '#e2e8f0'}
                strokeWidth={t === 0 ? 1 : 0.7}
                strokeDasharray={t === 0 ? '3 2' : '2 2'}
              />
              <text x={padL - 3} y={y + 3} textAnchor="end" fontSize="8.5" fill="#dc2626">
                {t}°
              </text>
            </g>
          );
        })}

        {pTicks.map((p) => {
          const x = xForP(p);
          return (
            <g key={`hp-${p}`}>
              <line x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="#e2e8f0" strokeWidth={0.7} strokeDasharray="2 2" />
              <text x={x} y={H - 5} textAnchor="middle" fontSize="8.5" fill="#2563eb">
                {p}mm
              </text>
            </g>
          );
        })}

        <polyline fill="rgba(99,102,241,0.08)" stroke="#475569" strokeWidth={1.6} points={loopPts} />

        {temps.map((t, i) => {
          const cx = xForP(precips[i]);
          const cy = yForT(t);
          const keyMonth = i === 0 || i === 3 || i === 6 || i === 9;
          return (
            <g key={`hp-pt-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={keyMonth ? 3.4 : 2.1}
                fill={MONTH_COLORS[i]}
                stroke="#ffffff"
                strokeWidth={0.7}
              />
              {keyMonth && (
                <text
                  x={cx + (cx > W - padR - 22 ? -6 : 5)}
                  y={cy + (cy < padT + 14 ? 9 : -4)}
                  textAnchor={cx > W - padR - 22 ? 'end' : 'start'}
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {i + 1}月
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
