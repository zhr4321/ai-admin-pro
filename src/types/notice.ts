import type { PageParams, PageResult } from './api'

export type NoticeStatus = 'draft' | 'published'

export interface NoticeItem extends Record<string, unknown> {
  id: number
  title: string
  content: string
  publisher: string
  status: NoticeStatus
  publishedAt: string
}

export interface NoticeListParams extends PageParams {
  title?: string
}

export interface NoticeFormParams {
  title: string
  content: string
  status: NoticeStatus
}

export type NoticeListResult = PageResult<NoticeItem>

export interface NoticeImportResult {
  imported: number
}
