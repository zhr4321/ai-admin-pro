import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { i18n } from '@/locales'
import { login as loginApi, getUserInfo as getUserInfoApi } from '@/api/auth'
import { TOKEN_KEY } from '@/api/request'
import type { LoginParams, UserInfo } from '@/types/auth'
import { preloadFormRouteChunks } from '@/utils/preloadRoutes'
import { canEditModule, canViewModule, getModuleLevel } from '@/utils/permission'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(
    () =>
      userInfo.value?.nickname ||
      userInfo.value?.username ||
      i18n.global.t('common.defaultUser'),
  )
  const avatarText = computed(
    () => displayName.value.charAt(0).toUpperCase(),
  )

  function hasModuleView(moduleKey: string): boolean {
    const level = getModuleLevel(userInfo.value?.permissions, moduleKey)
    return canViewModule(level)
  }

  function hasModuleEdit(moduleKey: string): boolean {
    const level = getModuleLevel(userInfo.value?.permissions, moduleKey)
    return canEditModule(level)
  }

  function setToken(value: string) {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
  }

  function clearAuth() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function login(params: LoginParams) {
    const data = await loginApi(params)
    setToken(data.token)
    await fetchUserInfo()
    preloadFormRouteChunks()
    return data
  }

  async function fetchUserInfo() {
    const data = await getUserInfoApi()
    userInfo.value = data
    return data
  }

  async function logout(redirect = true) {
    clearAuth()
    if (redirect) {
      const { default: router } = await import('@/router')
      await router.push('/login')
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    displayName,
    avatarText,
    setToken,
    clearAuth,
    login,
    fetchUserInfo,
    logout,
    hasModuleView,
    hasModuleEdit,
  }
})
