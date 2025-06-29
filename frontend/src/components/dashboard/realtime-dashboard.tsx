import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ApplicationsResponse,
  type PodListResponse,
  podsApi,
  type PodStatus,
} from '@/services/podApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ApplicationCard } from '@/components/applications/application-card';
import { PodStatusCard } from '@/components/pods/pod-status-card';
import {
  IconActivity,
  IconServer,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { Application as ApiApplication } from '@/services/podApi';

interface RealtimeDashboardProps {
  namespace?: string;
}

export function RealtimeDashboard({
  namespace = 'default',
}: RealtimeDashboardProps) {
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('connecting');

  const { data: applicationsData, isLoading: applicationsLoading } =
    useQuery<ApplicationsResponse>({
      queryKey: ['applications', namespace],
      queryFn: () => podsApi.getApplications(namespace),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      refetchOnWindowFocus: false,
    });

  const { data: podsData, isLoading: podsLoading } = useQuery<PodListResponse>({
    queryKey: ['pods', namespace],
    queryFn: () => podsApi.getAllPods({ namespace }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    namespace,
    onConnect: () => setConnectionStatus('connected'),
    onDisconnect: () => setConnectionStatus('disconnected'),
    onMessage: (message) => {
      console.log('Real-time update:', message);
    },
  });

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  const applications: ApiApplication[] = applicationsData?.applications || [];
  const pods: PodStatus[] = podsData?.pods ?? [];
  //   const summary = applicationsData?.summary;

  // Calculate dashboard metrics
  const healthyApps = applications.filter(
    (app) => app.status === 'healthy'
  ).length;
  const runningPods = pods.filter(
    (pod: PodStatus) => pod.status === 'Running'
  ).length;
  const totalRestarts = pods.reduce<number>(
    (sum: number, pod: PodStatus) => sum + pod.restarts,
    0
  );
  const criticalIssues = applications.filter(
    (app) => app.status === 'unhealthy'
  ).length;

  return (
    <div className='space-y-6'>
      {/* Connection Status */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold tracking-tight'>
          K8s Monitor Dashboard
        </h1>
        <div className='flex items-center space-x-2'>
          <Badge
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={
              connectionStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : ''
            }
          >
            <IconActivity className='h-3 w-3 mr-1' />
            {connectionStatus === 'connected' ? 'Live' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Running Pods</CardTitle>
            <IconServer className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{runningPods}</div>
            <p className='text-xs text-muted-foreground'>
              {pods.length} total pods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Healthy Apps</CardTitle>
            <IconCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{healthyApps}</div>
            <p className='text-xs text-muted-foreground'>
              {applications.length} total applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Critical Issues
            </CardTitle>
            <IconAlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {criticalIssues}
            </div>
            <p className='text-xs text-muted-foreground'>
              Unhealthy applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Restarts
            </CardTitle>
            <IconActivity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalRestarts}</div>
            <p className='text-xs text-muted-foreground'>Across all pods</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='applications' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='applications'>Applications</TabsTrigger>
          <TabsTrigger value='pods'>Pods</TabsTrigger>
          <TabsTrigger value='events'>Events</TabsTrigger>
        </TabsList>

        <TabsContent value='applications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Application health overview with real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className='h-48 bg-gray-100 rounded-lg animate-pulse'
                    />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {applications.map((app) => (
                    <ApplicationCard
                      key={`${app.namespace}-${app.name}`}
                      application={app}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground'>
                    No applications found in namespace: {namespace}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='pods' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Pod Status</CardTitle>
              <CardDescription>
                Real-time pod monitoring and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {podsLoading ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className='h-64 bg-gray-100 rounded-lg animate-pulse'
                    />
                  ))}
                </div>
              ) : pods.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {pods.map((pod: PodStatus) => (
                    <PodStatusCard
                      key={`${pod.namespace}-${pod.name}`}
                      pod={pod}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground'>
                    No pods found in namespace: {namespace}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Real-time cluster events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <p className='text-muted-foreground'>
                  Events view coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
