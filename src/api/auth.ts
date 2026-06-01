import request from './request'
import type { LoginParams, LoginResult, UserInfo } from '@/types/auth'

export function login(data: LoginParams) {
  return request.post<LoginResult>('/auth/login', data)
}

export function getUserInfo() {
  return request.get<UserInfo>('/auth/userinfo')
}
