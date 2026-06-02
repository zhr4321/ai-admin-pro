import { http, HttpResponse } from 'msw'
import type {
  CampaignChannel,
  CampaignFormParams,
  CampaignItem,
  CampaignStatus,
} from '@/types/campaign'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'

let nextId = 7

let campaigns: CampaignItem[] = [
  {
    id: 1,
    name: '春季新品大促',
    status: 'active',
    channel: 'all',
    pinned: true,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    createdAt: '2026-02-20 10:00:00',
  },
  {
    id: 2,
    name: '会员日专享',
    status: 'pending',
    channel: 'internal',
    pinned: false,
    startDate: '2026-04-01',
    endDate: '2026-04-07',
    createdAt: '2026-02-25 14:30:00',
  },
  {
    id: 3,
    name: '站外引流活动',
    status: 'active',
    channel: 'external',
    pinned: true,
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    createdAt: '2026-02-10 09:00:00',
  },
  {
    id: 4,
    name: '年终回馈',
    status: 'ended',
    channel: 'all',
    pinned: false,
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    createdAt: '2025-11-20 16:00:00',
  },
  {
    id: 5,
    name: '限时秒杀',
    status: 'active',
    channel: 'internal',
    pinned: false,
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    createdAt: '2026-01-28 11:20:00',
  },
  {
    id: 6,
    name: '品牌联合推广',
    status: 'pending',
    channel: 'external',
    pinned: false,
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    createdAt: '2026-03-01 08:45:00',
  },
]

function parseStatus(raw: string): CampaignStatus {
  const map: Record<string, CampaignStatus> = {
    pending: 'pending',
    active: 'active',
    ended: 'ended',
    未开始: 'pending',
    进行中: 'active',
    已结束: 'ended',
  }
  return map[raw.trim()] ?? 'pending'
}

function parseChannel(raw: string): CampaignChannel {
  const map: Record<string, CampaignChannel> = {
    internal: 'internal',
    external: 'external',
    all: 'all',
    站内: 'internal',
    站外: 'external',
    全渠道: 'all',
  }
  return map[raw.trim()] ?? 'internal'
}

function filterCampaigns(url: URL): CampaignItem[] {
  const name = url.searchParams.get('name')?.trim().toLowerCase()
  const status = url.searchParams.get('status') as CampaignStatus | null
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const pinnedOnly = url.searchParams.get('pinnedOnly') === 'true'
  const channel = url.searchParams.get('channel') as CampaignChannel | null

  let filtered = [...campaigns]

  if (name) {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(name))
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status)
  }
  if (channel) {
    filtered = filtered.filter((item) => item.channel === channel)
  }
  if (pinnedOnly) {
    filtered = filtered.filter((item) => item.pinned)
  }
  if (startDate && endDate) {
    filtered = filtered.filter(
      (item) => item.startDate <= endDate && item.endDate >= startDate,
    )
  }

  return filtered
}

function nowString() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

export const campaignHandlers = [
  http.get('/api/operations/campaigns', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const filtered = filterCampaigns(url)
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { list, total: filtered.length },
    })
  }),

  http.post('/api/operations/campaigns', async ({ request }) => {
    const guard = requireModuleEdit(request, 'campaign')
    if (!guard.ok) return guard.response

    const body = (await request.json()) as CampaignFormParams
    const item: CampaignItem = {
      id: nextId++,
      ...body,
      createdAt: nowString(),
    }
    campaigns.unshift(item)
    return HttpResponse.json({ code: 0, message: 'success', data: item })
  }),

  http.put('/api/operations/campaigns/:id', async ({ params, request }) => {
    const guard = requireModuleEdit(request, 'campaign')
    if (!guard.ok) return guard.response

    const id = Number(params.id)
    const body = (await request.json()) as CampaignFormParams
    const idx = campaigns.findIndex((item) => item.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 404,
        messageKey: 'errors.campaignNotFound',
        message: '活动不存在',
        data: null,
      })
    }
    campaigns[idx] = { ...campaigns[idx], ...body }
    return HttpResponse.json({ code: 0, message: 'success', data: campaigns[idx] })
  }),

  http.delete('/api/operations/campaigns/:id', ({ params, request }) => {
    const guard = requireModuleEdit(request, 'campaign')
    if (!guard.ok) return guard.response

    const id = Number(params.id)
    campaigns = campaigns.filter((item) => item.id !== id)
    return HttpResponse.json({ code: 0, message: 'success', data: null })
  }),

  http.post('/api/operations/campaigns/import', async ({ request }) => {
    const guard = requireModuleEdit(request, 'campaign')
    if (!guard.ok) return guard.response

    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({
        code: 400,
        messageKey: 'errors.uploadFileRequired',
        message: '请上传文件',
        data: null,
      })
    }

    const buffer = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return HttpResponse.json({ code: 0, message: 'success', data: { imported: 0 } })
    }
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    let imported = 0
    for (const row of rows) {
      const name = String(row['活动名称'] ?? row.name ?? '').trim()
      if (!name) continue
      const status = parseStatus(String(row['状态'] ?? row.status ?? 'pending'))
      const channel = parseChannel(String(row['推广渠道'] ?? row.channel ?? 'internal'))
      const pinnedRaw = String(row['是否置顶'] ?? row.pinned ?? '').trim()
      const pinned = pinnedRaw === '是' || pinnedRaw === 'true' || pinnedRaw === '1'
      const startDate = String(row['开始日期'] ?? row.startDate ?? '').trim()
      const endDate = String(row['结束日期'] ?? row.endDate ?? '').trim()
      if (!startDate || !endDate) continue

      campaigns.push({
        id: nextId++,
        name,
        status,
        channel,
        pinned,
        startDate,
        endDate,
        createdAt: nowString(),
      })
      imported += 1
    }

    return HttpResponse.json({ code: 0, message: 'success', data: { imported } })
  }),
]
