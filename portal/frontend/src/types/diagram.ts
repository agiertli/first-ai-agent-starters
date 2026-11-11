export type NodeType = "user" | "llm" | "agent" | "tool" | "mcp" | "external" | "context" | "interface" | "control";

export interface DiagramNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  sublabel?: string;
}

export interface DiagramArrow {
  id: string;
  from: string;
  to: string;
  label?: string;
  yOffset?: number;
}

export interface DiagramSpec {
  annotations?: { id: string; x: number; y: number; width: number; height: number; label: string; detail: string; style: "policy" | "sandbox" }[];
  bounds?: { minX: number; minY: number; width: number; height: number };
  boundary?: { x: number; y: number; width: number; height: number; label: string };
  nodes: DiagramNode[];
  arrows: DiagramArrow[];
  eventHighlights: Record<string, { nodes?: string[]; arrows?: string[] }>;
}
