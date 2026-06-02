import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuard } from './guard'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', requiresAuth: true, moduleKey: 'dashboard' },
        },
        {
          path: 'role',
          name: 'Role',
          component: () => import('@/views/role/index.vue'),
          meta: { title: '用户权限', requiresAuth: true, moduleKey: 'role' },
        },
        {
          path: 'operations/campaign',
          name: 'OperationsCampaign',
          component: () => import('@/views/operations/campaign/index.vue'),
          meta: { title: '活动推广', requiresAuth: true, moduleKey: 'campaign' },
        },
        {
          path: 'operations/notice',
          name: 'OperationsNotice',
          component: () => import('@/views/operations/notice/index.vue'),
          meta: { title: '公告管理', requiresAuth: true, moduleKey: 'notice' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/index.vue'),
          meta: { title: '系统设置', requiresAuth: true, moduleKey: 'system' },
        },
        {
          path: 'merchant/onboarding',
          name: 'MerchantOnboarding',
          component: () => import('@/views/merchant/onboarding/index.vue'),
          meta: { title: '商户入驻', requiresAuth: true, moduleKey: 'merchant' },
        },
        {
          path: 'data-center/visualization',
          name: 'DataVisualization',
          component: () => import('@/views/data-center/visualization/index.vue'),
          meta: { title: '数据可视化', requiresAuth: true, moduleKey: 'visualization' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/profile/index.vue'),
          meta: { title: '个人信息', requiresAuth: true },
        },
      ],
    },
  ],
})

setupRouterGuard(router)

export default router
