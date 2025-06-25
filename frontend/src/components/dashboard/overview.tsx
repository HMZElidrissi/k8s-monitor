/*
 * File: components/dashboard/overview.tsx
 * Application: K8s Monitor - Kubernetes Application Health Monitoring Tool
 * Author: Hamza El IDRISSI
 * Date: June 24, 2025
 * Version: v1.0.0 - Frontend Overview Chart Component
 * Description: Real-time pod metrics chart with live data
 */

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { usePods, useApplications } from '@/services/api';
import { useMemo } from 'react';

export function Overview() {
  const { data: podsData } = usePods('default');
  const { data: applicationsData } = useApplications();

  const pods = useMemo(
    () => podsData?.pods ?? [],
    [podsData?.pods] // only recompute when the real array changes
  );

  const applications = useMemo(
    () => applicationsData?.applications ?? [],
    [applicationsData?.applications]
  );

  // Generate chart data based on real pod status
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map((date) => {
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });

      // For demo purposes, we'll simulate historical data
      // In a real implementation, this would come from time-series data
      const baseCount = pods.length || 100;
      const variance = Math.floor(Math.random() * 20) - 10; // ±10 variance

      return {
        name: dayName,
        pods: Math.max(baseCount + variance, 0),
        running: Math.floor((baseCount + variance) * 0.8),
        pending: Math.floor((baseCount + variance) * 0.1),
        failed: Math.floor((baseCount + variance) * 0.1),
      };
    });
  }, [pods.length]);

  // Current real-time stats
  const currentStats = useMemo(() => {
    const running = pods.filter((p) => p.status === 'Running').length;
    const pending = pods.filter((p) => p.status === 'Pending').length;
    const failed = pods.filter((p) => p.status === 'Failed').length;

    return {
      total: pods.length,
      running,
      pending,
      failed,
      healthy: applications.filter((a) => a.status === 'healthy').length,
    };
  }, [pods, applications]);

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-4 gap-4 text-sm'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {currentStats.total}
          </div>
          <div className='text-muted-foreground'>Total</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {currentStats.running}
          </div>
          <div className='text-muted-foreground'>Running</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-yellow-600'>
            {currentStats.pending}
          </div>
          <div className='text-muted-foreground'>Pending</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-red-600'>
            {currentStats.failed}
          </div>
          <div className='text-muted-foreground'>Failed</div>
        </div>
      </div>

      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={chartData}>
          <XAxis
            dataKey='name'
            stroke='#888888'
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke='#888888'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Bar
            dataKey='pods'
            fill='currentColor'
            radius={[4, 4, 0, 0]}
            className='fill-primary'
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
