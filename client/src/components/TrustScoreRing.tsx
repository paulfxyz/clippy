import { useEffect, useRef } from "react";

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e"; // green
  if (score >= 50) return "#eab308"; // yellow
  if (score >= 30) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Fair";
  if (score >= 50) return "Caution";
  if (score >= 30) return "Risky";
  return "Abusive";
}

export function TrustScoreRing({ score, size = 120, strokeWidth = 10, animate = true }: TrustScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  useEffect(() => {
    if (!circleRef.current || !animate) return;
    circleRef.current.style.strokeDashoffset = String(circumference);
    const frame = requestAnimationFrame(() => {
      setTimeout(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
          circleRef.current.style.strokeDashoffset = String(offset);
        }
      }, 100);
    });
    return () => cancelAnimationFrame(frame);
  }, [score, offset, circumference, animate]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color, lineHeight: 1 }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}
