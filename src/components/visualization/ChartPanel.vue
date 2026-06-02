<script setup lang="ts">
defineProps<{
  title: string
  loading?: boolean
}>()
</script>

<template>
  <div v-loading="loading" class="chart-panel">
    <div class="chart-panel__header">
      <span class="chart-panel__title">{{ title }}</span>
    </div>
    <div class="chart-panel__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
  border: 1px solid var(--viz-panel-border);
  border-radius: var(--radius-base);
  background: var(--viz-panel-bg);
  box-shadow: inset 0 0 24px rgba(22, 93, 255, 0.08);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 0;
  }

  &__title {
    position: relative;
    padding-left: 12px;
    color: var(--viz-text);
    font-size: var(--font-size-body);
    font-weight: 600;
    line-height: var(--line-height-body);

    &::before {
      position: absolute;
      top: 50%;
      left: 0;
      width: 4px;
      height: 14px;
      border-radius: 2px;
      background: linear-gradient(180deg, var(--viz-accent), var(--primary-color));
      transform: translateY(-50%);
      content: '';
    }
  }

  &__body {
    flex: 1;
    min-height: 280px;
    padding: 8px 12px 12px;
  }
}
</style>
