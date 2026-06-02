<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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

const toolbarConfig = {
  create: true,
  downloadTemplate: true,
  export: true,
  import: true,
} as const

const MODULE_TITLE = '活动推广列表'
const EXPORT_TYPE_NAME = '活动推广'
const TEMPLATE_STATIC_URL = '/static/campaign-import-template.xlsx'
const TEMPLATE_DOWNLOAD_NAME = '活动推广导入模板.xlsx'

const STATUS_OPTIONS = [
  { label: '未开始', value: 'pending' as const },
  { label: '进行中', value: 'active' as const },
  { label: '已结束', value: 'ended' as const },
]

const CHANNEL_OPTIONS = [
  { label: '站内', value: 'internal' as const },
  { label: '站外', value: 'external' as const },
  { label: '全渠道', value: 'all' as const },
]

const CHANNEL_FILTER_OPTIONS = [{ label: '全部', value: '' as const }, ...CHANNEL_OPTIONS]

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
  listError.value ? '加载失败，请检查网络后重试' : '暂无数据',
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
  formDialogMode.value === 'create' ? '新增活动' : '修改活动',
)

const formModel = reactive<CampaignFormParams>({
  name: '',
  status: 'pending',
  channel: 'internal',
  pinned: false,
  startDate: '',
  endDate: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择活动状态', trigger: 'change' }],
  channel: [{ required: true, message: '请选择推广渠道', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}

const exportColumns: ExcelColumn<CampaignItem>[] = [
  { label: 'ID', key: 'id' },
  { label: '活动名称', key: 'name' },
  {
    label: '状态',
    key: 'status',
    format: (row) => STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status,
  },
  {
    label: '推广渠道',
    key: 'channel',
    format: (row) => CHANNEL_OPTIONS.find((o) => o.value === row.channel)?.label ?? row.channel,
  },
  {
    label: '是否置顶',
    key: 'pinned',
    format: (row) => (row.pinned ? '是' : '否'),
  },
  { label: '开始日期', key: 'startDate' },
  { label: '结束日期', key: 'endDate' },
  { label: '创建时间', key: 'createdAt' },
]

function statusLabel(status: CampaignStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

function channelLabel(channel: CampaignChannel) {
  return CHANNEL_OPTIONS.find((o) => o.value === channel)?.label ?? channel
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
  formDialogMode.value = 'create'
  resetFormModel()
  formDialogVisible.value = true
}

function handleView(row: CampaignItem) {
  viewRow.value = row
  viewDialogVisible.value = true
}

function handleEdit(row: CampaignItem) {
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
  if (!formRef.value) return
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
        ElMessage.success('新增成功')
      } else if (editingId.value != null) {
        await updateCampaign(editingId.value, payload)
        ElMessage.success('修改成功')
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
  try {
    await ElMessageBox.confirm('是否删除', '提示', {
      type: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否',
    })
    await deleteCampaign(row.id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    fetchList()
  } catch {
    // 用户取消或请求失败
  }
}

function handleDownloadTemplate() {
  ElMessage.info('正在下载模板…')
  try {
    downloadStaticFile(TEMPLATE_STATIC_URL, TEMPLATE_DOWNLOAD_NAME)
    ElMessage.success('模板下载成功')
  } catch {
    ElMessage.error('模板下载失败，请稍后重试')
  }
}

async function handleExport() {
  if (exporting.value) return
  ElMessage.info('正在导出，请稍候…')
  exporting.value = true
  try {
    const rows = await fetchAllForExport()
    if (rows.length === 0) {
      ElMessage.warning('当前筛选条件下暂无数据可导出')
      return
    }
    const filename = formatExportFilename(EXPORT_TYPE_NAME)
    exportRowsToXlsx(rows, exportColumns, filename)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

function handleImportChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) return
  handleImportFile(uploadFile.raw)
}

async function handleImportFile(file: File) {
  if (importing.value) return
  ElMessage.info('正在上传并导入…')
  importing.value = true
  try {
    await importCampaign(file)
    ElMessage.success('导入成功')
    clearSearchAndReload()
  } catch {
    ElMessage.error('导入失败，请检查文件格式后重试')
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
        <el-form-item label="活动名称">
          <el-input
            v-model="queryForm.name"
            clearable
            placeholder="请输入活动名称"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select
            v-model="queryForm.status"
            clearable
            placeholder="全部"
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
        <el-form-item label="活动时间" class="crud-search-item--wide">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="仅看置顶">
          <el-switch v-model="queryForm.pinnedOnly" />
        </el-form-item>
        <el-form-item label="推广渠道" class="crud-search-item--full">
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
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="crud-table-card" shadow="never">
      <div class="crud-table-header">
        <span class="card-title">{{ MODULE_TITLE }}</span>
        <div class="crud-toolbar-actions">
          <el-button v-if="toolbarConfig.create" type="primary" @click="handleCreate">
            新增
          </el-button>
          <el-button
            v-if="toolbarConfig.downloadTemplate"
            @click="handleDownloadTemplate"
          >
            下载模板
          </el-button>
          <el-button
            v-if="toolbarConfig.export"
            :loading="exporting"
            @click="handleExport"
          >
            导出
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
            <el-button :loading="importing">导入</el-button>
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
            <el-table-column prop="name" label="活动名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="channel" label="推广渠道" width="100">
              <template #default="{ row }">
                {{ channelLabel(row.channel) }}
              </template>
            </el-table-column>
            <el-table-column prop="pinned" label="是否置顶" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.pinned ? 'danger' : 'info'" size="small">
                  {{ row.pinned ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column prop="createdAt" label="创建时间" min-width="170" />
            <el-table-column label="操作" fixed="right" width="200" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleView(row)">查看</el-button>
                <el-button link type="primary" @click="handleEdit(row)">修改</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="viewDialogVisible" title="查看活动" width="720px" destroy-on-close>
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="ID">{{ viewRow.id }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(viewRow.status)" size="small">
            {{ statusLabel(viewRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="推广渠道">
          {{ channelLabel(viewRow.channel) }}
        </el-descriptions-item>
        <el-descriptions-item label="是否置顶">
          {{ viewRow.pinned ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ viewRow.createdAt }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
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
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="formModel.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="活动状态" prop="status">
          <el-select v-model="formModel.status" style="width: 100%">
            <el-option
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推广渠道" prop="channel">
          <el-select v-model="formModel.channel" style="width: 100%">
            <el-option
              v-for="opt in CHANNEL_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-switch v-model="formModel.pinned" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formModel.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="formModel.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button @click="handleFormReset">重置</el-button>
        <el-button type="primary" :loading="submitting" @click="handleFormSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/crud-page.scss';
</style>
