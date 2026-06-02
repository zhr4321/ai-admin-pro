<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useAiChatStore } from '@/stores/aiChat'
import AiChatDrawer from './AiChatDrawer.vue'

const FAB_SIZE = 56
const DRAG_THRESHOLD = 5
const DEFAULT_MARGIN = 24

const store = useAiChatStore()
const fabRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragMoved = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0 })

const fabStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}))

function clampPosition(x: number, y: number) {
  const maxX = window.innerWidth - FAB_SIZE
  const maxY = window.innerHeight - FAB_SIZE
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  }
}

function initPosition() {
  if (store.fabPosition) {
    position.value = clampPosition(store.fabPosition.x, store.fabPosition.y)
    return
  }
  position.value = clampPosition(
    window.innerWidth - FAB_SIZE - DEFAULT_MARGIN,
    window.innerHeight - FAB_SIZE - DEFAULT_MARGIN,
  )
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  isDragging.value = true
  dragMoved.value = false
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y,
  }
  fabRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value) return
  const next = clampPosition(
    event.clientX - dragOffset.value.x,
    event.clientY - dragOffset.value.y,
  )
  if (
    Math.abs(next.x - position.value.x) > DRAG_THRESHOLD ||
    Math.abs(next.y - position.value.y) > DRAG_THRESHOLD
  ) {
    dragMoved.value = true
  }
  position.value = next
}

function onPointerUp(event: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  fabRef.value?.releasePointerCapture(event.pointerId)
  store.setFabPosition(position.value)

  if (!dragMoved.value) {
    store.openDrawer()
  }
}

function onWindowResize() {
  position.value = clampPosition(position.value.x, position.value.y)
  store.setFabPosition(position.value)
}

onMounted(() => {
  store.initFromStorage()
  initPosition()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <button
    v-show="!store.drawerOpen"
    ref="fabRef"
    type="button"
    class="ai-chat-fab"
    aria-label="打开 AI 助手"
    :style="fabStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <el-icon><ChatDotRound /></el-icon>
  </button>

  <AiChatDrawer v-if="store.drawerOpen" />
</template>

<style lang="scss">
@use '@/styles/ai-chat.scss';
</style>
