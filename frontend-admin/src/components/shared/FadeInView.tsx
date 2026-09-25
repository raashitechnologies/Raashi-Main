/**
 * FadeInView.tsx — Viewport-aware entrance wrapper.
 *
 * Existing API is fully preserved. A new `variant` prop adds panel3d support.
 *
 * variant="default" (or omitted):
 *   Existing direction-based fade-up/down/left/right/fade behaviour.
 *
 * variant="panel3d":
 *   Large panel entrance (shallower 3D — translateZ -20px, rotateX 3deg).
 *   Use for CTA sections, stat bars, information panels.
 *   Falls back to a simple fade when prefers-reduced-motion is set.
 */

import React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { FadeUp, StaggerContainer, transition } from "@/lib/motionVariants";
import {
  panel3DInitial,
  panel3DAnimate,
  panel3DTransition,
} from "@/lib/motionVariants";

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  stagger?: boolean;
  /** "default" uses the classic direction-based fade. "panel3d" uses a subtle 3D panel entrance. */
  variant?: "default" | "panel3d";
}

export function FadeInView({
  children,
  className = "",
  delay = 0,
  direction = "up",
  stagger = false,
  variant = "default",
}: FadeInViewProps) {
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // ── panel3d variant ─────────────────────────────────────────────────────
  if (variant === "panel3d") {
    const panelInitial = prefersReduced
      ? { opacity: 0 }
      : panel3DInitial;
    const panelAnimate = prefersReduced
      ? { opacity: 1 }
      : panel3DAnimate;
    const panelTransition = prefersReduced
      ? { duration: 0.18, ease: "easeOut" as const }
      : panel3DTransition(delay);

    return (
      <div
        ref={ref}
        style={{
          perspective: prefersReduced ? "none" : "1200px",
        }}
        className={className}
      >
        <motion.div
          initial={panelInitial}
          animate={isInView ? panelAnimate : panelInitial}
          transition={panelTransition}
          style={{ width: "100%", height: "100%" }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // ── default (existing behaviour, fully preserved) ───────────────────────

  const directionVariants = {
    up: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
    down: { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -32 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 32 }, animate: { opacity: 1, x: 0 } },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  };

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        variants={StaggerContainer}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  const { initial, animate } = directionVariants[direction];

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{ ...transition.standard, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={FadeUp} transition={transition.standard} className={className}>
      {children}
    </motion.div>
  );
}
