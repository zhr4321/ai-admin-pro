import type { Gender, UserInfo } from '@/types/auth'
import type { PermissionLevel, UserAccountItem, UserModulePermission } from '@/types/role'
import { buildDefaultPermissions, mergePermissions } from '@/utils/permission'
import { normalizeLevelForModule } from '@/config/permission-options'

export interface UserRecord extends UserAccountItem {
  isSuperAdmin: boolean
  password: string
  profile: Omit<UserInfo, 'permissions'>
}

const LOGIN_ACCOUNTS: { username: string; password: string; userId: number; token: string }[] = [
  { username: 'admin', password: '123456', userId: 1, token: 'mock-token-admin' },
  { username: 'viewer', password: '123456', userId: 7, token: 'mock-token-viewer' },
]

const TOKEN_USER_MAP = new Map(LOGIN_ACCOUNTS.map((item) => [item.token, item.userId]))

export let users: UserRecord[] = [
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    roleName: '超级管理员',
    isSuperAdmin: true,
    password: '123456',
    profile: {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      avatar: '',
      gender: 'male' as Gender,
      phone: '13800138000',
      position: '系统管理员',
      remark: '',
      projectRole: '管理员',
      roles: ['admin'],
    },
  },
  {
    id: 2,
    username: 'zhangsan',
    realName: '张三',
    roleName: '运营人员',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 2,
      username: 'zhangsan',
      nickname: '张三',
      avatar: '',
      gender: 'male' as Gender,
      phone: '13800138001',
      position: '运营专员',
      remark: '',
      projectRole: '运营人员',
      roles: ['operator'],
    },
  },
  {
    id: 3,
    username: 'lisi',
    realName: '李四',
    roleName: '运营人员',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 3,
      username: 'lisi',
      nickname: '李四',
      avatar: '',
      gender: 'female' as Gender,
      phone: '13800138002',
      position: '运营专员',
      remark: '',
      projectRole: '运营人员',
      roles: ['operator'],
    },
  },
  {
    id: 4,
    username: 'wangwu',
    realName: '王五',
    roleName: '只读访客',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 4,
      username: 'wangwu',
      nickname: '王五',
      avatar: '',
      gender: 'male' as Gender,
      phone: '13800138003',
      position: '访客',
      remark: '',
      projectRole: '只读访客',
      roles: ['viewer'],
    },
  },
  {
    id: 5,
    username: 'zhaoliu',
    realName: '赵六',
    roleName: '只读访客',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 5,
      username: 'zhaoliu',
      nickname: '赵六',
      avatar: '',
      gender: 'unknown' as Gender,
      phone: '13800138004',
      position: '访客',
      remark: '',
      projectRole: '只读访客',
      roles: ['viewer'],
    },
  },
  {
    id: 6,
    username: 'sunqi',
    realName: '孙七',
    roleName: '运营人员',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 6,
      username: 'sunqi',
      nickname: '孙七',
      avatar: '',
      gender: 'male' as Gender,
      phone: '13800138005',
      position: '运营专员',
      remark: '',
      projectRole: '运营人员',
      roles: ['operator'],
    },
  },
  {
    id: 7,
    username: 'viewer',
    realName: '演示访客',
    roleName: '受限访客',
    isSuperAdmin: false,
    password: '123456',
    profile: {
      id: 7,
      username: 'viewer',
      nickname: '演示访客',
      avatar: '',
      gender: 'unknown' as Gender,
      phone: '13800138006',
      position: '演示账号',
      remark: '用于演示菜单权限',
      projectRole: '受限访客',
      roles: ['viewer'],
    },
  },
]

function allEditPermissions(): UserModulePermission[] {
  return buildDefaultPermissions(
    Object.fromEntries(
      buildDefaultPermissions().map((m) => [m.moduleKey, 'edit' as PermissionLevel]),
    ),
  )
}

export const userPermissionsMap: Record<number, UserModulePermission[]> = {
  1: allEditPermissions(),
  2: buildDefaultPermissions({
    dashboard: 'view',
    role: 'view',
    system: 'none',
    merchant: 'edit',
    campaign: 'edit',
    notice: 'edit',
    visualization: 'view',
  }),
  3: buildDefaultPermissions({
    dashboard: 'view',
    role: 'none',
    system: 'none',
    merchant: 'none',
    campaign: 'view',
    notice: 'view',
    visualization: 'none',
  }),
  4: buildDefaultPermissions({
    dashboard: 'view',
    role: 'view',
    system: 'none',
    merchant: 'none',
    campaign: 'view',
    notice: 'view',
    visualization: 'view',
  }),
  5: buildDefaultPermissions({
    dashboard: 'view',
    role: 'none',
    system: 'none',
    merchant: 'none',
    campaign: 'none',
    notice: 'none',
    visualization: 'none',
  }),
  6: buildDefaultPermissions({
    dashboard: 'edit',
    role: 'view',
    system: 'view',
    merchant: 'none',
    campaign: 'view',
    notice: 'view',
    visualization: 'view',
  }),
  7: buildDefaultPermissions({
    dashboard: 'edit',
    role: 'none',
    system: 'view',
    merchant: 'edit',
    campaign: 'view',
    notice: 'edit',
    visualization: 'edit',
  }),
}

export function findUser(id: number): UserRecord | undefined {
  return users.find((u) => u.id === id)
}

export function resolveUserIdFromToken(token: string | null | undefined): number | null {
  if (!token) return null
  const normalized = token.replace(/^Bearer\s+/i, '').trim()
  return TOKEN_USER_MAP.get(normalized) ?? null
}

export function resolveUserIdFromAuthHeader(authHeader: string | null): number | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return resolveUserIdFromToken(authHeader.slice(7))
}

export function loginByCredentials(username: string, password: string) {
  const account = LOGIN_ACCOUNTS.find(
    (item) => item.username === username && item.password === password,
  )
  if (!account) return null
  const user = findUser(account.userId)
  if (!user) return null
  return { token: account.token, username: user.username }
}

export function getPermissionsByUserId(id: number): UserModulePermission[] {
  const user = findUser(id)
  if (!user) return []
  if (user.isSuperAdmin) {
    return allEditPermissions().map((p) => ({ ...p }))
  }
  return (userPermissionsMap[id] ?? buildDefaultPermissions()).map((p) => ({
    ...p,
    level: normalizeLevelForModule(p.moduleKey, p.level),
  }))
}

export function getUserInfoByUserId(id: number): UserInfo | null {
  const user = findUser(id)
  if (!user) return null
  return {
    ...user.profile,
    permissions: getPermissionsByUserId(id),
  }
}

export function getUserInfoByAuthHeader(authHeader: string | null): UserInfo | null {
  const userId = resolveUserIdFromAuthHeader(authHeader)
  if (!userId) return null
  return getUserInfoByUserId(userId)
}

export function updateUserProfile(userId: number, patch: Partial<UserInfo>): UserInfo | null {
  const user = findUser(userId)
  if (!user) return null
  user.profile = {
    ...user.profile,
    nickname: patch.nickname ?? user.profile.nickname,
    avatar: patch.avatar ?? user.profile.avatar,
    gender: patch.gender ?? user.profile.gender,
    phone: patch.phone ?? user.profile.phone,
    remark: patch.remark ?? user.profile.remark,
  }
  return getUserInfoByUserId(userId)
}

export function saveUserPermissions(
  userId: number,
  permissions: UserModulePermission[],
): UserModulePermission[] | null {
  const user = findUser(userId)
  if (!user || user.isSuperAdmin) return null
  userPermissionsMap[userId] = mergePermissions(permissions)
  return userPermissionsMap[userId].map((p) => ({ ...p }))
}

export function exportAllEditPermissions(): UserModulePermission[] {
  return allEditPermissions()
}
