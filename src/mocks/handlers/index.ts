import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { roleHandlers } from './role'

export const handlers = [...authHandlers, ...dashboardHandlers, ...roleHandlers]
