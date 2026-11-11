import type { DiagramNode, DiagramArrow, DiagramSpec } from "../types/diagram.ts";

// Shared geometry makes the conceptual opening and the executable agent rhyme.
export const AGENT_NODES: DiagramNode[] = [
  { id: "user", label: "User", type: "user", x: 0, y: 20 },
  { id: "ui", label: "Interface", type: "interface", x: 200, y: 20, sublabel: "input + output" },
  { id: "agent", label: "Application", type: "agent", x: 400, y: 20, sublabel: "controls the loop" },
  { id: "llm", label: "Model", type: "llm", x: 700, y: 20, sublabel: "generates + selects" },
  { id: "memory", label: "Context", type: "context", x: 260, y: 170, sublabel: "history + instructions" },
  { id: "tool", label: "Tools", type: "tool", x: 610, y: 170, sublabel: "execute outside model" },
];

export const AGENT_ARROWS: DiagramArrow[] = [
  { id: "input", from: "user", to: "ui", label: "task", yOffset: -18 },
  { id: "output", from: "ui", to: "user", label: "answer", yOffset: 18 },
  { id: "req", from: "ui", to: "agent", label: "input", yOffset: -18 },
  { id: "res", from: "agent", to: "ui", label: "final answer", yOffset: 18 },
  { id: "ask", from: "agent", to: "llm", label: "context + tools", yOffset: -18 },
  { id: "pick", from: "llm", to: "agent", label: "answer / tool request", yOffset: 18 },
  { id: "exec", from: "agent", to: "tool", label: "execute" },
  { id: "result", from: "tool", to: "agent", label: "result" },
  { id: "store", from: "agent", to: "memory", label: "append" },
  { id: "load", from: "memory", to: "agent", label: "prepare context" },
];

export const AGENT_BOUNDS = { minX: -28, minY: -45, width: 910, height: 365 };
export const AGENT_BOUNDARY = { x: 170, y: -20, width: 685, height: 320 };

export const REVEAL_STEPS = [
  { title: "Start with the model", ids: ["llm"], explanation: "A GPT model generates a response from the context it receives. The model is one component—not the whole product." },
  { title: "Add tools", ids: ["llm", "tool"], explanation: "Search, code execution and external services provide capabilities beyond text generation. The model does not execute these tools itself." },
  { title: "Add the application loop", ids: ["llm", "tool", "agent"], explanation: "The application calls the model, executes requested tools, returns their results, and continues when needed. Follow the arrows: no model-to-tool shortcut." },
  { title: "Manage context", ids: ["llm", "tool", "agent", "memory"], explanation: "The application prepares instructions, conversation history and relevant information for the next call. Saved memory and the current context window are different things." },
  { title: "Add the interface", ids: ["llm", "tool", "agent", "memory", "ui", "user"], explanation: "You interact through a chat interface. Behind it, the application coordinates the model, context and tools." },
  { title: "Should the system help with this?", ids: ["llm", "tool", "agent", "memory", "ui", "user"], explanation: "A request such as “hack google.com” can be refused or require clarification of authorization before any tool runs. Safety includes model behaviour and system checks; a refusal is not a hard security boundary or a guarantee that misuse is impossible." },
  { title: "What may it actually do?", ids: ["llm", "tool", "agent", "memory", "ui", "user"], explanation: "The application checks tool access and may require approval. Execution restrictions can limit files and network access; external services enforce account permissions. A sandbox is one way to restrict execution—not necessarily a separate container or a tool called ‘code runner’. Controls depend on the product and configuration." },
  { title: "You know the whole system as ChatGPT", ids: ["llm", "tool", "agent", "memory", "ui", "user"], explanation: "ChatGPT is the whole product—not just its model. Context, tools, the loop and safety boundaries work together. Lesson 10 rebuilds the core with our own live backend." },
] as const;

export function revealStep(current: number, direction: number) {
  return Math.max(0, Math.min(REVEAL_STEPS.length - 1, current + direction));
}

export function overviewSpec(step: number): DiagramSpec {
  const ids: readonly string[] = REVEAL_STEPS[step].ids;
  const policies = step >= 5;
  const protectedExecution = step >= 6;
  // Reserve the lower row from the first reveal so safety controls never move existing nodes.
  const nodes = AGENT_NODES.filter((node) => ids.includes(node.id)).map((node) =>
    node.id === "llm" ? { ...node, label: "GPT model" } :
    node.id === "memory" ? { ...node, x: 200, y: 260 } :
    node.id === "tool" ? { ...node, x: 700, y: 260 } : node);
  const arrows = AGENT_ARROWS.filter((arrow) => ids.includes(arrow.from) && ids.includes(arrow.to) && !(protectedExecution && ["exec", "result"].includes(arrow.id)));
  const annotations: NonNullable<DiagramSpec["annotations"]> = [];
  if (policies) annotations.push({ id: "policy", x: 385, y: -10, width: 450, height: 160, label: "Safety policies + checks", detail: "Model behaviour + application checks · not an isolation boundary", style: "policy" });
  if (protectedExecution) {
    nodes.push(
      { id: "permissions", label: "Access gate", type: "control", x: 400, y: 260, sublabel: "permissions + approvals" },
    );
    arrows.push(
      { id: "authorize", from: "agent", to: "permissions", label: "check" },
      { id: "approved_tool", from: "permissions", to: "tool", label: "invoke", yOffset: -18 },
      { id: "approved_result", from: "tool", to: "permissions", label: "result", yOffset: 18 },
      { id: "return_result", from: "permissions", to: "agent", label: "result" },
    );
    annotations.push({ id: "execution", x: 385, y: 240, width: 450, height: 175, label: "Execution controls", detail: "Permissions · sandboxing where applicable", style: "sandbox" });
  }
  return {
    nodes, arrows, annotations, eventHighlights: {},
    bounds: { ...AGENT_BOUNDS, minY: -75, height: 530 },
    boundary: step === REVEAL_STEPS.length - 1 ? { ...AGENT_BOUNDARY, y: -45, height: 480, label: "ChatGPT · the AI system" } : undefined,
  };
}
