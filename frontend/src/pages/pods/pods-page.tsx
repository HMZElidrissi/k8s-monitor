import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/dashboard/header';
import { Container } from '@/components/dashboard/container';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  podsApi,
  type PodStatus,
  type WebSocketMessage,
} from '@/services/podApi';
import { createPodsWebSocket } from '@/services/podsWebSocket';

// Status color mapping
const getStatusColor = (
  status: string,
  ready: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'Running' && ready) return 'default';
  if (status === 'Running' && !ready) return 'secondary';
  if (status === 'Pending') return 'secondary';
  if (status === 'Failed' || status === 'CrashLoopBackOff')
    return 'destructive';
  return 'outline';
};

const getStatusIcon = (status: string, ready: boolean) => {
  if (status === 'Running' && ready) return <CheckCircle className='h-4 w-4' />;
  if (status === 'Running' && !ready) return <Clock className='h-4 w-4' />;
  if (status === 'Pending') return <Clock className='h-4 w-4' />;
  if (status === 'Failed' || status === 'CrashLoopBackOff')
    return <XCircle className='h-4 w-4' />;
  return <AlertCircle className='h-4 w-4' />;
};

// Pod card component
interface PodCardProps {
  pod: PodStatus;
}

const PodCard: React.FC<PodCardProps> = ({ pod }) => {
  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-medium'>{pod.name}</CardTitle>
          <Badge
            variant={getStatusColor(pod.status, pod.ready)}
            className='flex items-center gap-1'
          >
            {getStatusIcon(pod.status, pod.ready)}
            {pod.status}
          </Badge>
        </div>
        <CardDescription>
          Namespace: {pod.namespace} • Age: {pod.age}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='font-medium'>Ready:</span>{' '}
            {pod.ready ? 'Yes' : 'No'}
          </div>
          <div>
            <span className='font-medium'>Restarts:</span> {pod.restarts}
          </div>
          <div>
            <span className='font-medium'>Phase:</span> {pod.phase}
          </div>
          <div>
            <span className='font-medium'>Node:</span> {pod.nodeName || 'N/A'}
          </div>
          {pod.application && (
            <div className='col-span-2'>
              <span className='font-medium'>Application:</span>{' '}
              {pod.application}
            </div>
          )}
          {pod.podIP && (
            <div className='col-span-2'>
              <span className='font-medium'>Pod IP:</span> {pod.podIP}
            </div>
          )}
        </div>

        {pod.events && pod.events.length > 0 && (
          <div className='mt-4'>
            <div className='font-medium text-sm mb-2'>Recent Events:</div>
            <div className='space-y-1'>
              {pod.events.slice(0, 3).map((event, index) => (
                <div key={index} className='text-xs p-2 bg-muted rounded'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {event.type}
                    </Badge>
                    <span className='font-medium'>{event.reason}</span>
                  </div>
                  <div className='mt-1 text-muted-foreground'>
                    {event.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Loading skeleton
const PodCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-6 w-20' />
      </div>
      <Skeleton className='h-4 w-64' />
    </CardHeader>
    <CardContent>
      <div className='grid grid-cols-2 gap-4'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
      </div>
    </CardContent>
  </Card>
);

// Main pods page component
export default function PodsPage() {
  // Using "all" as sentinel value to represent all namespaces because Radix `Select.Item` cannot have an empty string value
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch namespaces
  const { data: namespacesData } = useQuery({
    queryKey: ['namespaces'],
    queryFn: podsApi.getNamespaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch pods
  const {
    data: podsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pods', selectedNamespace],
    queryFn: () =>
      podsApi.getAllPods(
        selectedNamespace ? { namespace: selectedNamespace } : undefined
      ),
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log('WebSocket message:', message);

      switch (message.type) {
        case 'pod_update':
        case 'pod_add':
        case 'pod_delete':
          // Invalidate and refetch pods data
          queryClient.invalidateQueries({ queryKey: ['pods'] });
          break;
        case 'connection':
          console.log('WebSocket connection established');
          break;
        case 'subscription':
          console.log('WebSocket subscription confirmed');
          break;
        case 'error':
          console.error('WebSocket error:', message.data);
          setConnectionError(
            message.data?.message || 'WebSocket error occurred'
          );
          break;
      }
    },
    [queryClient]
  );

  // WebSocket connection management
  useEffect(() => {
    const wsConnection = createPodsWebSocket({
      namespace: selectedNamespace,
      onMessage: handleWebSocketMessage,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onError: (error: Event) => {
        setConnectionError('WebSocket connection failed');
        setIsConnected(false);
        console.error('WebSocket connection failed:', error);
      },
    });

    wsConnection.connect();

    return () => {
      wsConnection.disconnect();
    };
  }, [selectedNamespace, handleWebSocketMessage]);

  // Filter pods based on search term
  const filteredPods =
    podsData?.pods.filter(
      (pod) =>
        pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pod.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pod.application &&
          pod.application.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  // Calculate summary stats
  const stats = {
    total: filteredPods.length,
    running: filteredPods.filter((p) => p.status === 'Running' && p.ready)
      .length,
    pending: filteredPods.filter((p) => p.status === 'Pending').length,
    failed: filteredPods.filter(
      (p) => p.status === 'Failed' || p.status === 'CrashLoopBackOff'
    ).length,
    notReady: filteredPods.filter((p) => p.status === 'Running' && !p.ready)
      .length,
  };

  return (
    <div className='space-y-6'>
      <Header
        title='Pod Monitoring'
        description='Real-time monitoring of Kubernetes pods across your cluster'
        actions={
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2'>
              {isConnected ? (
                <Wifi className='h-4 w-4 text-green-500' />
              ) : (
                <WifiOff className='h-4 w-4 text-red-500' />
              )}
              <span className='text-sm text-muted-foreground'>
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {connectionError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Container title='Filters' className='pb-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search pods by name, namespace, or application...'
                className='pl-10'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className='w-full sm:w-48'>
            <Select
              // Map internal empty string (all namespaces) to "all" for the Select component
              value={selectedNamespace === '' ? 'all' : selectedNamespace}
              onValueChange={(value) => {
                setSelectedNamespace(value === 'all' ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='All namespaces' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All namespaces</SelectItem>
                {namespacesData?.namespaces.map((ns) => (
                  <SelectItem key={ns} value={ns}>
                    {ns}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Container>

      {/* Summary Stats */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Pods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {stats.running}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Not Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.notReady}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {stats.failed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pods Grid */}
      {isError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load pods: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <PodCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPods.length === 0 ? (
        <EmptyState
          icon='server'
          title='No pods found'
          description='No pods match your current filters. Try adjusting your search or namespace filter.'
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredPods.map((pod) => (
            <PodCard key={`${pod.namespace}-${pod.name}`} pod={pod} />
          ))}
        </div>
      )}

      {podsData && (
        <div className='text-center text-sm text-muted-foreground'>
          Last updated: {new Date(podsData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
