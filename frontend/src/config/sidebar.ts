import {
  IconDashboard,
  IconApps,
  IconBuilding,
  IconServer,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';

export const useSidebarData = () => {
  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => podsApi.getApplications(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const { data: namespacesData } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => podsApi.getNamespaces(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const applications = applicationsData?.applications || [];
  const namespaces = namespacesData?.namespaces || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'unhealthy':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return {
    user: {
      name: 'Hamza El IDRISSI',
      email: 'hamza.ezzharelidrissi1@gmail.com',
      avatar: '',
    },
    teams: [
      {
        name: 'K8s Dashboard',
        logo: IconBuilding,
        plan: 'Enterprise',
      },
    ],
    navGroups: [
      {
        title: 'Dashboard',
        items: [
          {
            title: 'Overview',
            url: '/',
            icon: IconDashboard,
          },
        ],
      },
      {
        title: '📱 Applications',
        items: applications.map((app) => ({
          title: app.name,
          url: `/application/${app.namespace}/${app.name}`,
          icon: IconApps,
          badge: `${app.summary.readyPods}/${app.summary.totalPods}`,
          // Add status indicator as a prefix or custom styling
          description: `${getStatusIcon(app.status)} ${app.namespace}`,
        })),
      },
      {
        title: '🏷️ Namespaces',
        items: namespaces.map((ns) => ({
          title: ns.name,
          url: `/namespace/${ns.name}`,
          icon: IconServer,
          badge: ns.podCount?.toString() || '0',
          description: `${ns.podCount || 0} pods`,
        })),
      },
    ],
  };
};

// Export static data for fallback or when hooks can't be used
export const sidebarData = {
  user: {
    name: 'Hamza El IDRISSI',
    email: 'hamza.ezzharelidrissi1@gmail.com',
    avatar: '',
  },
  teams: [
    {
      name: 'K8s Dashboard',
      logo: IconBuilding,
      plan: 'Enterprise',
    },
  ],
  navGroups: [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Overview',
          url: '/',
          icon: IconDashboard,
        },
      ],
    },
    {
      title: '📱 Applications',
      items: [],
    },
    {
      title: '🏷️ Namespaces',
      items: [],
    },
  ],
};
