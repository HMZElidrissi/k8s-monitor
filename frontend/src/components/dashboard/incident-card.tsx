import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Incident } from '@/types';
import { getIncidentConfig } from '@/lib/status';

export function IncidentCard({ incident }: { incident: Incident }) {
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
