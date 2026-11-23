import * as echarts from 'echarts';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ClimateCity } from '../../types/schema_v1';

interface HythergraphChartProps {
  city: ClimateCity;
  height?: number;
  blindMode?: boolean;
  tempRange?: [number, number];
  precipMax?: number;
  countryLabel?: string;
}

interface HytherPoint {
  value: [number, number];
  month: number;
  isClosure: boolean;
}

/**
 * ハイサーグラフ（横軸：月降水量 mm、縦軸：月平均気温 ℃ の 1〜12月閉ループ軌道）
 */
export function HythergraphChart({
  city,
  height = 270,
  blindMode = false,
  tempRange,
  precipMax,
  countryLabel,
}: HythergraphChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isMasked = blindMode && !revealed;
  const displayCityName = isMasked
    ? '？？？'
    : countryLabel
      ? `${countryLabel}・${city.nameJa}`
      : city.nameJa;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el);

    const points: HytherPoint[] = city.monthlyTempC.map((temp, idx) => ({
      value: [city.monthlyPrecipMm[idx], temp],
      month: idx + 1,
      isClosure: false,
    }));

    points.push({
      value: [city.monthlyPrecipMm[0], city.monthlyTempC[0]],
      month: 1,
      isClosure: true,
    });

    const minTempVal = Math.min(...city.monthlyTempC);
    const maxTempVal = Math.max(...city.monthlyTempC);
    const yMin = tempRange
      ? tempRange[0]
      : Math.floor(Math.min(0, minTempVal - 4) / 5) * 5;
    const yMax = tempRange
      ? tempRange[1]
      : Math.ceil(Math.max(30, maxTempVal + 4) / 5) * 5;

    const maxPrecipVal = Math.max(...city.monthlyPrecipMm, 80);
    const xMax = precipMax
      ? precipMax
      : Math.ceil((maxPrecipVal * 1.15) / 50) * 50;

    const tooltipTitle = isMasked ? '都市名非表示' : city.nameJa;

    const option: echarts.EChartsOption = {
      animationDuration: 300,
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data?: HytherPoint };
          if (!p.data) return '';
          const [precip, temp] = p.data.value;
          return `
            <div class="font-semibold mb-1">${tooltipTitle}（${p.data.month}月）</div>
            <div>平均気温: <b>${temp}</b> ℃</div>
            <div>降水量: <b>${precip}</b> mm</div>
          `;
        },
      },
      grid: {
        left: 44,
        right: 22,
        top: 26,
        bottom: 40,
      },
      xAxis: {
        type: 'value',
        name: '月降水量 (mm)',
        nameLocation: 'middle',
        nameGap: 24,
        min: 0,
        max: xMax,
        nameTextStyle: { fontSize: 11, color: '#2563eb' },
        axisLabel: { fontSize: 11, color: '#475569' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        name: '気温(℃)',
        min: yMin,
        max: yMax,
        nameTextStyle: { fontSize: 11, color: '#dc2626' },
        axisLabel: { fontSize: 11, color: '#475569' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      series: [
        {
          name: 'ハイサー軌道',
          type: 'line',
          smooth: false,
          symbol: 'circle',
          symbolSize: (_val: unknown, params: unknown) => {
            const p = params as { data?: HytherPoint };
            if (p.data?.isClosure) return 0;
            return p.data?.month === 1 || p.data?.month === 7 ? 9 : 7;
          },
          lineStyle: {
            color: '#0f766e',
            width: 2.2,
          },
          itemStyle: {
            color: (params: unknown) => {
              const p = params as { data?: HytherPoint };
              if (p.data?.month === 1) return '#2563eb';
              if (p.data?.month === 7) return '#dc2626';
              return '#0f766e';
            },
          },
          label: {
            show: true,
            position: 'top',
            distance: 3,
            fontSize: 10,
            fontWeight: 600,
            color: '#1e293b',
            formatter: (params: unknown) => {
              const p = params as { data?: HytherPoint };
              if (!p.data || p.data.isClosure) return '';
              return String(p.data.month);
            },
          },
          data: points,
        },
      ],
    };

    chart.setOption(option);

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [city, isMasked, tempRange, precipMax]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <h4 className="text-sm font-bold text-slate-800">
            ハイサーグラフ：{displayCityName}
          </h4>
          {blindMode && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
            >
              {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {isMasked ? '都市名を表示' : '隠す'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            1月
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
            7月
          </span>
          <span>※数字は月(1〜12)</span>
        </div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
