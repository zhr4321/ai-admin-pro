<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Monitor, Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore, type ThemeMode } from '@/stores/app'

const { t } = useI18n()
const appStore = useAppStore()

const themeOptions: { value: ThemeMode; icon: typeof Sunny; labelKey: string }[] = [
  { value: 'light', icon: Sunny, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'auto', icon: Monitor, labelKey: 'theme.auto' },
]

const currentIcon = computed(() => {
  const resolved = appStore.resolvedTheme
  if (appStore.theme === 'auto') return Monitor
  return resolved === 'dark' ? Moon : Sunny
})

function handleSelect(mode: ThemeMode) {
  appStore.setTheme(mode)
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleSelect">
    <el-button class="header-icon-btn" :title="t('theme.toggle')" text circle>
      <el-icon :size="18">
        <component :is="currentIcon" />
      </el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in themeOptions"
          :key="item.value"
          :command="item.value"
          :class="{ 'is-active': appStore.theme === item.value }"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          {{ t(item.labelKey) }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.header-icon-btn {
  color: var(--text-light);

  &:hover {
    color: var(--primary-color);
  }
}

:deep(.el-dropdown-menu__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
