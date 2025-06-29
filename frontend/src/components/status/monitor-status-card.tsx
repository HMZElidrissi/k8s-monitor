import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { StatusBar } from '@/components/status/status-bar';
import type { Monitor } from '@/types/status';
import { getStatusConfig } from '@/lib/status';

export function MonitorStatusCard({ monitor }: { monitor: Monitor }) {
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
