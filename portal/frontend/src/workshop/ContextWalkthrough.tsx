import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { LessonDiagram } from '../components/diagram/LessonDiagram';
import { DIAGRAM_SPECS } from '../lessons/diagrams';
import { ContextStatus } from './ContextStatus';
import { contextSteps, type ContextStepKind } from './contextSteps';
import type { SSEEvent } from '../types/events';
import type { Language } from './content';
const labels: Record<ContextStepKind, [string, string]> = {
  initial: ['První odpověď', 'First reply'], boundary: ['Nad limitem', 'Over the limit'],
  compacting: ['Zásah aplikace', 'Application intervenes'], summary: ['Živé shrnutí', 'Live summary'],
  compacted: ['Menší kontext', 'Smaller context'], answer: ['Pokračování', 'Continue'],
  rejected: ['Chyba API', 'API error'], failure: ['Běh selhal', 'Run failed'],
};
export function ContextWalkthrough({ events, lang, compact, running, elapsed, onConfigure }: {
  events: SSEEvent[]; lang: Language; compact: boolean; running: boolean; elapsed: number; onConfigure: () => void;
}) {
  const t = (a: string, b: string) => lang === 'cs' ? a : b;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const steps = contextSteps(events);
  const selected = Math.max(0, steps.findIndex(s => s.id === selectedId));
  const step = steps[selected];
  const shown = step ? events.slice(0, step.end) : [];
  const event = step?.event;
  const previous = () => setSelectedId(steps[Math.max(0, selected - 1)]?.id ?? null);
  const next = () => setSelectedId(steps[Math.min(steps.length - 1, selected + 1)]?.id ?? null);
  const error = event?.type === 'context_error' ? event.error : event?.type === 'error' ? event.content : '';
  let providerMessage = error;
  if (event?.type === 'context_error') {
    try { const body = JSON.parse(error.slice(error.indexOf('\n') + 1)); providerMessage = body.error?.message || body.detail || error; } catch { /* Plain-text provider response. */ }
  }
  const errorLine = String(providerMessage).split('\n')[0];
  const errorExcerpt = errorLine.match(/This model[^\n]*?tokens\./i)?.[0] || (errorLine.length > 260 ? errorLine.slice(0, 260) + '…' : errorLine);
  const explanation = !step ? t('Spusťte pokus výše. Jakmile dorazí první odpověď, zpřístupní se první krok.', 'Start an attempt above. The first step becomes available when the first reply arrives.')
    : step.kind === 'initial' ? t('Model odpověděl na krátké zadání. Zatím se celý požadavek vejde do kontextu.', 'The model answered the short task. The complete request still fits the context window.')
    : step.kind === 'boundary' ? t('Do historie přibyla velká dávka opakovaných ukázkových poznámek. Server změřil příští vstup: je větší než dostupné okno. V tomto kroku ještě neproběhlo jeho zpracování modelem.', 'A large batch of repeated sample notes was added. The server measured the next input: it exceeds the available window. At this step, the model has not processed it yet.')
    : step.kind === 'compacting' ? t('Aplikace velký požadavek neodešle. Odstraní přesné kopie ukázkové poznámky; zachová původní zadání, skutečnou odpověď a jednu kopii poznámky. Pak požádá model o shrnutí.', 'The application holds back the oversized request. It removes exact sample-note duplicates, keeping the original task, actual reply and one note copy. Then it requests a model summary.')
    : step.kind === 'summary' ? t('Toto shrnutí vytvořil skutečný model z vyčištěné historie. Vynechané kopie poznámek model nečetl.', 'The real model produced this summary from the cleaned history. It did not read the omitted note copies.')
    : step.kind === 'compacted' ? t('Aplikace sestavila další požadavek z původního zadání, shrnutí a kontrolní otázky. Tokenizer jej znovu změřil.', 'The application assembled the next request from the original task, summary and recall question. The tokenizer measured it again.')
    : step.kind === 'answer' ? t('Model pokračoval s kratším kontextem. Porovnejte čísla a omezení s původním zadáním; úspěšné volání samo nezaručuje věrné shrnutí.', 'The model continued with shorter context. Compare numbers and constraints with the original task; request success alone does not prove summary fidelity.')
    : step.kind === 'rejected' ? t('Aplikace požadavek odeslala bez zkrácení. API vrátilo tuto skutečnou chybu. Přesné znění lze rozbalit níže.', 'The application submitted the request without reducing it. The API returned this actual error. Expand the full response below.')
    : t('Běh se nepodařilo dokončit. Tato chyba se nesmí zaměnit za úspěšně předvedené překročení kontextu.', 'The run could not complete. This failure must not be confused with a successfully demonstrated context overflow.');
  return <section id="context-walkthrough" className="context-walkthrough" tabIndex={0} aria-label={t('Kontext krok za krokem', 'Context step by step')}
    onKeyDown={e => { if ((e.target as HTMLElement).closest('input,textarea,select,summary')) return; if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); } }}>
    <div className="context-walkthrough-top"><strong>{t('Kontext krok za krokem', 'Context step by step')}</strong><span role="status">{running ? `${t('API běží na pozadí', 'API running in background')} · ${elapsed} s` : events.length ? t('Běh skončil · procházejte záznam', 'Run ended · explore its trace') : t('Připraveno', 'Ready')}</span><button onClick={onConfigure}>{t('Nastavení pokusu', 'Attempt settings')}</button></div>
    <nav className="context-step-list" aria-label={t('Kroky skutečného běhu', 'Actual run steps')}>{steps.map((s, i) => <button key={s.id} aria-current={i === selected ? 'step' : undefined} className={s.kind === 'rejected' || s.kind === 'failure' ? 'context-step-error' : ''} onClick={() => setSelectedId(s.id)}><span>{i + 1}</span>{labels[s.kind][lang === 'cs' ? 0 : 1]}</button>)}{!steps.length && <p>{running ? t('Čekáme na první výsledek. Kroky se nebudou posouvat samy.', 'Waiting for the first result. Steps will not advance automatically.') : t('Po spuštění se zde objeví klikatelné kroky.', 'Clickable steps will appear here after starting.')}</p>}</nav>
    <div className="context-step-stage"><div className="context-step-visual"><div className="context-step-diagram"><LessonDiagram spec={DIAGRAM_SPECS[5]} events={shown} currentEventIndex={shown.length}/></div><ContextStatus events={shown} lang={lang} compact={compact}/></div>
      <article key={step?.id || 'waiting'} className="context-step-evidence">
        <h2>{step ? labels[step.kind][lang === 'cs' ? 0 : 1] : t('Vy rozhodujete o tempu', 'You control the pace')}</h2><p>{explanation}</p>
        {event?.type === 'context_measurement' && <div className="context-step-fact"><b>{event.input_tokens.toLocaleString(lang)}</b><span>{t('tokenů v příštím vstupu', 'tokens in the next input')}</span><strong>{t('Limit serveru', 'Server limit')}: {event.limit.toLocaleString(lang)}</strong></div>}
        {event?.type === 'context_compacting' && <div className="context-step-fact"><b>{t('Zásah před odesláním', 'Intervene before sending')}</b><span>{event.input_tokens.toLocaleString(lang)} &gt; {event.limit.toLocaleString(lang)} {t('tokenů', 'tokens')}</span></div>}
        {event?.type === 'context_compaction' && <div className="context-step-fact"><b>{event.before_tokens?.toLocaleString(lang)} → {event.after_tokens?.toLocaleString(lang)}</b><span>{t('tokenů podle serverového tokenizeru', 'tokens measured by the server tokenizer')}</span></div>}
        {event?.type === 'llm_response' && <div className="context-step-answer"><small>{t('Skutečná odpověď modelu', 'Actual model response')}</small><ReactMarkdown>{event.content}</ReactMarkdown></div>}
        {error && <div className="context-step-provider"><strong>{error.split('\n')[0]}</strong><p>{errorExcerpt}</p><details><summary>{t('Celá odpověď API', 'Full API response')}</summary><pre>{error}</pre></details></div>}
      </article></div>
    <div className="context-step-controls"><button disabled={!step || selected === 0} onClick={previous}>← {t('Předchozí', 'Previous')}</button><strong>{step ? `${selected + 1} / ${steps.length}` : '0 / 0'}</strong><button disabled={!step || selected >= steps.length - 1} onClick={next}>{t('Další krok', 'Next step')} →</button><small>{t('Klikejte na kroky nebo použijte ← →. Ovládáte zobrazení; API se znovu nevolá.', 'Click a step or use ← →. You control the display; no API calls are repeated.')}</small></div>
  </section>;
}
