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

function validateSettingsPayload(body: UpdateSettingsParams): { messageKey: string } | null {
  if (!body.siteName?.trim()) return { messageKey: 'errors.siteNameRequired' }
  if (containsForbiddenWord(body.siteName)) return { messageKey: 'validation.forbiddenWord' }
  if (!body.contactEmail?.trim()) return { messageKey: 'errors.contactEmailRequired' }
  if (!EMAIL_PATTERN.test(body.contactEmail.trim())) return { messageKey: 'errors.contactEmailInvalid' }
  if (body.maintenanceMode && !body.maintenanceMessage?.trim()) {
    return { messageKey: 'errors.maintenanceMessageRequired' }
  }
  if (body.maintenanceMessage && containsForbiddenWord(body.maintenanceMessage)) {
    return { messageKey: 'validation.forbiddenWord' }
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
        { code: 401, messageKey: 'errors.unauthorized', message: '未登录', data: null },
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
      return HttpResponse.json({
        code: 400,
        messageKey: error.messageKey,
        message: error.messageKey,
        data: null,
      })
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
      message: 'success',
      data: { ...mockSettings },
    })
  }),

  http.post('/api/settings/logo', async ({ request }) => {
    const guard = requireModuleEdit(request, 'system')
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({
        code: 400,
        messageKey: 'errors.uploadLogoRequired',
        message: '请上传 Logo 文件',
        data: null,
      })
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
      messageKey: 'common.uploadSuccess',
      message: '上传成功',
      data: { url },
    })
  }),
]
