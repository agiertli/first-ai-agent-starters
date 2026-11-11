import { useMemo, useRef, useState, useEffect } from "react";
import type { SSEEvent } from "../../types/events";
import type { DiagramSpec } from "../../types/diagram";
import { NodeBox } from "./NodeBox";
import { Arrow } from "./Arrow";
import { LoopIndicator } from "./LoopIndicator";
import { toolExchangeLabels } from "../../lessons/diagramLabels";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 110;
const PADDING = 28;
const MIN_SCALE = 0.85;
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

function bestAnchors(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { fromSide: "left" | "right" | "top" | "bottom"; toSide: "left" | "right" | "top" | "bottom" } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { fromSide: "right", toSide: "left" }
      : { fromSide: "left", toSide: "right" };
  }
  return dy > 0
    ? { fromSide: "bottom", toSide: "top" }
    : { fromSide: "top", toSide: "bottom" };
}

interface LessonDiagramProps {
  spec: DiagramSpec;
  events: SSEEvent[];
  currentEventIndex: number;
  conceptual?: boolean;
}

export function LessonDiagram({ spec, events, currentEventIndex, conceptual = false }: LessonDiagramProps) {
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

  const contentBounds = useMemo(() => {
    if (spec.bounds) return spec.bounds;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of spec.nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT);
    }
    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    };
  }, [spec.nodes, spec.bounds]);

  const { scale, offsetX, offsetY } = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }
    const scaleX = containerSize.width / contentBounds.width;
    const scaleY = containerSize.height / contentBounds.height;
    const s = Math.max(spec.bounds ? 0.75 : MIN_SCALE, Math.min(scaleX, scaleY, MAX_SCALE));
    const scaledW = contentBounds.width * s;
    const scaledH = contentBounds.height * s;
    return {
      scale: s,
      offsetX: Math.max(0, (containerSize.width - scaledW) / 2),
      offsetY: Math.max(0, (containerSize.height - scaledH) / 2),
    };
  }, [containerSize, contentBounds, spec.bounds]);

  const adjustedNodes = useMemo(
    () => spec.nodes.map((n) => ({
      ...n,
      x: n.x - contentBounds.minX,
      y: n.y - contentBounds.minY,
    })),
    [spec.nodes, contentBounds],
  );

  const priorNodeIds = useRef<string[]>([]);
  useEffect(() => {
    if (!conceptual) return;
    const viewport = containerRef.current;
    const added = adjustedNodes.find((node) => !priorNodeIds.current.includes(node.id));
    priorNodeIds.current = adjustedNodes.map((node) => node.id);
    // On a narrow screen the first model would otherwise start off-screen.
    // Pan to the newly revealed layer without moving the diagram geometry.
    const focusNode = added ?? adjustedNodes[0];
    if (viewport && focusNode && containerSize.width < contentBounds.width * scale) {
      viewport.scrollLeft = focusNode.x * scale - (containerSize.width - NODE_WIDTH * scale) / 2;
    }
  }, [conceptual, adjustedNodes, containerSize.width, contentBounds.width, scale]);

  const hasStarted = conceptual || events.some((event) => event.type !== "notice" && event.type !== "done");

  const activeState = useMemo(() => {
    const activeNodes = new Set<string>();
    const activeArrows = new Set<string>();

    if (!hasStarted) return { activeNodes, activeArrows };

    const lastIdx = Math.max(0, currentEventIndex - 1);
    for (let i = lastIdx; i <= lastIdx && i < events.length; i++) {
      const evt = events[i];
      if (evt.type === "context_measurement" && spec.nodes.some((node) => node.id === "memory")) activeNodes.add("memory");
      if (evt.type === "workflow_step" || evt.type === "workflow_state") {
        if (spec.nodes.some((node) => node.id === evt.step)) activeNodes.add(evt.step);
      }
      if (evt.type === "workflow_transition") {
        activeNodes.add(evt.source);
        if (evt.target !== "END") activeNodes.add(evt.target);
        spec.arrows.filter((arrow) => arrow.from === evt.source && arrow.to === evt.target)
          .forEach((arrow) => activeArrows.add(arrow.id));
      }
      if (evt.type.startsWith("llm_")) {
        const step = events.slice(0, i + 1).findLast((event) => event.type === "workflow_step");
        if (step?.type === "workflow_step") activeNodes.add(step.step);
      }
      const request = events.slice(0, i + 1).findLast((event) => event.type === "llm_request");
      if (evt.type === "llm_response" && request?.type === "llm_request" && request.purpose === "context summary" && spec.nodes.some((node) => node.id === "agent")) {
        activeNodes.add("llm");
        activeNodes.add("agent");
        activeArrows.add("pick");
        continue; // A summary returns to the application, not to the user.
      }
      const highlights = spec.eventHighlights[evt.type];
      if (highlights) {
        highlights.nodes?.forEach((n) => activeNodes.add(n));
        highlights.arrows?.forEach((a) => activeArrows.add(a));
      }
    }
    return { activeNodes, activeArrows };
  }, [events, currentEventIndex, hasStarted, spec.eventHighlights, spec.nodes, spec.arrows]);

  const nodeMap = useMemo(
    () => Object.fromEntries(adjustedNodes.map((n) => [n.id, n])),
    [adjustedNodes],
  );

  const latestRequest = events.filter((event) => event.type === "llm_request").at(-1);
  const exchangeLabels = toolExchangeLabels(events);
  const hasToolExchange = spec.arrows.some((arrow) => arrow.id === "pick");
  const latestMCPCall = events.findLast((event) => event.type === "mcp_call_tool");

  const loopState = (() => {
    if (!hasStarted) return null;
    for (let i = events.length - 1; i >= 0; i--) {
      const evt = events[i];
      if (evt.type === "loop_iteration" && "iteration" in evt) {
        const center = nodeMap["agent"] ?? nodeMap["llm"] ?? adjustedNodes[1];
        return {
          iteration: evt.iteration,
          max: "max" in evt ? evt.max : undefined,
          x: center.x + NODE_WIDTH / 2,
          y: center.y + NODE_HEIGHT / 2,
          active: activeState.activeNodes.has("llm"),
        };
      }
    }
    return null;
  })();

  return (
    <div
      ref={containerRef}
      className="diagram-viewport"
      tabIndex={containerSize.width < contentBounds.width * scale ? 0 : undefined}
      aria-label={containerSize.width < contentBounds.width * scale ? "Execution diagram; scroll horizontally to see all nodes" : undefined}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "auto",
      }}
    >
      {containerSize.width < contentBounds.width * scale && <div className="diagram-scroll-hint">Scroll sideways to explore the diagram</div>}
      <div style={{ position: "relative", width: Math.max(containerSize.width, contentBounds.width * scale), height: Math.max(containerSize.height, contentBounds.height * scale) }}>
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: contentBounds.width,
          height: contentBounds.height,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {spec.boundary && <div className="system-boundary" style={{ left: spec.boundary.x - contentBounds.minX, top: spec.boundary.y - contentBounds.minY, width: spec.boundary.width, height: spec.boundary.height }}><span>{spec.boundary.label}</span></div>}
        {spec.annotations?.map((annotation) => <div key={annotation.id} className={`architecture-annotation ${annotation.style}`} style={{ left: annotation.x - contentBounds.minX, top: annotation.y - contentBounds.minY, width: annotation.width, height: annotation.height }}><strong>{annotation.label}</strong><small>{annotation.detail}</small></div>)}
        {spec.arrows.map((arrow) => {
          const fromNode = nodeMap[arrow.from];
          const toNode = nodeMap[arrow.to];
          if (!fromNode || !toNode) return null;
          const { fromSide, toSide } = bestAnchors(fromNode, toNode);
          const fromPt = anchorPoint(fromNode, fromSide);
          const toPt = anchorPoint(toNode, toSide);
          const reciprocal = spec.arrows.some((other) => other.from === arrow.to && other.to === arrow.from);
          const dx = toPt.x - fromPt.x, dy = toPt.y - fromPt.y;
          const length = Math.hypot(dx, dy) || 1;
          const lane = reciprocal && arrow.yOffset === undefined ? 12 : 0;
          const xOff = -dy / length * lane;
          const yOff = (arrow.yOffset ?? 0) + dx / length * lane;
          return (
            <Arrow
              key={arrow.id}
              from={{ x: fromPt.x + xOff, y: fromPt.y + yOff }}
              to={{ x: toPt.x + xOff, y: toPt.y + yOff }}
              label={hasToolExchange && (arrow.id === "req" && arrow.to === "llm" || arrow.id === "ask") ? exchangeLabels.request : hasToolExchange && arrow.id === "pick" ? exchangeLabels.response : nodeMap.mcp && events.length > 0 && arrow.id === "discover" ? events.some((event) => event.type === "mcp_call_tool") ? "tools/call" : "tools/list" : nodeMap.mcp && events.length > 0 && arrow.id === "tools_back" ? events.some((event) => event.type === "mcp_call_tool") ? "tool result" : "tool definitions" : arrow.label}
              active={activeState.activeArrows.has(arrow.id)}
              prerender={!hasStarted}
            />
          );
        })}

        {adjustedNodes.map((node) => (
          <NodeBox
            key={node.id}
            label={node.label}
            type={node.type}
            x={node.x}
            y={node.y}
            sublabel={node.id === "weather" && latestMCPCall ? latestMCPCall.name : latestRequest && (node.id === "memory" || (node.id === "client" && node.sublabel === "history = []")) ? `${latestRequest.messages.length} messages in last call` : node.sublabel}
            active={activeState.activeNodes.has(node.id)}
            prerender={!hasStarted}
            subtle={conceptual}
          />
        ))}

        {loopState && (
          <LoopIndicator
            iteration={loopState.iteration}
            maxIterations={loopState.max}
            active={loopState.active}
            x={loopState.x}
            y={loopState.y}
            radius={64}
          />
        )}
      </div>
      </div>
    </div>
  );
}
