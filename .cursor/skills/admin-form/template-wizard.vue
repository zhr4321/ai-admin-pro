<!--
  分步向导表单模板（复制到 src/views/{模块}/index.vue）
  占位：{ModuleTitle} {EntityName}
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// import { createXxx } from '@/api/{module}'
import { PHONE_PATTERN, createForbiddenWordRule } from '@/utils/validators'

const MODULE_TITLE = '{ModuleTitle}'
const LIST_ROUTE = '/{module}'

interface Step1Model {
  name: string
  type: 'personal' | 'enterprise'
}

interface Step2Model {
  contact: string
  phone: string
}

interface Step3Model {
  remark: string
}

const router = useRouter()
const activeStep = ref(0)
const submitting = ref(false)
const step1Ref = ref<FormInstance>()
const step2Ref = ref<FormInstance>()
const step3Ref = ref<FormInstance>()

const defaultStep1: Step1Model = { name: '', type: 'personal' }
const defaultStep2: Step2Model = { contact: '', phone: '' }
const defaultStep3: Step3Model = { remark: '' }

const step1Model = reactive<Step1Model>({ ...defaultStep1 })
const step2Model = reactive<Step2Model>({ ...defaultStep2 })
const step3Model = reactive<Step3Model>({ ...defaultStep3 })

const step1Rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    createForbiddenWordRule('名称'),
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

const step2Rules: FormRules = {
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: PHONE_PATTERN, message: '联系电话格式不正确', trigger: 'blur' },
  ],
}

const step3Rules: FormRules = {
  remark: [createForbiddenWordRule('备注')],
}

const TYPE_OPTIONS = [
  { label: '个人', value: 'personal' as const },
  { label: '企业', value: 'enterprise' as const },
]

const isFirstStep = computed(() => activeStep.value === 0)
const isLastStep = computed(() => activeStep.value === 2)

watch(
  () => step1Model.type,
  () => {
    step2Model.contact = ''
    step2Model.phone = ''
  },
)

function getStepFormRef(step: number): FormInstance | undefined {
  if (step === 0) return step1Ref.value
  if (step === 1) return step2Ref.value
  return step3Ref.value
}

async function validateStep(step: number): Promise<boolean> {
  const ref = getStepFormRef(step)
  if (!ref) return false
  try {
    await ref.validate()
    return true
  } catch {
    return false
  }
}

function resetWizard() {
  activeStep.value = 0
  Object.assign(step1Model, defaultStep1)
  Object.assign(step2Model, defaultStep2)
  Object.assign(step3Model, defaultStep3)
  step1Ref.value?.clearValidate()
  step2Ref.value?.clearValidate()
  step3Ref.value?.clearValidate()
}

async function handleNext() {
  const valid = await validateStep(activeStep.value)
  if (!valid) return
  activeStep.value += 1
}

function handlePrev() {
  if (activeStep.value > 0) activeStep.value -= 1
}

async function handleSubmit() {
  const valid = await validateStep(activeStep.value)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      name: step1Model.name.trim(),
      type: step1Model.type,
      contact: step2Model.contact.trim(),
      phone: step2Model.phone.trim(),
      remark: step3Model.remark.trim(),
    }
    // await createXxx(payload)
    void payload
    ElMessage.success('提交成功')
    router.push(LIST_ROUTE)
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  resetWizard()
  router.push(LIST_ROUTE)
}
</script>

<template>
  <div class="form-page form-page--wizard">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="form-card-header">
          <span class="card-title">{{ MODULE_TITLE }}</span>
          <el-button @click="handleCancel">取消</el-button>
        </div>
      </template>

      <div class="form-wizard-steps">
        <el-steps :active="activeStep" align-center finish-status="success">
          <el-step title="基本信息" />
          <el-step title="联系方式" />
          <el-step title="补充说明" />
        </el-steps>
      </div>

      <div class="form-wizard-body">
        <el-form
          v-show="activeStep === 0"
          ref="step1Ref"
          :model="step1Model"
          :rules="step1Rules"
          label-width="100px"
          class="form-main-form"
        >
          <div class="form-grid">
            <el-form-item label="名称" prop="name">
              <el-input v-model="step1Model.name" placeholder="请输入名称" maxlength="32" />
            </el-form-item>
            <el-form-item label="类型" prop="type">
              <el-radio-group v-model="step1Model.type">
                <el-radio v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>

        <el-form
          v-show="activeStep === 1"
          ref="step2Ref"
          :model="step2Model"
          :rules="step2Rules"
          label-width="100px"
          class="form-main-form"
        >
          <div class="form-grid">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="step2Model.contact" placeholder="请输入联系人" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="step2Model.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </div>
        </el-form>

        <el-form
          v-show="activeStep === 2"
          ref="step3Ref"
          :model="step3Model"
          :rules="step3Rules"
          label-width="100px"
          class="form-main-form"
        >
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="step3Model.remark"
              type="textarea"
              :rows="4"
              placeholder="请输入备注"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="form-wizard-footer">
        <el-button v-if="!isFirstStep" @click="handlePrev">上一步</el-button>
        <el-button v-if="!isLastStep" type="primary" @click="handleNext">下一步</el-button>
        <template v-if="isLastStep">
          <el-button @click="handlePrev">上一步</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
        </template>
        <el-button @click="resetWizard">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/form-page.scss';
</style>
