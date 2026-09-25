/**
 * HoverExpandDomainRow.tsx
 *
 * Container for the hover-expand domain tile interaction. Owns the
 * `activeIndex` state — only one tile is expanded at any time.
 *
 * Design decisions:
 * - First tile (index 0) is expanded by default on mount.
 * - activeIndex is NOT reset on mouse-leave of the row — the last-hovered
 *   tile stays expanded, matching the "hover to preview, first tile open
 *   by default" pattern (like a hover-controlled tab/accordion).
 * - On desktop (md+): flex-row with equal flex-1 widths — tiles never change
 *   width when expanding/collapsing. Only internal content animates.
 * - On mobile (<md): flex-col; tiles stack. Each tile remains individually
 *   tap-to-expand via the onClick handler on HoverExpandDomainTile. Because
 *   hover doesn't exist on touch, onClick provides the expand trigger, so
 *   the feature is never dead weight on mobile.
 *
 * Loading state: renders pulse skeletons matching the tile's fixed height
 * so the section doesn't jump when domains load.
 */

import { useState } from "react";
import type { Domain } from "@/data/domains";
import { HoverExpandDomainTile } from "./HoverExpandDomainTile";
import { ErrorState, EmptyState } from "@shared/ui/FeedbackStates";

interface HoverExpandDomainRowProps {
  domains: Domain[];
  /** When true, renders loading skeletons instead of tiles. */
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function HoverExpandDomainRow({
  domains,
  isLoading = false,
  error = null,
  onRetry
}: HoverExpandDomainRowProps) {
  // First tile is expanded on initial render — no hover needed.
  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 min-h-[140px] md:min-h-[380px] rounded-2xl animate-pulse border border-[#E98A3A]/15"
            style={{ background: "#F1F1EE" }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={onRetry} 
        variant="public"
      />
    );
  }

  if (!domains.length) {
    return (
      <EmptyState 
        title="No domains available" 
        message="Please check back later." 
        variant="public" 
      />
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-4 items-stretch"
      role="region"
      aria-label="Domain tiles — hover or tap to explore"
    >
      {domains.map((domain, i) => (
        // flex-1 + min-w-0 ensures perfectly equal widths on all breakpoints.
        // Width is NEVER changed when a tile expands — only internal content animates.
        <div key={domain.slug} className="flex-1 min-w-0">
          <HoverExpandDomainTile
            domain={domain}
            index={i}
            isActive={activeIndex === i}
            onHoverStart={() => setActiveIndex(i)}
          />
        </div>
      ))}
    </div>
  );
}
