import { i18n } from '@/locales'

type MessagePayload = {
  message?: string
  messageKey?: string
  messageParams?: Record<string, string>
}

export function resolveApiMessage(payload: MessagePayload): string {
  const params = { ...(payload.messageParams ?? {}) }
  if (params.moduleName && i18n.global.te(String(params.moduleName))) {
    params.moduleName = i18n.global.t(String(params.moduleName))
  }

  if (payload.messageKey && i18n.global.te(payload.messageKey)) {
    return i18n.global.t(payload.messageKey, params)
  }
  return payload.message || i18n.global.t('errors.requestFailed')
}
