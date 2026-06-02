<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuInstance } from 'element-plus'
import {
  Expand,
  Fold,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import { isMenuGroup, MENU_ITEMS, type MenuItemConfig } from '@/config/modules'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const menuRef = ref<MenuInstance>()
const isCollapse = ref(false)
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const visibleMenuItems = computed<MenuItemConfig[]>(() => {
  const result: MenuItemConfig[] = []

  for (const item of MENU_ITEMS) {
    if (!isMenuGroup(item)) {
      if (userStore.hasModuleView(item.moduleKey)) {
        result.push(item)
      }
      continue
    }

    const children = item.children.filter((child) =>
      userStore.hasModuleView(child.moduleKey),
    )
    if (children.length > 0) {
      result.push({ ...item, children })
    }
  }

  return result
})

function syncOpenedSubMenuByRoute() {
  if (!menuRef.value) {
    return
  }

  for (const item of visibleMenuItems.value) {
    if (isMenuGroup(item) && item.children.some((child) => child.path === route.path)) {
      menuRef.value.open(item.title)
      return
    }
  }
}

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleLogout() {
  userStore.logout()
}

function goProfile() {
  router.push('/profile')
}

function syncCollapseByViewport() {
  isCollapse.value = window.innerWidth < 768
}

watch(() => route.path, syncOpenedSubMenuByRoute)

onMounted(() => {
  syncCollapseByViewport()
  window.addEventListener('resize', syncCollapseByViewport)
  syncOpenedSubMenuByRoute()
})

onUnmounted(() => {
  window.removeEventListener('resize', syncCollapseByViewport)
})
</script>

<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <span v-if="!isCollapse">AI Admin Pro</span>
        <span v-else>A</span>
      </div>
      <el-menu
        ref="menuRef"
        class="layout-menu"
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        :unique-opened="true"
        router
        background-color="var(--sidebar-bg)"
        text-color="var(--sidebar-text)"
        active-text-color="var(--sidebar-active)"
      >
        <template v-for="item in visibleMenuItems">
          <el-menu-item v-if="!isMenuGroup(item)" :key="item.path" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
          <el-sub-menu v-else :key="`group-${item.title}`" :index="item.title">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon><component :is="child.icon" /></el-icon>
              <template #title>{{ child.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <el-icon class="collapse-btn" @click="toggleCollapse">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar || undefined">
                {{ userStore.avatarText }}
              </el-avatar>
              <span class="username">{{ userStore.displayName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="User" @click="goProfile">个人信息</el-dropdown-item>
                <el-dropdown-item :icon="SwitchButton" @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-aside {
  overflow: hidden;
  background-color: var(--sidebar-bg);
  transition: width 0.3s;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    color: #fff;
    font-size: var(--font-size-title);
    font-weight: 600;
    line-height: var(--line-height-title);
    background-color: var(--sidebar-bg-dark);
  }

  .layout-menu {
    border-right: none;

    :deep(.el-sub-menu__title) {
      position: relative;
      z-index: 1;
    }

    :deep(.el-menu--inline) {
      position: relative;
      z-index: 0;
      overflow: hidden;
    }
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    color: var(--text-light);

    &:hover {
      color: var(--primary-color);
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        color: var(--text-dark);
        font-size: var(--font-size-body);
      }
    }
  }
}

.layout-main {
  background: var(--bg-primary);
}

@media (max-width: 1279px) {
  .layout-aside {
    :deep(.el-menu-item) {
      padding: 0 16px;
    }
  }
}
</style>
