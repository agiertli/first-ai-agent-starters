import { useMemo, useRef, useState, useEffect } from "react";
import type { SSEEvent } from "../../types/events";
import type { DiagramSpec } from "../../types/diagram";
import { NodeBox } from "./NodeBox";
import { Arrow } from "./Arrow";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 110;
const PADDING = 30;
const MAX_SCALE = 1.5;

function anchorPoint(
  node: { x: number; y: number },
  side: "left" | "right" | "top" | "bottom",
) {
  switch (side) {
    case "right":
      return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
    case "left":
      return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
    case "top":
      return { x: node.x + NODE_WIDTH / 2, y: node.y };
    case "bottom":
      return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT };
  }
}

const CALL_SPEC: DiagramSpec = {
  nodes: [
    { id: "user", label: "User", type: "user", x: 20, y: 50 },
    { id: "llm", label: "LLM", type: "llm", x: 220, y: 50, sublabel: "stateless" },
  ],
  arrows: [
    { id: "req", from: "user", to: "llm", label: "prompt", yOffset: -16 },
    { id: "res", from: "llm", to: "user", label: "response", yOffset: 16 },
  ],
  eventHighlights: {
    user_message: { nodes: ["user"], arrows: ["req"] },
    llm_request: { arrows: ["req"] },
    llm_thinking: { nodes: ["llm"] },
    llm_response: { nodes: ["llm"], arrows: ["res"] },
  },
};

const CONTENT_BOUNDS = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of CALL_SPEC.nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT + (node.sublabel ? 16 : 0));
  }
  return {
    minX: minX - PADDING,
    minY: minY - PADDING,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2,
  };
})();

const ADJUSTED_NODES = CALL_SPEC.nodes.map((n) => ({
  ...n,
  x: n.x - CONTENT_BOUNDS.minX,
  y: n.y - CONTENT_BOUNDS.minY,
}));

const ADJUSTED_NODE_MAP = Object.fromEntries(ADJUSTED_NODES.map((n) => [n.id, n]));

function MiniDiagram({
  events,
  label,
  dimmed,
}: {
  events: SSEEvent[];
  label: string;
  dimmed: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scale, offsetX, offsetY } = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }
    const scaleX = containerSize.width / CONTENT_BOUNDS.width;
    const scaleY = containerSize.height / CONTENT_BOUNDS.height;
    const s = Math.min(scaleX, scaleY, MAX_SCALE);
    const scaledW = CONTENT_BOUNDS.width * s;
    const scaledH = CONTENT_BOUNDS.height * s;
    return {
      scale: s,
      offsetX: (containerSize.width - scaledW) / 2,
      offsetY: (containerSize.height - scaledH) / 2,
    };
  }, [containerSize]);

  const hasStarted = events.length > 0;

  const activeState = useMemo(() => {
    const activeNodes = new Set<string>();
    const activeArrows = new Set<string>();
    if (!hasStarted) return { activeNodes, activeArrows };

    const lastIdx = Math.max(0, events.length - 1);
    for (let i = Math.max(0, lastIdx - 2); i <= lastIdx; i++) {
      const evt = events[i];
      const highlights = CALL_SPEC.eventHighlights[evt.type];
      if (highlights) {
        highlights.nodes?.forEach((n) => activeNodes.add(n));
        highlights.arrows?.forEach((a) => activeArrows.add(a));
      }
    }
    return { activeNodes, activeArrows };
  }, [events, hasStarted]);

  const showPrerender = !hasStarted && !dimmed;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 170,
        position: "relative",
        minWidth: 0,
        opacity: dimmed ? 0.25 : 1,
        transition: "opacity 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: hasStarted ? "var(--accent)" : "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          zIndex: 10,
        }}
      >
        {label}
      </div>
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        <div
          style={{
            position: "absolute",
            left: offsetX,
            top: offsetY,
            width: CONTENT_BOUNDS.width,
            height: CONTENT_BOUNDS.height,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {CALL_SPEC.arrows.map((arrow) => {
            const fromNode = ADJUSTED_NODE_MAP[arrow.from];
            const toNode = ADJUSTED_NODE_MAP[arrow.to];
            if (!fromNode || !toNode) return null;
            const fromIsLeft = fromNode.x < toNode.x;
            const yOff = arrow.yOffset ?? 0;
            return (
              <Arrow
                key={arrow.id}
                from={{
                  x: fromIsLeft
                    ? anchorPoint(fromNode, "right").x
                    : anchorPoint(fromNode, "left").x,
                  y:
                    (fromIsLeft
                      ? anchorPoint(fromNode, "right").y
                      : anchorPoint(fromNode, "left").y) + yOff,
                }}
                to={{
                  x: fromIsLeft
                    ? anchorPoint(toNode, "left").x
                    : anchorPoint(toNode, "right").x,
                  y:
                    (fromIsLeft
                      ? anchorPoint(toNode, "left").y
                      : anchorPoint(toNode, "right").y) + yOff,
                }}
                label={arrow.label}
                active={activeState.activeArrows.has(arrow.id)}
                prerender={showPrerender}
              />
            );
          })}
          {ADJUSTED_NODES.map((node) => (
            <NodeBox
              key={node.id}
              label={node.label}
              type={node.type}
              x={node.x}
              y={node.y}
              sublabel={node.sublabel}
              active={activeState.activeNodes.has(node.id)}
              prerender={showPrerender}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DualDiagramProps {
  events: SSEEvent[];
  currentEventIndex: number;
}

export function DualDiagram({ events }: DualDiagramProps) {
  const { call1Events, call2Events, phase } = useMemo(() => {
    const sepIdx = events.findIndex((e) => e.type === "separator");
    if (sepIdx === -1) {
      return { call1Events: events, call2Events: [] as SSEEvent[], phase: events.length > 0 ? 1 : 0 };
    }
    return {
      call1Events: events.slice(0, sepIdx),
      call2Events: events.slice(sepIdx + 1),
      phase: 2 as number,
    };
  }, [events]);

  return (
    <div className="dual-diagram"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 1px minmax(0, 1fr)",
        width: "100%",
        height: "100%",
        gap: 4,
        padding: "0 16px",
      }}
    >
      <MiniDiagram
        events={call1Events}
        label="Call 1"
        dimmed={phase === 2}
      />
      <div
        className="dual-divider"
        style={{
          width: 1,
          background: "var(--border-color)",
          alignSelf: "stretch",
          margin: "20px 0",
          opacity: 0.5,
        }}
      />
      <MiniDiagram
        events={call2Events}
        label="Call 2"
        dimmed={phase === 1}
      />
    </div>
  );
}
