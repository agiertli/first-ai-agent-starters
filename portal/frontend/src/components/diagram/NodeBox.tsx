import { motion, useReducedMotion } from "framer-motion";
import type { NodeType } from "../../types/diagram";

interface NodeBoxProps {
  label: string;
  type: NodeType;
  active?: boolean;
  error?: boolean;
  x: number;
  y: number;
  sublabel?: string;
  prerender?: boolean;
  subtle?: boolean;
}

const NODE_ICONS: Record<NodeType, string> = {
  user: "\u{1F464}",
  llm: "\u{1F9E0}",
  agent: "\u{1F916}",
  tool: "\u{1F527}",
  mcp: "\u{1F50C}",
  external: "\u{1F30D}",
  context: "\u{1F4DA}",
  interface: "\u{1F5A5}",
  control: "\u{1F512}",
};

const NODE_COLORS: Record<NodeType, string> = {
  user: "var(--node-user)",
  llm: "var(--node-llm)",
  agent: "var(--node-agent)",
  tool: "var(--node-tool)",
  mcp: "var(--node-mcp)",
  external: "var(--node-tool)",
  context: "var(--node-tool)",
  interface: "var(--node-user)",
  control: "var(--node-agent)",
};

export function NodeBox({
  label,
  type,
  active = false,
  error = false,
  x,
  y,
  sublabel,
  prerender = false,
  subtle = false,
}: NodeBoxProps) {
  const reducedMotion = useReducedMotion();
  const color = NODE_COLORS[type];
  const borderColor = error ? "var(--node-error)" : color;

  return (
    <motion.div
      className="diagram-node"
      initial={reducedMotion ? false : subtle ? { scale: 1, opacity: 0 } : prerender ? { scale: 1, opacity: 0.7 } : { scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: active ? 1 : prerender ? 0.7 : 1,
        boxShadow: active && !reducedMotion && !subtle
          ? [
              `0 0 8px ${color}`,
              `0 0 24px ${color}`,
              `0 0 8px ${color}`,
            ]
          : `0 0 0px transparent`,
      }}
      transition={
        reducedMotion ? { duration: 0 } : subtle ? { duration: 0.15, ease: "easeOut" } : active
          ? { boxShadow: { duration: 1.5, repeat: Infinity }, scale: { type: "spring", stiffness: 300 } }
          : { scale: { type: "spring", stiffness: 300 } }
      }
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 120,
        height: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: "var(--bg-secondary)",
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: "6px 8px",
        userSelect: "none",
        zIndex: 2,
      }}
    >
      <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>
        {NODE_ICONS[type]}
      </span>
      <span
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.25,
            overflowWrap: "anywhere",
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          {sublabel}
        </span>
      )}
    </motion.div>
  );
}
