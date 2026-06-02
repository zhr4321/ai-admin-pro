import request from './request'
import type {
  CampaignFormParams,
  CampaignImportResult,
  CampaignItem,
  CampaignListParams,
  CampaignListResult,
} from '@/types/campaign'

export function getCampaignList(params: CampaignListParams) {
  return request.get<CampaignListResult>('/operations/campaigns', { params })
}

export function createCampaign(data: CampaignFormParams) {
  return request.post<CampaignItem>('/operations/campaigns', data)
}

export function updateCampaign(id: number, data: CampaignFormParams) {
  return request.put<CampaignItem>(`/operations/campaigns/${id}`, data)
}

export function deleteCampaign(id: number) {
  return request.delete<void>(`/operations/campaigns/${id}`)
}

export function importCampaign(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<CampaignImportResult>('/operations/campaigns/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
