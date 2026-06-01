import request from './request'
import type { DashboardStats } from '@/types/dashboard'

export function getDashboardStats() {
  return request.get<DashboardStats>('/dashboard/stats')
}
