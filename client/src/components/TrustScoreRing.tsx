/**
 * @file TrustScoreRing.tsx
 * @description Animated SVG ring visualization for the contract Trust Score (0–100).
 *
 * The ring is drawn using SVG circles with stroke-dasharray/stroke-dashoffset
 * to create a "progress ring" effect. The colored arc represents the score
 * as a fraction of the full circumference.
 *
 * Animation:
 * On mount (or score change), the ring starts at strokeDashoffset = circumference
 * (fully hidden) and transitions to the target offset over 1.2 seconds using
 * a cubic-bezier easing curve that mimics a spring (fast start, gentle deceleration).
 *
 * This is done imperatively via a ref rather than CSS animation because:
 *   a) CSS @keyframes can't interpolate to a dynamic value (the offset depends on score)
 *   b) We need to trigger the transition after mount (requires requestAnimationFrame trick)
 *
 * Color coding matches the Severity system mentally:
 *   75-100 → green  (Fair)     — safe to sign
 *   50-74  → yellow (Caution)  — read carefully
 *   30-49  → orange (Risky)    — get advice
 *   0-29   → red    (Abusive)  — do not sign without negotiation
 */

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrustScoreRingProps {
  /** The trust score, 0–100. */
  score: number;

  /** Overall diameter of the SVG in pixels. Defaults to 120. */
  size?: number;

  /** Width of the ring stroke in pixels. Defaults to 10. */
  strokeWidth?: number;

  /** Whether to animate the ring on mount. Set to false for instant render. */
  animate?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate ring color for a given trust score.
 * Thresholds are calibrated from testing real contracts:
 * most standard enterprise contracts land around 55–70.
 */
function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e"; // green-500  — Fair
  if (score >= 50) return "#eab308"; // yellow-500 — Caution
  if (score >= 30) return "#f97316"; // orange-500 — Risky
  return "#ef4444";                  // red-500    — Abusive
}

/**
 * Returns the human-readable label for a trust score tier.
 */
function getScoreLabel(score: number): string {
  if (score >= 75) return "Fair";
  if (score >= 50) return "Caution";
  if (score >= 30) return "Risky";
  return "Abusive";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrustScoreRing({ score, size = 120, strokeWidth = 10, animate = true }: TrustScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  // Geometry calculations
  const radius = (size - strokeWidth) / 2;  // inner radius of the ring
  const circumference = 2 * Math.PI * radius; // full circle length in px

  // The dash offset represents the "gap" — how much of the circle is hidden.
  // offset = 0 → full ring visible (score 100)
  // offset = circumference → ring fully hidden (score 0)
  const offset = circumference - (score / 100) * circumference;

  const color = getScoreColor(score);

  // ---------------------------------------------------------------------------
  // Animation effect
  //
  // We use an imperative approach with refs because SVG transition on
  // stroke-dashoffset requires the element to first render at the "empty" state
  // (offset = circumference), then transition to the target.
  //
  // The requestAnimationFrame + setTimeout ensures the browser has committed
  // the initial state to the paint layer before we start the transition.
  // Without this, the browser may batch the two style changes and skip the animation.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!circleRef.current || !animate) return;

    // Start from "empty" (no arc visible)
    circleRef.current.style.strokeDashoffset = String(circumference);

    const frame = requestAnimationFrame(() => {
      // One more tick delay to ensure the initial state is painted
      setTimeout(() => {
        if (circleRef.current) {
          // Apply the CSS transition, then set the target offset
          circleRef.current.style.transition =
            "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
          circleRef.current.style.strokeDashoffset = String(offset);
        }
      }, 100);
    });

    return () => cancelAnimationFrame(frame);
  }, [score, offset, circumference, animate]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Trust score: ${score} out of 100 — ${getScoreLabel(score)}`}
        role="img"
      >
        {/* Track ring — the grey full circle in the background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring — the colored arc representing the score */}
        {/* Rotated -90° so it starts at the top of the circle, not the right */}
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
          // When not animating, render immediately at the correct offset
          strokeDashoffset={animate ? circumference : offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Score number and label, absolutely centered over the ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold"
          style={{ color, lineHeight: 1 }}
          aria-hidden="true" // announced via SVG aria-label above
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
