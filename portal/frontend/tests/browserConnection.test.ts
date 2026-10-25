import { test } from 'node:test';
import assert from 'node:assert/strict';
const KEY = 'first-agent.browser-connection.v1';
const cfg = { apiBase: 'https://model.example/v1', model: 'test', apiKey: 'test-only-private-key' };
let instance = 0;
async function freshPage() { return import(`../src/workshop/browserConnection.ts?instance=${++instance}`); }
function setup() {
  function storage() {
    const values = new Map<string, string>();
    return { values, api: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    } };
  }
  const local = storage(), session = storage();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { protocol: 'https:' } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: local.api });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: session.api });
  Object.defineProperty(globalThis, 'document', { configurable: true, get: () => { throw new Error('must not use cookies'); } });
  const changedInAnotherTab = (key: string | null = KEY, storageArea = local.api) => {
    const event = new Event('storage');
    Object.defineProperties(event, { key: { value: key }, storageArea: { value: storageArea } });
    window.dispatchEvent(event);
  };
  return { local, session, changedInAnotherTab };
}

test('saved connection survives a fresh page with no session storage and leaves unrelated settings intact', async () => {
  const { local, session } = setup();
  const page = await freshPage();
  local.values.set('workbook', 'keep this');
  assert.equal(page.getBrowserConnection(), null);
  assert.equal(page.saveBrowserConnection(cfg), true);
  assert.equal(session.values.size, 0);
  const reopened = await freshPage();
  assert.deepEqual(reopened.getBrowserConnection(), cfg);
  assert.strictEqual(reopened.getBrowserConnection(), reopened.getBrowserConnection(), 'React snapshot must have stable identity');
  assert.equal(reopened.clearBrowserConnection(), true);
  assert.equal((await freshPage()).getBrowserConnection(), null);
  assert.equal(local.values.get('workbook'), 'keep this');
  assert.ok(!JSON.stringify([...local.values]).includes(cfg.apiKey));
});

test('existing session connection migrates automatically, but cannot revive a forgotten key', async () => {
  const { local, session } = setup();
  session.values.set(KEY, JSON.stringify(cfg));
  const page = await freshPage();
  assert.deepEqual(page.getBrowserConnection(), cfg);
  assert.deepEqual(JSON.parse(local.values.get(KEY)!), cfg);
  assert.equal(session.values.has(KEY), false);
  page.clearBrowserConnection();
  session.values.set(KEY, JSON.stringify(cfg)); // An old, previously closed tab gets restored.
  assert.equal((await freshPage()).getBrowserConnection(), null);
  assert.equal(session.values.has(KEY), false);
});

test('persistent configuration takes precedence over an older session credential', async () => {
  const { local, session } = setup();
  local.values.set(KEY, JSON.stringify(cfg));
  session.values.set(KEY, JSON.stringify({ ...cfg, apiBase: 'https://old.example/v1', apiKey: 'old-test-key' }));
  assert.deepEqual((await freshPage()).getBrowserConnection(), cfg);
  assert.equal(session.values.has(KEY), false);
});

test('save and forget in another tab update subscribers; irrelevant storage events do not', async () => {
  const { local, session, changedInAnotherTab } = setup();
  const page = await freshPage();
  assert.equal(page.getBrowserConnection(), null);
  const seen: unknown[] = [];
  const unsubscribe = page.subscribeConnection(() => seen.push(page.getBrowserConnection()));
  local.values.set(KEY, JSON.stringify(cfg)); changedInAnotherTab();
  assert.deepEqual(seen, [cfg]);
  changedInAnotherTab('workbook'); changedInAnotherTab(KEY, session.api);
  assert.equal(seen.length, 1);
  local.values.set(KEY, 'null'); changedInAnotherTab();
  assert.deepEqual(seen, [cfg, null]);
  page.saveBrowserConnection(cfg);
  assert.deepEqual(seen, [cfg, null, cfg]);
  local.values.clear(); changedInAnotherTab(null);
  assert.equal(seen.at(-1), null);
  unsubscribe(); page.saveBrowserConnection(cfg);
  assert.equal(seen.length, 4);
});

test('blocked storage reports memory-only persistence and failed removal honestly', async () => {
  const { local } = setup();
  const page = await freshPage();
  local.api.setItem = () => { throw new Error('storage blocked'); };
  assert.equal(page.saveBrowserConnection(cfg), false);
  assert.deepEqual(page.getBrowserConnection(), cfg);
  assert.equal((await freshPage()).getBrowserConnection(), null);
  local.api.removeItem = () => { throw new Error('storage blocked'); };
  assert.equal(page.clearBrowserConnection(), false);
  assert.equal(page.getBrowserConnection(), null);
});

test('invalid persisted connection fails closed; invalid edits cannot replace a valid saved connection', async () => {
  const { local } = setup();
  for (const value of ['{bad json', JSON.stringify({ ...cfg, apiBase: 'http://untrusted.example/v1' }), JSON.stringify({ model: 'incomplete' })]) {
    local.values.set(KEY, value);
    assert.equal((await freshPage()).getBrowserConnection(), null);
  }
  const page = await freshPage();
  page.saveBrowserConnection(cfg);
  assert.throws(() => page.saveBrowserConnection({ ...cfg, apiBase: 'https://model.example/v1?key=bad' }));
  assert.deepEqual(page.getBrowserConnection(), cfg);
  assert.deepEqual(JSON.parse(local.values.get(KEY)!), cfg);
});
