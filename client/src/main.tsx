import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ThemeProvider } from './lib/theme';
import { LangProvider } from './lib/i18n';
import { App } from './App';
import './index.css';

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <App />
        </TonConnectUIProvider>
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
);
