# SSE AI 流式对话（全局悬浮助手）

> **推荐**：在 Cursor Chat 中 `@ai-chat` Skill，可生成全局悬浮 AI 对话助手（SSE 流式、微信式布局、Markdown 渲染）。本文件可作为补充需求的简短 prompt。

## 适用场景

在 ai-admin-pro 中实现**全局悬浮 AI 助手**：可拖拽圆形入口、右侧抽屉、左侧会话列表、右侧 SSE 流式对话、Markdown 富文本、消息复制/修改/重新生成。**非**菜单路由模块，**不含**表格 CRUD 或表单页。

## 前置上下文

- 需求原文：`text/ai-chat-stream-requirements.txt`
- 相关 Skill：`.cursor/skills/ai-chat/`
- 相关规则：`project-core.mdc`、`vue-components.mdc`、`style.mdc`、`api-request.mdc`、`api-mock.mdc`
- 挂载点：`src/layout/index.vue`
- 配置文件：`src/config/ai-chat.ts`

## 提示词正文

```
在 ai-admin-pro 中实现 SSE AI 流式对话全局悬浮助手：

功能要求（详见 text/ai-chat-stream-requirements.txt）：
1. 可拖拽圆形 FAB 入口，点击从右侧滑出 960px 抽屉（100vh），左侧遮罩，z-index 3000
2. PC 微信式布局：左侧会话栏（新对话/删除/切换），右侧消息区 + 输入区
3. Enter 发送 / Shift+Enter 换行；SSE 流式回答；进行中发送按钮变停止（AbortController）
4. AI 回答 Markdown 渲染（markdown-it + highlight.js）；自动滚底 + 回到底部按钮
5. 错误时清除流式中间态，展示服务端 message 或兜底「AI 回答失败，请稍后重试」
6. 用户气泡：复制、修改；AI 气泡：重新生成、复制
7. localStorage 持久化会话；src/config/ai-chat.ts 配置 DeepSeek/OpenAI 等 Agent
8. MSW Mock POST /api/ai/chat/stream 分片 SSE，无 Key 可离线体验

技术要求：
- 遵循 @ai-chat Skill 与 text/ai-chat-stream-requirements.txt
- 挂载于 src/layout/index.vue，enabled && showInLayout 时显示；/login 不显示
- fetch + ReadableStream 解析 SSE，不用 axios 处理流式
- Pinia store + composables 拆分；引入 src/styles/ai-chat.scss
- 不新增 APP_MODULES / 菜单路由；不做 RBAC moduleKey
- 完成后运行 npm run build 验证
```

## 期望输出

- [ ] 悬浮图标可拖拽，抽屉展开/关闭与遮罩正常
- [ ] 会话 CRUD（新对话、删除、切换）与 localStorage 持久化
- [ ] SSE 流式输出、停止、错误处理符合需求
- [ ] Markdown 渲染与滚动/回底按钮正常
- [ ] 复制、修改、重新生成操作正常
- [ ] ai-chat.ts 配置可切换 provider；MSW Mock 可用
- [ ] `npm run build` 通过
