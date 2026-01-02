/**
 * ProtectedRoute component for role-based access control.
 *
 * Wraps a route and ensures the user is authenticated before rendering.
 * Redirects to the login page if the user is not authenticated.
 *
 * Matches the backend's get_current_user pattern from app/api/dependencies/auth.py:
 * - Required authentication: User must be logged in to access the route
 * - Redirects unauthenticated users to login page
 *
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */

import { Navigate } from "react-router-dom";
import { useAuthStatus } from "../../store/auth";

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  /** Children to render if authenticated */
  children: React.ReactNode;
  /** Path to redirect to if not authenticated (defaults to /login) */
  redirectTo?: string;
}

/**
 * ProtectedRoute component.
 *
 * Checks if the user is authenticated before rendering children.
 * Redirects to the login page if the user is not authenticated.
 *
 * Matches backend pattern:
 * - get_current_user raises 401 if not authenticated
 * - This component redirects to login instead of showing an error
 *
 * @param props - Component props
 * @returns Children if authenticated, Navigate to login if not
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const status = useAuthStatus();

  // While loading, show nothing or a loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  // Matches backend's 401 Unauthorized response
  if (status === "unauthenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * OptionalProtectedRoute component.
 *
 * Renders children regardless of authentication status.
 * Useful for pages that work with or without authentication.
 *
 * Matches backend's get_current_user_optional pattern:
 * - Returns null if not authenticated
 * - Allows the page to handle optional authentication
 *
 * @example
 * <OptionalProtectedRoute>
 *   <HomePage /> {/* Can show different content based on auth status *\/}
 * </OptionalProtectedRoute>
 */
interface OptionalProtectedRouteProps {
  /** Children to render (will receive auth status) */
  children: React.ReactNode;
}

export function OptionalProtectedRoute({
  children,
}: OptionalProtectedRouteProps) {
  // Always render children - they can use useAuthStatus() to check auth
  return <>{children}</>;
}
