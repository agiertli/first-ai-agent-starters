import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestBrowserModel, ModelRequestError, modelFailureMessage, type RequestDiagnostic } from '../src/workshop/browserModel.ts';

const cfg = { apiBase: 'https://model.example/v1', apiKey: 'secret-key-for-test', model: 'test-model' };
const privatePrompt = 'Private prompt for diagnostics test';
const payload = { model: cfg.model, messages: [{ role: 'user', content: privatePrompt }], stream: false };
const answer = () => Response.json({ choices: [{ message: { role: 'assistant', content: 'Actual answer' } }] });
const aborted = (signal: AbortSignal) => new Promise<never>((_, reject) => {
  if (signal.aborted) reject(signal.reason);
  else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});
async function invoke(fetcher: typeof fetch, timeoutMs = 1000, signal = new AbortController().signal) {
  const events: RequestDiagnostic[] = [];
  try {
    const message = await requestBrowserModel(cfg, payload, 1, 'run-test', signal, d => events.push(d), [privatePrompt], fetcher, timeoutMs);
    return { events, message, error: undefined };
  } catch (error) {
    assert.ok(error instanceof ModelRequestError);
    return { events, message: undefined, error };
  }
}

test('successful request reports headers and completion without logging input or output', async t => {
  const info = t.mock.method(console, 'info', () => {});
  const { events, message } = await invoke(async () => answer());
  assert.equal(message?.content, 'Actual answer');
  assert.deepEqual(events.map(d => d.phase), ['request', 'headers', 'complete']);
  assert.equal(events[1].httpStatus, 200);
  assert.ok(events.every(d => d.id === 'run-test/1' && d.timeoutMs === 1000 && d.elapsedMs >= 0));
  const logged = JSON.stringify(info.mock.calls.map(c => c.arguments));
  for (const value of [cfg.apiKey, privatePrompt, 'Actual answer']) assert.ok(!logged.includes(value));
});

test('network failure logs actual exception type, message and stack with secrets removed', async t => {
  t.mock.method(console, 'info', () => {});
  const errors = t.mock.method(console, 'error', () => {});
  const original = new TypeError(`Failed to fetch ${cfg.apiKey} ${privatePrompt}`);
  const { events, error } = await invoke(async () => { throw original; });
  assert.equal(events.at(-1)?.kind, 'network');
  const logged = errors.mock.calls[0].arguments;
  assert.equal(logged[0], '[workshop:model] failed');
  const safe = logged[1] as Error;
  assert.equal(safe.name, 'TypeError');
  assert.match(safe.message, /Failed to fetch/);
  assert.match(safe.stack || '', /browserModel.test.ts/);
  for (const value of [cfg.apiKey, privatePrompt]) {
    assert.ok(!JSON.stringify(events).includes(value));
    assert.ok(!safe.stack?.includes(value));
  }
  assert.match(modelFailureMessage(error!.diagnostic, false), /may not distinguish/);
});

test('HTTP error reports status and provider request ID but never logs its response body', async t => {
  t.mock.method(console, 'info', () => {});
  const errors = t.mock.method(console, 'error', () => {});
  const { events, error } = await invoke(async () => new Response(`private response ${cfg.apiKey}`, { status: 503, headers: { 'x-request-id': 'provider-123' } }));
  assert.equal(events.at(-1)?.kind, 'http');
  assert.equal(events.at(-1)?.providerRequestId, 'provider-123');
  assert.match(modelFailureMessage(error!.diagnostic, true), /HTTP 503/);
  const log = JSON.stringify(errors.mock.calls.map(c => c.arguments));
  assert.ok(!log.includes(cfg.apiKey)); assert.ok(!log.includes('private response'));
});

test('invalid JSON and missing message are response failures, not CORS diagnoses', async t => {
  t.mock.method(console, 'info', () => {});
  const errors = t.mock.method(console, 'error', () => {});
  for (const response of [new Response(`PRIVATE_BODY ${cfg.apiKey}`), Response.json({ something_else: 'PRIVATE_BODY' })]) {
    const { events, error } = await invoke(async () => response);
    assert.equal(events.at(-1)?.kind, 'response');
    assert.equal(events.at(-1)?.httpStatus, 200);
    assert.match(modelFailureMessage(error!.diagnostic, false), /unexpected format/);
  }
  for (const call of errors.mock.calls) {
    const safe = call.arguments[1] as Error;
    assert.ok(!safe.message.includes('PRIVATE_BODY')); assert.ok(!safe.stack?.includes(cfg.apiKey));
  }
});

test('request deadline is identified accurately and does not silently retry', async t => {
  t.mock.method(console, 'info', () => {}); t.mock.method(console, 'error', () => {});
  const alive = setTimeout(() => {}, 1000); let calls = 0;
  try {
    const { events, error } = await invoke(async (_url, opts) => { calls++; return aborted(opts!.signal!); }, 5);
    assert.equal(calls, 1); assert.equal(events.at(-1)?.kind, 'timeout');
    assert.equal(events.at(-1)?.error?.name, 'TimeoutError');
    assert.match(modelFailureMessage(error!.diagnostic, false), /0.005 s limit/);
  } finally { clearTimeout(alive); }
});

test('deadline also covers a response body that stalls after HTTP 200', async t => {
  t.mock.method(console, 'info', () => {}); t.mock.method(console, 'error', () => {});
  const alive = setTimeout(() => {}, 1000);
  try {
    const { events } = await invoke(async (_url, opts) => {
      const response = answer(); response.json = () => aborted(opts!.signal!); return response;
    }, 5);
    assert.deepEqual(events.map(d => d.phase), ['request', 'headers', 'failed']);
    assert.equal(events.at(-1)?.httpStatus, 200); assert.equal(events.at(-1)?.kind, 'timeout');
  } finally { clearTimeout(alive); }
});

test('manual cancellation and overall run deadline remain distinct from request timeout', async t => {
  t.mock.method(console, 'info', () => {}); const errors = t.mock.method(console, 'error', () => {});
  const controller = new AbortController(); controller.abort();
  const cancelled = await invoke(async () => { throw new Error('Must not fetch'); }, 1000, controller.signal);
  assert.equal(cancelled.events.at(-1)?.phase, 'cancelled');
  assert.equal(errors.mock.callCount(), 0);
  const alive = setTimeout(() => {}, 1000);
  try {
    const { events } = await invoke(async (_url, opts) => aborted(opts!.signal!), 1000, AbortSignal.timeout(5));
    assert.equal(events.at(-1)?.kind, 'run_timeout');
  } finally { clearTimeout(alive); }
});
