import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Point {
  x: number;
  y: number;
}

interface ArrowProps {
  from: Point;
  to: Point;
  active?: boolean;
  label?: string;
  color?: string;
  prerender?: boolean;
}

export function Arrow({
  from,
  to,
  active = false,
  label,
  color = "var(--text-secondary)",
  prerender = false,
}: ArrowProps) {
  const markerId = useId();
  const reducedMotion = useReducedMotion();
  const activeColor = color === "var(--text-secondary)" ? "var(--accent)" : color;
  const strokeColor = active ? activeColor : color;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const goingRight = dx > 0;
  const goingDown = dy > 0;

  let labelX = midX;
  let labelY = midY;
  let anchor: "middle" | "start" | "end" = "middle";

  if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
    // Keep reciprocal diagonal labels on opposite sides of their paths.
    // Horizontal above/below rules can cancel the lane offset and overlap.
    labelX = midX - (dy / length) * 18;
    labelY = midY + (dx / length) * 18;
  } else if (isHorizontal) {
    if (goingRight) {
      labelY = midY - 8;
    } else {
      labelY = midY + 14;
    }
  } else {
    if (goingDown) {
      labelX = midX + 16;
      labelY = midY - 10;
      anchor = "start";
    } else {
      labelX = midX - 16;
      labelY = midY + 14;
      anchor = "end";
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
        </marker>
      </defs>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={strokeColor}
        strokeWidth={2}
        markerEnd={`url(#${CSS.escape(markerId)})`}
        initial={reducedMotion ? false : prerender ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0.6 }}
        animate={
          active && !reducedMotion
            ? {
                pathLength: 1,
                opacity: 1,
                strokeDasharray: `${length}`,
                strokeDashoffset: [length, 0],
              }
            : prerender
              ? { pathLength: 1, opacity: 0.8 }
              : { pathLength: 1, opacity: 0.7 }
        }
        transition={
          reducedMotion ? { duration: 0 } : active
            ? { duration: 0.6, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={anchor}
          dominantBaseline="middle"
          fill="var(--text-secondary)"
          fontSize="13"
          fontFamily="inherit"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
