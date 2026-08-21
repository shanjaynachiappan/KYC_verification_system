import { useCallback, useEffect, useState } from 'react';
import type { VerificationRequest } from '../types';
import { verificationService } from '../services';

interface UseQueueState {
  data: VerificationRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVerificationQueue(): UseQueueState {
  const [data, setData] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationService.getVerificationQueue();
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
