<!--
  AI Chat 组件结构参考模板（非可运行页）
  实现时拆分为独立 SFC，挂载于 layout/index.vue
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useAiChatStore } from '@/stores/aiChat'
import AiChatDrawer from '@/components/ai-chat/AiChatDrawer.vue'

const store = useAiChatStore()
const showFab = computed(() => !store.drawerOpen)

function openDrawer() {
  store.drawerOpen = true
}
</script>

<template>
  <!-- AiChatFab：56px 圆形 FAB，可拖拽，drawerOpen 时隐藏 -->
  <button
    v-show="showFab"
    type="button"
    class="ai-chat-fab"
    aria-label="打开 AI 助手"
    @click="openDrawer"
  >
    <!-- ChatDotRound -->
  </button>

  <!-- AiChatDrawer：Teleport body，遮罩 + 右滑抽屉 -->
  <AiChatDrawer v-if="store.drawerOpen">
    <!-- AiChatSidebar：260px 会话列表 -->
    <aside class="ai-chat-sidebar">
      <!-- 新对话按钮 -->
      <!-- 会话列表 v-for -->
    </aside>

    <!-- 右侧对话区 -->
    <section class="ai-chat-main">
      <header class="ai-chat-header">
        <span>AI 助手</span>
        <!-- Close 关闭 -->
      </header>

      <!-- AiChatMessages：消息列表 + 回底按钮 -->
      <div class="ai-chat-messages">
        <!-- AiChatMessageItem v-for -->
      </div>

      <!-- AiChatInput：textarea + 发送/停止 -->
      <footer class="ai-chat-input">
        <!-- el-input textarea + Promotion / VideoPause -->
      </footer>
    </section>
  </AiChatDrawer>
</template>

<!-- 样式见 src/styles/ai-chat.scss -->
