import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";

/**
 * PAGE TRANSITION (V5) — Jitter-Free
 *
 * KEY FIXES OVER V4:
 *
 * 1. WEB ANIMATIONS API (WAAPI)
 *    element.animate() runs on the compositor thread.
 *    No per-frame JS math. No Newton-Raphson. No main-thread contention.
 *
 * 2. ZERO-POLL READY DETECTION
 *    RouteTree calls notifyReady() in useEffect (fires after paint).
 *    notifyReady schedules the wipe after exactly 2 rAFs. No loops.
 *
 * 3. ALL TRANSITION STATE IS STORED IN REFS DURING ANIMATION
 *    No setState calls during the active wipe → no React re-renders
 *    competing with the animation frames.
 *
 * 4. notifyReady IS STABLE VIA REF FORWARDING
 *    The wipe logic reads DOM refs directly so there are no stale
 *    closure issues regardless of when notifyReady fires.
 */

// ─── Public API ────────────────────────────────────────────────────────────

export interface PageTransitionAPI {
  committedLocation: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────

const WIPE_DURATION_MS = 460;
const WIPE_EASING = "cubic-bezier(0.76, 0, 0.24, 1)";
export const BAND_COLOR = "#F5F0E6";

// ─── Geometry ──────────────────────────────────────────────────────────────

/**
 * Outgoing page clip-path. 15vw diagonal slant.
 * p=0 → fully visible, p=1 → fully hidden (swept off left)
 */
function clip(p: number): string {
  const topX = 120 - p * 145;
  const botX = topX - 15;
  return `polygon(0% 0%, ${topX}% 0%, ${botX}% 100%, 0% 100%)`;
}

/**
 * Wipe band clip-path. 22vw wide, 2vw overlap on both edges.
 */
function band(p: number): string {
  const topX = 120 - p * 145;
  const botX = topX - 15;
  return `polygon(${topX - 2}% 0%, ${topX + 22}% 0%, ${botX + 22}% 100%, ${botX - 2}% 100%)`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

type Loc = PageTransitionAPI["committedLocation"];

export function usePageTransition(initialLocation: Loc) {
  const prefersReducedMotion = useReducedMotion();

  // React state — only drives which route trees are MOUNTED
  const [committedLocation, setCommittedLocation] = useState<Loc>(initialLocation);
  const [outgoingLocation, setOutgoingLocation] = useState<Loc | null>(null);
  const [outgoingScrollY, setOutgoingScrollY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // DOM animation targets
  const outgoingLayerRef = useRef<HTMLDivElement>(null);
  const wipeBandRef = useRef<HTMLDivElement>(null);

  // Imperative control — no setState during animation
  const wipingRef = useRef(false);
  const pendingRef = useRef<Loc | null>(null);
  const raf1 = useRef(0);
  const raf2 = useRef(0);

  // Keep these in refs so notifyReady never has stale closures
  const committedLocationRef = useRef<Loc>(initialLocation);
  committedLocationRef.current = committedLocation;

  const navigate = useCallback((newLocation: Loc) => {
    if (prefersReducedMotion) {
      setCommittedLocation(newLocation);
      return;
    }
    if (wipingRef.current) {
      pendingRef.current = newLocation;
      return;
    }

    const scrollY = window.scrollY;

    // Batch all state into a single synchronous update block so React
    // commits them together in one render pass.
    setOutgoingLocation(committedLocationRef.current);
    setOutgoingScrollY(scrollY);
    setIsTransitioning(true);
    setCommittedLocation(newLocation);
  }, [prefersReducedMotion]);

  // Called by the new RouteTree after it has been painted at least once.
  // Uses only refs — never closes over stale state.
  const notifyReady = useCallback(() => {
    // Scroll to top of new page now (hidden under outgoing overlay)
    window.scrollTo({ top: 0, behavior: "instant" });

    // Cancel any in-progress double-rAF from a previous notifyReady call
    cancelAnimationFrame(raf1.current);
    cancelAnimationFrame(raf2.current);

    // Two rAFs: first ensures the DOM is painted, second ensures compositing
    raf1.current = requestAnimationFrame(() => {
      raf2.current = requestAnimationFrame(() => {
        const outEl = outgoingLayerRef.current;
        const bandEl = wipeBandRef.current;

        if (!outEl || !bandEl) {
          // DOM not ready (e.g. reduced motion unmounted them) — instant swap
          setOutgoingLocation(null);
          setIsTransitioning(false);
          return;
        }

        wipingRef.current = true;

        // Promote to GPU layers before animation starts
        outEl.style.willChange = "clip-path";
        bandEl.style.willChange = "clip-path";

        const timing: KeyframeAnimationOptions = {
          duration: WIPE_DURATION_MS,
          easing: WIPE_EASING,
          fill: "forwards",
        };

        const animOut = outEl.animate(
          [{ clipPath: clip(0) }, { clipPath: clip(1) }],
          timing
        );
        const animBand = bandEl.animate(
          [{ clipPath: band(0) }, { clipPath: band(1) }],
          timing
        );

        const cleanup = () => {
          if (outEl) outEl.style.willChange = "auto";
          if (bandEl) bandEl.style.willChange = "auto";
        };

        animOut.onfinish = () => {
          cleanup();
          wipingRef.current = false;

          // React state changes happen AFTER animation is fully done
          setOutgoingLocation(null);
          setIsTransitioning(false);

          // Drain any queued navigation
          if (pendingRef.current) {
            const next = pendingRef.current;
            pendingRef.current = null;
            // Two rAFs so the outgoing unmount is committed before next nav starts
            requestAnimationFrame(() =>
              requestAnimationFrame(() => navigate(next))
            );
          }
        };

        animOut.oncancel = cleanup;
        // Keep band animation in sync — it has no onfinish we need to handle
        void animBand; // suppress unused warning
      });
    });
  }, [navigate]); // navigate is stable (empty deps in its useCallback)

  return {
    committedLocation,
    outgoingLocation,
    outgoingScrollY,
    outgoingLayerRef,
    wipeBandRef,
    isTransitioning,
    notifyReady,
    navigate,
  };
}

// ─── Overlay ────────────────────────────────────────────────────────────────

interface TransitionOverlayProps {
  outgoingLayerRef: React.RefObject<HTMLDivElement | null>;
  wipeBandRef: React.RefObject<HTMLDivElement | null>;
  outgoingScrollY: number;
  isTransitioning: boolean;
  outgoingContent: ReactNode;
}

export function TransitionOverlay({
  outgoingLayerRef,
  wipeBandRef,
  outgoingScrollY,
  isTransitioning,
  outgoingContent,
}: TransitionOverlayProps) {
  if (!isTransitioning) return null;

  return (
    <>
      {/* [B] Outgoing page — held at scroll position, clipped by WAAPI */}
      {outgoingContent && (
        <div
          ref={outgoingLayerRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            overflow: "hidden",
            clipPath: clip(0), // WAAPI overrides this; seed avoids a flash
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "100%",
              // translateZ(0) promotes inner content to its own GPU layer,
              // preventing composite flicker when clip-path is animated on parent
              transform: `translateY(-${outgoingScrollY}px) translateZ(0)`,
            }}
          >
            {outgoingContent}
          </div>
        </div>
      )}

      {/* [C] Wipe band — diagonal separator, clipped by WAAPI */}
      <div
        ref={wipeBandRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: BAND_COLOR,
          clipPath: band(0), // WAAPI overrides this; seed avoids a flash
          pointerEvents: "none",
        }}
      />

      {/* [D] Click blocker — prevents interaction during wipe */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "auto",
          cursor: "default",
        }}
      />
    </>
  );
}