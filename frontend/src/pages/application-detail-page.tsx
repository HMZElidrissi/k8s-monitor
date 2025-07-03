import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MonitorStatusCard } from '@/components/dashboard/monitor-status-card';
import { PastIncidentsSection } from '@/components/dashboard/past-incidents-section';
import type { Incident, Monitor } from '@/types';
import '@/lib/hash';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationDetailLoadingState } from '@/components/ui/loading-states';
import { ExternalLink, GitBranch, Package, Server } from 'lucide-react';
import {
  generateArgoCDIncidents,
  generateArgoCDUptimeData,
} from '@/lib/argocd';
import { applicationsApi } from '@/services/applicationApi.ts';

export default function ApplicationDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  // Fetch ArgoCD Application
  const { data: argoCDApp, isLoading } = useQuery({
    queryKey: ['argocd-application', namespace, name],
    queryFn: () => applicationsApi.getArgoCDApplication(namespace!, name!),
    enabled: !!(namespace && name),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return <ApplicationDetailLoadingState />;
  }

  if (!argoCDApp) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Application not found</h1>
          <p className='text-muted-foreground'>
            {name} in {namespace} namespace
          </p>
        </div>
      </div>
    );
  }

  // Transform application to monitor for status display
  const monitor: Monitor = {
    id: `${namespace}-${name}`.hashCode(),
    name: argoCDApp.name,
    description: `ArgoCD Application in ${argoCDApp.namespace} namespace`,
    url: argoCDApp.repoURL,
    periodicity: '1m',
    regions: [argoCDApp.destNamespace],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: generateArgoCDUptimeData(argoCDApp),
  };

  // Generate incidents from ArgoCD status
  const incidents: Incident[] = generateArgoCDIncidents(argoCDApp);

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center space-y-4 mb-8'>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight'>
              {argoCDApp.name}
            </h1>
            <p className='text-xl text-muted-foreground'>
              ArgoCD Application in {argoCDApp.namespace} namespace
            </p>
          </div>
          <div className='flex items-center justify-center gap-4'>
            <div className='flex items-center gap-2'>
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  argoCDApp.status === 'healthy'
                    ? 'bg-green-500'
                    : argoCDApp.status === 'degraded' ||
                        argoCDApp.status === 'out-of-sync' ||
                        argoCDApp.status === 'progressing'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  argoCDApp.status === 'healthy'
                    ? 'text-green-600'
                    : argoCDApp.status === 'degraded' ||
                        argoCDApp.status === 'out-of-sync' ||
                        argoCDApp.status === 'progressing'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {argoCDApp.status === 'healthy'
                  ? 'All systems operational'
                  : argoCDApp.status === 'out-of-sync'
                    ? 'Application out of sync'
                    : argoCDApp.status === 'progressing'
                      ? 'Deployment in progress'
                      : 'Service issues detected'}
              </span>
            </div>
            <Badge
              variant={
                argoCDApp.syncStatus === 'Synced' ? 'default' : 'destructive'
              }
            >
              {argoCDApp.syncStatus}
            </Badge>
            <Badge
              variant={
                argoCDApp.healthStatus === 'Healthy' ? 'default' : 'secondary'
              }
            >
              {argoCDApp.healthStatus}
            </Badge>
          </div>
        </div>

        {/* ArgoCD Information Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Repository</CardTitle>
              <GitBranch className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div
                className='text-sm font-mono truncate'
                title={argoCDApp.repoURL}
              >
                {argoCDApp.repoURL
                  .replace('https://', '')
                  .replace('http://', '')}
              </div>
              <p className='text-xs text-muted-foreground'>
                {argoCDApp.path || '/'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Target Revision
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-sm font-mono'>
                {argoCDApp.targetRevision || 'HEAD'}
              </div>
              <p className='text-xs text-muted-foreground'>Deployment target</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Destination</CardTitle>
              <Server className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-sm'>{argoCDApp.destNamespace}</div>
              <p
                className='text-xs text-muted-foreground font-mono truncate'
                title={argoCDApp.server}
              >
                {argoCDApp.server
                  .replace('https://', '')
                  .replace('http://', '')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Resources</CardTitle>
              <ExternalLink className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {argoCDApp.resources.length}
              </div>
              <p className='text-xs text-muted-foreground'>
                {
                  argoCDApp.resources.filter((r) => r.status === 'Synced')
                    .length
                }{' '}
                synced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resources Table */}
        {argoCDApp.resources.length > 0 && (
          <div className='mb-8'>
            <Card>
              <CardHeader>
                <CardTitle>Managed Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='text-left p-2'>Kind</th>
                        <th className='text-left p-2'>Name</th>
                        <th className='text-left p-2'>Namespace</th>
                        <th className='text-left p-2'>Sync Status</th>
                        <th className='text-left p-2'>Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {argoCDApp.resources.map((resource, index) => (
                        <tr key={index} className='border-b'>
                          <td className='p-2'>
                            <Badge variant='outline'>{resource.kind}</Badge>
                          </td>
                          <td className='p-2 font-mono text-sm'>
                            {resource.name}
                          </td>
                          <td className='p-2 text-sm text-muted-foreground'>
                            {resource.namespace}
                          </td>
                          <td className='p-2'>
                            <Badge
                              variant={
                                resource.status === 'Synced'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {resource.status}
                            </Badge>
                          </td>
                          <td className='p-2'>
                            <Badge
                              variant={
                                resource.health === 'Healthy'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {resource.health}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Uptime & Incidents side-by-side */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-12 mb-8 relative'>
          {/* Monitor Status */}
          <section className='space-y-6 mr-8'>
            <h2 className='text-2xl font-semibold'>Service Status</h2>
            <MonitorStatusCard monitor={monitor} />
          </section>

          {/* Vertical Separator (hidden on mobile) */}
          <div className='hidden xl:block absolute left-1/2 top-0 h-full -ml-4'>
            <Separator orientation='vertical' />
          </div>

          {/* Past Incidents */}
          <section>
            <h2 className='text-2xl font-semibold mb-6'>Incident History</h2>
            <PastIncidentsSection incidents={incidents} />
          </section>
        </div>
      </div>
    </div>
  );
}
