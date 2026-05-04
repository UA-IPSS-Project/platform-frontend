import { useState, useEffect, useCallback } from 'react';
import { utilizadoresApi } from '../services/api/utilizadores/utilizadoresApi';

interface TermsState {
  needsAcceptance: boolean;
  currentVersion: number;
  loading: boolean;
}

export function useTermsCheck(isAuthenticated: boolean) {
  const [state, setState] = useState<TermsState>({
    needsAcceptance: false,
    currentVersion: 1,
    loading: false,
  });

  const check = useCallback(async () => {
    if (!isAuthenticated) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const status = await utilizadoresApi.checkTermsStatus();
      setState({ needsAcceptance: status.needsAcceptance, currentVersion: status.currentVersion, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [isAuthenticated]);

  useEffect(() => { check(); }, [check]);

  const accept = useCallback(async (version: number) => {
    await utilizadoresApi.acceptTerms(version);
    setState(s => ({ ...s, needsAcceptance: false }));
  }, []);

  return { ...state, accept };
}
