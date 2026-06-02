<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { getVisualizationData } from '@/api/visualization'
import ChartPanel from '@/components/visualization/ChartPanel.vue'
import { useEchart } from '@/composables/useEchart'
import type { VisualizationData } from '@/types/visualization'
import {
  getDefaultDateRange,
  isDateDisabled,
  validateDateRange,
} from '@/utils/dateRange'
import '@/utils/echartsSetup'
import {
  buildChannelCompareOption,
  buildMetricsRadarOption,
  buildRevenueTrendOption,
  buildSourceRatioOption,
  buildTargetRateOption,
  buildVisitTrendOption,
} from './chartOptions'

const { t } = useI18n()

const emptyData: VisualizationData = {
  visitTrend: { dates: [], values: [] },
  channelCompare: { categories: [], values: [] },
  sourceRatio: [],
  revenueTrend: { dates: [], values: [] },
  targetRate: 0,
  metricsRadar: { indicators: [], values: [] },
}

const loading = ref(false)
const dateRange = ref<[string, string]>(getDefaultDateRange())
const activeRange = ref<[string, string]>(getDefaultDateRange())
const chartData = ref<VisualizationData>({ ...emptyData })

const visitTrendRef = ref<HTMLElement | null>(null)
const channelCompareRef = ref<HTMLElement | null>(null)
const sourceRatioRef = ref<HTMLElement | null>(null)
const revenueTrendRef = ref<HTMLElement | null>(null)
const targetRateRef = ref<HTMLElement | null>(null)
const metricsRadarRef = ref<HTMLElement | null>(null)

const visitTrendOption = computed(() => buildVisitTrendOption(chartData.value.visitTrend, t))
const channelCompareOption = computed(() => buildChannelCompareOption(chartData.value.channelCompare, t))
const sourceRatioOption = computed(() => buildSourceRatioOption(chartData.value.sourceRatio, t))
const revenueTrendOption = computed(() => buildRevenueTrendOption(chartData.value.revenueTrend, t))
const targetRateOption = computed(() => buildTargetRateOption(chartData.value.targetRate, t))
const metricsRadarOption = computed(() => buildMetricsRadarOption(chartData.value.metricsRadar, t))

const visitTrendChart = useEchart(visitTrendRef, visitTrendOption)
const channelCompareChart = useEchart(channelCompareRef, channelCompareOption)
const sourceRatioChart = useEchart(sourceRatioRef, sourceRatioOption)
const revenueTrendChart = useEchart(revenueTrendRef, revenueTrendOption)
const targetRateChart = useEchart(targetRateRef, targetRateOption)
const metricsRadarChart = useEchart(metricsRadarRef, metricsRadarOption)

const chartRefreshers = [
  visitTrendChart,
  channelCompareChart,
  sourceRatioChart,
  revenueTrendChart,
  targetRateChart,
  metricsRadarChart,
]

function disableDate(date: Date) {
  return isDateDisabled(date)
}

async function fetchVisualizationData() {
  const [startDate, endDate] = dateRange.value
  const validationError = validateDateRange(startDate, endDate)

  if (validationError) {
    ElMessage.warning(validationError)
    return
  }

  loading.value = true
  try {
    const data = await getVisualizationData({ startDate, endDate })
    chartData.value = data
    activeRange.value = [startDate, endDate]
    await nextTick()
    chartRefreshers.forEach((chart) => chart.refresh())
  } catch {
    // 错误由 axios 拦截器统一提示
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchVisualizationData()
}

function handleReset() {
  dateRange.value = getDefaultDateRange()
  fetchVisualizationData()
}

onMounted(() => {
  fetchVisualizationData()
})
</script>

<template>
  <div class="viz-page">
    <div class="viz-page__header">
      <div>
        <h2 class="viz-page__title">{{ t('visualization.pageTitle') }}</h2>
        <p class="viz-page__subtitle">
          {{ t('visualization.activeRange', { start: activeRange[0], end: activeRange[1] }) }}
        </p>
      </div>
    </div>

    <div class="viz-toolbar">
      <el-form inline class="viz-toolbar__form" @submit.prevent="handleSearch">
        <el-form-item :label="t('visualization.timeRange')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="t('common.dateRangeSeparator')"
            :start-placeholder="t('common.startDate')"
            :end-placeholder="t('common.endDate')"
            value-format="YYYY-MM-DD"
            :disabled-date="disableDate"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            {{ t('common.search') }}
          </el-button>
          <el-button :icon="RefreshRight" @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="viz-grid">
      <el-row :gutter="16" class="viz-row">
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartVisitTrend')" :loading="loading">
            <div ref="visitTrendRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartChannelCompare')" :loading="loading">
            <div ref="channelCompareRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartTrafficSource')" :loading="loading">
            <div ref="sourceRatioRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="viz-row">
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartRevenueTrend')" :loading="loading">
            <div ref="revenueTrendRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartTargetRate')" :loading="loading">
            <div ref="targetRateRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
        <el-col :xs="24" :md="8" class="viz-col">
          <ChartPanel :title="t('visualization.chartRadar')" :loading="loading">
            <div ref="metricsRadarRef" class="viz-chart" />
          </ChartPanel>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped lang="scss">
.viz-page {
  min-height: calc(100vh - 120px);
  margin: -20px;
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(22, 93, 255, 0.18), transparent 36%),
    radial-gradient(circle at bottom left, rgba(54, 207, 201, 0.12), transparent 32%),
    var(--viz-bg);

  &__header {
    margin-bottom: 16px;
  }

  &__title {
    margin: 0 0 6px;
    color: var(--viz-text);
    font-size: var(--font-size-title);
    font-weight: 600;
    line-height: var(--line-height-title);
  }

  &__subtitle {
    margin: 0;
    color: var(--viz-text-muted);
    font-size: var(--font-size-caption);
    line-height: var(--line-height-body);
  }
}

.viz-toolbar {
  margin-bottom: 16px;
  padding: 16px 20px;
  border: 1px solid var(--viz-panel-border);
  border-radius: var(--radius-base);
  background: rgba(8, 24, 48, 0.72);
  backdrop-filter: blur(6px);

  &__form {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    color: var(--viz-text-muted);
  }

  :deep(.el-input__wrapper),
  :deep(.el-range-editor.el-input__wrapper) {
    background: rgba(10, 26, 46, 0.85);
    box-shadow: 0 0 0 1px rgba(22, 93, 255, 0.25) inset;
  }

  :deep(.el-input__inner),
  :deep(.el-range-input),
  :deep(.el-range-separator) {
    color: var(--viz-text);
  }
}

.viz-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.viz-row {
  margin-bottom: 0 !important;
}

.viz-col {
  margin-bottom: 16px;
}

.viz-chart {
  width: 100%;
  height: 280px;
}

@media (max-width: 767px) {
  .viz-page {
    margin: -12px;
    padding: 12px;
  }

  .viz-toolbar {
    padding: 12px;
  }
}
</style>
