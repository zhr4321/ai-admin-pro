import { http, HttpResponse } from 'msw'
import type { NoticeFormParams, NoticeItem, NoticeStatus } from '@/types/notice'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'

let nextId = 7

let notices: NoticeItem[] = [
  {
    id: 1,
    title: '系统维护通知',
    content: '平台将于本周六凌晨 2:00-4:00 进行系统维护，期间可能无法访问。',
    publisher: '系统管理员',
    status: 'published',
    publishedAt: '2026-02-28 09:00:00',
  },
  {
    id: 2,
    title: '新功能上线公告',
    content: '运营中心模块已上线，支持活动推广与公告管理。',
    publisher: '运营团队',
    status: 'published',
    publishedAt: '2026-03-01 10:30:00',
  },
  {
    id: 3,
    title: '清明节放假安排',
    content: '清明节期间客服响应时间可能延长，请提前安排业务。',
    publisher: '人事行政',
    status: 'draft',
    publishedAt: '2026-03-05 14:00:00',
  },
  {
    id: 4,
    title: '安全提醒',
    content: '请定期修改密码，勿将账号信息泄露给他人。',
    publisher: '安全中心',
    status: 'published',
    publishedAt: '2026-01-15 08:00:00',
  },
  {
    id: 5,
    title: '季度运营计划',
    content: 'Q2 运营重点将放在用户增长与活动转化。',
    publisher: '运营团队',
    status: 'draft',
    publishedAt: '2026-03-10 16:20:00',
  },
  {
    id: 6,
    title: '数据备份说明',
    content: '系统每日凌晨自动备份数据，保留 30 天。',
    publisher: '技术部',
    status: 'published',
    publishedAt: '2026-02-01 11:00:00',
  },
]

function parseStatus(raw: string): NoticeStatus {
  const map: Record<string, NoticeStatus> = {
    draft: 'draft',
    published: 'published',
    草稿: 'draft',
    已发布: 'published',
  }
  return map[raw.trim()] ?? 'draft'
}

function filterNotices(url: URL): NoticeItem[] {
  const title = url.searchParams.get('title')?.trim().toLowerCase()
  if (!title) return [...notices]
  return notices.filter((item) => item.title.toLowerCase().includes(title))
}

function nowString() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

export const noticeHandlers = [
  http.get('/api/operations/notices', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const filtered = filterNotices(url)
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { list, total: filtered.length },
    })
  }),

  http.post('/api/operations/notices', async ({ request }) => {
    const guard = requireModuleEdit(request, 'notice')
    if (!guard.ok) return guard.response

    const body = (await request.json()) as NoticeFormParams
    const item: NoticeItem = {
      id: nextId++,
      title: body.title,
      content: body.content,
      publisher: '当前用户',
      status: body.status,
      publishedAt: nowString(),
    }
    notices.unshift(item)
    return HttpResponse.json({ code: 0, message: 'success', data: item })
  }),

  http.put('/api/operations/notices/:id', async ({ params, request }) => {
    const guard = requireModuleEdit(request, 'notice')
    if (!guard.ok) return guard.response

    const id = Number(params.id)
    const body = (await request.json()) as NoticeFormParams
    const idx = notices.findIndex((item) => item.id === id)
    if (idx === -1) {
      return HttpResponse.json({ code: 404, message: '公告不存在', data: null })
    }
    notices[idx] = {
      ...notices[idx],
      title: body.title,
      content: body.content,
      status: body.status,
    }
    return HttpResponse.json({ code: 0, message: 'success', data: notices[idx] })
  }),

  http.delete('/api/operations/notices/:id', ({ params, request }) => {
    const guard = requireModuleEdit(request, 'notice')
    if (!guard.ok) return guard.response

    const id = Number(params.id)
    notices = notices.filter((item) => item.id !== id)
    return HttpResponse.json({ code: 0, message: 'success', data: null })
  }),

  http.post('/api/operations/notices/import', async ({ request }) => {
    const guard = requireModuleEdit(request, 'notice')
    if (!guard.ok) return guard.response

    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({ code: 400, message: '请上传文件', data: null })
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
      const title = String(row['公告标题'] ?? row.title ?? '').trim()
      if (!title) continue
      const publisher = String(row['发布人'] ?? row.publisher ?? '当前用户').trim()
      const status = parseStatus(String(row['状态'] ?? row.status ?? 'draft'))
      const content = String(row['内容'] ?? row.content ?? '').trim()

      notices.push({
        id: nextId++,
        title,
        content: content || '（导入内容为空）',
        publisher,
        status,
        publishedAt: nowString(),
      })
      imported += 1
    }

    return HttpResponse.json({ code: 0, message: 'success', data: { imported } })
  }),
]
