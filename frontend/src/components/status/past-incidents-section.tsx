import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Incident } from '@/types/status';
import { IncidentCard } from '@/components/status/incident-card';

export function PastIncidentsSection({ incidents }: { incidents: Incident[] }) {
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
