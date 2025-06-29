import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '@/services/podApi';
import type { PodListResponse, PodStatus } from '@/services/podApi';

export function RecentEvents() {
  const { data: podsData, isLoading } = useQuery<PodListResponse>({
    queryKey: ['pods', 'all'],
    queryFn: () => podsApi.getAllPods(),
    // Consider the data fresh for 30s; adjust based on UX needs
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const pods: PodStatus[] = podsData?.pods ?? [];

  // Sort pods by creation time (most recent first) and take first 5
  const recentPods = pods
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
                {formatDistanceToNow(new Date(pod.createdAt), {
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
