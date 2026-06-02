export const MAX_LOOKBACK_DAYS = 30
export const DEFAULT_RANGE_DAYS = 7

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

  return startOfDay(date)
}

export function getToday(): Date {
  return startOfDay(new Date())
}

export function getMinSelectableDate(today: Date = getToday()): Date {
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() - MAX_LOOKBACK_DAYS)
  return startOfDay(minDate)
}

export function getDefaultDateRange(today: Date = getToday()): [string, string] {
  const endDate = startOfDay(today)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (DEFAULT_RANGE_DAYS - 1))
  return [formatDate(startDate), formatDate(endDate)]
}

export function isDateDisabled(date: Date, today: Date = getToday()): boolean {
  const current = startOfDay(date)
  const minDate = getMinSelectableDate(today)
  const maxDate = startOfDay(today)
  return current < minDate || current > maxDate
}

/** 返回 i18n key，无错误时返回 null */
export function validateDateRange(startDate: string, endDate: string): string | null {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (!start || !end) {
    return 'validation.dateRangeInvalid'
  }

  const today = getToday()
  const minDate = getMinSelectableDate(today)

  if (start > today || end > today) {
    return 'validation.dateRangeFuture'
  }

  if (start < minDate || end < minDate) {
    return 'validation.dateRangeMaxDays'
  }

  if (start > end) {
    return 'validation.dateRangeStartAfterEnd'
  }

  return null
}
