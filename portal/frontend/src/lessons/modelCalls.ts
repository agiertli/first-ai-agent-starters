import type { SSEEvent } from "../types/events";

export interface ModelExchange {
  request: Extract<SSEEvent, { type: "llm_request" }>;
  response?: Extract<SSEEvent, { type: "llm_response" | "llm_tool_selection" }>;
  error?: string;
}

export function modelCalls(events: SSEEvent[]): ModelExchange[] {
  const calls: ModelExchange[] = [];
  for (const event of events) {
    if (event.type === "llm_request") calls.push({ request: event });
    const current = calls.at(-1);
    if (!current) continue;
    if (event.type === "llm_response" || event.type === "llm_tool_selection") current.response = event;
    if (!current.response && event.type === "error") current.error = event.details ? `${event.content}\n\n${event.details}` : event.content;
    if (!current.response && event.type === "context_error") current.error = event.error;
  }
  return calls;
}
