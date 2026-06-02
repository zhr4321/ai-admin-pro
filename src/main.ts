import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/variables.scss'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import './style.css'

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { startMockWorker } = await import('@/mocks')
    await startMockWorker()
  }

  const app = createApp(App)

  app.use(createPinia())
  app.use(i18n)
  app.use(router)
  app.use(ElementPlus)
  app.mount('#app')
}

bootstrap()
