# 表单页面

> **推荐**：在 Cursor Chat 中 `@admin-form` Skill，可生成布局与样式统一的表单页（查看/编辑、全页表单、分步向导等）。本文件可作为补充业务需求的简短 prompt。

## 适用场景

在已有或新建模块中，实现 Element Plus 表单页面：页内查看/编辑、全页新建/编辑、分步向导、登录简洁表单。**不含**表格 CRUD 弹窗（请用 `@admin-crud-table`）。

## 前置上下文

- 相关文件：`src/views/{模块名}/index.vue`、`src/styles/form-page.scss`
- 相关 Skill：`.cursor/skills/admin-form/`（template-view-edit / standalone / wizard）
- 相关规则：`project-core.mdc`、`vue-components.mdc`、`style.mdc`、`api-request.mdc`

## 提示词正文

```
在 ai-admin-pro 中实现「{模块名}」表单页面：

表单类型：{查看/编辑 | 全页新建编辑 | 分步向导 | 登录简洁表单}

功能要求：
1. 根节点 class="form-page"，引入 @use '@/styles/form-page.scss'
2. 字段：{字段列表及校验规则}
3. 只读字段：{如有，:model-value + disabled，不设 prop}
4. 按钮：按类型使用 保存/取消 或 提交/重置/返回 或 上一步/下一步/提交
5. 复杂联动：{如有，说明 watch / v-if 条件}
6. 提交成功后：{刷新当前页 | 跳转 /xxx}

技术要求：
- 遵循 @admin-form 与 text/admin-form-requirements.txt
- 校验复用 src/utils/validators.ts
- 类型定义放 src/types/<module>.ts，API 放 src/api/<module>.ts
- 使用 <script setup lang="ts"> + Element Plus
- 完成后运行 npm run build 验证
```

## 期望输出

- [ ] 表单类型与 template 匹配
- [ ] form-page.scss 已引入，布局与项目一致
- [ ] FormRules 校验生效，提交前 trim
- [ ] 取消/重置语义正确
- [ ] TypeScript 无 any
- [ ] `npm run build` 通过

## 项目内示范页

| 页面 | 路径 | 表单类型 |
|------|------|----------|
| 系统设置 | `src/views/settings/index.vue` | 页内查看/编辑 + Logo 上传 + 维护模式联动 |
| 商户入驻 | `src/views/merchant/onboarding/index.vue` | 三步向导 + 企业类型条件字段 |
