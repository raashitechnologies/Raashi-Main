/**
 * DomainCard.tsx
 *
 * The card's ENTRANCE animation is now owned by the parent <MotionCard>
 * wrapper in the page that renders it. This avoids transform conflicts
 * and lets hover work independently on the inner card.
 *
 * What changed:
 *   - Removed `variants={FadeUp}` — parent MotionCard drives the entrance.
 *   - Kept `{...cardHover}` (whileHover: { y: -4 }) on the outer motion.div
 *     so hover still works exactly as before.
 *   - All card markup, styling, borders, shadows, and icons are untouched.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import type { Domain } from "@/data/domains";
import { domainIcons } from "@/data/domainIcons";

interface DomainCardProps {
  domain: Domain;
  index: number;
  variant?: "grid" | "numbered";
}

// domainIcons is now imported from @/data/domainIcons — single source of truth.

export function DomainCard({ domain, index, variant = "grid" }: DomainCardProps) {
  const num = String(index + 1).padStart(2, "0");

  return (
    // Outer motion.div owns hover — entrance is owned by parent <MotionCard>
    <motion.div
      initial="initial"
      whileHover="hover"
      variants={{
        initial: { y: 0 },
        hover: { y: -4, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
      }}
      className="warm-tile rounded-2xl overflow-hidden flex flex-col h-full p-0"
    >
      <Link to={`/domains/${domain.slug}`} className="p-6 flex flex-col flex-1 group">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${domain.accentColor}14`, color: domain.accentColor }}
          >
            {domainIcons[domain.slug] || (
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: domain.accentColor }} />
            )}
          </div>
          {variant === "numbered" && (
            <span className="text-3xl font-bold opacity-[0.08] font-mono leading-none" style={{ color: '#174A7E' }}>
              {num}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2 leading-snug" style={{ color: '#174A7E' }}>
          {domain.shortName}
        </h3>
        <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'rgba(23,74,126,0.65)' }}>
          {domain.tagline}
        </p>

        <motion.div
          variants={{
            initial: { opacity: 0, y: 15, rotateX: 60, transformPerspective: 500 },
            hover: { opacity: 1, y: 0, rotateX: 0, transformPerspective: 500, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="mt-auto origin-bottom"
        >
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: domain.accentColor }}
          >
            Learn More
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function DomainCardSmall({ domain, index }: { domain: Domain; index: number }) {
  const num = String(index + 1).padStart(2, "0");

  return (
    // Hover owned here; entrance owned by parent <MotionCard>
    <motion.div
      initial="initial"
      whileHover="hover"
      variants={{
        initial: { y: 0 },
        hover: { y: -4, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
      }}
      className="warm-tile overflow-hidden p-0"
    >
      <Link to={`/domains/${domain.slug}`} className="block p-5 group">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-bold opacity-[0.08] font-mono" style={{ color: '#174A7E' }}>{num}</span>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${domain.accentColor}14`, color: domain.accentColor }}
          >
            {domainIcons[domain.slug]}
          </div>
        </div>
        <h4 className="font-semibold text-sm mb-1" style={{ color: '#174A7E' }}>{domain.shortName}</h4>
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(23,74,126,0.6)' }}>
          {domain.tagline}
        </p>
        <motion.div
          variants={{
            initial: { opacity: 0, y: 15, rotateX: 60, transformPerspective: 500 },
            hover: { opacity: 1, y: 0, rotateX: 0, transformPerspective: 500, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="origin-bottom mt-2"
        >
          <span
            className="text-xs font-semibold inline-flex items-center gap-1"
            style={{ color: domain.accentColor }}
          >
            View Details
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}
