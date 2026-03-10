import { useState, useEffect } from 'react';
import { useIsConnectionRestored, useTonAddress } from '@tonconnect/ui-react';
import { ConnectButton } from './components/ConnectButton';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { DomainList } from './components/DomainList';
import { RecordEditor } from './components/RecordEditor';
import { useDomains, Domain } from './hooks/useDomains';
import { useT } from './lib/i18n';
import { useTheme } from './lib/theme';
import { isTelegram, tgReady, tgExpand, tgRequestFullscreen, tgSetBottomBarColor, tgSetBackgroundColor, BackButton } from './lib/telegram';

export function App() {
  const t = useT();
  const { theme } = useTheme();
  const connectionRestored = useIsConnectionRestored();
  const walletAddress = useTonAddress();
  const { domains, loading, error } = useDomains(walletAddress || null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  useEffect(() => {
    tgReady();
    tgExpand();
    tgRequestFullscreen();
  }, []);

  useEffect(() => {
    if (!isTelegram) return;
    const bg = theme === 'dark' ? '#08101d' : '#f8fafc';
    tgSetBackgroundColor(bg);
    tgSetBottomBarColor(bg);
  }, [theme]);

  useEffect(() => {
    if (!isTelegram) return;
    const handleBack = () => setSelectedDomain(null);
    if (selectedDomain) {
      BackButton.show();
      BackButton.onClick(handleBack);
    } else {
      BackButton.hide();
    }
    return () => {
      BackButton.offClick(handleBack);
    };
  }, [selectedDomain]);

  if (!connectionRestored) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-row-top">
            <ThemeToggle />
          </div>
          <div className="header-row-main">
            <h1>{t('appTitle')}</h1>
          </div>
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
        <div className="header-row-top">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="header-row-main">
          <h1>{t('appTitle')}</h1>
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
