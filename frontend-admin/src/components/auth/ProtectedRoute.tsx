import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "admin" | "coordinator";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-viewport flex items-center justify-center bg-brand-surface">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-blue border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-brand-navy/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role check — redirect to appropriate dashboard if wrong role
  if (role && user.role !== role) {
    // Admin can access coordinator routes but not vice versa
    if (role === "coordinator" && user.role === "admin") {
      // Admin is allowed on coordinator routes
      return <>{children}</>;
    }
    // Coordinator trying to access admin routes → redirect to coordinator dashboard
    if (user.role === "coordinator") {
      return <Navigate to="/coordinator/dashboard" replace />;
    }
    // Default redirect
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}
