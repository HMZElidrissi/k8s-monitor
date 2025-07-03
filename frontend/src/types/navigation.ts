import type { To } from 'react-router-dom';
import type { Team, Common } from '@/types';
import type { StatusType } from '@/components/ui/status-indicator';

interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  description?: string;
  metadata?: {
    status?: StatusType;
    namespace?: string;
    podCount?: number;
    [key: string]: any;
  };
}

export type NavLink = BaseNavItem & {
  url: To;
  items?: never;
  description?: string;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: To })[];
  url?: never;
};

export type NavItem = NavCollapsible | NavLink;

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface SidebarData {
  user: Common;
  teams: Team[];
  navGroups: NavGroup[];
}
