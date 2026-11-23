import type {
  HighlightBarVisual,
  HighlightDonutVisual,
  HighlightLineVisual,
  HighlightTableVisual,
  HighlightVisual,
} from '../../types/schema_v1';

interface HighlightVisualCardProps {
  visual: HighlightVisual;
}

export function HighlightVisualCard({ visual }: HighlightVisualCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-extrabold text-slate-900">{visual.title}</h4>
        {visual.subtitle && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {visual.subtitle}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        {visual.kind === 'donut' && <DonutBody visual={visual} />}
        {visual.kind === 'line' && <LineBody visual={visual} />}
        {visual.kind === 'bar' && <BarBody visual={visual} />}
        {visual.kind === 'table' && <TableBody visual={visual} />}
      </div>

      {(visual.note || visual.source) && (
        <div className="mt-2.5 space-y-0.5 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-600">
          {visual.note && <p>{visual.note}</p>}
          {visual.source && <p className="text-[10px] text-slate-400">出典: {visual.source}</p>}
        </div>
      )}
    </div>
  );
}

function DonutBody({ visual }: { visual: HighlightDonutVisual }) {
  const total = visual.slices.reduce((acc, s) => acc + Math.max(0, s.value), 0) || 1;
  const r = 34;
  const cx = 44;
  const cy = 44;
  const circum = 2 * Math.PI * r;
  const unit = visual.unit ?? '%';

  const segments = visual.slices.map((s, idx) => {
    const prevSum = visual.slices
      .slice(0, idx)
      .reduce((acc, prev) => acc + Math.max(0, prev.value), 0);
    const pct = Math.max(0, s.value) / total;
    const prevPct = prevSum / total;
    const dashLen = pct * circum;
    const dashOffset = circum * 0.25 - prevPct * circum;
    return { ...s, dashLen, dashOffset };
  });

  const topSlice = [...visual.slices].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-[88px] w-[88px] shrink-0">
        <svg viewBox="0 0 88 88" className="h-full w-full">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={13} />
          {segments.map((seg) =>
            seg.dashLen > 0.3 ? (
              <circle
                key={seg.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={13}
                strokeDasharray={`${seg.dashLen} ${circum - seg.dashLen}`}
                strokeDashoffset={seg.dashOffset}
              />
            ) : null,
          )}
        </svg>
        {topSlice && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
            <span className="text-[11px] font-extrabold text-slate-800">
              {topSlice.value.toFixed(0)}
              {unit}
            </span>
            <span className="max-w-[52px] truncate text-[9px] text-slate-500">
              {topSlice.label}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-[140px] flex-1 space-y-1">
        {visual.slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 font-mono font-bold text-slate-800">
              {s.value.toFixed(1)}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineBody({ visual }: { visual: HighlightLineVisual }) {
  const pts = visual.series;
  if (pts.length < 2) return null;

  const w = 300;
  const h = 112;
  const padL = 12;
  const padR = 14;
  const padT = 18;
  const padB = 22;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const values = pts.map((p) => p.value);
  const maxVal = Math.max(...values, 1) * 1.08;
  const minVal = 0;

  const coords = pts.map((p, idx) => {
    const x = padL + (idx / Math.max(1, pts.length - 1)) * plotW;
    const y = padT + (1 - (p.value - minVal) / (maxVal - minVal)) * plotH;
    return { ...p, x, y };
  });

  const polylinePts = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPts = `${coords[0].x.toFixed(1)},${padT + plotH} ${polylinePts} ${coords[coords.length - 1].x.toFixed(1)},${padT + plotH}`;

  const first = coords[0];
  const last = coords[coords.length - 1];
  const peak = coords.reduce((best, c) => (c.value > best.value ? c : best), coords[0]);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full">
        <line
          x1={padL}
          y1={padT + plotH}
          x2={w - padR}
          y2={padT + plotH}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + plotH / 2}
          x2={w - padR}
          y2={padT + plotH / 2}
          stroke="#e2e8f0"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <polygon points={areaPts} fill="rgba(79, 70, 229, 0.1)" />
        <polyline
          points={polylinePts}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, idx) => {
          const isEdge = idx === 0 || idx === coords.length - 1 || c.label === peak.label;
          return (
            <g key={c.label}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isEdge ? 3.2 : 2.1}
                fill={c.label === last.label ? '#e11d48' : '#4f46e5'}
                stroke="#ffffff"
                strokeWidth={1}
              />
              {isEdge && (
                <text
                  x={idx === 0 ? c.x + 2 : idx === coords.length - 1 ? c.x - 2 : c.x}
                  y={Math.max(10, c.y - 6)}
                  textAnchor={idx === 0 ? 'start' : idx === coords.length - 1 ? 'end' : 'middle'}
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#1e293b"
                >
                  {formatNum(c.value)}
                  {visual.unit}
                </text>
              )}
              {(idx === 0 || idx === Math.floor(coords.length / 2) || idx === coords.length - 1) && (
                <text
                  x={c.x}
                  y={h - 5}
                  textAnchor={idx === 0 ? 'start' : idx === coords.length - 1 ? 'end' : 'middle'}
                  fontSize="9"
                  fill="#64748b"
                >
                  {c.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-[10.5px] text-slate-500">
        <span>
          {first.label}年: {formatNum(first.value)}
          {visual.unit}
        </span>
        <span className="font-bold text-indigo-700">
          {last.label}年: {formatNum(last.value)}
          {visual.unit}
          {first.value > 0 ? `（${(last.value / first.value).toFixed(1)}倍）` : ''}
        </span>
      </div>
    </div>
  );
}

function BarBody({ visual }: { visual: HighlightBarVisual }) {
  const maxVal =
    visual.maxValue ??
    Math.max(1, ...visual.bars.map((b) => Math.max(0, b.value))) * 1.05;

  return (
    <div className="space-y-1.5">
      {visual.bars.map((b) => {
        const wPct = Math.min(100, Math.max(2, (Math.max(0, b.value) / maxVal) * 100));
        const fill = b.color ?? (b.isTarget ? '#4f46e5' : '#94a3b8');
        return (
          <div key={b.label} className="space-y-0.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`truncate ${b.isTarget ? 'font-extrabold text-indigo-800' : 'text-slate-700'}`}
              >
                {b.label}
              </span>
              <span
                className={`shrink-0 font-mono ${b.isTarget ? 'font-extrabold text-indigo-700' : 'font-semibold text-slate-600'}`}
              >
                {b.value}
                {visual.unit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${wPct}%`, backgroundColor: fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableBody({ visual }: { visual: HighlightTableVisual }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
            {visual.headers.map((h) => (
              <th key={h} className="px-2 py-1.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visual.rows.map((row) => (
            <tr key={row.join('|')} className="hover:bg-slate-50/70">
              {row.map((cell, cIdx) => (
                <td
                  key={`${cIdx}-${cell}`}
                  className={`px-2 py-1.5 leading-snug ${cIdx === 0 ? 'font-bold text-slate-800 whitespace-nowrap' : 'text-slate-700'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNum(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(2)}億`.replace(/\.00億$/, '億');
  return v.toLocaleString('ja-JP');
}
