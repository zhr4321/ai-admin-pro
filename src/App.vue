<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { locale } = useI18n()

const elementLocale = computed(() => (locale.value === 'en' ? en : zhCn))

onMounted(() => {
  appStore.initPreferences()
})
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>
