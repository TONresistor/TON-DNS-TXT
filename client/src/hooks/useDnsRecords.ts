import { useState, useEffect, useCallback } from 'react';
import { parseDnsTextRecords } from '../lib/dnsText';

export type { DnsTextRecord } from '../lib/dnsText';

interface ApiResponse {
  ok: boolean;
  boc: string | null;
}

export function useDnsRecords(nftItemAddress: string | null) {
  const [records, setRecords] = useState<import('../lib/dnsText').DnsTextRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((address: string) => {
    setLoading(true);
    setError(null);

    fetch(`/api/dns-records?address=${encodeURIComponent(address)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiResponse>;
      })
      .then(data => {
        if (!data.ok || !data.boc) {
          setRecords([]);
          return;
        }

        setRecords(parseDnsTextRecords(data.boc));
      })
      .catch(err => {
        setError((err as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!nftItemAddress) {
      setRecords([]);
      return;
    }
    load(nftItemAddress);
  }, [nftItemAddress, load]);

  const refresh = useCallback(() => {
    if (nftItemAddress) load(nftItemAddress);
  }, [nftItemAddress, load]);

  return { records, loading, error, refresh };
}
