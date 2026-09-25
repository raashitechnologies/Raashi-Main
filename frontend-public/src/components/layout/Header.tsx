import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// @ts-ignore
const MotionNavLink = motion(NavLink as any);
import {
  ChevronDown, Menu, X, Brain, Cpu,
  FlaskConical, Wifi, Wrench, GraduationCap, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useDomains } from "@/contexts/DomainsProvider";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  cta?: { label: string; href: string };
}

// ─── Data ────────────────────────────────────────────────────────────────────

const domainIcons: Record<string, React.ReactNode> = {
  "artificial-intelligence": <Brain size={15} />,
  "research-innovation": <FlaskConical size={15} />,
  "iot-smart-automation": <Wifi size={15} />,
  "engineering-design": <Wrench size={15} />,
  "education-training": <GraduationCap size={15} />,
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Domains", href: "/domains", hasDropdown: true },
  { label: "Internships", href: "/internships" },
  { label: "Careers", href: "/careers" },
];

// ─── Domains Dropdown ────────────────────────────────────────────────────────

function DomainsDropdown({ isDesktop, scrolled, springTransition }: { isDesktop: boolean, scrolled: boolean, springTransition: any }) {
  const { domains } = useDomains();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 80);
  };

  const isActive = location.pathname.startsWith("/domains");

  // Active text is white because nested backdrop-filters often fail in Chrome,
  // which makes dark navy text completely invisible over a dark translucent header.
  const textClass = isActive
    ? "text-white font-bold transition-colors duration-300 delay-[50ms]"
    : "text-white/90 hover:text-white transition-colors duration-300";

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        initial={false}
        animate={isDesktop ? {
          paddingLeft: scrolled ? 8 : 16,
          paddingRight: scrolled ? 8 : 16,
          fontSize: scrolled ? "13px" : "14px"
        } : {
          paddingLeft: 12, paddingRight: 12, fontSize: "14px"
        }}
        whileTap={{ scale: 0.97 }}
        transition={springTransition}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex items-center justify-center gap-1 py-2.5 min-h-[44px] font-medium rounded-full cursor-pointer hover:opacity-90 transition-colors duration-300 ${textClass}`}
      >
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 z-0 rounded-full liquid-glass-pill"
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 500, damping: 35, mass: 0.8 }
            }
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          Domains
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-floating border border-brand-navy/[0.08] py-2 z-[200]"
            role="menu"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="px-3 py-1.5 mb-1">
              <p className="text-[10px] font-semibold tracking-widest text-brand-navy/40 uppercase">
                Our Domains
              </p>
            </div>
            {domains.map((d) => (
              <Link
                key={d.slug}
                to={`/domains/${d.slug}`}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F0E6] transition-colors group"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${d.accentColor}15`, color: d.accentColor }}
                >
                  {domainIcons[d.slug] || <Cpu size={14} />}
                </div>
                <p className="text-sm font-medium text-brand-navy group-hover:text-brand-blue transition-colors leading-tight">
                  {d.shortName}
                </p>
              </Link>
            ))}
            <div className="border-t border-brand-navy/[0.06] mt-2 pt-2 px-3">
              <Link
                to="/domains"
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-royal transition-colors py-1"
              >
                View All Domains <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UserMenu removed ────────────────────────────────────────────────────────

// ─── Main Header ─────────────────────────────────────────────────────────────

export function Header({
  cta = { label: "Get In Touch", href: "/contact" },
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Initialize synchronously from window to avoid a mount flash where the
  // header briefly renders in the wrong layout before the effect fires.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" ? window.innerWidth >= 1280 : true
  );
  const location = useLocation();
  const { domains } = useDomains();
  const prefersReducedMotion = useReducedMotion();

  // ── Hysteresis scroll detection (thresholds unchanged) ───────────────────
  useEffect(() => {
    const ENTER_THRESHOLD = 70;
    const EXIT_THRESHOLD = 30;

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setScrolled((prev) => {
            if (!prev && y > ENTER_THRESHOLD) return true;
            if (prev && y < EXIT_THRESHOLD) return false;
            return prev;
          });
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    setScrolled(window.scrollY > ENTER_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });

    let resizeTimer: number;
    const checkDesktop = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setIsDesktop(window.innerWidth >= 1280);
      }, 100);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkDesktop);
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    
    if (drawerOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    
    return () => { 
      document.body.style.overflow = ""; 
      window.removeEventListener("keydown", handleEscape);
    };
  }, [drawerOpen]);

  // ── Spring config ─────────────────────────────────────────────────────────
  // Higher stiffness + damping = snappier, lag-free feel.
  // restDelta/restSpeed ensure animation completes cleanly without lingering.
  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
      type: "spring" as const,
      stiffness: 380,
      damping: 36,
      mass: 0.6,
      restDelta: 0.001,
      restSpeed: 0.001,
    };

  // ── State & derived values ────────────────────────────────────────────────
  //
  // Two states only:
  //   "top"      → floating dark-glass header on ALL pages at top
  //   "scrolled" → existing compact navy pill (unchanged)
  //
  // The glass is always dark navy, so content (text, icons) is always white.
  //
  const currentState = scrolled ? "scrolled" : "top";

  // Header background is always dark (glass OR pill), so always use
  // white/light content treatment natively in the components.

  // ── Framer Motion variants ────────────────────────────────────────────────

  // motion.header visual properties
  const headerVariants = {
    top: isDesktop ? {
      width: "min(1220px, calc(100% - 32px))",
      height: "56px",
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "7px",
      borderRadius: "9999px",
      backgroundColor: "",
      boxShadow: "",
      backdropFilter: "",
    } : {
      width: "100%",
      height: "72px",
      marginLeft: "0px",
      marginRight: "0px",
      marginTop: "0px",
      borderRadius: "0px",
      backgroundColor: "rgba(23, 40, 94, 1)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0), 0 0 0 1px rgba(255, 255, 255, 0), inset 0 1px 0 rgba(255, 255, 255, 0)",
      backdropFilter: "blur(0px) saturate(100%) brightness(1)",
    },
    scrolled: isDesktop ? {
      width: "min(1220px, calc(100% - 32px))",
      height: "46px",
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "7px",
      borderRadius: "9999px",
      backgroundColor: "",
      boxShadow: "",
      backdropFilter: "",
    } : {
      width: "100%",
      height: "60px",
      marginLeft: "0px",
      marginRight: "0px",
      marginTop: "0px",
      borderRadius: "0px",
      backgroundColor: "rgba(23, 40, 94, 0.70)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(12px) saturate(140%) brightness(0.95)",
    },
  };

  // Logo height
  const logoVariants = {
    top: isDesktop ? { height: "42px", scale: 1 } : { height: "56px", scale: 1 },
    scrolled: isDesktop ? { height: "32px", scale: 0.9 } : { height: "40px", scale: 0.95 },
  };

  return (
    <>
      {/*
        ── Fixed outer wrapper ──────────────────────────────────────────────
        motion.div animates the paddingLeft/Right/Top to create the ~10 px
        floating inset on ALL pages. The body's beige background shows through
        the 10 px gap, giving the "floating within the page" visual.
        When scrolled, padding returns to 0 and the pill centres via margin:auto.
      */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <motion.header
          initial={false}
          variants={headerVariants}
          animate={currentState}
          transition={springTransition}
          style={{
            willChange: "border-radius, box-shadow, background-color, width, height, backdrop-filter",
            WebkitBackdropFilter:
              isDesktop 
                ? "blur(24px) saturate(160%) brightness(0.95)"
                : currentState === "scrolled"
                  ? "blur(12px) saturate(140%) brightness(0.95)"
                  : "blur(0px) saturate(100%) brightness(1)",
          }}
          className={`overflow-visible pointer-events-auto flex flex-col justify-center ${isDesktop ? 'reference-glass-header' : 'w-full'}`}
        >
          <motion.div
            initial={false}
            animate={isDesktop ? {
              paddingLeft: scrolled ? 16 : 28,
              paddingRight: scrolled ? 16 : 28,
            } : {
              paddingLeft: 24, paddingRight: 24
            }}
            transition={springTransition}
            className={`w-full h-full mx-auto ${isDesktop ? 'header-inner-grid' : 'flex items-center justify-between'}`}
          >
            {/* ── Logo ── */}
            <div className={isDesktop ? "brand-slot" : ""}>
              <Link
              to="/"
              className="flex items-center gap-3 shrink-0"
              aria-label="Raashi — Home"
            >
              <motion.img
                src="/logo.png"
                alt="Raashi"
                initial={false}
                variants={logoVariants}
                animate={currentState}
                transition={springTransition}
                style={{ width: "auto", objectFit: "contain", transformOrigin: "left center" }}
              />
              <motion.span
                className="block font-semibold leading-tight"
                initial={false}
                animate={{ fontSize: isDesktop ? (scrolled ? "18px" : "22px") : "22px" }}
                transition={springTransition}
                style={{ fontFamily: "'Montserrat', sans-serif", color: "#F97316", whiteSpace: "nowrap" }}
              >
                Raashi
              </motion.span>
            </Link>
            </div>

            {/* ── Desktop navigation ── */}
            <div className={isDesktop ? "navigation-slot" : ""}>
              <motion.nav
              initial={false}
              animate={{ gap: isDesktop ? (scrolled ? 6 : 12) : 0 }}
              transition={springTransition}
              className="hidden xl:flex items-center whitespace-nowrap"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return <DomainsDropdown key="domains" isDesktop={isDesktop} scrolled={scrolled} springTransition={springTransition} />;
                }

                const isActive =
                  link.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.href);

                const textClass = isActive
                  ? "text-white font-bold transition-colors duration-300 delay-[50ms]"
                  : "text-white/90 transition-colors duration-300";

                return (
                  <MotionNavLink
                    key={link.label}
                    to={link.href}
                    aria-current={isActive ? "page" : undefined}
                    initial={false}
                    animate={isDesktop ? {
                      paddingLeft: scrolled ? 8 : 16,
                      paddingRight: scrolled ? 8 : 16,
                      fontSize: scrolled ? "13px" : "14px"
                    } : {
                      paddingLeft: 12, paddingRight: 12, fontSize: "14px"
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={springTransition}
                    className={`relative flex items-center justify-center py-2.5 min-h-[44px] font-medium rounded-full hover:bg-white/[0.08] hover:text-white hover:opacity-90 transition-colors duration-300 ${textClass}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute inset-0 z-0 rounded-full liquid-glass-pill"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 500, damping: 35, mass: 0.8 }
                        }
                        style={{ isolation: "isolate" }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </MotionNavLink>
                );
              })}
              </motion.nav>
            </div>

            {/* ── Desktop CTA + Auth ── */}
            <div className={isDesktop ? "cta-slot hidden xl:flex" : "hidden xl:flex items-center shrink-0"}>
              <motion.div
                initial={false}
                animate={{ height: scrolled ? 38 : 42 }}
                transition={springTransition}
                className="flex items-center justify-center w-full"
              >
                <Button
                  asChild
                  variant="primary-glass"
                  size="md"
                  className={`header-cta-button h-full hover:!scale-100 ${scrolled ? "!rounded-full text-[13px]" : ""}`}
                >
                  <Link to={cta.href} className="w-full flex items-center justify-center gap-1.5">
                    {cta.label}
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Auth slot removed */}

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              className="xl:hidden p-2 rounded-full transition-colors text-white hover:bg-white/10"
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </motion.div>
        </motion.header>
      </div>

      {/*
        Spacer: 0px wrapper paddingTop + 72px inner height = 72px visual
        header bottom. Use h-[72px] so page content starts just below the header.
        Added bg-brand-navy so the header floats over a blue background at the top.
      */}
      <div className="h-[72px] w-full bg-brand-navy absolute top-0 left-0 right-0 -z-10" aria-hidden="true" />
      <div className="h-[72px]" aria-hidden="true" />

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[60] xl:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-[70] xl:hidden flex flex-col shadow-floating"
              aria-label="Mobile navigation"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-brand-navy/[0.08]">
                <img src="/logo.png" alt="Raashi" className="h-8 w-auto object-contain" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 rounded-lg hover:bg-[#F5F0E6] text-brand-navy/60"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                        ? "bg-brand-blue/[0.08] text-brand-blue font-semibold"
                        : "text-brand-navy/75 hover:bg-[#F5F0E6] hover:text-brand-navy"
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Domain sub-links */}
                <div className="mt-2 pl-4 space-y-0.5 border-l-2 border-brand-blue/20">
                  {domains.map((d) => (
                    <Link
                      key={d.slug}
                      to={`/domains/${d.slug}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-brand-navy/60 hover:text-brand-navy hover:bg-[#F5F0E6] transition-colors"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.accentColor }}
                      />
                      {d.shortName}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Auth section removed */}
              {/* CTA */}
              <div className="p-4 border-t border-brand-navy/[0.08]">
                <Button asChild variant="primary" size="md" className="w-full">
                  <Link to={cta.href} className="gap-2 justify-center">
                    {cta.label}
                    <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
