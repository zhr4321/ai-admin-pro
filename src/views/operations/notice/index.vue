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
  createNotice,
  deleteNotice,
  getNoticeList,
  importNotice,
  updateNotice,
} from '@/api/notice'
import { useCrudTableHeight } from '@/composables/useCrudTableHeight'
import type { NoticeFormParams, NoticeItem, NoticeStatus } from '@/types/notice'
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

const MODULE_TITLE = '公告列表'
const EXPORT_TYPE_NAME = '公告'
const TEMPLATE_STATIC_URL = '/static/notice-import-template.xlsx'
const TEMPLATE_DOWNLOAD_NAME = '公告导入模板.xlsx'

const STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' as const },
  { label: '已发布', value: 'published' as const },
]

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
  listError.value ? '加载失败，请检查网络后重试' : '暂无数据',
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
  formDialogMode.value === 'create' ? '新增公告' : '修改公告',
)

const formModel = reactive<NoticeFormParams>({
  title: '',
  content: '',
  status: 'draft',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const exportColumns: ExcelColumn<NoticeItem>[] = [
  { label: 'ID', key: 'id' },
  { label: '公告标题', key: 'title' },
  { label: '发布人', key: 'publisher' },
  {
    label: '状态',
    key: 'status',
    format: (row) => STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status,
  },
  { label: '发布时间', key: 'publishedAt' },
]

function statusLabel(status: NoticeStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
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
  formDialogMode.value = 'create'
  resetFormModel()
  formDialogVisible.value = true
}

function handleView(row: NoticeItem) {
  viewRow.value = row
  viewDialogVisible.value = true
}

function handleEdit(row: NoticeItem) {
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
      const payload: NoticeFormParams = {
        title: formModel.title.trim(),
        content: formModel.content.trim(),
        status: formModel.status,
      }
      if (formDialogMode.value === 'create') {
        await createNotice(payload)
        ElMessage.success('新增成功')
      } else if (editingId.value != null) {
        await updateNotice(editingId.value, payload)
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

async function handleDelete(row: NoticeItem) {
  try {
    await ElMessageBox.confirm('是否删除', '提示', {
      type: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否',
    })
    await deleteNotice(row.id)
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
    await importNotice(file)
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
        <el-form-item label="公告标题">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="请输入公告标题"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
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
            <el-table-column prop="title" label="公告标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="publisher" label="发布人" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="publishedAt" label="发布时间" min-width="170" />
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

    <el-dialog v-model="viewDialogVisible" title="查看公告" width="720px" destroy-on-close>
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="ID">{{ viewRow.id }}</el-descriptions-item>
        <el-descriptions-item label="公告标题">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ viewRow.publisher }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewRow.status === 'published' ? 'success' : 'info'" size="small">
            {{ statusLabel(viewRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间" :span="2">
          {{ viewRow.publishedAt }}
        </el-descriptions-item>
        <el-descriptions-item label="公告内容" :span="2">
          {{ viewRow.content }}
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
      <el-form ref="formRef" :model="formModel" :rules="rules" label-width="80px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="formModel.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="formModel.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
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
