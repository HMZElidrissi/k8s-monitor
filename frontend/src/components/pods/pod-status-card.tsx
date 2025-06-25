/*
 * File: components/pods/PodStatusCard.tsx
 * Application: K8s Monitor - Kubernetes Application Health Monitoring Tool
 * Author: Hamza El IDRISSI
 * Date: June 24, 2025
 * Version: v1.0.0 - Frontend Pod Components
 * Description: Pod status card component with real-time updates
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/layout/confirm-dialog';
import { useRestartPod } from '@/services/api';
import type { PodStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';

interface PodStatusCardProps {
  pod: PodStatus;
  showActions?: boolean;
}

export function PodStatusCard({ pod, showActions = true }: PodStatusCardProps) {
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const restartPodMutation = useRestartPod();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-600';
      case 'pending':
      case 'starting':
        return 'bg-yellow-100 text-yellow-600';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'terminating':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <IconCheck className='h-4 w-4' />;
      case 'pending':
      case 'starting':
        return <IconClock className='h-4 w-4' />;
      case 'failed':
      case 'error':
        return <IconAlertTriangle className='h-4 w-4' />;
      default:
        return <IconRefresh className='h-4 w-4' />;
    }
  };

  const handleRestartPod = async () => {
    try {
      await restartPodMutation.mutateAsync({
        namespace: pod.namespace,
        name: pod.name,
      });
      setShowRestartDialog(false);
    } catch (error) {
      console.error('Failed to restart pod:', error);
    }
  };

  const formatAge = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <Card className='hover:shadow-md transition-shadow'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div className='flex items-center space-x-3'>
            <Avatar className='h-10 w-10'>
              <AvatarFallback className={getStatusColor(pod.status)}>
                {getStatusIcon(pod.status)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-sm font-medium'>{pod.name}</CardTitle>
              <p className='text-xs text-muted-foreground'>{pod.namespace}</p>
            </div>
          </div>
          <Badge
            variant={pod.ready ? 'default' : 'secondary'}
            className={pod.ready ? 'bg-green-100 text-green-800' : ''}
          >
            {pod.status}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Ready</p>
              <p className='font-medium'>{pod.ready ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Restarts</p>
              <p className='font-medium'>{pod.restarts}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Age</p>
              <p className='font-medium'>{formatAge(pod.created_at)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Node</p>
              <p className='font-medium text-xs'>{pod.node_name || 'N/A'}</p>
            </div>
          </div>

          {pod.containers.length > 0 && (
            <div className='mt-4'>
              <p className='text-sm font-medium mb-2'>Containers</p>
              <div className='space-y-1'>
                {pod.containers.map((container, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between text-xs'
                  >
                    <span className='truncate'>{container.name}</span>
                    <Badge
                      variant={container.ready ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      {container.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showActions && (
            <div className='mt-4 flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowRestartDialog(true)}
                disabled={restartPodMutation.isPending}
                className='flex-1'
              >
                <IconRefresh className='h-4 w-4 mr-1' />
                {restartPodMutation.isPending ? 'Restarting...' : 'Restart'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showRestartDialog}
        onOpenChange={setShowRestartDialog}
        title='Restart Pod'
        desc={
          <div>
            <p>
              Are you sure you want to restart pod <strong>{pod.name}</strong>?
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              This will delete the current pod and let the deployment create a
              new one.
            </p>
          </div>
        }
        confirmText='Restart Pod'
        destructive
        handleConfirm={handleRestartPod}
        isLoading={restartPodMutation.isPending}
      />
    </>
  );
}
