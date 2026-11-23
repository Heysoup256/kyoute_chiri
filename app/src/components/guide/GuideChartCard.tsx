import * as echarts from 'echarts';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { GuideChartSpec } from '../../types/schema_v1';

const DEFAULT_PALETTE = [
  '#2563eb',
  '#f97316',
  '#10b981',
  '#8b5cf6',
  '#eab308',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

interface GuideChartCardProps {
  spec: GuideChartSpec;
}

/**
 * 共通テスト統計比較・構成比・時系列推移を描画する汎用EChartsカード
 * 凡例・縦軸ラベル・横軸ラベルが絶対に重ならない余白・レイアウトを標準化している。
 */
export function GuideChartCard({ spec }: GuideChartCardProps) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const instance = echarts.init(el);

    const categories = spec.categories ?? [];
    let option: echarts.EChartsOption;

    if (spec.kind === 'pie') {
      const pieData =
        spec.series.length === 1 && categories.length > 0
          ? categories.map((cat, idx) => ({
              name: cat,
              value: spec.series[0]?.values[idx] ?? 0,
            }))
          : spec.series.map((s) => ({
              name: s.name,
              value: s.values[0] ?? 0,
              itemStyle: s.color ? { color: s.color } : undefined,
            }));

      option = {
        animationDuration: 300,
        color: DEFAULT_PALETTE,
        tooltip: {
          trigger: 'item',
          formatter: (par: unknown) => {
            const p = par as { name?: string; value?: number; percent?: number };
            return `<b>${p.name ?? ''}</b><br/>${p.value ?? ''} ${spec.unit}（${p.percent ?? 0}%）`;
          },
        },
        legend: {
          bottom: 0,
          left: 'center',
          type: 'scroll',
          pageIconSize: 10,
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { fontSize: 10.5, color: '#334155' },
        },
        series: [
          {
            type: 'pie',
            center: ['50%', '43%'],
            radius: ['34%', '64%'],
            avoidLabelOverlap: true,
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 10,
              color: '#1e293b',
            },
            labelLine: { length: 8, length2: 6 },
            data: pieData,
          },
        ],
      };
    } else if (spec.kind === 'stacked_bar') {
      option = {
        animationDuration: 300,
        color: DEFAULT_PALETTE,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (v: unknown) => `${v ?? '-'} ${spec.unit}`,
        },
        legend: {
          top: 2,
          left: 'center',
          type: 'scroll',
          pageIconSize: 10,
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { fontSize: 10.5, color: '#334155' },
        },
        grid: {
          left: 10,
          right: 18,
          top: 38,
          bottom: 24,
          containLabel: true,
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            fontSize: 10,
            color: '#64748b',
            formatter: '{value}%',
          },
          splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        },
        yAxis: {
          type: 'category',
          data: categories,
          inverse: true,
          axisLabel: {
            fontSize: 10.5,
            fontWeight: 'bold',
            color: '#334155',
            width: 100,
            overflow: 'truncate',
          },
        },
        series: spec.series.map((s, idx) => ({
          name: s.name,
          type: 'bar',
          stack: 'total',
          barMaxWidth: 20,
          itemStyle: {
            color: s.color ?? DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
          },
          label: {
            show: true,
            position: 'inside',
            formatter: (par: unknown) => {
              const p = par as { value?: number };
              const val = Number(p.value ?? 0);
              return val >= 11 ? `${Math.round(val)}%` : '';
            },
            fontSize: 9.5,
            fontWeight: 'bold',
            color: '#ffffff',
          },
          data: s.values,
        })),
      };
    } else {
      const rotateX = categories.length >= 8 ? 22 : 0;
      option = {
        animationDuration: 300,
        color: DEFAULT_PALETTE,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: spec.kind === 'grouped_bar' ? 'shadow' : 'line' },
          valueFormatter: (v: unknown) => `${v ?? '-'} ${spec.unit}`,
        },
        legend: {
          top: 2,
          left: 'center',
          type: 'scroll',
          pageIconSize: 10,
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { fontSize: 10.5, color: '#334155' },
        },
        grid: {
          left: 12,
          right: 16,
          top: 40,
          bottom: rotateX > 0 ? 36 : 26,
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            fontSize: 10.5,
            color: '#334155',
            interval: 0,
            rotate: rotateX,
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            color: '#64748b',
          },
          splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        },
        series: spec.series.map((s, idx) => ({
          name: s.name,
          type: spec.kind === 'line' ? 'line' : 'bar',
          smooth: spec.kind === 'line',
          symbolSize: 6,
          barMaxWidth: 26,
          lineStyle: spec.kind === 'line' ? { width: 2.5 } : undefined,
          itemStyle: {
            color: s.color ?? DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
            borderRadius: spec.kind === 'grouped_bar' ? [3, 3, 0, 0] : 0,
          },
          data: s.values,
        })),
      };
    }

    instance.setOption(option);

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
    };
  }, [spec]);

  const catCount = spec.categories?.length ?? 0;
  const chartHeightClass =
    spec.kind === 'stacked_bar' && catCount >= 9
      ? 'h-[320px] md:h-[340px]'
      : spec.kind === 'pie'
        ? 'h-[260px] md:h-[280px]'
        : 'h-[270px] md:h-[300px]';

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 md:text-[15px]">{spec.title}</h3>
            {spec.subtitle && (
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{spec.subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-[10px] text-slate-500">
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
              単位：{spec.unit}
            </span>
            {(spec.source || spec.dataYear) && (
              <span>
                {spec.source ?? ''}
                {spec.dataYear ? `（${spec.dataYear}）` : ''}
              </span>
            )}
          </div>
        </div>

        <div ref={elRef} className={`mt-2.5 w-full ${chartHeightClass}`} />
      </div>

      <div className="mt-2 space-y-1.5">
        {spec.note && (
          <p className="text-[11px] leading-relaxed text-slate-600">{spec.note}</p>
        )}
        {spec.examPoint && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-[11.5px] leading-relaxed text-amber-950">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <div>
              <span className="font-extrabold">共テ読解ポイント：</span>
              {spec.examPoint}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
