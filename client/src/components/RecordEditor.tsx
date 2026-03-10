import { useState, useEffect, useRef } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/ton';
import { useDnsRecords, DnsTextRecord } from '../hooks/useDnsRecords';
import { encodeDnsText, buildChangeDnsRecord, categoryToKey } from '../lib/dnsText';
import { TX_CONTRACT_AMOUNT, TX_FEE_AMOUNT, OWNER_WALLET, FEES_ENABLED } from '../lib/constants';
import { saveKeyName, getKeyName } from '../lib/keyStore';
import { Domain } from '../hooks/useDomains';
import Button from './ui/Button';
import { useT } from '../lib/i18n';
import { isTelegram, MainButton, haptic } from '../lib/telegram';

interface Props {
  domain: Domain;
  onBack: () => void;
}

type TxStatus = 'idle' | 'pending' | 'sent' | 'error';

export function RecordEditor({ domain, onBack }: Props) {
  const t = useT();
  const { records, loading, error, refresh } = useDnsRecords(domain.address);
  const [tonConnectUI] = useTonConnectUI();

  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const byteCount = new TextEncoder().encode(valueInput).length;
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Stable ref for the MainButton handler to allow proper offClick cleanup
  const mainBtnHandlerRef = useRef<() => void>(() => {});

  async function sendTx(body: import('@ton/core').Cell) {
    const destAddress = Address.parse(domain.address).toString({ bounceable: true });

    setTxStatus('pending');
    setTxError('');
    try {
      const messages: { address: string; amount: string; payload?: string }[] = [
        {
          address: destAddress,
          amount: TX_CONTRACT_AMOUNT,
          payload: body.toBoc().toString('base64'),
        },
      ];
      if (FEES_ENABLED && OWNER_WALLET) {
        messages.push({ address: OWNER_WALLET, amount: TX_FEE_AMOUNT });
      }
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages,
      });
      setTxStatus('sent');
      haptic.notification('success');
    } catch (e) {
      setTxStatus('error');
      setTxError((e as Error).message ?? t('txRejected'));
      haptic.notification('error');
    }
  }

  async function doAdd() {
    if (!keyInput.trim() || !valueInput.trim()) return;
    try {
      const trimmedKey = keyInput.trim();
      const catKey = await categoryToKey(trimmedKey);
      const keyHash = catKey.toString(16).padStart(64, '0');
      const valueCell = encodeDnsText(valueInput);
      const body = buildChangeDnsRecord(catKey, valueCell);

      await sendTx(body);
      saveKeyName(keyHash, trimmedKey);
      setKeyInput('');
      setValueInput('');
    } catch (e) {
      setTxStatus('error');
      setTxError((e as Error).message);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await doAdd();
  }

  function handleEditPrefill(record: DnsTextRecord) {
    setValueInput(record.value);
    setKeyInput(getKeyName(record.keyHash) ?? '');
    document.getElementById('key-input')?.focus();
  }

  async function handleDelete(keyHash: string) {
    const catKey = BigInt('0x' + keyHash);
    const body = buildChangeDnsRecord(catKey, null);
    await sendTx(body);
    setConfirmDelete(null);
  }

  // Hide MainButton only when component unmounts
  useEffect(() => {
    if (!isTelegram) return;
    return () => { MainButton.hide(); };
  }, []);

  // Sync Telegram MainButton state with form state (no cleanup hide — avoids flicker on each keystroke)
  useEffect(() => {
    if (!isTelegram) return;

    const canSubmit = !!keyInput.trim() && !!valueInput.trim() && txStatus !== 'pending';

    MainButton.setText(txStatus === 'pending' ? t('waitingForWallet') : t('saveRecord'));
    MainButton.show();
    if (canSubmit) {
      MainButton.enable();
    } else {
      MainButton.disable();
    }
    if (txStatus === 'pending') {
      MainButton.showProgress(false);
    } else {
      MainButton.hideProgress();
    }
  }, [keyInput, valueInput, txStatus, t]);

  // Wire MainButton click handler (stable ref pattern to avoid stale closures)
  useEffect(() => {
    if (!isTelegram) return;

    MainButton.offClick(mainBtnHandlerRef.current);
    mainBtnHandlerRef.current = () => {
      if (keyInput.trim() && valueInput.trim() && txStatus !== 'pending') {
        haptic.impact('light');
        doAdd();
      }
    };
    MainButton.onClick(mainBtnHandlerRef.current);
  }, [keyInput, valueInput, txStatus]);

  return (
    <div className="record-editor">
      <div className="editor-header">
        {!isTelegram && (
          <Button variant="ghost" small onClick={onBack}>{t('back')}</Button>
        )}
        <h2>{domain.name}</h2>
      </div>

      {error && <p className="status error">{t('failedToLoad')}{error}</p>}

      <h3 className="section-label">{t('dnsTextRecords')}</h3>

      <section className="records-section">
        {loading && <p className="status">{t('loadingRecords')}</p>}
        {!loading && records.length === 0 && (
          <p className="status muted">{t('noRecords')}</p>
        )}
        {records.length > 0 && (
          <table className="records-table">
            <thead>
              <tr>
                <th>{t('keyHeader')}</th>
                <th>{t('valueHeader')}</th>
                <th>{t('actionsHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.keyHash}>
                  <td>
                    {getKeyName(r.keyHash) ?? (
                      <code title={r.keyHash} className="hash">
                        0x{r.keyHash.slice(0, 8)}…
                      </code>
                    )}
                  </td>
                  <td className="record-value">{r.value}</td>
                  <td className="record-actions">
                    <button
                      className="icon-btn icon-btn--edit"
                      title={t('edit')}
                      onClick={() => { haptic.impact('light'); handleEditPrefill(r); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {confirmDelete === r.keyHash ? (
                      <>
                        <button
                          className="icon-btn icon-btn--confirm"
                          title={t('confirm')}
                          onClick={() => { haptic.impact('medium'); handleDelete(r.keyHash); }}
                          disabled={txStatus === 'pending'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                        <button
                          className="icon-btn icon-btn--cancel"
                          title={t('cancel')}
                          onClick={() => setConfirmDelete(null)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        className="icon-btn icon-btn--delete"
                        title={t('delete')}
                        onClick={() => { haptic.impact('light'); setConfirmDelete(r.keyHash); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="add-section">
        <button className="hint-toggle" onClick={() => setHintOpen(o => !o)}>
          <h3>{t('addUpdateRecord')}</h3>
          <svg
            className={`hint-chevron${hintOpen ? ' hint-chevron--open' : ''}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {hintOpen && (
          <p className="hint">{t('hint')}</p>
        )}
        <form onSubmit={handleAdd} className="add-form">
          <div className="form-row">
            <label htmlFor="key-input">{t('keyLabel')}</label>
            <input
              id="key-input"
              type="text"
              placeholder={t('keyPlaceholder')}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              disabled={txStatus === 'pending'}
            />
          </div>
          <div className="form-row">
            <label htmlFor="value-input">{t('valueLabel')}</label>
            <textarea
              id="value-input"
              placeholder={t('valuePlaceholder')}
              value={valueInput}
              onChange={e => setValueInput(e.target.value)}
              disabled={txStatus === 'pending'}
              rows={3}
            />
            <span className="char-count">{byteCount}/123 bytes</span>
          </div>
          {!isTelegram && (
            <Button
              type="submit"
              fullWidth
              disabled={txStatus === 'pending' || !keyInput.trim() || !valueInput.trim()}
            >
              {txStatus === 'pending' ? t('waitingForWallet') : t('saveRecord')}
            </Button>
          )}
        </form>

        {txStatus === 'sent' && (
          <div className="tx-notice success">
            {t('txSent')}{' '}
            <button className="link-btn" onClick={() => { setTxStatus('idle'); refresh(); }}>
              {t('refreshNow')}
            </button>
          </div>
        )}
        {txStatus === 'error' && (
          <div className="tx-notice error">
            {t('txFailed')}{txError}{' '}
            <button className="link-btn" onClick={() => setTxStatus('idle')}>{t('dismiss')}</button>
          </div>
        )}
      </section>
    </div>
  );
}
