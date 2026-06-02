import { http, HttpResponse } from 'msw'
import type {
  ModulePermission,
  PermissionLevel,
  UserAccountItem,
  UserModulePermission,
  UserSuggestItem,
} from '@/types/role'

const MODULES = [
  { key: 'dashboard', name: '首页仪表盘' },
  { key: 'role', name: '用户权限' },
  { key: 'user', name: '用户管理' },
  { key: 'system', name: '系统设置' },
]

function levelFromConfig(config: Record<string, PermissionLevel>): UserModulePermission[] {
  return MODULES.map((m) => ({
    moduleKey: m.key,
    moduleName: m.name,
    level: config[m.key] ?? 'none',
  }))
}

function toModulePermissions(levels: UserModulePermission[]): ModulePermission[] {
  return levels.map((p) => ({
    moduleKey: p.moduleKey,
    moduleName: p.moduleName,
    view: p.level === 'view' || p.level === 'edit',
    edit: p.level === 'edit',
  }))
}

function allEditPermissions(): UserModulePermission[] {
  return levelFromConfig({
    dashboard: 'edit',
    role: 'edit',
    user: 'edit',
    system: 'edit',
  })
}

interface UserRecord extends UserAccountItem {
  isSuperAdmin: boolean
}

let users: UserRecord[] = [
  { id: 1, username: 'admin', realName: '系统管理员', roleName: '超级管理员', isSuperAdmin: true },
  { id: 2, username: 'zhangsan', realName: '张三', roleName: '运营人员', isSuperAdmin: false },
  { id: 3, username: 'lisi', realName: '李四', roleName: '运营人员', isSuperAdmin: false },
  { id: 4, username: 'wangwu', realName: '王五', roleName: '只读访客', isSuperAdmin: false },
  { id: 5, username: 'zhaoliu', realName: '赵六', roleName: '只读访客', isSuperAdmin: false },
  { id: 6, username: 'sunqi', realName: '孙七', roleName: '运营人员', isSuperAdmin: false },
]

const userPermissionsMap: Record<number, UserModulePermission[]> = {
  1: allEditPermissions(),
  2: levelFromConfig({
    dashboard: 'view',
    role: 'view',
    user: 'edit',
    system: 'none',
  }),
  3: levelFromConfig({
    dashboard: 'view',
    role: 'none',
    user: 'view',
    system: 'none',
  }),
  4: levelFromConfig({
    dashboard: 'view',
    role: 'view',
    user: 'none',
    system: 'none',
  }),
  5: levelFromConfig({
    dashboard: 'view',
    role: 'none',
    user: 'none',
    system: 'none',
  }),
  6: levelFromConfig({
    dashboard: 'edit',
    role: 'view',
    user: 'view',
    system: 'view',
  }),
}

function findUser(id: number): UserRecord | undefined {
  return users.find((u) => u.id === id)
}

function toSuggestItem(user: UserRecord): UserSuggestItem {
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    roleName: user.roleName,
    isSuperAdmin: user.isSuperAdmin,
  }
}

function getLoginUserPermissions(authHeader: string | null): ModulePermission[] {
  if (authHeader?.includes('mock-token-admin')) {
    return toModulePermissions(userPermissionsMap[1])
  }
  return toModulePermissions(userPermissionsMap[4])
}

export const roleHandlers = [
  http.get('/api/auth/permissions', ({ request }) => {
    const permissions = getLoginUserPermissions(request.headers.get('Authorization'))
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { permissions },
    })
  }),

  http.get('/api/users/suggest', ({ request }) => {
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()
    const limit = Number(url.searchParams.get('limit') || 10)

    if (!keyword) {
      return HttpResponse.json({
        code: 0,
        message: 'success',
        data: [],
      })
    }

    const filtered = users
      .filter(
        (u) =>
          u.username.toLowerCase().includes(keyword) ||
          u.realName.toLowerCase().includes(keyword),
      )
      .slice(0, limit)
      .map(toSuggestItem)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: filtered,
    })
  }),

  http.get('/api/users/:id/permission-config', ({ params }) => {
    const id = Number(params.id)
    const user = findUser(id)
    if (!user) {
      return HttpResponse.json(
        { code: 404, message: '用户不存在', data: null },
        { status: 404 },
      )
    }

    const isLocked = user.isSuperAdmin
    const permissions = isLocked
      ? allEditPermissions()
      : (userPermissionsMap[id] ?? []).map((p) => ({ ...p }))

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          roleName: user.roleName,
        },
        permissions,
        isLocked,
      },
    })
  }),

  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()

    let filtered = users
    if (keyword) {
      filtered = users.filter(
        (u) =>
          u.username.toLowerCase().includes(keyword) ||
          u.realName.toLowerCase().includes(keyword),
      )
    }

    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize).map(({ isSuperAdmin: _, ...rest }) => rest)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { list, total: filtered.length },
    })
  }),

  http.get('/api/users/:id/permissions', ({ params }) => {
    const id = Number(params.id)
    const permissions = userPermissionsMap[id]
    if (!permissions) {
      return HttpResponse.json(
        { code: 404, message: '用户不存在', data: null },
        { status: 404 },
      )
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: permissions.map((p) => ({ ...p })),
    })
  }),

  http.put('/api/users/:id/permissions', async ({ params, request }) => {
    const id = Number(params.id)
    const user = findUser(id)
    if (!user) {
      return HttpResponse.json(
        { code: 404, message: '用户不存在', data: null },
        { status: 404 },
      )
    }

    if (user.isSuperAdmin) {
      return HttpResponse.json(
        { code: 403, message: '超级管理员权限不可修改', data: null },
        { status: 403 },
      )
    }

    const body = (await request.json()) as { permissions: UserModulePermission[] }
    userPermissionsMap[id] = body.permissions.map((p) => ({ ...p }))

    return HttpResponse.json({
      code: 0,
      message: '保存成功',
      data: userPermissionsMap[id].map((p) => ({ ...p })),
    })
  }),
]
