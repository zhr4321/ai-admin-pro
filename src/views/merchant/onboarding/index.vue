<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { submitOnboarding } from '@/api/merchant'
import type { MerchantType } from '@/types/merchant'
import { PHONE_PATTERN, createForbiddenWordRule } from '@/utils/validators'

interface Step1Model {
  merchantName: string
  merchantType: MerchantType
}

interface Step2Model {
  contactName: string
  contactPhone: string
  businessLicense: string
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

const defaultStep1: Step1Model = { merchantName: '', merchantType: 'personal' }
const defaultStep2: Step2Model = { contactName: '', contactPhone: '', businessLicense: '' }
const defaultStep3: Step3Model = { remark: '' }

const step1Model = reactive<Step1Model>({ ...defaultStep1 })
const step2Model = reactive<Step2Model>({ ...defaultStep2 })
const step3Model = reactive<Step3Model>({ ...defaultStep3 })

const TYPE_OPTIONS = [
  { label: '个人', value: 'personal' as const },
  { label: '企业', value: 'enterprise' as const },
]

const step1Rules: FormRules = {
  merchantName: [
    { required: true, message: '请输入商户名称', trigger: 'blur' },
    createForbiddenWordRule('商户名称'),
  ],
  merchantType: [{ required: true, message: '请选择商户类型', trigger: 'change' }],
}

const step2Rules: FormRules = {
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: PHONE_PATTERN, message: '联系电话格式不正确', trigger: 'blur' },
  ],
  businessLicense: [
    {
      validator: (_rule, value, callback) => {
        if (step1Model.merchantType === 'enterprise' && !String(value || '').trim()) {
          callback(new Error('企业商户请填写营业执照号'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

const step3Rules: FormRules = {
  remark: [createForbiddenWordRule('备注')],
}

const isFirstStep = computed(() => activeStep.value === 0)
const isLastStep = computed(() => activeStep.value === 2)

watch(
  () => step1Model.merchantType,
  () => {
    step2Model.businessLicense = ''
    step2Ref.value?.clearValidate(['businessLicense'])
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
    const result = await submitOnboarding({
      merchantName: step1Model.merchantName.trim(),
      merchantType: step1Model.merchantType,
      contactName: step2Model.contactName.trim(),
      contactPhone: step2Model.contactPhone.trim(),
      businessLicense:
        step1Model.merchantType === 'enterprise'
          ? step2Model.businessLicense.trim()
          : undefined,
      remark: step3Model.remark.trim() || undefined,
    })
    ElMessage.success(`入驻申请提交成功，申请单号：${result.applicationNo}`)
    router.push('/dashboard')
  } catch {
    // 错误由拦截器处理
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  resetWizard()
  router.push('/dashboard')
}
</script>

<template>
  <div class="form-page form-page--wizard">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="form-card-header">
          <span class="card-title">商户入驻</span>
          <el-button @click="handleCancel">取消</el-button>
        </div>
      </template>

      <div class="form-wizard-steps">
        <el-steps :active="activeStep" align-center finish-status="success">
          <el-step title="基本信息" />
          <el-step title="资质信息" />
          <el-step title="补充说明" />
        </el-steps>
      </div>

      <div class="form-wizard-body">
        <el-form
          v-if="activeStep === 0"
          ref="step1Ref"
          :model="step1Model"
          :rules="step1Rules"
          label-width="100px"
          class="form-main-form"
        >
          <div class="form-grid">
            <el-form-item label="商户名称" prop="merchantName">
              <el-input
                v-model="step1Model.merchantName"
                placeholder="请输入商户名称"
                maxlength="64"
              />
            </el-form-item>
            <el-form-item label="商户类型" prop="merchantType">
              <el-radio-group v-model="step1Model.merchantType">
                <el-radio v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>

        <el-form
          v-if="activeStep === 1"
          ref="step2Ref"
          :model="step2Model"
          :rules="step2Rules"
          label-width="100px"
          class="form-main-form"
        >
          <div class="form-grid">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="step2Model.contactName" placeholder="请输入联系人" maxlength="32" />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input
                v-model="step2Model.contactPhone"
                placeholder="请输入手机号"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item
              v-if="step1Model.merchantType === 'enterprise'"
              label="营业执照号"
              prop="businessLicense"
              class="form-item-full"
            >
              <el-input
                v-model="step2Model.businessLicense"
                placeholder="请输入营业执照号"
                maxlength="32"
              />
            </el-form-item>
          </div>
        </el-form>

        <el-form
          v-if="activeStep === 2"
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
              placeholder="请输入备注（选填）"
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
