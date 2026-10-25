import { useEffect, useState } from 'react';
import { clearBrowserConnection, getBrowserConnection, saveBrowserConnection, subscribeConnection } from './browserConnection';
import type { Language } from './content';

export function BrowserConnectionPanel({ lang }: { lang: Language }) {
  const [initial] = useState(getBrowserConnection);
  const [apiBase, setApiBase] = useState(initial?.apiBase || '');
  const [model, setModel] = useState(initial?.model || '');
  const [apiKey, setApiKey] = useState(initial?.apiKey || '');
  const [status, setStatus] = useState('');
  useEffect(() => subscribeConnection(() => {
    const connection = getBrowserConnection();
    setApiBase(connection?.apiBase || ''); setModel(connection?.model || ''); setApiKey(connection?.apiKey || '');
  }), []);
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  return <form className="ws-browser-connection" onSubmit={e => {
    e.preventDefault();
    try {
      const stored = saveBrowserConnection({ apiBase, model, apiKey });
      setStatus(stored ? t('Připojení je uloženo v tomto prohlížeči. Zůstane dostupné i po jeho zavření a opětovném otevření.', 'Connection saved in this browser. It remains available after closing and reopening the browser.') : t('Prohlížeč nepovolil trvalé uložení. Připojení funguje jen do obnovení stránky; potom jej zadejte znovu.', 'The browser blocked persistent storage. The connection works until this page reloads; then enter it again.'));
    } catch { setStatus(t('Zkontrolujte HTTPS adresu API (např. končící /v1), název modelu a klíč. Adresa nesmí obsahovat heslo ani parametry.', 'Check the HTTPS API base (e.g. ending in /v1), model name and key. The URL must not contain credentials or query parameters.')); }
  }}>
    <h3>{t('Přímé připojení modelu', 'Direct model connection')}</h3>
    <p>{t('Adresu API, model a klíč si tento prohlížeč zapamatuje automaticky po uložení. Při spuštění se klíč odešle pouze zadanému API modelu, nikoli GitHubu ani serveru portálu. Materiály a šablony fungují i bez něj.', 'This browser remembers the API URL, model and key automatically when you save. When running, the key is sent only to the model API you specify, not to GitHub or a portal server. Materials and templates work without it.')}</p>
    <label className="ws-field">{t('Základní adresa API', 'API base URL')}<input type="url" required value={apiBase} placeholder="https://your-model.example/v1" autoComplete="off" onChange={e => { setApiBase(e.target.value); setApiKey(''); setStatus(''); }} /></label>
    <label className="ws-field">{t('Název modelu', 'Model name')}<input required value={model} autoComplete="off" onChange={e => setModel(e.target.value)} /></label>
    <label className="ws-field">{t('API klíč', 'API key')}<input type="password" required value={apiKey} autoComplete="off" spellCheck={false} onChange={e => setApiKey(e.target.value)} /></label>
    <div className="ws-actions"><button className="ws-primary" type="submit">{t('Uložit připojení', 'Save connection')}</button><button type="button" onClick={() => { const cleared = clearBrowserConnection(); setApiBase(''); setModel(''); setApiKey(''); setStatus(cleared ? t('Uložené připojení a klíč byly odstraněny z tohoto prohlížeče.', 'The saved connection and key have been removed from this browser.') : t('Připojení je odpojeno, ale prohlížeč nepovolil vymazat úložiště. Odstraňte data této stránky v nastavení prohlížeče.', 'Disconnected, but the browser blocked clearing storage. Remove this site’s data in browser settings.')); }}>{t('Zapomenout připojení', 'Forget connection')}</button></div>
    {status && <p role="status">{status}</p>}
    <p className="ws-muted">{t('Údaje jsou v localStorage tohoto profilu prohlížeče, včetně klíče v čitelné podobě pro skripty stejného webu. Nesynchronizují se do jiného prohlížeče ani zařízení. Zůstanou tu do použití „Zapomenout připojení“ nebo vymazání dat stránky; anonymní režim je může odstranit při zavření. Použijte vlastní prohlížeč a samostatný klíč pro ukázku. API musí povolit CORS pro tuto stránku.', 'The details are in this browser profile’s localStorage, including the key readable by scripts on the same origin. They do not sync to another browser or device. They remain until you use “Forget connection” or clear site data; private browsing may clear them on exit. Use your own browser and a dedicated demo key. The API must allow CORS for this page.')}</p>
  </form>;
}
