export interface ResponseDetails {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; [key: string]: unknown } | null;
  raw_message?: Record<string, unknown> | null;
}

export type SSEEvent =
  | { type: "user_message"; content: string }
  | { type: "llm_request"; messages: Array<{ role: string; content?: string | null; tool_calls?: unknown[]; tool_call_id?: string }>; tools?: unknown[] | null; purpose?: string | null; parameters?: Record<string, unknown>; transport?: string }
  | { type: "llm_thinking" }
  | { type: "llm_reasoning"; content: string }
  | ({ type: "llm_response"; content: string } & ResponseDetails)
  | { type: "token"; content: string }
  | { type: "tools_attached"; tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }> }
  | ({ type: "llm_tool_selection"; tool_calls: Array<{ name: string; arguments: Record<string, unknown> }> } & ResponseDetails)
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_executing"; name: string }
  | { type: "tool_result"; name: string; result: string }
  | { type: "mcp_connect"; server: string }
  | { type: "mcp_list_tools"; tools: Array<{ name: string; description: string }> }
  | { type: "mcp_call_tool"; name: string; args: Record<string, unknown> }
  | { type: "loop_iteration"; iteration: number; max?: number }
  | { type: "workflow_step"; step: string; description: string }
  | { type: "workflow_state"; step: string; state: Record<string, unknown> }
  | { type: "workflow_transition"; source: string; target: string }
  | { type: "agent_step"; step: string; description: string }
  | { type: "separator"; label?: string }
  | { type: "context_status"; message_count: number; estimated_tokens: number; limit: number }
  | { type: "context_overflow"; message_count: number; estimated_tokens: number; limit: number }
  | { type: "context_compaction"; before_count: number; after_count: number; before_tokens?: number; after_tokens?: number; summary: string; measurement?: string }
  | { type: "context_measurement"; input_tokens: number; limit: number; output_tokens: number; source: string; phase: string }
  | { type: "context_threshold"; input_tokens: number; limit: number; threshold: number }
  | { type: "context_compacting"; input_tokens: number; limit: number }
  | { type: "context_error"; error: string }
  | { type: "schema_attached"; schema: Record<string, unknown> }
  | { type: "parse_result"; success: boolean; output: string }
  | { type: "code_result" | "code_result_1" | "code_result_2" | "code_result_4"; content: string }
  | { type: "notice"; content: string }
  | { type: "error"; content: string; error_type?: string; status_code?: number | null; details?: string }
  | { type: "done" };
