import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Types
interface DailyStats {
  ok: number;
  count: number;
  day: string;
}

interface Monitor {
  id: number;
  name: string | null;
  description: string | null;
  url: string;
  periodicity: string;
  regions: string[];
  method: string;
  body: string;
  headers: Array<{ key: string; value: string }>;
  active: boolean;
  data: DailyStats[];
}

interface IncidentUpdate {
  id: string;
  timestamp: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  message: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  resolvedTime?: string;
  affectedServices: string[];
  updates: IncidentUpdate[];
}

// Constants
const OPERATIONAL = 0.98;
const DEGRADED = 0.9;

function getStatusConfig(value: number) {
  if (isNaN(value)) {
    return {
      color: 'bg-muted hover:bg-muted/80',
      label: 'No Data',
      badgeVariant: 'outline' as const,
      textColor: 'text-muted-foreground',
    };
  }
  if (value > OPERATIONAL) {
    return {
      color:
        'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
      label: 'Operational',
      badgeVariant: 'default' as const,
      textColor: 'text-green-600 dark:text-green-400',
    };
  }
  if (value > DEGRADED) {
    return {
      color:
        'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700',
      label: 'Degraded',
      badgeVariant: 'secondary' as const,
      textColor: 'text-yellow-600 dark:text-yellow-400',
    };
  }
  return {
    color: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
    label: 'Down',
    badgeVariant: 'destructive' as const,
    textColor: 'text-red-600 dark:text-red-400',
  };
}

// Status Bar Component
function StatusBar({ ok, count, day }: DailyStats) {
  const ratio = ok / count;
  const config = getStatusConfig(ratio);
  const percentage = Math.round(ratio * 100);
  const failed = count - ok;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'h-8 rounded-sm cursor-pointer transition-all duration-200 border border-transparent hover:border-border',
            config.color
          )}
          style={{ flex: 1 }}
        />
      </TooltipTrigger>
      <TooltipContent
        side='bottom'
        className='bg-card text-card-foreground border shadow-lg'
      >
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-4'>
            <span className='font-medium'>{config.label}</span>
            <Badge variant={config.badgeVariant} className='text-xs'>
              {percentage}%
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground'>
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
            }).format(new Date(day))}
          </div>
          <Separator />
          <div className='grid grid-cols-2 gap-4 text-xs'>
            <div>
              <span className='text-green-600 dark:text-green-400 font-mono'>
                {ok}
              </span>
              <span className='text-muted-foreground ml-1'>successful</span>
            </div>
            <div>
              <span className='text-red-600 dark:text-red-400 font-mono'>
                {failed}
              </span>
              <span className='text-muted-foreground ml-1'>failed</span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Incident status configuration
function getIncidentConfig(
  severity: 'minor' | 'major' | 'critical',
  status: 'ongoing' | 'resolved'
) {
  const severityConfig = {
    minor: {
      color: 'bg-yellow-500/10 border-yellow-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      badgeVariant: 'secondary' as const,
    },
    major: {
      color: 'bg-orange-500/10 border-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'destructive' as const,
    },
    critical: {
      color: 'bg-red-500/10 border-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
      badgeVariant: 'destructive' as const,
    },
  };

  const statusConfig = {
    ongoing: {
      icon: '🔍',
      label: 'Ongoing',
    },
    resolved: {
      icon: '✅',
      label: 'Resolved',
    },
  };

  return {
    ...severityConfig[severity],
    ...statusConfig[status],
  };
}

// Incident Card Component
function IncidentCard({ incident }: { incident: Incident }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = getIncidentConfig(incident.severity, incident.status);
  const duration = incident.resolvedTime
    ? Math.round(
        (new Date(incident.resolvedTime).getTime() -
          new Date(incident.startTime).getTime()) /
          (1000 * 60)
      )
    : Math.round(
        (Date.now() - new Date(incident.startTime).getTime()) / (1000 * 60)
      );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('transition-all duration-200', config.color)}>
        <CollapsibleTrigger asChild>
          <CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2 flex-1'>
                <div className='flex items-center gap-3'>
                  <span className='text-lg'>{config.icon}</span>
                  <div>
                    <CardTitle className='text-base'>
                      {incident.title}
                    </CardTitle>
                    <CardDescription className='text-sm mt-1'>
                      {incident.description}
                    </CardDescription>
                  </div>
                </div>

                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <span>Started {formatTimestamp(incident.startTime)}</span>
                  <Separator orientation='vertical' className='h-3' />
                  <span>Duration: {formatDuration(duration)}</span>
                  {incident.affectedServices.length > 0 && (
                    <>
                      <Separator orientation='vertical' className='h-3' />
                      <span>
                        Affected: {incident.affectedServices.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-2 ml-4'>
                <Badge variant={config.badgeVariant} className='capitalize'>
                  {incident.severity}
                </Badge>
                <Badge
                  variant={
                    incident.status === 'resolved' ? 'default' : 'secondary'
                  }
                >
                  {config.label}
                </Badge>
                <span
                  className={cn(
                    'text-xs transition-transform',
                    isOpen && 'rotate-180'
                  )}
                >
                  ▼
                </span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className='pt-0'>
            <div className='space-y-4'>
              <Separator />
              <div>
                <h4 className='text-sm font-semibold mb-3'>
                  Incident Timeline
                </h4>
                <div className='space-y-3'>
                  {incident.updates.map((update, index) => (
                    <div key={update.id} className='flex gap-3'>
                      <div className='flex flex-col items-center'>
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-2',
                            update.status === 'resolved'
                              ? 'bg-green-500'
                              : update.status === 'identified'
                                ? 'bg-blue-500'
                                : update.status === 'monitoring'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-500'
                          )}
                        />
                        {index < incident.updates.length - 1 && (
                          <div className='w-px h-6 bg-border mt-1' />
                        )}
                      </div>
                      <div className='flex-1 pb-2'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Badge
                            variant='outline'
                            className='text-xs capitalize'
                          >
                            {update.status.replace('_', ' ')}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>
                            {formatTimestamp(update.timestamp)}
                          </span>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          {update.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Past Incidents Section Component
function PastIncidentsSection({ incidents }: { incidents: Incident[] }) {
  const [showResolved, setShowResolved] = React.useState(false);

  const ongoingIncidents = incidents.filter(
    (incident) => incident.status === 'ongoing'
  );
  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === 'resolved'
  );

  if (incidents.length === 0) {
    return (
      <Card className='text-center py-12'>
        <CardContent>
          <div className='space-y-4'>
            <div className='text-4xl'>🎉</div>
            <div>
              <h3 className='text-lg font-semibold'>No incidents reported</h3>
              <p className='text-muted-foreground'>
                All systems have been running smoothly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Ongoing Incidents */}
      {ongoingIncidents.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-semibold'>Active Incidents</h2>
            <Badge variant='destructive' className='text-xs'>
              {ongoingIncidents.length}
            </Badge>
          </div>
          <div className='space-y-3'>
            {ongoingIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </div>
      )}

      {/* Past Incidents */}
      {resolvedIncidents.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>Past Incidents</h2>
            <button
              onClick={() => setShowResolved(!showResolved)}
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              {showResolved ? 'Hide' : 'Show'} resolved incidents (
              {resolvedIncidents.length})
            </button>
          </div>

          {showResolved && (
            <div className='space-y-3'>
              {resolvedIncidents.slice(0, 10).map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
              {resolvedIncidents.length > 10 && (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  Showing 10 most recent incidents.{' '}
                  {resolvedIncidents.length - 10} more not shown.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Monitor Status Card Component
function MonitorStatusCard({ monitor }: { monitor: Monitor }) {
  const recentData = monitor.data.slice(-90); // Last 90 days
  const overallUptime =
    recentData.reduce((acc, day) => acc + day.ok / day.count, 0) /
    recentData.length;
  const uptimePercentage = Math.round(overallUptime * 100);
  const statusConfig = getStatusConfig(overallUptime);

  return (
    <Card className='hover:shadow-md transition-shadow duration-200'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1 flex-1'>
            <CardTitle className='text-lg'>{monitor.name}</CardTitle>
            {monitor.description && (
              <CardDescription className='text-sm'>
                {monitor.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={statusConfig.badgeVariant} className='ml-4'>
            {statusConfig.label}
          </Badge>
        </div>

        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          <span>
            Uptime:{' '}
            <span
              className={cn('font-mono font-semibold', statusConfig.textColor)}
            >
              {uptimePercentage}%
            </span>
          </span>
          <Separator orientation='vertical' className='h-4' />
          <span>Checked every {monitor.periodicity}</span>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div>
          <div className='flex justify-between text-xs text-muted-foreground mb-2'>
            <span>90 days ago</span>
            <span>Today</span>
          </div>
          <div className='flex gap-1 h-8'>
            {recentData.map((stat, index) => (
              <StatusBar key={`${stat.day}-${index}`} {...stat} />
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Overall uptime</span>
            <span className={cn('font-semibold', statusConfig.textColor)}>
              {uptimePercentage}%
            </span>
          </div>
          <Progress value={uptimePercentage} className='h-2' />
        </div>
      </CardContent>
    </Card>
  );
}

// Header Component
function StatusHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className='text-center space-y-4 mb-8'>
      <div className='space-y-2'>
        <h1 className='text-4xl font-bold tracking-tight'>{title}</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          {subtitle}
        </p>
      </div>
      <div className='flex items-center justify-center gap-2'>
        <div className='h-2 w-2 bg-green-500 rounded-full animate-pulse' />
        <span className='text-sm font-medium text-green-600 dark:text-green-400'>
          All systems operational
        </span>
      </div>
    </div>
  );
}

// Footer Component
function StatusFooter() {
  return (
    <footer className='border-t bg-muted/30 mt-16'>
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center space-y-4'>
          <p className='text-sm text-muted-foreground'>
            powered by{' '}
            <a
              href='https://www.openstatus.dev'
              target='_blank'
              rel='noopener noreferrer'
              className='font-medium text-foreground hover:underline underline-offset-4'
            >
              openstatus.dev
            </a>
          </p>
          <div className='flex justify-center'>
            <Badge variant='outline' className='text-xs'>
              <a
                href='https://github.com/openstatusHQ/astro-status-page'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 hover:text-foreground'
              >
                Fork on GitHub
                <span aria-hidden='true'>↗</span>
              </a>
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main StatusPage component
interface StatusPageProps {
  monitors: Monitor[];
  incidents?: Incident[];
  title?: string;
  subtitle?: string;
}

export default function StatusPage({
  monitors,
  incidents = sampleIncidents,
  title = 'System Status',
  subtitle = 'Real-time status and uptime monitoring for our services',
}: StatusPageProps) {
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        <StatusHeader title={title} subtitle={subtitle} />

        <main>
          {/* Uptime & Incidents side-by-side */}
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-12 relative'>
            {/* Service Status Section */}
            <section className='space-y-6'>
              <h2 className='text-2xl font-semibold'>Service Status</h2>
              {monitors.map((monitor) => (
                <MonitorStatusCard key={monitor.id} monitor={monitor} />
              ))}

              {monitors.length === 0 && (
                <Card className='text-center py-12'>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='text-4xl'>📊</div>
                      <div>
                        <h3 className='text-lg font-semibold'>
                          No monitors configured
                        </h3>
                        <p className='text-muted-foreground'>
                          Add some monitors to start tracking your services.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Vertical Separator (hidden on mobile) */}
            <div className='hidden xl:block absolute left-1/2 top-0 h-full -ml-6'>
              <Separator orientation='vertical' />
            </div>

            {/* Past Incidents Section */}
            <section>
              <h2 className='text-2xl font-semibold mb-6'>Incident History</h2>
              <PastIncidentsSection incidents={incidents} />
            </section>
          </div>
        </main>
      </div>

      <StatusFooter />
    </div>
  );
}

// Example usage with sample data
export const sampleMonitors: Monitor[] = [
  {
    id: 1,
    name: 'API Endpoint',
    description: 'Main API service monitoring',
    url: 'https://api.example.com',
    periodicity: '5m',
    regions: ['us-east-1', 'eu-west-1'],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: Array.from({ length: 90 }, (_, i) => ({
      day: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      ok: Math.floor(Math.random() * 100) + 200,
      count: Math.floor(Math.random() * 100) + 250,
    })),
  },
  {
    id: 666,
    name: 'Website',
    description: 'Frontend application status',
    url: 'https://example.com',
    periodicity: '1m',
    regions: ['us-east-1'],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: Array.from({ length: 90 }, (_, i) => ({
      day: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      ok: Math.floor(Math.random() * 50) + 180,
      count: Math.floor(Math.random() * 50) + 200,
    })),
  },
  {
    id: 771,
    name: 'Database',
    description: 'Database connection monitoring',
    url: 'https://db.example.com/health',
    periodicity: '10m',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    method: 'GET',
    body: '',
    headers: [],
    active: true,
    data: Array.from({ length: 90 }, (_, i) => ({
      day: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      ok: Math.floor(Math.random() * 30) + 140,
      count: Math.floor(Math.random() * 30) + 150,
    })),
  },
];

// Sample incident data
export const sampleIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'API Response Time Degradation',
    description: 'Users experiencing slower response times on API endpoints',
    status: 'ongoing',
    severity: 'minor',
    startTime: '2024-01-15T14:30:00Z',
    affectedServices: ['API Endpoint'],
    updates: [
      {
        id: 'update-001',
        timestamp: '2024-01-15T14:30:00Z',
        status: 'investigating',
        message:
          'We are investigating reports of slower API response times. Our team is currently looking into the issue.',
      },
      {
        id: 'update-002',
        timestamp: '2024-01-15T15:15:00Z',
        status: 'identified',
        message:
          'We have identified the cause as increased database load. Implementing scaling solutions.',
      },
      {
        id: 'update-003',
        timestamp: '2024-01-15T16:00:00Z',
        status: 'monitoring',
        message:
          'Database optimizations applied. Monitoring API response times for improvement.',
      },
    ],
  },
  {
    id: 'inc-004',
    title: 'Authentication Service Outage',
    description: 'Complete failure of user authentication system',
    status: 'ongoing',
    severity: 'critical',
    startTime: '2024-01-15T10:15:00Z',
    affectedServices: ['API Endpoint', 'Website'],
    updates: [
      {
        id: 'update-010',
        timestamp: '2024-01-15T10:15:00Z',
        status: 'investigating',
        message:
          'Authentication service is completely down. Users cannot log in. Emergency team assembled.',
      },
      {
        id: 'update-011',
        timestamp: '2024-01-15T10:45:00Z',
        status: 'identified',
        message:
          'Redis cluster failure causing authentication tokens to be lost. Implementing emergency fixes.',
      },
    ],
  },
  {
    id: 'inc-002',
    title: 'Database Connection Issues',
    description:
      'Complete outage of database services affecting multiple applications',
    status: 'resolved',
    severity: 'critical',
    startTime: '2024-01-10T09:00:00Z',
    resolvedTime: '2024-01-10T11:30:00Z',
    affectedServices: ['Database', 'API Endpoint', 'Website'],
    updates: [
      {
        id: 'update-003',
        timestamp: '2024-01-10T09:00:00Z',
        status: 'investigating',
        message:
          'We are experiencing a complete database outage. All services are currently unavailable.',
      },
      {
        id: 'update-004',
        timestamp: '2024-01-10T09:30:00Z',
        status: 'identified',
        message:
          'Database cluster failure identified. Working on failover to backup systems.',
      },
      {
        id: 'update-005',
        timestamp: '2024-01-10T10:45:00Z',
        status: 'monitoring',
        message:
          'Backup systems are online. Monitoring for stability and data consistency.',
      },
      {
        id: 'update-006',
        timestamp: '2024-01-10T11:30:00Z',
        status: 'resolved',
        message:
          'All services have been restored. Database is operating normally with full redundancy.',
      },
    ],
  },
  {
    id: 'inc-003',
    title: 'Website Performance Issues',
    description: 'Intermittent slow loading times on the main website',
    status: 'resolved',
    severity: 'minor',
    startTime: '2024-01-08T16:00:00Z',
    resolvedTime: '2024-01-08T17:45:00Z',
    affectedServices: ['Website'],
    updates: [
      {
        id: 'update-007',
        timestamp: '2024-01-08T16:00:00Z',
        status: 'investigating',
        message:
          'Reports of slow website loading times. Investigating CDN and server performance.',
      },
      {
        id: 'update-008',
        timestamp: '2024-01-08T16:30:00Z',
        status: 'identified',
        message:
          'CDN cache invalidation issue identified. Clearing cache and optimizing delivery.',
      },
      {
        id: 'update-009',
        timestamp: '2024-01-08T17:45:00Z',
        status: 'resolved',
        message:
          'Website performance has been restored to normal levels. CDN optimization complete.',
      },
    ],
  },
  {
    id: 'inc-005',
    title: 'Email Notification Delays',
    description: 'Significant delays in email delivery system',
    status: 'resolved',
    severity: 'major',
    startTime: '2024-01-07T12:20:00Z',
    resolvedTime: '2024-01-07T15:30:00Z',
    affectedServices: ['Email Service'],
    updates: [
      {
        id: 'update-012',
        timestamp: '2024-01-07T12:20:00Z',
        status: 'investigating',
        message:
          'Users reporting delays in receiving email notifications. Investigating email queue status.',
      },
      {
        id: 'update-013',
        timestamp: '2024-01-07T13:00:00Z',
        status: 'identified',
        message:
          'Email provider experiencing capacity issues. Implementing alternative routing.',
      },
      {
        id: 'update-014',
        timestamp: '2024-01-07T14:30:00Z',
        status: 'monitoring',
        message:
          'Alternative email routing activated. Processing backlog of delayed messages.',
      },
      {
        id: 'update-015',
        timestamp: '2024-01-07T15:30:00Z',
        status: 'resolved',
        message:
          'All delayed emails processed. Email delivery restored to normal speed.',
      },
    ],
  },
  {
    id: 'inc-006',
    title: 'CDN Performance Degradation',
    description: 'Global CDN experiencing slow response times',
    status: 'resolved',
    severity: 'minor',
    startTime: '2024-01-05T08:45:00Z',
    resolvedTime: '2024-01-05T10:15:00Z',
    affectedServices: ['Website', 'API Endpoint'],
    updates: [
      {
        id: 'update-016',
        timestamp: '2024-01-05T08:45:00Z',
        status: 'investigating',
        message:
          'Reports of slower loading times globally. Investigating CDN performance metrics.',
      },
      {
        id: 'update-017',
        timestamp: '2024-01-05T09:30:00Z',
        status: 'identified',
        message:
          'CDN provider experiencing network congestion in multiple regions. Working on mitigation.',
      },
      {
        id: 'update-018',
        timestamp: '2024-01-05T10:15:00Z',
        status: 'resolved',
        message:
          'CDN performance restored. Network congestion resolved by provider.',
      },
    ],
  },
  {
    id: 'inc-007',
    title: 'Payment Processing Failures',
    description: 'Intermittent failures in payment transaction processing',
    status: 'resolved',
    severity: 'major',
    startTime: '2024-01-03T14:00:00Z',
    resolvedTime: '2024-01-03T16:45:00Z',
    affectedServices: ['Payment Gateway'],
    updates: [
      {
        id: 'update-019',
        timestamp: '2024-01-03T14:00:00Z',
        status: 'investigating',
        message:
          'Multiple reports of failed payment transactions. Investigating payment gateway connectivity.',
      },
      {
        id: 'update-020',
        timestamp: '2024-01-03T14:30:00Z',
        status: 'identified',
        message:
          'Payment provider API experiencing intermittent timeouts. Implementing retry logic.',
      },
      {
        id: 'update-021',
        timestamp: '2024-01-03T15:30:00Z',
        status: 'monitoring',
        message:
          'Enhanced retry logic deployed. Monitoring payment success rates.',
      },
      {
        id: 'update-022',
        timestamp: '2024-01-03T16:45:00Z',
        status: 'resolved',
        message:
          'Payment processing fully restored. All pending transactions processed successfully.',
      },
    ],
  },
  {
    id: 'inc-008',
    title: 'Search Functionality Outage',
    description: 'Search feature completely unavailable across all platforms',
    status: 'resolved',
    severity: 'major',
    startTime: '2024-01-01T20:30:00Z',
    resolvedTime: '2024-01-01T22:00:00Z',
    affectedServices: ['Website', 'Mobile App'],
    updates: [
      {
        id: 'update-023',
        timestamp: '2024-01-01T20:30:00Z',
        status: 'investigating',
        message:
          'Search functionality is completely down. Users unable to search content.',
      },
      {
        id: 'update-024',
        timestamp: '2024-01-01T21:00:00Z',
        status: 'identified',
        message:
          'Elasticsearch cluster failure detected. Rebuilding search indices.',
      },
      {
        id: 'update-025',
        timestamp: '2024-01-01T22:00:00Z',
        status: 'resolved',
        message:
          'Search functionality restored. All indices rebuilt and verified.',
      },
    ],
  },
];
