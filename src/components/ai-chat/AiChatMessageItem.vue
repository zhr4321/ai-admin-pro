<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Edit, RefreshRight } from '@element-plus/icons-vue'
import { renderMarkdown } from '@/utils/markdown'
import { useAiChatStore } from '@/stores/aiChat'
import type { ChatMessage } from '@/types/aiChat'

const props = defineProps<{
  message: ChatMessage
}>()

const { t } = useI18n()
const store = useAiChatStore()

const isUser = computed(() => props.message.role === 'user')
const isError = computed(() => props.message.status === 'error')
const isStreaming = computed(() => props.message.status === 'streaming')

const displayHtml = computed(() => {
  if (isUser.value || isError.value) return ''
  return renderMarkdown(props.message.content)
})

const errorText = computed(
  () => props.message.errorMessage || t('aiChat.fallbackError'),
)

const showActions = computed(() => !store.isStreaming || props.message.status !== 'streaming')
</script>

<template>
  <div
    class="ai-chat-message"
    :class="{
      'ai-chat-message--user': isUser,
      'ai-chat-message--assistant': !isUser,
      'ai-chat-message--error': isError,
    }"
  >
    <div class="ai-chat-message__bubble">
      <template v-if="isUser">{{ message.content }}</template>
      <template v-else-if="isError">{{ errorText }}</template>
      <div v-else class="ai-chat-markdown" v-html="displayHtml" />
      <span v-if="isStreaming" class="ai-chat-message__cursor" />
    </div>

    <div v-if="showActions" class="ai-chat-message__actions">
      <template v-if="isUser">
        <el-tooltip :content="t('aiChat.copy')" placement="top" popper-class="ai-chat-popper">
          <button
            type="button"
            class="ai-chat-message__action"
            :disabled="store.isStreaming"
            :aria-label="t('aiChat.copy')"
            @click="store.copyMessage(message.content)"
          >
            <el-icon :size="16"><CopyDocument /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip :content="t('aiChat.edit')" placement="top" popper-class="ai-chat-popper">
          <button
            type="button"
            class="ai-chat-message__action"
            :disabled="store.isStreaming"
            :aria-label="t('aiChat.edit')"
            @click="store.editMessage(message.id)"
          >
            <el-icon :size="16"><Edit /></el-icon>
          </button>
        </el-tooltip>
      </template>
      <template v-else>
        <el-tooltip :content="t('aiChat.regenerate')" placement="top" popper-class="ai-chat-popper">
          <button
            type="button"
            class="ai-chat-message__action"
            :disabled="store.isStreaming"
            :aria-label="t('aiChat.regenerate')"
            @click="store.regenerateMessage(message.id)"
          >
            <el-icon :size="16"><RefreshRight /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip :content="t('aiChat.copy')" placement="top" popper-class="ai-chat-popper">
          <button
            type="button"
            class="ai-chat-message__action"
            :disabled="store.isStreaming || isError"
            :aria-label="t('aiChat.copy')"
            @click="store.copyMessage(message.content)"
          >
            <el-icon :size="16"><CopyDocument /></el-icon>
          </button>
        </el-tooltip>
      </template>
    </div>
  </div>
</template>
