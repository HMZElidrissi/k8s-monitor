import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { Application } from '@/types';
import {
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconX,
} from '@tabler/icons-react';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export function ApplicationCard({
  application,
  onClick,
}: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-600';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-600';
      case 'unhealthy':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <IconCheck className='h-4 w-4' />;
      case 'degraded':
        return <IconAlertTriangle className='h-4 w-4' />;
      case 'unhealthy':
        return <IconX className='h-4 w-4' />;
      default:
        return <IconClock className='h-4 w-4' />;
    }
  };

  const healthPercentage =
    application.expected_replicas > 0
      ? (application.available_replicas / application.expected_replicas) * 100
      : 0;

  const runningPods = application.pods.filter(
    (p) => p.status === 'Running'
  ).length;
  const readyPods = application.pods.filter((p) => p.ready).length;

  return (
    <Card
      className='hover:shadow-md transition-shadow cursor-pointer'
      onClick={onClick}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex items-center space-x-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className={getStatusColor(application.status)}>
              {getStatusIcon(application.status)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className='text-sm font-medium'>
              {application.name}
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              {application.namespace}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          {application.business_context?.client_facing && (
            <Badge variant='outline' className='text-xs'>
              Public
            </Badge>
          )}
          {application.business_context?.is_demo && (
            <Badge variant='outline' className='text-xs'>
              Demo
            </Badge>
          )}
          <Badge className={getStatusColor(application.status)}>
            {application.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4'>
          {/* Replica Status */}
          <div>
            <div className='flex justify-between text-sm mb-1'>
              <span>Replicas</span>
              <span>
                {application.available_replicas}/{application.expected_replicas}
              </span>
            </div>
            <Progress value={healthPercentage} className='h-2' />
          </div>

          {/* Pod Status Grid */}
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Running</p>
              <p className='font-medium'>{runningPods}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Ready</p>
              <p className='font-medium'>{readyPods}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Total</p>
              <p className='font-medium'>{application.pods.length}</p>
            </div>
          </div>

          {/* Business Context */}
          {application.business_context && (
            <div className='grid grid-cols-2 gap-4 text-xs text-muted-foreground'>
              <div>
                <p>Environment</p>
                <p className='font-medium capitalize'>
                  {application.business_context.environment}
                </p>
              </div>
              <div>
                <p>Priority</p>
                <p className='font-medium capitalize'>
                  {application.business_context.priority}
                </p>
              </div>
            </div>
          )}

          {/* Recent Issues */}
          {application.status !== 'healthy' && (
            <div className='bg-yellow-50 p-2 rounded-md'>
              <p className='text-xs text-yellow-800'>
                {application.status === 'degraded'
                  ? 'Some pods are not ready'
                  : 'Application is unhealthy'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
