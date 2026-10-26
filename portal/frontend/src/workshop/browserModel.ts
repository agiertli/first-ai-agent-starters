import type { BrowserConnection } from './browserConnection.ts';

export const MODEL_REQUEST_TIMEOUT_MS = 60_000;
export interface ModelToolCall { id: string; type: 'function'; function: { name: string; arguments: string } }
export interface ModelMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string | null; tool_calls?: ModelToolCall[]; tool_call_id?: string }
export interface RequestDiagnostic {
  id: string; iteration: number; startedAt: number; elapsedMs: number; timeoutMs: number;
  endpoint: string; model: string; method: 'POST'; phase: 'request' | 'headers' | 'complete' | 'failed' | 'cancelled';
  httpStatus?: number; providerRequestId?: string;
  kind?: 'timeout' | 'run_timeout' | 'http' | 'network' | 'response' | 'cancelled';
  error?: { name: string; message: string };
}

/** Only explicit exception fields. Never log Request/Response objects, headers or payloads. */
export function safeException(error: unknown, privateValues: string[]): Error {
  const redact = (value: string) => {
    for (const secret of privateValues.filter(Boolean).sort((a, b) => b.length - a.length)) {
      value = value.split(secret).join('[redacted]').split(encodeURIComponent(secret)).join('[redacted]');
    }
    return value;
  };
  const original = error instanceof Error || error instanceof DOMException ? error : new Error(typeof error === 'string' ? error : 'Unknown client error');
  const safe = new Error(redact(original.message).slice(0, 1500));
  safe.name = redact(original.name).slice(0, 100);
  safe.stack = original.stack ? redact(original.stack).slice(0, 5000) : `${safe.name}: ${safe.message}`;
  return safe;
}
export class ModelRequestError extends Error {
  diagnostic: RequestDiagnostic;
  constructor(diagnostic: RequestDiagnostic) { super(diagnostic.error?.message); this.name = 'ModelRequestError'; this.diagnostic = diagnostic; }
}

export function modelFailureMessage(d: RequestDiagnostic, cs: boolean): string {
  const t = (a: string, b: string) => cs ? a : b;
  if (d.kind === 'timeout') return t(`Vypršel limit ${d.timeoutMs / 1000} s pro volání modelu. Úplná odpověď nedorazila včas. Zkuste nový pokus; původní požadavek může na serveru ještě běžet.`, `The model request exceeded its ${d.timeoutMs / 1000} s limit without a complete response. Try a new attempt; the original request may still be running on the server.`);
  if (d.kind === 'run_timeout') return t('Vypršel celkový limit 3 minut pro tento běh.', 'This run exceeded its overall three-minute limit.');
  if (d.kind === 'http') {
    const hint = d.httpStatus === 401 || d.httpStatus === 403 ? t('Ověřte klíč a oprávnění.', 'Check the key and permissions.')
      : d.httpStatus === 429 ? t('Server hlásí omezení počtu požadavků nebo vyčerpání kvóty. Zkuste později.', 'The server reports a rate or quota limit. Try again later.')
      : (d.httpStatus || 0) >= 500 ? t('Chybu vrátila služba modelu nebo její brána. Zkuste nový pokus.', 'The model service or its gateway returned an error. Try a new attempt.')
      : t('Ověřte adresu API, název modelu a podporovaný formát požadavku.', 'Check the API URL, model name and supported request format.');
    return `HTTP ${d.httpStatus}. ${hint}`;
  }
  if (d.kind === 'response') return t('API odpovědělo, ale odpověď nemá očekávaný formát. Podrobnosti jsou v diagnostice.', 'The API responded, but the response has an unexpected format. See the diagnostics.');
  return t('Prohlížeč nedokázal dokončit spojení s API. Zkontrolujte Console a Network: síť, CORS, TLS nebo zablokované přesměrování. Samotný JavaScript tyto příčiny nemusí rozlišit.', 'The browser could not complete the API connection. Check Console and Network for network, CORS, TLS or blocked redirect errors. JavaScript alone may not distinguish these causes.');
}

export async function requestBrowserModel(
  cfg: BrowserConnection, payload: Record<string, unknown>, iteration: number, runId: string,
  signal: AbortSignal, emit: (diagnostic: RequestDiagnostic) => void, privateValues: string[],
  fetcher: typeof fetch = fetch, timeoutMs = MODEL_REQUEST_TIMEOUT_MS,
): Promise<ModelMessage> {
  const startedAt = Date.now();
  const timeout = AbortSignal.timeout(timeoutMs);
  const requestSignal = AbortSignal.any([signal, timeout]);
  const redact = (value: string) => safeException(new Error(value), [cfg.apiKey, ...privateValues]).message;
  let diagnostic: RequestDiagnostic = { id: `${runId}/${iteration}`, iteration, startedAt, elapsedMs: 0, timeoutMs, endpoint: redact(`${cfg.apiBase}/chat/completions`), model: redact(cfg.model), method: 'POST', phase: 'request' };
  const update = (change: Partial<RequestDiagnostic>) => { diagnostic = { ...diagnostic, ...change, elapsedMs: Date.now() - startedAt }; emit(diagnostic); };
  try {
    requestSignal.throwIfAborted();
    update({});
    console.info('[workshop:model] request', diagnostic);
    const response = await fetcher(`${cfg.apiBase}/chat/completions`, {
      method: 'POST', signal: requestSignal, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` }, body: JSON.stringify(payload),
    });
    const providerRequestId = response.headers.get('x-request-id') || response.headers.get('request-id');
    update({ phase: 'headers', httpStatus: response.status, ...(providerRequestId ? { providerRequestId: redact(providerRequestId).slice(0, 150) } : {}) });
    console.info('[workshop:model] response headers', diagnostic);
    if (!response.ok) { diagnostic = { ...diagnostic, kind: 'http' }; throw new Error(`Model API returned HTTP ${response.status}`); }
    let data;
    try { data = await response.json(); } catch (error) {
      if (requestSignal.aborted) throw requestSignal.reason;
      // JSON parser errors may contain response text. Preserve type, omit body fragments.
      if (error instanceof SyntaxError) throw new SyntaxError('Model API response is not valid JSON (response body omitted).');
      throw error;
    }
    requestSignal.throwIfAborted();
    const raw = data?.choices?.[0]?.message;
    if (!raw || (raw.content != null && typeof raw.content !== 'string') || (raw.tool_calls != null && !Array.isArray(raw.tool_calls))) throw new Error('Invalid model response: expected choices[0].message');
    const calls: ModelToolCall[] = raw.tool_calls || [];
    if (calls.some(c => !c || c.type !== 'function' || typeof c.id !== 'string' || !c.id || typeof c.function?.name !== 'string' || typeof c.function?.arguments !== 'string')) throw new Error('Invalid tool call in model response');
    if (!payload.tools && calls.length) throw new Error('Unexpected tool calls in a request without tools');
    if (!calls.length && !raw.content?.trim()) throw new Error('Model returned an empty answer');
    update({ phase: 'complete' });
    console.info('[workshop:model] complete', diagnostic);
    return raw;
  } catch (error) {
    const safe = safeException(error, [cfg.apiKey, ...privateValues]);
    const kind = signal.aborted ? (signal.reason?.name === 'TimeoutError' ? 'run_timeout' : 'cancelled')
      : timeout.aborted || safe.name === 'TimeoutError' ? 'timeout'
      : diagnostic.kind === 'http' ? 'http' : diagnostic.phase === 'headers' && safe.name !== 'TypeError' ? 'response' : 'network';
    update({ phase: kind === 'cancelled' ? 'cancelled' : 'failed', kind, error: { name: safe.name, message: safe.message } });
    if (kind === 'cancelled') console.info('[workshop:model] cancelled', diagnostic);
    else console.error('[workshop:model] failed', safe, diagnostic);
    throw new ModelRequestError(diagnostic);
  }
}
