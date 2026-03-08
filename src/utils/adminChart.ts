export const CHART_COLORS = [
  '#EE4D2D', '#1a73e8', '#34a853', '#fbbc04', '#ea4335',
  '#9c27b0', '#00bcd4', '#ff9800', '#607d8b', '#e91e63',
];

export const fmtVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

export const fmtVNDShort = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M ₫`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ₫`;
  return `${v} ₫`;
};

export const buildLineOption = (
  labels: string[],
  series: Record<string, (number | null)[]>,
  yFormatter?: (v: number) => string,
) => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: { seriesName: string; value: number }[]) =>
      params.map((p) => `${p.seriesName}: ${yFormatter ? yFormatter(p.value) : p.value}`).join('<br/>'),
  },
  legend: { bottom: 0, type: 'scroll' },
  grid: { left: 60, right: 20, top: 20, bottom: 40 },
  xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: yFormatter || ((v: number) => v.toLocaleString()), fontSize: 11 },
  },
  series: Object.entries(series).map(([name, data], i) => ({
    name,
    type: 'line',
    data,
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2.5, color: CHART_COLORS[i % CHART_COLORS.length] },
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: CHART_COLORS[i % CHART_COLORS.length] + '33' },
          { offset: 1, color: CHART_COLORS[i % CHART_COLORS.length] + '00' },
        ],
      },
    },
  })),
});

export const buildBarOption = (
  labels: string[],
  series: Record<string, (number | null)[]>,
  yFormatter?: (v: number) => string,
  stack = false,
) => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: { seriesName: string; value: number }[]) =>
      params.map((p) => `${p.seriesName}: ${yFormatter ? yFormatter(p.value) : p.value}`).join('<br/>'),
  },
  legend: { bottom: 0, type: 'scroll' },
  grid: { left: 60, right: 20, top: 20, bottom: 40 },
  xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: yFormatter || ((v: number) => v.toLocaleString()), fontSize: 11 },
  },
  series: Object.entries(series).map(([name, data], i) => ({
    name,
    type: 'bar',
    data,
    stack: stack ? 'total' : undefined,
    barMaxWidth: 40,
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [3, 3, 0, 0] },
  })),
});

export const buildDonutOption = (data: { name: string; value: number }[], title?: string) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [{
    name: title || '',
    type: 'pie',
    radius: ['45%', '70%'],
    center: ['50%', '45%'],
    data: data.map((d, i) => ({ ...d, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })),
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
  }],
});

export const buildFunnelOption = (data: { name: string; value: number }[]) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}' },
  series: [{
    type: 'funnel',
    left: '10%',
    width: '80%',
    sort: 'none',
    data: data.map((d, i) => ({
      ...d,
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: 12 },
    })),
  }],
});

export const buildHBarOption = (
  names: string[],
  values: number[],
  valueFormatter?: (v: number) => string,
) => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: { value: number }[]) =>
      valueFormatter ? valueFormatter(params[0].value) : params[0].value,
  },
  grid: { left: 160, right: 60, top: 10, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { formatter: valueFormatter || ((v: number) => v.toLocaleString()), fontSize: 11 } },
  yAxis: { type: 'category', data: names, axisLabel: { fontSize: 12 } },
  series: [{
    type: 'bar',
    data: values.map((v, i) => ({ value: v, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })),
    barMaxWidth: 30,
    label: { show: true, position: 'right', formatter: valueFormatter ? (p: { value: number }) => valueFormatter(p.value) : undefined, fontSize: 11 },
  }],
});
