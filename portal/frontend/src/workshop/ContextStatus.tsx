import type { SSEEvent } from '../types/events';
import type { Language } from './content';
export function ContextStatus({ events, lang, compact }: { events: SSEEvent[]; lang: Language; compact: boolean }) {
  const t = (a: string, b: string) => lang === 'cs' ? a : b;
  const check = events.findLast(e => e.type === 'context_measurement');
  const trigger = events.find(e => e.type === 'context_threshold');
  const boundary = events.find(e => e.type === 'context_measurement' && e.input_tokens > e.limit);
  const started = events.find(e => e.type === 'context_compacting');
  const finished = events.find(e => e.type === 'context_compaction');
  const rejected = events.find(e => e.type === 'context_error');
  const request = events.findLast(e => e.type === 'llm_request');
  const phase = rejected ? 'error' : finished ? 'ready' : started ? 'compacting' : boundary ? 'boundary' : trigger ? 'threshold' : 'checking';
  const title = rejected ? t('API vrátilo chybu — viz skutečné znění vpravo', 'API returned an error — actual response on the right')
    : finished ? t('Kompakce dokončena → pokračujeme', 'Compaction complete → continue')
    : started ? request?.purpose === 'context summary' && events.at(-1)?.type === 'llm_response' ? t('Model shrnul celou historii', 'Model summarized the full history') : t('Preventivní kompakce · vstup se ještě vejde', 'Proactive compaction · input still fits')
    : boundary ? t('Další kontext už překročil limit serveru', 'Next context exceeds the server limit')
    : trigger ? compact ? t('Práh dosažen → je čas shrnout historii', 'Threshold reached → time to summarize') : t('Práh ignorován → historie roste dál', 'Threshold ignored → history keeps growing')
    : t('Server měří celý kontext', 'Server measures the entire context');
  const before = trigger?.input_tokens;
  const count = finished?.type === 'context_compaction' ? finished.after_tokens : check?.input_tokens;
  const limit = check?.limit;
  return <div className={`advanced-context-status ${phase}`} aria-live="polite">
    <strong>{title}</strong>
    {count !== undefined && limit !== undefined ? <>
      <div className="advanced-context-numbers">{finished && before !== undefined && <span>{before.toLocaleString(lang)} → </span>}<b>{count.toLocaleString(lang)}</b> / {limit.toLocaleString(lang)} {t('tokenů', 'tokens')}</div>
      <div className="advanced-context-meter" aria-label={`${count} / ${limit}`}><span style={{width:`${Math.min(100, count / limit * 100)}%`}}/></div>
      <small>{trigger ? `${t('Práh aplikace', 'Application threshold')}: ${trigger.threshold.toLocaleString(lang)}. ` : ''}{t('Měření /tokenize; navíc 500 tokenů na odpověď.', '/tokenize measurement; another 500 tokens for the reply.')}</small>
    </> : <small>{t('Po spuštění uvidíte limit i skutečný počet tokenů.', 'Run to see the server limit and actual token counts.')}</small>}
  </div>;
}
