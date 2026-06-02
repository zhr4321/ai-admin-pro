import type { EChartsOption } from 'echarts'
import type { VisualizationData } from '@/types/visualization'

const CHART_COLORS = ['#36cfc9', '#165dff', '#5cdbd3', '#69b1ff', '#13c2c2', '#597ef7']

const baseTextStyle = {
  color: 'var(--viz-text-muted)',
  fontSize: 12,
}

function buildTooltip(): EChartsOption['tooltip'] {
  return {
    trigger: 'axis',
    backgroundColor: 'rgba(8, 24, 48, 0.92)',
    borderColor: 'rgba(22, 93, 255, 0.45)',
    textStyle: {
      color: '#e8f3ff',
      fontSize: 12,
    },
  }
}

export function buildVisitTrendOption(data: VisualizationData['visitTrend']): EChartsOption {
  return {
    color: CHART_COLORS,
    tooltip: buildTooltip(),
    grid: { left: 48, right: 24, top: 32, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.dates.map((date) => date.slice(5)),
      axisLine: { lineStyle: { color: 'rgba(140, 184, 232, 0.35)' } },
      axisLabel: baseTextStyle,
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(22, 93, 255, 0.12)' } },
      axisLabel: baseTextStyle,
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#36cfc9' },
        itemStyle: { color: '#36cfc9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(54, 207, 201, 0.35)' },
              { offset: 1, color: 'rgba(54, 207, 201, 0.02)' },
            ],
          },
        },
        data: data.values,
      },
    ],
  }
}

export function buildChannelCompareOption(data: VisualizationData['channelCompare']): EChartsOption {
  return {
    color: CHART_COLORS,
    tooltip: {
      ...buildTooltip(),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 48, right: 24, top: 32, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLine: { lineStyle: { color: 'rgba(140, 184, 232, 0.35)' } },
      axisLabel: { ...baseTextStyle, interval: 0 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(22, 93, 255, 0.12)' } },
      axisLabel: baseTextStyle,
    },
    series: [
      {
        name: '渠道流量',
        type: 'bar',
        barWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#69b1ff' },
              { offset: 1, color: '#165dff' },
            ],
          },
        },
        data: data.values,
      },
    ],
  }
}

export function buildSourceRatioOption(data: VisualizationData['sourceRatio']): EChartsOption {
  return {
    color: CHART_COLORS,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 24, 48, 0.92)',
      borderColor: 'rgba(22, 93, 255, 0.45)',
      textStyle: { color: '#e8f3ff', fontSize: 12 },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: '#8cb8e8', fontSize: 12 },
    },
    series: [
      {
        name: '流量来源',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['38%', '52%'],
        label: { color: '#e8f3ff', fontSize: 12 },
        labelLine: { lineStyle: { color: 'rgba(140, 184, 232, 0.45)' } },
        itemStyle: {
          borderColor: 'rgba(10, 26, 46, 0.85)',
          borderWidth: 2,
        },
        data,
      },
    ],
  }
}

export function buildRevenueTrendOption(data: VisualizationData['revenueTrend']): EChartsOption {
  return {
    color: CHART_COLORS,
    tooltip: buildTooltip(),
    grid: { left: 56, right: 24, top: 32, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates.map((date) => date.slice(5)),
      axisLine: { lineStyle: { color: 'rgba(140, 184, 232, 0.35)' } },
      axisLabel: baseTextStyle,
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(22, 93, 255, 0.12)' } },
      axisLabel: baseTextStyle,
    },
    series: [
      {
        name: '成交额',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#597ef7' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(89, 126, 247, 0.55)' },
              { offset: 1, color: 'rgba(89, 126, 247, 0.05)' },
            ],
          },
        },
        data: data.values,
      },
    ],
  }
}

export function buildTargetRateOption(rate: number): EChartsOption {
  return {
    series: [
      {
        type: 'gauge',
        min: 0,
        max: 100,
        radius: '88%',
        center: ['50%', '58%'],
        progress: {
          show: true,
          width: 14,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#36cfc9' },
                { offset: 1, color: '#165dff' },
              ],
            },
          },
        },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[1, 'rgba(22, 93, 255, 0.18)']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#8cb8e8', distance: 18, fontSize: 11 },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#e8f3ff',
          fontSize: 28,
          fontWeight: 600,
          offsetCenter: [0, '8%'],
        },
        title: {
          show: true,
          offsetCenter: [0, '72%'],
          color: '#8cb8e8',
          fontSize: 12,
        },
        data: [{ value: rate, name: '月度目标完成率' }],
      },
    ],
  }
}

export function buildMetricsRadarOption(data: VisualizationData['metricsRadar']): EChartsOption {
  return {
    color: ['#36cfc9'],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 24, 48, 0.92)',
      borderColor: 'rgba(22, 93, 255, 0.45)',
      textStyle: { color: '#e8f3ff', fontSize: 12 },
    },
    radar: {
      center: ['50%', '54%'],
      radius: '62%',
      indicator: data.indicators.map((name) => ({ name, max: 100 })),
      axisName: { color: '#8cb8e8', fontSize: 12 },
      splitLine: { lineStyle: { color: 'rgba(22, 93, 255, 0.18)' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(22, 93, 255, 0.04)', 'rgba(22, 93, 255, 0.08)'],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(22, 93, 255, 0.25)' } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#36cfc9', width: 2 },
        areaStyle: { color: 'rgba(54, 207, 201, 0.25)' },
        itemStyle: { color: '#36cfc9' },
        data: [{ value: data.values, name: '核心指标' }],
      },
    ],
  }
}
