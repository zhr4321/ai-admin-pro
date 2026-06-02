# 用户权限管理模块

## 适用场景

在 ai-admin-pro 中实现或迭代「用户权限」页面（路由 `/role`）：上方通过输入建议搜索并选择用户，下方以专用接口加载并配置该用户对各功能模块的权限（无 / 可查看 / 可修改）。

## 前置上下文

- 相关规则：`project-core.mdc`、`vue-components.mdc`、`style.mdc`、`api-request.mdc`、`api-mock.mdc`
- 相关文件：`src/router/index.ts`、`src/layout/index.vue`、`src/api/role.ts`、`src/types/role.ts`、`src/stores/user.ts`

## 提示词正文

```
在 ai-admin-pro 中重构「用户权限」页面（路由 /role），上下结构布局：

## 页面布局

### 上方区域（用户搜索）
- el-card：el-autocomplete 关键词输入，支持模糊匹配 **账号（username）**、**用户姓名（realName）**
- **禁止**使用 el-table、分页、查询/重置按钮
- 输入后 debounce（约 300ms）调用 GET /users/suggest?keyword=&limit=10
- keyword 为空时不请求；无匹配时提示「无匹配用户」
- 建议项展示格式：**{realName}（{username}）**
- 自定义建议项 slot：对 realName、username 中与 keyword 匹配的部分标红（class="match-highlight"）
- 点击选择用户后：
  - 输入框保留「{realName}（{username}）」展示文本
  - 下方 el-descriptions 展示必要信息：账号、用户姓名、所属角色
  - 调用 GET /users/:id/permission-config 加载下方权限配置（与用户搜索接口分离）

### 下方区域（权限配置）
- 未选用户时 el-empty 提示「请先搜索并选择用户」
- 已选用户：标题展示「{realName}（{username}）的权限配置」
- **仅通过** GET /users/:id/permission-config 加载数据，不使用用户搜索接口
- 模块关键词搜索框：本地过滤功能模块名称（不请求接口）
- 列表形式：左侧功能模块名，右侧 el-select，选项为：
  - 无（none）
  - 可查看（view）
  - 可修改（edit）
- 底部「保存权限」按钮：PUT /users/:id/permissions
- 仅当当前登录用户对 role 模块为「可修改」时可编辑下拉框并保存（GET /auth/permissions 判断）

### 超级管理员（isSuperAdmin / isLocked）
- permission-config 接口对超管返回 isLocked: true，permissions 四项均为 edit
- 前端：所有模块下拉框显示「可修改」且 disabled
- 展示 el-alert：「超级管理员拥有全部模块可修改权限，不可变更」
- 保存按钮 disabled；Mock 对超管 PUT 返回 403

## 功能模块（固定 4 项）
| moduleKey | 名称 |
|-----------|------|
| dashboard | 首页仪表盘 |
| role | 用户权限 |
| user | 用户管理 |
| system | 系统设置 |

## 接口清单
| 函数 | 方法 | 路径 | 用途 |
|------|------|------|------|
| suggestUsers | GET | /users/suggest | 用户搜索建议 |
| getUserPermissionConfig | GET | /users/:id/permission-config | 下方权限配置专用查询 |
| updateUserPermissions | PUT | /users/:id/permissions | 保存权限 |
| getCurrentPermissions | GET | /auth/permissions | 判断当前用户能否编辑本页 |

## 技术实现
1. src/types/role.ts — PermissionLevel、UserSuggestItem、UserPermissionConfigResult 等
2. src/api/role.ts — suggestUsers、getUserPermissionConfig、updateUserPermissions、getCurrentPermissions
3. src/mocks/handlers/role.ts — GET /users/suggest、GET /users/:id/permission-config、PUT /users/:id/permissions
4. src/views/role/index.vue — 单文件，flex column 上下两卡片，下方区域 flex:1 可滚动
5. 侧栏菜单文案「用户权限」，meta.title 同步

## 禁止
- 上方不使用表格、分页、查询/重置按钮
- 下方权限配置不通过用户搜索接口获取
- 不使用角色列表 + 抽屉方案
- 不在组件内写 mock 数据或直接 axios
- 完成后 npm run build 验证
```

## 期望输出

- [ ] 上方 autocomplete 模糊搜索，建议格式「姓名（账号）」，匹配词标红
- [ ] 选中用户后展示用户信息（账号、姓名、所属角色）
- [ ] 下方通过 GET /users/:id/permission-config 加载权限并与下拉框对应
- [ ] 模块关键词本地过滤生效
- [ ] 保存权限成功且可再次加载
- [ ] 超级管理员：四模块均为「可修改」且 disabled，不可保存
- [ ] 无 edit 权限时只读
- [ ] `npm run build` 通过
