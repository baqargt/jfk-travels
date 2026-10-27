import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/constants/permissions";
import { PATHS } from "@/routes/paths";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  }

  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to={PATHS.dashboard} replace />;
  }

  return <>{children}</>;
}
