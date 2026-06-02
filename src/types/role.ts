export type PermissionLevel = 'none' | 'view' | 'edit'

export interface PermissionLevelOption {
  labelKey: string
  value: PermissionLevel
}

/** @deprecated 请使用 permission-config 接口返回的 options */
export const PERMISSION_LEVEL_OPTIONS: PermissionLevelOption[] = [
  { labelKey: 'menu.permission.none', value: 'none' },
  { labelKey: 'menu.permission.view', value: 'view' },
  { labelKey: 'menu.permission.edit', value: 'edit' },
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
  permissions: UserModulePermissionConfigItem[]
  isLocked: boolean
}

export interface UserModulePermissionConfigItem {
  moduleKey: string
  permissionNameKey: string
  level: PermissionLevel
  options: PermissionLevelOption[]
}

export interface UserModulePermission {
  moduleKey: string
  moduleNameKey: string
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

/** @deprecated 权限已并入 GET /auth/userinfo 的 permissions 字段，仅 mock 兼容保留 */
export interface ModulePermission {
  moduleKey: string
  moduleNameKey: string
  view: boolean
  edit: boolean
}

export interface UserPermissionSummary {
  permissions: ModulePermission[]
}
