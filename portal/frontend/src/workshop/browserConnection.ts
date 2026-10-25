export interface BrowserConnection { apiBase: string; apiKey: string; model: string }
export const CONNECTION_KEY = 'first-agent.browser-connection.v1';
const CHANGE = 'first-agent-connection-change';
let cached: BrowserConnection | null | undefined;

export function validateConnection(input: BrowserConnection, pageProtocol = 'https:'): BrowserConnection {
  const url = new URL(input.apiBase.trim());
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback && pageProtocol === 'http:')) throw new Error('https');
  if (url.username || url.password || url.search || url.hash) throw new Error('url');
  if (!input.apiKey.trim() || /[\r\n\0]/.test(input.apiKey)) throw new Error('key');
  if (!input.model.trim() || /[\r\n\0]/.test(input.model)) throw new Error('model');
  return { apiBase: url.href.replace(/\/+$/, ''), apiKey: input.apiKey.trim(), model: input.model.trim() };
}

export function getBrowserConnection(): BrowserConnection | null {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    const stored = localStorage.getItem(CONNECTION_KEY);
    // An explicit null means Forget was used. Never revive an old session key.
    const value = JSON.parse(stored ?? sessionStorage.getItem(CONNECTION_KEY) ?? 'null');
    if (value) cached = validateConnection(value, location.protocol);
    if (stored === null && cached) {
      try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(cached)); } catch { /* Memory only. */ }
    }
  } catch { /* Storage is optional. Never use the original backend configuration. */ }
  try { sessionStorage.removeItem(CONNECTION_KEY); } catch { /* Legacy storage unavailable. */ }
  return cached;
}

/** Returns false when the connection can only be kept in memory. */
export function saveBrowserConnection(input: BrowserConnection): boolean {
  cached = validateConnection(input, location.protocol);
  let persisted = false;
  try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(cached)); persisted = true; } catch { /* Memory only. */ }
  try { sessionStorage.removeItem(CONNECTION_KEY); } catch { /* Legacy storage unavailable. */ }
  window.dispatchEvent(new Event(CHANGE));
  return persisted;
}
export function clearBrowserConnection() {
  cached = null;
  let cleared = true;
  // Keep only a non-secret marker so old tabs cannot migrate a forgotten key back.
  try { localStorage.setItem(CONNECTION_KEY, 'null'); } catch {
    try { localStorage.removeItem(CONNECTION_KEY); } catch { cleared = false; }
  }
  try { sessionStorage.removeItem(CONNECTION_KEY); } catch { cleared = false; }
  window.dispatchEvent(new Event(CHANGE));
  return cleared;
}
export function subscribeConnection(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CONNECTION_KEY && event.key !== null) return;
    try { if (event.storageArea !== localStorage) return; } catch { return; }
    cached = undefined;
    listener();
  };
  window.addEventListener(CHANGE, listener);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(CHANGE, listener); window.removeEventListener('storage', onStorage); };
}
