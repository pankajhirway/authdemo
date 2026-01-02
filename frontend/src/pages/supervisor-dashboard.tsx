/**
 * Supervisor Dashboard page.
 *
 * Main dashboard for supervisors to review and approve/reject submitted data entries.
 * Features a clean layout with pending approvals list and filtering options.
 *
 * Features:
 * - View all submitted entries requiring approval
 * - Approve or reject entries with reason tracking
 * - Status filtering (pending, approved, rejected)
 * - Real-time updates after approval actions
 * - Responsive design for mobile and desktop
 *
 * Route: /supervisor
 * Access: Requires supervisor role or higher
 */

import { useCallback, useState } from "react";
import { useCurrentUser } from "../store/auth";
import { PendingApprovalsList } from "../components/supervisor/PendingApprovalsList";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RequireRole } from "../components/auth/RequireRole";

/**
 * Supervisor Dashboard page component.
 *
 * Provides the main interface for supervisors to:
 * 1. View submitted entries requiring approval
 * 2. Review entry details
 * 3. Approve or reject entries
 *
 * The layout is responsive and optimized for reviewing entries efficiently.
 * Pending entries are highlighted and action buttons are prominently displayed.
 */
function SupervisorDashboardContent() {
  const user = useCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle successful approval/rejection action.
   * Increments the refresh key to trigger a list refresh.
   */
  const handleActionComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.username || "Supervisor"}
              </p>
            </div>

            {/* User info badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || "S"}
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
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5"
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
              <h3 className="text-sm font-medium text-purple-900">
                Supervisor Dashboard Guide
              </h3>
              <p className="text-sm text-purple-800 mt-1">
                Review submitted entries from operators. Expand each entry to view details and
                approve or reject them. Approved entries will proceed to the next stage.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <PendingApprovalsList
          refreshKey={refreshKey}
          onActionComplete={handleActionComplete}
        />
      </div>
    </div>
  );
}

/**
 * Supervisor Dashboard page with role-based access control.
 *
 * Wraps the dashboard content with:
 * - ProtectedRoute: Requires authentication
 * - RequireRole: Requires supervisor role or higher (admin override)
 *
 * This matches the backend pattern:
 * - require_role("supervisor") dependency on API routes
 * - Admin users have access to all roles
 */
export default function SupervisorDashboard() {
  return (
    <ProtectedRoute>
      <RequireRole allowedRoles={["supervisor"]}>
        <SupervisorDashboardContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

/**
 * Supervisor Dashboard page component (export for testing).
 */
export { SupervisorDashboardContent };
