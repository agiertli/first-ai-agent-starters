import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer;
let diagram: Awaited<ReturnType<ViteDevServer['ssrLoadModule']>>;
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false, watch: null }, appType: 'custom' });
  diagram = await server.ssrLoadModule('/src/workshop/LiveRunView.tsx');
});
after(async () => { await server?.close(); });

test('live diagram identifies the executed tool and hides tools in plain-chat mode', () => {
  for (const tool of ['read_materials', 'get_weather']) {
    const markup = renderToStaticMarkup(createElement(diagram.RunDiagram, { lang: 'cs', phase: 'tool_executing', tool, model: 'Recorded-Model', chat: false }));
    assert.ok(markup.includes(`aria-label="${tool}"`));
    assert.ok(markup.includes('actor-tool is-lit'));
    assert.ok(markup.includes('Recorded-Model'));
    if (tool === 'read_materials') assert.ok(!markup.includes('get_weather'));
  }
  const chat = renderToStaticMarkup(createElement(diagram.RunDiagram, { lang: 'en', phase: 'thinking', chat: true }));
  assert.ok(!chat.includes('actor-tool'));
  assert.ok(!chat.includes('Qwen'));
});

test('live diagram uses the model from its recorded request and does not invent an idle tool', () => {
  const markup = renderToStaticMarkup(createElement(diagram.LiveRunView, {
    events: [{ type: 'request_status', diagnostic: { model: 'Recorded-Model', id: 'run/1', startedAt: Date.now(), elapsedMs: 0, timeoutMs: 60000, endpoint: 'https://example.test/v1/chat/completions', method: 'POST', phase: 'complete' } }],
    lang: 'cs', chat: false, task: 'A demo', runId: 1, running: false, runControl: null,
  }));
  assert.ok(markup.includes('aria-label="Recorded-Model"'));
  assert.ok(markup.includes('aria-label="podle úkolu"'));
  assert.ok(!markup.includes('get_weather'));
  assert.ok(!markup.includes('Qwen'));
});
