import { Address } from '@ton/ton';
import { Domain } from '../hooks/useDomains';
import { useT } from '../lib/i18n';

function friendlyAddr(raw: string): string {
  try {
    return Address.parse(raw).toString({ bounceable: true });
  } catch {
    return raw;
  }
}

interface Props {
  domains: Domain[];
  loading: boolean;
  error: string | null;
  onSelect: (domain: Domain) => void;
}

export function DomainList({ domains, loading, error, onSelect }: Props) {
  const t = useT();

  if (loading) return <p className="status">{t('loadingDomains')}</p>;
  if (error) return <p className="status error">{t('errorPrefix')}{error}</p>;
  if (domains.length === 0) {
    return <p className="status muted">{t('noDomains')}</p>;
  }

  return (
    <ul className="domain-list">
      {domains.map(d => (
        <li key={d.address}>
          <button className="domain-btn" onClick={() => onSelect(d)}>
            <span className="domain-name">{d.name}</span>
            <span className="domain-addr">{friendlyAddr(d.address).slice(0, 10)}…</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
