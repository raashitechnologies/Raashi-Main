import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { authApi } from "@/lib/api";

// ─── Animation Primitives (matches Login page) ───────────────────────────────

const spring = {
  enter: { type: "spring" as const, stiffness: 340, damping: 28, mass: 0.8 },
  child: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.7 },
  micro: { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.6 },
};

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: spring.child },
};

// ─── Forgot Password Page ─────────────────────────────────────────────────────

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setEmailError("Please enter your email address.");
      return;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(trimmedEmail);
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr.response?.data?.detail ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-viewport bg-brand-navy flex items-center justify-center relative overflow-hidden px-4">
      {/* ── Background decoration ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #0560DF 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #D11753 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Page-level entrance ───────────────────────────────────────── */}
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 24, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0.2 } : spring.enter}
        className="w-full max-w-md relative z-10"
      >
        {/* ── Back link ───────────────────────────────────────────────── */}
        <motion.div
          initial={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }
          }
          animate={{ opacity: 1, x: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.2 }
              : { ...spring.child, delay: 0.08 }
          }
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors duration-150 mb-8 group"
          >
            <motion.span
              className="inline-flex"
              whileHover={prefersReducedMotion ? {} : { x: -2 }}
              transition={spring.micro}
            >
              <ArrowLeft size={14} />
            </motion.span>
            Back to login
          </Link>
        </motion.div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.97, y: 16 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.2 }
              : { ...spring.enter, delay: 0.06 }
          }
          className="bg-white rounded-2xl shadow-floating p-8 border border-brand-navy/5"
        >
          <motion.div
            variants={prefersReducedMotion ? {} : containerVariant}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div
              variants={prefersReducedMotion ? {} : itemVariant}
              className="text-center mb-8"
            >
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.88, y: -6 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.2 }
                    : { ...spring.enter, delay: 0.12 }
                }
              >
                <Link to="/" className="inline-block mb-4">
                  <img
                    src="/logo.png"
                    alt="Raashi Cognitive Technologies"
                    className="h-16 w-auto object-contain mx-auto"
                  />
                </Link>
              </motion.div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.7 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.2 }
                      : { ...spring.micro, delay: 0.2 }
                  }
                >
                  <Mail size={16} className="text-brand-blue" />
                </motion.span>
                <h1 className="text-lg font-bold text-brand-navy">
                  Forgot Password
                </h1>
              </div>
              <p className="text-sm text-brand-navy/50">
                Enter your email and we'll send you a reset link
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {submitted ? (
                /* ── Success state ─────────────────────────────────────── */
                <motion.div
                  key="success"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring.child}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.5 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring.micro}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4"
                  >
                    <CheckCircle size={28} className="text-green-500" />
                  </motion.div>
                  <h2 className="text-base font-semibold text-brand-navy mb-2">
                    Check your inbox
                  </h2>
                  <p className="text-sm text-brand-navy/50 mb-6 leading-relaxed">
                    If an account exists for{" "}
                    <span className="font-medium text-brand-navy/70">
                      {email}
                    </span>
                    , we've sent a password reset link. The link expires in 15
                    minutes.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Return to login
                  </Link>
                </motion.div>
              ) : (
                /* ── Form state ────────────────────────────────────────── */
                <motion.div key="form">
                  {/* Error message */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key="forgot-error"
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -6, height: 0 }
                        }
                        animate={
                          prefersReducedMotion
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0, height: "auto" }
                        }
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -4, height: 0 }
                        }
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.15 }
                            : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
                        }
                        className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 overflow-hidden"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                  >
                    <motion.div
                      variants={prefersReducedMotion ? {} : itemVariant}
                    >
                      <label
                        htmlFor="forgot-email"
                        className="block text-sm font-medium text-brand-navy mb-1.5"
                      >
                        Email address
                      </label>
                      <motion.div
                        animate={
                          prefersReducedMotion
                            ? {}
                            : { y: emailFocused ? -1 : 0 }
                        }
                        transition={spring.micro}
                      >
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) {
                              setEmailError("");
                            }
                          }}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          placeholder="you@raashi.com"
                          required
                          autoFocus
                          aria-invalid={Boolean(emailError)}
                          aria-describedby={emailError ? "forgot-email-error" : undefined}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm text-brand-navy placeholder:text-brand-navy/30 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200"
                          style={{
                            borderColor: emailFocused
                              ? "#0560DF"
                              : "rgba(23, 40, 94, 0.15)",
                            boxShadow: emailFocused
                              ? "0 0 0 3px rgba(5, 96, 223, 0.10)"
                              : "none",
                          }}
                        />
                      </motion.div>
                      {emailError && (
                        <p id="forgot-email-error" className="mt-1.5 text-xs text-red-500">
                          {emailError}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      variants={prefersReducedMotion ? {} : itemVariant}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={loading}
                        loadingText="Sending..."
                        className="w-full shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Mail size={16} />
                          Send Reset Link
                        </span>
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <motion.p
          initial={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.2 }
              : { ...spring.child, delay: 0.55 }
          }
          className="text-center text-xs text-white/30 mt-6"
        >
          &copy; {new Date().getFullYear()} Raashi Cognitive Technologies Pvt. Ltd.
        </motion.p>
      </motion.div>
    </div>
  );
}
