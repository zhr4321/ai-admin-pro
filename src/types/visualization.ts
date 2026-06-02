export interface VisualizationParams {
  startDate: string
  endDate: string
}

export interface TrendSeries {
  dates: string[]
  values: number[]
}

export interface CategorySeries {
  categories: string[]
  values: number[]
}

export interface RatioItem {
  name: string
  value: number
}

export interface MetricsRadar {
  indicators: string[]
  values: number[]
}

export interface VisualizationData {
  visitTrend: TrendSeries
  channelCompare: CategorySeries
  sourceRatio: RatioItem[]
  revenueTrend: TrendSeries
  targetRate: number
  metricsRadar: MetricsRadar
}
