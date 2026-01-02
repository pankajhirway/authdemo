/**
 * Operator Dashboard page.
 *
 * Main dashboard for operators to create and manage their data entries.
 * Features a two-column layout with order creation form and order history list.
 *
 * Features:
 * - Create new data entries/orders
 * - View and manage existing orders
 * - Status filtering for orders
 * - Real-time updates after order creation
 * - Responsive design for mobile and desktop
 *
 * Route: /operator
 * Access: Requires operator role or higher
 */

import { useState, useCallback } from "react";
import { useCurrentUser } from "../store/auth";
import { OrderForm } from "../components/operator/OrderForm";
import { MyOrdersList } from "../components/operator/MyOrdersList";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RequireRole } from "../components/auth/RequireRole";

/**
 * Operator Dashboard page component.
 *
 * Provides the main interface for operators to:
 * 1. Create new data entries using the order form
 * 2. View and manage their existing orders in the list
 *
 * The layout is responsive:
 * - Desktop: Two-column layout with form on left, list on right
 * - Mobile: Stacked layout with form on top, list below
 *
 * The page automatically refreshes the orders list when a new order is created.
 */
function OperatorDashboardContent() {
  const user = useCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handle successful order creation.
   * Increments the refresh key to trigger a list refresh.
   */
  const handleOrderCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.username || "Operator"}
              </p>
            </div>

            {/* User info badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || "O"}
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
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
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
              <h3 className="text-sm font-medium text-blue-900">
                Operator Dashboard Guide
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                Use the form to create new data entries. Your orders will appear in the list
                on the right. You can update draft orders and submit them for review.
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column - Order Form */}
          <div className="lg:sticky lg:top-6">
            <OrderForm onSuccess={handleOrderCreated} />
          </div>

          {/* Right column - My Orders List */}
          <div>
            <MyOrdersList
              refreshKey={refreshKey}
              onRefresh={handleOrderCreated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Operator Dashboard page with role-based access control.
 *
 * Wraps the dashboard content with:
 * - ProtectedRoute: Requires authentication
 * - RequireRole: Requires operator role or higher (admin override)
 *
 * This matches the backend pattern:
 * - require_role("operator") dependency on API routes
 * - Admin users have access to all roles
 */
export default function OperatorDashboard() {
  return (
    <ProtectedRoute>
      <RequireRole allowedRoles={["operator"]}>
        <OperatorDashboardContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

/**
 * Operator Dashboard page component (export for testing).
 */
export { OperatorDashboardContent };
