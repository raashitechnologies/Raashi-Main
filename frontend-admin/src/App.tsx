import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  UNSAFE_LocationContext as LocationContext,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  usePageTransition,
  TransitionOverlay,
} from "@/components/layout/PageTransition";
import { AppErrorBoundary } from "@shared/ui/AppErrorBoundary";

// ── Public pages removed for admin frontend ──
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

// ── Admin pages ──────────────────────────────────────────────────────────────
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const WebsiteContent = lazy(() => import("@/pages/admin/WebsiteContent"));
const ContentEditor = lazy(() => import("@/pages/admin/ContentEditor"));
const DomainsList = lazy(() => import("@/pages/admin/DomainsList"));
const DomainEditor = lazy(() => import("@/pages/admin/DomainEditor"));
const InternshipApplications = lazy(() => import("@/pages/admin/InternshipApplications"));
const AdminApplicationDetail = lazy(() => import("@/pages/admin/ApplicationDetail"));
const JobsList = lazy(() => import("@/pages/admin/JobsList"));
const CareerApplications = lazy(() => import("@/pages/admin/CareerApplications"));
const AdminContacts = lazy(() => import("@/pages/admin/Contacts"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const AdminPolicies = lazy(() => import("@/pages/admin/Policies"));
const PolicyEditorPage = lazy(() => import("@/pages/admin/PolicyEditor"));
const PolicyHistoryPage = lazy(() => import("@/pages/admin/PolicyHistory"));
const PolicyPreviewPage = lazy(() => import("@/pages/admin/PolicyPreview"));

// ── Coordinator pages ────────────────────────────────────────────────────────
const CoordinatorLayout = lazy(() => import("@/components/layout/CoordinatorLayout"));
const CoordDashboard = lazy(() => import("@/pages/coordinator/Dashboard"));
const CoordApplicationsList = lazy(() => import("@/pages/coordinator/ApplicationsList"));
const CoordApplicationDetail = lazy(() => import("@/pages/coordinator/ApplicationDetail"));
const CoordContacts = lazy(() => import("@/pages/coordinator/Contacts"));
const CoordReports = lazy(() => import("@/pages/coordinator/Reports"));

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
    <AppErrorBoundary variant="admin">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Public routes removed ── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Admin protected routes ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="content" element={<WebsiteContent />} />
            <Route path="content/:sectionKey" element={<ContentEditor />} />
            <Route path="domains" element={<DomainsList />} />
            <Route path="domains/:id/edit" element={<DomainEditor />} />
            <Route path="internship-applications" element={<InternshipApplications />} />
            <Route path="internship-applications/:id" element={<AdminApplicationDetail type="internship" />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="career-applications" element={<CareerApplications />} />
            <Route path="career-applications/:id" element={<AdminApplicationDetail type="career" />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="policies/new" element={<PolicyEditorPage />} />
            <Route path="policies/edit/:id" element={<PolicyEditorPage />} />
            <Route path="policies/preview/:id" element={<PolicyPreviewPage />} />
            <Route path="policies/history" element={<PolicyHistoryPage />} />
          </Route>

          {/* ── Coordinator protected routes ── */}
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute role="coordinator">
                <CoordinatorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CoordDashboard />} />
            <Route path="dashboard" element={<CoordDashboard />} />
            <Route path="internship-applications" element={<CoordApplicationsList type="internship" />} />
            <Route path="internship-applications/:id" element={<CoordApplicationDetail type="internship" />} />
            <Route path="career-applications" element={<CoordApplicationsList type="career" />} />
            <Route path="career-applications/:id" element={<CoordApplicationDetail type="career" />} />
            <Route path="contacts" element={<CoordContacts />} />
            <Route path="reports" element={<CoordReports />} />
          </Route>

          {/* Catch-all → Not Found (Admin-specific 404 behavior or redirect) */}
          <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Not Found</h1><p className="mt-4">This page does not exist on the admin portal.</p></div>} />
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
