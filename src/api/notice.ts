import request from './request'
import type {
  NoticeFormParams,
  NoticeImportResult,
  NoticeItem,
  NoticeListParams,
  NoticeListResult,
} from '@/types/notice'

export function getNoticeList(params: NoticeListParams) {
  return request.get<NoticeListResult>('/operations/notices', { params })
}

export function createNotice(data: NoticeFormParams) {
  return request.post<NoticeItem>('/operations/notices', data)
}

export function updateNotice(id: number, data: NoticeFormParams) {
  return request.put<NoticeItem>(`/operations/notices/${id}`, data)
}

export function deleteNotice(id: number) {
  return request.delete<void>(`/operations/notices/${id}`)
}

export function importNotice(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<NoticeImportResult>('/operations/notices/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
