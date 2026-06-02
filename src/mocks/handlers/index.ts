import { authHandlers } from './auth'
import { campaignHandlers } from './campaign'
import { dashboardHandlers } from './dashboard'
import { noticeHandlers } from './notice'
import { roleHandlers } from './role'

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...roleHandlers,
  ...campaignHandlers,
  ...noticeHandlers,
]
