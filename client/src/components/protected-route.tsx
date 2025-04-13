import { type ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "USER" | "ADMIN";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page with return URL
      navigate(
        `/auth/login?returnUrl=${encodeURIComponent(location.pathname)}`,
        { replace: true }
      );
    }

    // Check for required role if specified
    if (
      !isLoading &&
      isAuthenticated &&
      requiredRole &&
      user?.role !== requiredRole
    ) {
      navigate("/", { replace: true });
    }
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    location.pathname,
    requiredRole,
    user?.role,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-semibold">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your credentials
          </p>
        </div>
      </div>
    );
  }

  // If authenticated and role check passes (or no role required), render children
  if (isAuthenticated && (!requiredRole || user?.role === requiredRole)) {
    return <>{children}</>;
  }

  // This should not be visible due to the redirect in useEffect
  return null;
};

export default ProtectedRoute;
