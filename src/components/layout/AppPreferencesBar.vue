<script setup lang="ts">
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import LangToggle from '@/components/layout/LangToggle.vue'

withDefaults(
  defineProps<{
    fixed?: boolean
  }>(),
  {
    fixed: false,
  },
)
</script>

<template>
  <div class="app-preferences-bar" :class="{ 'is-fixed': fixed }">
    <ThemeToggle />
    <LangToggle />
  </div>
</template>

<style scoped lang="scss">
.app-preferences-bar {
  display: flex;
  align-items: center;
  gap: 4px;

  &.is-fixed {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    padding: 4px 8px;
    border-radius: var(--radius-base);
    background: var(--header-bg);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  }
}
</style>
