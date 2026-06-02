<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAiChatStore } from '@/stores/aiChat'
import { useChatScroll } from '@/composables/useChatScroll'
import AiChatMessageItem from './AiChatMessageItem.vue'

const store = useAiChatStore()
const containerRef = ref<HTMLElement | null>(null)

const messageCount = computed(() => store.currentMessages.length)

const chatScroll = useChatScroll(
  messageCount,
  computed(() => store.contentVersion),
  containerRef,
)

onMounted(() => {
  chatScroll.observeResize()
})

onUnmounted(() => {
  chatScroll.unobserveResize()
})
</script>

<template>
  <div class="ai-chat-messages-wrap">
    <div ref="containerRef" class="ai-chat-messages" @scroll="chatScroll.handleScroll">
      <div v-if="messageCount === 0" class="ai-chat-messages__empty">
        你好，有什么可以帮你的？
      </div>

      <AiChatMessageItem
        v-for="message in store.currentMessages"
        :key="message.id"
        :message="message"
      />
    </div>

    <div v-if="chatScroll.showScrollToBottom" class="ai-chat-messages__scroll-btn">
      <el-tooltip content="回到底部" placement="top" popper-class="ai-chat-popper">
        <el-button circle :icon="ArrowDown" aria-label="回到底部" @click="chatScroll.scrollToBottom(true)" />
      </el-tooltip>
    </div>
  </div>
</template>
