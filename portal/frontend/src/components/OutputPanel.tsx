import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { SSEEvent } from "../types/events";

interface LogEntry {
  key: string;
  icon: string;
  label: string;
  content: string;
  color: string;
  details?: string;
  errorType?: string;
  statusCode?: number | null;
}

function EntryContent({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  if (entry.content.length > 4000) return <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary>Message length: {entry.content.length.toLocaleString()} characters (not tokens) · expand text</summary>
    {expanded ? entry.content : <span>{entry.content.slice(0, 150)}…</span>}
  </details>;
  return entry.label.startsWith("LLM") && entry.icon === "🧠" ? <div className="model-answer"><ReactMarkdown>{entry.content}</ReactMarkdown></div> : entry.content;
}

function eventToEntry(evt: SSEEvent, idx: number, purpose?: string): LogEntry | null {
  switch (evt.type) {
    case "user_message":
      return { key: `e${idx}`, icon: "\u{1F464}", label: "User", content: evt.content, color: "var(--node-user)" };
    case "llm_response":
      return { key: `e${idx}`, icon: "\u{1F9E0}", label: purpose === "context summary" ? "LLM · context summary" : "LLM", content: evt.content, color: "var(--node-llm)" };
    case "token":
      return null;
    case "tools_attached": {
      const toolList = evt.tools.map(t => `  - ${t.name}: ${t.description}`).join("\n");
      return { key: `e${idx}`, icon: "\u{1F4CE}", label: "Tools Attached to Prompt", content: `Sending tool definitions to LLM:\n${toolList}`, color: "var(--node-agent)" };
    }
    case "llm_tool_selection": {
      const raw = JSON.stringify(evt.tool_calls, null, 2);
      return { key: `e${idx}`, icon: "\u{1F916}", label: "LLM · tool selection", content: `LLM selected:\n${raw}`, color: "var(--node-llm)" };
    }
    case "tool_call":
      return { key: `e${idx}`, icon: "\u{1F527}", label: "Client Executes", content: `${evt.name}(${JSON.stringify(evt.args)})`, color: "var(--node-tool)" };
    case "tool_result": {
      let display = evt.result;
      try {
        display = JSON.stringify(JSON.parse(evt.result), null, 2);
      } catch { /* keep original */ }
      return { key: `e${idx}`, icon: "\u{2705}", label: evt.name, content: display, color: "var(--node-tool)" };
    }
    case "mcp_connect":
      return { key: `e${idx}`, icon: "\u{1F50C}", label: "MCP", content: `Connecting to ${evt.server}`, color: "var(--node-mcp)" };
    case "mcp_list_tools":
      return { key: `e${idx}`, icon: "\u{1F50C}", label: "MCP Discovery", content: evt.tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n"), color: "var(--node-mcp)" };
    case "mcp_call_tool":
      return { key: `e${idx}`, icon: "\u{1F50C}", label: "Client → MCP server · tools/call", content: `Request server-side execution:\n${JSON.stringify({ name: evt.name, arguments: evt.args }, null, 2)}\nThe MCP server runs the tool and returns its result.`, color: "var(--node-mcp)" };
    case "separator":
      return { key: `e${idx}`, icon: "", label: "", content: evt.label ?? "───────────────────", color: "var(--text-muted)" };
    case "loop_iteration":
      return { key: `e${idx}`, icon: "\u{1F504}", label: "Loop", content: `Iteration ${evt.iteration}${evt.max ? ` / ${evt.max}` : ""}`, color: "var(--node-agent)" };
    case "workflow_step":
      return { key: `e${idx}`, icon: "\u{25B6}", label: "Workflow", content: evt.description, color: "var(--node-agent)" };
    case "workflow_transition":
      return { key: `e${idx}`, icon: "→", label: "Transition", content: `${evt.source} → ${evt.target}`, color: "var(--node-agent)" };
    case "workflow_state":
      return { key: `e${idx}`, icon: "{}", label: `State after ${evt.step}`, content: JSON.stringify(evt.state, null, 2), color: "var(--node-agent)" };
    case "llm_thinking":
      return { key: `e${idx}`, icon: "\u{23F3}", label: "LLM", content: "Calling LLM...", color: "var(--text-muted)" };
    case "llm_reasoning":
      return { key: `e${idx}`, icon: "\u{1F4AD}", label: "LLM Reasoning", content: evt.content, color: "#a78bfa" };
    case "context_status": {
      const pct = Math.round((evt.estimated_tokens / evt.limit) * 100);
      const bar = pct >= 90 ? "🔴" : pct >= 60 ? "🟡" : "🟢";
      return { key: `e${idx}`, icon: bar, label: "Application history policy", content: `≈${evt.estimated_tokens} / ${evt.limit} estimated tokens (${pct}%) — ${evt.message_count} messages. This is not the provider's context-window measurement.`, color: pct >= 90 ? "#ef4444" : "var(--node-agent)" };
    }
    case "context_measurement":
      return { key: `e${idx}`, icon: "▰", label: "Server context check · tokens", content: `${evt.phase}\nEntire request: ${evt.input_tokens.toLocaleString()} input tokens (instructions + history + new message, with chat formatting).\nAnswer allowance: ${evt.output_tokens.toLocaleString()} tokens. Server context limit: ${evt.limit.toLocaleString()} tokens.\nMeasured by ${evt.source}. Character counts below describe individual text lengths, not context usage.`, color: "var(--node-agent)" };
    case "context_overflow":
      return { key: `e${idx}`, icon: "\u{274C}", label: "Teaching budget reached", content: `Approximately ${evt.estimated_tokens} tokens exceeds our ${evt.limit}-token application budget. The client will summarize before the next call.`, color: "#ef4444" };
    case "context_error":
      return { key: `e${idx}`, icon: "\u{1F4A5}", label: "LLM API ERROR", content: evt.error, color: "#ef4444" };
    case "context_compaction": {
      if (evt.before_tokens === undefined || evt.after_tokens === undefined) return { key: `e${idx}`, icon: "↻", label: "History summarized", content: `${evt.before_count} → ${evt.after_count} messages. Older turns were replaced by the actual model summary; the original task stays. This is an application policy, not a measured model context limit.`, color: "var(--node-agent)" };
      return { key: `e${idx}`, icon: "\u{2705}", label: "History summarized", content: `${evt.before_tokens.toLocaleString()} → ${evt.after_tokens.toLocaleString()} ${evt.measurement ? "server-counted" : "approximate"} tokens (${Math.round((1 - evt.after_tokens / evt.before_tokens) * 100)}% reduction). The summary above replaces older history; the original task is kept.`, color: "#22c55e" };
    }
    case "schema_attached": {
      const schemaStr = JSON.stringify(evt.schema, null, 2);
      return { key: `e${idx}`, icon: "\u{1F4CB}", label: "JSON Schema Attached", content: schemaStr, color: "var(--node-agent)" };
    }
    case "parse_result":
      return { key: `e${idx}`, icon: evt.success ? "\u{2705}" : "\u{274C}", label: evt.success ? "json.loads() OK" : "json.loads() FAILED", content: evt.output, color: evt.success ? "#22c55e" : "#ef4444" };
    case "code_result":
    case "code_result_1":
    case "code_result_2":
    case "code_result_4":
      return { key: `e${idx}`, icon: "\u{1F40D}", label: "Python", content: evt.content, color: "var(--node-agent)" };
    case "notice":
      return { key: `e${idx}`, icon: "ⓘ", label: "About this demo", content: evt.content, color: "var(--text-secondary)" };
    case "error":
      return { key: `e${idx}`, icon: "!", label: "Run failed", content: evt.content, color: "var(--node-error)", details: evt.details, errorType: evt.error_type, statusCode: evt.status_code };
    case "done":
      return { key: `e${idx}`, icon: "", label: "", content: "— End of run —", color: "var(--text-muted)" };
    default:
      return null;
  }
}

interface OutputPanelProps {
  events: SSEEvent[];
  isRunning: boolean;
  showHeader?: boolean;
}

export function OutputPanel({ events, isRunning, showHeader = true }: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const streamingText = events.reduce((acc, evt) => {
    if (evt.type === "token") return acc + evt.content;
    if (evt.type === "llm_response") return "";
    return acc;
  }, "");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const entries = events.map((evt, i) => {
    const request = events.slice(0, i + 1).findLast((event) => event.type === "llm_request");
    const entry = eventToEntry(evt, i, request?.purpose ?? undefined);
    const turn = events.slice(0, i + 1).findLast((event) => event.type === "loop_iteration");
    if (entry && turn && evt.type === "context_measurement") entry.label += ` · turn ${turn.iteration}`;
    return entry;
  }).filter(Boolean) as LogEntry[];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {showHeader && <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-color)",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Output
        </span>
        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ fontSize: "0.6rem", color: "var(--node-agent)" }}
          >
            ● running
          </motion.span>
        )}
      </div>}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "8px 12px",
          background: "var(--bg-primary)",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: "0.85rem",
          lineHeight: 1.5,
        }}
      >
        {entries.length === 0 && !streamingText && (
          <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            {isRunning ? "Waiting for the first execution step…" : "Run the lesson to inspect its execution trace."}
          </div>
        )}
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                marginBottom: 8,
                paddingLeft: entry.label ? 8 : 0,
                borderLeft: entry.label ? `2px solid ${entry.color}` : "none",
              }}
            >
              {entry.label ? (
                <>
                  <div style={{ color: entry.color, fontWeight: 600, fontSize: "0.75rem", marginBottom: 4 }}>
                    {entry.icon} {entry.label}
                  </div>
                  <div style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    <EntryContent entry={entry} />
                    {entry.details && <details className="error-details"><summary>Technical details · {entry.errorType}{entry.statusCode ? ` · HTTP ${entry.statusCode}` : ""}</summary><pre>{entry.details}</pre></details>}
                  </div>
                </>
              ) : (
                <div style={{ color: entry.color, textAlign: "center", fontSize: "0.6rem" }}>
                  {entry.content}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginBottom: 8,
              paddingLeft: 8,
              borderLeft: "2px solid var(--node-llm)",
            }}
          >
            <div style={{ color: "var(--node-llm)", fontWeight: 600, fontSize: "0.6rem", marginBottom: 2 }}>
              {"\u{1F9E0}"} LLM (streaming)
            </div>
            <div style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {streamingText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ▊
              </motion.span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
