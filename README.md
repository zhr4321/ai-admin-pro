# AI Admin Pro

基于 Vue 3 + TypeScript 的后台管理系统，用于 **VibeCoding 练习** 与 **求职作品集**。

项目目标是覆盖市场常见的后台管理能力，同时展示 AI 辅助前端开发的协作流程，面向「支持 AI 辅助开发」的前端岗位。

## 项目意图

- 用 VibeCoding 方式（Cursor Rules + Prompts + Skills）高效迭代功能
- 沉淀可复用的后台管理模块：鉴权、RBAC、CRUD、表单、图表、系统设置等
- 每个模块独立 commit，展示 Git 协作与 AI 辅助开发能力

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus |
| 路由 | Vue Router |
| 状态 | Pinia |
| 样式 | Sass |
| HTTP | Axios |
| Mock | MSW（Mock Service Worker） |
| 表格导入导出 | xlsx |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build
```

浏览器访问 `http://localhost:5173`：

- 登录页：`/login`（默认账号 `admin` / `123456`）
- 首页：`/dashboard`
- 运营中心 → 活动推广：`/operations/campaign`
- 运营中心 → 公告管理：`/operations/notice`
- 系统管理 → 系统设置：`/settings`（页内查看/编辑 + Logo 上传 + 维护模式联动）
- 系统管理 → 商户入驻：`/merchant/onboarding`（三步向导表单）

## 接口与本地 Mock（MSW）

开发环境通过 [MSW](https://mswjs.io/) 拦截浏览器网络请求，axios 以真实 HTTP 方式访问 `/api/*`，由 Service Worker 返回本地 mock 数据。

```
页面 → src/api/*.ts → axios → MSW Worker → src/mocks/handlers
```

- **开发环境**：`npm run dev` 时自动启动 MSW（控制台出现 `[MSW] Mocking enabled.`）
- **生产环境**：不启动 MSW，需对接真实后端
- **测试账号**：`admin` / `123456`

### 相关目录

| 目录 | 说明 |
|------|------|
| `src/api/` | axios 实例与接口封装（`request.ts` 统一拦截） |
| `src/mocks/handlers/` | MSW 路由 handler，按模块拆分 |
| `src/types/` | 接口请求/响应类型（含 `PageParams` / `PageResult` 分页） |
| `src/composables/` | 可复用组合式函数（如 `useCrudTableHeight`） |
| `src/styles/crud-page.scss` | 表格 CRUD 列表页统一样式 |
| `src/styles/form-page.scss` | 表单页统一样式（查看/编辑、向导、登录等） |
| `src/utils/preloadRoutes.ts` | 登录后空闲预加载表单页 chunk，减轻首次进入卡顿 |
| `public/static/` | 导入模板等静态资源（xlsx） |

### 新增接口步骤

1. 在 `src/types/` 定义类型
2. 在 `src/mocks/handlers/` 添加 MSW handler（完整路径如 `/api/xxx`）
3. 在 `src/api/` 封装 API 方法
4. 页面调用 API 并验证

### 切换真实后端

修改 `.env.production` 或 `.env.development` 中的 `VITE_APP_BASE_API` 为真实 API 地址；关闭开发环境 MSW 启动逻辑即可。

详见 `.cursor/rules/api-mock.mdc`。

## VibeCoding 配置

项目内置 Cursor AI 协作基础设施，位于 `.cursor/` 目录：

### Rules（`.cursor/rules/`）

持久化 AI 上下文，自动或按文件类型生效：

| 文件 | 作用 |
|------|------|
| `project-core.mdc` | 全局项目约定（alwaysApply） |
| `vue-components.mdc` | Vue SFC 编写规范 |
| `typescript.mdc` | TypeScript 编码规范 |
| `style.mdc` | 色彩、排版、圆角、响应式与交互约定 |
| `api-request.mdc` | 接口请求封装、调用方式与错误处理 |
| `api-mock.mdc` | MSW 本地 Mock 与 handler 约定 |
| `_template.mdc` | 新建规则的空白模板 |

## 设计体系

全局设计令牌定义在 [`src/styles/variables.scss`](src/styles/variables.scss)，并在 `main.ts` 中引入，与 Element Plus 主题变量对齐。

- 主色：`#165DFF`
- 页面背景：`--bg-primary`
- 圆角统一：`4px`
- 响应式：`< 768px` 侧栏自动收起，仪表盘栅格 `:xs="24" :sm="12" :md="6"`
- Element Plus 中文 locale（分页等组件文案）

详见 `.cursor/rules/style.mdc`。

### Prompts（`.cursor/prompts/`）

可复用的提示词模板，在 Cursor Chat 中 `@` 引用或复制「提示词正文」：

| 文件 | 场景 |
|------|------|
| `new-admin-module.md` | 新增后台模块 |
| `crud-page.md` | 表格 CRUD 页面（推荐配合 `@admin-crud-table`） |
| `form-page.md` | 表单页面（查看/编辑、全页表单、向导；推荐配合 `@admin-form`） |
| `bugfix-debug.md` | Bug 排查修复 |
| `role-management.md` | 用户权限管理（用户搜索 + 模块权限下拉配置） |
| `_template.md` | 新建 prompt 的空白模板 |

详见 [`.cursor/prompts/README.md`](.cursor/prompts/README.md)。

### Skills（`.cursor/skills/`）

项目级 Agent Skill，按需 `@` 引用：

| Skill | 说明 |
|-------|------|
| `admin-module-dev` | 按规范开发后台模块（路由、菜单、页面） |
| `admin-crud-table` | 统一样式表格 CRUD（可配置工具栏、大弹窗新增、xlsx 模板/导出/导入） |
| `admin-form` | 统一样式表单页（查看/编辑、全页表单、分步向导、联动、登录表单） |
| `_template` | 新建 Skill 的空白模板 |

## 模块路线图

- [x] 项目脚手架（Layout + Login + Dashboard）
- [x] 登录鉴权（Token、路由守卫、Pinia 用户状态）
- [x] 用户权限管理（用户搜索、模块权限下拉：无/可查看/可修改）
- [x] 个人信息（查看/编辑、表单校验、头像上传）
- [x] 表格 CRUD 基础设施（`admin-crud-table` Skill、统一样式、动态表格高度、xlsx 导入/导出）
- [x] 运营中心（侧边栏子菜单：活动推广、公告管理）
- [x] 表单模块 Skill（`admin-form`：查看/编辑、全页表单、向导、联动、form-page.scss）
- [x] 表单业务页示范（系统设置 view-edit、商户入驻 wizard）
- [x] 路由与菜单性能优化（Layout 常驻、子菜单无动画、MSW 静默 bypass、路由预加载）
- [ ] RBAC 进阶（动态菜单、按钮级权限）
- [ ] 图表仪表盘（ECharts 数据可视化）
- [ ] 系统设置进阶（主题切换、国际化）

## 目录结构

```
src/
├── api/             # axios 封装与接口（含 campaign、notice、settings、merchant 等）
├── composables/     # 组合式函数（useCrudTableHeight 等）
├── mocks/           # MSW handlers
├── styles/          # 全局样式与设计令牌（含 crud-page.scss、form-page.scss）
├── utils/           # 工具函数（download、excel、preloadRoutes 等）
├── layout/          # 后台布局（侧边栏 + 顶栏，支持子菜单）
├── router/          # 路由配置
├── types/           # 公共类型定义
├── views/
│   ├── login/       # 登录页
│   ├── dashboard/   # 首页仪表盘
│   ├── role/        # 用户权限管理
│   ├── profile/     # 个人信息
│   ├── settings/    # 系统设置（@admin-form view-edit 示范）
│   ├── merchant/    # 商户相关
│   │   └── onboarding/  # 商户入驻向导（@admin-form wizard 示范）
│   └── operations/  # 运营中心
│       ├── campaign/  # 活动推广 CRUD
│       └── notice/    # 公告管理 CRUD
├── App.vue
└── main.ts

public/static/       # 导入模板 xlsx 等静态资源
scripts/             # 脚本（如 generate-xlsx-template.mjs）
text/                # Skill 需求原文（admin-crud-table、admin-form 等）
```

### 性能说明

- **Layout 常驻**：`App.vue` 不使用 `router-view :key`，子路由切换时侧边栏不重建
- **菜单**：`el-menu` 关闭 `collapse-transition`，启用 `unique-opened`
- **MSW**：开发环境仅对 `/api/` 未匹配请求 warn，Vite 模块请求静默 bypass
- **预加载**：登录/会话恢复后通过 `requestIdleCallback` 预加载 settings、onboarding chunk
- **向导页**：商户入驻按步骤 `v-if` 挂载表单，避免三步校验同时初始化

```

## 仓库地址

https://gitee.com/walkingtree/ai-admin-pro.git

## License

Private — 个人练习与作品集项目
