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
    const value = JSON.parse(sessionStorage.getItem(CONNECTION_KEY) || 'null');
    if (value) cached = validateConnection(value, location.protocol);
  } catch { /* Storage is optional. Never recover a key from the old backend configuration. */ }
  return cached;
}

/** Returns false when the connection can only be kept in memory. */
export function saveBrowserConnection(input: BrowserConnection): boolean {
  cached = validateConnection(input, location.protocol);
  let persisted = false;
  try { sessionStorage.setItem(CONNECTION_KEY, JSON.stringify(cached)); persisted = true; } catch { /* Memory only. */ }
  window.dispatchEvent(new Event(CHANGE));
  return persisted;
}
export function clearBrowserConnection() {
  cached = null;
  try { sessionStorage.removeItem(CONNECTION_KEY); } catch { /* Storage unavailable. */ }
  window.dispatchEvent(new Event(CHANGE));
}
export function subscribeConnection(listener: () => void) {
  window.addEventListener(CHANGE, listener);
  return () => window.removeEventListener(CHANGE, listener);
}
