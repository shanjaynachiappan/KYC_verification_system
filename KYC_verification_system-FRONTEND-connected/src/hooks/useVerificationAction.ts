import { useCallback, useState } from 'react';
import { verificationService } from '../services';

export function useVerificationAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (referenceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await verificationService.approveVerification(referenceId);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approve failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reject = useCallback(async (referenceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await verificationService.rejectVerification(referenceId);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reject failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { approve, reject, loading, error };
}
