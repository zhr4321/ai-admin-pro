import { http, HttpResponse } from 'msw'
import type { LoginParams, LoginResult, UserInfo } from '@/types/auth'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams

    if (body.username === 'admin' && body.password === '123456') {
      const data: LoginResult = {
        token: 'mock-token-admin',
        username: 'admin',
      }
      return HttpResponse.json({
        code: 0,
        message: '登录成功',
        data,
      })
    }

    return HttpResponse.json(
      { code: 401, message: '用户名或密码错误', data: null },
      { status: 401 },
    )
  }),

  http.get('/api/auth/userinfo', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 },
      )
    }

    const data: UserInfo = {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      roles: ['admin'],
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data,
    })
  }),
]
