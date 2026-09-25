/**
 * MotionCard.tsx — Premium 3D entrance wrapper for Raashi cards and tiles.
 *
 * ── DESIGN PRINCIPLES (apple-design SKILL.md) ────────────────────────────────
 *
 *  ✓ Critically damped — easing(0.16, 1, 0.3, 1). No overshoot, no bounce.
 *  ✓ GPU-only — animates `transform` (y, z, rotateX, rotateY, scale) + opacity.
 *  ✓ Viewport-driven — IntersectionObserver via useInView({ once: true }).
 *    Content below the fold animates only when it becomes visible.
 *  ✓ Interruptible — Framer Motion starts from the live on-screen value.
 *  ✓ Accessibility — collapses to a simple opacity fade when
 *    prefers-reduced-motion is set.
 *  ✓ Restraint — the 3D effect is subtle. The card does NOT flip, spin, or
 *    bounce. The user feels depth, not animation.
 *  ✓ No artificial delays — the animation begins as soon as the element is
 *    visible. Stagger is applied through the `index` prop delay, not a global
 *    timer.
 *  ✓ Hover isolation — entrance transform is owned by this wrapper (outer).
 *    Hover effects on the child card use a separate inner motion.div, so
 *    there is no transform conflict.
 *
 * ── USAGE ────────────────────────────────────────────────────────────────────
 *
 *   <MotionCard index={i} total={cards.length}>
 *     <ExistingCard ... />
 *   </MotionCard>
 *
 *   or for a large panel:
 *
 *   <MotionCard index={0} variant="panel">
 *     <PanelContent ... />
 *   </MotionCard>
 *
 * ── PROPS ────────────────────────────────────────────────────────────────────
 *
 *   index     — 0-based visual position within the grid (drives stagger + rotateY)
 *   total     — total number of items in this grid (used for stagger cap)
 *   variant   — "card" (default) | "panel" (shallower depth, no rotateY)
 *   className — forwarded to the outer motion.div
 *   style     — forwarded to the outer motion.div
 */

import type { ReactNode, CSSProperties } from "react";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";
import {
  card3DInitial,
  card3DAnimate,
  card3DTransition,
  panel3DInitial,
  panel3DAnimate,
  panel3DTransition,
  reducedInitial,
  reducedAnimate,
  reducedTransition,
  staggerDelay,
} from "@/lib/motionVariants";

interface MotionCardProps {
  children: ReactNode;
  index?: number;
  total?: number;
  variant?: "card" | "panel";
  className?: string;
  style?: CSSProperties;
}

export function MotionCard({
  children,
  index = 0,
  total = 1,
  variant = "card",
  className,
  style,
}: MotionCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Detect mobile via matchMedia so it stays accurate if the window resizes.
  // This is evaluated at render time — stable for the lifetime of the component.
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  // Viewport entry — fires once, no replay on scroll-back
  const isInView = useInView(ref, {
    once: true,
    margin: "-60px 0px",
  });

  // ── Resolve initial / animate / transition ──────────────────────────────
  let initial: TargetAndTransition;
  let animate: TargetAndTransition;
  let animateTransition: ReturnType<typeof card3DTransition>;

  if (prefersReduced) {
    initial = reducedInitial;
    animate = reducedAnimate;
    animateTransition = reducedTransition as ReturnType<typeof card3DTransition>;
  } else if (variant === "panel") {
    initial = panel3DInitial;
    animate = panel3DAnimate;
    animateTransition = panel3DTransition(staggerDelay(index, total, isMobile));
  } else {
    initial = card3DInitial(index, isMobile);
    animate = card3DAnimate;
    animateTransition = card3DTransition(staggerDelay(index, total, isMobile));
  }

  // ── Perspective container ───────────────────────────────────────────────
  // perspective is set on the *parent* of the transformed element.
  // We wrap with a div that provides the perspective context, then the
  // motion.div owns the 3D transforms. transform-style: preserve-3d is NOT
  // propagated to children to avoid unintended stacking context issues.
  return (
    <div
      ref={ref}
      style={{
        perspective: prefersReduced || variant === "panel" ? "none" : "1200px",
        ...style,
      }}
      className={className}
    >
      <motion.div
        initial={initial}
        animate={isInView ? animate : initial}
        transition={animateTransition}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
