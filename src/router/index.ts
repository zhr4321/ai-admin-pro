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
          meta: { title: '首页', requiresAuth: true },
        },
        {
          path: 'role',
          name: 'Role',
          component: () => import('@/views/role/index.vue'),
          meta: { title: '用户权限', requiresAuth: true },
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
