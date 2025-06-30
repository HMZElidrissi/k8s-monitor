import {
  IconDashboard,
  IconApps,
  IconBuilding,
  IconServer,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';
import type { StatusType } from '@/components/ui/status-indicator';

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

  const mapApplicationStatus = (status: string): StatusType => {
    switch (status) {
      case 'healthy':
        return 'healthy';
      case 'degraded':
        return 'degraded';
      case 'unhealthy':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  };

  const getNamespaceStatus = (podCount: number): StatusType => {
    // Simple heuristic: if there are pods, it's healthy, otherwise unknown
    return podCount > 0 ? 'healthy' : 'unknown';
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
        title: 'Applications',
        items: applications.map((app) => ({
          title: app.name,
          url: `/application/${app.namespace}/${app.name}`,
          icon: IconApps,
          badge: `${app.summary.readyPods}/${app.summary.totalPods}`,
          // Use clean status format: "status namespace"
          description: `${mapApplicationStatus(app.status)} | ${app.namespace}`,
          metadata: {
            status: mapApplicationStatus(app.status),
            namespace: app.namespace,
          },
        })),
      },
      {
        title: 'Namespaces',
        items: namespaces.map((ns) => ({
          title: ns.name,
          url: `/namespace/${ns.name}`,
          icon: IconServer,
          badge: ns.podCount?.toString() || '0',
          description: `${getNamespaceStatus(ns.podCount || 0)} | ${ns.podCount || 0} pods`,
          metadata: {
            status: getNamespaceStatus(ns.podCount || 0),
            podCount: ns.podCount || 0,
          },
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
      title: 'Applications',
      items: [],
    },
    {
      title: 'Namespaces',
      items: [],
    },
  ],
};
