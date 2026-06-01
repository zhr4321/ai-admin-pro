export interface DashboardStatItem {
  title: string
  value: string
  icon: string
  color: string
}

export interface DashboardStats {
  stats: DashboardStatItem[]
}
