/**
 * motionVariants.ts — Raashi shared Framer Motion variant library.
 *
 * ── EXISTING VARIANTS (unchanged) ──────────────────────────────────────────
 *   FadeUp, FadeDown, FadeIn, ScaleIn, FadeLeft, FadeRight
 *   StaggerContainer, StaggerFast
 *   transition.standard / .fast / .slow
 *   hoverScale, cardHover
 *
 * ── NEW: 3D ENTRANCE SYSTEM ─────────────────────────────────────────────────
 *
 *   PRINCIPLES (apple-design SKILL.md):
 *   • Critically damped — cubic-bezier(0.16, 1, 0.3, 1) — no overshoot.
 *   • Fast initial motion, smooth long settle.
 *   • GPU-friendly: only `transform` and `opacity` animated.
 *   • Interruptible: IntersectionObserver drives animate state; Framer Motion
 *     transitions from whatever value is live.
 *   • Reduced-motion: collapses to a plain opacity cross-fade — no 3D at all.
 *   • Mobile: shallower depth, faster timing.
 *
 *   EXPORTS:
 *   • EASE_PREMIUM    — shared easing curve
 *   • STAGGER_STEP    — base stagger delay (ms)
 *   • staggerDelay()  — computes per-card delay with grid-aware cap
 *   • card3DInitial() — initial transform state for MotionCard
 *   • card3DAnimate   — final (resting) transform state
 *   • panel3DInitial  — initial state for large panels / CTAs
 *   • panel3DAnimate  — final state for large panels
 *   • sectionInitial  — heading entrance initial state
 *   • sectionAnimate  — heading entrance final state
 *   • reducedInitial  — reduced-motion initial state
 *   • reducedAnimate  — reduced-motion final state
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING VARIANTS (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────

export const FadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const FadeDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
};

export const FadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const ScaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
};

export const FadeLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
};

export const FadeRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
};

export const StaggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export const StaggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const transition = {
  standard: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  fast: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  slow: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: 3D ENTRANCE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared critically-damped easing.
 * Maps to Apple's "quick response with long smooth deceleration."
 */
export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

/**
 * Base stagger step in seconds.
 * Per-card delay = staggerDelay(index, total) seconds.
 */
export const STAGGER_STEP_S = 0.05; // 50ms

/**
 * Computes the per-card entrance delay in seconds.
 * Caps the total sequence to keep large grids fast.
 *
 * @param index  — 0-based visual position
 * @param total  — total number of cards in this grid
 * @param mobile — true on narrow viewports
 */
export function staggerDelay(index: number, _total: number, mobile = false): number {
  const step = mobile ? 0.035 : STAGGER_STEP_S;
  // Cap the max delay so a 10-card grid doesn't take 500ms to finish starting
  const maxDelay = mobile ? 0.25 : 0.32;
  return Math.min(index * step, maxDelay);
}

// ── Card 3D ──────────────────────────────────────────────────────────────────

/**
 * Returns the initial (hidden) state for a card.
 * `index` controls the alternating rotateY for subtle positional variation.
 * `mobile` reduces the depth effect on narrow screens.
 */
export function card3DInitial(index: number, mobile = false): TargetAndTransition {
  // Deterministic alternation: odd cards tilt slightly left, even slightly right
  const rotY = (index % 2 === 0 ? 2 : -2);
  if (mobile) {
    return {
      opacity: 0,
      y: 12,
      z: -15,
      rotateX: 3,
      rotateY: 0, // no rotateY on mobile to avoid visible distortion
      scale: 0.98,
    };
  }
  return {
    opacity: 0,
    y: 20,
    z: -35,
    rotateX: 6,
    rotateY: rotY,
    scale: 0.97,
  };
}

/** Final resting state — identical to the card's natural rendered state. */
export const card3DAnimate: TargetAndTransition = {
  opacity: 1,
  y: 0,
  z: 0,
  rotateX: 0,
  rotateY: 0,
  scale: 1,
};

/** Transition used for card 3D entrance. */
export const card3DTransition = (delay: number): Transition => ({
  duration: 0.55,
  ease: EASE_PREMIUM,
  delay,
});

// ── Panel 3D (large CTA / stats / info panels) ───────────────────────────────

/** Initial state for large surface panels — shallower depth, no rotateY. */
export const panel3DInitial: TargetAndTransition = {
  opacity: 0,
  y: 16,
  z: -20,
  rotateX: 3,
  rotateY: 0,
  scale: 1, // panels don't scale
};

/** Final resting state for panels. */
export const panel3DAnimate: TargetAndTransition = {
  opacity: 1,
  y: 0,
  z: 0,
  rotateX: 0,
  rotateY: 0,
  scale: 1,
};

/** Panel transition — slightly slower to emphasise the larger surface area. */
export const panel3DTransition = (delay = 0): Transition => ({
  duration: 0.6,
  ease: EASE_PREMIUM,
  delay,
});

// ── Section Heading ───────────────────────────────────────────────────────────

/**
 * Very subtle heading entrance: opacity + small translateY only.
 * No 3D — heading sits at the top of the visual hierarchy.
 */
export const sectionHeadingInitial: TargetAndTransition = { opacity: 0, y: 8 };
export const sectionHeadingAnimate: TargetAndTransition = { opacity: 1, y: 0 };
export const sectionHeadingTransition: Transition = {
  duration: 0.35,
  ease: EASE_PREMIUM,
};

// ── Reduced Motion ────────────────────────────────────────────────────────────

/**
 * When prefers-reduced-motion is active, replace all 3D with a simple fade.
 * ~4px translateY is acceptable as a very gentle positional cue.
 */
export const reducedInitial: TargetAndTransition = { opacity: 0, y: 4 };
export const reducedAnimate: TargetAndTransition = { opacity: 1, y: 0 };
export const reducedTransition: Transition = {
  duration: 0.18,
  ease: "easeOut",
};
