import { useEffect, useId, useReducer, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { captions, type Phase } from './diagramContent';
import { DIAGRAM_EVENT_TYPES, initialPlayback, playbackReducer } from './diagramPlayback';
import { w, type Language } from './content';
import type { TraceEvent } from './model';
import { RequestStatus } from './RequestStatus';
import { AgentStage, type Actor } from './FriendlyDiagrams';

function eventLabel(e: TraceEvent, lang: Language) {
  const name = e.name === 'read_materials' ? w('Přečíst podklady', 'Read materials')[lang] : e.name === 'get_weather' ? w('Zjistit počasí', 'Get weather')[lang] : e.name;
  switch (e.type) {
    case 'thinking': return `${w('Aplikace volá model', 'Application calls the model')[lang]} · ${e.iteration}`;
    case 'tool': return `${w('Model žádá nástroj', 'Model requests a tool')[lang]}: ${name}`;
    case 'tool_executing': return `${w('Aplikace spouští nástroj', 'Application executes the tool')[lang]}: ${name}`;
    case 'result': return `${w('Nástroj vrací výsledek', 'Tool returns a result')[lang]}: ${name}`;
    case 'context_updated': return w('Výsledek doplňuje kontext', 'Result updates the context')[lang];
    case 'tool_denied': return w('Aplikace odmítla požadavek', 'Application denied the request')[lang];
    case 'answer': return w('Model odpovídá člověku', 'Model answers the person')[lang];
    case 'error': return w('Běh skončil chybou', 'Run ended with an error')[lang];
    case 'stopped': return w('Příjem byl zastaven', 'Receiving stopped')[lang];
    default: return e.type;
  }
}

/** A compact live layout; the detailed teaching diagram remains in chapter two. */
export function RunDiagram({ lang, phase, tool, model, chat }: { lang: Language; phase: Phase; tool?: string; model?: string; chat: boolean }) {
  const stage: Record<Phase, { from: Actor | null; to: Actor | null; also?: Actor[]; loopback?: boolean }> = {
    idle: { from: null, to: null }, error: { from: null, to: null }, stopped: { from: null, to: null },
    goal: { from: 'you', to: 'app' }, thinking: { from: 'app', to: 'model' }, tool: { from: 'model', to: 'app' },
    tool_executing: { from: 'app', to: 'tool' }, result: { from: 'tool', to: 'app' },
    context_updated: { from: 'app', to: null, loopback: true }, tool_denied: { from: 'app', to: null },
    answer: { from: 'app', to: 'you', also: ['model'] },
  };
  return <AgentStage lang={lang} noTool={chat} tool={tool} model={model} {...stage[phase]} />;
}

export function LiveRunView({ events, lang, chat, task, runId, running, runControl, stage = false }: {
  events: TraceEvent[]; lang: Language; chat: boolean; task: string; runId: number; running: boolean; runControl: ReactNode; stage?: boolean;
}) {
  const [playback, dispatch] = useReducer(playbackReducer, initialPlayback);
  const [presenting, setPresenting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const presentButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  const trace = events.filter(e => DIAGRAM_EVENT_TYPES.has(e.type));
  const count = trace.length;
  const index = Math.min(playback.index, count - 1);
  const event = trace[index];
  const phase = (event?.type || 'idle') as Phase;
  const tool = trace.slice(0, index + 1).findLast(e => e.type === 'tool')?.name;
  const answer = events.findLast(e => e.type === 'answer');
  const error = events.findLast(e => e.type === 'error' || e.type === 'stopped');
  const diagnostic = events.findLast(e => e.diagnostic)?.diagnostic;
  // Use the recorded request, so changing connection settings cannot relabel an older run.
  const model = events.find(e => e.diagnostic)?.diagnostic?.model;
  const ended = ['answer', 'error', 'stopped'].includes(trace.at(-1)?.type || '');
  const tools = events.find(e => e.type === 'started')?.available_tools;
  useEffect(() => { dispatch({ type: 'replay', count: 0 }); }, [runId]);
  useEffect(() => {
    if (!playback.playing || playback.index >= count - 1) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick', count }), 1800);
    return () => window.clearTimeout(timer);
  }, [playback.playing, playback.index, count]);
  useEffect(() => {
    if (presenting) dialog.current?.showModal();
    else if (dialog.current?.open) { dialog.current.close(); presentButton.current?.focus(); }
  }, [presenting]);

  const board = <div className="ws-run-board">
    <header className="ws-live-top">
      <div><span className={`ws-status-dot ${running ? 'running' : ''}`} /><span id={titleId}>{t('Skutečný model', 'Real model')}</span><small>{t('žádné předpřipravené odpovědi', 'no scripted answers')}</small></div>
      <div className="ws-run-actions">{runControl}{!stage && <button ref={presenting ? undefined : presentButton} onClick={() => setPresenting(!presenting)}>{presenting ? t('Zpět do lekce', 'Back to lesson') : t('Promítat ukázku', 'Present demo')}</button>}</div>
    </header>
    <p className="ws-run-task" title={task}>{task}</p>
    <div className="ws-run-grid">
      <div className="ws-run-process">
        <section className="ws-run-diagram" aria-label={t('Diagram běhu', 'Execution diagram')}><h3>{t('Průběh práce agenta', 'Agent execution')}</h3><RunDiagram lang={lang} phase={phase} tool={tool} model={model} chat={chat} /></section>
        <section className="ws-run-step" aria-label={t('Co se opravdu děje', 'What actually happens')}>
          <div className="ws-run-step-heading"><h3>{t('Co se opravdu děje', 'What actually happens')}</h3><span>{count ? `${index + 1} / ${count}` : t('Před spuštěním', 'Before running')}</span></div>
          <div className="ws-run-step-content" aria-live="polite"><strong className="ws-run-highlight">{event ? eventLabel(event, lang) : chat ? t('Cíl → model → odpověď', 'Goal → model → answer') : t('Cíl → model → nástroj → další rozhodnutí', 'Goal → model → tool → next decision')}</strong><p>{captions[phase][lang].replace(/^\d+ · /, '')}</p>
          {event && (event.arguments !== undefined || event.result !== undefined) && <details key={`${runId}-${index}`}><summary>{t('Skutečná data tohoto kroku', 'Actual data for this step')}</summary><pre>{JSON.stringify(event.result ?? event.arguments, null, 2)}</pre></details>}</div>
        </section>
      </div>
      <section className="ws-run-output" aria-label={t('Skutečná odpověď modelu', 'Actual model answer')}>
        <header><h3>{t('Skutečná odpověď modelu', 'Actual model answer')}</h3><p className="ws-muted">{answer ? index < count - 1 ? t('Odpověď už dorazila. Vlevo sledujete předchozí kroky.', 'The answer has arrived. The left panel shows earlier steps.') : t('Běh dokončen. Správnost posuzujete vy.', 'Run complete. You assess its correctness.') : error ? t('Běh skončil bez úplného výsledku.', 'The run ended without a complete result.') : running ? t('Běh pokračuje. Stav připojení níže je živý i při pozastaveném přehrávání.', 'The run is active. Connection status below stays live even when playback is paused.') : t('Odpověď se zobrazí po živém spuštění.', 'The answer appears after a live run.')}</p></header>
        <div className="ws-run-output-scroll ws-answer" tabIndex={0} aria-label={t('Obsah odpovědi', 'Answer content')}>
          {error && <div role="alert" className="ws-error"><strong>{t('Pokus není dokončen', 'Attempt incomplete')}</strong><p>{error.content}</p>{diagnostic && <button onClick={() => window.dispatchEvent(new Event('first-agent-open-connection'))}>{t('Zkontrolovat připojení', 'Check connection')}</button>}</div>}
          {diagnostic && <RequestStatus key={`${runId}-${diagnostic.id}`} diagnostic={diagnostic} running={running} lang={lang} />}
          {answer ? <ReactMarkdown>{answer.content}</ReactMarkdown> : !diagnostic && !error && <p className="ws-muted">{t('Sledujte, odkud model získá informace a zda mu stačí k odpovědi.', 'Watch where the model gets information and whether it has enough to answer.')}</p>}
        </div>
      </section>
    </div>
    <footer className="ws-run-playback">
      <div className="ws-diagram-controls">
        <button disabled={index <= 0} onClick={() => dispatch({ type: 'previous', count })} aria-label={t('Předchozí událost', 'Previous event')}>←</button>
        <select aria-label={t('Zobrazená událost', 'Displayed event')} value={Math.max(0, index)} disabled={!count} onChange={e => dispatch({ type: 'select', index: Number(e.target.value), count })}>{!count && <option value="0">{t('Čeká na spuštění', 'Waiting to run')}</option>}{trace.map((e, i) => <option key={i} value={i}>{i + 1}. {eventLabel(e, lang)}</option>)}</select>
        <button disabled={!count} onClick={() => dispatch({ type: ended && index === count - 1 ? 'replay' : playback.playing ? 'pause' : 'play', count })}>{ended && index === count - 1 ? t('Přehrát záznam', 'Replay trace') : playback.playing ? t('Pozastavit přehrávání', 'Pause playback') : t('Pokračovat', 'Resume')}</button>
        <button disabled={index >= count - 1} onClick={() => dispatch({ type: 'next', count })} aria-label={t('Další událost', 'Next event')}>→</button>
      </div>
      <p>{t('Krokování řídí zobrazení, ne běh agenta. Přehrání nevolá model ani nástroje znovu.', 'Stepping controls the display, not agent execution. Replay never calls the model or tools again.')}{tools && <span> {t('Dostupné nástroje: ', 'Available tools: ')}{tools.length ? tools.join(', ') : t('žádné', 'none')}.</span>}</p>
    </footer>
  </div>;

  return <>{!presenting && board}<dialog className="ws-run-dialog" ref={dialog} aria-labelledby={titleId} onCancel={() => setPresenting(false)} onClose={() => setPresenting(false)}>{presenting && board}</dialog></>;
}
