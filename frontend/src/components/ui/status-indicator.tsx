import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-600 dark:bg-green-400',
    label: 'Healthy',
  },
  degraded: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-600 dark:bg-yellow-400',
    label: 'Degraded',
  },
  unhealthy: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-600 dark:bg-red-400',
    label: 'Unhealthy',
  },
  unknown: {
    icon: AlertTriangle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-500 dark:bg-gray-400',
    label: 'Unknown',
  },
};

const sizeConfig = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StatusIndicator({
  status,
  size = 'sm',
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon className={cn(sizeConfig[size], config.color)} />
      {showLabel && (
        <span className={cn('text-xs', config.color)}>{config.label}</span>
      )}
    </div>
  );
}

export function StatusDot({
  status,
  size = 'sm',
  className,
}: Omit<StatusIndicatorProps, 'showLabel'>) {
  const config = statusConfig[status];

  const dotSizeConfig = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div
      className={cn(
        'rounded-full',
        dotSizeConfig[size],
        config.bgColor,
        className
      )}
    />
  );
}
