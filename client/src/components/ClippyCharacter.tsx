import { useState, useEffect } from "react";

interface ClippyProps {
  message?: string;
  isAnimating?: boolean;
  isTalking?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ClippyCharacter({ message, isAnimating, isTalking, size = "md" }: ClippyProps) {
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const sizes = { sm: 64, md: 100, lg: 140 };
  const s = sizes[size];

  return (
    <div className="flex items-end gap-3">
      {/* Speech bubble */}
      {message && (
        <div
          className="relative bg-card border border-border rounded-xl px-4 py-3 shadow-md max-w-xs fade-in-up"
          style={{ fontSize: "0.85rem", lineHeight: "1.5" }}
        >
          <p className="text-foreground">{message}</p>
          {/* Bubble tail pointing right toward Clippy */}
          <div
            className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2"
            style={{
              width: 0, height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: `10px solid hsl(var(--border))`,
              marginRight: -1,
            }}
          />
          <div
            className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2"
            style={{
              width: 0, height: 0,
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderLeft: `9px solid hsl(var(--card))`,
              marginRight: 1,
            }}
          />
        </div>
      )}

      {/* Clippy SVG */}
      <div
        className={`flex-shrink-0 select-none ${isAnimating ? "clippy-wobble" : ""} ${isTalking ? "clippy-talk" : ""}`}
        style={{ width: s, height: s * 1.4 }}
      >
        <svg
          viewBox="0 0 100 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Clippy the paperclip assistant"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Paperclip body */}
          {/* Outer loop */}
          <path
            d="M 35 120 C 20 120 10 110 10 95 L 10 35 C 10 20 20 10 35 10 C 50 10 60 20 60 35 L 60 95 C 60 102 55 108 48 108 C 41 108 36 102 36 95 L 36 45"
            stroke="#C8A800"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          {/* Inner overlap */}
          <path
            d="M 35 120 C 20 120 10 110 10 95 L 10 35 C 10 20 20 10 35 10 C 50 10 60 20 60 35 L 60 95 C 60 102 55 108 48 108 C 41 108 36 102 36 95 L 36 45"
            stroke="#F5D000"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Shine */}
          <path
            d="M 40 18 C 46 20 52 27 52 35 L 52 90"
            stroke="#FFF176"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
            fill="none"
          />

          {/* Eyes - positioned on the upper part of the clip */}
          {/* Left eye */}
          <ellipse cx="28" cy="68" rx="6" ry={blinkState ? 0.8 : 6} fill="white" />
          <ellipse cx="28" cy="68" rx="3.5" ry={blinkState ? 0.5 : 3.5} fill="#1a1a2e" />
          <circle cx="29.5" cy="66.5" r="1" fill="white" opacity="0.8" />

          {/* Right eye */}
          <ellipse cx="46" cy="68" rx="6" ry={blinkState ? 0.8 : 6} fill="white" />
          <ellipse cx="46" cy="68" rx="3.5" ry={blinkState ? 0.5 : 3.5} fill="#1a1a2e" />
          <circle cx="47.5" cy="66.5" r="1" fill="white" opacity="0.8" />

          {/* Mouth */}
          {isTalking ? (
            <path d="M 30 80 Q 37 85 44 80" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M 30 80 Q 37 83 44 80" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}

          {/* Eyebrows (expressive) */}
          <path d="M 23 61 Q 28 58 33 61" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 41 61 Q 46 58 51 61" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
