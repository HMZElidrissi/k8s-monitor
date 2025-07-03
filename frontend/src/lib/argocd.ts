import type { ArgoCDApplication, Incident } from '@/types';

export function generateArgoCDUptimeData(argoCDApp: ArgoCDApplication) {
  const createdAt = new Date(argoCDApp.createdAt);
  const now = new Date();

  // Calculate actual days since creation (max 90 days for chart)
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysToShow = Math.min(daysSinceCreation + 1, 90);

  if (daysToShow <= 0) {
    return [];
  }

  const uptimeData = [];

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysToShow - 1 - i));

    if (date < createdAt) {
      continue;
    }

    // Base uptime on ArgoCD sync and health status
    let baseUptime = 0.99;

    if (
      argoCDApp.syncStatus === 'Synced' &&
      argoCDApp.healthStatus === 'Healthy'
    ) {
      baseUptime = 0.995;
    } else if (argoCDApp.syncStatus === 'OutOfSync') {
      baseUptime = 0.85;
    } else if (argoCDApp.healthStatus === 'Degraded') {
      baseUptime = 0.75;
    } else if (argoCDApp.healthStatus === 'Missing') {
      baseUptime = 0.5;
    }

    // Factor in resource health
    const totalResources = argoCDApp.resources.length;
    const healthyResources = argoCDApp.resources.filter(
      (r) => r.health === 'Healthy'
    ).length;
    const resourceHealthRatio =
      totalResources > 0 ? healthyResources / totalResources : 1;

    const uptime = Math.max(0.5, baseUptime * resourceHealthRatio);

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

export function generateArgoCDIncidents(
  argoCDApp: ArgoCDApplication
): Incident[] {
  const incidents: Incident[] = [];

  // Current incident if out of sync or unhealthy
  if (
    argoCDApp.syncStatus === 'OutOfSync' ||
    argoCDApp.healthStatus !== 'Healthy'
  ) {
    const severity =
      argoCDApp.healthStatus === 'Missing'
        ? 'major'
        : argoCDApp.syncStatus === 'OutOfSync'
          ? 'minor'
          : 'minor';

    incidents.push({
      id: `current-${argoCDApp.name}`,
      title: `${argoCDApp.name} ${argoCDApp.syncStatus === 'OutOfSync' ? 'Sync' : 'Health'} Issue`,
      description: `Application is ${argoCDApp.syncStatus} and ${argoCDApp.healthStatus}. ${argoCDApp.resources.filter((r) => r.status !== 'Synced').length} resources out of sync.`,
      status: 'ongoing',
      severity,
      startTime: argoCDApp.lastSyncTime || argoCDApp.createdAt,
      affectedServices: [argoCDApp.name],
      updates: [
        {
          id: 'update-1',
          timestamp: argoCDApp.lastSyncTime || argoCDApp.createdAt,
          status: 'investigating',
          message: `Application status: ${argoCDApp.syncStatus} / ${argoCDApp.healthStatus}. ${argoCDApp.resources.length} total resources.`,
        },
      ],
    });
  }

  // Generate incidents from degraded resources
  const degradedResources = argoCDApp.resources.filter(
    (r) => r.health === 'Degraded' || r.status !== 'Synced'
  );

  if (degradedResources.length > 0 && argoCDApp.syncStatus === 'Synced') {
    // Only add if the app is synced but has degraded resources (past incident)
    const incidentTime = new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ); // Random time in last 7 days
    const resolvedTime = new Date(incidentTime.getTime() + 30 * 60 * 1000);

    incidents.push({
      id: `resource-${argoCDApp.name}-${incidentTime.getTime()}`,
      title: `${argoCDApp.name} Resource Synchronization`,
      description: `${degradedResources.length} resources experienced sync issues. Affected: ${degradedResources.map((r) => r.name).join(', ')}.`,
      status: 'resolved',
      severity: degradedResources.length > 3 ? 'major' : 'minor',
      startTime: incidentTime.toISOString(),
      resolvedTime: resolvedTime.toISOString(),
      affectedServices: [argoCDApp.name],
      updates: [
        {
          id: 'update-r1',
          timestamp: incidentTime.toISOString(),
          status: 'investigating',
          message: `Resource synchronization issues detected for ${degradedResources.length} resources.`,
        },
        {
          id: 'update-r2',
          timestamp: resolvedTime.toISOString(),
          status: 'resolved',
          message: `All resources synchronized successfully. Application healthy.`,
        },
      ],
    });
  }

  return incidents;
}
