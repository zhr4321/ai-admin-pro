<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { getSettings, updateSettings, uploadSettingsLogo } from '@/api/settings'
import { useModulePermission } from '@/composables/useModulePermission'
import type { SystemSettings, UpdateSettingsParams } from '@/types/settings'
import { createForbiddenWordRule } from '@/utils/validators'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const rules: FormRules = {
  siteName: [
    { required: true, message: '请输入站点名称', trigger: 'blur' },
    createForbiddenWordRule('站点名称'),
  ],
  contactEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    {
      pattern: EMAIL_PATTERN,
      message: '联系邮箱格式不正确',
      trigger: 'blur',
    },
  ],
  maintenanceMessage: [
    createForbiddenWordRule('维护公告'),
    {
      validator: (_rule, value, callback) => {
        if (editForm.maintenanceMode && !String(value || '').trim()) {
          callback(new Error('维护模式下请填写维护公告'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

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
    ElMessage.success('Logo 上传成功')
  } catch {
    options.onError?.(new Error('上传失败') as never)
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
      ElMessage.success('系统设置保存成功')
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
          <span class="card-title">系统设置</span>
          <el-button v-if="canEdit && !isEditing && settings" type="primary" @click="handleEdit">
            修改
          </el-button>
        </div>
      </template>

      <el-empty v-if="!loading && !settings" description="无法加载系统设置" class="form-empty" />

      <!-- 查看模式 -->
      <div v-else-if="!isEditing && settings" class="form-body">
        <aside class="form-aside">
          <el-image
            v-if="settings.logoUrl"
            :src="settings.logoUrl"
            fit="contain"
            class="settings-logo"
          />
          <div v-else class="settings-logo-placeholder">暂无 Logo</div>
          <p class="form-aside-tip">{{ settings.siteName }}</p>
        </aside>

        <main class="form-main">
          <el-descriptions :column="2" border class="form-desc">
            <el-descriptions-item label="站点名称">{{ settings.siteName }}</el-descriptions-item>
            <el-descriptions-item label="联系邮箱">{{ settings.contactEmail }}</el-descriptions-item>
            <el-descriptions-item label="备案号">{{ settings.icpNumber || '—' }}</el-descriptions-item>
            <el-descriptions-item label="维护模式">
              {{ settings.maintenanceMode ? '已开启' : '已关闭' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="settings.maintenanceMode" label="维护公告" :span="2">
              {{ settings.maintenanceMessage || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后更新时间" :span="2">
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
          <div v-else class="settings-logo-placeholder">暂无 Logo</div>
          <el-upload
            v-if="canEdit"
            :show-file-list="false"
            accept="image/*"
            :disabled="uploading"
            :http-request="handleLogoUpload"
          >
            <el-button size="small" :loading="uploading">
              <el-icon><Plus /></el-icon>
              更换 Logo
            </el-button>
          </el-upload>
          <p class="form-aside-tip">支持 JPG、PNG 格式</p>
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
              <el-form-item label="站点名称" prop="siteName">
                <el-input v-model="editForm.siteName" placeholder="请输入站点名称" maxlength="64" />
              </el-form-item>
              <el-form-item label="联系邮箱" prop="contactEmail">
                <el-input v-model="editForm.contactEmail" placeholder="请输入联系邮箱" maxlength="128" />
              </el-form-item>
              <el-form-item label="备案号">
                <el-input v-model="editForm.icpNumber" placeholder="请输入备案号" maxlength="64" />
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="editForm.maintenanceMode" />
              </el-form-item>
              <el-form-item
                v-if="editForm.maintenanceMode"
                label="维护公告"
                prop="maintenanceMessage"
                class="form-item-full"
              >
                <el-input
                  v-model="editForm.maintenanceMessage"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入维护公告"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="最后更新时间">
                <el-input :model-value="settings.updatedAt" disabled />
              </el-form-item>
            </div>
          </el-form>
        </main>
      </div>

      <div v-if="canEdit && isEditing && settings" class="form-footer">
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        <el-button @click="handleCancel">取消</el-button>
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
