import { http, HttpResponse } from 'msw'
import { APP_MODULE_KEYS } from '@/config/modules'
import {
  buildPermissionConfigItems,
  isLevelAllowedForModule,
  normalizeLevelForModule,
} from '@/config/permission-options'
import type { ModulePermission, UserModulePermission } from '@/types/role'
import {
  exportAllEditPermissions,
  findUser,
  getPermissionsByUserId,
  resolveUserIdFromAuthHeader,
  saveUserPermissions,
  users,
} from '@/mocks/data/users'
import { requireModuleEdit } from '@/mocks/utils/requireModuleEdit'
import type { UserSuggestItem } from '@/types/role'

function toModulePermissions(levels: UserModulePermission[]): ModulePermission[] {
  return levels.map((p) => ({
    moduleKey: p.moduleKey,
    moduleNameKey: p.moduleNameKey,
    view: p.level === 'view' || p.level === 'edit',
    edit: p.level === 'edit',
  }))
}

function toSuggestItem(user: (typeof users)[number]): UserSuggestItem {
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    roleName: user.roleName,
    isSuperAdmin: user.isSuperAdmin,
  }
}

function getLoginUserPermissions(authHeader: string | null): ModulePermission[] {
  const userId = resolveUserIdFromAuthHeader(authHeader)
  if (!userId) return []
  return toModulePermissions(getPermissionsByUserId(userId))
}

function validatePermissionPayload(
  permissions: UserModulePermission[],
): { messageKey: string; messageParams?: Record<string, string> } | null {
  const keys = new Set(permissions.map((p) => p.moduleKey))
  if (keys.size !== permissions.length) {
    return { messageKey: 'errors.permissionDuplicate' }
  }
  for (const key of APP_MODULE_KEYS) {
    if (!keys.has(key)) {
      return { messageKey: 'errors.permissionMissingModule' }
    }
  }
  for (const item of permissions) {
    if (!APP_MODULE_KEYS.includes(item.moduleKey)) {
      return {
        messageKey: 'errors.unknownModule',
        messageParams: { moduleKey: item.moduleKey },
      }
    }
    const level = normalizeLevelForModule(item.moduleKey, item.level)
    if (!isLevelAllowedForModule(item.moduleKey, level)) {
      return {
        messageKey: 'errors.invalidPermissionLevel',
        messageParams: { moduleName: item.moduleNameKey },
      }
    }
  }
  return null
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
        { code: 404, messageKey: 'errors.userNotFound', message: '用户不存在', data: null },
        { status: 404 },
      )
    }

    const isLocked = user.isSuperAdmin
    const storedPermissions = isLocked
      ? exportAllEditPermissions()
      : getPermissionsByUserId(id)

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
        permissions: buildPermissionConfigItems(storedPermissions),
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
    const list = filtered
      .slice(start, start + pageSize)
      .map(({ isSuperAdmin: _, password: __, profile: ___, ...rest }) => rest)

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { list, total: filtered.length },
    })
  }),

  http.get('/api/users/:id/permissions', ({ params }) => {
    const id = Number(params.id)
    const user = findUser(id)
    if (!user) {
      return HttpResponse.json(
        { code: 404, messageKey: 'errors.userNotFound', message: '用户不存在', data: null },
        { status: 404 },
      )
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: getPermissionsByUserId(id),
    })
  }),

  http.put('/api/users/:id/permissions', async ({ params, request }) => {
    const guard = requireModuleEdit(request, 'role')
    if (!guard.ok) {
      return guard.response
    }

    const id = Number(params.id)
    const user = findUser(id)
    if (!user) {
      return HttpResponse.json(
        { code: 404, messageKey: 'errors.userNotFound', message: '用户不存在', data: null },
        { status: 404 },
      )
    }

    if (user.isSuperAdmin) {
      return HttpResponse.json(
        {
          code: 403,
          messageKey: 'errors.superAdminLocked',
          message: '超级管理员权限不可修改',
          data: null,
        },
        { status: 403 },
      )
    }

    const body = (await request.json()) as { permissions: UserModulePermission[] }
    const validationError = validatePermissionPayload(body.permissions)
    if (validationError) {
      return HttpResponse.json({
        code: 400,
        messageKey: validationError.messageKey,
        messageParams: validationError.messageParams,
        message: validationError.messageKey,
        data: null,
      })
    }

    const saved = saveUserPermissions(id, body.permissions)
    if (!saved) {
      return HttpResponse.json(
        {
          code: 403,
          messageKey: 'errors.permissionSaveFailed',
          message: '权限保存失败',
          data: null,
        },
        { status: 403 },
      )
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: saved,
    })
  }),
]
