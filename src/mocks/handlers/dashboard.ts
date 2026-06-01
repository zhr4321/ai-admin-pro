import { http, HttpResponse } from 'msw'
import type { DashboardStats } from '@/types/dashboard'

export const dashboardHandlers = [
  http.get('/api/dashboard/stats', () => {
    const data: DashboardStats = {
      stats: [
        { title: '用户总数', value: '1,280', icon: 'User', color: 'var(--primary-color)' },
        { title: '今日访问', value: '356', icon: 'DataLine', color: 'var(--success)' },
        { title: '文档数量', value: '89', icon: 'Document', color: 'var(--warning)' },
        { title: '系统消息', value: '12', icon: 'Setting', color: 'var(--error)' },
      ],
    }

    return HttpResponse.json({
      code: 0,
      message: 'success',
      data,
    })
  }),
]
