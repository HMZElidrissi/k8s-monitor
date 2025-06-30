import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';
import { MonitorStatusCard } from '@/components/status/monitor-status-card';
import type { Monitor, Incident } from '@/types/status';
import { PastIncidentsSection } from '@/components/status/past-incidents-section';
import '@/lib/hash';

export default function NamespaceDetailPage() {
  const { namespace } = useParams<{ namespace: string }>();

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications', namespace],
    queryFn: () => podsApi.getApplications(namespace!),
    enabled: !!namespace,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-64 bg-gray-200 rounded'></div>
          ))}
        </div>
      </div>
    );
  }

  const applications = applicationsData?.applications || [];
  const summary = applicationsData?.summary;

  // Transform applications to monitors
  const monitors: Monitor[] = applications.map((app) => ({
    id: `${app.namespace}-${app.name}`.hashCode(),
    name: app.name,
    description: `${app.type} • ${app.summary.totalPods} pods`,
    url: `k8s://${app.namespace}/${app.name}`,
    periodicity: '1m',
    regions: [namespace!],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: generateUptimeData(app),
  }));

  // Generate namespace-level incidents
  const incidents: Incident[] = generateNamespaceIncidents(applications);

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Header */}
        <div className='text-center space-y-4 mb-8'>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight'>
              {namespace} Namespace
            </h1>
            <p className='text-xl text-muted-foreground'>
              {applications.length} applications • {summary?.totalPods || 0}{' '}
              total pods
            </p>
          </div>
          <div className='flex items-center justify-center gap-2'>
            <div
              className={`h-2 w-2 rounded-full animate-pulse ${
                summary?.unhealthy === 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                summary?.unhealthy === 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary?.unhealthy === 0
                ? 'All applications operational'
                : `${summary?.unhealthy} applications need attention`}
            </span>
          </div>
        </div>

        {/* Applications Status */}
        <section className='space-y-6 mb-8'>
          <h2 className='text-2xl font-semibold'>Applications Status</h2>
          {monitors.length > 0 ? (
            monitors.map((monitor) => (
              <MonitorStatusCard key={monitor.id} monitor={monitor} />
            ))
          ) : (
            <div className='text-center py-12 bg-muted/30 rounded-lg'>
              <p className='text-muted-foreground'>
                No applications found in this namespace
              </p>
            </div>
          )}
        </section>

        {/* Past Incidents */}
        <section>
          <PastIncidentsSection incidents={incidents} />
        </section>
      </div>
    </div>
  );
}

function generateUptimeData(app: any) {
  const createdAt = new Date(app.createdAt);
  const now = new Date();

  // Calculate actual days since creation (max 90 days for chart)
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysToShow = Math.min(daysSinceCreation + 1, 90); // +1 to include today

  if (daysToShow <= 0) {
    return [];
  }

  const uptimeData = [];

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysToShow - 1 - i));

    // Only show data for days after creation
    if (date < createdAt) {
      continue;
    }

    // Base uptime on current application health (more realistic)
    let baseUptime = 0.99; // Default high uptime

    if (app.status === 'healthy') {
      baseUptime = 0.995;
    } else if (app.status === 'degraded') {
      baseUptime = 0.92;
    } else if (app.status === 'unhealthy') {
      baseUptime = 0.7;
    }

    // Factor in restart rate (restarts per day since creation)
    const restartRate =
      app.summary.restartCount / Math.max(daysSinceCreation, 1);
    const restartPenalty = Math.min(restartRate * 0.02, 0.15); // Max 15% penalty

    // Factor in pod readiness ratio
    const readinessRatio =
      app.summary.readyPods / Math.max(app.summary.totalPods, 1);
    const readinessPenalty = (1 - readinessRatio) * 0.1;

    const uptime = Math.max(
      0.5,
      baseUptime - restartPenalty - readinessPenalty
    );

    const totalChecks = 1440; // Every minute
    const successfulChecks = Math.floor(totalChecks * uptime);

    uptimeData.push({
      day: date.toISOString().split('T')[0],
      ok: successfulChecks,
      count: totalChecks,
    });
  }

  return uptimeData;
}

function generateNamespaceIncidents(applications: any[]): Incident[] {
  const incidents: Incident[] = [];

  applications.forEach((app) => {
    // Current incidents for unhealthy applications
    if (app.status === 'unhealthy') {
      const failedPods = app.pods.filter(
        (pod: any) => pod.status === 'Failed' || !pod.ready
      );
      const latestIssue =
        failedPods.length > 0 ? new Date(failedPods[0].createdAt) : new Date();

      incidents.push({
        id: `ns-${app.name}-current`,
        title: `${app.name} Service Issues`,
        description: `Application ${app.name} has ${app.summary.failedPods} failed pods and ${app.summary.totalPods - app.summary.readyPods} not ready`,
        status: 'ongoing',
        severity:
          app.summary.failedPods > app.summary.totalPods * 0.5
            ? 'major'
            : 'minor',
        startTime: latestIssue.toISOString(),
        affectedServices: [app.name],
        updates: [
          {
            id: 'update-1',
            timestamp: latestIssue.toISOString(),
            status: 'investigating',
            message: `Investigating issues with ${app.name}. ${app.summary.runningPods}/${app.summary.totalPods} pods operational.`,
          },
        ],
      });
    }

    // Recent restart incidents for applications with high restart counts
    const highRestartPods = app.pods.filter((pod: any) => pod.restarts > 3);

    if (highRestartPods.length > 0) {
      const mostRecentPod = highRestartPods.reduce(
        (latest: any, current: any) => {
          const latestRestart = latest.containers?.[0]?.lastRestart
            ? new Date(latest.containers[0].lastRestart)
            : new Date(latest.createdAt);
          const currentRestart = current.containers?.[0]?.lastRestart
            ? new Date(current.containers[0].lastRestart)
            : new Date(current.createdAt);
          return currentRestart > latestRestart ? current : latest;
        }
      );

      const restartTime = mostRecentPod.containers?.[0]?.lastRestart
        ? new Date(mostRecentPod.containers[0].lastRestart)
        : new Date(mostRecentPod.createdAt);

      // Only create incident if restarts happened recently (within last 7 days)
      const daysSinceRestart =
        (new Date().getTime() - restartTime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceRestart <= 7) {
        const resolvedTime = new Date(restartTime.getTime() + 30 * 60 * 1000); // Assume 30 min resolution

        incidents.push({
          id: `ns-${app.name}-restart-${restartTime.getTime()}`,
          title: `${app.name} Pod Restarts`,
          description: `Application experienced pod restarts. Pod '${mostRecentPod.name}' restarted ${mostRecentPod.restarts} times.`,
          status: 'resolved',
          severity: mostRecentPod.restarts > 10 ? 'major' : 'minor',
          startTime: restartTime.toISOString(),
          resolvedTime: resolvedTime.toISOString(),
          affectedServices: [app.name],
          updates: [
            {
              id: 'update-r1',
              timestamp: restartTime.toISOString(),
              status: 'investigating',
              message: `Pod restart detected for ${mostRecentPod.name} in ${app.name}.`,
            },
            {
              id: 'update-r2',
              timestamp: resolvedTime.toISOString(),
              status: 'resolved',
              message: `Pod restarts resolved. ${app.name} running normally.`,
            },
          ],
        });
      }
    }
  });

  return incidents;
}
