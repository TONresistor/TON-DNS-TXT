import { useLang, useT } from '../lib/i18n';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
      title={lang === 'en' ? t('switchToRu') : t('switchToEn')}
      style={{
        width: 42,
        height: 42,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-glass)',
        borderRadius: '50%',
        background: 'var(--bg-glass-hover)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.5px',
      }}
    >
      {lang === 'en' ? 'RU' : 'EN'}
    </button>
  );
}
