---
name: ai-chat
description: >-
  Generates global floating SSE AI chat assistant in ai-admin-pro (draggable FAB,
  WeChat-style drawer, conversation sidebar, streaming markdown, copy/edit/regenerate).
  Use for AI chat, SSE streaming, floating assistant—not CRUD or form pages.
disable-model-invocation: true
---

# SSE AI 流式对话（全局悬浮助手）

在 ai-admin-pro 中生成**全局悬浮 AI 对话助手**（非菜单路由模块）。

## 何时使用

- 需要：可拖拽圆形 FAB + 右侧抽屉 + 左侧会话列表 + SSE 流式 Markdown 对话
- 需要：消息复制/修改/重新生成、停止生成、错误处理、回到底部
- 需要：`src/config/ai-chat.ts` 切换 DeepSeek / OpenAI 等 Agent

**不要**用于：

- 表格 CRUD → `@admin-crud-table`
- 表单页 → `@admin-form`
- 新增菜单模块 → 本功能为 Layout 全局组件，不写 `APP_MODULES`

## 必读规则

1. `.cursor/rules/project-core.mdc`
2. `.cursor/rules/vue-components.mdc`
3. `.cursor/rules/style.mdc`
4. `.cursor/rules/api-request.mdc`
5. `.cursor/rules/api-mock.mdc`

需求原文见 [`text/ai-chat-stream-requirements.txt`](../../text/ai-chat-stream-requirements.txt)。

## 与用户确认

- Agent 提供商（deepseek / openai / custom）与 model
- 是否启用（`enabled`）及 Layout 内显示（`showInLayout`）
- 可选：defaultSystemPrompt

首版默认：localStorage 持久化、MSW Mock SSE、所有登录用户可用（无 RBAC）。

## 架构概览

```
layout/index.vue
  └── AiChatFab（拖拽 + 开关）
        └── AiChatDrawer（遮罩 + 960px 抽屉）
              ├── AiChatSidebar（会话列表）
              └── 右侧区
                    ├── AiChatMessages（Markdown + 滚动）
                    └── AiChatInput（发送/停止）
```

数据流：`Pinia aiChat store` ↔ `aiChatStorage`（localStorage）↔ `useAiChatStream`（fetch SSE）

## 组件模板

结构参考见 [template.vue](template.vue)（精简骨架，拆分为 6 个 SFC 实现）。

ID 生成：使用 `crypto.randomUUID()`，禁止自增数字 id。

## 强制约定

| 项 | 约定 |
|----|------|
| 挂载 | `src/layout/index.vue`，`v-if="aiChatConfig.enabled && aiChatConfig.showInLayout"` |
| 抽屉尺寸 | 高 100vh，宽 960px；`<768px` 为 100vw |
| z-index | 图标 2999，遮罩/抽屉 3000 |
| 持久化 | localStorage，键前缀 `ai-admin-pro:ai-chat:` |
| 流式 | `fetch` + `ReadableStream`，**不用** axios 处理 SSE |
| 富文本 | `markdown-it` + `highlight.js`，`html: false` 防 XSS |
| 滚底阈值 | 距底 ≤80px 时自动跟随 |
| 错误兜底 | `AI 回答失败，请稍后重试` |
| 复制成功 | `ElMessage.success('已复制')` |

## 配置文件

[`src/config/ai-chat.ts`](../../src/config/ai-chat.ts)：

```typescript
export interface AiChatConfig {
  enabled: boolean
  showInLayout: boolean
  provider: 'deepseek' | 'openai' | 'custom'
  apiBaseUrl: string
  apiKeyEnv: string
  model: string
  streamPath: string
  defaultSystemPrompt?: string
  requestTimeoutMs: number
}
```

- `.env.development`：`VITE_AI_API_KEY=` 占位
- 生产：Key 经 BFF 转发，禁止前端直连暴露

## 组件职责

| 文件 | 职责 |
|------|------|
| `AiChatFab.vue` | 56px 圆形 FAB、拖拽、位置持久化 |
| `AiChatDrawer.vue` | fixed 右滑抽屉、遮罩、关闭 |
| `AiChatSidebar.vue` | 新对话、列表、删除确认、切换 |
| `AiChatMessages.vue` | 消息列表、空状态、回底按钮 |
| `AiChatMessageItem.vue` | 单条气泡 + 操作按钮 |
| `AiChatInput.vue` | textarea、Enter/Shift+Enter、发送/停止 |

## Composables / Store

- `useAiChatStream.ts`：`AbortController`、SSE 解析、`onChunk`/`onError`/`onDone`
- `useChatScroll.ts`：`isAtBottom`、自动滚底、平滑回底
- `stores/aiChat.ts`：会话 CRUD、当前会话、发送/停止/重新生成/修改逻辑
- `utils/aiChatStorage.ts`：localStorage 读写
- `utils/markdown.ts`：markdown-it 实例

## SSE 协议

请求：`POST {streamPath}`，body `{ conversationId, messages: [{ role, content }] }`

响应：`text/event-stream`

```
data: {"content":"增量"}
data: [DONE]
event: error
data: {"message":"原因"}
```

## MSW Mock

`src/mocks/handlers/aiChat.ts`：`POST /api/ai/chat/stream` 分片返回 mock 文本，开发无 Key 可体验。

- 使用 `HttpResponse` + `ReadableStream`，`Content-Type: text/event-stream`
- 每 50ms 推送 `data: {"content":"..."}\n\n`，结束 `data: [DONE]\n\n`

注册至 `src/mocks/handlers/index.ts`。

## 样式

引入 [`src/styles/ai-chat.scss`](../../src/styles/ai-chat.scss)：

- 用户气泡右对齐、AI 气泡左对齐，圆角 4px
- 使用 `variables.scss` 令牌，禁止硬编码色值
- 错误气泡使用 `--error` 色系

## 生成顺序

1. `src/types/aiChat.ts`
2. `src/config/ai-chat.ts` + `.env.development` 占位
3. `src/utils/aiChatStorage.ts`、`src/utils/markdown.ts`
4. `src/composables/useAiChatStream.ts`、`useChatScroll.ts`
5. `src/stores/aiChat.ts`
6. `src/api/aiChat.ts`
7. `src/mocks/handlers/aiChat.ts`
8. `src/components/ai-chat/*.vue`
9. `src/styles/ai-chat.scss`
10. `src/layout/index.vue` 挂载
11. `npm install markdown-it highlight.js`（及类型若需）
12. `npm run build` 验证

## 检查清单

- [ ] FAB 可拖拽，展开/关闭/遮罩正常
- [ ] 会话新对话、删除、切换、localStorage 持久化
- [ ] SSE 流式、停止、错误处理符合需求
- [ ] Markdown 渲染；用户气泡纯文本
- [ ] 自动滚底 + 回底按钮；修改/重新生成截断逻辑正确
- [ ] `ai-chat.ts` 可切换 provider；MSW Mock 可用
- [ ] 未新增菜单路由；未改无关 CRUD/表单页
- [ ] UI 文案中文；`npm run build` 通过

## 示例请求

```
@ai-chat 按 text/ai-chat-stream-requirements.txt 实现全局 SSE AI 对话助手，默认 DeepSeek Mock
```

```
@ai-chat 实现 ai-chat 模块，provider 改为 openai，model gpt-4o-mini
```

```
@ai-chat 仅补充 MSW handler 与 useAiChatStream，组件已有
```
