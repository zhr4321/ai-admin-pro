<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import type { AppLocale } from '@/locales'

const { t } = useI18n()
const appStore = useAppStore()

const langOptions: { value: AppLocale; labelKey: string }[] = [
  { value: 'zh-CN', labelKey: 'lang.zhCN' },
  { value: 'en', labelKey: 'lang.en' },
]

const currentLabel = computed(() =>
  appStore.locale === 'en' ? t('lang.shortEn') : t('lang.shortZh'),
)

function handleSelect(lang: AppLocale) {
  appStore.setLocale(lang)
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleSelect">
    <el-button class="header-icon-btn lang-btn" :title="t('lang.toggle')" text>
      {{ currentLabel }}
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :command="item.value"
          :class="{ 'is-active': appStore.locale === item.value }"
        >
          {{ t(item.labelKey) }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.header-icon-btn {
  color: var(--text-light);
  min-width: 36px;
  font-weight: 600;

  &:hover {
    color: var(--primary-color);
  }
}

.lang-btn {
  padding: 8px;
}

:deep(.el-dropdown-menu__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
