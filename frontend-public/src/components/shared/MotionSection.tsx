/**
 * MotionSection.tsx — Subtle entrance wrapper for section headings.
 *
 * Hierarchy (apple-design SKILL.md §16 Craft / §8 Hint):
 *
 *   Page transition      ← strongest motion
 *   Section heading      ← moderate (this component)
 *   Cards / tiles        ← subtle 3D
 *   Text / icons         ← very subtle (card-internal)
 *
 * The heading entrance is intentionally plainer than the cards:
 *   - opacity: 0 → 1
 *   - translateY: 8px → 0
 *   - duration: 350ms
 *   - NO 3D rotation, NO scale, NO blur
 *
 * When prefers-reduced-motion is set, only the opacity animates.
 *
 * Usage:
 *
 *   <MotionSection className="text-center mb-14">
 *     <SectionEyebrow>What We Do</SectionEyebrow>
 *     <h2>Our Core Domains</h2>
 *     <p>Description...</p>
 *   </MotionSection>
 */

import type { ReactNode, CSSProperties } from "react";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";
import {
  sectionHeadingInitial,
  sectionHeadingAnimate,
  sectionHeadingTransition,
} from "@/lib/motionVariants";

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MotionSection({ children, className, style }: MotionSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const isInView = useInView(ref, {
    once: true,
    margin: "-40px 0px",
  });

  const initial: TargetAndTransition = prefersReduced
    ? { opacity: 0 }
    : sectionHeadingInitial;

  const animate: TargetAndTransition = prefersReduced
    ? { opacity: 1 }
    : sectionHeadingAnimate;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={sectionHeadingTransition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
