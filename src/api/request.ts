import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { resolveApiMessage } from '@/utils/i18nMessage'

export const TOKEN_KEY = 'token'

let isHandling401 = false

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 10000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code !== 0) {
      ElMessage.error(resolveApiMessage(res))
      return Promise.reject(new Error(res.message || resolveApiMessage(res)))
    }
    return res.data as typeof response.data
  },
  async (error) => {
    const status = error.response?.status
    const data = error.response?.data as ApiResponse | undefined
    const message = data
      ? resolveApiMessage(data)
      : error.message || resolveApiMessage({ messageKey: 'errors.networkError' })

    if (status === 401 && !isHandling401) {
      isHandling401 = true
      localStorage.removeItem(TOKEN_KEY)

      const { useUserStore } = await import('@/stores/user')
      useUserStore().clearAuth()

      ElMessage.error(
        data
          ? resolveApiMessage(data)
          : resolveApiMessage({ messageKey: 'errors.sessionExpired' }),
      )

      const { default: router } = await import('@/router')
      if (router.currentRoute.value.path !== '/login') {
        await router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }

      isHandling401 = false
      return Promise.reject(error)
    }

    ElMessage.error(message)
    return Promise.reject(error)
  },
)

type RequestConfig = AxiosRequestConfig

const request = {
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return axiosInstance.get(url, config) as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return axiosInstance.post(url, data, config) as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return axiosInstance.put(url, data, config) as Promise<T>
  },
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return axiosInstance.delete(url, config) as Promise<T>
  },
}

export default request
