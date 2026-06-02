---
name: admin-module-dev
description: Develops admin management modules in ai-admin-pro following project conventions (router, layout menu, Element Plus pages). Use when the user asks to add, extend, or implement backend admin features, CRUD pages, or permission modules.
disable-model-invocation: true
---

# 后台模块开发

## Instructions

在 ai-admin-pro 中新增或扩展后台模块时，按以下顺序执行：

1. 阅读 `.cursor/rules/project-core.mdc` 了解项目约定
2. 与用户确认模块名、路由 path、菜单标题和图标
3. 按顺序修改：
   - `src/router/index.ts` — 在 Layout children 中注册路由
   - `src/layout/index.vue` — 在 menuItems 中添加菜单项
   - `src/views/<module>/index.vue` — 创建页面组件
4. 页面使用 Element Plus 组件，遵循 `vue-components.mdc`
5. 类型定义遵循 `typescript.mdc`
6. 运行 `npm run build` 验证编译通过
7. 建议单次 commit 聚焦一个模块

## CRUD 页面额外步骤

若模块需要**标准表格 CRUD**（查询/重置 + 表格 + 分页 + 弹窗表单），使用 **`@admin-crud-table`** Skill：

- 统一样式见 `src/styles/crud-page.scss` 与 `.cursor/skills/admin-crud-table/template.vue`
- 也可参考 `.cursor/prompts/crud-page.md` 补充业务字段说明

## 表单页面额外步骤

若模块需要**表单类页面**（页内查看/编辑、全页新建/编辑、分步向导、登录表单等，**非**表格 CRUD 弹窗），使用 **`@admin-form`** Skill：

- 统一样式见 `src/styles/form-page.scss` 与 `.cursor/skills/admin-form/template-*.vue`
- 也可参考 `.cursor/prompts/form-page.md` 补充业务字段说明
- 用户权限等配置列表页见 `.cursor/prompts/role-management.md`，不走 admin-form

## 检查清单

- [ ] 路由可访问，菜单可跳转
- [ ] 组件符合 Vue SFC 规范
- [ ] 无 any 类型，无空 catch
- [ ] UI 文案为中文
- [ ] `npm run build` 通过
- [ ] diff 范围最小，未改动无关文件
