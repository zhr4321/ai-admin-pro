export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessageStatus = 'streaming' | 'done' | 'error' | 'aborted'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: ChatMessageStatus
  errorMessage?: string
}

export interface StoredConversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export interface StreamChatMessage {
  role: ChatRole
  content: string
}

export interface StreamChatParams {
  conversationId: string
  messages: StreamChatMessage[]
}

export interface FabPosition {
  x: number
  y: number
}

import { i18n } from '@/locales'

export const AI_CHAT_FALLBACK_ERROR_KEY = 'aiChat.fallbackError'

export const AI_CHAT_DEFAULT_TITLE_KEY = 'aiChat.newConversation'

export function getDefaultConversationTitle(): string {
  return i18n.global.t(AI_CHAT_DEFAULT_TITLE_KEY)
}

export function truncateTitle(text: string, maxLen = 20): string {
  const trimmed = text.trim()
  if (!trimmed) return getDefaultConversationTitle()
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed
}

export function createMessageId(): string {
  return crypto.randomUUID()
}

export function createConversationId(): string {
  return crypto.randomUUID()
}
