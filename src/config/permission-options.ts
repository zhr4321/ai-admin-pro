import type {
  PermissionLevel,
  PermissionLevelOption,
  UserModulePermission,
  UserModulePermissionConfigItem,
} from '@/types/role'

export const STANDARD_PERMISSION_OPTIONS: PermissionLevelOption[] = [
  { labelKey: 'menu.permission.none', value: 'none' },
  { labelKey: 'menu.permission.view', value: 'view' },
  { labelKey: 'menu.permission.edit', value: 'edit' },
]

export const MERCHANT_PERMISSION_OPTIONS: PermissionLevelOption[] = [
  { labelKey: 'menu.permission.none', value: 'none' },
  { labelKey: 'menu.permission.operate', value: 'edit' },
]

export function getPermissionOptions(moduleKey: string): PermissionLevelOption[] {
  return moduleKey === 'merchant' ? MERCHANT_PERMISSION_OPTIONS : STANDARD_PERMISSION_OPTIONS
}

export function normalizeLevelForModule(
  moduleKey: string,
  level: PermissionLevel,
): PermissionLevel {
  if (moduleKey === 'merchant' && level === 'view') {
    return 'none'
  }
  return level
}

export function isLevelAllowedForModule(moduleKey: string, level: PermissionLevel): boolean {
  return getPermissionOptions(moduleKey).some((opt) => opt.value === level)
}

export function buildPermissionConfigItems(
  permissions: UserModulePermission[],
): UserModulePermissionConfigItem[] {
  return permissions.map((item) => {
    const level = normalizeLevelForModule(item.moduleKey, item.level)
    return {
      moduleKey: item.moduleKey,
      permissionNameKey: item.moduleNameKey,
      level,
      options: getPermissionOptions(item.moduleKey),
    }
  })
}

export function toStoredPermissions(
  items: Pick<UserModulePermissionConfigItem, 'moduleKey' | 'permissionNameKey' | 'level'>[],
): UserModulePermission[] {
  return items.map((item) => ({
    moduleKey: item.moduleKey,
    moduleNameKey: item.permissionNameKey,
    level: normalizeLevelForModule(item.moduleKey, item.level),
  }))
}
