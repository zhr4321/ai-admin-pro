# 新增后台模块

## 适用场景

需要在 ai-admin-pro 中新增一个后台管理模块（如用户管理、角色管理等），包含路由注册、侧边栏菜单和占位页面。

## 前置上下文

- 相关文件：`src/router/index.ts`、`src/layout/index.vue`
- 相关规则：`project-core.mdc`、`vue-components.mdc`

## 提示词正文

```
在 ai-admin-pro 中新增「{模块名}」模块：

1. 在 src/router/index.ts 的 Layout children 中注册路由，path 为 /{路由路径}
2. 在 src/layout/index.vue 的 menuItems 中添加菜单项（含图标）
3. 创建 src/views/{模块名}/index.vue 占位页，使用 Element Plus 卡片展示模块标题
4. 遵循 .cursor/rules/project-core.mdc 与 vue-components.mdc 规则
5. 改动范围最小，不修改无关文件
6. 完成后运行 npm run build 验证
```

## 期望输出

- [ ] 路由已注册且可访问
- [ ] 侧边栏菜单可点击跳转
- [ ] 页面组件符合 Vue SFC 规范
- [ ] `npm run build` 通过
