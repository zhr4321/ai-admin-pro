<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import { useAiChatStore } from '@/stores/aiChat'
import type { StoredConversation } from '@/types/aiChat'

const store = useAiChatStore()
const editingId = ref<string | null>(null)
const editingTitle = ref('')

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60_000) return '刚刚'

  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function selectConversation(id: string) {
  if (editingId.value) return
  store.selectConversation(id)
}

async function startRename(item: StoredConversation, event: Event) {
  event.stopPropagation()
  editingId.value = item.id
  editingTitle.value = item.title
  await nextTick()
  const input = document.querySelector(
    '.ai-chat-sidebar__title-input input',
  ) as HTMLInputElement | null
  input?.focus()
  input?.select()
}

function commitRename(id: string) {
  if (editingId.value !== id) return
  store.renameConversation(id, editingTitle.value)
  editingId.value = null
  editingTitle.value = ''
}

function cancelRename() {
  editingId.value = null
  editingTitle.value = ''
}

function onRenameKeydown(event: KeyboardEvent, id: string) {
  if (event.key === 'Enter') {
    event.preventDefault()
    commitRename(id)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRename()
  }
}
</script>

<template>
  <aside class="ai-chat-sidebar">
    <div class="ai-chat-sidebar__header">
      <el-button type="primary" style="width: 100%" @click="store.createConversation()">
        <el-icon><Plus /></el-icon>
        新对话
      </el-button>
    </div>

    <div class="ai-chat-sidebar__list">
      <div v-if="store.conversations.length === 0" class="ai-chat-sidebar__empty">
        暂无对话，点击上方新对话开始
      </div>

      <div
        v-for="item in store.conversations"
        :key="item.id"
        class="ai-chat-sidebar__item"
        :class="{ 'ai-chat-sidebar__item--active': item.id === store.currentConversationId }"
        @click="selectConversation(item.id)"
      >
        <div class="ai-chat-sidebar__item-main">
          <el-input
            v-if="editingId === item.id"
            v-model="editingTitle"
            size="small"
            maxlength="30"
            show-word-limit
            class="ai-chat-sidebar__title-input"
            @click.stop
            @keydown="onRenameKeydown($event, item.id)"
            @blur="commitRename(item.id)"
          />
          <div v-else class="ai-chat-sidebar__title">{{ item.title }}</div>
          <div class="ai-chat-sidebar__time">{{ formatTime(item.updatedAt) }}</div>
        </div>

        <div v-if="editingId !== item.id" class="ai-chat-sidebar__actions" @click.stop>
          <el-tooltip content="重命名" placement="top" popper-class="ai-chat-popper">
            <button
              type="button"
              class="ai-chat-sidebar__action"
              aria-label="重命名"
              @click="startRename(item, $event)"
            >
              <el-icon :size="14"><Edit /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" popper-class="ai-chat-popper">
            <button
              type="button"
              class="ai-chat-sidebar__action ai-chat-sidebar__action--danger"
              aria-label="删除对话"
              @click="store.deleteConversation(item.id)"
            >
              <el-icon :size="14"><Delete /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </aside>
</template>
