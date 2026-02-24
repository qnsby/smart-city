import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "../types";
import { useAuth } from "./AuthProvider";
import { hasRequiredRole } from "../utils/roles";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRequiredRole(user.role, roles)) {
    return <Navigate to="/map" replace />;
  }

  return <Outlet />;
}
