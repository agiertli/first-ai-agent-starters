import { useState, useSyncExternalStore } from 'react';
import { LiveRunView } from './LiveRunView';
import { browserRuntime } from './runtime';
import { getBrowserConnection, subscribeConnection } from './browserConnection';
import { usePrototype, type RunInput, type RunRecord } from './model';
import { w, type Language } from './content';

export function LiveLab({ lang, input, onRecord }: { lang: Language; input: RunInput; onRecord: (record: RunRecord) => void }) {
  const connection = useSyncExternalStore(subscribeConnection, getBrowserConnection, () => null);
  const needsConnection = browserRuntime && !connection;
  const { events, running, start, stop } = usePrototype(onRecord);
  const [runId, setRunId] = useState(0);
  const [snapshot, setSnapshot] = useState<RunInput | null>(null);
  const runControl = running ? <button onClick={stop}>{w('Zastavit příjem', 'Stop receiving')[lang]}</button> : <button className="ws-primary" disabled={needsConnection || !input.task.trim() || !input.instructions.trim()} onClick={() => { setRunId(id => id + 1); setSnapshot({ ...input }); void start(input); }}>{events.length ? w('Spustit nový pokus', 'Run a new attempt')[lang] : w('Spustit živě', 'Run live')[lang]}</button>;
  return <section className="ws-live" aria-label={w('Živý model', 'Live model')[lang]}>
    {browserRuntime && <div className="ws-connection-strip"><button onClick={() => window.dispatchEvent(new Event('first-agent-open-connection'))}>{needsConnection ? w('Připojit vlastní model pro živou ukázku', 'Connect your own model for a live demo')[lang] : w('Připojení modelu', 'Model connection')[lang]}</button>{connection && <span>{connection.model}</span>}</div>}
    <LiveRunView lang={lang} events={events} runId={runId} running={running} runControl={runControl} chat={(snapshot || input).mode === 'chat'} task={(snapshot || input).task} />
    <details className="ws-snapshot"><summary>{w('Kam se odesílají data a jaké jsou limity', 'Where data goes and the run limits')[lang]}</summary><p className="ws-muted">{(browserRuntime ? w('Prohlížeč odešle instrukce, úkol a podklady přímo nastavenému modelu. Nástroj počasí posílá souřadnice, případně název města, službě Open-Meteo.', 'Your browser sends instructions, task and materials directly to the configured model. The weather tool sends coordinates, or a city name, to Open-Meteo.') : w('Instrukce, úkol a podklady se odešlou na server lektora a nastavený model. Nástroj počasí komunikuje se službou Open-Meteo.', 'Instructions, task and materials are sent to the facilitator’s server and configured model. The weather tool contacts Open-Meteo.'))[lang]} {w('Používejte ukázková data. Každý pokus začíná bez historie. Nejvýše 5 volání modelu, 4 požadavky na nástroje v jednom kroku a 3 minuty na běh.', 'Use sample data. Each attempt starts without history. At most 5 model calls, 4 tool requests per step and 3 minutes per run.')[lang]}</p></details>
    {snapshot && <details className="ws-snapshot"><summary>{w('Zadání použité pro tento pokus', 'Input used for this attempt')[lang]}</summary><pre>{snapshot.task}\n\n{snapshot.instructions}\n\n{snapshot.materials}</pre></details>}
  </section>;
}
export function WeatherLab({ lang, onRecord }: { lang: Language; onRecord: (record: RunRecord) => void }) {
  const [scenario, setScenario] = useState(0);
  const prompts = [w('Jaké je počasí v Řevnicích právě teď?', 'What is the weather in Řevnice right now?'), w('Jaké je počasí v Řevnicích právě teď?', 'What is the weather in Řevnice right now?'), w('Chci se dnes projít venku. Vyber mezi Řevnicemi a Dobřichovicemi vhodnější místo a vysvětli proč.', 'I would like a walk outside today. Choose the better location between Řevnice and Dobřichovice and explain why.')];
  const [edited, setEdited] = useState<string | null>(null);
  return <><div className="ws-scenarios">{[w('1. Model bez nástroje', '1. Model without a tool'), w('2. Stejná otázka + nástroj', '2. Same question + tool'), w('3. Cíl místo otázky', '3. A goal, not just a question')].map((label, i) => <button key={i} aria-pressed={scenario === i} onClick={() => { setScenario(i); setEdited(null); }}>{label[lang]}</button>)}</div>
    <label className="ws-field">{w('Otázka pro živý experiment', 'Question for the live experiment')[lang]}<textarea maxLength={2000} value={edited ?? prompts[scenario][lang]} onChange={e => setEdited(e.target.value)} /></label>
    <LiveLab key={scenario} lang={lang} onRecord={onRecord} input={{ instructions: lang === 'cs' ? 'Odpovídej stručně česky. Rozlišuj ověřené informace od odhadu. Pokud potřebuješ aktuální data a máš nástroj, použij ho. Bez aktuálních dat přiznej, že nevíš. U počasí uveď zdroj, místo a čas.' : 'Answer briefly in English. Distinguish verified information from estimates. If you need current data and have a tool, use it. Without current data, acknowledge you do not know. State the weather source, place, and timestamp.', task: edited ?? prompts[scenario][lang], materials: '', mode: scenario === 0 ? 'chat' : 'agent', weather: scenario !== 0, language: lang }} />
    <p className="ws-source-note">{w('Zdroj: Open-Meteo, CC BY 4.0. Modelový odhad počasí a předpověď, nikoli měření za vaším oknem. Mezipaměť až 5 minut; zkontrolujte fetched_at a as_of ve výsledku nástroje. Při výpadku se data nevymýšlejí.', 'Source: Open-Meteo, CC BY 4.0. Weather-model estimates and forecasts, not a measurement outside your window. Cache up to 5 minutes; check fetched_at and as_of in the tool result. Outages never substitute invented data.')[lang]} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>
  </>;
}
