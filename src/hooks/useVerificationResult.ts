import { useCallback, useEffect, useState } from 'react';
import type { VerificationResult } from '../types';
import { verificationService } from '../services';

interface UseResultState {
  data: VerificationResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVerificationResult(referenceId: string): UseResultState {
  const [data, setData] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationService.getVerificationResult(referenceId);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    if (referenceId) fetchData();
  }, [referenceId, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
