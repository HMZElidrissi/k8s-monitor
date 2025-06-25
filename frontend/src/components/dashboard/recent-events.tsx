/*
 * File: components/dashboard/recent-events.tsx
 * Application: K8s Monitor - Kubernetes Application Health Monitoring Tool
 * Author: Hamza El IDRISSI
 * Date: June 24, 2025
 * Version: v1.0.0 - Frontend Recent Events Component
 * Description: Real-time events component with live pod status updates
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePods } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

export function RecentEvents() {
  const { data: podsData, isLoading } = usePods('default');
  const pods = podsData?.pods || [];

  // Sort pods by creation time (most recent first) and take first 5
  const recentPods = pods
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const getStatusColor = (status: string, ready: boolean) => {
    if (!ready) return 'bg-yellow-100 text-yellow-600';

    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getStatusIcon = (status: string, ready: boolean) => {
    if (!ready) return '⚠';

    switch (status.toLowerCase()) {
      case 'running':
        return '✓';
      case 'pending':
        return '🔄';
      case 'failed':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusText = (status: string, ready: boolean) => {
    if (status === 'Running' && ready) return 'Healthy';
    if (status === 'Running' && !ready) return 'Starting';
    return status;
  };

  if (isLoading) {
    return (
      <div className='space-y-8'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex items-center gap-4'>
            <div className='h-9 w-9 bg-gray-200 rounded-full animate-pulse' />
            <div className='flex-1 space-y-1'>
              <div className='h-4 bg-gray-200 rounded animate-pulse' />
              <div className='h-3 bg-gray-200 rounded w-2/3 animate-pulse' />
            </div>
            <div className='h-4 w-16 bg-gray-200 rounded animate-pulse' />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {recentPods.map((pod) => (
        <div
          key={`${pod.namespace}-${pod.name}`}
          className='flex items-center gap-4'
        >
          <Avatar className='h-9 w-9'>
            <AvatarFallback className={getStatusColor(pod.status, pod.ready)}>
              {getStatusIcon(pod.status, pod.ready)}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{pod.name}</p>
              <p className='text-muted-foreground text-sm'>
                {pod.namespace} •{' '}
                {formatDistanceToNow(new Date(pod.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div
              className={`font-medium ${
                pod.status === 'Running' && pod.ready
                  ? 'text-green-600'
                  : pod.status === 'Failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {getStatusText(pod.status, pod.ready)}
            </div>
          </div>
        </div>
      ))}

      {recentPods.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-muted-foreground'>No recent pod activity</p>
        </div>
      )}
    </div>
  );
}
