import { useCallback, useEffect, useState } from 'react';
import type { ActivityItem, DashboardStats, TrendDataPoint, StatusDistribution, HourlyDataPoint } from '../types';
import { verificationService } from '../services';

interface UseDashboardState {
  stats: DashboardStats | null;
  activities: ActivityItem[];
  trend: TrendDataPoint[];
  distribution: StatusDistribution[];
  hourly: HourlyDataPoint[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): UseDashboardState {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [distribution, setDistribution] = useState<StatusDistribution[]>([]);
  const [hourly, setHourly] = useState<HourlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, actRes, trendRes, distRes, hourlyRes] = await Promise.all([
        verificationService.getDashboardStats(),
        verificationService.getActivities(),
        verificationService.getTrendData(),
        verificationService.getStatusDistribution(),
        verificationService.getHourlyData(),
      ]);
      setStats(statsRes.data);
      setActivities(actRes.data);
      setTrend(trendRes.data);
      setDistribution(distRes.data);
      setHourly(hourlyRes.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, activities, trend, distribution, hourly, loading, error };
}
