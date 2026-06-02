import { i18n } from '@/locales'

export type AiChatProvider = 'deepseek' | 'openai' | 'custom'

export interface AiChatConfig {
  enabled: boolean
  showInLayout: boolean
  provider: AiChatProvider
  apiBaseUrl: string
  apiKeyEnv: string
  model: string
  streamPath: string
  defaultSystemPrompt?: string
  requestTimeoutMs: number
}

export const PROVIDER_PRESETS: Record<
  Exclude<AiChatProvider, 'custom'>,
  Pick<AiChatConfig, 'apiBaseUrl' | 'model'>
> = {
  deepseek: {
    apiBaseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
}

const preset = PROVIDER_PRESETS.deepseek

export const aiChatConfig: AiChatConfig = {
  enabled: true,
  showInLayout: true,
  provider: 'deepseek',
  apiBaseUrl: preset.apiBaseUrl,
  apiKeyEnv: 'VITE_AI_API_KEY',
  model: preset.model,
  streamPath: '/api/ai/chat/stream',
  get defaultSystemPrompt() {
    return i18n.global.t('aiChat.systemPrompt')
  },
  requestTimeoutMs: 60_000,
}

export function getAiApiKey(): string {
  return import.meta.env.VITE_AI_API_KEY ?? ''
}
