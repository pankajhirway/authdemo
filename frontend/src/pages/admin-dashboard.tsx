/**
 * Admin Dashboard page.
 *
 * Main dashboard for administrators to monitor system health and manage settings.
 * Features a clean two-section layout with system metrics and configuration panel.
 *
 * Features:
 * - View real-time system metrics and health status
 * - Modify system configuration settings
 * - Monitor events processed, active users, and projection lag
 * - Toggle maintenance mode and other system settings
 * - Responsive design for mobile and desktop
 *
 * Route: /admin
 * Access: Requires admin role only
 */

import { useCurrentUser } from "../store/auth";
import { SystemMetrics } from "../components/admin/SystemMetrics";
import { SettingsPanel } from "../components/admin/SettingsPanel";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RequireRole } from "../components/auth/RequireRole";

/**
 * Admin Dashboard page component.
 *
 * Provides the main interface for administrators to:
 * 1. Monitor system health and performance metrics
 * 2. Configure system settings and parameters
 *
 * The layout is responsive with two main sections:
 * - System Metrics: Real-time health, events, users, and lag indicators
 * - Settings Panel: Configuration options for system behavior
 *
 * All admin operations require the admin role (no role override for security).
 */
function AdminDashboardContent() {
  const user = useCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.username || "Administrator"}
              </p>
            </div>

            {/* User info badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info banner */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Admin Dashboard Guide</h3>
              <p className="text-sm text-red-800 mt-1">
                Monitor system health and performance metrics in real-time. Configure system
                settings including maintenance mode, order limits, and notification preferences.
                All changes are logged for audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Two-section layout */}
        <div className="space-y-6">
          {/* System Metrics Section */}
          <section
            className="bg-white rounded-lg border border-gray-200 p-6"
            aria-labelledby="metrics-heading"
          >
            <SystemMetrics />
          </section>

          {/* Settings Panel Section */}
          <section
            className="bg-white rounded-lg border border-gray-200 p-6"
            aria-labelledby="settings-heading"
          >
            <SettingsPanel />
          </section>
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View Audit Logs */}
          <a
            href="/auditor"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Audit Logs</h3>
              <p className="text-xs text-gray-500">View system audit trail</p>
            </div>
          </a>

          {/* View All Orders */}
          <a
            href="/orders"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">All Orders</h3>
              <p className="text-xs text-gray-500">View order history</p>
            </div>
          </a>

          {/* System Documentation */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">API Docs</h3>
              <p className="text-xs text-gray-500">View API documentation</p>
            </div>
          </a>
        </div>

        {/* Security notice */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Security Notice</h3>
              <p className="text-xs text-gray-600 mt-1">
                All admin actions are logged in the audit trail. System settings changes require
                admin role and are recorded for compliance. Ensure you have authorized access
                before making changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard page with role-based access control.
 *
 * Wraps the dashboard content with:
 * - ProtectedRoute: Requires authentication
 * - RequireRole: Requires admin role only (no override for security)
 *
 * This matches the backend pattern:
 * - require_role("admin") dependency on API routes
 * - Admin role is required for all admin operations
 */
export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <RequireRole roles={["admin"]}>
        <AdminDashboardContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

/**
 * Admin Dashboard page component (export for testing).
 */
export { AdminDashboardContent };
