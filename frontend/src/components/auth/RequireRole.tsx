/**
 * RequireRole component for role-based access control.
 *
 * Wraps a route and ensures the user has the required role before rendering.
 * Redirects to an access denied page if the user lacks the required role.
 *
 * Matches the backend's require_role pattern from app/api/dependencies/auth.py:
 * - Role requirement: User must have the specified role
 * - Admin override: Admin users have access to all roles
 * - Raises 403 Forbidden if user lacks required role
 *
 * @example
 * <RequireRole role="supervisor">
 *   <SupervisorDashboard />
 * </RequireRole>
 *
 * @example
 * <RequireRole roles={["operator", "supervisor"]}>
 *   <SharedDashboard />
 * </RequireRole>
 */

import { Navigate } from "react-router-dom";
import type { UserRole } from "../../types/api";
import { useAuthStatus, useHasRole, useHasAnyRole } from "../../store/auth";

/**
 * Props for the RequireRole component.
 */
interface RequireRoleProps {
  /** Children to render if user has the required role */
  children: React.ReactNode;
  /** Single role required (alternative to roles) */
  role?: UserRole;
  /** Array of roles - user must have at least one (alternative to role) */
  roles?: UserRole[];
  /** Path to redirect to if access is denied (defaults to /access-denied) */
  redirectTo?: string;
}

/**
 * RequireRole component.
 *
 * Checks if the user has the required role(s) before rendering children.
 * Redirects to the access denied page if the user lacks the required role.
 *
 * Matches backend pattern:
 * - require_role(role) returns user if they have the role or are admin
 * - Raises 403 Forbidden if user lacks the required role
 * - Admin users have access to all roles (admin override)
 *
 * @param props - Component props
 * @returns Children if user has role, Navigate to access denied if not
 */
export function RequireRole({
  children,
  role,
  roles,
  redirectTo = "/access-denied",
}: RequireRoleProps) {
  const status = useAuthStatus();
  const hasRole = useHasRole();
  const hasAnyRole = useHasAnyRole();

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
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  let hasRequiredRole = false;

  if (role) {
    // Single role check
    // Matches backend: user.role != required_role and user.role != "admin"
    hasRequiredRole = hasRole(role);
  } else if (roles) {
    // Multiple roles check (user needs at least one)
    hasRequiredRole = hasAnyRole(roles);
  } else {
    // No role requirement specified, allow access
    hasRequiredRole = true;
  }

  // If user doesn't have the required role, redirect to access denied
  // Matches backend's 403 Forbidden response
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // User has the required role, render children
  return <>{children}</>;
}

/**
 * RequireAdmin component.
 *
 * Convenience component that requires admin role.
 *
 * @example
 * <RequireAdmin>
 *   <AdminDashboard />
 * </RequireAdmin>
 */
interface RequireAdminProps {
  /** Children to render if user is an admin */
  children: React.ReactNode;
  /** Path to redirect to if access is denied */
  redirectTo?: string;
}

export function RequireAdmin({
  children,
  redirectTo = "/access-denied",
}: RequireAdminProps) {
  return (
    <RequireRole role="admin" redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

/**
 * RequireOperator component.
 *
 * Convenience component that requires operator role.
 * Admin users also have access (admin override).
 */
interface RequireOperatorProps {
  /** Children to render if user is an operator */
  children: React.ReactNode;
  /** Path to redirect to if access is denied */
  redirectTo?: string;
}

export function RequireOperator({
  children,
  redirectTo = "/access-denied",
}: RequireOperatorProps) {
  return (
    <RequireRole role="operator" redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

/**
 * RequireSupervisor component.
 *
 * Convenience component that requires supervisor role.
 * Admin users also have access (admin override).
 */
interface RequireSupervisorProps {
  /** Children to render if user is a supervisor */
  children: React.ReactNode;
  /** Path to redirect to if access is denied */
  redirectTo?: string;
}

export function RequireSupervisor({
  children,
  redirectTo = "/access-denied",
}: RequireSupervisorProps) {
  return (
    <RequireRole role="supervisor" redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

/**
 * RequireAuditor component.
 *
 * Convenience component that requires auditor role.
 * Admin users also have access (admin override).
 */
interface RequireAuditorProps {
  /** Children to render if user is an auditor */
  children: React.ReactNode;
  /** Path to redirect to if access is denied */
  redirectTo?: string;
}

export function RequireAuditor({
  children,
  redirectTo = "/access-denied",
}: RequireAuditorProps) {
  return (
    <RequireRole role="auditor" redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}
