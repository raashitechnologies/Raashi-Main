import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";

export interface ApplicationSuccessModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
  applicationType?: "internship" | "career";
}

/** Cubic-bezier ease used across the project */
const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function ApplicationSuccessModal({
  open,
  title,
  message,
  onClose,
}: ApplicationSuccessModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const continueBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => continueBtnRef.current?.focus(), 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="app-success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
            className="fixed inset-0 z-[70]"
            style={{
              background: "rgba(23, 40, 94, 0.48)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
            aria-hidden="true"
            // Intentionally NOT dismissing on backdrop click — success is
            // an important confirmation the user should acknowledge.
          />

          {/* ── Card wrapper ── */}
          <div
            key="app-success-wrapper"
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              key="app-success-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-success-title"
              aria-describedby="application-success-message"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.92, y: 12 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1, transition: { duration: 0.18 } }
                  : {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { duration: 0.4, ease: EASE_OUT },
                    }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0, transition: { duration: 0.15 } }
                  : {
                      opacity: 0,
                      scale: 0.96,
                      y: 8,
                      transition: { duration: 0.22, ease: "easeIn" },
                    }
              }
              className="pointer-events-auto flex flex-col items-center text-center"
              style={{
                width: "min(90vw, 340px)",
                padding: "32px 28px",
                borderRadius: "24px",
                background: "rgba(255, 255, 255, 0.93)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
                border: "1px solid rgba(255, 255, 255, 0.78)",
                boxShadow:
                  "0 24px 70px rgba(23, 40, 94, 0.20), 0 8px 25px rgba(23, 40, 94, 0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Icon ── */}
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { scale: 0.75, opacity: 0 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, transition: { duration: 0.2 } }
                    : {
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 220,
                          damping: 20,
                          mass: 0.7,
                        },
                      }
                }
                className="relative flex items-center justify-center mb-6"
                style={{ width: 88, height: 88 }}
              >
                {/* Outer ring */}
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ border: "2px solid rgba(5, 96, 223, 0.22)" }}
                />
                {/* Inner accent fill */}
                <span
                  className="absolute rounded-full"
                  style={{
                    inset: 10,
                    background: "rgba(5, 96, 223, 0.07)",
                    border: "1.5px solid rgba(5, 96, 223, 0.13)",
                  }}
                />
                {/* Send icon */}
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.7, y: 8 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1, transition: { duration: 0.2, delay: 0.05 } }
                      : {
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          transition: {
                            duration: 0.35,
                            ease: EASE_OUT,
                            delay: 0.08,
                          },
                        }
                  }
                  className="relative z-10 flex items-center justify-center"
                >
                  <Send size={38} strokeWidth={1.6} style={{ color: "#0560DF" }} />
                </motion.span>
              </motion.div>

              {/* ── Title ── */}
              <motion.h2
                id="application-success-title"
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, transition: { duration: 0.2 } }
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.35, ease: EASE_OUT, delay: 0.08 },
                      }
                }
                className="font-bold text-brand-navy text-center mb-3"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
              >
                {title}
              </motion.h2>

              {/* ── Message ── */}
              <motion.p
                id="application-success-message"
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, transition: { duration: 0.2 } }
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.35, ease: EASE_OUT, delay: 0.14 },
                      }
                }
                className="text-sm leading-relaxed text-center mx-auto mb-7"
                style={{
                  color: "rgba(23, 40, 94, 0.62)",
                  maxWidth: 280,
                  lineHeight: 1.65,
                }}
              >
                {message}
              </motion.p>

              {/* ── Continue button ── */}
              <motion.div
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, transition: { duration: 0.2 } }
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.35, ease: EASE_OUT, delay: 0.20 },
                      }
                }
                className="w-full"
              >
                <button
                  ref={continueBtnRef}
                  id="application-success-continue"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                  style={{
                    background: "#0560DF",
                    boxShadow: "0 2px 10px rgba(5, 96, 223, 0.28)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#0E2F9D";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#0560DF";
                  }}
                >
                  Continue
                </button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
