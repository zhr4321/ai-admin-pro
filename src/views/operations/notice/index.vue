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
  createNotice,
  deleteNotice,
  getNoticeList,
  importNotice,
  updateNotice,
} from '@/api/notice'
import { useCrudTableHeight } from '@/composables/useCrudTableHeight'
import { useModulePermission } from '@/composables/useModulePermission'
import type { NoticeFormParams, NoticeItem, NoticeStatus } from '@/types/notice'
import { downloadStaticFile } from '@/utils/download'
import {
  exportRowsToXlsx,
  formatExportFilename,
  type ExcelColumn,
} from '@/utils/excel'

const { t } = useI18n()
const { canEdit } = useModulePermission('notice')

const toolbarConfig = computed(() => ({
  create: canEdit.value,
  downloadTemplate: canEdit.value,
  export: canEdit.value,
  import: canEdit.value,
}))

const TEMPLATE_STATIC_URL = '/static/notice-import-template.xlsx'

const STATUS_OPTIONS = computed(() => [
  { label: t('notice.statusDraft'), value: 'draft' as const },
  { label: t('notice.statusPublished'), value: 'published' as const },
])

const defaultQuery = {
  title: '',
}

const queryForm = reactive({ ...defaultQuery })
const activeQuery = ref({ ...defaultQuery })

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const loading = ref(false)
const listError = ref(false)
const tableData = ref<NoticeItem[]>([])

const tableEmptyText = computed(() =>
  listError.value ? t('common.loadFailed') : t('common.noData'),
)

const { tableHeight } = useCrudTableHeight('tableBody')

const formDialogVisible = ref(false)
const formDialogMode = ref<'create' | 'edit'>('create')
const viewDialogVisible = ref(false)
const viewRow = ref<NoticeItem | null>(null)
const submitting = ref(false)
const exporting = ref(false)
const importing = ref(false)
const formRef = ref<FormInstance>()
const importUploadRef = ref<UploadInstance>()
const editingId = ref<number | null>(null)
const editFormSnapshot = ref<NoticeFormParams | null>(null)

const formDialogTitle = computed(() =>
  formDialogMode.value === 'create' ? t('notice.formCreate') : t('notice.formEdit'),
)

const formModel = reactive<NoticeFormParams>({
  title: '',
  content: '',
  status: 'draft',
})

const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t('notice.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('notice.contentRequired'), trigger: 'blur' }],
  status: [{ required: true, message: t('notice.statusRequired'), trigger: 'change' }],
}))

const exportColumns = computed<ExcelColumn<NoticeItem>[]>(() => [
  { label: 'ID', key: 'id' },
  { label: t('notice.title'), key: 'title' },
  { label: t('notice.publisher'), key: 'publisher' },
  {
    label: t('common.status'),
    key: 'status',
    format: (row) => STATUS_OPTIONS.value.find((o) => o.value === row.status)?.label ?? row.status,
  },
  { label: t('notice.publishedAt'), key: 'publishedAt' },
])

function statusLabel(status: NoticeStatus) {
  return STATUS_OPTIONS.value.find((o) => o.value === status)?.label ?? status
}

function buildListParams(pageSize?: number) {
  return {
    page: pagination.page,
    pageSize: pageSize ?? pagination.pageSize,
    title: activeQuery.value.title.trim() || undefined,
  }
}

async function fetchList() {
  loading.value = true
  listError.value = false
  try {
    const data = await getNoticeList(buildListParams())
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

async function fetchAllForExport(): Promise<NoticeItem[]> {
  const data = await getNoticeList({ ...buildListParams(), page: 1, pageSize: 99999 })
  return data.list
}

function handleSearch() {
  activeQuery.value = { title: queryForm.title.trim() }
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
  formModel.title = ''
  formModel.content = ''
  formModel.status = 'draft'
  editingId.value = null
  editFormSnapshot.value = null
}

function fillFormFromRow(row: NoticeItem) {
  editingId.value = row.id
  formModel.title = row.title
  formModel.content = row.content
  formModel.status = row.status
  editFormSnapshot.value = {
    title: row.title,
    content: row.content,
    status: row.status,
  }
}

function handleCreate() {
  if (!canEdit.value) return
  formDialogMode.value = 'create'
  resetFormModel()
  formDialogVisible.value = true
}

function handleView(row: NoticeItem) {
  viewRow.value = row
  viewDialogVisible.value = true
}

function handleEdit(row: NoticeItem) {
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
      const payload: NoticeFormParams = {
        title: formModel.title.trim(),
        content: formModel.content.trim(),
        status: formModel.status,
      }
      if (formDialogMode.value === 'create') {
        await createNotice(payload)
        ElMessage.success(t('common.createSuccess'))
      } else if (editingId.value != null) {
        await updateNotice(editingId.value, payload)
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

async function handleDelete(row: NoticeItem) {
  if (!canEdit.value) return
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.tip'), {
      type: 'warning',
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.no'),
    })
    await deleteNotice(row.id)
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
    downloadStaticFile(TEMPLATE_STATIC_URL, t('notice.templateFileName'))
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
    const filename = formatExportFilename(t('notice.exportTypeName'))
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
    await importNotice(file)
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
        <el-form-item :label="t('notice.title')">
          <el-input
            v-model="queryForm.title"
            clearable
            :placeholder="t('notice.titlePlaceholder')"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item class="crud-search-actions" label-width="0">
          <el-button type="primary" @click="handleSearch">{{ t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="crud-table-card" shadow="never">
      <div class="crud-table-header">
        <span class="card-title">{{ t('notice.moduleTitle') }}</span>
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
            <el-table-column prop="title" :label="t('notice.title')" min-width="200" show-overflow-tooltip />
            <el-table-column prop="publisher" :label="t('notice.publisher')" width="120" />
            <el-table-column prop="status" :label="t('common.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="publishedAt" :label="t('notice.publishedAt')" min-width="170" />
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

    <el-dialog v-model="viewDialogVisible" :title="t('notice.viewTitle')" width="720px" destroy-on-close>
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="ID">{{ viewRow.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('notice.title')">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item :label="t('notice.publisher')">{{ viewRow.publisher }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">
          <el-tag :type="viewRow.status === 'published' ? 'success' : 'info'" size="small">
            {{ statusLabel(viewRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('notice.publishedAt')" :span="2">
          {{ viewRow.publishedAt }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('notice.content')" :span="2">
          {{ viewRow.content }}
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
      <el-form ref="formRef" :model="formModel" :rules="rules" label-width="80px">
        <el-form-item :label="t('notice.title')" prop="title">
          <el-input v-model="formModel.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('notice.content')" prop="content">
          <el-input
            v-model="formModel.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('common.status')" prop="status">
          <el-select v-model="formModel.status" style="width: 100%">
            <el-option
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
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
