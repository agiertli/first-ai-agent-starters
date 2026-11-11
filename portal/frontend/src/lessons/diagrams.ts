import type { DiagramSpec } from "../types/diagram";
import { AGENT_NODES, AGENT_ARROWS, AGENT_BOUNDS, AGENT_BOUNDARY } from "./agentArchitecture.ts";

export const DIAGRAM_SPECS: Record<number, DiagramSpec> = {
  // Lesson 1: Plain LLM Call
  1: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 120, y: 100 },
      { id: "llm", label: "LLM", type: "llm", x: 480, y: 100, sublabel: "text in → text out" },
    ],
    arrows: [
      { id: "req", from: "user", to: "llm", label: "prompt", yOffset: -18 },
      { id: "res", from: "llm", to: "user", label: "response", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["req"] },
      llm_request: { arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_response: { nodes: ["llm"], arrows: ["res"] },
    },
  },

  // Lesson 2: Streaming
  2: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 120, y: 100 },
      { id: "llm", label: "LLM", type: "llm", x: 480, y: 100, sublabel: "streaming" },
    ],
    arrows: [
      { id: "req", from: "user", to: "llm", label: "prompt", yOffset: -18 },
      { id: "stream", from: "llm", to: "user", label: "response chunks", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["req"] },
      llm_request: { arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      token: { nodes: ["llm"], arrows: ["stream"] },
      llm_response: { arrows: ["stream"] },
    },
  },

  // Lesson 3: No Memory — two independent calls (uses DualDiagram)
  3: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 120, y: 100 },
      { id: "llm", label: "LLM", type: "llm", x: 480, y: 100, sublabel: "stateless" },
    ],
    arrows: [
      { id: "req", from: "user", to: "llm", label: "call 1, then call 2", yOffset: -18 },
      { id: "res", from: "llm", to: "user", label: "independent replies", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["req"] },
      llm_request: { arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_response: { nodes: ["llm"], arrows: ["res"] },
      separator: {},
    },
  },

  // Lesson 4: Client-Side Memory
  4: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 40, y: 100 },
      { id: "client", label: "Client Code", type: "agent", x: 280, y: 100, sublabel: "history = []" },
      { id: "llm", label: "LLM", type: "llm", x: 540, y: 100, sublabel: "still stateless!" },
    ],
    arrows: [
      { id: "msg", from: "user", to: "client", label: "message", yOffset: -18 },
      { id: "req", from: "client", to: "llm", label: "all messages[]", yOffset: -18 },
      { id: "res", from: "llm", to: "client", label: "response", yOffset: 18 },
      { id: "reply", from: "client", to: "user", label: "append & reply", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["msg"] },
      llm_request: { nodes: ["client"], arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_response: { nodes: ["llm"], arrows: ["res"] },
      separator: { nodes: ["client"] },
    },
  },

  // Lesson 5: Context Window Management
  5: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 40, y: 30 },
      { id: "client", label: "Client Code", type: "agent", x: 300, y: 30, sublabel: "context manager" },
      { id: "llm", label: "LLM", type: "llm", x: 570, y: 30, sublabel: "finite window" },
      { id: "memory", label: "History", type: "tool", x: 300, y: 175, sublabel: "full or summarized" },
    ],
    arrows: [
      { id: "msg", from: "user", to: "client", label: "message", yOffset: -18 },
      { id: "req", from: "client", to: "llm", label: "messages[]", yOffset: -18 },
      { id: "res", from: "llm", to: "client", label: "response", yOffset: 18 },
      { id: "store", from: "client", to: "memory", label: "append" },
      { id: "load", from: "memory", to: "client", label: "summarize" },
      { id: "reply", from: "client", to: "user", label: "reply", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["msg"] },
      context_status: { nodes: ["memory"], arrows: ["store"] },
      llm_request: { nodes: ["client"], arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_response: { nodes: ["llm"], arrows: ["res"] },
      context_overflow: { nodes: ["memory"] },
      context_error: { nodes: ["llm"], arrows: ["res"] },
      context_compaction: { nodes: ["memory", "client"], arrows: ["load"] },
      separator: { nodes: ["client"] },
    },
  },

  // Lesson 6: Knowledge Boundary
  6: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 60, y: 100 },
      { id: "llm", label: "LLM", type: "llm", x: 320, y: 100, sublabel: "training + input" },
      { id: "world", label: "Real World", type: "external", x: 580, y: 100, sublabel: "unreachable" },
    ],
    arrows: [
      { id: "req", from: "user", to: "llm", label: "prompt" },
      { id: "wall", from: "llm", to: "world", label: "❌ no access" },
      { id: "res", from: "llm", to: "user", label: "hallucination?", yOffset: 22 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["req"] },
      llm_request: { arrows: ["req"] },
      llm_thinking: { nodes: ["llm"], arrows: ["wall"] },
      llm_response: { nodes: ["llm", "world"], arrows: ["res"] },
    },
  },

  // Lesson 7: Structured Output
  7: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 40, y: 100 },
      { id: "client", label: "Client Code", type: "agent", x: 300, y: 100, sublabel: "attaches schema" },
      { id: "llm", label: "LLM", type: "llm", x: 560, y: 100, sublabel: "constrained output" },
    ],
    arrows: [
      { id: "msg", from: "user", to: "client", label: "question", yOffset: -18 },
      { id: "req", from: "client", to: "llm", label: "prompt + schema", yOffset: -18 },
      { id: "res", from: "llm", to: "client", label: "{ JSON }", yOffset: 18 },
      { id: "reply", from: "client", to: "user", label: "parsed data", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["msg"] },
      schema_attached: { nodes: ["client"], arrows: ["req"] },
      llm_request: { nodes: ["client"], arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_response: { nodes: ["llm"], arrows: ["res", "reply"] },
      separator: { nodes: ["client"] },
    },
  },

  // Lesson 8: Tool Calling — Client orchestrates, LLM only selects
  8: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 30, y: 30 },
      { id: "client", label: "Client Code", type: "agent", x: 300, y: 30, sublabel: "orchestrates" },
      { id: "llm", label: "LLM", type: "llm", x: 570, y: 30, sublabel: "selects tool" },
      { id: "tool", label: "Tool", type: "tool", x: 300, y: 180, sublabel: "get_weather()" },
    ],
    arrows: [
      { id: "msg", from: "user", to: "client", label: "question", yOffset: -18 },
      { id: "req", from: "client", to: "llm", label: "prompt + tools", yOffset: -18 },
      { id: "pick", from: "llm", to: "client", label: "tool request / answer", yOffset: 18 },
      { id: "exec", from: "client", to: "tool", label: "execute locally" },
      { id: "result", from: "tool", to: "client", label: "result" },
      { id: "res", from: "client", to: "user", label: "answer", yOffset: 18 },
    ],
    eventHighlights: {
      user_message: { nodes: ["user"], arrows: ["msg"] },
      tools_attached: { nodes: ["client"], arrows: ["req"] },
      llm_request: { nodes: ["client"], arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_tool_selection: { nodes: ["llm"], arrows: ["pick"] },
      tool_call: { nodes: ["client"], arrows: ["exec"] },
      tool_executing: { nodes: ["tool"], arrows: ["exec"] },
      tool_result: { nodes: ["tool"], arrows: ["result"] },
      llm_response: { nodes: ["llm", "client"], arrows: ["pick", "res"] },
    },
  },

  // Lesson 9: MCP Protocol — client discovers tools via MCP
  9: {
    nodes: [
      { id: "user", label: "User", type: "user", x: 30, y: 30 },
      { id: "client", label: "Client Code", type: "agent", x: 300, y: 30, sublabel: "orchestrates" },
      { id: "llm", label: "LLM", type: "llm", x: 570, y: 30, sublabel: "picks tool" },
      { id: "mcp", label: "MCP Server", type: "mcp", x: 300, y: 190, sublabel: "lists + dispatches" },
      { id: "weather", label: "Tool function", type: "tool", x: 570, y: 190, sublabel: "runs on the server" },
    ],
    arrows: [
      { id: "msg", from: "user", to: "client", label: "question", yOffset: -18 },
      { id: "req", from: "client", to: "llm", label: "prompt + tools", yOffset: -18 },
      { id: "pick", from: "llm", to: "client", label: "tool choice", yOffset: 18 },
      { id: "discover", from: "client", to: "mcp", label: "list / call tools" },
      { id: "tools_back", from: "mcp", to: "client", label: "definitions / result" },
      { id: "execute", from: "mcp", to: "weather", label: "execute", yOffset: -18 },
      { id: "weather_result", from: "weather", to: "mcp", label: "result data", yOffset: 18 },
      { id: "res", from: "client", to: "user", label: "answer", yOffset: 18 },
    ],
    eventHighlights: {
      mcp_connect: { nodes: ["mcp"], arrows: ["discover"] },
      mcp_list_tools: { nodes: ["mcp"], arrows: ["tools_back"] },
      user_message: { nodes: ["user"], arrows: ["msg"] },
      tools_attached: { nodes: ["client"], arrows: ["req"] },
      llm_request: { nodes: ["client"], arrows: ["req"] },
      llm_thinking: { nodes: ["llm"] },
      llm_tool_selection: { nodes: ["llm"], arrows: ["pick"] },
      mcp_call_tool: { nodes: ["client", "mcp"], arrows: ["discover"] },
      tool_executing: { nodes: ["mcp", "weather"], arrows: ["execute"] },
      tool_result: { nodes: ["weather", "mcp"], arrows: ["weather_result", "tools_back"] },
      llm_response: { nodes: ["llm", "client"], arrows: ["pick", "res"] },
    },
  },

  // Lesson 10: Agent Loop (ReAct) — agent code + tools + memory + loop
  10: {
    bounds: AGENT_BOUNDS,
    boundary: { ...AGENT_BOUNDARY, label: "Our learning portal · live agent" },
    nodes: AGENT_NODES.map((node) => ({ ...node,
      label: node.id === "agent" ? "Agent Code" : node.id === "llm" ? "LLM" : node.label,
      sublabel: node.id === "agent" ? "bounded loop" : node.id === "tool" ? "get_weather()" : node.id === "ui" ? "this learning portal" : node.sublabel,
    })),
    arrows: AGENT_ARROWS,
    eventHighlights: {
      user_message: { nodes: ["user", "ui"], arrows: ["input", "req"] },
      tools_attached: { nodes: ["agent"], arrows: ["ask"] },
      llm_request: { nodes: ["agent"], arrows: ["ask"] },
      loop_iteration: { nodes: ["agent"], arrows: ["load", "store"] },
      context_status: { nodes: ["memory"] },
      context_compaction: { nodes: ["agent", "memory"], arrows: ["store"] },
      llm_thinking: { nodes: ["llm"] },
      llm_tool_selection: { nodes: ["llm"], arrows: ["pick"] },
      tool_call: { nodes: ["agent"], arrows: ["exec"] },
      tool_executing: { nodes: ["tool"], arrows: ["exec"] },
      tool_result: { nodes: ["tool", "memory"], arrows: ["result", "store"] },
      llm_response: { nodes: ["llm", "agent", "ui"], arrows: ["pick", "res", "output"] },
    },
  },

  // Lesson 11: an explicit state graph with conditional transitions.
  11: {
    nodes: [
      { id: "fetch_weather", label: "Fetch weather", type: "agent", x: 0, y: 85, sublabel: "updates state.weather" },
      { id: "choose_activity", label: "Choose route", type: "agent", x: 190, y: 85, sublabel: "rain → indoor" },
      { id: "plan_indoor", label: "Plan indoor", type: "llm", x: 400, y: 0, sublabel: "write_plan(state)" },
      { id: "plan_outdoor", label: "Plan outdoor", type: "llm", x: 400, y: 170, sublabel: "write_plan(state)" },
      { id: "format_output", label: "Format output", type: "agent", x: 620, y: 85, sublabel: "state.output → END" },
    ],
    arrows: [
      { id: "a1", from: "fetch_weather", to: "choose_activity", label: "weather" },
      { id: "a2", from: "choose_activity", to: "plan_indoor", label: "rainy" },
      { id: "a3", from: "choose_activity", to: "plan_outdoor", label: "otherwise" },
      { id: "a4", from: "plan_indoor", to: "format_output", label: "plan" },
      { id: "a5", from: "plan_outdoor", to: "format_output", label: "plan" },
    ],
    eventHighlights: {
      workflow_step: {},
      code_result_4: { nodes: ["format_output"] },
    },
  },
};
