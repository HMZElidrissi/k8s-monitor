import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Dashboard Loading State
export const DashboardLoadingState = () => (
  <div className='p-6 space-y-8'>
    {/* Header Skeleton */}
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-9 w-64' />
          <Skeleton className='h-5 w-96' />
        </div>
        <div className='flex flex-col items-end space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-24' />
            <Skeleton className='h-8 w-8 rounded' />
          </div>
          <div className='space-y-1'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
      </div>
      <Separator />
    </div>

    {/* Metrics Grid Skeleton */}
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {[...Array(4)].map((_, i) => (
        <Card key={i} className='animate-pulse'>
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
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Activity Card Skeleton */}
    <Card>
      <CardHeader className='border-b'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-5 w-32' />
          </div>
          <Skeleton className='h-5 w-12' />
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='divide-y'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='p-3 space-y-2'>
              <div className='flex items-start space-x-3'>
                <Skeleton className='h-2 w-2 rounded-full mt-2' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <div className='flex gap-2'>
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Application Detail Loading State
export const ApplicationDetailLoadingState = () => (
  <div className='min-h-screen bg-background'>
    <div className='container mx-auto px-4 py-8'>
      {/* Header Skeleton */}
      <div className='text-center space-y-4 mb-8'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-64 mx-auto' />
          <Skeleton className='h-6 w-96 mx-auto' />
        </div>
        <div className='flex items-center justify-center gap-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-2 w-2 rounded-full' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='h-6 w-16' />
          <Skeleton className='h-6 w-20' />
        </div>
      </div>

      {/* Info Cards Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-4 w-32 mb-1' />
              <Skeleton className='h-3 w-24' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resources Table Skeleton */}
      <div className='mb-8'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {/* Table Header */}
              <div className='flex gap-4 border-b pb-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-16' />
              </div>
              {/* Table Rows */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className='flex gap-4 py-2'>
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-16' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Incidents Skeleton */}
      <StatusAndIncidentsLoadingSkeleton />
    </div>
  </div>
);

// Namespace Detail Loading State
export const NamespaceDetailLoadingState = () => (
  <div className='min-h-screen bg-background'>
    <div className='container mx-auto px-4 py-8'>
      {/* Header Skeleton */}
      <div className='text-center space-y-4 mb-8'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-80 mx-auto' />
          <Skeleton className='h-6 w-64 mx-auto' />
        </div>
        <div className='flex items-center justify-center gap-2'>
          <Skeleton className='h-2 w-2 rounded-full' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>

      {/* Applications & Incidents Grid Skeleton */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-12 mb-8 relative'>
        {/* Applications Status Skeleton */}
        <section className='space-y-6 mr-8'>
          <Skeleton className='h-8 w-48' />
          <div className='space-y-6'>
            {[...Array(3)].map((_, i) => (
              <StatusCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Vertical Separator */}
        <div className='hidden xl:block absolute left-1/2 top-0 h-full -ml-4'>
          <Separator orientation='vertical' />
        </div>

        {/* Incident History Skeleton */}
        <section>
          <Skeleton className='h-8 w-40 mb-6' />
          <div className='space-y-4'>
            {[...Array(4)].map((_, i) => (
              <IncidentCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
);

// Shared Components
const StatusCardSkeleton = () => (
  <Card>
    <CardContent className='p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-56' />
        </div>
        <Skeleton className='h-6 w-20' />
      </div>
      <Skeleton className='h-32 w-full' />
      <div className='flex justify-between text-sm'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-16' />
      </div>
    </CardContent>
  </Card>
);

const IncidentCardSkeleton = () => (
  <Card>
    <CardContent className='p-4 space-y-3'>
      <div className='flex items-start justify-between'>
        <div className='space-y-2 flex-1'>
          <Skeleton className='h-5 w-56' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
        <Skeleton className='h-5 w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-24' />
      </div>
    </CardContent>
  </Card>
);

const StatusAndIncidentsLoadingSkeleton = () => (
  <div className='grid grid-cols-1 xl:grid-cols-2 gap-12 mb-8 relative'>
    {/* Service Status Skeleton */}
    <section className='space-y-6 mr-8'>
      <Skeleton className='h-8 w-40' />
      <StatusCardSkeleton />
    </section>

    {/* Vertical Separator */}
    <div className='hidden xl:block absolute left-1/2 top-0 h-full -ml-4'>
      <Separator orientation='vertical' />
    </div>

    {/* Incidents Skeleton */}
    <section>
      <Skeleton className='h-8 w-36 mb-6' />
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <IncidentCardSkeleton key={i} />
        ))}
      </div>
    </section>
  </div>
);
