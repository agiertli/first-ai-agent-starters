import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBrowserAgent, browserToolAllowed } from '../src/workshop/browserAgent.ts';
import { validateConnection } from '../src/workshop/browserConnection.ts';
import { browserWeather } from '../src/workshop/browserWeather.ts';
import type { RunInput, TraceEvent } from '../src/workshop/model.ts';

const connection = { apiBase: 'https://model.example/v1', apiKey: 'test-secret-never-export', model: 'test-model' };
const input: RunInput = { instructions: 'Use the provided facts.', task: 'Prepare a draft.', materials: 'Tea 55 CZK', mode: 'agent', weather: false, language: 'en' };
const call = (name = 'read_materials', args = '{}', id = 'tool-1') => ({ id, type: 'function', function: { name, arguments: args } });
const reply = (content: string | null, calls: unknown[] = []) => Response.json({ choices: [{ message: { role: 'assistant', content, tool_calls: calls } }] });
function stub(responses: Response[]) {
  const requests: { url: string; options: RequestInit; body: Record<string, any> }[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    requests.push({ url: String(url), options: options!, body: JSON.parse(String(options?.body || '{}')) });
    const response = responses.shift(); assert.ok(response, 'unexpected network request'); return response;
  };
  return { fetcher, requests };
}
async function run(responses: Response[], request = input) {
  const { fetcher, requests } = stub(responses); const events: TraceEvent[] = [];
  await runBrowserAgent(request, connection, e => events.push(e), new AbortController().signal, fetcher);
  return { events, requests };
}

test('browser harness executes the tool, returns its result and emits actual lifecycle events', async () => {
  const { events, requests } = await run([reply(null, [call()]), reply('Draft costs 55 CZK')]);
  assert.deepEqual(events.filter(e => e.type !== 'request_status').map(e => e.type), ['started', 'thinking', 'tool', 'tool_executing', 'result', 'context_updated', 'thinking', 'answer', 'done']);
  assert.ok(requests[1].body.messages.some((m: any) => m.role === 'tool' && m.tool_call_id === 'tool-1' && m.content.includes('Tea 55 CZK')));
  assert.equal(requests[0].body.tool_choice, 'auto');
  assert.ok(!JSON.stringify(events).includes(connection.apiKey));
  for (const r of requests) {
    assert.equal(r.url, 'https://model.example/v1/chat/completions');
    assert.equal(r.options.credentials, 'omit'); assert.equal(r.options.redirect, 'error');
    assert.equal(r.options.referrerPolicy, 'no-referrer');
    assert.equal(new Headers(r.options.headers).get('authorization'), `Bearer ${connection.apiKey}`);
    assert.ok(!JSON.stringify(r.body).includes(connection.apiKey));
  }
});
test('plain chat has no tools; the capability prompt cannot promise a lookup', async () => {
  const { events, requests } = await run([reply('I cannot check live weather.')], { ...input, mode: 'chat', weather: true });
  assert.equal(requests[0].body.tools, undefined); assert.equal(requests[0].body.tool_choice, undefined);
  assert.match(requests[0].body.messages[0].content, /No tools are available/);
  assert.deepEqual(events[0].available_tools, []);
});
test('permission checks reject arbitrary tools, paths, URLs and weather when disabled', async () => {
  for (const [name, args] of [['send_email', {}], ['read_materials', { path: '/etc/passwd' }], ['read_materials', []], ['get_weather', { city: 'Prague' }]]) {
    assert.equal(browserToolAllowed(String(name), args, input), false);
    const { events } = await run([reply(null, [call(String(name), JSON.stringify(args))]), reply('Cannot do that.')]);
    assert.ok(events.some(e => e.type === 'tool_denied'));
    assert.ok(!events.some(e => e.type === 'tool_executing'));
  }
  assert.equal(browserToolAllowed('get_weather', {city: 'Prague', url: 'https://attacker.example'}, {...input, weather: true}), false);
  assert.equal(browserToolAllowed('get_weather', {city: 'Řevnice'}, {...input, weather: true}), true);
});
test('model errors never expose response bodies or become a fake successful answer', async () => {
  const { events } = await run([new Response(connection.apiKey, { status: 401 })]);
  assert.equal(events.at(-1)?.type, 'error');
  assert.match(events.at(-1)?.content || '', /401/);
  assert.ok(!JSON.stringify(events).includes(connection.apiKey));
});
test('bad JSON tool arguments are denied and returned to the model', async () => {
  const { events, requests } = await run([reply(null, [call('read_materials', '{broken')]), reply('Cannot read')]);
  assert.ok(events.some(e => e.type === 'tool_denied'));
  assert.ok(requests[1].body.messages.some((m: any) => m.role === 'tool' && m.content.includes('not allowed')));
});
test('loop is bounded to five model calls and four tools per step', async () => {
  const repeated = await run(Array.from({ length: 5 }, () => reply(null, [call()])));
  assert.equal(repeated.requests.length, 5); assert.equal(repeated.events.at(-1)?.type, 'error');
  const excess = await run([reply(null, Array.from({ length: 5 }, (_, i) => call('read_materials', '{}', String(i))))]);
  assert.equal(excess.events.filter(e => e.type === 'tool_executing').length, 4);
  assert.equal(excess.requests.length, 1); assert.equal(excess.events.at(-1)?.type, 'error');
});
test('cancelled execution cannot proceed to a model or tool request', async () => {
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  await assert.rejects(runBrowserAgent(input, connection, () => {}, controller.signal, async () => { calls++; return reply('Unexpected'); }));
  assert.equal(calls, 0);
});
test('credentials require HTTPS except loopback during HTTP development; no credentials in URLs', () => {
  for (const apiBase of ['http://model.example/v1', 'https://user:password@model.example/v1', 'https://model.example/v1?key=x', 'https://model.example/v1#x', 'javascript:alert(1)', 'http://localhost:8000/v1']) {
    assert.throws(() => validateConnection({...connection, apiBase}));
  }
  assert.equal(validateConnection({...connection, apiBase: 'http://localhost:8000/v1'}, 'http:').apiBase, 'http://localhost:8000/v1');
  assert.equal(validateConnection({...connection, apiBase: 'https://model.example/v1/'}).apiBase, connection.apiBase);
});
test('weather performs geocoding then a GPS forecast without model authentication or cookies', async () => {
  const { fetcher, requests } = stub([
    Response.json({ results: [{ name: 'Testville', latitude: 42, longitude: 16 }] }),
    Response.json({ timezone: 'Europe/Prague', current: {time: '2026-10-25T12:00', temperature_2m: 13, relative_humidity_2m: 60, weather_code: 3, wind_speed_10m: 5, precipitation: 0}, daily: {time: ['2026-10-25'], weather_code: [3], temperature_2m_max: [15], temperature_2m_min: [5], precipitation_probability_max: [20], precipitation_sum: [0], wind_speed_10m_max: [10]} }),
  ]);
  const result = await browserWeather('Testville', new AbortController().signal, fetcher);
  assert.equal(result.temperature, '13°C'); assert.ok(result.fetched_at);
  assert.equal(new URL(requests[0].url).hostname, 'geocoding-api.open-meteo.com');
  assert.equal(new URL(requests[1].url).searchParams.get('latitude'), '42');
  for (const request of requests) { assert.equal(new Headers(request.options.headers).get('authorization'), null); assert.equal(request.options.credentials, 'omit'); }
});
test('weather failures do not fabricate fallback measurements', async () => {
  const result = await browserWeather('Unknown-Test-Town', new AbortController().signal, async () => new Response('', {status: 503}));
  assert.equal(result.fallback, false); assert.ok(result.error); assert.equal(result.temperature, undefined);
});
