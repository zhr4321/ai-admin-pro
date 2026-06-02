import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuard } from './guard'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { titleKey: 'menu.login', requiresAuth: false },
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
          meta: { titleKey: 'menu.dashboard', requiresAuth: true, moduleKey: 'dashboard' },
        },
        {
          path: 'role',
          name: 'Role',
          component: () => import('@/views/role/index.vue'),
          meta: { titleKey: 'menu.role', requiresAuth: true, moduleKey: 'role' },
        },
        {
          path: 'operations/campaign',
          name: 'OperationsCampaign',
          component: () => import('@/views/operations/campaign/index.vue'),
          meta: { titleKey: 'menu.campaign', requiresAuth: true, moduleKey: 'campaign' },
        },
        {
          path: 'operations/notice',
          name: 'OperationsNotice',
          component: () => import('@/views/operations/notice/index.vue'),
          meta: { titleKey: 'menu.notice', requiresAuth: true, moduleKey: 'notice' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/index.vue'),
          meta: { titleKey: 'menu.system', requiresAuth: true, moduleKey: 'system' },
        },
        {
          path: 'merchant/onboarding',
          name: 'MerchantOnboarding',
          component: () => import('@/views/merchant/onboarding/index.vue'),
          meta: { titleKey: 'menu.merchant', requiresAuth: true, moduleKey: 'merchant' },
        },
        {
          path: 'data-center/visualization',
          name: 'DataVisualization',
          component: () => import('@/views/data-center/visualization/index.vue'),
          meta: { titleKey: 'menu.visualization', requiresAuth: true, moduleKey: 'visualization' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/profile/index.vue'),
          meta: { titleKey: 'menu.profile', requiresAuth: true },
        },
      ],
    },
  ],
})

setupRouterGuard(router)

export default router
