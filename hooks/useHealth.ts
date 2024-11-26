import { useMemo } from 'react';
import useSWR from 'swr';

import { Health } from '@/types';

async function fetcher(uri: string) {
  return fetch(uri)
    .then(r => r.ok && r.json())
    .then(healths => healths || []);
}

export default function useHealth(): {
  healths: Health[];
  reload: () => void;
  loading: boolean;
  error: Error | null;
} {
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    '/api/health',
    fetcher,
  );

  const filteredData = useMemo(() => {
    if (!data) return [];

    const seen: Record<string, Health> = {};

    data.forEach((h: Health) => {
      const key = h.wpokt_address.toLowerCase();
      if (!seen[key] || h.updated_at > seen[key].updated_at) {
        seen[key] = h;
      }
    });

    return Object.values(seen);
  }, [data]);

  return {
    healths: filteredData,
    loading: isLoading || isValidating,
    error,
    reload: mutate,
  };
}
