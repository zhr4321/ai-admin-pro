export type PermissionLevel = 'none' | 'view' | 'edit'

export const PERMISSION_LEVEL_OPTIONS: { label: string; value: PermissionLevel }[] = [
  { label: '无', value: 'none' },
  { label: '可查看', value: 'view' },
  { label: '可修改', value: 'edit' },
]

export interface UserAccountItem {
  id: number
  username: string
  realName: string
  roleName: string
}

export interface UserSuggestItem extends UserAccountItem {
  isSuperAdmin: boolean
}

export interface UserSuggestParams {
  keyword: string
  limit?: number
}

export interface UserPermissionConfigResult {
  user: Pick<UserAccountItem, 'id' | 'username' | 'realName' | 'roleName'>
  permissions: UserModulePermission[]
  isLocked: boolean
}

export interface UserModulePermission {
  moduleKey: string
  moduleName: string
  level: PermissionLevel
}

export interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface UserListResult {
  list: UserAccountItem[]
  total: number
}

/** @deprecated 仅用于 /auth/permissions 兼容判断 */
export interface ModulePermission {
  moduleKey: string
  moduleName: string
  view: boolean
  edit: boolean
}

export interface UserPermissionSummary {
  permissions: ModulePermission[]
}
