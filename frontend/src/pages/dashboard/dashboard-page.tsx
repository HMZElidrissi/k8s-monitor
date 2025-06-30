import { Main } from '@/components/dashboard/main';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Overview } from '@/components/dashboard/overview';
import { RecentEvents } from '@/components/dashboard/recent-events';
import { RealtimeDashboard } from '@/components/dashboard/realtime-dashboard';
import { Badge } from '@/components/ui/badge';
import { IconDownload, IconActivity } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';
import type {
  PodListResponse,
  PodStatus,
  ApplicationsResponse,
  Application as ApiApplication,
} from '@/services/podApi';
import { healthApi } from '@/services/healthApi';

export default function DashboardPage() {
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.getHealth(),
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchOnWindowFocus: false, // Only manual refresh
  });
  const { data: applicationsData, isLoading: applicationsLoading } =
    useQuery<ApplicationsResponse>({
      queryKey: ['applications', 'all'],
      queryFn: () => podsApi.getApplications(),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      refetchOnWindowFocus: false,
    });
  const { data: podsData, isLoading: podsLoading } = useQuery<PodListResponse>({
    queryKey: ['pods', 'all'],
    queryFn: () => podsApi.getAllPods(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const applications: ApiApplication[] = applicationsData?.applications ?? [];
  const pods: PodStatus[] = podsData?.pods ?? [];

  // Calculate real-time metrics
  const runningPods = pods.filter((pod) => pod.status === 'Running').length;
  const healthyApps = applications.filter(
    (app) => app.status === 'healthy'
  ).length;
  const healthPercentage =
    applications.length > 0
      ? Math.round((healthyApps / applications.length) * 100)
      : 0;
  const criticalAlerts = applications.filter(
    (app) => app.status === 'unhealthy'
  ).length;

  return (
    <Main>
      <div className='mb-2 flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            K8s Monitor Dashboard
          </h1>
          {healthData && (
            <div className='flex items-center space-x-2 mt-2'>
              <Badge variant='outline' className='bg-green-50 text-green-700'>
                <IconActivity className='h-3 w-3 mr-1' />
                {healthData.status} • v{healthData.version}
              </Badge>
            </div>
          )}
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='outline'>
            <IconDownload className='h-4 w-4 mr-2' />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs
        orientation='vertical'
        defaultValue='overview'
        className='space-y-4'
      >
        <div className='w-full overflow-x-auto pb-2'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='applications'>Applications</TabsTrigger>
            <TabsTrigger value='pods'>Pods</TabsTrigger>
            <TabsTrigger value='alerts'>Alerts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Running Pods
                </CardTitle>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  className='text-muted-foreground h-4 w-4'
                >
                  <rect width='7' height='9' x='3' y='3' rx='1' />
                  <rect width='7' height='5' x='14' y='3' rx='1' />
                  <rect width='7' height='9' x='14' y='12' rx='1' />
                  <rect width='7' height='5' x='3' y='16' rx='1' />
                </svg>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{runningPods}</div>
                <p className='text-muted-foreground text-xs'>
                  {podsLoading ? 'Loading...' : `${pods.length} total pods`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Healthy Applications
                </CardTitle>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  className='text-muted-foreground h-4 w-4'
                >
                  <path d='M9 12l2 2 4-4' />
                  <path d='M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3' />
                  <path d='M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3' />
                  <path d='M3 12a9 9 0 0 1 9 9 9 9 0 0 1 9-9 9 9 0 0 1-9-9 9 9 0 0 1-9 9' />
                </svg>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{healthyApps}</div>
                <p className='text-muted-foreground text-xs'>
                  {applicationsLoading
                    ? 'Loading...'
                    : `${healthPercentage}% health rate`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Critical Alerts
                </CardTitle>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  className='text-muted-foreground h-4 w-4'
                >
                  <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
                  <line x1='12' y1='9' x2='12' y2='13' />
                  <line x1='12' y1='17' x2='12.01' y2='17' />
                </svg>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-red-600' : ''}`}
                >
                  {criticalAlerts}
                </div>
                <p className='text-muted-foreground text-xs'>
                  {criticalAlerts > 0 ? 'Requires attention' : 'All healthy'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  System Status
                </CardTitle>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  className='text-muted-foreground h-4 w-4'
                >
                  <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
                </svg>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {healthData?.status || 'Loading...'}
                </div>
                <p className='text-muted-foreground text-xs'>
                  {healthData
                    ? `Uptime: ${healthData.uptime}`
                    : 'Checking status...'}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-4'>
              <CardHeader>
                <CardTitle>Pod Status Overview</CardTitle>
                <CardDescription>
                  Real-time pod metrics and status distribution
                </CardDescription>
              </CardHeader>
              <CardContent className='pl-2'>
                <Overview />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3'>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest pod events and status changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentEvents />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='applications' className='space-y-4'>
          <RealtimeDashboard namespace='default' />
        </TabsContent>

        <TabsContent value='pods' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Pod Management</CardTitle>
              <CardDescription>
                Monitor and manage individual pods with real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeDashboard namespace='default' />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='alerts' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Current alerts and issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {criticalAlerts > 0 ? (
                <div className='space-y-4'>
                  {applications
                    .filter((app) => app.status === 'unhealthy')
                    .map((app) => (
                      <div
                        key={`${app.namespace}-${app.name}`}
                        className='border border-red-200 rounded-lg p-4 bg-red-50'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <h3 className='font-medium text-red-900'>
                              {app.name}
                            </h3>
                            <p className='text-sm text-red-700'>
                              {app.namespace} namespace
                            </p>
                          </div>
                          <Badge variant='destructive'>Unhealthy</Badge>
                        </div>
                        <p className='text-sm text-red-700 mt-2'>
                          {app.available_replicas}/{app.expected_replicas}{' '}
                          replicas available
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='text-green-600 text-6xl mb-4'>✓</div>
                  <p className='text-lg font-medium'>All systems operational</p>
                  <p className='text-muted-foreground'>
                    No active alerts at this time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Main>
  );
}
