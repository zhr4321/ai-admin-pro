export type MerchantType = 'personal' | 'enterprise'

export interface OnboardingFormParams {
  merchantName: string
  merchantType: MerchantType
  contactName: string
  contactPhone: string
  businessLicense?: string
  remark?: string
}

export interface OnboardingResult {
  applicationNo: string
}
