<script setup lang="ts">
import { ref, watch } from 'vue'
import { Promotion, VideoPause } from '@element-plus/icons-vue'
import { useAiChatStore } from '@/stores/aiChat'

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
        placeholder="输入问题，Enter 发送，Shift+Enter 换行"
        @keydown="onKeydown"
      />

      <div class="ai-chat-input__actions">
        <button
          v-if="store.isStreaming"
          type="button"
          class="ai-chat-input__btn ai-chat-input__btn--stop"
          aria-label="停止生成"
          @click="handleStop"
        >
          <el-icon><VideoPause /></el-icon>
        </button>
        <button
          v-else
          type="button"
          class="ai-chat-input__btn"
          aria-label="发送"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>
  </footer>
</template>
