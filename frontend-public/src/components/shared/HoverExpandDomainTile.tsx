/**
 * HoverExpandDomainTile.tsx
 *
 * A single tile in the hover-expand domain row. Controlled entirely by parent
 * state — no local hover state. Parent passes `isActive` and `onHoverStart`.
 *
 * Interaction model:
 * - Default: first tile expanded (isActive = true), others collapsed.
 * - Collapsed: shows icon badge pill + title/tagline shifted down.
 * - Expanded: badge + title/tagline shift up, checklist fades in below,
 *   "Learn more" button slides up into view at the bottom.
 * - Width NEVER changes — flex-1 wrapper in parent ensures equal widths.
 *
 * Touch fallback: onMouseEnter fires on pointer devices, onClick fires on
 * all devices including touch, so tap-to-expand works on mobile.
 *
 * Reduced-motion: useReducedMotion() collapses all transform animations to
 * an instant opacity cross-fade, consistent with MotionCard.tsx behavior.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import type { Domain } from "@/data/domains";
import { domainIcons } from "@/data/domainIcons";
import { EASE_PREMIUM } from "@/lib/motionVariants";

interface HoverExpandDomainTileProps {
  domain: Domain;
  index: number;
  isActive: boolean;
  onHoverStart: () => void;
}

/** Duration constants — expand is slower for a satisfying reveal. */
const EXPAND_DURATION = 0.4;


export function HoverExpandDomainTile({
  domain,
  isActive,
  onHoverStart,
}: HoverExpandDomainTileProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Derive 2-item checklist from existing data — no new data model fields needed.
  const checklistItems = (domain.whatWeOffer ?? []).slice(0, 2).map((o) => o.title);

  /** Easing as a writable array (Framer Motion generic constraint). */
  const ease = [...EASE_PREMIUM] as [number, number, number, number];

  /** Shared transition builder — respects reduced-motion by setting duration to 0. */
  const makeTransition = (duration: number) => ({
    duration: prefersReducedMotion ? 0 : duration,
    ease,
  });

  return (
    <motion.div
      // Parent owns which tile is active — no local hover state.
      // onClick also fires onHoverStart for touch devices (tap-to-expand fallback).
      onMouseEnter={onHoverStart}
      onClick={onHoverStart}
      animate={isActive ? "expanded" : "collapsed"}
      style={{
        // Tile background and border mimic warm-tile tokens without touching the
        // global .warm-tile class (that class must remain unmodified per its comment).
        background: "#F1F1EE",
        color: "#174A7E",
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        // Fixed height on desktop ensures zero layout reflow. On mobile, allow natural height.
        minHeight: isMobile ? "auto" : "380px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        userSelect: "none",
      }}
      variants={{
        collapsed: {
          borderColor: "rgba(233,138,58,0.22)",
          boxShadow: "0 4px 20px -2px rgba(233,138,58,0.07)",
        },
        expanded: {
          borderColor: "rgba(233,138,58,0.45)",
          boxShadow: "0 8px 32px -4px rgba(233,138,58,0.14)",
        },
      }}
      transition={makeTransition(EXPAND_DURATION)}
      // Renders a visible 1px border via outline to avoid layout shift from border-width changes.
      className="outline outline-1"
    >
      {/* ── Top glow — radial blob using domain accentColor, visible only when expanded ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 0%, ${domain.accentColor}${isMobile ? '15' : '20'} 0%, transparent 70%)`,
          filter: isMobile ? "none" : "blur(32px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        variants={{
          collapsed: { opacity: 0 },
          expanded: { opacity: 1 },
        }}
        transition={makeTransition(EXPAND_DURATION)}
      />

      {/* ── Icon badge pill ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          alignSelf: "flex-start",
          backgroundColor: `${domain.accentColor}14`,
          color: domain.accentColor,
          borderRadius: 999,
          padding: "6px 12px 6px 8px",
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {domainIcons[domain.slug] || (
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: domain.accentColor,
                display: "inline-block",
              }}
            />
          )}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {domain.shortName}
        </span>
      </div>

      {/* ── Heading + tagline block — slides up toward badge when expanded ── */}
      <motion.div
        style={{ position: "relative", zIndex: 1, flex: "1 1 auto" }}
        variants={{
          collapsed: { y: prefersReducedMotion ? 0 : 72, opacity: 0.85 },
          expanded: { y: 0, opacity: 1 },
        }}
        transition={makeTransition(EXPAND_DURATION)}
      >
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#17285E",
            lineHeight: 1.3,
            marginBottom: 8,
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          {domain.shortName}
        </h3>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(23,40,94,0.65)",
            margin: 0,
          }}
        >
          {domain.tagline}
        </p>

        {/* ── Checklist — AnimatePresence mounts/unmounts cleanly ── */}
        <AnimatePresence mode="wait">
          {isActive && (
            <motion.ul
              key="checklist"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              transition={makeTransition(EXPAND_DURATION)}
              style={{
                listStyle: "none",
                margin: "16px 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
              aria-label={`${domain.shortName} highlights`}
            >
              {checklistItems.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 13,
                    color: "rgba(23,40,94,0.75)",
                    fontWeight: 500,
                  }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.5}
                    style={{ color: domain.accentColor, flexShrink: 0, marginTop: 1 }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── "Learn more" button — AnimatePresence slide-up ── */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key="learn-more-btn"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            transition={makeTransition(EXPAND_DURATION)}
            style={{ position: "relative", zIndex: 1, marginTop: 20, flexShrink: 0 }}
          >
            <Link
              to={`/domains/${domain.slug}`}
              className="bg-[#0560DF] hover:bg-[#0E2F9D] text-white transition-colors duration-200"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
              }}
              aria-label={`Learn more about ${domain.shortName}`}
            >
              Learn More
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
