# Prompts 使用说明

本目录存放 VibeCoding 可复用的提示词模板，帮助你在 Cursor Chat 中高效驱动 AI 开发。

## 如何使用

1. **@ 引用**：在 Cursor Chat 中 `@` 对应 `.md` 文件，再补充具体需求
2. **复制粘贴**：打开模板文件，复制「提示词正文」段落到 Chat
3. **新建 prompt**：复制 `_template.md`，按结构填写后保存为新文件

## 推荐工作流

```
选择 prompt 模板 → 补充模块名/需求细节 → Agent 生成代码 → npm run build 验证 → git commit
```

## 模板列表

| 文件 | 适用场景 |
|------|----------|
| `_template.md` | 空白结构，创建新 prompt 时使用 |
| `new-admin-module.md` | 新增后台模块（路由 + 菜单 + 页面） |
| `crud-page.md` | 表格 CRUD 页面（推荐配合 `@admin-crud-table`） |
| `form-page.md` | 表单页面（查看/编辑、全页表单、向导；推荐配合 `@admin-form`） |
| `bugfix-debug.md` | 描述 bug 现象并定位修复 |
| `role-management.md` | 用户权限管理（用户搜索 + 模块权限下拉配置） |
| `ai-chat-stream.md` | SSE AI 流式对话（全局悬浮助手；推荐配合 `@ai-chat`） |

## 提示

- 每次只聚焦一个模块或功能，避免一次 prompt 塞入过多需求
- 在 prompt 中明确引用 `.cursor/rules/` 中的相关规则
- 生成代码后务必运行 `npm run build` 验证 TypeScript 编译
