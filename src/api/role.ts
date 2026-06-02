import request from './request'
import type {
  UserListParams,
  UserListResult,
  UserModulePermission,
  UserPermissionConfigResult,
  UserPermissionSummary,
  UserSuggestItem,
  UserSuggestParams,
} from '@/types/role'

export function getCurrentPermissions() {
  return request.get<UserPermissionSummary>('/auth/permissions')
}

export function searchUsers(params: UserListParams) {
  return request.get<UserListResult>('/users', { params })
}

export function suggestUsers(params: UserSuggestParams) {
  return request.get<UserSuggestItem[]>('/users/suggest', { params })
}

export function getUserPermissionConfig(userId: number) {
  return request.get<UserPermissionConfigResult>(`/users/${userId}/permission-config`)
}

export function getUserPermissions(userId: number) {
  return request.get<UserModulePermission[]>(`/users/${userId}/permissions`)
}

export function updateUserPermissions(
  userId: number,
  permissions: UserModulePermission[],
) {
  return request.put<UserModulePermission[]>(`/users/${userId}/permissions`, {
    permissions,
  })
}
