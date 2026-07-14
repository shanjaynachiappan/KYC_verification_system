import { useCallback, useEffect, useState } from 'react';
import type { VerificationStatusData } from '../types';
import { verificationService } from '../services';

interface UseStatusState {
  data: VerificationStatusData | null;
  loading: boolean;
  error: string | null;
}

export function useVerificationStatus(referenceId: string): UseStatusState {
  const [data, setData] = useState<VerificationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationService.getVerificationStatus(referenceId);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    if (referenceId) fetchData();
  }, [referenceId, fetchData]);

  return { data, loading, error };
}
