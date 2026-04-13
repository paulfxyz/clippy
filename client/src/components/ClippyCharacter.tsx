/**
 * @file ClippyCharacter.tsx
 * @description The Clippy mascot component — an animated SVG paperclip character
 * with speech bubble, blinking eyes, and optional animations.
 *
 * Design reference: Microsoft Office Assistant "Clippit" (1997–2003)
 * https://en.wikipedia.org/wiki/Office_Assistant
 *
 * The character is drawn entirely in SVG — no external images, no HTTP requests.
 * The paperclip body uses two overlapping <path> elements:
 *   - Outer path (stroke: #C8A800, width: 14) — creates a dark gold "shadow" for depth
 *   - Inner path (stroke: #F5D000, width: 8) — the bright yellow paperclip body
 *   - Shine path (stroke: #FFF176, width: 2.5) — a white-ish highlight for 3D effect
 *
 * Eyes are SVG ellipses. The blink effect is achieved by setting the `ry` prop
 * (vertical radius) to 0.8 (nearly flat) on a randomized interval.
 *
 * Animations are CSS keyframe-based (defined in index.css):
 *   - clippy-wobble: used when a file is dropped or major state changes
 *   - clippy-talk: subtle bobbing used during analysis
 *   - fadeInUp: entrance animation for the speech bubble
 */

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClippyProps {
  /** The text to show in the speech bubble. Omit to hide the bubble. */
  message?: string;

  /** Whether to play the wobble animation (e.g. on file drop). */
  isAnimating?: boolean;

  /** Whether Clippy is "talking" — plays the gentle bobbing animation. */
  isTalking?: boolean;

  /** Visual size preset. Defaults to "md". */
  size?: "sm" | "md" | "lg";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClippyCharacter({ message, isAnimating, isTalking, size = "md" }: ClippyProps) {
  // blink tracks whether eyes are currently mid-blink (ry reduced to near-zero)
  const [blinkState, setBlinkState] = useState(false);

  // Randomized blinking — blinks every 3–5 seconds, lasts 150ms
  // Randomization prevents the mechanical "every 3 seconds exactly" feel
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2000; // 3–5 seconds
      return setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => setBlinkState(false), 150); // blink duration
        scheduleBlink(); // schedule next blink recursively
      }, delay);
    };

    const timer = scheduleBlink();
    // Cleanup on unmount — prevents state updates on unmounted components
    return () => clearTimeout(timer);
  }, []);

  // Size map: each preset sets the SVG width (height is ~1.4x for the tall paperclip shape)
  const sizes = { sm: 64, md: 100, lg: 140 };
  const s = sizes[size];

  return (
    <div className="flex items-end gap-3">

      {/* ------------------------------------------------------------------ */}
      {/* Speech bubble                                                        */}
      {/* Appears to the left of Clippy, with a triangle "tail" pointing right */}
      {/* ------------------------------------------------------------------ */}
      {message && (
        <div
          className="relative bg-card border border-border rounded-xl px-4 py-3 shadow-md max-w-xs fade-in-up"
          style={{ fontSize: "0.85rem", lineHeight: "1.5" }}
        >
          <p className="text-foreground">{message}</p>

          {/* Bubble tail: two overlapping triangles (outer=border, inner=fill) */}
          {/* Outer triangle — border color */}
          <div
            className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: `10px solid hsl(var(--border))`,
              marginRight: -1,
            }}
          />
          {/* Inner triangle — card background color (creates border effect) */}
          <div
            className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderLeft: `9px solid hsl(var(--card))`,
              marginRight: 1,
            }}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Clippy SVG character                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`flex-shrink-0 select-none cursor-default
          ${isAnimating ? "clippy-wobble" : ""}
          ${isTalking ? "clippy-talk" : ""}`}
        style={{ width: s, height: s * 1.4 }}
      >
        <svg
          viewBox="0 0 100 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Clippy the paperclip assistant"
          style={{ width: "100%", height: "100%" }}
        >
          {/* ============================================================ */}
          {/* Paperclip body                                                 */}
          {/* The path traces a classic paperclip loop:                      */}
          {/*   - Start at bottom                                            */}
          {/*   - Curve up and around the outer loop                         */}
          {/*   - Come back down inside                                      */}
          {/*   - Exit through the inner gap at the bottom                   */}
          {/* ============================================================ */}

          {/* Outer shadow layer (dark gold, wider stroke) */}
          <path
            d="M 35 120 C 20 120 10 110 10 95 L 10 35 C 10 20 20 10 35 10 C 50 10 60 20 60 35 L 60 95 C 60 102 55 108 48 108 C 41 108 36 102 36 95 L 36 45"
            stroke="#C8A800"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bright body layer (primary yellow, thinner) */}
          <path
            d="M 35 120 C 20 120 10 110 10 95 L 10 35 C 10 20 20 10 35 10 C 50 10 60 20 60 35 L 60 95 C 60 102 55 108 48 108 C 41 108 36 102 36 95 L 36 45"
            stroke="#F5D000"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Specular shine (top-right edge of the outer loop) */}
          <path
            d="M 40 18 C 46 20 52 27 52 35 L 52 90"
            stroke="#FFF176"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
            fill="none"
          />

          {/* ============================================================ */}
          {/* Eyes                                                           */}
          {/* Positioned on the upper section of the inner loop             */}
          {/* blink: ry reduced to 0.8 (nearly invisible) during blink      */}
          {/* ============================================================ */}

          {/* Left eye — white sclera */}
          <ellipse cx="28" cy="68" rx="6" ry={blinkState ? 0.8 : 6} fill="white" />
          {/* Left pupil */}
          <ellipse cx="28" cy="68" rx="3.5" ry={blinkState ? 0.5 : 3.5} fill="#1a1a2e" />
          {/* Left eye highlight — tiny white dot for "life" */}
          <circle cx="29.5" cy="66.5" r="1" fill="white" opacity="0.8" />

          {/* Right eye — white sclera */}
          <ellipse cx="46" cy="68" rx="6" ry={blinkState ? 0.8 : 6} fill="white" />
          {/* Right pupil */}
          <ellipse cx="46" cy="68" rx="3.5" ry={blinkState ? 0.5 : 3.5} fill="#1a1a2e" />
          {/* Right eye highlight */}
          <circle cx="47.5" cy="66.5" r="1" fill="white" opacity="0.8" />

          {/* ============================================================ */}
          {/* Mouth                                                          */}
          {/* Slightly open (arc) when talking, gentle curve when idle       */}
          {/* ============================================================ */}
          {isTalking ? (
            // Talking: more pronounced arc (mouth more open)
            <path d="M 30 80 Q 37 85 44 80" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            // Idle: subtle smile
            <path d="M 30 80 Q 37 83 44 80" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}

          {/* ============================================================ */}
          {/* Eyebrows                                                       */}
          {/* Slight curve matching the expression                          */}
          {/* ============================================================ */}
          <path d="M 23 61 Q 28 58 33 61" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 41 61 Q 46 58 51 61" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
