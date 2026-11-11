import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAdvancedLesson, type AdvancedInput } from '../src/workshop/advancedRuntime.ts';
import type { SSEEvent } from '../src/types/events.ts';

const connection = { apiBase: 'https://model.example/v1', apiKey: 'private-test-key', model: 'test-model' };
const input: AdvancedInput = { lesson: 3, prompt: 'My name is Eliska. Budget 12000 CZK, 30 people.', compact: false, language: 'en' };
const answer = (content: string | null, tool_calls?: unknown[]) => Response.json({ choices: [{ message: { role: 'assistant', content, ...(tool_calls ? { tool_calls } : {}) } }], usage: { prompt_tokens: 41, completion_tokens: 12, total_tokens: 53 } });
async function run(lesson: AdvancedInput['lesson'], compact = false, responses = [answer('First actual reply'), answer('Second actual reply')]) {
  const events: SSEEvent[] = [];
  const requests: any[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(String(url), connection.apiBase + '/chat/completions');
    assert.equal(new Headers(options?.headers).get('authorization'), `Bearer ${connection.apiKey}`);
    requests.push(JSON.parse(String(options?.body)));
    const response = responses.shift(); assert.ok(response, 'unexpected request'); return response;
  };
  await runAdvancedLesson({ ...input, lesson, compact }, connection, event => events.push(event), () => {}, new AbortController().signal, fetcher);
  assert.ok(!JSON.stringify(events).includes(connection.apiKey));
  return { events, requests };
}
test('no-memory follow-up excludes both prior user message and actual reply', async () => {
  const { events, requests } = await run(3);
  assert.equal(requests.length, 2); assert.equal(requests[1].messages.length, 2);
  assert.ok(!JSON.stringify(requests[1]).includes('Eliska'));
  assert.ok(!JSON.stringify(requests[1]).includes('First actual reply'));
  const response = events.find(e => e.type === 'llm_response');
  assert.equal(response?.type === 'llm_response' && response.usage?.prompt_tokens, 41);
  assert.equal(events.at(-1)?.type, 'done');
});
test('memory resends the actual first reply and input; captured requests are immutable', async () => {
  const { events, requests } = await run(4);
  assert.equal(requests[1].messages.length, 4);
  assert.equal(requests[1].messages[1].content, input.prompt);
  assert.equal(requests[1].messages[2].content, 'First actual reply');
  const captured = events.filter(e => e.type === 'llm_request');
  assert.equal(captured[0].messages.length, 2);
  assert.deepEqual(captured[1].parameters, requests[1]);
});
async function contextRun(compact: boolean, status = 400, message = 'maximum context length exceeded') {
  const events: SSEEvent[] = [], requests: any[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    const body = JSON.parse(String(options?.body));
    if (String(url).endsWith('/tokenize')) return Response.json({ count: JSON.stringify(body.messages).length, max_model_len: 20000 });
    requests.push(body);
    if (requests.length === 1) return answer('Actual initial reply: 30 people.');
    if (!compact && requests.length === 2) return answer('Long notes accepted.');
    if (!compact) return Response.json({ error: { message } }, { status });
    return answer(requests.length === 2 ? 'ACTUAL SUMMARY: budget 12000, 30 people.' : 'Recall: 30 people, budget 12000.');
  };
  await runAdvancedLesson({ ...input, lesson: 5, compact }, connection, e => events.push(e), () => {}, new AbortController().signal, fetcher);
  return { events, requests };
}
test('unmanaged sends the measured oversized request and displays the real provider rejection', async () => {
  const { events, requests } = await contextRun(false);
  assert.equal(requests.length, 3);
  assert.ok(JSON.stringify(requests[1].messages).length + 500 < 20000);
  assert.ok(JSON.stringify(requests[2].messages).length > 20000);
  assert.ok(events.some(e => e.type === 'context_error' && e.error.includes('maximum context length exceeded')));
  assert.ok(!events.some(e => e.type === 'context_compacting' || e.type === 'context_compaction'));
  assert.equal(events.at(-1)?.type, 'done');
});
test('managed starts compaction at proactive threshold, preserves actual reply and continues below it', async () => {
  const { events, requests } = await contextRun(true);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(r => JSON.stringify(r.messages).length + 500 <= 20000));
  assert.ok(JSON.stringify(requests[1]).includes('Actual initial reply'));
  const notes = events.find(e => e.type === 'user_message' && e.content.startsWith('Synthetic notes'));
  assert.ok(notes?.type === 'user_message');
  assert.ok(notes.content.length > 15000);
  assert.ok(requests[1].messages.some((m: any) => m.content === notes.content), 'Summarizer must receive the FULL notes, without deduplication');
  const threshold = events.find(e => e.type === 'context_threshold');
  assert.ok(threshold?.type === 'context_threshold' && threshold.threshold === 18000);
  assert.ok(threshold.input_tokens >= threshold.threshold && threshold.input_tokens < threshold.limit);
  assert.ok(JSON.stringify(requests[2]).includes('ACTUAL SUMMARY'));
  assert.equal(requests[2].messages[1].content, input.prompt);
  const start = events.findIndex(e => e.type === 'context_compacting');
  const summary = events.findIndex(e => e.type === 'llm_request' && e.purpose === 'context summary');
  const finish = events.findIndex(e => e.type === 'context_compaction');
  assert.ok(start > 0 && summary > start && finish > summary);
  const startEvent = events[start];
  assert.ok(startEvent.type === 'context_compacting');
  assert.equal(startEvent.input_tokens, JSON.stringify(requests[1].messages).length, 'Compaction shows the measured full summary request, including summary instructions');
  const compacted = events[finish];
  assert.ok(compacted.type === 'context_compaction' && compacted.before_tokens! >= 18000 && compacted.before_tokens! < 20000 && compacted.after_tokens! < 20000);
  assert.ok(!events.some(e => e.type === 'error' || e.type === 'context_error'));
});
test('rate limit is never presented as proven context overflow', async () => {
  const { events } = await contextRun(false, 429, 'rate limit reached');
  assert.equal(events.at(-1)?.type, 'error');
  assert.ok(!events.some(e => e.type === 'notice' && e.content.includes('Demonstrated:')));
});
test('unavailable tokenizer stops without inventing a limit or invoking the model', async () => {
  const events: SSEEvent[] = [];
  await runAdvancedLesson({ ...input, lesson: 5 }, connection, e => events.push(e), () => {}, new AbortController().signal, async url => {
    assert.ok(String(url).endsWith('/tokenize')); return new Response('', {status:404});
  });
  assert.equal(events.at(-1)?.type, 'error');
  assert.ok(!events.some(e => e.type === 'llm_request' || e.type === 'context_measurement'));
});
test('unknown tool or extra URL argument is rejected without network/tool execution', async () => {
  for (const [name, args] of [['send_email', '{}'], ['get_weather', '{"city":"Prague","url":"https://other.example"}'], ['get_weather', '{broken']]) {
    const { events, requests } = await run(8, false, [answer(null, [{ id: 'call-1', type: 'function', function: { name, arguments: args } }]), answer('Cannot execute')]);
    assert.equal(requests[0].tool_choice, 'auto');
    assert.ok(!events.some(e => e.type === 'tool_executing'));
    assert.ok(requests[1].messages.some((m: any) => m.role === 'tool' && m.tool_call_id === 'call-1' && m.content.includes('not allowed')));
  }
});
test('HTTP failure is visible and never replaced with a successful answer', async () => {
  const { events, requests } = await run(3, false, [new Response(connection.apiKey, { status: 401 })]);
  assert.equal(requests.length, 1); assert.equal(events.at(-1)?.type, 'error');
  assert.ok(!events.some(e => e.type === 'llm_response' || e.type === 'done'));
});
test('cancelled lesson never reaches network', async () => {
  const abort = new AbortController(); abort.abort(); let calls = 0;
  await runAdvancedLesson(input, connection, () => {}, () => {}, abort.signal, async () => { calls++; return answer('Unexpected'); });
  assert.equal(calls, 0);
});
