import { useState } from "react";
import type { SSEEvent } from "../types/events";
import { modelCalls } from "../lessons/modelCalls";

function PayloadDetails({ title, text }: { title: string; text: () => string }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>{title}</summary>
    {open && <pre>{text()}</pre>}
  </details>;
}

export function RequestHistory({ events }: { events: SSEEvent[] }) {
  const [selected, setSelected] = useState("all");
  const calls = modelCalls(events);
  const selection = selected !== "all" && selected !== "latest" && Number(selected) >= calls.length ? "all" : selected;
  const visible = calls.map((call, index) => ({ ...call, index })).filter(({ index }) => selection === "all" || index === (selection === "latest" ? calls.length - 1 : Number(selection)));
  const maximum = Math.max(1, ...calls.map(({ response }) => (response?.usage?.prompt_tokens ?? 0) + (response?.usage?.completion_tokens ?? 0)));
  return <div className="request-panel">
    <label htmlFor="request-number">Requests and responses</label>
    <select id="request-number" value={selection} onChange={(event) => setSelected(event.target.value)}>
      <option value="all">All calls · inputs and outputs</option>
      <option value="latest">Follow latest call</option>
      {calls.map(({ request }, index) => <option key={index} value={index}>Call {index + 1}{request.purpose ? ` · ${request.purpose}` : ""} · {request.messages.length} input messages</option>)}
    </select>
    {calls.length > 0 && <section className="context-growth" aria-label="Context growth per model call">
      <h4>Context per call <small>provider-reported tokens</small></h4>
      {calls.map(({ response, error }, index) => <div className="context-growth-row" key={index}>
        <span>#{index + 1}</span>
        {response?.usage?.prompt_tokens !== undefined ? <div>
          <div className="context-token-bar"><span style={{ width: `${100 * response.usage.prompt_tokens / maximum}%` }} /><i style={{ width: `${100 * (response.usage.completion_tokens ?? 0) / maximum}%` }} /></div>
          <small>{response.usage.prompt_tokens.toLocaleString()} input · {response.usage.completion_tokens === undefined ? "output usage unavailable" : `${response.usage.completion_tokens.toLocaleString()} output`}</small>
        </div> : <small>{error ? "Failed · no token usage returned" : response ? "Provider did not return token usage" : "Token usage not returned yet"}</small>}
      </div>)}
      <p>Input includes history and tool context sent on that call. Output is newly generated. It becomes later input only if the client sends it again. Bars compare calls, not the server's maximum window.</p>
    </section>}
    {!calls.length && <p>Run a lesson to inspect the actual model calls.</p>}
    {visible.map(({ request, response, error, index }) => <section key={index} className="model-call">
      <h4>Call {index + 1}{request.purpose ? ` · ${request.purpose}` : ""}</h4>
      <details open={selection !== "all"}>
        <summary>Request · {request.messages.length} messages sent by the application</summary>
        {request.messages.map((message, i) => <article key={i} className={`request-message role-${message.role}`}>
          <strong>{i + 1}. {message.role}</strong>
          {(message.content?.length ?? 0) > 12000 ? <PayloadDetails title={`Message length: ${message.content!.length.toLocaleString()} characters (not tokens) · expand text`} text={() => message.content!} /> : <pre>{message.content ?? "(no text)"}</pre>}
          {message.tool_calls && <pre>{JSON.stringify(message.tool_calls, null, 2)}</pre>}
          {message.tool_call_id && <small>Tool call ID: {message.tool_call_id}</small>}
        </article>)}
        {request.tools && <details><summary>Tool definitions</summary><pre>{JSON.stringify(request.tools, null, 2)}</pre></details>}
        {request.parameters && <><p className="payload-note">{request.transport}</p><PayloadDetails title="Full request parameters · credentials excluded" text={() => JSON.stringify(request.parameters, null, 2)} /></>}
      </details>
      {response?.type === "llm_response" && <article className="request-message role-assistant"><strong>{request.purpose === "context summary" ? "Summary returned by model" : "Response returned by model"}</strong><pre>{response.content}</pre></article>}
      {response?.type === "llm_tool_selection" && <details><summary>Response · model requested {response.tool_calls.length} tool call(s)</summary><pre>{JSON.stringify(response.tool_calls, null, 2)}</pre></details>}
      {error && <pre className="provider-error">{error}</pre>}
      {!response && !error && <p>Waiting for a response…</p>}
      {response?.raw_message && <details><summary>Raw assistant message from the SDK/provider</summary><pre>{JSON.stringify(response.raw_message, null, 2)}</pre></details>}
      {response?.usage && <details><summary>Full provider token accounting</summary><pre>{JSON.stringify(response.usage, null, 2)}</pre></details>}
    </section>)}
  </div>;
}
