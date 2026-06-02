import type { Component } from 'vue'
import {
  Bell,
  DataAnalysis,
  Document,
  Flag,
  HomeFilled,
  Promotion,
  Setting,
  Tools,
  TrendCharts,
  UserFilled,
} from '@element-plus/icons-vue'

export interface AppModule {
  moduleKey: string
  moduleNameKey: string
  path: string
}

export interface MenuLeafConfig {
  moduleKey: string
  path: string
  titleKey: string
  icon: Component
}

export interface MenuGroupConfig {
  titleKey: string
  icon: Component
  children: MenuLeafConfig[]
}

export type MenuItemConfig = MenuLeafConfig | MenuGroupConfig

export function isMenuGroup(item: MenuItemConfig): item is MenuGroupConfig {
  return 'children' in item
}

/** 与侧边栏、权限配置对齐的功能模块清单 */
export const APP_MODULES: AppModule[] = [
  { moduleKey: 'dashboard', moduleNameKey: 'menu.dashboard', path: '/dashboard' },
  { moduleKey: 'role', moduleNameKey: 'menu.role', path: '/role' },
  { moduleKey: 'system', moduleNameKey: 'menu.system', path: '/settings' },
  { moduleKey: 'merchant', moduleNameKey: 'menu.merchant', path: '/merchant/onboarding' },
  { moduleKey: 'campaign', moduleNameKey: 'menu.campaign', path: '/operations/campaign' },
  { moduleKey: 'notice', moduleNameKey: 'menu.notice', path: '/operations/notice' },
  { moduleKey: 'visualization', moduleNameKey: 'menu.visualization', path: '/data-center/visualization' },
]

/** 侧边栏菜单结构（叶子节点绑定 moduleKey） */
export const MENU_ITEMS: MenuItemConfig[] = [
  { moduleKey: 'dashboard', path: '/dashboard', titleKey: 'menu.dashboard', icon: HomeFilled },
  { moduleKey: 'role', path: '/role', titleKey: 'menu.role', icon: UserFilled },
  {
    titleKey: 'menu.group.system',
    icon: Setting,
    children: [
      { moduleKey: 'system', path: '/settings', titleKey: 'menu.system', icon: Tools },
      { moduleKey: 'merchant', path: '/merchant/onboarding', titleKey: 'menu.merchant', icon: Document },
    ],
  },
  {
    titleKey: 'menu.group.operations',
    icon: Promotion,
    children: [
      { moduleKey: 'campaign', path: '/operations/campaign', titleKey: 'menu.campaign', icon: Flag },
      { moduleKey: 'notice', path: '/operations/notice', titleKey: 'menu.notice', icon: Bell },
    ],
  },
  {
    titleKey: 'menu.group.dataCenter',
    icon: DataAnalysis,
    children: [
      {
        moduleKey: 'visualization',
        path: '/data-center/visualization',
        titleKey: 'menu.visualization',
        icon: TrendCharts,
      },
    ],
  },
]

const ROUTE_MODULE_MAP = new Map(APP_MODULES.map((m) => [m.path, m.moduleKey]))

export function getModuleKeyByPath(path: string): string | undefined {
  return ROUTE_MODULE_MAP.get(path)
}

export const APP_MODULE_KEYS = APP_MODULES.map((m) => m.moduleKey)

/** 路由 meta.titleKey 映射 */
export const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/login': 'menu.login',
  '/dashboard': 'menu.dashboard',
  '/role': 'menu.role',
  '/operations/campaign': 'menu.campaign',
  '/operations/notice': 'menu.notice',
  '/settings': 'menu.system',
  '/merchant/onboarding': 'menu.merchant',
  '/data-center/visualization': 'menu.visualization',
  '/profile': 'menu.profile',
}

export function getRouteTitleKey(path: string): string | undefined {
  return ROUTE_TITLE_KEYS[path]
}
