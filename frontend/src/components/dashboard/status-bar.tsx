import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getStatusConfig } from '@/lib/status';

interface DailyStats {
  ok: number;
  count: number;
  day: string;
}

export function StatusBar({ ok, count, day }: DailyStats) {
  const ratio = ok / count;
  const config = getStatusConfig(ratio);
  const percentage = Math.round(ratio * 100);
  const failed = count - ok;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'h-8 rounded-sm cursor-pointer transition-all duration-200 border border-transparent hover:border-border',
            config.color
          )}
          style={{ flex: 1 }}
        />
      </TooltipTrigger>
      <TooltipContent
        side='bottom'
        className='bg-card text-card-foreground border shadow-lg'
      >
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-4'>
            <span className='font-medium'>{config.label}</span>
            <Badge variant={config.badgeVariant} className='text-xs'>
              {percentage}%
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground'>
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
            }).format(new Date(day))}
          </div>
          <Separator />
          <div className='grid grid-cols-2 gap-4 text-xs'>
            <div>
              <span className='text-green-600 dark:text-green-400 font-mono'>
                {ok}
              </span>
              <span className='text-muted-foreground ml-1'>successful</span>
            </div>
            <div>
              <span className='text-red-600 dark:text-red-400 font-mono'>
                {failed}
              </span>
              <span className='text-muted-foreground ml-1'>failed</span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
