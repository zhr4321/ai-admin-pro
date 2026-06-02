import { onMounted, onUnmounted, watch, type ComputedRef, type Ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { echarts } from '@/utils/echartsSetup'

function isRadarOptionEmpty(option: EChartsOption): boolean {
  const radar = option.radar
  if (!radar || Array.isArray(radar)) {
    return false
  }

  return !radar.indicator || radar.indicator.length === 0
}

export function useEchart(
  containerRef: Ref<HTMLElement | null>,
  option: Ref<EChartsOption> | ComputedRef<EChartsOption>,
) {
  let chart: echarts.ECharts | null = null

  function initChart() {
    if (!containerRef.value) {
      return
    }

    if (isRadarOptionEmpty(option.value)) {
      return
    }

    if (!chart) {
      chart = echarts.init(containerRef.value)
    }

    chart.setOption(option.value, true)
  }

  function resizeChart() {
    chart?.resize()
  }

  function disposeChart() {
    chart?.dispose()
    chart = null
  }

  onMounted(() => {
    window.addEventListener('resize', resizeChart)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart)
    disposeChart()
  })

  watch(
    option,
    () => {
      initChart()
    },
    { deep: true },
  )

  return {
    refresh: initChart,
    resize: resizeChart,
    dispose: disposeChart,
  }
}
