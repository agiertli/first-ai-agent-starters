import type { SSEEvent } from "../types/events";

export function toolExchangeLabels(events: SSEEvent[]) {
  const request = events.findLast((event) => event.type === "llm_request");
  if (!request) return { request: "prompt + tools", response: "tool request / answer" };
  const hasResults = request.messages.some((message) => message.role === "tool");
  const summary = request.purpose === "context summary";
  const last = events.findLast((event) => event.type === "llm_response" || event.type === "llm_tool_selection" || event.type === "llm_request");
  return {
    request: summary ? "summarize history" : request.tools?.length ? hasResults ? "context + tools" : "prompt + tools" : hasResults ? "context + tool results" : "messages",
    response: last?.type === "llm_tool_selection" ? "tool request" : last?.type === "llm_response" ? summary ? "summary" : "model answer" : "model response",
  };
}
