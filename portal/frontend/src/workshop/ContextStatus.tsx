import type { SSEEvent } from '../types/events';
import type { Language } from './content';
export function ContextStatus({ events, lang, compact }: { events: SSEEvent[]; lang: Language; compact: boolean }) {
  const t = (a: string, b: string) => lang === 'cs' ? a : b;
  const check = events.findLast(e => e.type === 'context_measurement');
  const boundary = events.find(e => e.type === 'context_measurement' && e.input_tokens > e.limit);
  const started = events.find(e => e.type === 'context_compacting');
  const finished = events.find(e => e.type === 'context_compaction');
  const rejected = events.find(e => e.type === 'context_error');
  const request = events.findLast(e => e.type === 'llm_request');
  const phase = rejected ? 'error' : finished ? 'ready' : started ? 'compacting' : boundary ? 'boundary' : 'checking';
  const title = rejected ? t('API vrátilo chybu — viz skutečné znění vpravo', 'API returned an error — actual response on the right')
    : finished ? t('Kompakce dokončena → pokračujeme', 'Compaction complete → continue')
    : started ? request?.purpose === 'context summary' ? t('Kompakce: model vytváří shrnutí', 'Compaction: model is creating a summary') : t('Nad limitem → aplikace spouští kompakci', 'Over the limit → application starts compaction')
    : boundary ? compact ? t('Další kontext by překročil limit', 'Next context would exceed the limit') : t('Nad limitem → ověříme odmítnutí API', 'Over the limit → test actual API rejection')
    : t('Server měří celý kontext', 'Server measures the entire context');
  const before = boundary?.type === 'context_measurement' ? boundary.input_tokens : undefined;
  const count = finished?.type === 'context_compaction' ? finished.after_tokens : started || boundary ? before : check?.input_tokens;
  const limit = check?.limit;
  return <div className={`advanced-context-status ${phase}`} aria-live="polite">
    <strong>{title}</strong>
    {count !== undefined && limit !== undefined ? <>
      <div className="advanced-context-numbers">{finished && before !== undefined && <span>{before.toLocaleString(lang)} → </span>}<b>{count.toLocaleString(lang)}</b> / {limit.toLocaleString(lang)} {t('tokenů', 'tokens')}</div>
      <div className="advanced-context-meter" aria-label={`${count} / ${limit}`}><span style={{width:`${Math.min(100, count / limit * 100)}%`}}/></div>
      <small>{t('Skutečné měření /tokenize. Navíc rezervujeme 500 tokenů na odpověď.', 'Actual /tokenize measurement. Another 500 tokens are reserved for the reply.')}</small>
    </> : <small>{t('Po spuštění uvidíte limit i skutečný počet tokenů.', 'Run to see the server limit and actual token counts.')}</small>}
  </div>;
}
