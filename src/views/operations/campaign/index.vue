<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadFile,
  type UploadInstance,
} from 'element-plus'
import {
  createCampaign,
  deleteCampaign,
  getCampaignList,
  importCampaign,
  updateCampaign,
} from '@/api/campaign'
import { useCrudTableHeight } from '@/composables/useCrudTableHeight'
import { useModulePermission } from '@/composables/useModulePermission'
import type {
  CampaignChannel,
  CampaignFormParams,
  CampaignItem,
  CampaignStatus,
} from '@/types/campaign'
import { downloadStaticFile } from '@/utils/download'
import {
  exportRowsToXlsx,
  formatExportFilename,
  type ExcelColumn,
} from '@/utils/excel'

const { t } = useI18n()
const { canEdit } = useModulePermission('campaign')

const toolbarConfig = computed(() => ({
  create: canEdit.value,
  downloadTemplate: canEdit.value,
  export: canEdit.value,
  import: canEdit.value,
}))

const TEMPLATE_STATIC_URL = '/static/campaign-import-template.xlsx'

const STATUS_OPTIONS = computed(() => [
  { label: t('campaign.statusPending'), value: 'pending' as const },
  { label: t('campaign.statusActive'), value: 'active' as const },
  { label: t('campaign.statusEnded'), value: 'ended' as const },
])

const CHANNEL_OPTIONS = computed(() => [
  { label: t('campaign.channelInternal'), value: 'internal' as const },
  { label: t('campaign.channelExternal'), value: 'external' as const },
  { label: t('campaign.channelAll'), value: 'all' as const },
])

const CHANNEL_FILTER_OPTIONS = computed(() => [
  { label: t('common.all'), value: '' as const },
  ...CHANNEL_OPTIONS.value,
])

interface QueryState {
  name: string
  status: '' | CampaignStatus
  dateRange: [string, string] | null
  pinnedOnly: boolean
  channel: '' | CampaignChannel
}

const defaultQuery: QueryState = {
  name: '',
  status: '',
  dateRange: null,
  pinnedOnly: false,
  channel: '',
}

const queryForm = reactive<QueryState>({ ...defaultQuery })
const activeQuery = ref<QueryState>({ ...defaultQuery })

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const loading = ref(false)
const listError = ref(false)
const tableData = ref<CampaignItem[]>([])

const tableEmptyText = computed(() =>
  listError.value ? t('common.loadFailed') : t('common.noData'),
)

const { tableHeight } = useCrudTableHeight('tableBody')

const formDialogVisible = ref(false)
const formDialogMode = ref<'create' | 'edit'>('create')
const viewDialogVisible = ref(false)
const viewRow = ref<CampaignItem | null>(null)
const submitting = ref(false)
const exporting = ref(false)
const importing = ref(false)
const formRef = ref<FormInstance>()
const importUploadRef = ref<UploadInstance>()
const editingId = ref<number | null>(null)
const editFormSnapshot = ref<CampaignFormParams | null>(null)

const formDialogTitle = computed(() =>
  formDialogMode.value === 'create' ? t('campaign.formCreate') : t('campaign.formEdit'),
)

const formModel = reactive<CampaignFormParams>({
  name: '',
  status: 'pending',
  channel: 'internal',
  pinned: false,
  startDate: '',
  endDate: '',
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('campaign.nameRequired'), trigger: 'blur' }],
  status: [{ required: true, message: t('campaign.statusRequired'), trigger: 'change' }],
  channel: [{ required: true, message: t('campaign.channelRequired'), trigger: 'change' }],
  startDate: [{ required: true, message: t('campaign.startDateRequired'), trigger: 'change' }],
  endDate: [{ required: true, message: t('campaign.endDateRequired'), trigger: 'change' }],
}))

const exportColumns = computed<ExcelColumn<CampaignItem>[]>(() => [
  { label: 'ID', key: 'id' },
  { label: t('campaign.name'), key: 'name' },
  {
    label: t('common.status'),
    key: 'status',
    format: (row) => STATUS_OPTIONS.value.find((o) => o.value === row.status)?.label ?? row.status,
  },
  {
    label: t('campaign.channel'),
    key: 'channel',
    format: (row) => CHANNEL_OPTIONS.value.find((o) => o.value === row.channel)?.label ?? row.channel,
  },
  {
    label: t('campaign.pinned'),
    key: 'pinned',
    format: (row) => (row.pinned ? t('common.yes') : t('common.no')),
  },
  { label: t('common.startDate'), key: 'startDate' },
  { label: t('common.endDate'), key: 'endDate' },
  { label: t('common.createdAt'), key: 'createdAt' },
])

function statusLabel(status: CampaignStatus) {
  return STATUS_OPTIONS.value.find((o) => o.value === status)?.label ?? status
}

function channelLabel(channel: CampaignChannel) {
  return CHANNEL_OPTIONS.value.find((o) => o.value === channel)?.label ?? channel
}

function statusTagType(status: CampaignStatus) {
  if (status === 'active') return 'success'
  if (status === 'pending') return 'warning'
  return 'info'
}

function buildListParams(pageSize?: number) {
  const query = activeQuery.value
  return {
    page: pagination.page,
    pageSize: pageSize ?? pagination.pageSize,
    name: query.name.trim() || undefined,
    status: query.status || undefined,
    startDate: query.dateRange?.[0],
    endDate: query.dateRange?.[1],
    pinnedOnly: query.pinnedOnly || undefined,
    channel: query.channel || undefined,
  }
}

async function fetchList() {
  loading.value = true
  listError.value = false
  try {
    const data = await getCampaignList(buildListParams())
    tableData.value = data.list
    pagination.total = data.total
  } catch {
    listError.value = true
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

async function fetchAllForExport(): Promise<CampaignItem[]> {
  const data = await getCampaignList({ ...buildListParams(), page: 1, pageSize: 99999 })
  return data.list
}

function copyQueryFromForm(): QueryState {
  return {
    name: queryForm.name.trim(),
    status: queryForm.status,
    dateRange: queryForm.dateRange ? ([...queryForm.dateRange] as [string, string]) : null,
    pinnedOnly: queryForm.pinnedOnly,
    channel: queryForm.channel,
  }
}

function handleSearch() {
  activeQuery.value = copyQueryFromForm()
  pagination.page = 1
  fetchList()
}

function handleReset() {
  Object.assign(queryForm, defaultQuery)
  activeQuery.value = { ...defaultQuery }
  pagination.page = 1
  fetchList()
}

function clearSearchAndReload() {
  Object.assign(queryForm, defaultQuery)
  activeQuery.value = { ...defaultQuery }
  pagination.page = 1
  fetchList()
}

function resetFormModel() {
  formModel.name = ''
  formModel.status = 'pending'
  formModel.channel = 'internal'
  formModel.pinned = false
  formModel.startDate = ''
  formModel.endDate = ''
  editingId.value = null
  editFormSnapshot.value = null
}

function fillFormFromRow(row: CampaignItem) {
  editingId.value = row.id
  formModel.name = row.name
  formModel.status = row.status
  formModel.channel = row.channel
  formModel.pinned = row.pinned
  formModel.startDate = row.startDate
  formModel.endDate = row.endDate
  editFormSnapshot.value = {
    name: row.name,
    status: row.status,
    channel: row.channel,
    pinned: row.pinned,
    startDate: row.startDate,
    endDate: row.endDate,
  }
}

function handleCreate() {
  if (!canEdit.value) return
  formDialogMode.value = 'create'
  resetFormModel()
  formDialogVisible.value = true
}

function handleView(row: CampaignItem) {
  viewRow.value = row
  viewDialogVisible.value = true
}

function handleEdit(row: CampaignItem) {
  if (!canEdit.value) return
  formDialogMode.value = 'edit'
  fillFormFromRow(row)
  formDialogVisible.value = true
}

function handleFormDialogClosed() {
  formRef.value?.resetFields()
  formRef.value?.clearValidate()
  resetFormModel()
}

function handleFormReset() {
  if (formDialogMode.value === 'edit' && editFormSnapshot.value) {
    Object.assign(formModel, editFormSnapshot.value)
  } else {
    resetFormModel()
  }
  formRef.value?.clearValidate()
}

async function handleFormSubmit() {
  if (!canEdit.value || !formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: CampaignFormParams = {
        name: formModel.name.trim(),
        status: formModel.status,
        channel: formModel.channel,
        pinned: formModel.pinned,
        startDate: formModel.startDate,
        endDate: formModel.endDate,
      }
      if (formDialogMode.value === 'create') {
        await createCampaign(payload)
        ElMessage.success(t('common.createSuccess'))
      } else if (editingId.value != null) {
        await updateCampaign(editingId.value, payload)
        ElMessage.success(t('common.updateSuccess'))
      }
      formDialogVisible.value = false
      fetchList()
    } catch {
      // 错误由 request 拦截器处理
    } finally {
      submitting.value = false
    }
  })
}

async function handleDelete(row: CampaignItem) {
  if (!canEdit.value) return
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), {
      type: 'warning',
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.no'),
    })
    await deleteCampaign(row.id)
    ElMessage.success(t('common.deleteSuccess'))
    if (tableData.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    fetchList()
  } catch {
    // 用户取消或请求失败
  }
}

function handleDownloadTemplate() {
  if (!canEdit.value) return
  ElMessage.info(t('common.downloadingTemplate'))
  try {
    downloadStaticFile(TEMPLATE_STATIC_URL, t('campaign.templateFileName'))
    ElMessage.success(t('common.templateDownloadSuccess'))
  } catch {
    ElMessage.error(t('common.templateDownloadFailed'))
  }
}

async function handleExport() {
  if (!canEdit.value || exporting.value) return
  ElMessage.info(t('common.exporting'))
  exporting.value = true
  try {
    const rows = await fetchAllForExport()
    if (rows.length === 0) {
      ElMessage.warning(t('common.exportNoData'))
      return
    }
    const filename = formatExportFilename(t('campaign.exportTypeName'))
    exportRowsToXlsx(rows, exportColumns.value, filename)
    ElMessage.success(t('common.exportSuccess'))
  } catch {
    ElMessage.error(t('common.exportFailed'))
  } finally {
    exporting.value = false
  }
}

function handleImportChange(uploadFile: UploadFile) {
  if (!canEdit.value || !uploadFile.raw) return
  handleImportFile(uploadFile.raw)
}

async function handleImportFile(file: File) {
  if (importing.value) return
  ElMessage.info(t('common.importing'))
  importing.value = true
  try {
    await importCampaign(file)
    ElMessage.success(t('common.importSuccess'))
    clearSearchAndReload()
  } catch {
    ElMessage.error(t('common.importFailed'))
  } finally {
    importing.value = false
    importUploadRef.value?.clearFiles()
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="crud-page">
    <el-card class="crud-search-card" shadow="never">
      <el-form
        :model="queryForm"
        class="crud-search-form"
        label-width="80px"
        @submit.prevent="handleSearch"
      >
        <el-form-item :label="t('campaign.name')">
          <el-input
            v-model="queryForm.name"
            clearable
            :placeholder="t('campaign.namePlaceholder')"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('campaign.statusLabel')">
          <el-select
            v-model="queryForm.status"
            clearable
            :placeholder="t('campaign.statusPlaceholder')"
            style="width: 140px"
          >
            <el-option
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('campaign.activityTime')" class="crud-search-item--wide">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            :range-separator="t('common.dateRangeSeparator')"
            :start-placeholder="t('common.startDate')"
            :end-placeholder="t('common.endDate')"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item :label="t('campaign.pinnedOnly')">
          <el-switch v-model="queryForm.pinnedOnly" />
        </el-form-item>
        <el-form-item :label="t('campaign.channel')" class="crud-search-item--full">
          <el-radio-group v-model="queryForm.channel">
            <el-radio
              v-for="opt in CHANNEL_FILTER_OPTIONS"
              :key="opt.value || 'all'"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="crud-search-actions" label-width="0">
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="crud-table-card" shadow="never">
      <div class="crud-table-header">
        <span class="card-title">{{ t('campaign.moduleTitle') }}</span>
        <div class="crud-toolbar-actions">
          <el-button v-if="toolbarConfig.create" type="primary" @click="handleCreate">
            {{ t('common.add') }}
          </el-button>
          <el-button
            v-if="toolbarConfig.downloadTemplate"
            @click="handleDownloadTemplate"
          >
            {{ t('common.downloadTemplate') }}
          </el-button>
          <el-button
            v-if="toolbarConfig.export"
            :loading="exporting"
            @click="handleExport"
          >
            {{ t('common.export') }}
          </el-button>
          <el-upload
            v-if="toolbarConfig.import"
            ref="importUploadRef"
            class="crud-import-upload"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :auto-upload="false"
            :disabled="importing"
            :on-change="handleImportChange"
          >
            <el-button :loading="importing">{{ t('common.import') }}</el-button>
          </el-upload>
        </div>
      </div>

      <el-divider class="crud-divider" />

      <div class="crud-table-main">
        <div ref="tableBody" v-loading="loading" class="crud-result-body">
          <el-table
            :data="tableData"
            :empty-text="tableEmptyText"
            :height="tableHeight"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" :label="t('campaign.name')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="status" :label="t('common.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="channel" :label="t('campaign.channel')" width="100">
              <template #default="{ row }">
                {{ channelLabel(row.channel) }}
              </template>
            </el-table-column>
            <el-table-column prop="pinned" :label="t('campaign.pinned')" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.pinned ? 'danger' : 'info'" size="small">
                  {{ row.pinned ? t('common.yes') : t('common.no') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" :label="t('common.startDate')" width="120" />
            <el-table-column prop="endDate" :label="t('common.endDate')" width="120" />
            <el-table-column prop="createdAt" :label="t('common.createdAt')" min-width="170" />
            <el-table-column :label="t('common.actions')" fixed="right" width="200" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleView(row)">{{ t('common.view') }}</el-button>
                <el-button v-if="canEdit" link type="primary" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
                <el-button v-if="canEdit" link type="danger" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="crud-pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="viewDialogVisible" :title="t('campaign.viewTitle')" width="720px" destroy-on-close>
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="ID">{{ viewRow.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('campaign.name')">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">
          <el-tag :type="statusTagType(viewRow.status)" size="small">
            {{ statusLabel(viewRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('campaign.channel')">
          {{ channelLabel(viewRow.channel) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('campaign.pinned')">
          {{ viewRow.pinned ? t('common.yes') : t('common.no') }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('common.startDate')">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.endDate')">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.createdAt')" :span="2">
          {{ viewRow.createdAt }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      width="720px"
      destroy-on-close
      @closed="handleFormDialogClosed"
    >
      <el-form ref="formRef" :model="formModel" :rules="rules" label-width="100px">
        <el-form-item :label="t('campaign.name')" prop="name">
          <el-input v-model="formModel.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('campaign.statusLabel')" prop="status">
          <el-select v-model="formModel.status" style="width: 100%">
            <el-option
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('campaign.channel')" prop="channel">
          <el-select v-model="formModel.channel" style="width: 100%">
            <el-option
              v-for="opt in CHANNEL_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('campaign.pinned')">
          <el-switch v-model="formModel.pinned" />
        </el-form-item>
        <el-form-item :label="t('common.startDate')" prop="startDate">
          <el-date-picker
            v-model="formModel.startDate"
            type="date"
            :placeholder="t('common.selectStartDate')"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('common.endDate')" prop="endDate">
          <el-date-picker
            v-model="formModel.endDate"
            type="date"
            :placeholder="t('common.selectEndDate')"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <template v-if="canEdit">
          <el-button @click="handleFormReset">{{ t('common.reset') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="handleFormSubmit">
            {{ t('common.submit') }}
          </el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/crud-page.scss';
</style>
