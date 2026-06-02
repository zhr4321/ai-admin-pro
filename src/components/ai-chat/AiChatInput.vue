<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Promotion, VideoPause } from '@element-plus/icons-vue'
import { useAiChatStore } from '@/stores/aiChat'

const { t } = useI18n()
const store = useAiChatStore()
const inputText = ref('')

watch(
  () => store.editingMessageId,
  (id) => {
    if (id) {
      inputText.value = store.getEditingContent()
    }
  },
)

watch(
  () => store.currentConversationId,
  () => {
    if (!store.editingMessageId) {
      inputText.value = ''
    }
  },
)

async function handleSend() {
  const text = inputText.value
  if (!text.trim() || store.isStreaming) return

  inputText.value = ''
  store.clearEditing()
  await store.sendMessage(text)
}

function handleStop() {
  store.stopStreaming()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void handleSend()
  }
}
</script>

<template>
  <footer class="ai-chat-input">
    <div class="ai-chat-input__wrap">
      <el-input
        v-model="inputText"
        class="ai-chat-input__textarea"
        type="textarea"
        :rows="3"
        :disabled="store.isStreaming"
        :placeholder="t('aiChat.inputPlaceholder')"
        @keydown="onKeydown"
      />

      <div class="ai-chat-input__actions">
        <button
          v-if="store.isStreaming"
          type="button"
          class="ai-chat-input__btn ai-chat-input__btn--stop"
          :aria-label="t('aiChat.stopGenerate')"
          @click="handleStop"
        >
          <el-icon><VideoPause /></el-icon>
        </button>
        <button
          v-else
          type="button"
          class="ai-chat-input__btn"
          :aria-label="t('aiChat.send')"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>
  </footer>
</template>
