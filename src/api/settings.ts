import request from './request'
import type { LogoUploadResult, SystemSettings, UpdateSettingsParams } from '@/types/settings'

export function getSettings() {
  return request.get<SystemSettings>('/settings')
}

export function updateSettings(data: UpdateSettingsParams) {
  return request.put<SystemSettings>('/settings', data)
}

export function uploadSettingsLogo(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<LogoUploadResult>('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
