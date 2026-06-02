<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { getUserInfo, updateProfile, uploadAvatar } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { Gender, UpdateProfileParams, UserInfo } from '@/types/auth'
import {
  createForbiddenWordRule,
  GENDER_LABELS,
  PHONE_PATTERN,
} from '@/utils/validators'

const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const isEditing = ref(false)
const profile = ref<UserInfo | null>(null)
const formRef = ref<FormInstance>()

const editForm = reactive<UpdateProfileParams>({
  nickname: '',
  avatar: '',
  gender: 'unknown',
  phone: '',
  remark: '',
})

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    createForbiddenWordRule('名称'),
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: PHONE_PATTERN,
      message: '联系电话格式不正确',
      trigger: 'blur',
    },
  ],
  remark: [createForbiddenWordRule('个人备注')],
}

function avatarFallback(name: string) {
  return name.charAt(0).toUpperCase()
}

function genderLabel(gender: Gender) {
  return GENDER_LABELS[gender] || '未知'
}

async function loadProfile() {
  loading.value = true
  try {
    profile.value = await getUserInfo()
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

function fillEditForm(data: UserInfo) {
  editForm.nickname = data.nickname
  editForm.avatar = data.avatar || ''
  editForm.gender = data.gender
  editForm.phone = data.phone
  editForm.remark = data.remark || ''
}

function handleEdit() {
  if (!profile.value) return
  fillEditForm(profile.value)
  isEditing.value = true
}

function handleCancel() {
  isEditing.value = false
  formRef.value?.clearValidate()
}

async function handleAvatarUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const { url } = await uploadAvatar(options.file as File)
    editForm.avatar = url
    options.onSuccess?.({ url })
    ElMessage.success('头像上传成功')
  } catch {
    options.onError?.(new Error('上传失败') as never)
  } finally {
    uploading.value = false
  }
}

async function handleSave() {
  if (!formRef.value || !profile.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      await updateProfile({
        nickname: editForm.nickname.trim(),
        avatar: editForm.avatar || undefined,
        gender: editForm.gender,
        phone: editForm.phone.trim(),
        remark: editForm.remark?.trim() || '',
      })
      await userStore.fetchUserInfo()
      await loadProfile()
      isEditing.value = false
      ElMessage.success('个人信息保存成功')
    } catch {
      // 错误由拦截器处理
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div v-loading="loading" class="profile-page">
    <el-card shadow="never" class="profile-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">个人信息</span>
          <el-button v-if="!isEditing && profile" type="primary" @click="handleEdit">
            修改
          </el-button>
        </div>
      </template>

      <el-empty v-if="!loading && !profile" description="无法加载个人信息" class="profile-empty" />

      <!-- 查看模式 -->
      <div v-else-if="!isEditing && profile" class="profile-body">
        <aside class="profile-aside">
          <el-avatar :size="120" :src="profile.avatar || undefined" class="profile-avatar">
            {{ avatarFallback(profile.nickname) }}
          </el-avatar>
          <h2 class="profile-name">{{ profile.nickname }}</h2>
          <p class="profile-account">@{{ profile.username }}</p>
          <el-tag type="primary" effect="plain" class="profile-role-tag">
            {{ profile.projectRole }}
          </el-tag>
        </aside>

        <main class="profile-main">
          <el-descriptions :column="2" border class="profile-desc">
            <el-descriptions-item label="名称">{{ profile.nickname }}</el-descriptions-item>
            <el-descriptions-item label="账号">{{ profile.username }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderLabel(profile.gender) }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ profile.phone }}</el-descriptions-item>
            <el-descriptions-item label="职位">{{ profile.position }}</el-descriptions-item>
            <el-descriptions-item label="在该项目中的身份">{{ profile.projectRole }}</el-descriptions-item>
            <el-descriptions-item label="个人备注" :span="2">
              {{ profile.remark || '—' }}
            </el-descriptions-item>
          </el-descriptions>
        </main>
      </div>

      <!-- 编辑模式 -->
      <div v-else-if="isEditing && profile" class="profile-body profile-body--edit">
        <aside class="profile-aside">
          <el-avatar :size="120" :src="editForm.avatar || undefined" class="profile-avatar">
            {{ avatarFallback(editForm.nickname) }}
          </el-avatar>
          <el-upload
            :show-file-list="false"
            accept="image/*"
            :disabled="uploading"
            :http-request="handleAvatarUpload"
            class="avatar-upload"
          >
            <el-button size="small" :loading="uploading">
              <el-icon><Plus /></el-icon>
              更换头像
            </el-button>
          </el-upload>
          <p class="profile-aside-tip">支持 JPG、PNG 格式</p>
        </aside>

        <main class="profile-main">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="rules"
            label-width="140px"
            class="profile-form"
          >
            <div class="form-grid">
              <el-form-item label="名称" prop="nickname">
                <el-input v-model="editForm.nickname" placeholder="请输入名称" maxlength="32" />
              </el-form-item>
              <el-form-item label="账号">
                <el-input :model-value="profile.username" disabled />
              </el-form-item>
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="editForm.gender">
                  <el-radio value="male">男</el-radio>
                  <el-radio value="female">女</el-radio>
                  <el-radio value="unknown">未知</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="editForm.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item label="职位">
                <el-input :model-value="profile.position" disabled />
              </el-form-item>
              <el-form-item label="在该项目中的身份">
                <el-input :model-value="profile.projectRole" disabled />
              </el-form-item>
              <el-form-item label="个人备注" prop="remark" class="form-item-full">
                <el-input
                  v-model="editForm.remark"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入个人备注"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </div>
          </el-form>
        </main>
      </div>

      <div v-if="isEditing && profile" class="profile-footer">
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 480px;
}

.profile-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-base);

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--text-dark);
}

.profile-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.profile-aside {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 24px;
  border-right: 1px solid var(--border-color);
}

.profile-avatar {
  font-size: 40px;
  font-weight: 600;
}

.profile-name {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-dark);
  line-height: 1.4;
}

.profile-account {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--text-light);
}

.profile-role-tag {
  margin-top: 4px;
}

.profile-aside-tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-light);
}

.avatar-upload {
  margin-top: 4px;
}

.profile-main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
  overflow-y: auto;
}

.profile-desc {
  width: 100%;

  :deep(.el-descriptions__label) {
    width: 140px;
  }
}

.profile-form {
  max-width: 960px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;

  .form-item-full {
    grid-column: 1 / -1;
  }
}

.profile-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: #fff;
}

@media (max-width: 768px) {
  .profile-body {
    flex-direction: column;
    overflow-y: auto;
  }

  .profile-aside {
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 24px 16px;
  }

  .profile-main {
    padding: 24px 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
