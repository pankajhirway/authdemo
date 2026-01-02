/**
 * Auditor Dashboard page.
 *
 * Main dashboard for auditors to view all data entries and audit logs.
 * Features a tabbed layout with all orders and audit logs views.
 *
 * Features:
 * - View all data entries in the system (read-only)
 * - View complete audit trail
 * - Tab-based navigation between views
 * - Real-time updates after refresh
 * - Responsive design for mobile and desktop
 *
 * Route: /auditor
 * Access: Requires auditor role or higher
 */

import { useState, useCallback } from "react";
import { useCurrentUser } from "../store/auth";
import { AllOrdersList } from "../components/auditor/AllOrdersList";
import { AuditLogViewer } from "../components/auditor/AuditLogViewer";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RequireAuditor } from "../components/auth/RequireRole";

/**
 * Tab type for the auditor dashboard.
 */
type AuditorTab = "orders" | "audit";

/**
 * Auditor Dashboard page component.
 *
 * Provides the main interface for auditors to:
 * 1. View all data entries in the system
 * 2. View the complete audit trail
 *
 * The layout is responsive and optimized for read-only viewing.
 * Tab-based navigation allows switching between orders and audit logs.
 */
function AuditorDashboardContent() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AuditorTab>("orders");
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle successful refresh action.
   * Increments the refresh key to trigger a list refresh.
   */
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auditor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.username || "Auditor"}
              </p>
            </div>

            {/* User info badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5"
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
              <h3 className="text-sm font-medium text-orange-900">
                Auditor Dashboard Guide
              </h3>
              <p className="text-sm text-orange-800 mt-1">
                View all data entries and audit logs in the system. Use the tabs below to switch
                between viewing all orders and the complete audit trail. All views are read-only.
              </p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                  activeTab === "orders"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                All Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                  activeTab === "audit"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                Audit Logs
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "orders" && (
            <AllOrdersList
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === "audit" && (
            <AuditLogViewer
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function for className conditional merging.
 * Copied from lib/utils to avoid import issues in the pages directory.
 */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Auditor Dashboard page with role-based access control.
 *
 * Wraps the dashboard content with:
 * - ProtectedRoute: Requires authentication
 * - RequireAuditor: Requires auditor role or higher (admin override)
 *
 * This matches the backend pattern:
 * - require_role("auditor") dependency on API routes
 * - Admin users have access to all roles
 */
export default function AuditorDashboard() {
  return (
    <ProtectedRoute>
      <RequireAuditor>
        <AuditorDashboardContent />
      </RequireAuditor>
    </ProtectedRoute>
  );
}

/**
 * Auditor Dashboard page component (export for testing).
 */
export { AuditorDashboardContent };
