import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'

export function useApiMessage() {
  const { t, te } = useI18n()

  function resolveApiMessage(res: Pick<ApiResponse, 'message'> & { messageKey?: string }): string {
    if (res.messageKey && te(res.messageKey)) {
      return t(res.messageKey)
    }
    return res.message || t('errors.requestFailed')
  }

  return { resolveApiMessage }
}

export function useElementLocale() {
  const { locale } = useI18n()

  const elementLocale = computed(async () => {
    if (locale.value === 'en') {
      const mod = await import('element-plus/es/locale/lang/en')
      return mod.default
    }
    const mod = await import('element-plus/es/locale/lang/zh-cn')
    return mod.default
  })

  return { elementLocale }
}
