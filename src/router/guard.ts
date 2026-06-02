import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { i18n } from '@/locales'
import { TOKEN_KEY } from '@/api/request'
import { useUserStore } from '@/stores/user'
import { preloadFormRouteChunks } from '@/utils/preloadRoutes'

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore()
    const hasToken = !!(userStore.token || localStorage.getItem(TOKEN_KEY))

    if (to.path === '/login') {
      if (hasToken) {
        const redirect = (to.query.redirect as string) || '/dashboard'
        return next(redirect)
      }
      return next()
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    if (!requiresAuth) {
      return next()
    }

    if (!hasToken) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
        preloadFormRouteChunks()
      } catch {
        await userStore.logout(false)
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
    }

    const moduleKey = to.meta.moduleKey
    if (moduleKey && !userStore.hasModuleView(moduleKey)) {
      ElMessage.warning(i18n.global.t('errors.noPermission'))
      if (to.path === '/dashboard') {
        return next('/login')
      }
      return next('/dashboard')
    }

    next()
  })
}
