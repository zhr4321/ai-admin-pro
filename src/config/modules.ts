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
  moduleName: string
  path: string
}

export interface MenuLeafConfig {
  moduleKey: string
  path: string
  title: string
  icon: Component
}

export interface MenuGroupConfig {
  title: string
  icon: Component
  children: MenuLeafConfig[]
}

export type MenuItemConfig = MenuLeafConfig | MenuGroupConfig

export function isMenuGroup(item: MenuItemConfig): item is MenuGroupConfig {
  return 'children' in item
}

/** 与侧边栏、权限配置对齐的功能模块清单 */
export const APP_MODULES: AppModule[] = [
  { moduleKey: 'dashboard', moduleName: '首页', path: '/dashboard' },
  { moduleKey: 'role', moduleName: '用户权限', path: '/role' },
  { moduleKey: 'system', moduleName: '系统设置', path: '/settings' },
  { moduleKey: 'merchant', moduleName: '商户入驻', path: '/merchant/onboarding' },
  { moduleKey: 'campaign', moduleName: '活动推广', path: '/operations/campaign' },
  { moduleKey: 'notice', moduleName: '公告管理', path: '/operations/notice' },
  { moduleKey: 'visualization', moduleName: '数据可视化', path: '/data-center/visualization' },
]

/** 侧边栏菜单结构（叶子节点绑定 moduleKey） */
export const MENU_ITEMS: MenuItemConfig[] = [
  { moduleKey: 'dashboard', path: '/dashboard', title: '首页', icon: HomeFilled },
  { moduleKey: 'role', path: '/role', title: '用户权限', icon: UserFilled },
  {
    title: '系统管理',
    icon: Setting,
    children: [
      { moduleKey: 'system', path: '/settings', title: '系统设置', icon: Tools },
      { moduleKey: 'merchant', path: '/merchant/onboarding', title: '商户入驻', icon: Document },
    ],
  },
  {
    title: '运营中心',
    icon: Promotion,
    children: [
      { moduleKey: 'campaign', path: '/operations/campaign', title: '活动推广', icon: Flag },
      { moduleKey: 'notice', path: '/operations/notice', title: '公告管理', icon: Bell },
    ],
  },
  {
    title: '数据中心',
    icon: DataAnalysis,
    children: [
      {
        moduleKey: 'visualization',
        path: '/data-center/visualization',
        title: '数据可视化',
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
