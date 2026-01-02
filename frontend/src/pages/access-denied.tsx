/**
 * Access Denied page.
 *
 * Displayed when a user tries to access a resource without the required role.
 * Matches backend's 403 Forbidden response from require_role decorator.
 *
 * Features:
 * - Clear error message
 * - User's current role display
 * - Required role explanation
 * - Navigation options (back, home, dashboard)
 * - Professional UI with shadcn/ui design patterns
 */

import { Link, useNavigate } from "react-router-dom";
import { useCurrentUser, useCurrentRole } from "../store/auth";

/**
 * AccessDeniedPage component.
 *
 * Shows an access denied message when a user lacks the required role.
 * Provides helpful navigation options based on the user's actual role.
 */
export function AccessDeniedPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const userRole = useCurrentRole();

  // Determine the user's dashboard route based on their role
  const getDashboardRoute = (): string => {
    if (!userRole) return "/login";

    switch (userRole) {
      case "operator":
        return "/operator";
      case "supervisor":
        return "/supervisor";
      case "auditor":
        return "/auditor";
      case "admin":
        return "/admin";
      default:
        return "/menu";
    }
  };

  const dashboardRoute = getDashboardRoute();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Error icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this resource
          </p>
        </div>

        {/* User info card */}
        {user && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold shadow-sm">
                {user.name?.charAt(0).toUpperCase() || user.preferred_username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.name || user.preferred_username}
                </p>
                <p className="truncate text-xs text-gray-600">
                  Current role: <span className="font-semibold capitalize">{userRole}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Why am I seeing this?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This page requires a specific role to access. Your current account doesn't have the required role permissions.
                </p>
                {userRole && (
                  <p className="mt-1">
                    Contact your administrator if you believe you should have access to this resource.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>

          {userRole && (
            <Link
              to={dashboardRoute}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Dashboard
            </Link>
          )}

          <Link
            to="/menu"
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Browse Menu
          </Link>
        </div>

        {/* Help link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Need help? Contact{" "}
          <a
            href="mailto:support@example.com"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            support@example.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
