import { http, HttpResponse } from 'msw'
import type { LoginParams, LoginResult, UpdateProfileParams } from '@/types/auth'
import {
  getUserInfoByAuthHeader,
  loginByCredentials,
  updateUserProfile,
} from '@/mocks/data/users'
import { containsForbiddenWord, PHONE_PATTERN } from '@/utils/validators'

function validateProfilePayload(body: UpdateProfileParams): string | null {
  if (!body.nickname?.trim()) return '名称不能为空'
  if (!body.gender) return '请选择性别'
  if (!body.phone?.trim()) return '联系电话不能为空'
  if (!PHONE_PATTERN.test(body.phone.trim())) return '联系电话格式不正确'
  if (containsForbiddenWord(body.nickname)) return '名称包含违禁词，请修改'
  if (body.remark && containsForbiddenWord(body.remark)) return '个人备注包含违禁词，请修改'
  return null
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams
    const result = loginByCredentials(body.username, body.password)

    if (!result) {
      return HttpResponse.json(
        { code: 401, message: '用户名或密码错误', data: null },
        { status: 401 },
      )
    }

    const data: LoginResult = {
      token: result.token,
      username: result.username,
    }
    return HttpResponse.json({
      code: 0,
      message: '登录成功',
      data,
    })
  }),

  http.get('/api/auth/userinfo', ({ request }) => {
    const userInfo = getUserInfoByAuthHeader(request.headers.get('Authorization'))
    if (!userInfo) {
      return HttpResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 },
      )
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: userInfo,
    })
  }),

  http.put('/api/auth/profile', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const userInfo = getUserInfoByAuthHeader(authHeader)
    if (!userInfo) {
      return HttpResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 },
      )
    }

    const body = (await request.json()) as UpdateProfileParams
    const error = validateProfilePayload(body)
    if (error) {
      return HttpResponse.json({ code: 400, message: error, data: null })
    }

    const updated = updateUserProfile(userInfo.id, {
      nickname: body.nickname.trim(),
      avatar: body.avatar || '',
      gender: body.gender,
      phone: body.phone.trim(),
      remark: body.remark?.trim() || '',
    })

    return HttpResponse.json({
      code: 0,
      message: '保存成功',
      data: updated,
    })
  }),

  http.post('/api/auth/avatar', async ({ request }) => {
    const userInfo = getUserInfoByAuthHeader(request.headers.get('Authorization'))
    if (!userInfo) {
      return HttpResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({ code: 400, message: '请上传头像文件', data: null })
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    const url = `data:${file.type};base64,${btoa(binary)}`
    const updated = updateUserProfile(userInfo.id, { avatar: url })

    return HttpResponse.json({
      code: 0,
      message: '上传成功',
      data: { url: updated?.avatar || url },
    })
  }),
]
