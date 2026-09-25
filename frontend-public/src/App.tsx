import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  UNSAFE_LocationContext as LocationContext,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useRef } from "react";
// ProtectedRoute removed
import {
  usePageTransition,
  TransitionOverlay,
} from "@/components/layout/PageTransition";
import { AppErrorBoundary } from "@shared/ui/AppErrorBoundary";

// ── Public pages ─────────────────────────────────────────────────────────────
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Domains = lazy(() => import("@/pages/Domains"));
const DomainDetail = lazy(() => import("@/pages/DomainDetail"));
const Internships = lazy(() => import("@/pages/Internships"));
const Careers = lazy(() => import("@/pages/Careers"));
const Contact = lazy(() => import("@/pages/Contact"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Apply = lazy(() => import("@/pages/Apply"));
const NotFound = lazy(() => import("@/pages/NotFound"));
// ── Admin and Coordinator pages removed for public frontend ──

// ─── Route tree ──────────────────────────────────────────────────────────────
// Shared route tree rendered for BOTH committed and outgoing locations.
// The location is injected via LocationContext — not useLocation() — so each
// tree is independent.

function RouteTree({ notifyReady }: { notifyReady?: () => void }) {
  // Use the function reference as a key — a new function means a new navigation.
  // Reset the guard whenever notifyReady changes so each trip fires exactly once.
  const prevNotifyRef = useRef<typeof notifyReady>(undefined);
  const notifiedRef = useRef(false);

  if (prevNotifyRef.current !== notifyReady) {
    prevNotifyRef.current = notifyReady;
    notifiedRef.current = false; // reset for this navigation
  }

  useEffect(() => {
    if (notifyReady && !notifiedRef.current) {
      notifiedRef.current = true;
      notifyReady();
    }
  });

  return (
    <AppErrorBoundary variant="public">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/domains/:slug" element={<DomainDetail />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/apply" element={<Apply />} />
          {/* Catch-all → 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

// ── Minimal fallback — only shown on very first chunk load (cold visit). ─────
function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin opacity-40" />
    </div>
  );
}

// ─── buildContextValue ────────────────────────────────────────────────────────
// Matches the shape expected by UNSAFE_LocationContext
function buildCtx(location: any): any {
  return { location, navigationType: "POP", basename: "/", matches: [], static: false };
}

// ─── AppRoutes (inside BrowserRouter so hooks work) ───────────────────────────
function AppRoutes() {
  const browserLocation = useLocation();

  const {
    committedLocation,
    outgoingLocation,
    outgoingScrollY,
    outgoingLayerRef,
    wipeBandRef,
    isTransitioning,
    notifyReady,
    navigate,
  } = usePageTransition(browserLocation as any);

  // Intercept browser location changes and pipe them through our transition
  useEffect(() => {
    const liveKey = browserLocation.pathname + browserLocation.search;
    const committedKey = committedLocation.pathname + committedLocation.search;
    if (liveKey !== committedKey) {
      navigate(browserLocation as any);
    }
  }, [browserLocation.pathname, browserLocation.search]);

  return (
    <>
      {/* ── [A] NEW PAGE — committed location, normal flow ────────────────── */}
      <LocationContext.Provider value={buildCtx(committedLocation)}>
        <RouteTree notifyReady={isTransitioning ? notifyReady : undefined} />
      </LocationContext.Provider>

      {/* ── [B] + [C] + [D] — transition overlays ─────────────────────────── */}
      <TransitionOverlay
        outgoingLayerRef={outgoingLayerRef}
        wipeBandRef={wipeBandRef}
        outgoingScrollY={outgoingScrollY}
        isTransitioning={isTransitioning}
        outgoingContent={
          outgoingLocation ? (
            <LocationContext.Provider value={buildCtx(outgoingLocation)}>
              <RouteTree />
            </LocationContext.Provider>
          ) : null
        }
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
