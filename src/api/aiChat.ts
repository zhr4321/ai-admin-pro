import { aiChatConfig } from '@/config/ai-chat'
import { TOKEN_KEY } from '@/api/request'
import { i18n } from '@/locales'
import { AI_CHAT_FALLBACK_ERROR_KEY } from '@/types/aiChat'
import type { StreamChatMessage, StreamChatParams } from '@/types/aiChat'

const baseURL = import.meta.env.VITE_APP_BASE_API || '/api'

export interface StreamChatHandlers {
  signal?: AbortSignal
  onChunk: (content: string) => void
  onError: (message: string) => void
  onDone: () => void
}

function buildMessages(messages: StreamChatMessage[]): StreamChatMessage[] {
  const result: StreamChatMessage[] = []
  if (aiChatConfig.defaultSystemPrompt?.trim()) {
    result.push({ role: 'system', content: aiChatConfig.defaultSystemPrompt.trim() })
  }
  result.push(...messages)
  return result
}

function resolveUrl(path: string): string {
  if (path.startsWith('http')) return path
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export async function streamChat(
  params: StreamChatParams,
  handlers: StreamChatHandlers,
): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), aiChatConfig.requestTimeoutMs)

  const onExternalAbort = () => {
    window.clearTimeout(timeoutId)
    controller.abort()
  }
  handlers.signal?.addEventListener('abort', onExternalAbort, { once: true })

  let response: Response
  try {
    response = await fetch(resolveUrl(aiChatConfig.streamPath), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        conversationId: params.conversationId,
        messages: buildMessages(params.messages),
        model: aiChatConfig.model,
        provider: aiChatConfig.provider,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    window.clearTimeout(timeoutId)
    if (handlers.signal?.aborted) return
    const message = error instanceof Error ? error.message : i18n.global.t('aiChat.streamNetworkError')
    handlers.onError(message)
    return
  }

  window.clearTimeout(timeoutId)

  if (!response.ok) {
    let message = i18n.global.t('aiChat.streamRequestFailed', { status: response.status })
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) message = data.message
    } catch {
      // ignore
    }
    handlers.onError(message)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    handlers.onError(i18n.global.t('aiChat.streamReadFailed'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message'

  try {
    while (true) {
      if (handlers.signal?.aborted) return
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trimEnd()
        if (!trimmed) {
          currentEvent = 'message'
          continue
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim()
          continue
        }

        if (!trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') {
          handlers.onDone()
          return
        }

        if (currentEvent === 'error') {
          let message = i18n.global.t(AI_CHAT_FALLBACK_ERROR_KEY)
          try {
            const parsed = JSON.parse(data) as { message?: string }
            if (parsed.message) message = parsed.message
          } catch {
            if (data) message = data
          }
          handlers.onError(message)
          return
        }

        try {
          const parsed = JSON.parse(data) as { content?: string; message?: string }
          if (parsed.content) {
            handlers.onChunk(parsed.content)
          } else if (parsed.message) {
            handlers.onError(parsed.message)
            return
          }
        } catch {
          if (data) handlers.onChunk(data)
        }
      }
    }

    handlers.onDone()
  } catch (error) {
    if (handlers.signal?.aborted) {
      return
    }
    const message = error instanceof Error ? error.message : i18n.global.t('aiChat.streamReadError')
    handlers.onError(message)
  } finally {
    reader.releaseLock()
  }
}
