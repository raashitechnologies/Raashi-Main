import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { LogIn, Eye, EyeOff, Shield, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/shared/Button";

// ─── Animation Primitives ─────────────────────────────────────────────────────

/**
 * Reusable spring presets kept in one place so they're consistent
 * and easy to tune. Shared with internship/career forms if needed.
 */
const spring = {
  /** Page-level entrance: smooth settle */
  enter: { type: "spring" as const, stiffness: 340, damping: 28, mass: 0.8 },
  /** Child stagger: fast, gentle */
  child: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.7 },
  /** Micro interaction: snappy */
  micro: { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.6 },
};

/** Shake sequence for validation feedback */
const shakeKeyframes: TargetAndTransition = {
  x: [0, -5, 5, -4, 4, -2, 2, 0],
  transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
};

/** Container variant: stagger children */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

/** Each staggered child */
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.child,
  },
};

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const isPasswordEntered = password.length > 0;
  const isPasswordValid = password.length >= 8 && password.length <= 128;
  const showPasswordRequirements = isPasswordEntered && !isPasswordValid;

  // ── Authentication (zero changes to existing logic) ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError("Please enter your email address.");
      setShakeEmail(true);
      hasError = true;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      setShakeEmail(true);
      hasError = true;
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      setShakePassword(true);
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      setShakePassword(true);
      hasError = true;
    } else if (password.length > 128) {
      setPasswordError("Password must be 128 characters or fewer.");
      setShakePassword(true);
      hasError = true;
    }

    if (hasError) {
      setTimeout(() => {
        setShakeEmail(false);
        setShakePassword(false);
      }, 500);
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/coordinator/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr.response?.data?.detail || "Login failed. Please check your credentials."
      );
      // Shake both fields on auth failure
      setShakeEmail(true);
      setShakePassword(true);
      setTimeout(() => { setShakeEmail(false); setShakePassword(false); }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Reduced-motion: all animation variants check prefersReducedMotion inline.
  // No extra variable needed.

  return (
    <div className="min-h-viewport bg-brand-navy flex items-center justify-center relative overflow-hidden px-4 py-12">

      {/* ── Background decoration (existing, untouched) ─────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #0560DF 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #D11753 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Page-level entrance (outer wrapper) ─────────────────────────── */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0.2 } : spring.enter}
        className="w-full max-w-md relative z-10"
      >
        {/* ── Card ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0.2 } : { ...spring.enter, delay: 0.06 }}
          className="bg-white rounded-2xl shadow-floating p-8 border border-brand-navy/5"
        >

          {/* ── Staggered content container ──────────────────────────── */}
          <motion.div
            variants={prefersReducedMotion ? {} : containerVariant}
            initial="hidden"
            animate="visible"
          >

            {/* Logo */}
            <motion.div
              variants={prefersReducedMotion ? {} : itemVariant}
              className="text-center mb-8"
            >
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0.2 } : { ...spring.enter, delay: 0.12 }}
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
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0.2 } : { ...spring.micro, delay: 0.2 }}
                >
                  <Shield size={16} className="text-brand-blue" />
                </motion.span>
                <h1 className="text-lg font-bold text-brand-navy">Staff Login</h1>
              </div>
              <p className="text-sm text-brand-navy/50">
                Sign in to access the management dashboard
              </p>
            </motion.div>

            {/* ── Error message ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="login-error"
                  initial={prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -6, height: 0 }}
                  animate={prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, height: "auto" }}
                  exit={prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -4, height: 0 }}
                  transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 overflow-hidden"
                >
                  <motion.span
                    initial={prefersReducedMotion ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12, duration: 0.2 }}
                    className="block"
                  >
                    {error}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ─────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Email field */}
              <motion.div variants={prefersReducedMotion ? {} : itemVariant}>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-brand-navy mb-1.5"
                >
                  Email
                </label>
                <motion.div
                  animate={shakeEmail && !prefersReducedMotion ? shakeKeyframes : { x: 0 }}
                >
                  <motion.div
                    animate={prefersReducedMotion ? {} : {
                      y: emailFocused ? -1 : 0,
                    }}
                    transition={spring.micro}
                  >
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="you@raashi.com"
                      required
                      autoFocus
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "login-email-error" : undefined}
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
                </motion.div>
              </motion.div>

              {/* Password field */}
              <motion.div variants={prefersReducedMotion ? {} : itemVariant}>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-brand-navy mb-1.5"
                >
                  Password
                </label>
                <motion.div
                  animate={shakePassword && !prefersReducedMotion ? shakeKeyframes : { x: 0 }}
                >
                  <motion.div
                    className="relative"
                    animate={prefersReducedMotion ? {} : {
                      y: passwordFocused ? -1 : 0,
                    }}
                    transition={spring.micro}
                  >
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      required
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby={
                        passwordError
                          ? "login-password-error"
                          : showPasswordRequirements
                          ? "login-password-requirements"
                          : undefined
                      }
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

                    {/* Password visibility toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/70 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 rounded"
                      tabIndex={-1}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {showPassword ? (
                          <motion.span
                            key="eye-off"
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            transition={spring.micro}
                            className="inline-flex"
                          >
                            <EyeOff size={16} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="eye"
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            transition={spring.micro}
                            className="inline-flex"
                          >
                            <Eye size={16} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                </motion.div>

                {passwordError && (
                  <p id="login-password-error" className="mt-1.5 text-xs text-red-500">
                    {passwordError}
                  </p>
                )}

                {/* Password requirements */}
                <AnimatePresence>
                  {showPasswordRequirements && (
                    <motion.div
                      id="login-password-requirements"
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2.5 space-y-1 overflow-hidden"
                    >
                      <div
                        className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
                          password.length >= 8 ? "text-green-600" : "text-brand-red"
                        }`}
                      >
                        <span className="w-3.5 flex items-center justify-center font-bold">
                          {password.length >= 8 ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : (
                            <X size={12} strokeWidth={2.5} />
                          )}
                        </span>
                        <span>At least 8 characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
                          password.length <= 128 ? "text-green-600" : "text-brand-red"
                        }`}
                      >
                        <span className="w-3.5 flex items-center justify-center font-bold">
                          {password.length <= 128 ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : (
                            <X size={12} strokeWidth={2.5} />
                          )}
                        </span>
                        <span>Maximum 128 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <span className="w-3.5 flex items-center justify-center font-bold">
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                        <span>Letters, numbers, and special characters allowed</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>

              {/* Submit button */}
              <motion.div
                variants={prefersReducedMotion ? {} : itemVariant}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  loadingText="Signing in..."
                  className="w-full shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={16} />
                    Sign In
                  </span>
                </Button>
              </motion.div>

              {/* Forgot password link */}
              <motion.div
                variants={prefersReducedMotion ? {} : itemVariant}
                className="text-center"
              >
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-navy/40 hover:text-brand-blue transition-colors duration-150"
                >
                  Forgot your password?
                </Link>
              </motion.div>

            </form>
          </motion.div>
        </motion.div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0.2 } : { ...spring.child, delay: 0.55 }}
          className="text-center text-xs text-white/30 mt-6"
        >
          &copy; {new Date().getFullYear()} Raashi Cognitive Technologies Pvt. Ltd.
        </motion.p>

      </motion.div>
    </div>
  );
}
