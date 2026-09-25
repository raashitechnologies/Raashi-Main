import { useState, useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { StaggerContainer } from "@/lib/motionVariants";

interface Step {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}

interface StepProcessProps {
  steps: Step[];
  className?: string;
}

export function StepProcess({ steps, className = "" }: StepProcessProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const inView = useInView(containerRef, { margin: "0px" });
  const prefersReducedMotion = useReducedMotion();

  // Auto-progression logic
  useEffect(() => {
    // Disable auto-progression if user prefers reduced motion, it's hovered, or not in view
    if (prefersReducedMotion || isHovered || !inView) return;

    let interval: ReturnType<typeof setInterval>;
    
    const startInterval = () => {
      clearInterval(interval);
      interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 1500);
    };

    if (document.visibilityState === "visible") {
      startInterval();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearInterval(interval);
      } else {
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [inView, isHovered, prefersReducedMotion, steps.length]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
    >
      {/* ── Desktop Horizontal Timeline Line ── */}
      <div 
        className="hidden sm:block absolute top-[28px] lg:top-[32px] h-[2px] bg-brand-navy/[0.06] z-0"
        style={{
          left: `calc(50% / ${steps.length})`,
          right: `calc(50% / ${steps.length})`,
        }}
      >
        <motion.div
          className="h-full bg-brand-blue"
          initial={{ width: 0 }}
          animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
          style={{
            boxShadow: "0 0 10px rgba(5,96,223,0.4)"
          }}
        />
      </div>

      {/* ── Mobile Vertical Timeline Line ── */}
      <div 
        className="sm:hidden absolute left-[31px] w-[2px] bg-brand-navy/[0.06] z-0"
        style={{
          // Icon is 64px, so center is 32px from top/bottom if we assume it's items-start or consistent height
          top: `32px`,
          bottom: `32px`,
        }}
      >
        <motion.div
          className="w-full bg-brand-blue"
          initial={{ height: 0 }}
          animate={{ height: `${(activeStep / (steps.length - 1)) * 100}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
          style={{
            boxShadow: "0 0 10px rgba(5,96,223,0.4)"
          }}
        />
      </div>

      {/* ── Steps Container ── */}
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-60px" }}
        variants={StaggerContainer}
        className="flex flex-col sm:flex-row items-stretch sm:items-start gap-6 sm:gap-0 relative z-10"
      >
        {steps.map((step, i) => {
          const isActive = activeStep === i;
          
          return (
            <div key={i} className="flex-1 flex sm:flex-col items-start sm:items-center justify-start sm:justify-start gap-4 sm:gap-0">
              
              {/* Step Button / Icon */}
              <motion.button
                onClick={() => setActiveStep(i)}
                onMouseEnter={() => {
                  setActiveStep(i);
                  setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
                aria-current={isActive ? "step" : undefined}
                className="relative flex items-center justify-center shrink-0 w-16 h-16 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4 focus-visible:ring-offset-background group"
                animate={{
                  scale: isActive ? 1.08 : 1,
                  borderColor: isActive ? "#0560DF" : "transparent",
                  boxShadow: isActive
                    ? "0 0 0 6px rgba(5,96,223,0.06), 0 8px 24px rgba(5,96,223,0.12)"
                    : "0 4px 12px rgba(23,40,94,0.03)",
                }}
                style={{ borderWidth: "2px" }}
                whileHover={!isActive && !prefersReducedMotion ? { scale: 1.03 } : undefined}
                transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 28, mass: 0.7 }}
              >
                <motion.div
                  className="flex items-center justify-center"
                  animate={{
                    color: isActive ? "#0560DF" : "rgba(23,40,94,0.4)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {step.icon}
                </motion.div>
              </motion.button>

              {/* Step Content */}
              <div className="flex flex-col items-start sm:items-center sm:mt-5 max-w-full sm:max-w-[120px]">
                <span className="text-[10px] font-bold tracking-widest uppercase mb-1 sm:mb-1.5 transition-colors duration-300"
                      style={{ color: isActive ? "#0560DF" : "rgba(23,40,94,0.4)" }}>
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                
                <motion.p 
                  className="text-sm font-semibold text-left sm:text-center leading-tight transition-colors duration-300"
                  style={{ color: isActive ? "#17285E" : "rgba(23,40,94,0.6)" }}
                >
                  {step.label}
                </motion.p>

                {step.sublabel && (
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-brand-navy/60 text-left sm:text-center leading-relaxed"
                      >
                        {step.sublabel}
                      </motion.p>
                    )}
                  </AnimatePresence>
                )}
              </div>

            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
