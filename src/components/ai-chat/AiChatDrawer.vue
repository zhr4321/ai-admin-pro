<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAiChatStore } from '@/stores/aiChat'
import AiChatSidebar from './AiChatSidebar.vue'
import AiChatMessages from './AiChatMessages.vue'
import AiChatInput from './AiChatInput.vue'
import { Close } from '@element-plus/icons-vue'

const { t } = useI18n()
const store = useAiChatStore()
const isEntered = ref(false)
const isClosing = ref(false)

function close() {
  isClosing.value = true
  isEntered.value = false
  window.setTimeout(() => {
    store.closeDrawer()
    isClosing.value = false
  }, 300)
}

function onOverlayClick() {
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  void nextTick(() => {
    requestAnimationFrame(() => {
      isEntered.value = true
    })
  })
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="ai-chat-overlay"
      :class="{ 'ai-chat-overlay--visible': isEntered && !isClosing }"
      @click="onOverlayClick"
    />

    <aside
      class="ai-chat-drawer"
      :class="{
        'ai-chat-drawer--open': isEntered && !isClosing,
        'ai-chat-drawer--closing': isClosing,
      }"
      @click.stop
    >
      <AiChatSidebar />

      <section class="ai-chat-main">
        <header class="ai-chat-header">
          <span class="ai-chat-header__title">{{ t('aiChat.title') }}</span>
          <button type="button" class="ai-chat-header__close" :aria-label="t('aiChat.close')" @click="close">
            <el-icon :size="20"><Close /></el-icon>
          </button>
        </header>

        <AiChatMessages />
        <AiChatInput />
      </section>
    </aside>
  </Teleport>
</template>
