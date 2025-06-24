import {
  IconLayoutDashboard,
  IconServer,
  IconContainer,
  IconNetwork,
  IconActivity,
  IconChartBar,
  IconBell,
  IconFileText,
  IconSearch,
  IconRefresh,
  IconCloud,
  IconSettings,
  IconHelp,
  IconUserCog,
  IconPalette,
  IconNotification,
  IconTool,
  IconGitBranch,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Command } from 'lucide-react';
import type { SidebarData } from '@/types';

export const sidebarData: SidebarData = {
  user: {
    name: 'Hamza EL IDRISSI',
    email: 'hamza.ezzharelidrissi1@gmail.com',
    avatar: '',
  },
  teams: [
    {
      name: 'K8s Monitor',
      logo: Command,
      plan: 'Development Team',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Applications',
          url: '/applications',
          icon: IconContainer,
        },
        {
          title: 'Cluster Health',
          url: '/cluster',
          icon: IconNetwork,
        },
      ],
    },
    {
      title: 'Monitoring',
      items: [
        {
          title: 'Pods',
          url: '/pods',
          icon: IconServer,
          badge: 'Live',
        },
        {
          title: 'Deployments',
          url: '/deployments',
          icon: IconGitBranch,
        },
        {
          title: 'Services',
          url: '/services',
          icon: IconCloud,
        },
        {
          title: 'Events',
          url: '/events',
          icon: IconActivity,
        },
        {
          title: 'Alerts',
          url: '/alerts',
          icon: IconAlertTriangle,
          badge: '2',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          title: 'Performance',
          url: '/performance',
          icon: IconChartBar,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: IconFileText,
        },
        {
          title: 'Health Checks',
          url: '/health',
          icon: IconActivity,
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          title: 'Search',
          url: '/search',
          icon: IconSearch,
        },
        {
          title: 'Pod Actions',
          url: '/actions',
          icon: IconRefresh,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: IconBell,
          badge: '3',
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings/profile',
              icon: IconUserCog,
            },
            {
              title: 'Preferences',
              url: '/settings/preferences',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
          ],
        },
        {
          title: 'Help & Support',
          url: '/help',
          icon: IconHelp,
        },
      ],
    },
  ],
};
