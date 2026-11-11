import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LessonDiagram } from '../components/diagram/LessonDiagram';
import { DualDiagram } from '../components/diagram/DualDiagram';
import { OutputPanel } from '../components/OutputPanel';
import { RequestHistory } from '../components/RequestHistory';
import { DIAGRAM_SPECS } from '../lessons/diagrams';
import type { SSEEvent } from '../types/events';
import { BrowserConnectionPanel } from './BrowserConnectionPanel';
import { getBrowserConnection, subscribeConnection } from './browserConnection';
import type { RequestDiagnostic } from './browserModel';
import { advancedIds, runAdvancedLesson, type AdvancedId } from './advancedRuntime';
import { ContextStatus } from './ContextStatus';
import contextSource from './browserContext.ts?raw';
import runtimeSource from './advancedRuntime.ts?raw';
import modelSource from './browserModel.ts?raw';
import weatherSource from './browserWeather.ts?raw';
import type { Language } from './content';
import './workshop.css';
import './advanced.css';

const titles: Record<AdvancedId, [string, string]> = {
  3: ['Bez paměti', 'No memory'], 4: ['Paměť v aplikaci', 'Application memory'],
  5: ['Správa kontextu', 'Context management'], 8: ['Tool calling', 'Tool calling'],
};
const explanations: Record<AdvancedId, [string, string]> = {
  3: ['Dva skutečné požadavky. Druhý neobsahuje první rozhovor. Správný odhad jména by nebyl důkaz paměti. Otevřete požadavky a porovnejte, co aplikace opravdu odeslala.', 'Two real requests. The second contains none of the first conversation. A correct name guess would not prove memory. Inspect the requests to compare what the application actually sent.'],
  4: ['Aplikace připojí předchozí zprávu i skutečnou odpověď k dalšímu požadavku. Model tak vidí jméno ve vstupu; jeho váhy se tím nemění.', 'The application includes the earlier message and the actual reply in the next request. The model can see the name in its input; its weights have not changed.'],
  5: ['Nejdřív skutečná chyba API: historie překročí limit změřený serverem. Potom stejná dávka se správou kontextu: aplikace před odesláním odstraní přesné duplicity, požádá model o shrnutí a pokračuje. Opakované poznámky jsou syntetická zátěž. Sledujte hranici, okamžik kompakce a zachování faktů.', 'First a real API error: history exceeds the server-measured limit. Then the same batch with context management: before sending, the application removes exact duplicates, asks the model for a summary and continues. Repeated notes are synthetic load. Observe the boundary, compaction and fact retention.'],
  8: ['Model dostane popis nástroje a vybere, zda ho potřebuje. Aplikace ověří název a argumenty, zavolá Open-Meteo a vrátí výsledek modelu. Model nástroj nespouští. Zdrojový kód ukazuje skutečnou implementaci v prohlížeči.', 'The model receives a tool description and decides whether it needs it. The application validates its name and arguments, calls Open-Meteo, then returns the result to the model. The model does not execute the tool. The source view shows the actual browser implementation.'],
};

export default function AdvancedPage() {
  const { id } = useParams();
  const lesson = advancedIds.includes(Number(id) as AdvancedId) ? Number(id) as AdvancedId : 3;
  const [search] = useSearchParams();
  // Only an internal workshop route can be a return target; never credentials or an external URL.
  const requestedReturn = search.get('returnTo') || '';
  const returnTo = /^\/workshop(?:\?|$)/.test(requestedReturn) ? requestedReturn : '/workshop';
  return <AdvancedLesson key={lesson} lesson={lesson} returnTo={returnTo} />;
}

function AdvancedLesson({ lesson, returnTo }: { lesson: AdvancedId; returnTo: string }) {
  const [lang, setLang] = useState<Language>(() => { try { return localStorage.getItem('first-agent-language') === 'en' ? 'en' : 'cs'; } catch { return 'cs'; } });
  const t = (cs: string, en: string) => lang === 'cs' ? cs : en;
  const [connection, setConnection] = useState(getBrowserConnection);
  const [settings, setSettings] = useState(false);
  const [prompt, setPrompt] = useState(lesson === 3 || lesson === 4 ? t('Jmenuji se Anton. Zapamatuj si to prosím.', 'My name is Anton. Remember it please.') : lesson === 8 ? t('Jaké je počasí v Řevnicích právě teď?', 'What is the weather in Řevnice right now?') : t('Plánujeme tříhodinový workshop v Řevnicích pro 30 lidí. Rozpočet je 12 000 Kč, místnost stojí 4 000 Kč. Navrhni stručný program a zapamatuj si fakta.', 'We are planning a three-hour workshop in Řevnice for 30 people. The total budget is CZK 12,000; the room costs CZK 4,000. Suggest a brief programme and remember the facts.'));
  const [compact, setCompact] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [visible, setVisible] = useState(0);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState<RequestDiagnostic | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [source, setSource] = useState('lesson');
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => subscribeConnection(() => setConnection(getBrowserConnection())), []);
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  useEffect(() => { if (settings) dialog.current?.showModal(); else dialog.current?.close(); }, [settings]);
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem('first-agent-language', lang); } catch { /* optional */ } }, [lang]);
  useEffect(() => {
    if (paused || visible >= events.length) return;
    const event = events[visible - 1];
    const milestone = event?.type === 'context_compacting' || event?.type === 'context_compaction' || event?.type === 'context_error' || (event?.type === 'context_measurement' && event.input_tokens > event.limit);
    const timer = window.setTimeout(() => setVisible(n => n + 1), milestone ? 3500 : 500);
    return () => clearTimeout(timer);
  }, [paused, visible, events]);
  useEffect(() => {
    if (!running || !diagnostic) return;
    const tick = () => setElapsed(Math.floor((Date.now() - diagnostic.startedAt) / 1000));
    tick(); const timer = window.setInterval(tick, 1000); return () => clearInterval(timer);
  }, [running, diagnostic]);
  const start = async () => {
    if (!connection) { setSettings(true); return; }
    controller.current?.abort(); const current = ++generation.current;
    const abort = new AbortController(); controller.current = abort;
    setEvents([]); setVisible(0); setPaused(false); setRunning(true); setDiagnostic(null); setElapsed(0);
    try {
      await runAdvancedLesson({ lesson, prompt, compact, language: lang }, connection,
        event => { if (generation.current === current) setEvents(previous => [...previous, event]); },
        status => { if (generation.current === current) setDiagnostic(status); }, abort.signal);
    } finally { if (generation.current === current) setRunning(false); }
  };
  const stop = () => { generation.current++; controller.current?.abort(); setRunning(false); setEvents(previous => [...previous, { type: 'notice', content: t('Příjem zastaven. Již odeslaný požadavek může na serveru ještě běžet.', 'Reception stopped. An already submitted request may still run on the server.') }]); };
  const shown = events.slice(0, visible);
  const current = shown.at(-1);
  const status = current?.type === 'llm_request' ? t('Aplikace odesílá aktuální kontext', 'Application sends current context')
    : current?.type === 'llm_thinking' ? t('Čekáme na model', 'Waiting for the model')
    : current?.type === 'llm_tool_selection' ? t('Model požádal o nástroj', 'Model requested a tool')
    : current?.type === 'tool_executing' ? t('Aplikace spouští nástroj', 'Application executes the tool')
    : current?.type === 'tool_result' ? t('Výsledek nástroje se vrací aplikaci', 'Tool result returns to the application')
    : current?.type === 'context_compaction' ? t('Aplikace nahrazuje starší historii shrnutím', 'Application replaces older history with a summary')
    : current?.type === 'llm_response' ? t('Model vrátil odpověď', 'Model returned an answer')
    : current?.type === 'separator' ? current.label : current?.type === 'error' ? current.content
    : current?.type === 'done' ? t('Pokus dokončen', 'Attempt complete') : t('Sledujte skutečný průběh požadavků', 'Follow the actual request trace');
  const error = events.findLast(e => e.type === 'error');
  return <div className="ws-shell advanced-page">
    <header className="advanced-header"><Link to={returnTo}>← {t('Zpět do workshopu', 'Back to workshop')}</Link><strong>{t('Pokročilé lekce · volitelně', 'Advanced lessons · optional')}</strong><button onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')}>{lang === 'cs' ? 'English' : 'Česky'}</button><button onClick={() => setSettings(true)}>{connection ? connection.model : t('Připojit model', 'Connect model')}</button></header>
    <main className="advanced-main">
      <nav className="advanced-nav" aria-label={t('Pokročilé lekce', 'Advanced lessons')}>{advancedIds.map(n => <Link key={n} aria-current={n === lesson ? 'page' : undefined} to={`/advanced/${n}?returnTo=${encodeURIComponent(returnTo)}`}>{titles[n][lang === 'cs' ? 0 : 1]}</Link>)}</nav>
      <h1>{titles[lesson][lang === 'cs' ? 0 : 1]}</h1><p className="advanced-intro">{explanations[lesson][lang === 'cs' ? 0 : 1]}</p>
      <form className="advanced-input" onSubmit={e => { e.preventDefault(); void start(); }}><label htmlFor="advanced-prompt">{t('Zadání', 'Prompt')}</label><textarea id="advanced-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} disabled={running}/><button type="submit" disabled={running || !prompt.trim()}>{t('Spustit živě', 'Run live')}</button>{running && <button type="button" onClick={stop}>{t('Zastavit', 'Stop')}</button>}</form>
      {lesson === 5 && <div className="advanced-policy" role="group" aria-label={t('Pravidlo práce s historií', 'History policy')}><button disabled={running} aria-pressed={!compact} onClick={() => setCompact(false)}>{t('1. Bez správy → chyba API', '1. Unmanaged → API error')}</button><button disabled={running} aria-pressed={compact} onClick={() => setCompact(true)}>{t('2. Správa před limitem → pokračování', '2. Manage before limit → continue')}</button></div>}
      <p className="advanced-connection">{connection ? t('Stejné uložené připojení jako ve workshopu. Volání jde z prohlížeče přímo do vašeho API.', 'Uses the same saved connection as the workshop. Requests go directly from this browser to your API.') : t('Uložte připojení modelu jednou; workshop a tyto lekce ho sdílejí.', 'Save a model connection once; the workshop and these lessons share it.')} {t('Každý pokus začíná bez historie.', 'Every attempt starts with no history.')}</p>
      <div className="advanced-progress" role="status">{running ? `${t('Živý běh', 'Live run')} · ${diagnostic?.phase === 'headers' ? `HTTP ${diagnostic.httpStatus}` : t('čekání na API', 'waiting for API')} · ${elapsed} s` : error ? t('Pokus selhal — podrobnosti níže a v konzoli', 'Attempt failed — details below and in Console') : events.length ? t('Běh skončil; přehrávání už API nevolá.', 'Run ended; playback makes no API calls.') : t('Připraveno — žádné předpřipravené odpovědi.', 'Ready — no prerecorded answers.')}</div>
      {error?.type === 'error' && <p role="alert" className="advanced-error">{error.content}</p>}
      <section className={`advanced-stage ${lesson === 5 ? 'advanced-context-stage' : ''}`}><div className="advanced-visual"><div className="advanced-diagram">{lesson === 3 ? <DualDiagram events={shown} currentEventIndex={visible}/> : <LessonDiagram spec={DIAGRAM_SPECS[lesson]} events={shown} currentEventIndex={visible}/>}</div>{lesson === 5 ? <ContextStatus events={shown} lang={lang} compact={compact}/> : <p className="advanced-caption">{status}</p>}</div><div className="advanced-output"><h2>{t('Skutečný výstup a události', 'Actual output and events')}</h2><OutputPanel events={shown} isRunning={running} showHeader={false}/></div></section>
      <div className="advanced-playback"><button disabled={visible === 0} onClick={() => { setPaused(true); setVisible(n => Math.max(0, n - 1)); }}>←</button><span>{visible} / {events.length}</span><button disabled={visible >= events.length} onClick={() => { setPaused(true); setVisible(n => Math.min(events.length, n + 1)); }}>→</button><button disabled={!events.length} onClick={() => setPaused(v => !v)}>{paused ? t('Přehrávat', 'Play') : t('Pozastavit přehrávání', 'Pause playback')}</button><button disabled={running || !events.length} onClick={() => { setVisible(0); setPaused(false); }}>{t('Přehrát záznam', 'Replay trace')}</button><small>{t('Krokování řídí zobrazení, nikoli běh modelu.', 'Stepping controls the display, not model execution.')}</small></div>
      <details className="advanced-inspector"><summary>{t('Požadavky, historie a skutečné počty tokenů', 'Requests, history and actual token counts')}</summary><RequestHistory events={events}/></details>
      <details className="advanced-source"><summary>{t('Skutečný zdrojový kód · TypeScript', 'Actual source code · TypeScript')}</summary><label>{t('Zobrazený soubor', 'Source file')} <select value={source} onChange={e => setSource(e.target.value)}><option value="lesson">advancedRuntime.ts</option><option value="context">browserContext.ts</option><option value="model">browserModel.ts</option><option value="weather">browserWeather.ts</option></select></label><pre>{source === 'context' ? contextSource : source === 'model' ? modelSource : source === 'weather' ? weatherSource : runtimeSource}</pre></details>
      {lesson === 8 && <p className="advanced-connection">Open-Meteo · CC BY 4.0 · {t('modelový odhad počasí, mezipaměť nejvýše 5 minut; zdroj a čas ve výsledku nástroje.', 'modelled weather, cached up to 5 minutes; source and timestamps in the tool result.')} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>}
    </main>
    <dialog ref={dialog} className="ws-overlay" onCancel={() => setSettings(false)} onClose={() => setSettings(false)}><div className="advanced-settings"><button onClick={() => setSettings(false)}>{t('Zavřít', 'Close')} ×</button><BrowserConnectionPanel lang={lang}/></div></dialog>
  </div>;
}
