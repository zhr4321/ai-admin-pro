import { HttpResponse } from 'msw'
import { getPermissionsByUserId, resolveUserIdFromAuthHeader } from '@/mocks/data/users'
import { canEditModule, getModuleLevel } from '@/utils/permission'

type GuardResult =
  | { ok: true; userId: number }
  | { ok: false; response: ReturnType<typeof HttpResponse.json> }

function unauthorizedResponse() {
  return HttpResponse.json(
    { code: 401, message: '未登录', data: null },
    { status: 401 },
  )
}

function forbiddenResponse() {
  return HttpResponse.json(
    { code: 403, message: '无操作权限', data: null },
    { status: 403 },
  )
}

export function requireModuleEdit(request: Request, moduleKey: string): GuardResult {
  const userId = resolveUserIdFromAuthHeader(request.headers.get('Authorization'))
  if (!userId) {
    return { ok: false, response: unauthorizedResponse() }
  }

  const permissions = getPermissionsByUserId(userId)
  const level = getModuleLevel(permissions, moduleKey)
  if (!canEditModule(level)) {
    return { ok: false, response: forbiddenResponse() }
  }

  return { ok: true, userId }
}
