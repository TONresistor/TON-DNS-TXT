import { useState } from 'react';
import { useIsConnectionRestored, useTonAddress } from '@tonconnect/ui-react';
import { ConnectButton } from './components/ConnectButton';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { DomainList } from './components/DomainList';
import { RecordEditor } from './components/RecordEditor';
import { useDomains, Domain } from './hooks/useDomains';
import { useT } from './lib/i18n';

export function App() {
  const t = useT();
  const connectionRestored = useIsConnectionRestored();
  const walletAddress = useTonAddress();
  const { domains, loading, error } = useDomains(walletAddress || null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  if (!connectionRestored) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>{t('appTitle')}</h1>
          <ThemeToggle />
        </header>
        <main className="app-main">
          <p className="status">{t('loading')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
        <div className="header-right">
          <ThemeToggle />
          <LanguageSwitcher />
          <ConnectButton />
        </div>
      </header>

      <main className="app-main">
        {!walletAddress ? (
          <div className="welcome">
            <p>{t('connectPrompt')}</p>
            <p className="muted">{t('connectDesc')}</p>
          </div>
        ) : selectedDomain ? (
          <RecordEditor
            domain={selectedDomain}
            onBack={() => setSelectedDomain(null)}
          />
        ) : (
          <div className="domain-view">
            <h2>{t('yourDomains')}</h2>
            <DomainList
              domains={domains}
              loading={loading}
              error={error}
              onSelect={setSelectedDomain}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}
