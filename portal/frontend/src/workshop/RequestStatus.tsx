import { useEffect, useState } from 'react';
import type { Language } from './content';
import type { RequestDiagnostic } from './browserModel';

/** Live transport status is independent of the teaching trace's pause/replay. */
export function RequestStatus({ diagnostic: d, running, lang }: { diagnostic: RequestDiagnostic; running: boolean; lang: Language }) {
  const [now, setNow] = useState(Date.now);
  const [copied, setCopied] = useState('');
  const pending = running && (d.phase === 'request' || d.phase === 'headers');
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending, d.id]);
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  const elapsed = pending ? Math.max(0, now - d.startedAt, d.elapsedMs) : d.elapsedMs;
  const label = d.phase === 'request' ? t('Čekání na odpověď API', 'Waiting for the API')
    : d.phase === 'headers' ? t('Přijímání odpovědi API', 'Receiving the API response')
    : d.phase === 'complete' ? t('Odpověď API dorazila', 'API response received')
    : d.phase === 'cancelled' ? t('Požadavek zastaven', 'Request cancelled') : t('Požadavek selhal', 'Request failed');
  return <section className="ws-request-status" aria-label={t('Stav připojení', 'Connection status')}>
    <div className="ws-request-timing"><strong>{label}{d.httpStatus ? ` · HTTP ${d.httpStatus}` : ''}</strong><span>{pending ? `${Math.floor(elapsed / 1000)} / ${d.timeoutMs / 1000} s` : `${(elapsed / 1000).toFixed(1)} s`}</span></div>
    {pending && <><progress value={Math.min(elapsed, d.timeoutMs)} max={d.timeoutMs} aria-label={t('Čas do limitu požadavku', 'Time used before request timeout')} /><p>{t('Čekáme na celou odpověď; text se v tomto pokusu nepřenáší průběžně. Čas ukazuje délku čekání, ne míru dokončení.', 'Waiting for the complete response; this attempt does not stream text. The timer measures waiting time, not completion progress.')}</p></>}
    <details key={d.id}><summary>{t('Diagnostika připojení', 'Connection diagnostics')}</summary>
      <p>{t('DevTools → Console: filtr [workshop:model]. Síťové podrobnosti jsou v Network → chat/completions. HTTP stav je dostupný jen tehdy, když jej prohlížeč zpřístupní.', 'DevTools → Console: filter [workshop:model]. Network details are under Network → chat/completions. HTTP status is available only when the browser exposes it.')}</p>
      <pre>{JSON.stringify(d, null, 2)}</pre>
      <button onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(d, null, 2)); setCopied(t('Zkopírováno.', 'Copied.')); } catch { setCopied(t('Zkopírujte údaje ručně.', 'Copy the details manually.')); } }}>{t('Kopírovat diagnostiku', 'Copy diagnostics')}</button><span role="status">{copied}</span>
      <p>{t('Neobsahuje API klíč, zadání ani tělo odpovědi. Adresa služby a název modelu jsou součástí diagnostiky.', 'Contains no API key, prompt or response body. The service URL and model name are included.')}</p>
    </details>
  </section>;
}
