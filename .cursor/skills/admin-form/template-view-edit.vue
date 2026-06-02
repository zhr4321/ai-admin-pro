<!--
  页内查看/编辑表单模板（复制到 src/views/{模块}/index.vue 后按业务替换）
  占位：{ModuleTitle} {EntityName}
  参考：src/views/profile/index.vue
-->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// import { getXxxDetail, updateXxx } from '@/api/{module}'
// import type { XxxDetail, XxxFormParams } from '@/types/{module}'
import { createForbiddenWordRule } from '@/utils/validators'

const MODULE_TITLE = '{ModuleTitle}'

interface XxxDetail {
  id: number
  name: string
  status: 'enabled' | 'disabled'
  remark: string
  readonlyField: string
}

interface XxxFormParams {
  name: string
  status: 'enabled' | 'disabled'
  remark: string
}

const STATUS_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const detail = ref<XxxDetail | null>(null)
const formRef = ref<FormInstance>()

const editForm = reactive<XxxFormParams>({
  name: '',
  status: 'enabled',
  remark: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    createForbiddenWordRule('名称'),
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  remark: [createForbiddenWordRule('备注')],
}

function statusLabel(status: XxxDetail['status']) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

const mockDetail: XxxDetail = {
  id: 1,
  name: '示例名称',
  status: 'enabled',
  remark: '示例备注',
  readonlyField: '只读字段',
}

async function loadDetail() {
  loading.value = true
  try {
    // detail.value = await getXxxDetail()
    detail.value = mockDetail
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function fillEditForm(data: XxxDetail) {
  editForm.name = data.name
  editForm.status = data.status
  editForm.remark = data.remark
}

function handleEdit() {
  if (!detail.value) return
  fillEditForm(detail.value)
  isEditing.value = true
}

function handleCancel() {
  isEditing.value = false
  formRef.value?.clearValidate()
}

async function handleSave() {
  if (!formRef.value || !detail.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      // await updateXxx({ ...editForm, name: editForm.name.trim(), remark: editForm.remark.trim() })
      await loadDetail()
      isEditing.value = false
      ElMessage.success('保存成功')
    } catch {
      // 错误由拦截器处理
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div v-loading="loading" class="form-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="form-card-header">
          <span class="card-title">{{ MODULE_TITLE }}</span>
          <el-button v-if="!isEditing && detail" type="primary" @click="handleEdit">
            修改
          </el-button>
        </div>
      </template>

      <el-empty v-if="!loading && !detail" description="无法加载数据" class="form-empty" />

      <!-- 查看模式 -->
      <div v-else-if="!isEditing && detail" class="form-body">
        <main class="form-main">
          <el-descriptions :column="2" border class="form-desc">
            <el-descriptions-item label="名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="只读字段">{{ detail.readonlyField }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ detail.remark || '—' }}
            </el-descriptions-item>
          </el-descriptions>
        </main>
      </div>

      <!-- 编辑模式 -->
      <div v-else-if="isEditing && detail" class="form-body">
        <main class="form-main">
          <el-form
            ref="formRef"
            :model="editForm"
            :rules="rules"
            label-width="140px"
            class="form-main-form"
          >
            <div class="form-grid">
              <el-form-item label="名称" prop="name">
                <el-input v-model="editForm.name" placeholder="请输入名称" maxlength="32" />
              </el-form-item>
              <el-form-item label="只读字段">
                <el-input :model-value="detail.readonlyField" disabled />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 140px">
                  <el-option
                    v-for="opt in STATUS_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="备注" prop="remark" class="form-item-full">
                <el-input
                  v-model="editForm.remark"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入备注"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </div>
          </el-form>
        </main>
      </div>

      <div v-if="isEditing && detail" class="form-footer">
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/form-page.scss';
</style>
