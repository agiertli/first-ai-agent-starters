import { useEffect, useRef, useState } from 'react';
import type { Language, Brief } from './content';
import { browserRuntime } from './runtime';
import { getBrowserConnection, subscribeConnection } from './browserConnection';
import { runBrowserAgent } from './browserAgent';
import { safeException, type RequestDiagnostic } from './browserModel';
export interface TraceEvent { diagnostic?: RequestDiagnostic; type: string; content?: string; name?: string; iteration?: number; arguments?: unknown; result?: unknown; available_tools?: string[] }
export interface RunInput { instructions: string; task: string; materials: string; mode: 'chat' | 'agent'; weather: boolean; language: Language }
export interface RunRecord { at: string; input: RunInput; events: TraceEvent[]; status: 'done' | 'error' | 'stopped' }
export interface Workbook { brief: Brief; materials: string; task: string; customInstructions: string; weather: boolean; tests: string[]; next: string; records: RunRecord[] }
export const STORAGE_KEY = 'first-agent-workshop-v1';
export function validWorkbook(value: unknown): value is Workbook {
  if (!value || typeof value !== 'object') return false;
  const v = value as Workbook;
  return !!v.brief && ['name', 'goal', 'inputs', 'output', 'limits', 'success'].every(k => typeof v.brief[k as keyof Brief] === 'string')
    && ['materials', 'task', 'customInstructions', 'next'].every(k => typeof v[k as keyof Workbook] === 'string')
    && typeof v.weather === 'boolean' && Array.isArray(v.tests) && v.tests.length === 3 && v.tests.every(x => typeof x === 'string')
    && Array.isArray(v.records) && v.records.length <= 10 && v.records.every(r => r && typeof r.at === 'string' && ['done', 'error', 'stopped'].includes(r.status) && r.input && typeof r.input.task === 'string' && Array.isArray(r.events) && r.events.every(e => e && typeof e.type === 'string' && (e.content === undefined || typeof e.content === 'string')));
}
export function download(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function usePrototype(onRecord: (record: RunRecord) => void) {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const callback = useRef(onRecord);
  useEffect(() => { callback.current = onRecord; }, [onRecord]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => browserRuntime ? subscribeConnection(() => { if (!getBrowserConnection()) controller.current?.abort(); }) : undefined, []);
  async function start(input: RunInput) {
    if (controller.current) return;
    const abort = new AbortController(); controller.current = abort;
    setEvents([]); setRunning(true);
    const trace: TraceEvent[] = [];
    let status: RunRecord['status'] = 'error';
    const push = (e: TraceEvent) => { trace.push(e); setEvents([...trace]); };
    try {
      if (browserRuntime) {
        const connection = getBrowserConnection();
        if (!connection) throw new Error('No browser connection');
        await runBrowserAgent(input, { ...connection }, push, abort.signal);
        status = trace.some(e => e.type === 'done') ? 'done' : 'error';
      } else {
        const response = await fetch('/api/workshop/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: abort.signal });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, '');
          let split: number;
          while ((split = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, split); buffer = buffer.slice(split + 2);
            const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
            if (data) {
              const e = JSON.parse(data) as TraceEvent; push(e);
              if (e.type === 'done') status = 'done';
              if (e.type === 'error') status = 'error';
            }
          }
          if (done) break;
        }
      }
      if (!trace.some(e => e.type === 'done' || e.type === 'error')) throw new Error('Incomplete stream');
    } catch (error) {
      if (!abort.signal.aborted) console.error('[workshop:run] failed', safeException(error, [getBrowserConnection()?.apiKey || '', input.instructions, input.task, input.materials]));
      status = abort.signal.aborted ? 'stopped' : 'error';
      push({ type: status === 'stopped' ? 'stopped' : 'error', content: input.language === 'cs' ? (status === 'stopped' ? 'Příjem byl zastaven. Rozpracovaný požadavek u poskytovatele může ještě doběhnout.' : 'Spojení selhalo. Zkontrolujte připojení modelu. Výsledek nebyl nahrazen simulací.') : (status === 'stopped' ? 'Receiving stopped. An in-flight provider request may still finish.' : 'Connection failed. Check the model connection. No simulated result was substituted.') });
    } finally {
      callback.current({ at: new Date().toISOString(), input, events: trace, status });
      controller.current = null; setRunning(false);
    }
  }
  return { events, running, start, stop: () => controller.current?.abort() };
}
