# 表格 CRUD 页面

> **推荐**：在 Cursor Chat 中 `@admin-crud-table` Skill，可生成布局与样式统一的 CRUD 页面（查询/重置、表格操作列、分页）。本文件可作为补充业务需求的简短 prompt。

## 适用场景

在已有模块基础上，实现 Element Plus 标准 CRUD 页面：搜索栏、数据表格、分页、新增/编辑弹窗、删除确认。

## 前置上下文

- 相关文件：`src/views/{模块名}/index.vue`
- 相关规则：`project-core.mdc`、`vue-components.mdc`、`typescript.mdc`

## 提示词正文

```
在 ai-admin-pro 的 src/views/{模块名}/index.vue 中实现 CRUD 页面：

功能要求：
1. 顶部搜索栏：关键词搜索 + 查询/重置按钮
2. 操作栏：新增按钮
3. 数据表格：展示 {字段列表}，含操作列（编辑、删除）
4. 分页：Element Plus Pagination，支持 page/size 切换
5. 新增/编辑：el-dialog 弹窗 + el-form 表单校验
6. 删除：el-message-box 二次确认

技术要求：
- 遵循 @admin-crud-table：查询区定宽+actions右对齐、useCrudTableHeight、分页中文、操作列查看/修改/删除、可选 xlsx 导入导出
- 使用 <script setup lang="ts"> + Element Plus 组件
- 列表分页类型使用 PageParams / PageResult（src/types/api.ts）
- 数据先用 mock 数组，后续再接 API
- 类型定义用 interface，放 src/types/<module>.ts
- 遵循 .cursor/rules/ 中的项目规则
- 完成后运行 npm run build 验证
```

## 期望输出

- [ ] 搜索、表格、分页、弹窗表单功能完整
- [ ] 表单校验生效
- [ ] 删除有二次确认
- [ ] TypeScript 类型无 any
- [ ] `npm run build` 通过
