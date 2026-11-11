import { motion } from "framer-motion";

interface LoopIndicatorProps {
  iteration: number;
  maxIterations?: number;
  active?: boolean;
  x: number;
  y: number;
  radius?: number;
}

export function LoopIndicator({
  iteration,
  maxIterations,
  active = false,
  x,
  y,
  radius = 80,
}: LoopIndicatorProps) {
  const circumference = 2 * Math.PI * radius;
  const progress = maxIterations
    ? (iteration / maxIterations) * circumference
    : circumference * 0.75;

  return (
    <div
      role="img"
      aria-label={`Agent loop iteration ${iteration}${maxIterations ? ` of ${maxIterations}` : ""}`}
      style={{
        position: "absolute",
        left: x - radius - 20,
        top: y - radius - 20,
        width: (radius + 20) * 2,
        height: (radius + 20) * 2,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${(radius + 20) * 2} ${(radius + 20) * 2}`}
      >
        {/* Background ring */}
        <circle
          cx={radius + 20}
          cy={radius + 20}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={2}
          opacity={0.3}
        />
        {/* Animated progress ring */}
        <motion.circle
          cx={radius + 20}
          cy={radius + 20}
          r={radius}
          fill="none"
          stroke="var(--node-agent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - progress,
            rotate: active ? [0, 360] : 0,
          }}
          transition={
            active
              ? {
                  strokeDashoffset: { duration: 0.5 },
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                }
              : { duration: 0.5 }
          }
          style={{ transformOrigin: "center" }}
        />
        {/* Arrow tip on the ring */}
        <motion.polygon
          points="-5,-4 5,0 -5,4"
          fill="var(--node-agent)"
          animate={
            active
              ? { opacity: [0.5, 1, 0.5] }
              : { opacity: 0.6 }
          }
          transition={
            active
              ? { duration: 1.5, repeat: Infinity }
              : {}
          }
          style={{
            transform: `translate(${radius + 20 + radius}px, ${radius + 20}px)`,
          }}
        />
      </svg>
    </div>
  );
}
