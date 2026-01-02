/**
 * Login page with Keycloak redirect.
 *
 * Provides a user-friendly login interface that redirects to Keycloak for authentication.
 * After successful authentication, users are redirected to the callback page.
 *
 * Matches the backend's authentication initiation pattern:
 * - User clicks login button
 * - Redirected to Keycloak login page
 * - Keycloak handles authentication
 * - User redirected back to callback with auth code
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as keycloakLogin } from "../lib/keycloak";
import { useAuthStatus } from "../store/auth";

/**
 * Login page component.
 *
 * Displays a centered login card with:
 * - Application branding
 * - Login button that triggers Keycloak redirect
 * - Loading state during redirect
 * - Error handling for login failures
 */
export function LoginPage() {
  const navigate = useNavigate();
  const authStatus = useAuthStatus();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Redirect to the appropriate dashboard if already authenticated.
   * Matches the backend's pattern of redirecting authenticated users.
   */
  useEffect(() => {
    if (authStatus === "authenticated") {
      // Get user's role and redirect to appropriate dashboard
      const userRole = localStorage.getItem("user_role");
      const redirectPath = getDashboardForRole(userRole);
      navigate(redirectPath, { replace: true });
    }
  }, [authStatus, navigate]);

  /**
   * Handle login button click.
   * Initiates the Keycloak authentication flow.
   */
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);

    try {
      await keycloakLogin();
      // Keycloak will redirect to its login page
      // After successful auth, user will land on /callback
    } catch (err) {
      setIsLoggingIn(false);
      setError("Failed to initiate login. Please try again.");
      console.error("Login initiation error:", err);
    }
  };

  /**
   * Get the appropriate dashboard path for a user's role.
   * Matches the backend's role-based routing pattern.
   */
  function getDashboardForRole(role: string | null): string {
    if (!role) {
      return "/menu";
    }
    switch (role) {
      case "admin":
        return "/admin";
      case "auditor":
        return "/auditor";
      case "supervisor":
        return "/supervisor";
      case "operator":
        return "/operator";
      default:
        return "/menu";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome Back
            </h1>
            <p className="text-blue-100 mt-2">
              Sign in to access the ordering system
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-10">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Login Info */}
            <div className="mb-6 text-center">
              <p className="text-gray-600 text-sm">
                You'll be redirected to Keycloak to sign in securely.
              </p>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={`
                w-full flex items-center justify-center px-4 py-3
                border border-transparent text-base font-medium rounded-md
                text-white bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-colors duration-200
                ${isLoggingIn ? "opacity-75 cursor-not-allowed" : ""}
              `}
            >
              {isLoggingIn ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Redirecting to Keycloak...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In with Keycloak
                </>
              )}
            </button>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Your login session is secured with OAuth 2.0 and OpenID Connect
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              <p>Demo Ordering Interface</p>
              <p className="mt-1">
                Powered by{" "}
                <a
                  href="https://www.keycloak.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Keycloak
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
