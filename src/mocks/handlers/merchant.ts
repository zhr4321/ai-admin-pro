import { http, HttpResponse } from 'msw'
import type { OnboardingFormParams } from '@/types/merchant'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'
import { containsForbiddenWord, PHONE_PATTERN } from '@/utils/validators'

function validateOnboarding(body: OnboardingFormParams): { messageKey: string } | null {
  if (!body.merchantName?.trim()) return { messageKey: 'errors.merchantNameRequired' }
  if (containsForbiddenWord(body.merchantName)) return { messageKey: 'validation.forbiddenWord' }
  if (!body.merchantType) return { messageKey: 'errors.merchantTypeRequired' }
  if (!body.contactName?.trim()) return { messageKey: 'errors.contactNameRequired' }
  if (!body.contactPhone?.trim()) return { messageKey: 'errors.contactPhoneRequired' }
  if (!PHONE_PATTERN.test(body.contactPhone.trim())) return { messageKey: 'errors.contactPhoneInvalid' }
  if (body.merchantType === 'enterprise' && !body.businessLicense?.trim()) {
    return { messageKey: 'errors.licenseNoRequired' }
  }
  if (body.remark && containsForbiddenWord(body.remark)) return { messageKey: 'validation.forbiddenWord' }
  return null
}

export const merchantHandlers = [
  http.post('/api/merchant/onboarding', async ({ request }) => {
    const guard = requireModuleEdit(request, 'merchant')
    if (!guard.ok) return guard.response

    const body = (await request.json()) as OnboardingFormParams
    const error = validateOnboarding(body)
    if (error) {
      return HttpResponse.json({
        code: 400,
        messageKey: error.messageKey,
        message: error.messageKey,
        data: null,
      })
    }

    const applicationNo = `MO${Date.now()}`
    return HttpResponse.json({
      code: 0,
      messageKey: 'errors.merchantSubmitSuccess',
      message: '提交成功',
      data: { applicationNo },
    })
  }),
]
