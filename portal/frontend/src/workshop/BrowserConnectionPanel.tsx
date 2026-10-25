import { useState } from 'react';
import { clearBrowserConnection, getBrowserConnection, saveBrowserConnection } from './browserConnection';
import type { Language } from './content';

export function BrowserConnectionPanel({ lang }: { lang: Language }) {
  const [initial] = useState(getBrowserConnection);
  const [apiBase, setApiBase] = useState(initial?.apiBase || '');
  const [model, setModel] = useState(initial?.model || '');
  const [apiKey, setApiKey] = useState(initial?.apiKey || '');
  const [status, setStatus] = useState('');
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  return <form className="ws-browser-connection" onSubmit={e => {
    e.preventDefault();
    try {
      const stored = saveBrowserConnection({ apiBase, model, apiKey });
      setStatus(stored ? t('Připojení uloženo pro tuto kartu. Zavřením karty jej běžně odstraníte; tlačítko Zapomenout jej odstraní hned.', 'Connection saved for this tab. Closing the tab normally clears it; Forget removes it now.') : t('Připojení je pouze v paměti. Po obnovení stránky jej zadejte znovu.', 'Connection is in memory only. Enter it again after reloading.'));
    } catch { setStatus(t('Zkontrolujte HTTPS adresu API (např. končící /v1), název modelu a klíč. Adresa nesmí obsahovat heslo ani parametry.', 'Check the HTTPS API base (e.g. ending in /v1), model name and key. The URL must not contain credentials or query parameters.')); }
  }}>
    <h3>{t('Přímé připojení modelu', 'Direct model connection')}</h3>
    <p>{t('Klíč zadáváte do této karty prohlížeče. Při spuštění se odešle pouze zadanému API modelu, nikoli GitHubu ani serveru portálu. Materiály a šablony fungují i bez něj.', 'Enter the key in this browser tab. When running, it is sent only to the model API you specify, not to GitHub or a portal server. Materials and templates work without it.')}</p>
    <label className="ws-field">{t('Základní adresa API', 'API base URL')}<input type="url" required value={apiBase} placeholder="https://your-model.example/v1" autoComplete="off" onChange={e => { setApiBase(e.target.value); setApiKey(''); setStatus(''); }} /></label>
    <label className="ws-field">{t('Název modelu', 'Model name')}<input required value={model} autoComplete="off" onChange={e => setModel(e.target.value)} /></label>
    <label className="ws-field">{t('API klíč', 'API key')}<input type="password" required value={apiKey} autoComplete="off" spellCheck={false} onChange={e => setApiKey(e.target.value)} /></label>
    <div className="ws-actions"><button className="ws-primary" type="submit">{t('Použít v této kartě', 'Use in this tab')}</button><button type="button" onClick={() => { clearBrowserConnection(); setApiBase(''); setModel(''); setApiKey(''); setStatus(t('Připojení a klíč odstraněny z této karty.', 'Connection and key removed from this tab.')); }}>{t('Zapomenout připojení', 'Forget connection')}</button></div>
    {status && <p role="status">{status}</p>}
    <p className="ws-muted">{t('Použijte samostatný klíč pro ukázku. Ukládá se do sessionStorage a je dostupný skriptům této stránky. Obnovení relace prohlížeče ho může zachovat. Po ukázce klikněte na Zapomenout. API musí povolit CORS pro tuto stránku.', 'Use a dedicated demo key. It is stored in sessionStorage and is accessible to this page’s scripts. Browser session restoration may retain it. Click Forget after presenting. The API must allow CORS for this page.')}</p>
  </form>;
}
