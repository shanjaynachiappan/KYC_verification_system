import { useCallback, useEffect, useState } from 'react';
import type { FaceVerificationData } from '../types';
import { verificationService } from '../services';

interface UseFaceState {
  data: FaceVerificationData | null;
  loading: boolean;
  error: string | null;
}

export function useFaceVerification(referenceId: string): UseFaceState {
  const [data, setData] = useState<FaceVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationService.getFaceVerification(referenceId);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load face data');
    } finally {
      setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    if (referenceId) fetchData();
  }, [referenceId, fetchData]);

  return { data, loading, error };
}
