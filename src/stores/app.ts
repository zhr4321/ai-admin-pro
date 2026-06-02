import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { i18n } from '@/locales'
import type { AppLocale } from '@/locales'

export type { AppLocale }

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_KEY = 'app-theme'
const LOCALE_KEY = 'app-locale'

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }
  return 'light'
}

function readStoredLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'zh-CN' || stored === 'en') {
    return stored
  }
  return 'zh-CN'
}

function resolveDarkMode(theme: ThemeMode): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemeToDom(theme: ThemeMode) {
  const isDark = resolveDarkMode(theme)
  const resolved = isDark ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', resolved)
}

let mediaQuery: MediaQueryList | null = null
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null

export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>(readStoredTheme())
  const locale = ref<AppLocale>(readStoredLocale())

  const resolvedTheme = computed<'light' | 'dark'>(() =>
    resolveDarkMode(theme.value) ? 'dark' : 'light',
  )

  function bindSystemThemeListener() {
    unbindSystemThemeListener()
    if (theme.value !== 'auto') return

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaListener = () => applyThemeToDom('auto')
    mediaQuery.addEventListener('change', mediaListener)
  }

  function unbindSystemThemeListener() {
    if (mediaQuery && mediaListener) {
      mediaQuery.removeEventListener('change', mediaListener)
    }
    mediaQuery = null
    mediaListener = null
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem(THEME_KEY, mode)
    applyThemeToDom(mode)
    bindSystemThemeListener()
  }

  function setLocale(lang: AppLocale) {
    locale.value = lang
    localStorage.setItem(LOCALE_KEY, lang)
    i18n.global.locale.value = lang
    document.documentElement.lang = lang
  }

  function initPreferences() {
    applyThemeToDom(theme.value)
    i18n.global.locale.value = locale.value
    document.documentElement.lang = locale.value
    bindSystemThemeListener()
  }

  return {
    theme,
    locale,
    resolvedTheme,
    setTheme,
    setLocale,
    initPreferences,
  }
})
