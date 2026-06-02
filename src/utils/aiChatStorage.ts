import type { FabPosition, StoredConversation } from '@/types/aiChat'

const PREFIX = 'ai-admin-pro:ai-chat:'
const KEY_CONVERSATIONS = `${PREFIX}conversations`
const KEY_FAB_POSITION = `${PREFIX}fab-position`
const KEY_CURRENT_ID = `${PREFIX}current-id`

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadConversations(): StoredConversation[] {
  const list = readJson<StoredConversation[]>(KEY_CONVERSATIONS, [])
  return list.map((conv) => ({
    ...conv,
    messages: conv.messages.map((msg) =>
      msg.status === 'streaming'
        ? { ...msg, status: 'aborted' as const }
        : msg,
    ),
  }))
}

export function saveConversations(conversations: StoredConversation[]): void {
  writeJson(KEY_CONVERSATIONS, conversations)
}

export function loadFabPosition(): FabPosition | null {
  return readJson<FabPosition | null>(KEY_FAB_POSITION, null)
}

export function saveFabPosition(position: FabPosition): void {
  writeJson(KEY_FAB_POSITION, position)
}

export function loadCurrentConversationId(): string | null {
  return localStorage.getItem(KEY_CURRENT_ID)
}

export function saveCurrentConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(KEY_CURRENT_ID, id)
  } else {
    localStorage.removeItem(KEY_CURRENT_ID)
  }
}
