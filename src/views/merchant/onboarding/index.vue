<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { submitOnboarding } from '@/api/merchant'
import { useModulePermission } from '@/composables/useModulePermission'
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

const { t } = useI18n()
const router = useRouter()
const { canEdit } = useModulePermission('merchant')
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

const typeOptions = computed(() => [
  { label: t('merchant.typePersonal'), value: 'personal' as const },
  { label: t('merchant.typeEnterprise'), value: 'enterprise' as const },
])

const step1Rules = computed<FormRules>(() => ({
  merchantName: [
    { required: true, message: t('merchant.nameRequired'), trigger: 'blur' },
    createForbiddenWordRule(t, 'validation.fieldMerchantName'),
  ],
  merchantType: [{ required: true, message: t('merchant.typeRequired'), trigger: 'change' }],
}))

const step2Rules = computed<FormRules>(() => ({
  contactName: [{ required: true, message: t('merchant.contactNameRequired'), trigger: 'blur' }],
  contactPhone: [
    { required: true, message: t('merchant.contactPhoneRequired'), trigger: 'blur' },
    { pattern: PHONE_PATTERN, message: t('merchant.contactPhoneInvalid'), trigger: 'blur' },
  ],
  businessLicense: [
    {
      validator: (_rule, value, callback) => {
        if (step1Model.merchantType === 'enterprise' && !String(value || '').trim()) {
          callback(new Error(t('merchant.licenseNoRequired')))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}))

const step3Rules = computed<FormRules>(() => ({
  remark: [createForbiddenWordRule(t, 'validation.fieldRemark')],
}))

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
    ElMessage.success(
      t('merchant.submitSuccess', { applicationNo: result.applicationNo }),
    )
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
          <span class="card-title">{{ t('merchant.title') }}</span>
          <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
        </div>
      </template>

      <div class="form-wizard-steps">
        <el-steps :active="activeStep" align-center finish-status="success">
          <el-step :title="t('merchant.step.basic')" />
          <el-step :title="t('merchant.step.qualification')" />
          <el-step :title="t('merchant.step.remark')" />
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
            <el-form-item :label="t('merchant.name')" prop="merchantName">
              <el-input
                v-model="step1Model.merchantName"
                :placeholder="t('merchant.namePlaceholder')"
                maxlength="64"
              />
            </el-form-item>
            <el-form-item :label="t('merchant.type')" prop="merchantType">
              <el-radio-group v-model="step1Model.merchantType">
                <el-radio v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
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
            <el-form-item :label="t('merchant.contactName')" prop="contactName">
              <el-input
                v-model="step2Model.contactName"
                :placeholder="t('merchant.contactNamePlaceholder')"
                maxlength="32"
              />
            </el-form-item>
            <el-form-item :label="t('merchant.contactPhone')" prop="contactPhone">
              <el-input
                v-model="step2Model.contactPhone"
                :placeholder="t('merchant.phonePlaceholder')"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item
              v-if="step1Model.merchantType === 'enterprise'"
              :label="t('merchant.licenseNo')"
              prop="businessLicense"
              class="form-item-full"
            >
              <el-input
                v-model="step2Model.businessLicense"
                :placeholder="t('merchant.licenseNoPlaceholder')"
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
          <el-form-item :label="t('merchant.remark')" prop="remark">
            <el-input
              v-model="step3Model.remark"
              type="textarea"
              :rows="4"
              :placeholder="t('merchant.remarkPlaceholder')"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="form-wizard-footer">
        <el-button v-if="!isFirstStep" @click="handlePrev">{{ t('merchant.prev') }}</el-button>
        <el-button v-if="!isLastStep" type="primary" @click="handleNext">
          {{ t('merchant.next') }}
        </el-button>
        <template v-if="isLastStep && canEdit">
          <el-button @click="handlePrev">{{ t('merchant.prev') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ t('common.submit') }}
          </el-button>
        </template>
        <el-button v-if="canEdit" @click="resetWizard">{{ t('common.reset') }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/form-page.scss';
</style>
