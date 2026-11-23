import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';
import type { AgePyramidBin } from '../../types/schema_v1';

interface PopulationPyramidChartProps {
  countryName: string;
  bins: AgePyramidBin[];
  pyramidType: string;
}

/**
 * ECharts を用いた男女別年齢階級（人口ピラミッド）描画コンポーネント
 */
export function PopulationPyramidChart({
  countryName,
  bins,
  pyramidType,
}: PopulationPyramidChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el || bins.length === 0) return;

    const chart = echarts.init(el);
    const maxVal = Math.max(
      10,
      Math.ceil(
        Math.max(...bins.map((b) => Math.max(b.malePct, b.femalePct))) / 2,
      ) * 2,
    );

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          if (list.length === 0) return '';
          const first = list[0] as { name?: string };
          const lines = [`<strong>${first.name ?? ''}歳</strong>`];
          for (const item of list as { seriesName?: string; value?: number }[]) {
            const v = Math.abs(Number(item.value ?? 0)).toFixed(1);
            lines.push(`${item.seriesName ?? ''}: ${v}%`);
          }
          return lines.join('<br/>');
        },
      },
      legend: {
        data: ['男性', '女性'],
        top: 4,
        textStyle: { fontSize: 11, color: '#334155' },
      },
      grid: {
        left: 52,
        right: 18,
        top: 32,
        bottom: 24,
      },
      xAxis: {
        type: 'value',
        min: -maxVal,
        max: maxVal,
        axisLabel: {
          fontSize: 10,
          color: '#64748b',
          formatter: (val: number) => `${Math.abs(val)}%`,
        },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: bins.map((b) => b.ageGroup),
        axisTick: { show: false },
        axisLabel: { fontSize: 10.5, color: '#334155', fontWeight: 600 },
      },
      series: [
        {
          name: '男性',
          type: 'bar',
          stack: 'total',
          data: bins.map((b) => -b.malePct),
          itemStyle: { color: '#3b82f6', borderRadius: [3, 0, 0, 3] },
          barWidth: '68%',
        },
        {
          name: '女性',
          type: 'bar',
          stack: 'total',
          data: bins.map((b) => b.femalePct),
          itemStyle: { color: '#ec4899', borderRadius: [0, 3, 3, 0] },
          barWidth: '68%',
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [bins]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-extrabold text-slate-900">
            {countryName} の人口ピラミッド（総人口比 %）
          </h4>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10.5px] font-bold text-indigo-800">
          {pyramidType}
        </span>
      </div>
      <div ref={chartRef} className="mt-1 h-[230px] w-full" />
    </div>
  );
}
