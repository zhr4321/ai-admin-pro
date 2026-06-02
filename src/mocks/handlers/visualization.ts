import { http, HttpResponse } from 'msw'
import type { VisualizationData } from '@/types/visualization'
import { validateDateRange } from '@/utils/dateRange'

const CHANNELS = ['站内', '站外', '小程序', 'App', 'H5']
const SOURCES = ['自然搜索', '广告投放', '社交分享', '直接访问', '合作渠道']
const RADAR_INDICATORS = ['访问量', '转化率', '客单价', '复购率', '满意度']

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateList(startDate: string, endDate: string): string[] {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) {
    return []
  }

  const dates: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    dates.push(formatDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function seededValue(seed: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }

  const ratio = (hash % 1000) / 1000
  return Math.round(min + ratio * (max - min))
}

function buildVisualizationData(startDate: string, endDate: string): VisualizationData {
  const dates = buildDateList(startDate, endDate)

  return {
    visitTrend: {
      dates,
      values: dates.map((date) => seededValue(`${date}-visit`, 800, 3200)),
    },
    channelCompare: {
      categories: CHANNELS,
      values: CHANNELS.map((channel, index) =>
        seededValue(`${startDate}-${endDate}-${channel}`, 1200 + index * 100, 4800 + index * 100),
      ),
    },
    sourceRatio: SOURCES.map((name, index) => ({
      name,
      value: seededValue(`${startDate}-${endDate}-${name}`, 800 + index * 120, 2200 + index * 120),
    })),
    revenueTrend: {
      dates,
      values: dates.map((date) => seededValue(`${date}-revenue`, 12000, 68000)),
    },
    targetRate: seededValue(`${startDate}-${endDate}-target`, 62, 96),
    metricsRadar: {
      indicators: RADAR_INDICATORS,
      values: RADAR_INDICATORS.map((indicator, index) =>
        seededValue(`${startDate}-${endDate}-${indicator}`, 55 + index * 3, 92 + index * 2),
      ),
    },
  }
}

export const visualizationHandlers = [
  http.get('/api/visualization/data', ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate') ?? ''
    const endDate = url.searchParams.get('endDate') ?? ''
    const validationError = validateDateRange(startDate, endDate)

    if (validationError) {
      return HttpResponse.json({
        code: 400,
        message: validationError,
        data: null,
      })
    }

    const data = buildVisualizationData(startDate, endDate)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data,
    })
  }),
]
