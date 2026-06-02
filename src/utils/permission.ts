import { APP_MODULES } from '@/config/modules'
import { normalizeLevelForModule } from '@/config/permission-options'
import type { PermissionLevel, UserModulePermission } from '@/types/role'

export function canViewModule(level: PermissionLevel): boolean {
  return level === 'view' || level === 'edit'
}

export function canEditModule(level: PermissionLevel): boolean {
  return level === 'edit'
}

export function getModuleLevel(
  permissions: UserModulePermission[] | undefined,
  moduleKey: string,
): PermissionLevel {
  const found = permissions?.find((p) => p.moduleKey === moduleKey)
  return found?.level ?? 'none'
}

export function buildDefaultPermissions(
  config: Partial<Record<string, PermissionLevel>> = {},
): UserModulePermission[] {
  return APP_MODULES.map((m) => ({
    moduleKey: m.moduleKey,
    moduleNameKey: m.moduleNameKey,
    level: config[m.moduleKey] ?? 'none',
  }))
}

export function mergePermissions(
  permissions: UserModulePermission[],
): UserModulePermission[] {
  const levelMap = new Map(
    permissions.map((p) => [p.moduleKey, normalizeLevelForModule(p.moduleKey, p.level)]),
  )
  return buildDefaultPermissions(Object.fromEntries(levelMap))
}

export function getModuleNameKey(moduleKey: string): string {
  return APP_MODULES.find((m) => m.moduleKey === moduleKey)?.moduleNameKey ?? moduleKey
}
