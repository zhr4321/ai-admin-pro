---
name: admin-form
description: >-
  Generates unified Element Plus form pages in ai-admin-pro (view/edit toggle,
  standalone create/edit, wizard steps, field linkage, login forms). Use for
  form pages, settings, profile-like pages, multi-step forms—not table CRUD dialogs.
disable-model-invocation: true
---

# 表单页面（统一样式）

在 ai-admin-pro 中生成**布局与样式一致**的表单类页面（非表格 CRUD 弹窗）。

## 何时使用

| 场景 | 模板 / 指引 |
|------|-------------|
| 页内查看/编辑切换 | [template-view-edit.vue](template-view-edit.vue) |
| 全页新建/编辑 | [template-standalone.vue](template-standalone.vue) |
| 分步向导 | [template-wizard.vue](template-wizard.vue) |
| 登录/简洁表单 | [patterns.md](patterns.md) § 登录 |
| 复杂联动、上传 | [patterns.md](patterns.md) § 复杂联动 |
| 配置页（非 Form） | [patterns.md](patterns.md) § 配置页 → `role-management.md` |

**不要**用于：

- 表格 + 720px 弹窗 CRUD → `@admin-crud-table`
- 用户权限 autocomplete + 权限下拉 → `@role-management.md`

若模块尚无路由/菜单，先 `@admin-module-dev`，再执行本 Skill。

## 必读规则

1. `.cursor/rules/project-core.mdc`
2. `.cursor/rules/vue-components.mdc`
3. `.cursor/rules/style.mdc`
4. `.cursor/rules/api-request.mdc`
5. 有 Mock 时：`.cursor/rules/api-mock.mdc`

需求原文见 [`text/admin-form-requirements.txt`](../../text/admin-form-requirements.txt)。

## 与用户确认

- 表单类型（查看/编辑、全页、向导、登录、配置）
- 字段列表、类型、校验规则、只读字段
- 是否需要双栏 / 上传 / 字段联动
- API 路径与提交成功后跳转或刷新行为

## 强制页面结构

根节点 **必须** 为 `<div class="form-page">`（登录加 `form-page--login`，向导加 `form-page--wizard`）。

| 区域 | 类名 | 内容 |
|------|------|------|
| 卡片 | `form-card` | `el-card shadow="never"` 撑满主内容区 |
| Header | `form-card-header` | 左 `.card-title`，右操作按钮 |
| 主体 | `form-body` | 可选 `form-aside` + `form-main` |
| 表单栅格 | `form-grid` | 双列；`form-item-full` 跨行 |
| 页脚 | `form-footer` / `form-wizard-footer` | 保存/取消 或 提交/重置/返回 |

样式 **必须** 引入：

```scss
@use '@/styles/form-page.scss';
```

**禁止**：硬编码色值；表格 CRUD 弹窗模式混入全页表单；配置页强行套 `el-form`。

## 重置 / 取消 / 提交语义

| 类型 | 取消 | 重置 | 提交 |
|------|------|------|------|
| 页内查看/编辑 | 退出编辑 + `clearValidate()`；再次编辑时 `fillEditForm()` | 无独立重置按钮 | 「保存」→ validate → API |
| 全页新建/编辑 | — | 恢复 `defaultFormModel` 或 `editFormSnapshot` | 「提交」→ validate → API → 跳转 |
| 分步向导 | 「取消」→ 回列表 | 步骤 0 + 各步 model 默认 | 末步「提交」 |
| CRUD 弹窗 | **禁止在本 Skill 实现** | 转 `@admin-crud-table` | 转 `@admin-crud-table` |

页内编辑**取消时不恢复字段**；再次点「修改」时重新从服务端/详情数据灌入。

## 校验与提交

复用 [`src/utils/validators.ts`](../../src/utils/validators.ts)：`PHONE_PATTERN`、`createForbiddenWordRule`、`GENDER_LABELS` 等。

```typescript
await formRef.value.validate(async (valid) => {
  if (!valid) return
  // 字符串字段 trim → 调 API → ElMessage.success → 更新状态/跳转
})
```

- `label-width`：`140px`（默认）/ `100px`（紧凑向导）/ 登录无 label
- 只读字段：`:model-value` + `disabled`，**不设** `prop`
- 类型：`FormInstance`、`FormRules`；禁止 `any`

## 分步向导

- `activeStep` + `el-steps`；每步 `validate` 通过后再 `next`
- 第一步：仅「下一步」；中间：「上一步」「下一步」；末步：「上一步」「提交」
- 联动示例：`watch` 清 dependent 字段（见 [template-wizard.vue](template-wizard.vue)）

## 复杂联动

见 [patterns.md](patterns.md)：`watch` 清字段、`v-if` 条件表单项、`el-upload` + `http-request`。

## 生成顺序

1. `src/types/<module>.ts` — 表单 DTO、枚举
2. `src/api/<module>.ts` — get/create/update 等
3. `src/mocks/handlers/<module>.ts` — 若启用 Mock
4. `src/views/<module>/index.vue`（或 `create.vue`）— 从对应 template 派生
5. 路由：全页编辑可 `:id` 参数；向导/查看编辑通常单路由
6. `@use '@/styles/form-page.scss'`
7. `npm run build` 验证

首版可保留模板内 Mock；接入 API 后删除 Mock，改调 `src/api`。

## 检查清单

- [ ] 表单类型与 template 匹配；未误用 CRUD 弹窗
- [ ] 使用 `form-page.scss`；无硬编码色值
- [ ] `FormRules` + `validators.ts`；提交前 trim
- [ ] 取消/重置语义符合上表
- [ ] 向导每步校验；联动字段有清空逻辑
- [ ] 配置页走 `role-management.md`，未强行套 `el-form`
- [ ] UI 文案中文；`npm run build` 通过
- [ ] diff 最小，未改无关文件

## 示例请求

```
@admin-form 在 src/views/settings/index.vue 实现系统设置页（页内查看/编辑）：
字段：站点名称、Logo 上传、备案号；保存后刷新当前页
```

```
@admin-module-dev @admin-form 新增「客户管理」全页新建/编辑：
路由 /customer/create、/customer/:id/edit；字段：名称、类型、联系人、电话
```

```
@admin-form 实现三步向导「入驻申请」：基本信息 → 资质上传 → 确认提交
```

```
@admin-form 参考 patterns.md 为 /register 增加注册页（简洁表单，无 label）
```
