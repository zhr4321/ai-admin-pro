import { http, HttpResponse } from 'msw'
import type { OnboardingFormParams } from '@/types/merchant'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'
import { containsForbiddenWord, PHONE_PATTERN } from '@/utils/validators'

function validateOnboarding(body: OnboardingFormParams): string | null {
  if (!body.merchantName?.trim()) return '商户名称不能为空'
  if (containsForbiddenWord(body.merchantName)) return '商户名称包含违禁词，请修改'
  if (!body.merchantType) return '请选择商户类型'
  if (!body.contactName?.trim()) return '联系人不能为空'
  if (!body.contactPhone?.trim()) return '联系电话不能为空'
  if (!PHONE_PATTERN.test(body.contactPhone.trim())) return '联系电话格式不正确'
  if (body.merchantType === 'enterprise' && !body.businessLicense?.trim()) {
    return '企业商户请填写营业执照号'
  }
  if (body.remark && containsForbiddenWord(body.remark)) return '备注包含违禁词，请修改'
  return null
}

export const merchantHandlers = [
  http.post('/api/merchant/onboarding', async ({ request }) => {
    const guard = requireModuleEdit(request, 'merchant')
    if (!guard.ok) return guard.response

    const body = (await request.json()) as OnboardingFormParams
    const error = validateOnboarding(body)
    if (error) {
      return HttpResponse.json({ code: 400, message: error, data: null })
    }

    const applicationNo = `MO${Date.now()}`
    return HttpResponse.json({
      code: 0,
      message: '提交成功',
      data: { applicationNo },
    })
  }),
]
