<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { getSettings, updateSettings, uploadSettingsLogo } from '@/api/settings'
import { useModulePermission } from '@/composables/useModulePermission'
import type { SystemSettings, UpdateSettingsParams } from '@/types/settings'
import { createForbiddenWordRule } from '@/utils/validators'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const { t } = useI18n()
const { canEdit } = useModulePermission('system')

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const isEditing = ref(false)
const settings = ref<SystemSettings | null>(null)
const formRef = ref<FormInstance>()

const editForm = reactive<UpdateSettingsParams>({
  siteName: '',
  logoUrl: '',
  icpNumber: '',
  contactEmail: '',
  maintenanceMode: false,
  maintenanceMessage: '',
})

const rules = computed<FormRules>(() => ({
  siteName: [
    { required: true, message: t('settings.siteNameRequired'), trigger: 'blur' },
    createForbiddenWordRule(t, 'validation.fieldSiteName'),
  ],
  contactEmail: [
    { required: true, message: t('settings.contactEmailRequired'), trigger: 'blur' },
    {
      pattern: EMAIL_PATTERN,
      message: t('settings.contactEmailInvalid'),
      trigger: 'blur',
    },
  ],
  maintenanceMessage: [
    createForbiddenWordRule(t, 'validation.fieldMaintenanceMessage'),
    {
      validator: (_rule, value, callback) => {
        if (editForm.maintenanceMode && !String(value || '').trim()) {
          callback(new Error(t('settings.maintenanceMessageRequired')))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}))

watch(
  () => editForm.maintenanceMode,
  (enabled) => {
    if (!enabled) {
      editForm.maintenanceMessage = ''
      formRef.value?.clearValidate(['maintenanceMessage'])
    }
  },
)

async function loadSettings() {
  loading.value = true
  try {
    settings.value = await getSettings()
  } catch {
    settings.value = null
  } finally {
    loading.value = false
  }
}

function fillEditForm(data: SystemSettings) {
  editForm.siteName = data.siteName
  editForm.logoUrl = data.logoUrl || ''
  editForm.icpNumber = data.icpNumber || ''
  editForm.contactEmail = data.contactEmail
  editForm.maintenanceMode = data.maintenanceMode
  editForm.maintenanceMessage = data.maintenanceMessage || ''
}

function handleEdit() {
  if (!settings.value) return
  fillEditForm(settings.value)
  isEditing.value = true
}

function handleCancel() {
  isEditing.value = false
  formRef.value?.clearValidate()
}

async function handleLogoUpload(options: UploadRequestOptions) {
  if (!canEdit.value) return
  uploading.value = true
  try {
    const { url } = await uploadSettingsLogo(options.file as File)
    editForm.logoUrl = url
    options.onSuccess?.({ url })
    ElMessage.success(t('settings.logoUploadSuccess'))
  } catch {
    options.onError?.(new Error(t('common.uploadFailed')) as never)
  } finally {
    uploading.value = false
  }
}

async function handleSave() {
  if (!canEdit.value || !formRef.value || !settings.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      await updateSettings({
        siteName: editForm.siteName.trim(),
        logoUrl: editForm.logoUrl || undefined,
        icpNumber: editForm.icpNumber?.trim() || '',
        contactEmail: editForm.contactEmail.trim(),
        maintenanceMode: editForm.maintenanceMode,
        maintenanceMessage: editForm.maintenanceMode
          ? editForm.maintenanceMessage?.trim() || ''
          : '',
      })
      await loadSettings()
      isEditing.value = false
      ElMessage.success(t('settings.saveSuccess'))
    } catch {
      // 错误由拦截器处理
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div v-loading="loading" class="form-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="form-card-header">
          <span class="card-title">{{ t('settings.title') }}</span>
          <el-button v-if="canEdit && !isEditing && settings" type="primary" @click="handleEdit">
            {{ t('common.edit') }}
          </el-button>
        </div>
      </template>

      <el-empty
        v-if="!loading && !settings"
        :description="t('settings.loadFailed')"
        class="form-empty"
      />

      <!-- 查看模式 -->
      <div v-else-if="!isEditing && settings" class="form-body">
        <aside class="form-aside">
          <el-image
            v-if="settings.logoUrl"
            :src="settings.logoUrl"
            fit="contain"
            class="settings-logo"
          />
          <div v-else class="settings-logo-placeholder">{{ t('settings.noLogo') }}</div>
          <p class="form-aside-tip">{{ settings.siteName }}</p>
        </aside>

        <main class="form-main">
          <el-descriptions :column="2" border class="form-desc">
            <el-descriptions-item :label="t('settings.siteName')">
              {{ settings.siteName }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('settings.contactEmail')">
              {{ settings.contactEmail }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('settings.icpNumber')">
              {{ settings.icpNumber || '—' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('settings.maintenanceMode')">
              {{
                settings.maintenanceMode
                  ? t('settings.maintenanceModeOn')
                  : t('settings.maintenanceModeOff')
              }}
            </el-descriptions-item>
            <el-descriptions-item
              v-if="settings.maintenanceMode"
              :label="t('settings.maintenanceMessage')"
              :span="2"
            >
              {{ settings.maintenanceMessage || '—' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('settings.lastUpdatedAt')" :span="2">
              {{ settings.updatedAt }}
            </el-descriptions-item>
          </el-descriptions>
        </main>
      </div>

      <!-- 编辑模式 -->
      <div v-else-if="isEditing && settings" class="form-body">
        <aside class="form-aside">
          <el-image
            v-if="editForm.logoUrl"
            :src="editForm.logoUrl"
            fit="contain"
            class="settings-logo"
          />
          <div v-else class="settings-logo-placeholder">{{ t('settings.noLogo') }}</div>
          <el-upload
            v-if="canEdit"
            :show-file-list="false"
            accept="image/*"
            :disabled="uploading"
            :http-request="handleLogoUpload"
          >
            <el-button size="small" :loading="uploading">
              <el-icon><Plus /></el-icon>
              {{ t('settings.changeLogo') }}
            </el-button>
          </el-upload>
          <p class="form-aside-tip">{{ t('settings.logoTip') }}</p>
        </aside>

        <main class="form-main">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="rules"
            label-width="140px"
            class="form-main-form"
          >
            <div class="form-grid">
              <el-form-item :label="t('settings.siteName')" prop="siteName">
                <el-input
                  v-model="editForm.siteName"
                  :placeholder="t('settings.siteNamePlaceholder')"
                  maxlength="64"
                />
              </el-form-item>
              <el-form-item :label="t('settings.contactEmail')" prop="contactEmail">
                <el-input
                  v-model="editForm.contactEmail"
                  :placeholder="t('settings.contactEmailPlaceholder')"
                  maxlength="128"
                />
              </el-form-item>
              <el-form-item :label="t('settings.icpNumber')">
                <el-input
                  v-model="editForm.icpNumber"
                  :placeholder="t('settings.icpPlaceholder')"
                  maxlength="64"
                />
              </el-form-item>
              <el-form-item :label="t('settings.maintenanceMode')">
                <el-switch v-model="editForm.maintenanceMode" />
              </el-form-item>
              <el-form-item
                v-if="editForm.maintenanceMode"
                :label="t('settings.maintenanceMessage')"
                prop="maintenanceMessage"
                class="form-item-full"
              >
                <el-input
                  v-model="editForm.maintenanceMessage"
                  type="textarea"
                  :rows="4"
                  :placeholder="t('settings.maintenanceMessagePlaceholder')"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item :label="t('settings.lastUpdatedAt')">
                <el-input :model-value="settings.updatedAt" disabled />
              </el-form-item>
            </div>
          </el-form>
        </main>
      </div>

      <div v-if="canEdit && isEditing && settings" class="form-footer">
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ t('common.save') }}
        </el-button>
        <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/form-page.scss';

.settings-logo {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-base);
  border: 1px solid var(--border-color);
}

.settings-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-base);
  border: 1px dashed var(--border-color);
  color: var(--text-light);
  font-size: var(--font-size-caption);
}
</style>
