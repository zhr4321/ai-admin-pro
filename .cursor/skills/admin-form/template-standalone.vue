<!--
  全页新建/编辑表单模板（复制到 src/views/{模块}/index.vue 或 create.vue）
  占位：{ModuleTitle} {EntityName}
-->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// import { createXxx, getXxxDetail, updateXxx } from '@/api/{module}'
// import type { XxxFormParams } from '@/types/{module}'
import { createForbiddenWordRule } from '@/utils/validators'

const MODULE_TITLE = '{ModuleTitle}'
const LIST_ROUTE = '/{module}'

interface XxxFormParams {
  name: string
  status: 'enabled' | 'disabled'
  remark: string
}

const STATUS_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const editFormSnapshot = ref<XxxFormParams | null>(null)

const isEditMode = ref(false)
const pageTitle = ref(`新建{EntityName}`)

const defaultFormModel: XxxFormParams = {
  name: '',
  status: 'enabled',
  remark: '',
}

const formModel = reactive<XxxFormParams>({ ...defaultFormModel })

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    createForbiddenWordRule('名称'),
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  remark: [createForbiddenWordRule('备注')],
}

function resetFormModel() {
  Object.assign(formModel, defaultFormModel)
}

function fillFormFromDetail(data: XxxFormParams) {
  formModel.name = data.name
  formModel.status = data.status
  formModel.remark = data.remark
}

function snapshotForm() {
  editFormSnapshot.value = {
    name: formModel.name,
    status: formModel.status,
    remark: formModel.remark,
  }
}

async function loadDetail(id: number) {
  loading.value = true
  try {
    // const data = await getXxxDetail(id)
    const data: XxxFormParams = {
      name: '示例名称',
      status: 'enabled',
      remark: '示例备注',
    }
    fillFormFromDetail(data)
    snapshotForm()
  } catch {
    ElMessage.error('加载失败')
    router.push(LIST_ROUTE)
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push(LIST_ROUTE)
}

function handleReset() {
  if (isEditMode.value && editFormSnapshot.value) {
    fillFormFromDetail(editFormSnapshot.value)
  } else {
    resetFormModel()
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: formModel.name.trim(),
        status: formModel.status,
        remark: formModel.remark.trim(),
      }
      if (isEditMode.value && editingId.value != null) {
        // await updateXxx(editingId.value, payload)
        ElMessage.success('修改成功')
      } else {
        // await createXxx(payload)
        ElMessage.success('新增成功')
      }
      router.push(LIST_ROUTE)
    } catch {
      // 错误由拦截器处理
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  const idParam = route.params.id
  if (idParam) {
    const id = Number(idParam)
    if (Number.isNaN(id)) {
      router.push(LIST_ROUTE)
      return
    }
    isEditMode.value = true
    editingId.value = id
    pageTitle.value = `编辑{EntityName}`
    await loadDetail(id)
  } else {
    resetFormModel()
  }
})
</script>

<template>
  <div v-loading="loading" class="form-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="form-card-header">
          <span class="card-title">{{ pageTitle }}</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <div class="form-body">
        <main class="form-main">
          <el-form
            ref="formRef"
            :model="formModel"
            :rules="rules"
            label-width="140px"
            class="form-main-form"
          >
            <div class="form-grid">
              <el-form-item label="名称" prop="name">
                <el-input v-model="formModel.name" placeholder="请输入名称" maxlength="32" />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="formModel.status" placeholder="请选择状态" style="width: 140px">
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
                  v-model="formModel.remark"
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

      <div class="form-footer">
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button @click="handleBack">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/form-page.scss';
</style>
