import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  isLoading = false,
  children,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  if (isLoading) {
    return (
      <Card className='group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline space-x-2'>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-4 w-12' />
          </div>
          <Skeleton className='h-3 w-32 mt-1' />
          {children && <Skeleton className='h-6 w-full mt-3' />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
      </CardHeader>
      <CardContent>
        <div className='flex items-baseline space-x-2'>
          <div className='text-2xl font-bold'>{value}</div>
          {trend && trendValue && (
            <div
              className={cn('flex items-center text-xs', trendColors[trend])}
            >
              <TrendingUp className='h-3 w-3 mr-1' />
              {trendValue}
            </div>
          )}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
        {children}
      </CardContent>
    </Card>
  );
}
