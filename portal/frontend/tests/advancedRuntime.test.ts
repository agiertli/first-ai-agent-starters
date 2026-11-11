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
test('context keeps full history unless compaction is selected', async () => {
  const { events, requests } = await run(5, false, Array.from({ length: 4 }, (_, i) => answer(`Actual reply ${i}`)));
  assert.equal(requests.length, 4); assert.equal(requests[3].messages.length, 8);
  assert.ok(!events.some(e => e.type === 'context_compaction'));
  assert.ok(!events.some(e => e.type === 'context_error' || e.type === 'context_overflow'));
});
test('compaction uses live summary, retains brief, drops older turns and invents no counts', async () => {
  const { events, requests } = await run(5, true, ['First', 'Second', 'Third', 'ACTUAL SUMMARY', 'Recall'].map(s => answer(s)));
  assert.equal(requests.length, 5);
  assert.ok(JSON.stringify(requests[3]).includes('First'));
  assert.ok(JSON.stringify(requests[3]).includes('Third'));
  assert.equal(requests[4].messages.length, 4);
  assert.equal(requests[4].messages[1].content, input.prompt);
  assert.match(requests[4].messages[2].content, /ACTUAL SUMMARY/);
  assert.ok(!JSON.stringify(requests[4]).includes('Sample logistics notes'));
  const compacted = events.find(e => e.type === 'context_compaction');
  assert.equal(compacted?.type === 'context_compaction' && compacted.summary, 'ACTUAL SUMMARY');
  assert.equal(compacted?.type === 'context_compaction' && compacted.before_tokens, undefined);
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
