import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';
import { MonitorStatusCard } from '@/components/status/monitor-status-card';
import { PastIncidentsSection } from '@/components/status/past-incidents-section';
import type { Monitor, Incident } from '@/types/status';
import '@/lib/hash';

export default function ApplicationDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', namespace, name],
    queryFn: () => podsApi.getApplication(namespace!, name!),
    enabled: !!(namespace && name),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Application not found</h1>
          <p className='text-muted-foreground'>
            {name} in {namespace} namespace
          </p>
        </div>
      </div>
    );
  }

  // Transform application to monitor
  const monitor: Monitor = {
    id: `${namespace}-${name}`.hashCode(),
    name: application.name,
    description: `${application.type} in ${application.namespace} namespace`,
    url: `k8s://${namespace}/${name}`,
    periodicity: '1m',
    regions: [namespace!],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: generateUptimeData(application),
  };

  // Generate incidents from pod issues
  const incidents: Incident[] = generateIncidents(application);

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Header */}
        <div className='text-center space-y-4 mb-8'>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight'>
              {application.name}
            </h1>
            <p className='text-xl text-muted-foreground'>
              {application.type} in {application.namespace} namespace
            </p>
          </div>
          <div className='flex items-center justify-center gap-2'>
            <div
              className={`h-2 w-2 rounded-full animate-pulse ${
                application.status === 'healthy'
                  ? 'bg-green-500'
                  : application.status === 'degraded'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                application.status === 'healthy'
                  ? 'text-green-600'
                  : application.status === 'degraded'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {application.status === 'healthy'
                ? 'All systems operational'
                : application.status === 'degraded'
                  ? 'Some issues detected'
                  : 'Service disruption'}
            </span>
          </div>
        </div>

        {/* Monitor Status */}
        <section className='space-y-6 mb-8'>
          <h2 className='text-2xl font-semibold'>Service Status</h2>
          <MonitorStatusCard monitor={monitor} />
        </section>

        {/* Past Incidents */}
        <section>
          <PastIncidentsSection incidents={incidents} />
        </section>
      </div>
    </div>
  );
}

function generateUptimeData(application: any) {
  const createdAt = new Date(application.createdAt);
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

    if (application.status === 'healthy') {
      baseUptime = 0.995;
    } else if (application.status === 'degraded') {
      baseUptime = 0.92;
    } else if (application.status === 'unhealthy') {
      baseUptime = 0.7;
    }

    // Factor in restart rate (restarts per day since creation)
    const restartRate =
      application.summary.restartCount / Math.max(daysSinceCreation, 1);
    const restartPenalty = Math.min(restartRate * 0.02, 0.15); // Max 15% penalty

    // Factor in pod readiness ratio
    const readinessRatio =
      application.summary.readyPods /
      Math.max(application.summary.totalPods, 1);
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

function generateIncidents(application: any): Incident[] {
  const incidents: Incident[] = [];

  // Current incident if unhealthy
  if (application.status === 'unhealthy') {
    const failedPods = application.pods.filter(
      (pod: any) => pod.status === 'Failed' || !pod.ready
    );
    const latestIssue =
      failedPods.length > 0 ? new Date(failedPods[0].createdAt) : new Date();

    incidents.push({
      id: `current-${application.name}`,
      title: `${application.name} Service Degradation`,
      description: `Application is experiencing issues with ${application.summary.failedPods} failed pods and ${application.summary.totalPods - application.summary.readyPods} not ready`,
      status: 'ongoing',
      severity:
        application.summary.failedPods > application.summary.totalPods * 0.5
          ? 'major'
          : 'minor',
      startTime: latestIssue.toISOString(),
      affectedServices: [application.name],
      updates: [
        {
          id: 'update-1',
          timestamp: latestIssue.toISOString(),
          status: 'investigating',
          message: `Investigating service issues. ${application.summary.runningPods}/${application.summary.totalPods} pods running.`,
        },
      ],
    });
  }

  // Create incidents based on actual pod restart history
  const highRestartPods = application.pods.filter(
    (pod: any) => pod.restarts > 3
  );

  if (highRestartPods.length > 0) {
    // Get the most recent restart incident
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
        id: `restart-${application.name}-${restartTime.getTime()}`,
        title: `${application.name} Pod Restarts`,
        description: `Multiple pods experienced restarts. Pod '${mostRecentPod.name}' restarted ${mostRecentPod.restarts} times.`,
        status: 'resolved',
        severity: mostRecentPod.restarts > 10 ? 'major' : 'minor',
        startTime: restartTime.toISOString(),
        resolvedTime: resolvedTime.toISOString(),
        affectedServices: [application.name],
        updates: [
          {
            id: 'update-r1',
            timestamp: restartTime.toISOString(),
            status: 'investigating',
            message: `Pod restart detected for ${mostRecentPod.name}. Investigating root cause.`,
          },
          {
            id: 'update-r2',
            timestamp: resolvedTime.toISOString(),
            status: 'resolved',
            message: `Pod restarts stabilized. Application running normally.`,
          },
        ],
      });
    }
  }

  return incidents;
}
