<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import AppPreferencesBar from '@/components/layout/AppPreferencesBar.vue'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456',
})

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }],
}))

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login({
        username: form.username,
        password: form.password,
      })
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } catch {
      // 错误由 axios 拦截器统一提示
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-page">
    <AppPreferencesBar fixed />
    <div class="login-card">
      <h1 class="login-title">{{ t('layout.appName') }}</h1>
      <p class="login-subtitle">{{ t('login.subtitle') }}</p>
      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :placeholder="t('login.username')"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('login.password')"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            {{ t('login.submit') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #0e42d2 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--card-bg);
  border-radius: var(--radius-base);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.login-title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: 600;
  line-height: var(--line-height-title);
  text-align: center;
  color: var(--text-dark);
}

.login-subtitle {
  margin: 8px 0 32px;
  text-align: center;
  color: var(--text-light);
  font-size: var(--font-size-caption);
  line-height: var(--line-height-body);
}

.login-btn {
  width: 100%;
}
</style>
