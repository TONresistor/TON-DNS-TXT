import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'en' | 'ru';

const translations = {
  en: {
    appTitle: 'TON DNS TXT',
    loading: 'Loading…',
    footer: 'TON DNS community',
    connectPrompt: 'Connect your wallet to manage DNS text records for your .ton domains.',
    connectDesc: 'DNS text records (dns_text#1eda) let you attach arbitrary key/value data on-chain to your .ton domain — publicly readable by anyone, writable only by the owner.',
    yourDomains: 'Your .ton Domains',
    loadingDomains: 'Loading domains…',
    errorPrefix: 'Error: ',
    noDomains: 'No .ton domains detected in this wallet.',
    switchToLight: 'Switch to light',
    switchToDark: 'Switch to dark',
    back: '← Back',
    failedToLoad: 'Failed to load records: ',
    dnsTextRecords: 'DNS Text Records',
    loadingRecords: 'Loading records…',
    noRecords: 'No dns_text records found.',
    keyHeader: 'Key',
    valueHeader: 'Value',
    actionsHeader: 'Actions',
    edit: 'Edit',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    addUpdateRecord: 'Add / Update Record',
    hint: 'DNS text records (dns_text#1eda) store arbitrary key/value pairs on-chain on your .ton domain. The key is a free-form name (e.g. avatar, bio, url) hashed with SHA-256. The value is the associated text, publicly readable by anyone.',
    keyLabel: 'Key',
    keyPlaceholder: 'e.g. club',
    valueLabel: 'Value',
    valuePlaceholder: 'e.g. 10Kclub',
    waitingForWallet: 'Waiting for wallet…',
    saveRecord: 'Save Record',
    txSent: 'Transaction sent! Records may take 15–30 seconds to update on-chain.',
    refreshNow: 'Refresh now',
    txFailed: 'Transaction failed: ',
    dismiss: 'Dismiss',
    txRejected: 'Transaction rejected',
    switchToRu: 'Switch to Russian',
    switchToEn: 'Switch to English',
  },
  ru: {
    appTitle: 'TON DNS TXT',
    loading: 'Загрузка…',
    footer: 'TON DNS community',
    connectPrompt: 'Подключите кошелёк для управления DNS text записями ваших .ton доменов.',
    connectDesc: 'DNS text записи (dns_text#1eda) позволяют хранить произвольные пары ключ/значение on-chain на вашем .ton домене — видны всем, изменять может только владелец.',
    yourDomains: 'Ваши .ton домены',
    loadingDomains: 'Загрузка доменов…',
    errorPrefix: 'Ошибка: ',
    noDomains: 'В этом кошельке не найдено .ton доменов.',
    switchToLight: 'Светлая тема',
    switchToDark: 'Тёмная тема',
    back: '← Назад',
    failedToLoad: 'Ошибка загрузки записей: ',
    dnsTextRecords: 'DNS Text записи',
    loadingRecords: 'Загрузка записей…',
    noRecords: 'Записи dns_text не найдены.',
    keyHeader: 'Ключ',
    valueHeader: 'Значение',
    actionsHeader: 'Действия',
    edit: 'Изменить',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    delete: 'Удалить',
    addUpdateRecord: 'Добавить / Обновить запись',
    hint: 'DNS text записи (dns_text#1eda) хранят произвольные пары ключ/значение on-chain на вашем .ton домене. Ключ — произвольное имя (напр. avatar, bio, url), хэшируемое через SHA-256. Значение — связанный текст, видный всем.',
    keyLabel: 'Ключ',
    keyPlaceholder: 'напр. club',
    valueLabel: 'Значение',
    valuePlaceholder: 'напр. 10Kclub',
    waitingForWallet: 'Ожидание кошелька…',
    saveRecord: 'Сохранить запись',
    txSent: 'Транзакция отправлена! Записи обновятся on-chain через 15–30 секунд.',
    refreshNow: 'Обновить',
    txFailed: 'Ошибка транзакции: ',
    dismiss: 'Закрыть',
    txRejected: 'Транзакция отклонена',
    switchToRu: 'Переключить на русский',
    switchToEn: 'Переключить на английский',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

const LangContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('dns-text-lang') as Lang | null;
    return saved === 'ru' ? 'ru' : 'en';
  });

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem('dns-text-lang', next);
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return (key: TranslationKey): string => translations[lang][key];
}
