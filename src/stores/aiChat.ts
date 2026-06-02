import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAiChatStream } from '@/composables/useAiChatStream'
import {
  AI_CHAT_DEFAULT_TITLE,
  AI_CHAT_FALLBACK_ERROR,
  createConversationId,
  createMessageId,
  truncateTitle,
  type ChatMessage,
  type FabPosition,
  type StoredConversation,
} from '@/types/aiChat'
import {
  loadConversations,
  loadCurrentConversationId,
  loadFabPosition,
  saveConversations,
  saveCurrentConversationId,
  saveFabPosition,
} from '@/utils/aiChatStorage'

export const useAiChatStore = defineStore('aiChat', () => {
  const conversations = ref<StoredConversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const drawerOpen = ref(false)
  const editingMessageId = ref<string | null>(null)
  const fabPosition = ref<FabPosition | null>(null)
  const contentVersion = ref(0)

  const { isStreaming, startStream, stopStream } = useAiChatStream()

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value) ?? null,
  )

  const currentMessages = computed(() => currentConversation.value?.messages ?? [])

  function persist() {
    saveConversations(conversations.value)
    saveCurrentConversationId(currentConversationId.value)
  }

  function bumpContent() {
    contentVersion.value += 1
  }

  function initFromStorage() {
    conversations.value = loadConversations()
    currentConversationId.value = loadCurrentConversationId()
    fabPosition.value = loadFabPosition()

    if (
      currentConversationId.value &&
      !conversations.value.some((c) => c.id === currentConversationId.value)
    ) {
      currentConversationId.value = conversations.value[0]?.id ?? null
    }

    if (conversations.value.length > 0) {
      persist()
    }
  }

  function setFabPosition(position: FabPosition) {
    fabPosition.value = position
    saveFabPosition(position)
  }

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function selectConversation(id: string) {
    currentConversationId.value = id
    editingMessageId.value = null
    persist()
  }

  function createConversation() {
    const now = Date.now()
    const conv: StoredConversation = {
      id: createConversationId(),
      title: AI_CHAT_DEFAULT_TITLE,
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    conversations.value.unshift(conv)
    currentConversationId.value = conv.id
    editingMessageId.value = null
    persist()
    return conv.id
  }

  async function deleteConversation(id: string) {
    try {
      await ElMessageBox.confirm('确定删除该对话吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'ai-chat-message-box',
        modalClass: 'ai-chat-modal',
      })
    } catch {
      return
    }

    const index = conversations.value.findIndex((c) => c.id === id)
    if (index === -1) return

    conversations.value.splice(index, 1)

    if (currentConversationId.value === id) {
      currentConversationId.value = conversations.value[0]?.id ?? null
      editingMessageId.value = null
    }

    persist()
  }

  function renameConversation(id: string, rawTitle: string) {
    const conv = getConversationById(id)
    if (!conv) return

    const title = rawTitle.trim()
    if (!title) {
      ElMessage.warning('对话名称不能为空')
      return
    }

    conv.title = truncateTitle(title, 30)
    conv.updatedAt = Date.now()
    persist()
  }

  function ensureConversation(): string {
    if (currentConversationId.value) {
      const exists = conversations.value.some((c) => c.id === currentConversationId.value)
      if (exists) return currentConversationId.value
    }
    return createConversation()
  }

  function getConversationById(id: string): StoredConversation | undefined {
    return conversations.value.find((c) => c.id === id)
  }

  function buildStreamMessages(messages: ChatMessage[]) {
    return messages
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.status === 'done' && m.content))
      .map((m) => ({ role: m.role, content: m.content }))
  }

  async function runAssistantStream(conversationId: string, assistantId: string) {
    const conv = getConversationById(conversationId)
    if (!conv) return

    const assistantMsg = conv.messages.find((m) => m.id === assistantId)
    if (!assistantMsg) return

    const streamMessages = buildStreamMessages(
      conv.messages.filter((m) => m.id !== assistantId),
    )

    const result = await startStream(
      { conversationId, messages: streamMessages },
      (chunk) => {
        assistantMsg.content += chunk
        conv.updatedAt = Date.now()
        bumpContent()
        persist()
      },
    )

    if (result.status === 'aborted') {
      assistantMsg.status = 'aborted'
      persist()
      return
    }

    if (result.status === 'error') {
      assistantMsg.content = ''
      assistantMsg.status = 'error'
      assistantMsg.errorMessage = result.message || AI_CHAT_FALLBACK_ERROR
      persist()
      return
    }

    assistantMsg.status = 'done'
    conv.updatedAt = Date.now()
    persist()
  }

  async function sendMessage(rawText: string) {
    const text = rawText.trim()
    if (!text || isStreaming.value) return

    const conversationId = ensureConversation()
    const conv = getConversationById(conversationId)
    if (!conv) return

    if (editingMessageId.value) {
      const editIndex = conv.messages.findIndex((m) => m.id === editingMessageId.value)
      if (editIndex !== -1) {
        conv.messages.splice(editIndex)
      }
      editingMessageId.value = null
    }

    const userMsg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
    }
    const assistantMsg: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    }

    conv.messages.push(userMsg, assistantMsg)

    if (conv.title === AI_CHAT_DEFAULT_TITLE) {
      conv.title = truncateTitle(text)
    }
    conv.updatedAt = Date.now()
    bumpContent()
    persist()

    await runAssistantStream(conversationId, assistantMsg.id)
  }

  function stopStreaming() {
    if (!isStreaming.value) return
    stopStream()

    const conv = currentConversation.value
    if (!conv) return

    const streamingMsg = [...conv.messages].reverse().find((m) => m.status === 'streaming')
    if (streamingMsg) {
      streamingMsg.status = 'aborted'
      persist()
    }
  }

  function editMessage(messageId: string) {
    if (isStreaming.value) return
    const conv = currentConversation.value
    if (!conv) return
    const msg = conv.messages.find((m) => m.id === messageId && m.role === 'user')
    if (!msg) return
    editingMessageId.value = messageId
  }

  function getEditingContent(): string {
    if (!editingMessageId.value) return ''
    const conv = currentConversation.value
    const msg = conv?.messages.find((m) => m.id === editingMessageId.value)
    return msg?.content ?? ''
  }

  function clearEditing() {
    editingMessageId.value = null
  }

  async function regenerateMessage(assistantId: string) {
    if (isStreaming.value) return
    const conv = currentConversation.value
    if (!conv) return

    const assistantIndex = conv.messages.findIndex((m) => m.id === assistantId)
    if (assistantIndex === -1) return

    const userMsg = [...conv.messages.slice(0, assistantIndex)]
      .reverse()
      .find((m) => m.role === 'user')
    if (!userMsg) return

    conv.messages.splice(assistantIndex, 1)

    const assistantMsg: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    }
    conv.messages.push(assistantMsg)
    conv.updatedAt = Date.now()
    bumpContent()
    persist()

    await runAssistantStream(conv.id, assistantMsg.id)
  }

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content)
      ElMessage.success('已复制')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    drawerOpen,
    isStreaming,
    editingMessageId,
    fabPosition,
    contentVersion,
    initFromStorage,
    setFabPosition,
    openDrawer,
    closeDrawer,
    selectConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stopStreaming,
    editMessage,
    getEditingContent,
    clearEditing,
    regenerateMessage,
    copyMessage,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAiChatStore, import.meta.hot))
}
