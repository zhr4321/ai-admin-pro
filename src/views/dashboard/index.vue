<script setup lang="ts">
import { User, Document, Setting, DataLine } from '@element-plus/icons-vue'

const stats = [
  { title: '用户总数', value: '1,280', icon: User, color: '#409eff' },
  { title: '今日访问', value: '356', icon: DataLine, color: '#67c23a' },
  { title: '文档数量', value: '89', icon: Document, color: '#e6a23c' },
  { title: '系统消息', value: '12', icon: Setting, color: '#f56c6c' },
]
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col v-for="item in stats" :key="item.title" :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">{{ item.title }}</p>
              <p class="stat-value">{{ item.value }}</p>
            </div>
            <el-icon class="stat-icon" :style="{ color: item.color }">
              <component :is="item.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" shadow="never">
      <template #header>
        <span>欢迎使用 AI Admin Pro</span>
      </template>
      <p>这是一个基于 Vue 3 + TypeScript + Element Plus 的后台管理系统脚手架。</p>
      <p>后续将逐步完善：登录鉴权、RBAC 权限、表格 CRUD、表单、图表等功能模块。</p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    margin-bottom: 20px;

    .stat-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-title {
      margin: 0 0 8px;
      color: #909399;
      font-size: 14px;
    }

    .stat-value {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #303133;
    }

    .stat-icon {
      font-size: 48px;
      opacity: 0.8;
    }
  }

  .welcome-card {
    p {
      margin: 0 0 8px;
      color: #606266;
      line-height: 1.8;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
