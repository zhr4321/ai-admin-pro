<!--
  表格 CRUD 页面模板（复制到 src/views/{模块}/index.vue 后按业务替换）
  占位：{ModuleTitle} {EntityName} {ExportTypeName}
  静态模板：public/static/{module}-import-template.xlsx → /static/{module}-import-template.xlsx
-->
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
import { useCrudTableHeight } from '@/composables/useCrudTableHeight'
import { downloadStaticFile } from '@/utils/download'
import {
  exportRowsToXlsx,
  formatExportFilename,
  parseXlsxFile,
  type ExcelColumn,
} from '@/utils/excel'
// import { getXxxList, createXxx, updateXxx, deleteXxx, importXxx } from '@/api/{module}'
// import type { XxxItem, XxxFormParams } from '@/types/{module}'

/** 工具栏：用户未提及导入导出时，仅 create 为 true */
const toolbarConfig = {
  create: true,
  downloadTemplate: false,
  export: false,
  import: false,
} as const

const MODULE_TITLE = '{ModuleTitle}'
const EXPORT_TYPE_NAME = '{ExportTypeName}'
const TEMPLATE_STATIC_URL = '/static/xxx-import-template.xlsx'
const TEMPLATE_DOWNLOAD_NAME = '{ExportTypeName}导入模板.xlsx'

interface XxxItem {
  id: number
  name: string
  status: 'enabled' | 'disabled'
  createdAt: string
}

interface XxxFormParams {
  name: string
  status: 'enabled' | 'disabled'
}

const STATUS_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

const exportColumns: ExcelColumn<XxxItem>[] = [
  { label: 'ID', key: 'id' },
  { label: '名称', key: 'name' },
  {
    label: '状态',
    key: 'status',
    format: (row) => STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status,
  },
  { label: '创建时间', key: 'createdAt' },
]

const defaultQuery = {
  keyword: '',
  status: '' as '' | 'enabled' | 'disabled',
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
const tableData = ref<XxxItem[]>([])

const tableEmptyText = computed(() =>
  listError.value ? '加载失败，请检查网络后重试' : '暂无数据',
)

const { tableHeight } = useCrudTableHeight('tableBody')

const formDialogVisible = ref(false)
const formDialogMode = ref<'create' | 'edit'>('create')
const viewDialogVisible = ref(false)
const viewRow = ref<XxxItem | null>(null)
const submitting = ref(false)
const exporting = ref(false)
const importing = ref(false)
const formRef = ref<FormInstance>()
const importUploadRef = ref<UploadInstance>()
const editingId = ref<number | null>(null)
const editFormSnapshot = ref<XxxFormParams | null>(null)

const formDialogTitle = computed(() =>
  formDialogMode.value === 'create' ? '新增{EntityName}' : '修改{EntityName}',
)

const formModel = reactive<XxxFormParams>({
  name: '',
  status: 'enabled',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const mockAllData: XxxItem[] = [
  { id: 1, name: '示例 A', status: 'enabled', createdAt: '2026-01-01 10:00:00' },
  { id: 2, name: '示例 B', status: 'disabled', createdAt: '2026-01-02 11:00:00' },
]

function statusLabel(status: XxxItem['status']) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

function filterMockByQuery(query: typeof defaultQuery) {
  let filtered = [...mockAllData]
  const kw = query.keyword.trim().toLowerCase()
  if (kw) {
    filtered = filtered.filter((row) => row.name.toLowerCase().includes(kw))
  }
  if (query.status) {
    filtered = filtered.filter((row) => row.status === query.status)
  }
  return filtered
}

function buildListParams() {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: activeQuery.value.keyword.trim() || undefined,
    status: activeQuery.value.status || undefined,
  }
}

async function fetchList() {
  loading.value = true
  listError.value = false
  try {
    const params = buildListParams()
    // const data = await getXxxList(params)
    // tableData.value = data.list
    // pagination.total = data.total

    const filtered = filterMockByQuery(activeQuery.value)
    pagination.total = filtered.length
    const start = (params.page - 1) * params.pageSize
    tableData.value = filtered.slice(start, start + params.pageSize)
  } catch {
    listError.value = true
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

async function fetchAllForExport(): Promise<XxxItem[]> {
  // return (await getXxxList({ ...activeQuery.value, page: 1, pageSize: 99999 })).list
  return filterMockByQuery(activeQuery.value)
}

function handleSearch() {
  activeQuery.value = {
    keyword: queryForm.keyword.trim(),
    status: queryForm.status,
  }
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
  formModel.status = 'enabled'
  editingId.value = null
  editFormSnapshot.value = null
}

function fillFormFromRow(row: XxxItem) {
  editingId.value = row.id
  formModel.name = row.name
  formModel.status = row.status
  editFormSnapshot.value = { name: row.name, status: row.status }
}

function handleCreate() {
  formDialogMode.value = 'create'
  resetFormModel()
  formDialogVisible.value = true
}

function handleView(row: XxxItem) {
  viewRow.value = row
  viewDialogVisible.value = true
}

function handleEdit(row: XxxItem) {
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
    formModel.name = editFormSnapshot.value.name
    formModel.status = editFormSnapshot.value.status
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
      const payload = {
        name: formModel.name.trim(),
        status: formModel.status,
      }
      if (formDialogMode.value === 'create') {
        // await createXxx(payload)
        const nextId = mockAllData.reduce((max, item) => Math.max(max, item.id), 0) + 1
        mockAllData.unshift({
          id: nextId,
          ...payload,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        })
        ElMessage.success('新增成功')
      } else if (editingId.value != null) {
        // await updateXxx(editingId.value, payload)
        const target = mockAllData.find((item) => item.id === editingId.value)
        if (target) Object.assign(target, payload)
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

async function handleDelete(row: XxxItem) {
  try {
    await ElMessageBox.confirm('是否删除', '提示', {
      type: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否',
    })
    // await deleteXxx(row.id)
    const idx = mockAllData.findIndex((item) => item.id === row.id)
    if (idx !== -1) mockAllData.splice(idx, 1)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    fetchList()
  } catch {
    // 用户取消
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
    // await importXxx(file)
    const rows = await parseXlsxFile<Record<string, unknown>>(file)
    if (rows.length === 0) {
      ElMessage.warning('文件中没有可导入的数据')
      return
    }
    let nextId = mockAllData.reduce((max, item) => Math.max(max, item.id), 0)
    for (const row of rows) {
      const name = String(row['名称'] ?? row.name ?? '').trim()
      if (!name) continue
      const statusRaw = String(row['状态'] ?? row.status ?? 'enabled').trim()
      const status: XxxItem['status'] =
        statusRaw === 'disabled' || statusRaw === '禁用' ? 'disabled' : 'enabled'
      nextId += 1
      mockAllData.push({
        id: nextId,
        name,
        status,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      })
    }
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
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            clearable
            placeholder="请输入名称"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
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
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="180" />
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

    <el-dialog
      v-model="viewDialogVisible"
      title="查看{EntityName}"
      width="720px"
      destroy-on-close
    >
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="ID">{{ viewRow.id }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewRow.status === 'enabled' ? 'success' : 'info'" size="small">
            {{ statusLabel(viewRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createdAt }}</el-descriptions-item>
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
        <el-form-item label="名称" prop="name">
          <el-input v-model="formModel.name" maxlength="50" show-word-limit />
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
