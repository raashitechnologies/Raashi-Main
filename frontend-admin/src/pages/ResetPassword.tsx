import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type TargetAndTransition,
} from "framer-motion";
import {
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { authApi } from "@/lib/api";

// ─── Animation Primitives (matches Login page) ───────────────────────────────

const spring = {
  enter: { type: "spring" as const, stiffness: 340, damping: 28, mass: 0.8 },
  child: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.7 },
  micro: { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.6 },
};

const shakeKeyframes: TargetAndTransition = {
  x: [0, -5, 5, -4, 4, -2, 2, 0],
  transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
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

// ─── Password complexity rules ────────────────────────────────────────────────

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Maximum 128 characters", test: (p: string) => p.length <= 128 },
  { label: "Letters, numbers, and special characters allowed", test: () => true },
];

// ─── Reset Password Page ─────────────────────────────────────────────────────

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shakeFields, setShakeFields] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  // If no token is present, show an error immediately
  const [noToken] = useState(!token);

  useEffect(() => {
    if (noToken) {
      setError(
        "No reset token found. Please request a new password reset link."
      );
    }
  }, [noToken]);

  const allRulesPass = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allRulesPass) {
      setError("Password does not meet complexity requirements.");
      setShakeFields(true);
      setTimeout(() => setShakeFields(false), 500);
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      setShakeFields(true);
      setTimeout(() => setShakeFields(false), 500);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr.response?.data?.detail ||
          "Failed to reset password. The link may have expired."
      );
      setShakeFields(true);
      setTimeout(() => setShakeFields(false), 500);
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

      {/* ── Page entrance ─────────────────────────────────────────────── */}
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
                  <KeyRound size={16} className="text-brand-blue" />
                </motion.span>
                <h1 className="text-lg font-bold text-brand-navy">
                  Reset Password
                </h1>
              </div>
              <p className="text-sm text-brand-navy/50">
                Choose a new, strong password for your account
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {success ? (
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
                    Password reset successful
                  </h2>
                  <p className="text-sm text-brand-navy/50 mb-6 leading-relaxed">
                    Your password has been updated. You can now sign in with your
                    new password.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Go to login
                  </Link>
                </motion.div>
              ) : noToken ? (
                /* ── No token state ────────────────────────────────────── */
                <motion.div
                  key="no-token"
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
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mb-4"
                  >
                    <AlertTriangle size={28} className="text-amber-500" />
                  </motion.div>
                  <h2 className="text-base font-semibold text-brand-navy mb-2">
                    Invalid reset link
                  </h2>
                  <p className="text-sm text-brand-navy/50 mb-6 leading-relaxed">
                    This password reset link is missing or invalid. Please
                    request a new one.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
                  >
                    Request new reset link
                  </Link>
                </motion.div>
              ) : (
                /* ── Form state ────────────────────────────────────────── */
                <motion.div 
                  key="form"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Error */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key="reset-error"
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
                    {/* New password */}
                    <motion.div
                      variants={prefersReducedMotion ? {} : itemVariant}
                    >
                      <label
                        htmlFor="reset-password"
                        className="block text-sm font-medium text-brand-navy mb-1.5"
                      >
                        New password
                      </label>
                      <motion.div
                        animate={
                          shakeFields && !prefersReducedMotion
                            ? shakeKeyframes
                            : { x: 0 }
                        }
                      >
                        <motion.div
                          className="relative"
                          animate={
                            prefersReducedMotion
                              ? {}
                              : { y: passwordFocused ? -1 : 0 }
                          }
                          transition={spring.micro}
                        >
                          <input
                            id="reset-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            placeholder="••••••••"
                            required
                            autoFocus
                            className="w-full px-4 py-2.5 rounded-xl border text-sm text-brand-navy placeholder:text-brand-navy/30 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200 pr-10"
                            style={{
                              borderColor: passwordFocused
                                ? "#0560DF"
                                : "rgba(23, 40, 94, 0.15)",
                              boxShadow: passwordFocused
                                ? "0 0 0 3px rgba(5, 96, 223, 0.10)"
                                : "none",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/70 transition-colors duration-150"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </motion.div>
                      </motion.div>

                      {/* Password strength indicators */}
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2.5 space-y-1"
                        >
                          {passwordRules.map((rule) => {
                            const pass = rule.test(password);
                            return (
                              <div
                                key={rule.label}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${
                                  pass
                                    ? "text-green-600"
                                    : "text-brand-navy/35"
                                }`}
                              >
                                <div
                                  className={`w-1 h-1 rounded-full transition-colors ${
                                    pass ? "bg-green-500" : "bg-brand-navy/20"
                                  }`}
                                />
                                {rule.label}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Confirm password */}
                    <motion.div
                      variants={prefersReducedMotion ? {} : itemVariant}
                    >
                      <label
                        htmlFor="reset-confirm"
                        className="block text-sm font-medium text-brand-navy mb-1.5"
                      >
                        Confirm password
                      </label>
                      <motion.div
                        animate={
                          shakeFields && !prefersReducedMotion
                            ? shakeKeyframes
                            : { x: 0 }
                        }
                      >
                        <motion.div
                          className="relative"
                          animate={
                            prefersReducedMotion
                              ? {}
                              : { y: confirmFocused ? -1 : 0 }
                          }
                          transition={spring.micro}
                        >
                          <input
                            id="reset-confirm"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setConfirmFocused(true)}
                            onBlur={() => setConfirmFocused(false)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border text-sm text-brand-navy placeholder:text-brand-navy/30 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200 pr-10"
                            style={{
                              borderColor: confirmFocused
                                ? "#0560DF"
                                : confirmPassword && !passwordsMatch
                                  ? "#ef4444"
                                  : "rgba(23, 40, 94, 0.15)",
                              boxShadow: confirmFocused
                                ? "0 0 0 3px rgba(5, 96, 223, 0.10)"
                                : "none",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={
                              showConfirm ? "Hide password" : "Show password"
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/70 transition-colors duration-150"
                            tabIndex={-1}
                          >
                            {showConfirm ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </motion.div>
                      </motion.div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="mt-1.5 text-xs text-red-500">
                          Passwords do not match
                        </p>
                      )}
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      variants={prefersReducedMotion ? {} : itemVariant}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={loading}
                        loadingText="Resetting..."
                        disabled={!allRulesPass || !passwordsMatch}
                        className="w-full shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <KeyRound size={16} />
                          Reset Password
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
