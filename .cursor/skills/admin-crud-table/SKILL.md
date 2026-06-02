---
name: admin-crud-table
description: >-
  Generates unified Element Plus table CRUD pages in ai-admin-pro (search, toolbar with
  optional import/export, large create dialog, pagination, xlsx template). Use for list
  pages, table CRUD, import/export, or admin data grids.
disable-model-invocation: true
---

# 表格 CRUD 页面（统一样式）

在 ai-admin-pro 中生成**布局与样式一致**的表格 CRUD 列表页。

## 何时使用

- 需要：上查询区（条件 + **查询** / **重置**）、下结果区（表格 + 操作列 + **分页**）
- 需要：新增 / 编辑弹窗、删除二次确认
- **不要**用于 `role` 用户权限页（autocomplete + 权限下拉，见 `role-management.md`）

若模块尚无路由/菜单，先 `@admin-module-dev`，再执行本 Skill。

## 必读规则

1. `.cursor/rules/project-core.mdc`
2. `.cursor/rules/vue-components.mdc`
3. `.cursor/rules/style.mdc`
4. `.cursor/rules/api-request.mdc`
5. 有 Mock 时：`.cursor/rules/api-mock.mdc`

## 与用户确认

- 模块名、路由 path、菜单标题
- 搜索字段（类型：输入框 / 下拉 / 日期等）
- 表格列与操作（**查看 / 修改 / 删除**，标准 CRUD 默认全开）
- 新增/编辑表单字段与校验规则
- 是否需要 **下载模板 / 导出 / 导入**（未提及则不要加）

## 强制页面结构

根节点 **必须** 为 `<div class="crud-page">`：

| 区域 | 类名 | 内容 |
|------|------|------|
| 查询 | `crud-search-card` | `el-form.crud-search-form`、`queryForm`、**查询** + **重置** |
| 结果 | `crud-table-card` | 见下方「结果卡片分区」 |
| 新增/修改 | `el-dialog` 720px | 统一大表单：**提交**、**重置**、取消（修改须回显） |
| 查看 | `el-dialog` 720px | `el-descriptions` 只读详情，Footer **关闭** |

**结果卡片分区**（不用 `el-card` `#header`，均在 body 内）：

1. `.crud-table-header`：左 `.card-title`，右 `.crud-toolbar-actions` 按钮组
2. `el-divider.crud-divider`
3. `.crud-table-main` → `.crud-result-body`（`el-table`）+ `.crud-pagination`

**禁止**：把查询塞进结果 header；省略重置/分页；表格不用 `border` + `stripe`。

## 工具栏配置

```typescript
const toolbarConfig = {
  create: true,
  downloadTemplate: false, // 仅用户明确要求导入导出时改为 true
  export: false,
  import: false,
} as const
```

| 按钮 | 默认 | 说明 |
|------|------|------|
| 新增 | 显示 | `type="primary"` |
| 下载模板 | 隐藏 | 见「下载模板」 |
| 导出 | 隐藏 | 见「导出」 |
| 导入 | 隐藏 | 见「导入」 |

**禁止**在用户未提及导入导出时默认开启后三项。

## 查询区布局（栅格换行）

- 查询表单 **必须** 使用 `class="crud-search-form"`，**禁止** `inline`
- 样式见 [`crud-page.scss`](d:\cursor\VibeCode\ai-admin-pro\src\styles\crud-page.scss)
- **无滚动条**：`crud-search-card` / 表单 `overflow: visible`，高度随筛选项行数自适应
- 筛选项 `el-form-item`（非 actions）：`flex: 0 1 33.333%`、`min-width: 33.333%`，至少占行宽 **1/3**，满行换行
- **控件定宽**（**禁止** `width: 100%` 拉满表单项）：`el-input` 约 220px、`el-select` 约 140px、`el-date-picker` daterange 约 260px（写在控件 `style` 上）
- **查询 / 重置**：`el-form-item` 加 `class="crud-search-actions"`、`label-width="0"`（避免继承表单 label 占位），独占一行、`justify-content: flex-end`
- 宽项修饰类：`crud-search-item--wide`（约 2/3 行）、`crud-search-item--full`（整行，如单选组）

```vue
<el-form :model="queryForm" class="crud-search-form" label-width="80px" @submit.prevent="handleSearch">
  <el-form-item label="关键词">
    <el-input v-model="queryForm.keyword" style="width: 220px" />
  </el-form-item>
  <el-form-item label="活动时间" class="crud-search-item--wide">
    <el-date-picker type="daterange" style="width: 260px" />
  </el-form-item>
  <el-form-item class="crud-search-actions" label-width="0">
    <el-button type="primary" @click="handleSearch">查询</el-button>
    <el-button @click="handleReset">重置</el-button>
  </el-form-item>
</el-form>
```

## 表格动态高度

- 使用 [`useCrudTableHeight`](d:\cursor\VibeCode\ai-admin-pro\src\composables\useCrudTableHeight.ts)：`ResizeObserver` 测量 `.crud-result-body`，绑定 `:height="tableHeight"`（像素）
- **禁止**仅用 `height="100%"`（flex 下不稳定）
- 筛选区变高、窗口缩放时表格高度自动重算，表体内部滚动

```typescript
import { useCrudTableHeight } from '@/composables/useCrudTableHeight'

const { tableHeight } = useCrudTableHeight('tableBody')
```

```vue
<div ref="tableBody" v-loading="loading" class="crud-result-body">
  <el-table :height="tableHeight" ... />
</div>
```

## 分页中文

- 项目已在 [`main.ts`](d:\cursor\VibeCode\ai-admin-pro\src\main.ts) 配置 `ElementPlus` + `zh-cn` locale
- `el-pagination` 显示「共 x 条」「条/页」「前往」等中文
- **禁止**在 CRUD 单页重复配置 locale（除非整页需英文）

## 页面布局（撑满主内容区）

**上方查询区 + 下方结果区** 作为整体，须撑满后台 Layout **顶栏（header）以下**的全部主内容可视区域（不是仅表格单独撑满）：

- `.crud-page`：`height: calc(100vh - 120px)`（与 `role` 页一致），内含查询卡 + 列表卡
- `.crud-search-card`：`flex-shrink: 0`，高度随表单项
- `.crud-table-card`：`flex: 1`、`min-height: 0`，占据查询区以下的**全部剩余高度**
- `.crud-result-body`：`flex: 1`，`ref` + `useCrudTableHeight`；`v-loading` 加在此层
- `el-table` 绑定 `:height="tableHeight"`；表头/列结构始终保留；无数据时由 `empty-text` 展示文案
- `.crud-pagination`：`flex-shrink: 0`

## 列表结果状态

`fetchList` 须维护 `listError`（`ref(false)`）。**禁止**用 `v-if` 隐藏表格或外层 `el-empty` 替代空态；须通过 `el-table` 的 **`empty-text`** 区分提示：

| 状态 | 条件 | `empty-text` |
|------|------|----------------|
| 加载中 | `loading` | `crud-result-body` 上 `v-loading`（表格仍渲染） |
| 网络错误 | `catch` 后置 `listError = true`，`tableData = []` | `加载失败，请检查网络后重试` |
| 无结果 | 请求成功且 `tableData` 为空 | `暂无数据` |
| 有数据 | `tableData.length > 0` | 不触发空状态 |

```typescript
import { computed, ref } from 'vue'

const listError = ref(false)

const tableEmptyText = computed(() =>
  listError.value ? '加载失败，请检查网络后重试' : '暂无数据',
)

async function fetchList() {
  loading.value = true
  listError.value = false
  try {
    // const data = await getXxxList(...)
    // tableData.value = data.list
    // pagination.total = data.total
  } catch {
    listError.value = true
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}
```

```vue
<el-card class="crud-table-card" shadow="never">
  <div class="crud-table-header">...</div>
  <el-divider class="crud-divider" />
  <div class="crud-table-main">
    <div v-loading="loading" class="crud-result-body">
      <el-table :empty-text="tableEmptyText" height="100%" ... />
    </div>
    <div class="crud-pagination">...</div>
  </div>
</el-card>
```

以上布局与状态由 `crud-page.scss` + [template.vue](template.vue) 提供。

## 新增 / 修改大弹窗（统一）

- `formDialogMode: 'create' | 'edit'`，共用 `formDialogVisible` + `formRef`
- `width="720px"`，`destroy-on-close`
- Footer：**提交**、**重置**、**取消**
- **新增**：打开前 `resetFormModel()`
- **修改**：`fillFormFromRow(row)` 回显；`editFormSnapshot` 供重置恢复为打开时数据
- 提交成功：新增 `新增成功` / 修改 `修改成功`

## 查看详情弹窗

- `viewDialogVisible` + `viewRow`
- `el-descriptions` `border` `:column="2"`，字段与表格列一致
- Footer 仅 **关闭**

## 下载模板

- 静态文件放 [`public/static/`](d:\cursor\VibeCode\ai-admin-pro\public\static\)，访问 `/static/{module}-import-template.xlsx`
- 使用 [`src/utils/download.ts`](d:\cursor\VibeCode\ai-admin-pro\src\utils\download.ts) `downloadStaticFile`
- 提示：`info` 开始 → `success` 成功 / `error` 失败

## 导出

- 依赖 `xlsx`；使用 [`src/utils/excel.ts`](d:\cursor\VibeCode\ai-admin-pro\src\utils\excel.ts) `exportRowsToXlsx`、`formatExportFilename`
- 导出 **activeQuery 条件下全量**（非当前页）；文件名 `{ExportTypeName}-yyyyMMddHHmmss.xlsx`
- 提示：`info` 导出中 → `warning` 无数据 → `success` / `error`

## 导入

- `el-upload`：`accept=".xlsx,.xls"`，`auto-upload="false"`，`on-change` 取 `raw` 上传
- API：`POST /api/{module}/import`（`FormData` + `file`）；Mock 见 [mock-handler.example.ts](mock-handler.example.ts)
- 成功：`success` → **清空筛选**（`queryForm`/`activeQuery` 恢复默认，`page=1`）→ `fetchList()`
- 提示：`info` 上传中 → `success` / `error`（格式错误）

完整骨架见 [template.vue](template.vue)。样式 **必须** 引入：

```scss
@use '@/styles/crud-page.scss';
```

## 状态与数据流

```typescript
const defaultQuery = { /* 模块字段 */ }
const queryForm = reactive({ ...defaultQuery })
const activeQuery = ref({ ...defaultQuery })

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

function handleSearch() {
  activeQuery.value = { /* 从 queryForm 拷贝并 trim */ }
  pagination.page = 1
  fetchList()
}

function handleReset() {
  Object.assign(queryForm, defaultQuery)
  activeQuery.value = { ...defaultQuery }
  pagination.page = 1
  fetchList()
}
```

- **仅**在点击「查询」或「重置」、翻页、增删改成功后调用 `fetchList`
- 请求参数：`{ page, pageSize, ...activeQuery }`（空字符串条件传 `undefined` 或不传）
- 分页组件：`layout="total, sizes, prev, pager, next, jumper"`，`page-sizes` 为 `[10, 20, 50]`（依赖全局中文 locale）

## 生成顺序

1. `src/types/<module>.ts` — 实体、列表参数、表单参数；列表结果用 `PageResult<T>`（`src/types/api.ts`）
2. `src/api/<module>.ts` — `getXxxList`、`createXxx`、`updateXxx`、`deleteXxx`；若启用导入导出则 `importXxx(file)`
3. `public/static/{module}-import-template.xlsx`（可用 `node scripts/generate-xlsx-template.mjs` 生成占位）
4. `src/mocks/handlers/<module>.ts` — 注册；导入导出 handler 参考 [mock-handler.example.ts](mock-handler.example.ts)
5. `src/views/<module>/index.vue` — 从 [template.vue](template.vue) 派生，配置 `toolbarConfig` 与占位符
6. `npm run build` 验证

需求原文见 [`text/admin-crud-table-requirements.txt`](d:\cursor\VibeCode\ai-admin-pro\text\admin-crud-table-requirements.txt)。

首版可保留模板内 Mock 数组 + 前端筛选分页；接入 API 后删除 Mock，改调 `src/api`。

## 表格与操作列

`crud-result-body` 内 **始终** 渲染 `el-table`，绑定 `:empty-text="tableEmptyText"`。

操作列 **固定** 三个 `link` 按钮（`width="200"`）：

| 按钮 | 行为 |
|------|------|
| 查看 | 打开详情弹窗，只读展示当前行 |
| 修改 | 打开与新增相同的 720px 表单弹窗，字段回显 |
| 删除 | `ElMessageBox.confirm('是否删除', '提示', { confirmButtonText: '是', cancelButtonText: '否' })`，确认后删除 |

```vue
<el-table-column label="操作" fixed="right" width="200" align="center">
  <template #default="{ row }">
    <el-button link type="primary" @click="handleView(row)">查看</el-button>
    <el-button link type="primary" @click="handleEdit(row)">修改</el-button>
    <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>
```

删除确认后 `ElMessage.success('删除成功')` 并 `fetchList()`。

## 检查清单

- [ ] 使用 `.crud-page` 与 `crud-page.scss`，无硬编码色值
- [ ] 查询区无滚动条；筛选项定宽、至少 1/3 宽；`crud-search-actions` 换行右对齐
- [ ] 表格使用 `useCrudTableHeight`，随筛选区/窗口自适应高度
- [ ] 分页为中文（全局 locale）；结果卡 header + divider + table + 分页
- [ ] 工具栏仅包含用户要求的按钮
- [ ] 操作列含查看/修改/删除；修改与新增共用 720px 弹窗且回显；删除确认为「是否删除」
- [ ] 新增/修改大弹窗含提交/重置；导入导出含完整 ElMessage 提示
- [ ] `.crud-page`（查询+结果）整体撑满 Layout 顶栏以下区域
- [ ] 表格始终渲染；`listError` 时用 `empty-text` 显示网络错误，否则无数据显示「暂无数据」
- [ ] `queryForm` / `activeQuery` 分离；翻页不丢查询条件
- [ ] 无 `any`；API 不在 `.vue` 内直接 axios
- [ ] UI 文案中文；`npm run build` 通过
- [ ] diff 最小，未改无关文件

## 示例请求

```
@admin-crud-table 在 src/views/product/index.vue 实现商品管理 CRUD：
搜索：名称、状态；表格：ID、名称、状态、创建时间；支持新增/编辑/删除
```

```
@admin-module-dev @admin-crud-table 新增「部门管理」模块并实现标准表格 CRUD
```

```
@admin-crud-table 商品管理：启用下载模板、导出、导入；导出类型名「商品」
```
