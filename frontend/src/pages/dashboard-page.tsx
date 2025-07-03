import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertTriangle,
  Clock,
  Container,
  Globe,
  Monitor,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { healthApi } from '@/services/healthApi';
import { podsApi } from '@/services/podApi';
import type { PodListResponse } from '@/types';
import { DashboardLoadingState } from '@/components/ui/loading-states';
import { MetricCard } from '@/components/dashboard/metric-card';
import { applicationsApi } from '@/services/applicationApi.ts';

interface RecentActivity {
  id: number;
  type: 'deployment' | 'restart' | 'scale' | 'sync';
  message: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info' | 'error';
}

const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
  const statusColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    error: 'bg-red-500',
  } as const;

  const typeVariants = {
    deployment: 'secondary',
    restart: 'outline',
    scale: 'secondary',
    sync: 'default',
  } as const;

  return (
    <div className='group flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200'>
      <div className='mt-1.5'>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            statusColors[activity.status as keyof typeof statusColors] ||
              statusColors.info
          )}
        />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium leading-relaxed'>
          {activity.message}
        </p>
        <div className='flex items-center gap-2 mt-2'>
          <p className='text-xs text-muted-foreground'>
            {activity.timestamp.toLocaleTimeString()}
          </p>
          <Badge
            variant={
              typeVariants[activity.type as keyof typeof typeVariants] ||
              'default'
            }
            className='text-xs'
          >
            {activity.type}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Generate recent activities from pod data
const generateRecentActivities = (pods?: PodListResponse): RecentActivity[] => {
  if (!pods || !pods.pods) return [];

  const activities: RecentActivity[] = [];
  let id = 1;

  // Generate activities based on pod states and restart counts
  pods.pods.slice(0, 4).forEach((pod) => {
    if (pod.restarts > 0) {
      activities.push({
        id: id++,
        type: 'restart',
        message: `Pod "${pod.name}" restarted in ${pod.namespace}`,
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Random time within last hour
        status: pod.restarts > 3 ? 'warning' : 'info',
      });
    }

    if (pod.status === 'Running' && pod.ready) {
      activities.push({
        id: id++,
        type: 'deployment',
        message: `Pod "${pod.name}" is running successfully in ${pod.namespace}`,
        timestamp: new Date(pod.createdAt),
        status: 'success',
      });
    }
  });

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 4);
};

export default function DashboardPage() {
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.getHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getArgoCDApplications(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: podsData,
    isLoading: podsLoading,
    error: podsError,
    refetch: refetchPods,
  } = useQuery({
    queryKey: ['pods'],
    queryFn: () => podsApi.getAllPods(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: namespacesData,
    isLoading: namespacesLoading,
    error: namespacesError,
    refetch: refetchNamespaces,
  } = useQuery({
    queryKey: ['namespaces'],
    queryFn: podsApi.getNamespaces,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Calculate derived values
  const isLoading =
    healthLoading || applicationsLoading || podsLoading || namespacesLoading;
  const hasError =
    healthError || applicationsError || podsError || namespacesError;

  const healthPercentage =
    applicationsData && applicationsData.total > 0
      ? Math.round(
          (applicationsData.summary.healthy / applicationsData.total) * 100
        )
      : 0;

  const podHealthPercentage =
    podsData && podsData.total > 0
      ? Math.round((podsData.summary.running / podsData.total) * 100)
      : 0;

  const recentActivities = generateRecentActivities(podsData);

  // Manual refresh function
  const handleRefresh = () => {
    refetchHealth();
    refetchApplications();
    refetchPods();
    refetchNamespaces();
  };

  // Loading state
  if (isLoading) {
    return <DashboardLoadingState />;
  }

  // Error state
  if (hasError && !isLoading) {
    const errorMessages = [
      healthError && 'Health check failed',
      applicationsError && 'Applications data failed',
      podsError && 'Pods data failed',
      namespacesError && 'Namespaces data failed',
    ].filter(Boolean);

    return (
      <div className='p-6 space-y-8'>
        <div className='text-center py-12'>
          <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2'>
            Unable to load dashboard
          </h2>
          <div className='text-muted-foreground mb-4'>
            <p>There was an error fetching the cluster data:</p>
            <ul className='mt-2 text-sm'>
              {errorMessages.map((msg, index) => (
                <li key={index} className='text-red-600'>
                  • {msg}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleRefresh}
            className='inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-8'>
      {/* Enhanced Header */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Cluster Overview
            </h1>
            <p className='text-muted-foreground mt-1'>
              Real-time monitoring of your Kubernetes infrastructure
            </p>
          </div>
          <div className='flex flex-col items-end space-y-2'>
            <div className='flex items-center gap-2'>
              <Badge variant='default' className='px-3 py-1'>
                <Activity className='h-4 w-4 mr-2' />
                {healthData?.status || 'loading...'}
              </Badge>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className='p-1 hover:bg-accent rounded transition-colors'
                title='Refresh data'
              >
                <RefreshCw
                  className={cn('h-4 w-4', isLoading && 'animate-spin')}
                />
              </button>
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium'>
                v{healthData?.version || '—'}
              </p>
              <p className='text-xs text-muted-foreground'>
                {healthData?.uptime || '—'} uptime
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      {/* Enhanced Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Applications'
          value={applicationsData?.total || 0}
          subtitle={`${healthPercentage}% healthy`}
          icon={Globe}
          isLoading={applicationsLoading}
        ></MetricCard>

        <MetricCard
          title='Pods'
          value={podsData?.total || 0}
          subtitle={`${podHealthPercentage}% running`}
          icon={Container}
          isLoading={podsLoading}
        />

        <MetricCard
          title='Namespaces'
          value={namespacesData?.total || 0}
          subtitle='active environments'
          icon={Server}
          isLoading={namespacesLoading}
        />

        <MetricCard
          title='System Health'
          value={healthData?.status || 'unknown'}
          subtitle={`${healthData?.uptime || '—'} uptime`}
          icon={Monitor}
          isLoading={healthLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className='border-b'>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <Clock className='h-4 w-4' />
            Recent Activity
            <Badge variant='outline' className='ml-auto text-xs'>
              <Zap className='h-3 w-3 mr-1' />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='divide-y'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='p-3 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <div className='flex gap-2'>
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className='divide-y'>
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className='p-6 text-center text-muted-foreground'>
              No recent activity to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
