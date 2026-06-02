<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { User, Document, Setting, DataLine } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { getDashboardStats } from '@/api/dashboard'
import type { DashboardStatItem } from '@/types/dashboard'

const { t } = useI18n()

const iconMap: Record<string, Component> = {
  User,
  DataLine,
  Document,
  Setting,
}

const STAT_TITLE_KEYS: Record<string, string> = {
  用户总数: 'dashboard.stats.userTotal',
  今日访问: 'dashboard.stats.todayVisit',
  文档数量: 'dashboard.stats.docCount',
  系统消息: 'dashboard.stats.systemMsg',
}

const stats = ref<DashboardStatItem[]>([])
const loading = ref(false)

const localizedStats = computed(() =>
  stats.value.map((item) => ({
    ...item,
    title: STAT_TITLE_KEYS[item.title] ? t(STAT_TITLE_KEYS[item.title]) : item.title,
  })),
)

onMounted(async () => {
  loading.value = true
  try {
    const data = await getDashboardStats()
    stats.value = data.stats
  } catch {
    // 错误由 axios 拦截器统一提示
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <el-row :gutter="20">
      <el-col v-for="item in localizedStats" :key="item.title" :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">{{ item.title }}</p>
              <p class="stat-value">{{ item.value }}</p>
            </div>
            <el-icon class="stat-icon" :style="{ color: item.color }">
              <component :is="iconMap[item.icon] || User" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" shadow="never">
      <template #header>
        <span class="welcome-card__title">{{ t('dashboard.welcomeTitle') }}</span>
      </template>
      <p>{{ t('dashboard.welcomeDesc1') }}</p>
      <p>{{ t('dashboard.welcomeDesc2') }}</p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    margin-bottom: 20px;
    border-radius: var(--radius-base);

    .stat-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-title {
      margin: 0 0 8px;
      color: var(--text-light);
      font-size: var(--font-size-body);
      line-height: var(--line-height-body);
    }

    .stat-value {
      margin: 0;
      font-size: var(--font-size-title);
      font-weight: 600;
      line-height: var(--line-height-title);
      color: var(--text-dark);
    }

    .stat-icon {
      font-size: 48px;
      opacity: 0.8;
    }
  }

  .welcome-card {
    border-radius: var(--radius-base);

    &__title {
      font-size: var(--font-size-title);
      font-weight: 600;
      color: var(--text-dark);
    }

    p {
      margin: 0 0 8px;
      color: var(--text-dark);
      font-size: var(--font-size-body);
      line-height: var(--line-height-body);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
