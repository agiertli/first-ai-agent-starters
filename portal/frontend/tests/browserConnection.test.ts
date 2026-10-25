import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONNECTION_KEY, saveBrowserConnection, getBrowserConnection, clearBrowserConnection, subscribeConnection } from '../src/workshop/browserConnection.ts';

test('connection stays in tab storage, updates subscribers and can be forgotten without touching localStorage or cookies', () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { protocol: 'https:' } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  // Accessing either would fail the test.
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('must not use persistent storage'); } });
  Object.defineProperty(globalThis, 'document', { configurable: true, get: () => { throw new Error('must not use cookies'); } });
  let changes = 0; const unsubscribe = subscribeConnection(() => changes++);
  const cfg = {apiBase: 'https://model.example/v1', model: 'test', apiKey: 'private-test-key'};
  assert.equal(getBrowserConnection(), null);
  assert.equal(saveBrowserConnection(cfg), true);
  assert.deepEqual(JSON.parse(values.get(CONNECTION_KEY)!), cfg);
  assert.deepEqual(getBrowserConnection(), cfg);
  clearBrowserConnection();
  assert.equal(getBrowserConnection(), null); assert.equal(values.has(CONNECTION_KEY), false); assert.equal(changes, 2);
  unsubscribe();
});
