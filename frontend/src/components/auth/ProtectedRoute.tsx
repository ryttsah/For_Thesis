import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

interface ProtectedRouteProps {
  role: UserRole;
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pca-bg text-pca-muted">
        Loading…
      </div>
    );
  }

  // If there is no user session (neither API nor Demo), redirect to login.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    const home =
      user.role === "officer"
        ? "/officer"
        : user.role === "farmer"
          ? "/farmer"
          : "/admin";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
