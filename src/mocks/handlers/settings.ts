import { http, HttpResponse } from 'msw'
import type { SystemSettings, UpdateSettingsParams } from '@/types/settings'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'
import { containsForbiddenWord } from '@/utils/validators'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let mockSettings: SystemSettings = {
  siteName: 'AI Admin Pro',
  logoUrl: '',
  icpNumber: '京ICP备12345678号',
  contactEmail: 'admin@example.com',
  maintenanceMode: false,
  maintenanceMessage: '',
  updatedAt: '2026-06-01 10:00:00',
}

function formatNow() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function validateSettingsPayload(body: UpdateSettingsParams): string | null {
  if (!body.siteName?.trim()) return '站点名称不能为空'
  if (containsForbiddenWord(body.siteName)) return '站点名称包含违禁词，请修改'
  if (!body.contactEmail?.trim()) return '联系邮箱不能为空'
  if (!EMAIL_PATTERN.test(body.contactEmail.trim())) return '联系邮箱格式不正确'
  if (body.maintenanceMode && !body.maintenanceMessage?.trim()) return '维护模式下请填写维护公告'
  if (body.maintenanceMessage && containsForbiddenWord(body.maintenanceMessage)) {
    return '维护公告包含违禁词，请修改'
  }
  return null
}

function requireAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return Boolean(auth?.startsWith('Bearer '))
}

export const settingsHandlers = [
  http.get('/api/settings', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { ...mockSettings },
    })
  }),

  http.put('/api/settings', async ({ request }) => {
    const guard = requireModuleEdit(request, 'system')
    if (!guard.ok) return guard.response

    const body = (await request.json()) as UpdateSettingsParams
    const error = validateSettingsPayload(body)
    if (error) {
      return HttpResponse.json({ code: 400, message: error, data: null })
    }

    mockSettings = {
      ...mockSettings,
      siteName: body.siteName.trim(),
      logoUrl: body.logoUrl ?? mockSettings.logoUrl,
      icpNumber: body.icpNumber?.trim() || '',
      contactEmail: body.contactEmail.trim(),
      maintenanceMode: body.maintenanceMode,
      maintenanceMessage: body.maintenanceMode ? body.maintenanceMessage?.trim() || '' : '',
      updatedAt: formatNow(),
    }

    return HttpResponse.json({
      code: 0,
      message: '保存成功',
      data: { ...mockSettings },
    })
  }),

  http.post('/api/settings/logo', async ({ request }) => {
    const guard = requireModuleEdit(request, 'system')
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({ code: 400, message: '请上传 Logo 文件', data: null })
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    const url = `data:${file.type};base64,${btoa(binary)}`

    return HttpResponse.json({
      code: 0,
      message: '上传成功',
      data: { url },
    })
  }),
]
