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

## VibeCoding 配置

项目内置 Cursor AI 协作基础设施，位于 `.cursor/` 目录：

### Rules（`.cursor/rules/`）

持久化 AI 上下文，自动或按文件类型生效：

| 文件 | 作用 |
|------|------|
| `project-core.mdc` | 全局项目约定（alwaysApply） |
| `vue-components.mdc` | Vue SFC 编写规范 |
| `typescript.mdc` | TypeScript 编码规范 |
| `_template.mdc` | 新建规则的空白模板 |

### Prompts（`.cursor/prompts/`）

可复用的提示词模板，在 Cursor Chat 中 `@` 引用或复制「提示词正文」：

| 文件 | 场景 |
|------|------|
| `new-admin-module.md` | 新增后台模块 |
| `crud-page.md` | 表格 CRUD 页面 |
| `bugfix-debug.md` | Bug 排查修复 |
| `_template.md` | 新建 prompt 的空白模板 |

详见 [`.cursor/prompts/README.md`](.cursor/prompts/README.md)。

### Skills（`.cursor/skills/`）

项目级 Agent Skill，按需 `@` 引用：

| Skill | 说明 |
|-------|------|
| `admin-module-dev` | 按规范开发后台模块（路由、菜单、页面） |
| `_template` | 新建 Skill 的空白模板 |

## 模块路线图

- [x] 项目脚手架（Layout + Login + Dashboard）
- [ ] 登录鉴权（Token、路由守卫）
- [ ] RBAC 权限（角色、菜单、按钮级权限）
- [ ] 表格 CRUD（搜索、分页、弹窗表单）
- [ ] 表单模块（复杂表单、校验、联动）
- [ ] 图表仪表盘（ECharts 数据可视化）
- [ ] 系统设置（主题切换、国际化）

## 目录结构

```
src/
├── layout/          # 后台布局（侧边栏 + 顶栏）
├── router/          # 路由配置
├── views/
│   ├── login/       # 登录页
│   └── dashboard/   # 首页仪表盘
├── App.vue
└── main.ts
```

## 仓库地址

https://gitee.com/walkingtree/ai-admin-pro.git

## License

Private — 个人练习与作品集项目
