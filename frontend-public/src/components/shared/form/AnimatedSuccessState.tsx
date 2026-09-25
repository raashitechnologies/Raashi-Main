import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

interface AnimatedSuccessStateProps {
  title: string;
  message: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      duration: 0.8, 
      ease: "easeOut" as const,
      opacity: { duration: 0.2 }
    }
  }
};

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 200, 
      damping: 20,
      duration: 0.5 
    }
  }
};

export function AnimatedSuccessState({
  title,
  message,
  actionLabel = "Return",
  onAction,
  actionHref
}: AnimatedSuccessStateProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  const buttonContent = actionHref ? (
    <Link
      to={actionHref}
      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm inline-block"
    >
      {actionLabel}
    </Link>
  ) : (
    <button
      onClick={onAction}
      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-royal transition-colors shadow-sm inline-block"
    >
      {actionLabel}
    </button>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center py-10"
    >
      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-center mb-6"
      >
        <div className="relative flex items-center justify-center w-16 h-16">
          <motion.div 
            variants={prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : circleVariants}
            className="absolute inset-0 rounded-full bg-brand-blue/10"
          />
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-brand-blue relative z-10"
          >
            <motion.path 
              d="M20 6L9 17l-5-5"
              variants={prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : checkmarkVariants}
            />
          </svg>
        </div>
      </motion.div>

      <motion.h3 variants={itemVariants} className="text-xl font-bold text-brand-navy mb-3">
        {title}
      </motion.h3>
      
      <motion.div variants={itemVariants} className="text-brand-navy/60 text-sm mb-8 leading-relaxed max-w-md mx-auto">
        {message}
      </motion.div>

      <motion.div variants={itemVariants}>
        {buttonContent}
      </motion.div>
    </motion.div>
  );
}
