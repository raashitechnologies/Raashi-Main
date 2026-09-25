import { motion, useReducedMotion } from "framer-motion";

interface AnimatedFormContainerProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  noValidate?: boolean;
}

export function AnimatedFormContainer({
  children,
  className = "",
  onSubmit,
  noValidate = false,
}: AnimatedFormContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 24,
      scale: prefersReducedMotion ? 1 : 0.985,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.65,
        ease: [0.16, 1, 0.3, 1] as const,
        staggerChildren: prefersReducedMotion ? 0 : 0.06,
      },
    },
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate={noValidate}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={containerVariants}
    >
      {children}
    </motion.form>
  );
}

// Ensure the blur filter falls back correctly if reduced motion is on
export const getFormFieldVariants = (prefersReducedMotion: boolean | null) => ({
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 12,
    filter: prefersReducedMotion ? "blur(0px)" : "blur(3px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: prefersReducedMotion ? 0.3 : 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
});
