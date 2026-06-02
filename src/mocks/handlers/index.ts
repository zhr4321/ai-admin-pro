import { authHandlers } from './auth'
import { aiChatHandlers } from './aiChat'
import { campaignHandlers } from './campaign'
import { dashboardHandlers } from './dashboard'
import { merchantHandlers } from './merchant'
import { noticeHandlers } from './notice'
import { roleHandlers } from './role'
import { settingsHandlers } from './settings'
import { visualizationHandlers } from './visualization'

export const handlers = [
  ...authHandlers,
  ...aiChatHandlers,
  ...dashboardHandlers,
  ...roleHandlers,
  ...campaignHandlers,
  ...noticeHandlers,
  ...settingsHandlers,
  ...merchantHandlers,
  ...visualizationHandlers,
]
