export interface ApiResponse<T = unknown> {
  code: number
  message: string
  messageKey?: string
  messageParams?: Record<string, string>
  data: T
}

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}
