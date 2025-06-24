import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function RecentSales() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarFallback className='bg-green-100 text-green-600'>
            ✓
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              frontend-app-7d4c8f9b8-x2k9m
            </p>
            <p className='text-muted-foreground text-sm'>default namespace</p>
          </div>
          <div className='font-medium text-green-600'>Started</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='flex h-9 w-9 items-center justify-center space-y-0 border'>
          <AvatarFallback className='bg-yellow-100 text-yellow-600'>
            ⚠
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              api-service-6b7d9c4f2-h8k5j
            </p>
            <p className='text-muted-foreground text-sm'>
              production namespace
            </p>
          </div>
          <div className='font-medium text-yellow-600'>Restarted</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarFallback className='bg-blue-100 text-blue-600'>
            🔄
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              database-78f9c2d1b-m3n7p
            </p>
            <p className='text-muted-foreground text-sm'>staging namespace</p>
          </div>
          <div className='font-medium text-blue-600'>Updated</div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarFallback className='bg-green-100 text-green-600'>
            ✓
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              worker-queue-5c8f7a9e2-q1w3r
            </p>
            <p className='text-muted-foreground text-sm'>default namespace</p>
          </div>
          <div className='font-medium text-green-600'>Healthy</div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarFallback className='bg-red-100 text-red-600'>✗</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              cache-redis-9f2e1b8c5-t7y4u
            </p>
            <p className='text-muted-foreground text-sm'>
              production namespace
            </p>
          </div>
          <div className='font-medium text-red-600'>Failed</div>
        </div>
      </div>
    </div>
  );
}
