import request from './request'
import type {
  AvatarUploadResult,
  LoginParams,
  LoginResult,
  UpdateProfileParams,
  UserInfo,
} from '@/types/auth'

export function login(data: LoginParams) {
  return request.post<LoginResult>('/auth/login', data)
}

export function getUserInfo() {
  return request.get<UserInfo>('/auth/userinfo')
}

export function updateProfile(data: UpdateProfileParams) {
  return request.put<UserInfo>('/auth/profile', data)
}

export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<AvatarUploadResult>('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
