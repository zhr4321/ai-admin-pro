import { authHandlers } from './auth'
import { campaignHandlers } from './campaign'
import { dashboardHandlers } from './dashboard'
import { merchantHandlers } from './merchant'
import { noticeHandlers } from './notice'
import { roleHandlers } from './role'
import { settingsHandlers } from './settings'

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...roleHandlers,
  ...campaignHandlers,
  ...noticeHandlers,
  ...settingsHandlers,
  ...merchantHandlers,
]
