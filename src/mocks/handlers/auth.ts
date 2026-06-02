import { http, HttpResponse } from 'msw'
import type { LoginParams, LoginResult, UpdateProfileParams } from '@/types/auth'
import {
  getUserInfoByAuthHeader,
  loginByCredentials,
  updateUserProfile,
} from '@/mocks/data/users'
import { containsForbiddenWord, PHONE_PATTERN } from '@/utils/validators'

function validateProfilePayload(body: UpdateProfileParams): { messageKey: string } | null {
  if (!body.nickname?.trim()) return { messageKey: 'errors.nicknameRequired' }
  if (!body.gender) return { messageKey: 'errors.genderRequired' }
  if (!body.phone?.trim()) return { messageKey: 'errors.contactPhoneRequired' }
  if (!PHONE_PATTERN.test(body.phone.trim())) return { messageKey: 'errors.contactPhoneInvalid' }
  if (containsForbiddenWord(body.nickname)) {
    return { messageKey: 'validation.forbiddenWord' }
  }
  if (body.remark && containsForbiddenWord(body.remark)) {
    return { messageKey: 'validation.forbiddenWord' }
  }
  return null
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams
    const result = loginByCredentials(body.username, body.password)

    if (!result) {
      return HttpResponse.json(
        { code: 401, messageKey: 'errors.loginFailed', message: '用户名或密码错误', data: null },
        { status: 401 },
      )
    }

    const data: LoginResult = {
      token: result.token,
      username: result.username,
    }
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data,
    })
  }),

  http.get('/api/auth/userinfo', ({ request }) => {
    const userInfo = getUserInfoByAuthHeader(request.headers.get('Authorization'))
    if (!userInfo) {
      return HttpResponse.json(
        { code: 401, messageKey: 'errors.unauthorized', message: '未登录', data: null },
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
        { code: 401, messageKey: 'errors.unauthorized', message: '未登录', data: null },
        { status: 401 },
      )
    }

    const body = (await request.json()) as UpdateProfileParams
    const error = validateProfilePayload(body)
    if (error) {
      return HttpResponse.json({
        code: 400,
        messageKey: error.messageKey,
        message: error.messageKey,
        data: null,
      })
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
      message: 'success',
      data: updated,
    })
  }),

  http.post('/api/auth/avatar', async ({ request }) => {
    const userInfo = getUserInfoByAuthHeader(request.headers.get('Authorization'))
    if (!userInfo) {
      return HttpResponse.json(
        { code: 401, messageKey: 'errors.unauthorized', message: '未登录', data: null },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({
        code: 400,
        messageKey: 'errors.uploadAvatarRequired',
        message: '请上传头像文件',
        data: null,
      })
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
      messageKey: 'common.uploadSuccess',
      message: '上传成功',
      data: { url: updated?.avatar || url },
    })
  }),
]
