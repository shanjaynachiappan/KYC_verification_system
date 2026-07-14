import { useCallback, useEffect, useState } from 'react';
import type { ApplicantDetails } from '../types';
import { verificationService } from '../services';

interface UseApplicantState {
  data: ApplicantDetails | null;
  loading: boolean;
  error: string | null;
}

export function useApplicantDetails(referenceId: string): UseApplicantState {
  const [data, setData] = useState<ApplicantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationService.getApplicantDetails(referenceId);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applicant');
    } finally {
      setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    if (referenceId) fetchData();
  }, [referenceId, fetchData]);

  return { data, loading, error };
}
