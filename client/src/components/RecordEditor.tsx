import { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/ton';
import { useDnsRecords, DnsTextRecord } from '../hooks/useDnsRecords';
import { encodeDnsText, buildChangeDnsRecord, categoryToKey } from '../lib/dnsText';
import { TX_CONTRACT_AMOUNT, TX_FEE_AMOUNT, OWNER_WALLET, FEES_ENABLED } from '../lib/constants';
import { saveKeyName, getKeyName } from '../lib/keyStore';
import { Domain } from '../hooks/useDomains';
import Button from './ui/Button';
import { useT } from '../lib/i18n';

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
  const byteCount = new TextEncoder().encode(valueInput).length;
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    } catch (e) {
      setTxStatus('error');
      setTxError((e as Error).message ?? t('txRejected'));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="record-editor">
      <div className="editor-header">
        <Button variant="ghost" small onClick={onBack}>{t('back')}</Button>
        <h2>{domain.name}</h2>
        <Button variant="ghost" small onClick={refresh} disabled={loading}>
          {loading ? '…' : '↻'}
        </Button>
      </div>

      {error && <p className="status error">{t('failedToLoad')}{error}</p>}

      <section className="records-section">
        <h3>{t('dnsTextRecords')}</h3>
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
                    <Button
                      variant="secondary"
                      small
                      onClick={() => handleEditPrefill(r)}
                    >
                      {t('edit')}
                    </Button>
                    {confirmDelete === r.keyHash ? (
                      <>
                        <Button
                          variant="danger"
                          small
                          onClick={() => handleDelete(r.keyHash)}
                          disabled={txStatus === 'pending'}
                        >
                          {t('confirm')}
                        </Button>
                        <Button
                          variant="ghost"
                          small
                          onClick={() => setConfirmDelete(null)}
                        >
                          {t('cancel')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="danger"
                        small
                        onClick={() => setConfirmDelete(r.keyHash)}
                      >
                        {t('delete')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="add-section">
        <h3>{t('addUpdateRecord')}</h3>
        <p className="hint">
          {t('hint')}
        </p>
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
          <Button
            type="submit"
            fullWidth
            disabled={txStatus === 'pending' || !keyInput.trim() || !valueInput.trim()}
          >
            {txStatus === 'pending' ? t('waitingForWallet') : t('saveRecord')}
          </Button>
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
