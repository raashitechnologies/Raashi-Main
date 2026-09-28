import { useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";

/**
 * BackToTop — Global floating scroll-to-top button.
 *
 * Behaviour:
 *  - Hidden until user scrolls past SHOW_THRESHOLD (450px).
 *  - Uses hysteresis: shows at 450px, hides below 400px to avoid flickering.
 *  - Smooth scroll, but instant when prefers-reduced-motion is active.
 *  - Positioned bottom-right with safe-area-aware bottom spacing.
 *  - Keyboard accessible (real <button>, Enter/Space work natively).
 *  - z-index 45: above normal content, below modals/overlays (z-50+).
 */

const SHOW_THRESHOLD = 450;
const HIDE_THRESHOLD = 400;

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Passive scroll listener with rAF throttle — no per-pixel re-renders
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setVisible((prev) => {
            if (!prev && y > SHOW_THRESHOLD) return true;
            if (prev && y < HIDE_THRESHOLD) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    // Sync on mount without waiting for first scroll event
    const y = window.scrollY;
    if (y > SHOW_THRESHOLD) setVisible(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }, [prefersReducedMotion]);

  return (
    <button
      id="back-to-top"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={[
        // Layout & sizing — minimum 44×44px touch target
        "fixed right-4 sm:right-6 z-[45]",
        "w-11 h-11 sm:w-12 sm:h-12",
        "rounded-full",
        // Visual
        "bg-brand-navy text-white",
        "border border-white/10",
        "shadow-floating",
        // Flex centre the icon
        "flex items-center justify-center",
        // Interaction
        "cursor-pointer",
        "hover:bg-brand-blue",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2",
        "transition-all duration-200",
        // Visibility — opacity + translate for smooth reveal/hide
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      ].join(" ")}
      // Safe-area-aware bottom positioning via inline style (Tailwind can't
      // interpolate env() values directly in class strings)
      style={{
        bottom: "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
      }}
    >
      <ChevronUp size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
