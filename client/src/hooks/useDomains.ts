import { useState, useEffect } from 'react';

export interface Domain {
  name: string;
  address: string;
}

export function useDomains(walletAddress: string | null) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setDomains([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/domains?wallet=${encodeURIComponent(walletAddress)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ domains: Domain[] }>;
      })
      .then(data => {
        if (!cancelled) setDomains(data.domains ?? []);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [walletAddress]);

  return { domains, loading, error };
}
