/**
 * Callback page for handling Keycloak OAuth redirect.
 *
 * This page handles the OAuth callback from Keycloak after authentication.
 * It:
 * 1. Processes the authentication code/token from the URL
 * 2. Updates the auth store with user information
 * 3. Redirects to the appropriate dashboard based on user role
 *
 * Matches the backend's token verification pattern:
 * - Receives OAuth callback from Keycloak
 * - Extracts and validates the token
 * - Updates application state with user info
 * - Redirects to authorized area
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getKeycloakService } from "../lib/keycloak";
import { useAuthActions, useAuthStore } from "../store/auth";

/**
 * Callback page component.
 *
 * This page should never be visible to users as it immediately processes
 * the callback and redirects. It shows a loading state while processing.
 */
export function CallbackPage() {
  const navigate = useNavigate();
  const { setUser, setToken, setStatus } = useAuthActions();
  const user = useAuthStore((state) => state.user);

  const [status, setStatusMessage] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // If we already have a user, redirect immediately
    if (user) {
      const redirectPath = getDashboardForRole(user.role);
      navigate(redirectPath, { replace: true });
      return;
    }

    /**
     * Process the Keycloak callback.
     * Keycloak-js handles the token extraction automatically.
     * We just need to initialize and extract the user info.
     */
    const processCallback = async () => {
      try {
        const keycloak = getKeycloakService();

        // Ensure Keycloak is initialized and has processed the response
        await keycloak.init();

        // Check if Keycloak has authenticated the user
        if (keycloak.isAuthenticated()) {
          // Get the token and user info
          const token = await keycloak.getToken();
          const userInfo = keycloak.getUserInfo();

          if (token && userInfo) {
            // Update the auth store
            setToken(token);
            setUser(userInfo);
            setStatus("authenticated");

            // Store role for redirect logic
            localStorage.setItem("user_role", userInfo.role);

            setStatusMessage("success");

            // Redirect to appropriate dashboard
            const redirectPath = getDashboardForRole(userInfo.role);
            navigate(redirectPath, { replace: true });
          } else {
            throw new Error("Failed to extract user information from token");
          }
        } else {
          // Not authenticated, redirect to login
          setStatusMessage("error");
          setErrorMessage("Authentication failed to complete. Please try again.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error("Callback processing error:", error);
        setStatusMessage("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An error occurred during authentication"
        );

        // Redirect to login after showing error
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [navigate, setUser, setToken, setStatus, user]);

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
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Processing State */}
          {status === "processing" && (
            <>
              <div className="mx-auto w-16 h-16 mb-4">
                <svg
                  className="animate-spin w-full h-full text-indigo-600"
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
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Sign In
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your authentication...
              </p>
            </>
          )}

          {/* Success State */}
          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 mb-4 text-green-600">
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Signed In Successfully
              </h2>
              <p className="text-gray-600">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {/* Error State */}
          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 mb-4 text-red-600">
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              {errorMessage && (
                <p className="text-red-600 text-sm mb-4">{errorMessage}</p>
              )}
              <p className="text-gray-600 text-sm">
                Redirecting back to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallbackPage;
