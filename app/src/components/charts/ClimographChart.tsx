import * as echarts from 'echarts';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClimateCity } from '../../types/schema_v1';

interface ClimographChartProps {
  city: ClimateCity;
  height?: number;
  blindMode?: boolean;
  tempRange?: [number, number];
  precipMax?: number;
  countryLabel?: string;
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * 雨温図（月別平均気温：折れ線 ＋ 月降水量：棒グラフの2軸複合チャート）
 */
export function ClimographChart({
  city,
  height = 270,
  blindMode = false,
  tempRange,
  precipMax,
  countryLabel,
}: ClimographChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isMasked = blindMode && !revealed;
  const displayCityName = isMasked
    ? '？？？'
    : countryLabel
      ? `${countryLabel}・${city.nameJa}`
      : city.nameJa;

  const stats = useMemo(() => {
    const temps = city.monthlyTempC;
    const precips = city.monthlyPrecipMm;
    const avgTemp = temps.reduce((acc, v) => acc + v, 0) / temps.length;
    const totalPrecip = precips.reduce((acc, v) => acc + v, 0);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const rangeTemp = maxTemp - minTemp;
    return {
      avgTemp: avgTemp.toFixed(1),
      totalPrecip: Math.round(totalPrecip),
      rangeTemp: rangeTemp.toFixed(1),
    };
  }, [city]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el);

    const minTempVal = Math.min(...city.monthlyTempC);
    const maxTempVal = Math.max(...city.monthlyTempC);
    const yTempMin = tempRange
      ? tempRange[0]
      : Math.floor(Math.min(0, minTempVal - 5) / 5) * 5;
    const yTempMax = tempRange
      ? tempRange[1]
      : Math.ceil(Math.max(30, maxTempVal + 5) / 5) * 5;

    const maxPrecipVal = Math.max(...city.monthlyPrecipMm, 100);
    const yPrecipMax = precipMax
      ? precipMax
      : Math.ceil((maxPrecipVal * 1.15) / 50) * 50;

    const tooltipTitle = isMasked ? '都市名非表示' : city.nameJa;

    const option: echarts.EChartsOption = {
      animationDuration: 300,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          if (list.length === 0) return '';
          const first = list[0] as { axisValueLabel?: string };
          const lines = [`<div class="font-semibold mb-1">${tooltipTitle}（${first.axisValueLabel ?? ''}）</div>`];
          for (const item of list) {
            const p = item as { marker?: string; seriesName?: string; value?: number };
            const unit = p.seriesName === '平均気温' ? '℃' : 'mm';
            lines.push(`<div>${p.marker ?? ''}${p.seriesName ?? ''}: <b>${p.value ?? '-'}</b> ${unit}</div>`);
          }
          return lines.join('');
        },
      },
      legend: {
        data: ['平均気温', '降水量'],
        top: 0,
        textStyle: { fontSize: 12, color: '#334155' },
      },
      grid: {
        left: 42,
        right: 46,
        top: 38,
        bottom: 28,
      },
      xAxis: {
        type: 'category',
        data: MONTH_LABELS,
        axisLabel: { fontSize: 11, color: '#475569', interval: 0 },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '気温(℃)',
          min: yTempMin,
          max: yTempMax,
          nameTextStyle: { fontSize: 11, color: '#dc2626', padding: [0, 0, 0, 10] },
          axisLabel: { fontSize: 11, color: '#dc2626' },
          splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '降水(mm)',
          min: 0,
          max: yPrecipMax,
          nameTextStyle: { fontSize: 11, color: '#2563eb', padding: [0, 10, 0, 0] },
          axisLabel: { fontSize: 11, color: '#2563eb' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '降水量',
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 20,
          itemStyle: {
            color: 'rgba(59, 130, 246, 0.72)',
            borderRadius: [3, 3, 0, 0],
          },
          data: city.monthlyPrecipMm,
        },
        {
          name: '平均気温',
          type: 'line',
          yAxisIndex: 0,
          smooth: false,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#dc2626', width: 2.5 },
          itemStyle: { color: '#dc2626' },
          data: city.monthlyTempC,
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
            雨温図：{displayCityName}
          </h4>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
            {isMasked ? '???' : city.koppenCode}
          </span>
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
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span>年平均: <strong className="text-red-600">{stats.avgTemp}℃</strong></span>
          <span>年較差: <strong>{stats.rangeTemp}℃</strong></span>
          <span>年降水量: <strong className="text-blue-600">{stats.totalPrecip}mm</strong></span>
        </div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
