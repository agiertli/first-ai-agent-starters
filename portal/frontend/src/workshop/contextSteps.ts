import type { SSEEvent } from '../types/events.ts';
export type ContextStepKind = 'initial' | 'threshold' | 'boundary' | 'compacting' | 'summary' | 'compacted' | 'answer' | 'rejected' | 'failure';
export interface ContextStep { id: string; kind: ContextStepKind; end: number; event: SSEEvent }
/** Stable snapshots: later network events never change an already selected step. */
export function contextSteps(events: SSEEvent[]): ContextStep[] {
  let purpose = '';
  const steps: ContextStep[] = [];
  const add = (kind: ContextStepKind, event: SSEEvent, index: number) => {
    if (!steps.some(s => s.kind === kind)) steps.push({ id: kind, kind, event, end: index + 1 });
  };
  events.forEach((event, index) => {
    if (event.type === 'llm_request') purpose = event.purpose || '';
    if (event.type === 'llm_response' && purpose === 'initial facts') add('initial', event, index);
    if (event.type === 'context_measurement' && event.input_tokens > event.limit) add('boundary', event, index);
    if (event.type === 'context_threshold') add('threshold', event, index);
    if (event.type === 'context_compacting') add('compacting', event, index);
    if (event.type === 'llm_response' && purpose === 'context summary') add('summary', event, index);
    if (event.type === 'context_compaction') add('compacted', event, index);
    if (event.type === 'llm_response' && purpose === 'recall after real context management') add('answer', event, index);
    if (event.type === 'context_error') add('rejected', event, index);
    if (event.type === 'error') add('failure', event, index);
  });
  return steps;
}
