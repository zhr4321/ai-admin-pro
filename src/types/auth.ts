export type Gender = 'male' | 'female' | 'unknown'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  username: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  gender: Gender
  phone: string
  position: string
  remark?: string
  projectRole: string
  roles: string[]
  permissions: import('@/types/role').UserModulePermission[]
}

export interface UpdateProfileParams {
  nickname: string
  avatar?: string
  gender: Gender
  phone: string
  remark?: string
}

export interface AvatarUploadResult {
  url: string
}
