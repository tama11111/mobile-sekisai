import { useEffect, useCallback } from 'react';
import { useCaseStore } from '@/store/caseStore';
import { fetchCases, supabase } from '@/lib/supabase';

export function useCases() {
  const { cases, loading, error, setCases, setLoading, setError } = useCaseStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '読み込みエラー');
    } finally {
      setLoading(false);
    }
  }, [setCases, setLoading, setError]);

  useEffect(() => {
    load();

    // Realtime subscription
    const channel = supabase
      .channel('insurance_cases_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insurance_cases' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { cases, loading, error, refresh: load };
}
