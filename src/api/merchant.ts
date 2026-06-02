import request from './request'
import type { OnboardingFormParams, OnboardingResult } from '@/types/merchant'

export function submitOnboarding(data: OnboardingFormParams) {
  return request.post<OnboardingResult>('/merchant/onboarding', data)
}
