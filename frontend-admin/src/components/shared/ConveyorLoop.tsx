/**
 * ConveyorLoop — Raashi Design System loading indicator.
 *
 * COLOR POLICY:
 *   This component is FULLY color-agnostic. It renders using `currentColor`
 *   and CSS opacity only. The PARENT is responsible for setting the text color:
 *
 *     <ConveyorLoop className="text-brand-blue" />   // on beige / white surface
 *     <ConveyorLoop className="text-white" />         // on navy / blue surface
 *     <ConveyorLoop className="text-current" />       // inside Button — inherits automatically
 *
 *   Do NOT add hardcoded color values inside this file.
 *
 * API:
 *   blocks      – array of glyphs used as the moving "payload" (default: █ ▓ ▒)
 *   track       – single glyph that fills the empty track (default: ░)
 *   trackLength – total character width of the conveyor (default: 10)
 *   speed       – animation cycle duration in ms (default: 600)
 *   className   – forwarded to the root <span> (use Tailwind text-* here)
 *   style       – forwarded to the root <span>
 */

import { useEffect, useRef, useState } from "react";

export interface ConveyorLoopProps {
  /** Moving block glyphs — rendered at full opacity. */
  blocks?: string[];
  /** Track glyph — rendered at 35% opacity via inline opacity. */
  track?: string;
  /** Total visible character count (track + blocks). */
  trackLength?: number;
  /** Milliseconds per animation step. Lower = faster. */
  speed?: number;
  /** Forwarded to root element — use Tailwind text-* to set color. */
  className?: string;
  style?: React.CSSProperties;
  /** Accessibility label, defaults to "Loading". */
  "aria-label"?: string;
}

export function ConveyorLoop({
  blocks = ["█", "▓", "▒"],
  track = "░",
  trackLength = 10,
  speed = 600,
  className = "",
  style,
  "aria-label": ariaLabel = "Loading",
}: ConveyorLoopProps) {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (reducedMotion) return; // freeze — static display only

    const tick = () => {
      setOffset((prev) => (prev + 1) % (trackLength + blocks.length));
      rafRef.current = setTimeout(tick, speed);
    };

    rafRef.current = setTimeout(tick, speed);
    return () => {
      if (rafRef.current != null) clearTimeout(rafRef.current);
    };
  }, [reducedMotion, trackLength, blocks.length, speed]);

  // Build the visible character array:
  //   The conveyor is a circular buffer of length (trackLength + blocks.length).
  //   We show a window of `trackLength` characters starting at `offset`.
  const totalCells = trackLength + blocks.length;
  const chars: Array<{ glyph: string; isBlock: boolean }> = [];

  for (let i = 0; i < trackLength; i++) {
    const pos = (i + offset) % totalCells;
    const blockIndex = pos < blocks.length ? pos : -1;
    if (blockIndex >= 0) {
      chars.push({ glyph: blocks[blockIndex], isBlock: true });
    } else {
      chars.push({ glyph: track, isBlock: false });
    }
  }

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className={`inline-flex items-center font-mono leading-none select-none ${className}`}
      style={style}
    >
      {/*
        Track characters: 35% opacity — differentiated from blocks using opacity
        only, NOT a different color. Both track and blocks use currentColor.
      */}
      {chars.map((cell, i) =>
        cell.isBlock ? (
          <span key={i} aria-hidden="true" style={{ opacity: 1 }}>
            {cell.glyph}
          </span>
        ) : (
          <span key={i} aria-hidden="true" style={{ opacity: 0.35 }}>
            {cell.glyph}
          </span>
        )
      )}
    </span>
  );
}

ConveyorLoop.displayName = "ConveyorLoop";
