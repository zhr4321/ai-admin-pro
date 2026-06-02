import type { FormItemRule } from 'element-plus'

export const PHONE_PATTERN = /^1[3-9]\d{9}$/

export const FORBIDDEN_WORDS = ['违禁', '测试违禁词', 'administrator']

export function containsForbiddenWord(value: string): boolean {
  const text = value.trim().toLowerCase()
  if (!text) return false
  return FORBIDDEN_WORDS.some((word) => text.includes(word.toLowerCase()))
}

export function createForbiddenWordRule(fieldLabel: string): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (value && containsForbiddenWord(String(value))) {
        callback(new Error(`${fieldLabel}包含违禁词，请修改`))
        return
      }
      callback()
    },
    trigger: 'blur',
  }
}

export const GENDER_LABELS: Record<string, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
}
