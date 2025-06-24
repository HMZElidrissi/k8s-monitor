import type { To } from 'react-router-dom'
import type { Team, User } from '@/types';

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
}

export type NavLink = BaseNavItem & {
  url: To
  items?: never
}

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: To })[]
  url?: never
}

export type NavItem = NavCollapsible | NavLink

export interface NavGroup {
  title: string
  items: NavItem[]
}

export interface SidebarData {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}
