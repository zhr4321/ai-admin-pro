import type { FormItemRule } from 'element-plus'
import type { ComposerTranslation } from 'vue-i18n'

export const PHONE_PATTERN = /^1[3-9]\d{9}$/

export const FORBIDDEN_WORDS = ['违禁', '测试违禁词', 'administrator']

export function containsForbiddenWord(value: string): boolean {
  const text = value.trim().toLowerCase()
  if (!text) return false
  return FORBIDDEN_WORDS.some((word) => text.includes(word.toLowerCase()))
}

export function createForbiddenWordRule(
  t: ComposerTranslation,
  fieldLabelKey: string,
): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (value && containsForbiddenWord(String(value))) {
        callback(new Error(t('validation.forbiddenWord', { field: t(fieldLabelKey) })))
        return
      }
      callback()
    },
    trigger: 'blur',
  }
}

export function getGenderLabelKeys(): Record<string, string> {
  return {
    male: 'profile.genderMale',
    female: 'profile.genderFemale',
    unknown: 'profile.genderUnknown',
  }
}
