import type { PageParams, PageResult } from './api'

export type CampaignStatus = 'pending' | 'active' | 'ended'
export type CampaignChannel = 'internal' | 'external' | 'all'

export interface CampaignItem extends Record<string, unknown> {
  id: number
  name: string
  status: CampaignStatus
  channel: CampaignChannel
  pinned: boolean
  startDate: string
  endDate: string
  createdAt: string
}

export interface CampaignListParams extends PageParams {
  name?: string
  status?: CampaignStatus
  startDate?: string
  endDate?: string
  pinnedOnly?: boolean
  channel?: CampaignChannel
}

export interface CampaignFormParams {
  name: string
  status: CampaignStatus
  channel: CampaignChannel
  pinned: boolean
  startDate: string
  endDate: string
}

export type CampaignListResult = PageResult<CampaignItem>

export interface CampaignImportResult {
  imported: number
}
